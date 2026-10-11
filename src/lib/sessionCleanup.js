const APP_KEY_PATTERNS = [
  "applyonce_",
  "apply_once_",
  "workspace_",
  "first_jobs_visit_done",
  "readiness_progress_history",
  "jobs_selected_view",
];

function matchesAppKey(key) {
  return APP_KEY_PATTERNS.some((prefix) => key.startsWith(prefix));
}

export function clearAllSessionData() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && matchesAppKey(key)) keysToRemove.push(key);
    }
    keysToRemove.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // sessionStorage may be unavailable.
  }
}

export function purgeLegacyLocalStorage() {
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && matchesAppKey(key) && key !== "applyonce_diag_debug") {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // localStorage may be unavailable.
  }
}