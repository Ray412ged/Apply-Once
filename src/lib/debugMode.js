// Controls visibility of internal diagnostic panels (e.g. Credential Import Debug Log).
// End users never see diagnostics; the panel/log only activate when:
//   1. Developer Mode — running the Vite dev server locally (import.meta.env.DEV), or
//   2. An admin explicitly turns on the debug flag via Admin Settings.

const DIAG_DEBUG_FLAG = "applyonce_diag_debug";

export function isDiagnosticDebugEnabled() {
  if (import.meta.env && import.meta.env.DEV) return true;
  try {
    return localStorage.getItem(DIAG_DEBUG_FLAG) === "true";
  } catch {
    return false;
  }
}

export function setDiagnosticDebug(enabled) {
  try {
    localStorage.setItem(DIAG_DEBUG_FLAG, enabled ? "true" : "false");
  } catch {
    // localStorage may be unavailable
  }
}