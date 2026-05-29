const api = {
  token: localStorage.getItem("insession-token") || "",
  async request(path, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (api.token) headers.Authorization = `Bearer ${api.token}`;
    const response = await fetch(path, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error?.message || "Request failed.");
    }
    return data;
  },
};

const state = {
  courses: [],
  courseById: {},
  facets: { categories: [], levels: [], maxPrice: 300 },
  query: "",
  category: "All",
  level: "All",
  sort: "featured",
  maxPrice: 300,
  cart: JSON.parse(localStorage.getItem("insession-cart") || "[]"),
  saved: JSON.parse(localStorage.getItem("insession-saved") || "[]"),
  user: JSON.parse(localStorage.getItem("insession-user") || "null"),
  orders: [],
  metrics: null,
  loading: true,
};

const selectors = {
  accountForm: document.querySelector("#accountForm"),
  accountName: document.querySelector("#accountName"),
  accountEmail: document.querySelector("#accountEmail"),
  accountStatus: document.querySelector("#accountStatus"),
  adminMetrics: document.querySelector("#adminMetrics"),
  categoryFilter: document.querySelector("#categoryFilter"),
  checkoutForm: document.querySelector("#checkoutForm"),
  checkoutStatus: document.querySelector("#checkoutStatus"),
  closeCart: document.querySelector("#closeCart"),
  courseDetail: document.querySelector("#courseDetail"),
  courseDialog: document.querySelector("#courseDialog"),
  courseGrid: document.querySelector("#courseGrid"),
  cartCount: document.querySelector("#cartCount"),
  cartDrawer: document.querySelector("#cartDrawer"),
  cartItems: document.querySelector("#cartItems"),
  cartToggle: document.querySelector("#cartToggle"),
  cartTotal: document.querySelector("#cartTotal"),
  emailInput: document.querySelector("#emailInput"),
  levelFilter: document.querySelector("#levelFilter"),
  orderHistory: document.querySelector("#orderHistory"),
  priceRange: document.querySelector("#priceRange"),
  priceValue: document.querySelector("#priceValue"),
  resetFilters: document.querySelector("#resetFilters"),
  resultCount: document.querySelector("#resultCount"),
  savedCount: document.querySelector("#savedCount"),
  scrim: document.querySelector("#scrim"),
  searchInput: document.querySelector("#searchInput"),
  sortFilter: document.querySelector("#sortFilter"),
  userBadge: document.querySelector("#userBadge"),
};

function money(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function persistLocal() {
  localStorage.setItem("insession-cart", JSON.stringify(state.cart));
  localStorage.setItem("insession-saved", JSON.stringify(state.saved));
  if (state.user) localStorage.setItem("insession-user", JSON.stringify(state.user));
}

async function syncCart() {
  persistLocal();
  if (!state.user || !api.token) return;
  await api.request("/api/cart", {
    method: "PUT",
    body: JSON.stringify({ courseIds: state.cart }),
  });
}

async function syncSaved() {
  persistLocal();
  if (!state.user || !api.token) return;
  const data = await api.request("/api/me/saved", {
    method: "PUT",
    body: JSON.stringify({ courseIds: state.saved }),
  });
  state.user = data.user;
  state.saved = data.user.saved || [];
  persistLocal();
}

function catalogParams() {
  const params = new URLSearchParams({
    q: state.query,
    category: state.category,
    level: state.level,
    sort: state.sort,
    maxPrice: String(state.maxPrice),
  });
  return params.toString();
}

async function loadCatalog() {
  state.loading = true;
  renderCourses();
  const data = await api.request(`/api/catalog?${catalogParams()}`);
  state.courses = data.courses;
  state.courses.forEach((course) => {
    state.courseById[course.id] = course;
  });
  state.facets = data.facets;
  state.loading = false;
  populateFilters();
  renderCourses();
  renderCart();
}

async function loadAccount() {
  if (!api.token) {
    renderAccount();
    return;
  }
  try {
    const data = await api.request("/api/me");
    state.user = data.user;
    state.orders = data.orders || [];
    state.saved = data.user.saved || state.saved;
    state.cart = data.user.cart?.length ? data.user.cart : state.cart;
    persistLocal();
  } catch {
    api.token = "";
    localStorage.removeItem("insession-token");
  }
  renderAccount();
  renderCart();
  renderCourses();
}

async function loadMetrics() {
  const data = await api.request("/api/admin/metrics");
  state.metrics = data.metrics;
  renderMetrics();
}

function populateFilters() {
  const categories = ["All", ...state.facets.categories];
  const levels = ["All", ...state.facets.levels];
  selectors.categoryFilter.innerHTML = categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join("");
  selectors.levelFilter.innerHTML = levels.map((level) => `<option value="${escapeHtml(level)}">${escapeHtml(level)}</option>`).join("");
  selectors.categoryFilter.value = state.category;
  selectors.levelFilter.value = state.level;
  selectors.priceRange.max = String(Math.max(300, state.facets.maxPrice || 300));
}

function renderCourses() {
  selectors.priceValue.textContent = money(state.maxPrice);
  selectors.resultCount.textContent = state.loading ? "Loading" : `${state.courses.length} ${state.courses.length === 1 ? "course" : "courses"}`;
  selectors.savedCount.textContent = `${state.saved.length} ${state.saved.length === 1 ? "course" : "courses"}`;

  if (state.loading) {
    selectors.courseGrid.innerHTML = '<div class="empty">Loading courses from the marketplace.</div>';
    return;
  }

  if (!state.courses.length) {
    selectors.courseGrid.innerHTML = '<div class="empty">No courses match those filters. Try a broader search or reset the filters.</div>';
    return;
  }

  selectors.courseGrid.innerHTML = state.courses
    .map((course) => {
      const inCart = state.cart.includes(course.id);
      const isSaved = state.saved.includes(course.id);
      return `
        <article class="course-card">
          <img class="course-image" src="${escapeHtml(course.image)}" alt="${escapeHtml(course.title)} course preview" loading="lazy">
          <div class="course-body">
            <div class="meta-row">
              <span class="pill">${escapeHtml(course.category)}</span>
              <span class="pill level">${escapeHtml(course.level)}</span>
              ${course.pathId === "ai-native-builder" ? '<span class="pill path-pill">AI Builder Path</span>' : ""}
              <span class="pill seats">${course.seats} seats</span>
            </div>
            <h3>${escapeHtml(course.title)}</h3>
            <p>${escapeHtml(course.summary)}</p>
            <div class="rating-row" aria-label="${course.rating} out of 5 rating">
              <strong>${course.rating}</strong>
              <span>${course.reviews.toLocaleString()} reviews</span>
              <span>${course.duration}h</span>
            </div>
            <div class="course-footer">
              <span class="price">${money(course.price)}</span>
              <div class="card-actions">
                <button class="small-button alt" type="button" data-action="detail" data-id="${course.id}">Details</button>
                <button class="small-button alt" type="button" data-action="save" data-id="${course.id}">${isSaved ? "Saved" : "Save"}</button>
                <button class="small-button" type="button" data-action="cart" data-id="${course.id}">${inCart ? "In cart" : "Add"}</button>
              </div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderCart() {
  const cartCourses = state.cart.map((id) => findCourse(id)).filter(Boolean);
  const subtotal = cartCourses.reduce((sum, course) => sum + course.price, 0);
  const platformFee = cartCourses.length ? Math.round(subtotal * 0.03) : 0;
  selectors.cartCount.textContent = String(cartCourses.length);
  selectors.cartTotal.textContent = money(subtotal + platformFee);
  selectors.savedCount.textContent = `${state.saved.length} ${state.saved.length === 1 ? "course" : "courses"}`;

  if (!cartCourses.length) {
    selectors.cartItems.innerHTML = '<div class="empty">Your cart is empty. Add a course to build an enrollment plan.</div>';
    return;
  }

  selectors.cartItems.innerHTML = `
    ${cartCourses
      .map(
        (course) => `
          <article class="cart-item">
            <h3>${escapeHtml(course.title)}</h3>
            <div class="cart-item-row">
              <span>${escapeHtml(course.instructor)}</span>
              <strong>${money(course.price)}</strong>
            </div>
            <button class="small-button warn" type="button" data-action="remove" data-id="${course.id}">Remove</button>
          </article>
        `,
      )
      .join("")}
    <div class="cart-breakdown">
      <div><span>Subtotal</span><strong>${money(subtotal)}</strong></div>
      <div><span>Platform fee</span><strong>${money(platformFee)}</strong></div>
    </div>
  `;
}

function renderAccount() {
  selectors.userBadge.textContent = state.user ? state.user.name : "Guest";
  if (state.user) {
    selectors.accountName.value = state.user.name || "";
    selectors.accountEmail.value = state.user.email || "";
    selectors.emailInput.value = state.user.email || "";
    selectors.accountStatus.textContent = `Signed in as ${state.user.email}`;
  } else {
    selectors.accountStatus.textContent = "Sign in to sync saved courses, cart, and order history.";
  }

  if (!state.orders.length) {
    selectors.orderHistory.innerHTML = '<div class="empty compact">No enrollments yet.</div>';
    return;
  }

  selectors.orderHistory.innerHTML = state.orders
    .map(
      (order) => `
        <article class="order-card">
          <div>
            <strong>${order.id}</strong>
            <span>${new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
          <p>${order.items.map((item) => escapeHtml(item.title)).join(", ")}</p>
          <strong>${money(order.total)}</strong>
        </article>
      `,
    )
    .join("");
}

function renderMetrics() {
  if (!state.metrics) return;
  selectors.adminMetrics.innerHTML = `
    <article><strong>${state.metrics.users}</strong><span>Learners</span></article>
    <article><strong>${state.metrics.orders}</strong><span>Orders</span></article>
    <article><strong>${state.metrics.enrollments}</strong><span>Enrollments</span></article>
    <article><strong>${money(state.metrics.revenue)}</strong><span>Revenue</span></article>
  `;
}

function findCourse(courseId) {
  return state.courseById[courseId] || state.courses.find((item) => item.id === courseId);
}

function toggleCart(open) {
  selectors.cartDrawer.classList.toggle("open", open);
  selectors.cartDrawer.setAttribute("aria-hidden", String(!open));
  selectors.scrim.hidden = !open;
}

async function openDetail(courseId) {
  const data = await api.request(`/api/courses/${encodeURIComponent(courseId)}`);
  const course = data.course;
  state.courseById[course.id] = course;
  const modules = course.modules || [];
  const outcomes = course.outcomes || [];
  selectors.courseDetail.innerHTML = `
    <img class="detail-hero" src="${escapeHtml(course.image)}" alt="${escapeHtml(course.title)} detail image">
    <div class="detail-content">
      <div>
        <p class="eyebrow">${escapeHtml(course.category)} / ${escapeHtml(course.level)} / ${course.duration} hours</p>
        <h2>${escapeHtml(course.title)}</h2>
      </div>
      <p>${escapeHtml(course.summary)}</p>
      <div class="meta-row">
        ${course.skills.map((skill) => `<span class="pill">${escapeHtml(skill)}</span>`).join("")}
      </div>
      ${
        outcomes.length
          ? `<section class="detail-section"><h3>What you will be able to do</h3><ul class="outcome-list">${outcomes
              .map((outcome) => `<li>${escapeHtml(outcome)}</li>`)
              .join("")}</ul></section>`
          : ""
      }
      <ul class="lesson-list">
        ${course.lessons.map((lesson, index) => `<li><span>${index + 1}. ${escapeHtml(lesson)}</span><strong>${index === 0 ? "Preview" : "Lesson"}</strong></li>`).join("")}
      </ul>
      ${
        modules.length
          ? `<section class="detail-section"><h3>Full course outline</h3><div class="module-list">${modules
              .map(
                (module, index) => `
                  <article>
                    <strong>Module ${index + 1}: ${escapeHtml(module.title)}</strong>
                    <ul>${module.lessons.map((lesson) => `<li>${escapeHtml(lesson)}</li>`).join("")}</ul>
                  </article>
                `,
              )
              .join("")}</div></section>`
          : ""
      }
      ${course.project ? `<section class="detail-section project-box"><h3>Capstone project</h3><p>${escapeHtml(course.project)}</p></section>` : ""}
      <div class="course-footer">
        <span class="price">${money(course.price)}</span>
        <div class="card-actions">
          <button class="small-button alt" type="button" data-action="close-detail">Close</button>
          <button class="small-button" type="button" data-action="cart" data-id="${course.id}">${state.cart.includes(course.id) ? "In cart" : "Add to cart"}</button>
        </div>
      </div>
    </div>
  `;
  selectors.courseDialog.showModal();
}

async function handleCourseAction(action, courseId) {
  if (action === "detail") {
    await openDetail(courseId);
    return;
  }

  if (action === "cart" && !state.cart.includes(courseId)) {
    state.cart.push(courseId);
    selectors.checkoutStatus.textContent = "";
    renderCart();
    renderCourses();
    await syncCart();
  }

  if (action === "save") {
    state.saved = state.saved.includes(courseId) ? state.saved.filter((id) => id !== courseId) : [...state.saved, courseId];
    renderCourses();
    renderCart();
    await syncSaved();
  }

  if (action === "remove") {
    state.cart = state.cart.filter((id) => id !== courseId);
    selectors.checkoutStatus.textContent = "";
    renderCart();
    renderCourses();
    await syncCart();
  }
}

function debounce(callback, wait = 250) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => callback(...args), wait);
  };
}

const refreshCatalog = debounce(() => {
  loadCatalog().catch(showError);
});

function showError(error) {
  selectors.checkoutStatus.textContent = error.message;
  selectors.accountStatus.textContent = error.message;
}

function bindEvents() {
  selectors.searchInput.addEventListener("input", (event) => {
    state.query = event.target.value;
    refreshCatalog();
  });

  selectors.categoryFilter.addEventListener("change", (event) => {
    state.category = event.target.value;
    loadCatalog().catch(showError);
  });

  selectors.levelFilter.addEventListener("change", (event) => {
    state.level = event.target.value;
    loadCatalog().catch(showError);
  });

  selectors.sortFilter.addEventListener("change", (event) => {
    state.sort = event.target.value;
    loadCatalog().catch(showError);
  });

  selectors.priceRange.addEventListener("input", (event) => {
    state.maxPrice = Number(event.target.value);
    selectors.priceValue.textContent = money(state.maxPrice);
    refreshCatalog();
  });

  selectors.resetFilters.addEventListener("click", () => {
    state.query = "";
    state.category = "All";
    state.level = "All";
    state.sort = "featured";
    state.maxPrice = 300;
    selectors.searchInput.value = "";
    selectors.sortFilter.value = "featured";
    selectors.priceRange.value = "300";
    loadCatalog().catch(showError);
  });

  document.addEventListener("click", (event) => {
    const actionTarget = event.target.closest("[data-action]");
    if (!actionTarget) return;
    const { action, id } = actionTarget.dataset;
    if (action === "close-detail") selectors.courseDialog.close();
    else handleCourseAction(action, id).catch(showError);
  });

  selectors.cartToggle.addEventListener("click", () => toggleCart(true));
  selectors.closeCart.addEventListener("click", () => toggleCart(false));
  selectors.scrim.addEventListener("click", () => toggleCart(false));

  selectors.accountForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = await api.request("/api/auth/start", {
      method: "POST",
      body: JSON.stringify({ name: form.get("name"), email: form.get("email") }),
    });
    api.token = data.token;
    localStorage.setItem("insession-token", data.token);
    state.user = data.user;
    state.saved = [...new Set([...state.saved, ...(data.user.saved || [])])];
    state.cart = [...new Set([...state.cart, ...(data.user.cart || [])])];
    await syncSaved();
    await syncCart();
    await loadAccount();
    await loadMetrics();
  });

  selectors.checkoutForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!state.cart.length) {
      selectors.checkoutStatus.textContent = "Add at least one course before enrolling.";
      return;
    }
    const form = new FormData(event.currentTarget);
    const data = await api.request("/api/orders", {
      method: "POST",
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        courseIds: state.cart,
      }),
    });
    api.token = data.token;
    localStorage.setItem("insession-token", data.token);
    state.user = data.user;
    state.cart = [];
    selectors.checkoutStatus.textContent = `Enrollment confirmed: ${data.order.id}`;
    persistLocal();
    await loadAccount();
    await loadCatalog();
    await loadMetrics();
  });
}

async function init() {
  bindEvents();
  renderAccount();
  await loadCatalog();
  await loadAccount();
  await loadMetrics();
}

init().catch(showError);
