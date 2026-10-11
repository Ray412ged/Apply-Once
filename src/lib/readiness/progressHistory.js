/**
 * Progress History — tracks readiness improvements over time.
 *
 * Each entry includes:
 *   { previousScore, newScore, timestamp, trigger }
 *
 * History is persisted to sessionStorage so it survives page reloads.
 * This data will power future progress visualizations in the
 * Employment Command Center.
 */

const STORAGE_KEY = "readiness_progress_history";
let history = [];
let initialized = false;

function ensureLoaded() {
  if (initialized) return;
  initialized = true;
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) history = JSON.parse(saved);
  } catch (e) {
    history = [];
  }
}

/**
 * Returns the full progress history (newest first).
 *
 * @returns {ProgressEntry[]}
 */
export function getProgressHistory() {
  ensureLoaded();
  return [...history];
}