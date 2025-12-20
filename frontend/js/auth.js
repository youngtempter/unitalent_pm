const AUTH_TOKEN = "unitalent_token";
const AUTH_USER = "unitalent_user";

const OPTIONAL_KEYS = [
  "unitalent_student_name",
  "unitalent_student_email",
  "unitalent_student_username",
  "unitalent_employer_name",
  "unitalent_employer_bin",
  "unitalent_employer_city",
  "unitalent_employer_size",
  "unitalent_student_profile"
];

const storeGet = (key) =>
  localStorage.getItem(key) ?? sessionStorage.getItem(key);

const storeRemove = (key) => {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
};

export function readUniTalentAuth() {
  const token = storeGet(AUTH_TOKEN);
  const userRaw = storeGet(AUTH_USER);

  if (!token || !userRaw) return { token: null, user: null, role: null };

  try {
    const user = JSON.parse(userRaw);
    return { token, user, role: user?.role ?? null };
  } catch {
    storeRemove(AUTH_TOKEN);
    storeRemove(AUTH_USER);
    return { token: null, user: null, role: null };
  }
}

export function clearAllAuth() {
  storeRemove(AUTH_TOKEN);
  storeRemove(AUTH_USER);
  OPTIONAL_KEYS.forEach(storeRemove);
}

export function redirectByRole(user) {
  if (!user?.role) return "index.html";
  if (user.role === "EMPLOYER") return "employer-dashboard.html";
  if (user.role === "STUDENT") return "student-dashboard.html";
  return "index.html";
}

export function guardRole(requiredRole) {
  const { token, user, role } = readUniTalentAuth();

  if (!token || !user) {
    clearAllAuth();
    window.location.href =
      requiredRole === "EMPLOYER"
        ? "employer-login.html"
        : "student-login.html";
    return false;
  }

  if (role !== requiredRole) {
    window.location.href =
      requiredRole === "EMPLOYER"
        ? "employer-login.html"
        : "student-login.html";
    return false;
  }

  return true;
}

export function guardGuest() {
  const { token, user } = readUniTalentAuth();
  if (token && user) {
    window.location.href = redirectByRole(user);
    return false;
  }
  return true;
}

export function setupNavbarAuthUI() {
  const authArea = document.getElementById("authArea");
  const loginBtn = document.getElementById("loginBtn");
  const signupBtn = document.getElementById("signupBtn");
  const dashboardBtn = document.getElementById("dashboardBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  authArea?.classList.remove("hidden");

  function setGuestUI() {
    loginBtn?.classList.remove("hidden");
    signupBtn?.classList.remove("hidden");
    dashboardBtn?.classList.add("hidden");
    logoutBtn?.classList.add("hidden");
  }

  function setAuthedUI(user) {
    loginBtn?.classList.add("hidden");
    signupBtn?.classList.add("hidden");
    dashboardBtn?.classList.remove("hidden");
    logoutBtn?.classList.remove("hidden");

    if (dashboardBtn) {
      dashboardBtn.href =
        user?.role === "EMPLOYER"
          ? "employer-dashboard.html"
          : "student-dashboard.html";
    }
  }

  const { token, user } = readUniTalentAuth();
  if (token && user) setAuthedUI(user);
  else setGuestUI();

  logoutBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    clearAllAuth();
    window.location.href = "index.html";
  });
}

function applyBodyGuard() {
  const guard = document.body?.dataset?.guard;

  if (!guard) return;

  const g = guard.toUpperCase();

  if (g === "STUDENT") guardRole("STUDENT");
  else if (g === "EMPLOYER") guardRole("EMPLOYER");
  else if (g === "GUEST") guardGuest();
}

function init() {
  setupNavbarAuthUI();
  applyBodyGuard();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
