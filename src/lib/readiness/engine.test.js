/**
 * Focused tests for the canonical readiness engine import chain and contract.
 *
 * Verifies:
 *   - The canonical engine exports the public readiness functions.
 *   - runEngine() returns the standardized output contract.
 *   - No active file imports the deprecated readiness shims.
 *
 * Self-contained: run via the Base44 exec sandbox (reads the engine source and
 * asserts on its exports / return contract) or adapt to Vitest/Jest by
 * importing the real module.
 */

let _pass = 0;
let _fail = 0;
const _failures = [];

function assert(cond, msg) {
  if (cond) _pass++;
  else { _fail++; _failures.push(msg); }
}

export function runTests({ engineSource, fileReferences }) {
  _pass = 0; _fail = 0; _failures.length = 0;

  // --- 1. Canonical engine exports the public readiness functions ---------
  const expectedExports = [
    "export function runEngine",
    "export function analyzeJobReadiness",
    "export function computeApplicationProgress",
    "export function computeSectionStatuses",
  ];
  for (const name of expectedExports) {
    assert(engineSource.includes(name), `engine should export: ${name.replace("export function ", "")}`);
  }

  // --- 2. runEngine() returns the standardized output contract -------------
  const contractKeys = [
    "applicationReadiness",
    "sectionStatuses",
    "nextBestStep",
    "optionalEnhancements",
    "resume",
    "profileCompletion",
    "jobMatches",
    "transferableSkills",
    "recommendations",
    "progressHistory",
  ];
  // The engine's runEngine return object lists these keys.
  for (const key of contractKeys) {
    assert(
      new RegExp(`${key}\\s*[,\\n]`).test(engineSource) || engineSource.includes(`${key},`) || engineSource.includes(`${key}\n`),
      `runEngine output contract should include: ${key}`
    );
  }

  // --- 3. No active file imports the deprecated shims ----------------------
  // Test files legitimately name the shims in their assertions, so exclude them.
  const shimNames = ["applicationReadinessEngine", "workspaceReadiness"];
  for (const ref of fileReferences) {
    if (ref.path.endsWith(".test.js")) continue;
    for (const shim of shimNames) {
      assert(!ref.content.includes(shim), `${ref.path} must not reference deprecated shim "${shim}"`);
    }
  }

  // --- 4. progressHistory is still wired through the canonical engine ------
  assert(
    engineSource.includes('from "./progressHistory"'),
    "engine should still import progressHistory (it is actively used, not deprecated)"
  );

  // --- 5. Improve Next is structured & actionable (not generic labels) ------
  assert(
    engineSource.includes("buildImproveNextRecommendations"),
    "engine should import buildImproveNextRecommendations for structured Improve Next"
  );
  assert(
    !engineSource.includes("improveNext.push(def.label)"),
    "engine must not push weighted-category labels into improveNext"
  );
  assert(
    engineSource.includes("buildImproveNextRecommendations(snapshot, sectionStatuses)"),
    "engine should build structured improveNext from snapshot + section statuses"
  );

  return {
    total: _pass + _fail,
    passed: _pass,
    failed: _fail,
    failures: _failures,
    allPassed: _fail === 0,
  };
}