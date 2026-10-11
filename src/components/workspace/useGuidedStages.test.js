/**
 * Focused tests for the useGuidedStages hook's persistence layer.
 *
 * Verifies:
 *   - Loading returns normalized defaults for a fresh job.
 *   - Saving then loading round-trips staged state.
 *   - Stage data is isolated per job id (no collision).
 *   - Malformed stored data recovers to safe defaults.
 *   - EMPTY_GUIDED_STAGES exposes every guided-stage key.
 *
 * Self-contained: run via the Base44 exec sandbox (provides a sessionStorage
 * mock, loads the real pure helpers from useGuidedStages.js) or adapt to
 * Vitest/Jest with @testing-library/react renderHook.
 */

let _pass = 0;
let _fail = 0;
const _failures = [];

function assert(cond, msg) {
  if (cond) _pass++;
  else { _fail++; _failures.push(msg); }
}

function assertEqual(actual, expected, label) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

export function runTests({ loadGuidedStages, saveGuidedStages, EMPTY_GUIDED_STAGES }) {
  _pass = 0; _fail = 0; _failures.length = 0;

  // --- 1. Fresh job returns all-false defaults ------------------------------
  const fresh = loadGuidedStages("job-A");
  assertEqual(fresh, EMPTY_GUIDED_STAGES, "Fresh job should return all-false defaults");

  // --- 2. Save then load round-trips --------------------------------------
  const staged = { ...EMPTY_GUIDED_STAGES, contact: true, employment: true };
  saveGuidedStages("job-A", staged);
  assertEqual(loadGuidedStages("job-A"), staged, "Saved stages should round-trip");

  // --- 3. Per-job isolation (job-B must not see job-A) ---------------------
  const jobB = loadGuidedStages("job-B");
  assertEqual(jobB, EMPTY_GUIDED_STAGES, "Different job should not share staged state");

  saveGuidedStages("job-B", { ...EMPTY_GUIDED_STAGES, questions: true });
  const jobAReloaded = loadGuidedStages("job-A");
  assertEqual(jobAReloaded, staged, "job-A state must be unaffected by job-B writes");

  // --- 4. Malformed stored data recovers to safe defaults ------------------
  sessionStorage.setItem("workspace_guided_stages_job-C", "{not valid json");
  const malformed = loadGuidedStages("job-C");
  assertEqual(malformed, EMPTY_GUIDED_STAGES, "Malformed JSON should recover to defaults");

  // Malformed shape (non-object) also recovers
  sessionStorage.setItem("workspace_guided_stages_job-D", JSON.stringify(42));
  const nonObject = loadGuidedStages("job-D");
  assertEqual(nonObject, EMPTY_GUIDED_STAGES, "Non-object stored value should recover to defaults");

  // Partial object merges over defaults: missing keys filled, known values kept
  sessionStorage.setItem("workspace_guided_stages_job-E", JSON.stringify({ contact: true }));
  const partial = loadGuidedStages("job-E");
  assert(partial.contact === true, "Partial stored object should keep known staged values");
  assert(partial.employment === false, "Partial stored object should fill missing keys with defaults");

  // --- 5. EMPTY_GUIDED_STAGES exposes every guided-stage key ---------------
  const expectedKeys = ["employer_account", "contact", "employment", "education", "resume", "questions", "review", "submitted"];
  for (const k of expectedKeys) {
    assert(k in EMPTY_GUIDED_STAGES, `EMPTY_GUIDED_STAGES should include key: ${k}`);
    assert(EMPTY_GUIDED_STAGES[k] === false, `EMPTY_GUIDED_STAGES.${k} should default to false`);
  }

  // --- 6. Missing job id yields safe defaults ------------------------------
  assertEqual(loadGuidedStages(undefined), EMPTY_GUIDED_STAGES, "Undefined job id should yield defaults");

  return {
    total: _pass + _fail,
    passed: _pass,
    failed: _fail,
    failures: _failures,
    allPassed: _fail === 0,
  };
}