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
  enrolledCourses: [],
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
  cardPayment: document.querySelector("#cardPayment"),
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
  enrolledCourses: document.querySelector("#enrolledCourses"),
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
  walletButton: document.querySelector("#walletButton"),
};

const aiNativeFullCourses = {
  "ai-native-builder-foundations": {
    overview:
      "This course teaches the baseline product developer judgment needed before touching tools: what AI is good at, where it fails, and how to frame a product idea so the AI behavior serves a real human need.",
    modules: [
      {
        title: "AI-Native Product Mindset",
        lessons: [
          {
            title: "From software features to intelligent workflows",
            objective: "Recognize the difference between a normal app feature and an AI-native workflow.",
            content:
              "Traditional software asks users to click through fixed steps. AI-native products accept messy inputs, reason over context, and produce a useful next state. The product developer's job is to decide which parts should be flexible and which parts must stay predictable.",
            exercise: "Take one app you use every week and rewrite one feature as an AI-assisted workflow.",
            deliverable: "A before-and-after workflow sketch.",
          },
          {
            title: "Where AI adds leverage",
            objective: "Identify high-value tasks for AI assistance.",
            content:
              "AI is strongest when work involves summarizing, transforming, drafting, classifying, planning, or searching through fuzzy information. It is weaker when the task requires guaranteed accuracy, hidden domain context, or irreversible decisions.",
            exercise: "List ten repeated tasks in your life or work, then score each by repetition, messiness, and risk.",
            deliverable: "A ranked list of three promising AI product ideas.",
          },
          {
            title: "Common failure patterns in AI products",
            objective: "Avoid product ideas that look impressive but fail real users.",
            content:
              "Most failed AI products overpromise autonomy, hide assumptions, ignore correction loops, or lack a clear success metric. Strong AI products make the AI's role visible and give users a way to review, edit, and recover.",
            exercise: "Audit two AI tools and identify one trust problem in each.",
            deliverable: "A short failure-pattern checklist.",
          },
        ],
      },
      {
        title: "Problem Selection",
        lessons: [
          {
            title: "Find repeated messy work",
            objective: "Find practical AI use cases from real user behavior.",
            content:
              "The best early AI products usually start with a recurring task that already happens manually: preparing notes, comparing options, rewriting material, triaging requests, or making a plan from scattered information.",
            exercise: "Interview one person about a recurring task they avoid or delay.",
            deliverable: "A task breakdown with inputs, outputs, and pain points.",
          },
          {
            title: "Separate novelty from value",
            objective: "Filter ideas that are only interesting because they use AI.",
            content:
              "Novelty asks, 'Can AI do this?' Value asks, 'Would someone return to this because it saves effort, improves quality, or creates confidence?' Product developers prioritize return usage over demos.",
            exercise: "Write the same product idea as a novelty pitch and as a user-value pitch.",
            deliverable: "A one-sentence value proposition.",
          },
          {
            title: "Define success in plain language",
            objective: "Create a measurable but human-readable success definition.",
            content:
              "A useful success metric might be 'creates a meal plan I would actually cook' or 'turns a messy note into a sendable email in under two edits.' Plain-language metrics make evaluation possible later.",
            exercise: "Write three success criteria for your chosen AI product idea.",
            deliverable: "A success rubric with pass, partial, and fail examples.",
          },
        ],
      },
      {
        title: "Builder Operating System",
        lessons: [
          {
            title: "Scope a one-week prototype",
            objective: "Reduce an AI product idea to a buildable first version.",
            content:
              "A one-week prototype should have one user, one job, one input path, one AI transformation, and one useful output. Anything else is likely a distraction until the core behavior proves useful.",
            exercise: "Cut your idea down until it can be tested with five realistic prompts.",
            deliverable: "A one-week prototype scope.",
          },
          {
            title: "Pick tools and constraints",
            objective: "Choose a simple stack without overengineering.",
            content:
              "Use the simplest tool that lets you test the behavior: a form, spreadsheet, no-code automation, lightweight frontend, or API call. Constraints make the first product easier to evaluate.",
            exercise: "Choose your input surface, storage, AI step, and output surface.",
            deliverable: "A prototype stack map.",
          },
          {
            title: "Plan feedback loops",
            objective: "Design the first feedback mechanism before launch.",
            content:
              "Feedback should capture whether the output was useful, what the user changed, and what they expected instead. This turns a prototype into a learning system.",
            exercise: "Write three feedback questions users can answer in under one minute.",
            deliverable: "A feedback plan for your prototype.",
          },
        ],
      },
    ],
  },
  "prompt-systems-product-developers": {
    overview:
      "This course turns prompting from ad hoc writing into product infrastructure: reusable instructions, examples, output contracts, and tests.",
    modules: [
      {
        title: "Reliable Prompt Patterns",
        lessons: [
          {
            title: "Role and task framing",
            objective: "Write prompts that tell the model exactly what job to perform.",
            content:
              "A reliable prompt names the role, task, user context, constraints, and output format. The role is not decoration; it tells the model which standards to apply.",
            exercise: "Rewrite a vague prompt into a structured prompt with role, task, context, and constraints.",
            deliverable: "A reusable task prompt.",
          },
          {
            title: "Context and constraints",
            objective: "Control what the model should use and avoid.",
            content:
              "AI systems become more dependable when the relevant context is explicit and the boundaries are clear. Good constraints define tone, scope, forbidden assumptions, and fallback behavior.",
            exercise: "Add constraints to prevent hallucinated facts, unsupported advice, or irrelevant detail.",
            deliverable: "A constrained prompt template.",
          },
          {
            title: "Few-shot examples that matter",
            objective: "Use examples to teach quality, not just format.",
            content:
              "Few-shot examples are most useful when they show edge cases, judgment calls, and the difference between acceptable and unacceptable output.",
            exercise: "Create two good examples and one bad example for the same task.",
            deliverable: "A prompt with examples and quality notes.",
          },
        ],
      },
      {
        title: "Structured Product Output",
        lessons: [
          {
            title: "JSON-style responses",
            objective: "Design outputs that software can reliably parse.",
            content:
              "When AI output feeds a product, structure matters. A schema reduces ambiguity and makes it easier to show, store, validate, or retry the result.",
            exercise: "Create an output schema for a lesson planner, trip planner, or research assistant.",
            deliverable: "A structured output contract.",
          },
          {
            title: "Error-resistant formats",
            objective: "Design outputs that degrade gracefully.",
            content:
              "Prompts should define what happens when the model lacks enough information. Instead of guessing, the product can ask a follow-up question or return a partial answer.",
            exercise: "Add missing-information behavior to your schema.",
            deliverable: "A fallback-aware output format.",
          },
          {
            title: "Designing fallback behavior",
            objective: "Protect users from silent failure.",
            content:
              "Fallback behavior is part of the product experience. A good AI product tells users what it could not do, why, and what they can provide next.",
            exercise: "Write three fallback messages for common failure states.",
            deliverable: "A failure-state copy set.",
          },
        ],
      },
      {
        title: "Prompt Testing",
        lessons: [
          {
            title: "Create test cases",
            objective: "Build a small but useful prompt test suite.",
            content:
              "A prompt test suite should include normal cases, edge cases, ambiguous inputs, and adversarial or low-quality inputs. The goal is not perfection; it is visibility.",
            exercise: "Write ten realistic inputs for your prompt system.",
            deliverable: "A prompt test set.",
          },
          {
            title: "Compare prompt versions",
            objective: "Improve prompts with evidence instead of vibes.",
            content:
              "Prompt changes should be compared against the same examples. Track where one version is clearer, safer, more complete, or less verbose.",
            exercise: "Run two prompt versions against five inputs and score the outputs.",
            deliverable: "A prompt comparison table.",
          },
          {
            title: "Document reusable prompt contracts",
            objective: "Make prompts maintainable as product assets.",
            content:
              "A prompt contract documents purpose, inputs, outputs, assumptions, examples, and known failure modes. This helps future builders understand why the prompt works.",
            exercise: "Write documentation for your strongest prompt.",
            deliverable: "A prompt contract document.",
          },
        ],
      },
    ],
  },
  "ai-prototyping-no-code-low-code": {
    overview:
      "This course shows how to move from AI idea to testable demo using simple product flows, data, and automation.",
    modules: [
      {
        title: "Prototype Design",
        lessons: [
          {
            title: "Define the happy path",
            objective: "Map the simplest successful user journey.",
            content:
              "A prototype needs one clear happy path: user enters information, AI transforms it, user gets a useful result, and the product offers a next step.",
            exercise: "Draw your happy path in five boxes.",
            deliverable: "A happy-path flow diagram.",
          },
          {
            title: "Plan empty and error states",
            objective: "Make the prototype believable when things go wrong.",
            content:
              "AI prototypes fail when every demo assumes perfect input. Empty states, loading states, low-confidence states, and correction states make the product feel real.",
            exercise: "Write copy for four non-happy-path states.",
            deliverable: "A state checklist.",
          },
          {
            title: "Create believable demo data",
            objective: "Use realistic examples for testing.",
            content:
              "Demo data should look like what real users provide: incomplete, messy, and varied. Polished fake data hides product problems.",
            exercise: "Create five realistic sample inputs for your product.",
            deliverable: "A demo dataset.",
          },
        ],
      },
      {
        title: "No-Code AI Stack",
        lessons: [
          {
            title: "Forms and databases",
            objective: "Capture and store user inputs cleanly.",
            content:
              "The simplest AI product often starts with a form and a database. The form collects context. The database lets you review inputs, outputs, and feedback.",
            exercise: "Design a form with only the fields your AI truly needs.",
            deliverable: "A form and data-field map.",
          },
          {
            title: "Automation steps",
            objective: "Connect input, AI processing, and output.",
            content:
              "A workflow automation should make each step inspectable: receive input, prepare prompt, call model, save result, display output, ask for feedback.",
            exercise: "Write your automation as a numbered recipe.",
            deliverable: "An automation blueprint.",
          },
          {
            title: "AI actions and handoffs",
            objective: "Define what the AI does and what the user decides.",
            content:
              "The AI should not own every decision. Strong prototypes define handoff points where users review, edit, approve, or choose between options.",
            exercise: "Mark every AI step as draft, recommend, classify, or decide.",
            deliverable: "A human-in-the-loop workflow.",
          },
        ],
      },
      {
        title: "Demo Readiness",
        lessons: [
          {
            title: "Run user scenarios",
            objective: "Test the prototype with realistic situations.",
            content:
              "A scenario is a short story about a user's context, goal, and input. Testing scenarios reveals whether the prototype is useful beyond a perfect demo.",
            exercise: "Run three scenarios through your prototype manually.",
            deliverable: "Scenario test notes.",
          },
          {
            title: "Capture feedback",
            objective: "Collect feedback that improves the product.",
            content:
              "Useful feedback asks what users expected, what they trusted, what they edited, and whether they would use the tool again.",
            exercise: "Create a five-question feedback form.",
            deliverable: "A feedback form linked to the prototype.",
          },
          {
            title: "Decide what to build next",
            objective: "Turn feedback into the next product decision.",
            content:
              "After a prototype test, do not add every requested feature. Look for repeated friction and the smallest change that increases usefulness.",
            exercise: "Group feedback into bugs, clarity issues, and new feature requests.",
            deliverable: "A next-iteration plan.",
          },
        ],
      },
    ],
  },
  "ai-product-ux": {
    overview:
      "This course teaches the interface patterns that make AI products understandable, editable, and trustworthy.",
    modules: [
      {
        title: "Making AI Understandable",
        lessons: [
          {
            title: "Set expectations",
            objective: "Tell users what the AI can and cannot do.",
            content:
              "Users trust AI products more when the product is honest about capabilities, input requirements, and review responsibility.",
            exercise: "Write onboarding copy for your AI product in under 80 words.",
            deliverable: "An expectation-setting onboarding screen.",
          },
          {
            title: "Explain what the tool needs",
            objective: "Help users provide better inputs.",
            content:
              "Input UX should guide users toward the context the AI needs. Examples, placeholders, and field grouping often outperform a blank text box.",
            exercise: "Design a guided input form for your product.",
            deliverable: "An input screen wireframe.",
          },
          {
            title: "Avoid magical black boxes",
            objective: "Make AI behavior legible.",
            content:
              "Show what the AI considered, what assumptions it made, and how the user can change the result. This turns mystery into control.",
            exercise: "Add an assumptions panel to an AI output.",
            deliverable: "A transparent output layout.",
          },
        ],
      },
      {
        title: "Interaction Patterns",
        lessons: [
          {
            title: "Prompt builders",
            objective: "Create input controls that form better prompts.",
            content:
              "Prompt builders translate user choices into structured context. They are useful when free-form prompting causes inconsistent results.",
            exercise: "Turn a blank prompt box into three guided controls.",
            deliverable: "A prompt-builder wireframe.",
          },
          {
            title: "Editable outputs",
            objective: "Design outputs users can improve.",
            content:
              "AI output should often be a draft, not a final answer. Editing, highlighting, accepting, rejecting, and commenting are core AI product patterns.",
            exercise: "Choose which parts of your AI output should be editable.",
            deliverable: "An editable-output interaction plan.",
          },
          {
            title: "Regenerate, refine, and compare",
            objective: "Give users useful control over iteration.",
            content:
              "Regenerate is blunt. Refine and compare are better when users know what they want changed. Good AI UX offers targeted controls.",
            exercise: "Design three refinement buttons for your product.",
            deliverable: "A refinement-control set.",
          },
        ],
      },
      {
        title: "Trust and Recovery",
        lessons: [
          {
            title: "Cite assumptions",
            objective: "Show uncertainty without overwhelming users.",
            content:
              "When the AI infers something, the product should make the assumption visible. This lets users correct the system before errors compound.",
            exercise: "Identify five assumptions your product might make.",
            deliverable: "An assumptions and corrections table.",
          },
          {
            title: "Handle bad outputs",
            objective: "Recover from inaccurate or unhelpful responses.",
            content:
              "Bad outputs need recovery paths: try again with changes, report an issue, edit manually, or ask clarifying questions.",
            exercise: "Write recovery flows for three bad-output scenarios.",
            deliverable: "A recovery-state map.",
          },
          {
            title: "Design graceful correction loops",
            objective: "Let users teach the product what better means.",
            content:
              "Correction loops should capture the user's edit or preference and use it to improve the next output in the session.",
            exercise: "Design a correction interaction that takes under ten seconds.",
            deliverable: "A correction-loop prototype.",
          },
        ],
      },
    ],
  },
  "ai-evaluation-quality": {
    overview:
      "This course gives product developers a practical quality system for AI features: test cases, rubrics, regression checks, and launch criteria.",
    modules: [
      {
        title: "What Good Means",
        lessons: [
          {
            title: "Define quality dimensions",
            objective: "Turn vague quality into observable criteria.",
            content:
              "AI output quality usually includes accuracy, usefulness, completeness, tone, safety, and format. The right dimensions depend on the product job.",
            exercise: "Choose five quality dimensions for your product.",
            deliverable: "A quality-dimension table.",
          },
          {
            title: "Create pass/fail rules",
            objective: "Score outputs consistently.",
            content:
              "A pass/fail rule should be specific enough that two reviewers would mostly agree. Example: 'Includes at least three meal options using only listed ingredients.'",
            exercise: "Write pass, partial, and fail examples for one output.",
            deliverable: "A scoring rubric.",
          },
          {
            title: "Choose human review criteria",
            objective: "Know when human judgment is required.",
            content:
              "Some criteria cannot be fully automated. Product developers decide which outputs need review before users rely on them.",
            exercise: "Mark which quality dimensions are automatable and which need human review.",
            deliverable: "A review-policy note.",
          },
        ],
      },
      {
        title: "Testing AI Behavior",
        lessons: [
          {
            title: "Build realistic prompts",
            objective: "Create useful test inputs.",
            content:
              "Good test prompts include common requests, messy requests, missing context, conflicting goals, and edge cases. These inputs reveal product behavior.",
            exercise: "Write ten test prompts for your AI feature.",
            deliverable: "A golden test set.",
          },
          {
            title: "Catch edge cases",
            objective: "Identify where the product can fail harmfully.",
            content:
              "Edge cases often involve sensitive topics, ambiguous instructions, bad data, or users asking the AI to exceed its role.",
            exercise: "Add five high-risk prompts to your test set.",
            deliverable: "An edge-case checklist.",
          },
          {
            title: "Compare model and prompt versions",
            objective: "Track quality over time.",
            content:
              "Every model or prompt change can improve one behavior and break another. Regression checks protect against accidental quality drops.",
            exercise: "Score two versions of your prompt on the same test set.",
            deliverable: "A regression comparison.",
          },
        ],
      },
      {
        title: "Operational Quality",
        lessons: [
          {
            title: "Monitor user feedback",
            objective: "Use real feedback to improve tests.",
            content:
              "User feedback should become new test cases. When a user flags an issue, add a similar input to the evaluation set.",
            exercise: "Design a feedback tag system for AI output issues.",
            deliverable: "A feedback taxonomy.",
          },
          {
            title: "Prioritize fixes",
            objective: "Decide what quality problems matter most.",
            content:
              "Prioritize issues by frequency, severity, user trust impact, and ease of repair. Not every weird output deserves immediate work.",
            exercise: "Rank five hypothetical AI bugs.",
            deliverable: "A fix-priority matrix.",
          },
          {
            title: "Decide when not to automate",
            objective: "Protect users by limiting AI scope.",
            content:
              "Sometimes the right product decision is to stop, ask for review, or refuse the task. Scope limits are a quality feature.",
            exercise: "Write three refusal or escalation rules for your product.",
            deliverable: "A launch safety checklist.",
          },
        ],
      },
    ],
  },
  "ship-ai-native-product": {
    overview:
      "This course turns an AI prototype into a public beta with onboarding, analytics, payment/readiness decisions, and a first iteration loop.",
    modules: [
      {
        title: "From Demo to Product",
        lessons: [
          {
            title: "Choose launch scope",
            objective: "Define what belongs in beta and what waits.",
            content:
              "A launch scope should include only the features needed for a user to understand, try, and judge the product's core value.",
            exercise: "Sort your feature ideas into launch, later, and no.",
            deliverable: "A beta scope list.",
          },
          {
            title: "Write onboarding copy",
            objective: "Help first users succeed quickly.",
            content:
              "Onboarding should tell users who the product is for, what to try first, what inputs help, and how to judge the output.",
            exercise: "Write a three-screen onboarding sequence.",
            deliverable: "A beta onboarding draft.",
          },
          {
            title: "Create useful defaults",
            objective: "Reduce blank-page friction.",
            content:
              "Useful defaults include example prompts, templates, sample data, and prefilled choices. They help users experience value faster.",
            exercise: "Create three default examples for your product.",
            deliverable: "A default-example set.",
          },
        ],
      },
      {
        title: "Measure the First Users",
        lessons: [
          {
            title: "Track activation",
            objective: "Know whether users reach first value.",
            content:
              "Activation is the first meaningful success moment. For an AI product, this may be generating a useful output, editing it, saving it, or sharing it.",
            exercise: "Define the activation event for your product.",
            deliverable: "An analytics event list.",
          },
          {
            title: "Collect qualitative feedback",
            objective: "Learn why users behave the way they do.",
            content:
              "Analytics shows what happened. Feedback explains why. Early AI products need both because user trust and expectation gaps are hard to infer from clicks.",
            exercise: "Write five beta interview questions.",
            deliverable: "A feedback interview script.",
          },
          {
            title: "Find repeated friction",
            objective: "Turn early usage into product priorities.",
            content:
              "Repeated friction matters more than isolated opinions. Look for patterns in failed prompts, abandoned flows, manual edits, and repeated questions.",
            exercise: "Review ten feedback notes and group them into themes.",
            deliverable: "A friction theme map.",
          },
        ],
      },
      {
        title: "Launch and Iterate",
        lessons: [
          {
            title: "Create a beta plan",
            objective: "Launch to a small, specific audience.",
            content:
              "A beta launch should have a narrow audience, clear ask, feedback channel, support plan, and a date for deciding the next iteration.",
            exercise: "Write your beta invite message.",
            deliverable: "A beta launch plan.",
          },
          {
            title: "Prioritize fixes",
            objective: "Choose improvements that increase user value.",
            content:
              "After launch, prioritize fixes that help more users reach first value or reduce trust-breaking failures. Avoid broad expansion too early.",
            exercise: "Score feedback by impact and effort.",
            deliverable: "A prioritized iteration list.",
          },
          {
            title: "Decide what to build next",
            objective: "Move from beta to a stronger product version.",
            content:
              "The next version should be based on evidence: who got value, where they got stuck, and what behavior would make them return.",
            exercise: "Write a one-page post-beta product decision.",
            deliverable: "A next-version product brief.",
          },
        ],
      },
    ],
  },
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
    state.enrolledCourses = data.enrolledCourses || [];
    state.enrolledCourses.forEach((course) => {
      state.courseById[course.id] = course;
    });
    state.saved = data.user.saved || state.saved;
    state.cart = data.user.cart?.length ? data.user.cart : state.cart;
    persistLocal();
  } catch {
    api.token = "";
    localStorage.removeItem("insession-token");
  }
  renderAccount();
  renderLearning();
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
          <div class="order-card-footer">
            <strong>${money(order.total)}</strong>
            <span>${escapeHtml(order.payment?.method || "manual")} / ${escapeHtml(order.payment?.status || "recorded")}</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderLearning() {
  if (!selectors.enrolledCourses) return;
  if (!state.enrolledCourses.length) {
    selectors.enrolledCourses.innerHTML = '<div class="empty compact">Enroll in a course to start learning here.</div>';
    return;
  }

  selectors.enrolledCourses.innerHTML = state.enrolledCourses
    .map((course) => {
      const totalModules = Math.max((course.modules || []).length, 1);
      const completed = state.user?.progress?.[course.id]?.completedModules?.length || 0;
      const percent = Math.round((completed / totalModules) * 100);
      return `
        <article class="learning-card">
          <img src="${escapeHtml(course.image)}" alt="${escapeHtml(course.title)} course image">
          <div>
            <span class="pill">${escapeHtml(course.category)}</span>
            <h3>${escapeHtml(course.title)}</h3>
            <p>${escapeHtml(course.summary)}</p>
            <div class="progress-track" aria-label="${percent}% complete"><span style="width: ${percent}%"></span></div>
            <div class="learning-actions">
              <strong>${percent}% complete</strong>
              <button class="small-button" type="button" data-action="learn" data-id="${course.id}">Open course</button>
            </div>
          </div>
        </article>
      `;
    })
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

function fullCourseFor(course) {
  return aiNativeFullCourses[course.id] || null;
}

function renderFullCourseModules(course, mode = "preview") {
  const fullCourse = fullCourseFor(course);
  const modules = fullCourse?.modules || course.modules || [];
  if (!modules.length) return "";

  return `
    <section class="detail-section">
      <h3>${mode === "reader" ? "Course lessons" : "Full course"}</h3>
      ${fullCourse?.overview ? `<p class="course-overview">${escapeHtml(fullCourse.overview)}</p>` : ""}
      <div class="full-course-list">
        ${modules
          .map(
            (module, moduleIndex) => `
              <article class="full-module">
                <div class="module-heading">
                  <span>Module ${moduleIndex + 1}</span>
                  <strong>${escapeHtml(module.title)}</strong>
                </div>
                <div class="lesson-detail-list">
                  ${(module.lessons || [])
                    .map((lesson, lessonIndex) => {
                      const lessonTitle = typeof lesson === "string" ? lesson : lesson.title;
                      const objective = typeof lesson === "string" ? "" : lesson.objective;
                      const content = typeof lesson === "string" ? "" : lesson.content;
                      const exercise = typeof lesson === "string" ? "" : lesson.exercise;
                      const deliverable = typeof lesson === "string" ? "" : lesson.deliverable;
                      return `
                        <section class="lesson-detail">
                          <div class="lesson-kicker">Lesson ${moduleIndex + 1}.${lessonIndex + 1}</div>
                          <h4>${escapeHtml(lessonTitle)}</h4>
                          ${objective ? `<p><strong>Objective:</strong> ${escapeHtml(objective)}</p>` : ""}
                          ${content ? `<p>${escapeHtml(content)}</p>` : ""}
                          ${exercise ? `<div class="lesson-task"><strong>Exercise</strong><span>${escapeHtml(exercise)}</span></div>` : ""}
                          ${deliverable ? `<div class="lesson-task"><strong>Deliverable</strong><span>${escapeHtml(deliverable)}</span></div>` : ""}
                        </section>
                      `;
                    })
                    .join("")}
                </div>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
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
      ${renderFullCourseModules(course)}
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

async function openLearning(courseId) {
  const data = await api.request(`/api/courses/${encodeURIComponent(courseId)}`);
  const course = data.course;
  state.courseById[course.id] = course;
  const completed = new Set(state.user?.progress?.[course.id]?.completedModules || []);
  const fullCourse = fullCourseFor(course);
  const progressModules = fullCourse?.modules || course.modules || [];
  selectors.courseDetail.innerHTML = `
    <div class="detail-content learning-reader">
      <div>
        <p class="eyebrow">Enrolled course / ${escapeHtml(course.level)} / ${course.duration} hours</p>
        <h2>${escapeHtml(course.title)}</h2>
      </div>
      <p>${escapeHtml(course.summary)}</p>
      <div class="module-list">
        ${progressModules
          .map(
            (module, index) => `
              <article>
                <label class="module-check">
                  <input type="checkbox" data-action="progress" data-id="${course.id}" data-module="${index}" ${completed.has(index) ? "checked" : ""}>
                  <strong>Module ${index + 1}: ${escapeHtml(module.title)}</strong>
                </label>
                <ul>${module.lessons.map((lesson) => `<li>${escapeHtml(lesson)}</li>`).join("")}</ul>
              </article>
            `,
          )
          .join("")}
      </div>
      ${renderFullCourseModules(course, "reader")}
      ${course.project ? `<section class="detail-section project-box"><h3>Course project</h3><p>${escapeHtml(course.project)}</p></section>` : ""}
      <div class="course-footer">
        <span class="price">Included in enrollment</span>
        <button class="small-button alt" type="button" data-action="close-detail">Close</button>
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

  if (action === "learn") {
    await openLearning(courseId);
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

  document.addEventListener("change", async (event) => {
    const progressTarget = event.target.closest('[data-action="progress"]');
    if (!progressTarget) return;
    const courseId = progressTarget.dataset.id;
    const checkedModules = [...selectors.courseDetail.querySelectorAll(`[data-action="progress"][data-id="${CSS.escape(courseId)}"]:checked`)].map((input) =>
      Number(input.dataset.module),
    );
    const data = await api.request("/api/me/progress", {
      method: "PUT",
      body: JSON.stringify({ courseId, completedModules: checkedModules }),
    });
    state.user = data.user;
    persistLocal();
    renderLearning();
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
    const data = await createOrder(form, { method: form.get("paymentMethod") || "card", provider: "insession-checkout" });
    await afterOrderCreated(data);
  });

  selectors.walletButton.addEventListener("click", async () => {
    if (!state.cart.length) {
      selectors.checkoutStatus.textContent = "Add at least one course before paying.";
      return;
    }
    const form = new FormData(selectors.checkoutForm);
    if (!form.get("email")) {
      selectors.checkoutStatus.textContent = "Enter your email before using Apple Pay.";
      return;
    }
    if (!window.PaymentRequest) {
      selectors.checkoutStatus.textContent = "Apple Pay is not available in this browser. Use card checkout below.";
      return;
    }
    const cartCourses = state.cart.map((id) => findCourse(id)).filter(Boolean);
    const subtotal = cartCourses.reduce((sum, course) => sum + course.price, 0);
    const platformFee = Math.round(subtotal * 0.03);
    const total = subtotal + platformFee;
    try {
      const request = new PaymentRequest(
        [
          {
            supportedMethods: "https://apple.com/apple-pay",
            data: {
              version: 3,
              merchantIdentifier: "merchant.com.insession.learning",
              merchantCapabilities: ["supports3DS"],
              supportedNetworks: ["visa", "masterCard", "amex", "discover"],
              countryCode: "US",
            },
          },
          { supportedMethods: "basic-card" },
        ],
        {
          total: { label: "InSession enrollment", amount: { currency: "USD", value: total.toFixed(2) } },
          displayItems: [
            { label: "Courses", amount: { currency: "USD", value: subtotal.toFixed(2) } },
            { label: "Platform fee", amount: { currency: "USD", value: platformFee.toFixed(2) } },
          ],
        },
      );
      const paymentResponse = await request.show();
      await paymentResponse.complete("success");
      const data = await createOrder(form, {
        method: paymentResponse.methodName.includes("apple") ? "apple_pay" : "browser_wallet",
        provider: "payment-request",
        transactionId: `wallet_${Date.now()}`,
      });
      await afterOrderCreated(data);
    } catch (error) {
      selectors.checkoutStatus.textContent = error.name === "AbortError" ? "Payment canceled." : error.message;
    }
  });
}

function createOrder(form, payment) {
  return api.request("/api/orders", {
    method: "POST",
    body: JSON.stringify({
      name: form.get("name"),
      email: form.get("email"),
      courseIds: state.cart,
      payment,
    }),
  });
}

async function afterOrderCreated(data) {
  api.token = data.token;
  localStorage.setItem("insession-token", data.token);
  state.user = data.user;
  state.cart = [];
  selectors.checkoutStatus.textContent = `Enrollment confirmed: ${data.order.id}`;
  persistLocal();
  await loadAccount();
  await loadCatalog();
  await loadMetrics();
}

async function init() {
  bindEvents();
  renderAccount();
  await loadCatalog();
  await loadAccount();
  await loadMetrics();
}

init().catch(showError);
