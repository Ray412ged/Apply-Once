/**
 * Focused tests for the Employment Command Center.
 *
 * Verifies:
 *   - Overall status derivation (3 engine-derived states).
 *   - Readiness explanation covers every engine status.
 *   - Exactly one primary Next Best Step (Home renders it unconditionally).
 *   - Optional enhancements are displayed separately & use non-punitive styling.
 *   - Optional / Not Applicable sections never render as errors.
 *   - Application Ready state surfaces an appropriate next action.
 *   - Transferable-skills empty state ties to the Next Best Step.
 *   - No duplicate readiness calculations in child components
 *     (command-center components must not import runEngine).
 *   - Engine-provided navigation routes are passed through, not hard-coded.
 *
 * Self-contained: run via the Base44 exec sandbox (loads the pure helpers from
 * statusHelpers.js and reads the component sources) or adapt to Vitest/Jest.
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

export function runTests({
  deriveOverallState,
  getReadinessExplanation,
  getStateCopy,
  homeSource,
  commandCenterSources,
  sectionStatusCardSource,
}) {
  _pass = 0; _fail = 0; _failures.length = 0;

  // --- 1. Overall status: 3 engine-derived states ----------------------------
  const complete = { contact: { status: "Complete" }, employment: { status: "Complete" }, skills: { status: "Complete" }, summary: { status: "Complete" } };
  const inProgress = { contact: { status: "Complete" }, employment: { status: "In Progress" }, skills: { status: "Complete" }, summary: { status: "Complete" } };
  assertEqual(deriveOverallState(true, complete), "ready", "All core complete → ready");
  assertEqual(deriveOverallState(true, inProgress), "review", "Core ready but In Progress → review");
  assertEqual(deriveOverallState(false, complete), "building", "Not application ready → building");

  // --- 2. Readiness explanation covers every status --------------------------
  for (const s of ["Application Ready", "Almost Ready", "Building Momentum", "Getting Started", "Not Started"]) {
    const expl = getReadinessExplanation(s);
    assert(typeof expl === "string" && expl.length > 0, `Explanation exists for status "${s}"`);
  }

  // --- 3. State copy covers all 3 states -------------------------------------
  for (const s of ["ready", "review", "building"]) {
    assert(typeof getStateCopy(s).title === "string", `State copy exists for "${s}"`);
  }

  // --- 4. Exactly one primary Next Best Step (always rendered) ---------------
  assert(homeSource.includes("NextStepCard"), "Home imports NextStepCard");
  assert(!/\{!applicationReady &&\s*<NextStepCard/.test(homeSource), "NextStepCard must not be gated behind !applicationReady");
  const nextStepOccurrences = (homeSource.match(/<NextStepCard/g) || []).length;
  assert(nextStepOccurrences === 1, `Exactly one NextStepCard in render (found ${nextStepOccurrences})`);

  // --- 5. No duplicate readiness calculations in children --------------------
  for (const src of commandCenterSources) {
    assert(!src.content.includes("runEngine"), `${src.path} must not import runEngine (no duplicate readiness calc)`);
  }

  // --- 6. Optional enhancements: separate & non-punitive --------------------
  const optSrc = commandCenterSources.find((s) => s.path.endsWith("OptionalEnhancementsCard.jsx")).content;
  assert(!optSrc.includes("destructive"), "OptionalEnhancementsCard must not use destructive styling");
  assert(!optSrc.includes("warning"), "OptionalEnhancementsCard must not use warning styling");
  assert(optSrc.includes("return null"), "OptionalEnhancementsCard returns null when empty");

  // --- 7. Optional / Not Applicable sections never render as errors ----------
  const optionalLine = sectionStatusCardSource.split("\n").find((l) => l.includes('"Optional"'));
  assert(optionalLine && !optionalLine.includes("destructive"), "Optional status must not use destructive styling");
  const naLine = sectionStatusCardSource.split("\n").find((l) => l.includes('"Not Applicable"'));
  assert(naLine && !naLine.includes("destructive"), "Not Applicable status must not use destructive styling");

  // --- 8. Application Ready state: appropriate next action -------------------
  // Home renders NextBestStep whenever the engine returns one (incl. "Explore Matching Jobs").
  assert(homeSource.includes("nextStep &&"), "Home renders NextBestStep when present (incl. when Application Ready)");

  // --- 9. Engine-provided navigation (no hard-coded section routes) ----------
  const gridSrc = commandCenterSources.find((s) => s.path.endsWith("ProfileSectionsGrid.jsx")).content;
  assert(gridSrc.includes("s.route"), "ProfileSectionsGrid navigates via engine-provided route");
  assert(homeSource.includes("nextStep.route"), "Home uses engine-provided nextStep.route");

  // --- 10. Transferable-skills empty state ties to Next Best Step ------------
  const tsSrc = commandCenterSources.find((s) => s.path.endsWith("TransferableSkillsCard.jsx")).content;
  assert(tsSrc.includes("onNextStep"), "TransferableSkillsCard accepts onNextStep CTA");
  assert(tsSrc.includes("skills.length === 0"), "TransferableSkillsCard has empty-state branch");

  return {
    total: _pass + _fail,
    passed: _pass,
    failed: _fail,
    failures: _failures,
    allPassed: _fail === 0,
  };
}