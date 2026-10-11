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
const MAX_ENTRIES = 50;

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

function persist() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    // Storage may be full or unavailable — silently skip
  }
}

/**
 * Records a progress entry when the readiness score changes.
 *
 * @param {number} previousScore
 * @param {number} newScore
 * @param {string} trigger — what caused the change
 * @returns {ProgressEntry|null}
 */
export function recordProgressEntry(previousScore, newScore, trigger) {
  if (previousScore === newScore) return null;

  ensureLoaded();

  const entry = {
    previousScore,
    newScore,
    timestamp: new Date().toISOString(),
    trigger: trigger || "Profile updated",
  };

  history.unshift(entry);

  if (history.length > MAX_ENTRIES) {
    history = history.slice(0, MAX_ENTRIES);
  }

  persist();
  return entry;
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

/**
 * Clears all progress history.
 */
export function clearProgressHistory() {
  history = [];
  persist();
}