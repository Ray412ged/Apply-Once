const GUEST_REDIRECT_KEY = "guest_redirect_after_migration";

// Exact routes a guest may resume on after authentication + migration.
const ALLOWED_REDIRECTS = ["/jobs", "/applications", "/more", "/home", "/profile", "/resume"];

// Path prefixes that are safe to resume on (e.g. a specific job or workspace).
const ALLOWED_PREFIXES = ["/jobs/", "/workspace/"];

function isAllowedRedirect(path) {
  if (typeof path !== "string") return false;
  if (ALLOWED_REDIRECTS.includes(path)) return true;
  return ALLOWED_PREFIXES.some((p) => path.startsWith(p));
}

// Remember the destination a guest was trying to reach (e.g. "/jobs/abc123")
// so that after authentication + guest migration the app can return them there
// instead of restarting onboarding. Survives same-origin OAuth redirects and
// email registration because it lives in sessionStorage.
export function saveGuestRedirect(path) {
  try {
    if (isAllowedRedirect(path)) {
      sessionStorage.setItem(GUEST_REDIRECT_KEY, path);
    }
  } catch {
    // sessionStorage unavailable
  }
}

export function consumeGuestRedirect() {
  try {
    const path = sessionStorage.getItem(GUEST_REDIRECT_KEY);
    sessionStorage.removeItem(GUEST_REDIRECT_KEY);
    if (isAllowedRedirect(path)) {
      return path;
    }
  } catch {
    // sessionStorage unavailable
  }
  return "/home";
}

export function clearGuestRedirect() {
  try {
    sessionStorage.removeItem(GUEST_REDIRECT_KEY);
  } catch {
    // sessionStorage unavailable
  }
}