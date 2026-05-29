const crypto = require("node:crypto");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");
const { URL } = require("node:url");

const rootDir = __dirname;
const dataDir = process.env.VERCEL ? path.join("/tmp", "insession-data") : path.join(rootDir, "data");
const seedPath = path.join(dataDir, "seed.json");
const storePath = path.join(dataDir, "store.json");
const sourceSeedPath = path.join(rootDir, "data", "seed.json");
const port = Number(process.env.PORT || 4173);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

const rateLimits = new Map();

async function ensureStore() {
  await fsp.mkdir(dataDir, { recursive: true });
  if (!fs.existsSync(seedPath)) {
    await fsp.copyFile(sourceSeedPath, seedPath);
  }
  if (!fs.existsSync(storePath)) {
    await fsp.copyFile(seedPath, storePath);
  }
}

async function readStore() {
  await ensureStore();
  return JSON.parse(await fsp.readFile(storePath, "utf8"));
}

async function writeStore(store) {
  await fsp.writeFile(storePath, `${JSON.stringify(store, null, 2)}\n`);
}

function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store",
  });
  res.end(payload);
}

function sendError(res, status, message, details) {
  sendJson(res, status, { error: { message, details } });
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Payload is too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch {
        reject(new Error("Request body must be valid JSON."));
      }
    });
  });
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  return type === "Bearer" ? token : "";
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    saved: user.saved || [],
    cart: user.cart || [],
    createdAt: user.createdAt,
  };
}

function getCurrentUser(req, store) {
  const token = getBearerToken(req);
  if (!token) return null;
  return store.users.find((user) => user.token === token) || null;
}

function applyCatalogFilters(courses, query) {
  const term = String(query.get("q") || "").trim().toLowerCase();
  const category = query.get("category") || "All";
  const level = query.get("level") || "All";
  const sort = query.get("sort") || "featured";
  const maxPrice = Number(query.get("maxPrice") || 9999);

  const filtered = courses.filter((course) => {
    const haystack = [course.title, course.instructor, course.category, course.level, course.summary, ...(course.skills || [])]
      .join(" ")
      .toLowerCase();
    return (
      course.price <= maxPrice &&
      (category === "All" || course.category === category) &&
      (level === "All" || course.level === level) &&
      (!term || haystack.includes(term))
    );
  });

  filtered.sort((a, b) => {
    if (sort === "rating") return b.rating - a.rating;
    if (sort === "price-low") return a.price - b.price;
    if (sort === "price-high") return b.price - a.price;
    if (sort === "duration") return a.duration - b.duration;
    return b.reviews + b.rating * 100 - (a.reviews + a.rating * 100);
  });

  return filtered;
}

function calculateOrder(courseIds, courses) {
  const uniqueIds = [...new Set(courseIds || [])];
  const items = uniqueIds.map((id) => courses.find((course) => course.id === id)).filter(Boolean);
  const subtotal = items.reduce((sum, course) => sum + course.price, 0);
  const platformFee = items.length ? Math.round(subtotal * 0.03) : 0;
  const total = subtotal + platformFee;
  return { items, subtotal, platformFee, total };
}

function checkRateLimit(req, res) {
  const ip = req.socket.remoteAddress || "local";
  const minute = Math.floor(Date.now() / 60000);
  const key = `${ip}:${minute}`;
  const count = (rateLimits.get(key) || 0) + 1;
  rateLimits.set(key, count);
  if (rateLimits.size > 1000) {
    for (const storedKey of rateLimits.keys()) {
      if (!storedKey.endsWith(`:${minute}`)) rateLimits.delete(storedKey);
    }
  }
  if (count > 240) {
    sendError(res, 429, "Too many requests. Try again in a minute.");
    return false;
  }
  return true;
}

async function handleApi(req, res, url) {
  const store = await readStore();

  if (req.method === "GET" && url.pathname === "/api/health") {
    sendJson(res, 200, { ok: true, app: "InSession", version: "1.0.0" });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/catalog") {
    const courses = applyCatalogFilters(store.courses, url.searchParams);
    const categories = [...new Set(store.courses.map((course) => course.category))].sort();
    const levels = [...new Set(store.courses.map((course) => course.level))].sort();
    sendJson(res, 200, {
      courses,
      facets: { categories, levels, maxPrice: Math.max(...store.courses.map((course) => course.price)) },
    });
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/api/courses/")) {
    const course = store.courses.find((item) => item.id === decodeURIComponent(url.pathname.split("/").pop()));
    if (!course) {
      sendError(res, 404, "Course not found.");
      return;
    }
    sendJson(res, 200, { course });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/auth/start") {
    const body = await readBody(req);
    const email = normalizeEmail(body.email);
    const name = String(body.name || "").trim() || email.split("@")[0];
    if (!isEmail(email)) {
      sendError(res, 400, "Enter a valid email address.");
      return;
    }
    let user = store.users.find((item) => item.email === email);
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        email,
        name,
        saved: [],
        cart: [],
        token: crypto.randomBytes(24).toString("hex"),
        createdAt: new Date().toISOString(),
      };
      store.users.push(user);
    } else {
      user.name = name;
      user.token = crypto.randomBytes(24).toString("hex");
      user.lastLoginAt = new Date().toISOString();
    }
    await writeStore(store);
    sendJson(res, 200, { token: user.token, user: publicUser(user) });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/me") {
    const user = getCurrentUser(req, store);
    if (!user) {
      sendError(res, 401, "Sign in to continue.");
      return;
    }
    const orders = store.orders.filter((order) => order.userId === user.id);
    sendJson(res, 200, { user: publicUser(user), orders });
    return;
  }

  if (req.method === "PUT" && url.pathname === "/api/me/saved") {
    const user = getCurrentUser(req, store);
    if (!user) {
      sendError(res, 401, "Sign in to save courses.");
      return;
    }
    const body = await readBody(req);
    user.saved = [...new Set(body.courseIds || [])].filter((id) => store.courses.some((course) => course.id === id));
    await writeStore(store);
    sendJson(res, 200, { user: publicUser(user) });
    return;
  }

  if (req.method === "PUT" && url.pathname === "/api/cart") {
    const user = getCurrentUser(req, store);
    if (!user) {
      sendError(res, 401, "Sign in to sync your cart.");
      return;
    }
    const body = await readBody(req);
    user.cart = [...new Set(body.courseIds || [])].filter((id) => store.courses.some((course) => course.id === id));
    await writeStore(store);
    sendJson(res, 200, { user: publicUser(user) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/orders") {
    const body = await readBody(req);
    const email = normalizeEmail(body.email);
    const name = String(body.name || "").trim() || email.split("@")[0];
    const courseIds = Array.isArray(body.courseIds) ? body.courseIds : [];
    if (!isEmail(email)) {
      sendError(res, 400, "Enter a valid checkout email.");
      return;
    }
    const totals = calculateOrder(courseIds, store.courses);
    if (!totals.items.length) {
      sendError(res, 400, "Add at least one course before enrolling.");
      return;
    }
    let user = getCurrentUser(req, store) || store.users.find((item) => item.email === email);
    if (!user) {
      user = {
        id: crypto.randomUUID(),
        email,
        name,
        saved: [],
        cart: [],
        token: crypto.randomBytes(24).toString("hex"),
        createdAt: new Date().toISOString(),
      };
      store.users.push(user);
    }
    user.name = name;
    user.cart = [];
    const order = {
      id: `ORD-${crypto.randomBytes(4).toString("hex").toUpperCase()}`,
      userId: user.id,
      email,
      name,
      status: "confirmed",
      courseIds: totals.items.map((course) => course.id),
      items: totals.items.map((course) => ({ id: course.id, title: course.title, price: course.price })),
      subtotal: totals.subtotal,
      platformFee: totals.platformFee,
      total: totals.total,
      createdAt: new Date().toISOString(),
    };
    store.orders.unshift(order);
    await writeStore(store);
    sendJson(res, 201, { order, token: user.token, user: publicUser(user) });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/admin/metrics") {
    const revenue = store.orders.reduce((sum, order) => sum + order.total, 0);
    const enrollments = store.orders.reduce((sum, order) => sum + order.courseIds.length, 0);
    const topCourses = store.courses
      .map((course) => ({
        id: course.id,
        title: course.title,
        enrollments: store.orders.filter((order) => order.courseIds.includes(course.id)).length,
      }))
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 5);
    sendJson(res, 200, {
      metrics: {
        courses: store.courses.length,
        users: store.users.length,
        orders: store.orders.length,
        enrollments,
        revenue,
        topCourses,
      },
    });
    return;
  }

  sendError(res, 404, "API route not found.");
}

async function serveStatic(req, res, url) {
  const requestedPath = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.normalize(path.join(rootDir, requestedPath));
  if (!filePath.startsWith(rootDir)) {
    sendError(res, 403, "Forbidden.");
    return;
  }
  try {
    const stat = await fsp.stat(filePath);
    if (!stat.isFile()) throw new Error("Not a file.");
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream",
      "Cache-Control": ext === ".html" ? "no-store" : "public, max-age=3600",
    });
    fs.createReadStream(filePath).pipe(res);
  } catch {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    fs.createReadStream(path.join(rootDir, "index.html")).pipe(res);
  }
}

async function handleRequest(req, res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  if (!checkRateLimit(req, res)) return;

  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
    } else {
      await serveStatic(req, res, url);
    }
  } catch (error) {
    sendError(res, 500, error.message || "Unexpected server error.");
  }
}

if (require.main === module) {
  const server = http.createServer(handleRequest);
  ensureStore().then(() => {
    server.listen(port, () => {
      console.log(`InSession marketplace running at http://localhost:${port}`);
    });
  });
}

module.exports = { handleRequest };
