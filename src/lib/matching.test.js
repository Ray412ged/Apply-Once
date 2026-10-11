/**
 * Focused tests for shared matching predicates and consistency.
 *
 * Verifies:
 *   - Case-insensitive title matching
 *   - City/state matching
 *   - Remote, hybrid, and on-site preferences
 *   - Employment type
 *   - Consistency between match score and displayed reasons
 *
 * These tests are self-contained and can be run via the Base44 exec sandbox
 * (which evaluates matching.js after stripping its import line) or adapted
 * to Vitest/Jest by adding `import { … } from "./matching"`.
 */

// --- Test helpers --------------------------------------------------------

let _pass = 0;
let _fail = 0;
const _failures = [];

function assert(condition, message) {
  if (condition) {
    _pass++;
  } else {
    _fail++;
    _failures.push(message);
  }
}

function assertEqual(actual, expected, label) {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
  );
}

function runTests(matchingFns) {
  const { computeMatchLevel, getMatchReasons, getStructuredMatchReasons, computeMatchScore } = matchingFns;
  _pass = 0;
  _fail = 0;
  _failures.length = 0;

  // --- Shared test data -------------------------------------------------

  const baseJob = {
    job_title: "Registered Nurse",
    employer_name: "City Hospital",
    city: "Pittsburgh",
    state: "PA",
    employment_type: "Full-time",
    remote_type: "On-site",
    industry: "Healthcare",
    keywords: ["nursing", "patient care", "BLS"],
  };

  const basePrefs = {
    desired_job_titles: ["nurse", "RN"],
    desired_industries: ["healthcare"],
    employment_types: ["Full-time"],
    remote_preference: "No preference",
  };

  const baseProfile = {
    profile: { city: "Pittsburgh", state: "PA" },
    employmentRecords: [],
    educationRecords: [],
    skills: [],
    credentials: [],
    preferences: [basePrefs],
  };

  // --- 1. Case-insensitive title matching -------------------------------

  // Exact case
  assert(
    computeMatchLevel(baseJob, basePrefs, baseProfile) !== "Review Needed",
    "Title match (exact case): should not be Review Needed"
  );

  // Different case in job title
  const lowerJob = { ...baseJob, job_title: "registered nurse" };
  assert(
    computeMatchLevel(lowerJob, basePrefs, baseProfile) !== "Review Needed",
    "Title match (lowercase job title): should not be Review Needed"
  );

  // Different case in preference
  const upperPrefs = { ...basePrefs, desired_job_titles: ["NURSE", "rn"] };
  assert(
    computeMatchLevel(baseJob, upperPrefs, baseProfile) !== "Review Needed",
    "Title match (uppercase preference): should not be Review Needed"
  );

  // No title match — isolate title-only prefs (no other categories to score)
  const titleOnlyPrefs = { desired_job_titles: ["software engineer"] };
  const titleOnlyProfile = { profile: {} };
  assert(
    computeMatchLevel(baseJob, titleOnlyPrefs, titleOnlyProfile) === "Review Needed",
    "Title mismatch (isolated): should be Review Needed"
  );

  // --- 2. City / state matching -----------------------------------------

  // State match (same case)
  assert(
    computeMatchLevel(baseJob, basePrefs, baseProfile) !== "Review Needed",
    "State match (same case): should score"
  );

  // State match (different case — job has "pa", profile has "PA")
  const lowerStateJob = { ...baseJob, state: "pa" };
  const levelLower = computeMatchLevel(lowerStateJob, basePrefs, baseProfile);
  const levelUpper = computeMatchLevel(baseJob, basePrefs, baseProfile);
  assertEqual(levelLower, levelUpper, "State match case-insensitivity: levels should match");

  // City match (different case)
  const lowerCityJob = { ...baseJob, city: "pittsburgh" };
  const levelLowerCity = computeMatchLevel(lowerCityJob, basePrefs, baseProfile);
  assertEqual(levelLowerCity, levelUpper, "City match case-insensitivity: levels should match");

  // State mismatch
  const diffStateJob = { ...baseJob, state: "OH", city: "Columbus" };
  const levelDiffState = computeMatchLevel(diffStateJob, basePrefs, baseProfile);
  assert(
    levelDiffState !== "Strong Match" || levelUpper === "Strong Match",
    "State mismatch: should not be stronger than state match"
  );

  // --- 3. Remote, hybrid, on-site preferences ---------------------------

  // Remote only — job is Remote
  assert(
    computeMatchLevel(
      { ...baseJob, remote_type: "Remote" },
      { ...basePrefs, remote_preference: "Remote only" },
      baseProfile
    ) !== "Review Needed",
    "Remote only + Remote job: should score"
  );

  // Remote only — job is On-site: no remote reason should appear
  const remoteOnlyOnsiteReasons = getStructuredMatchReasons(
    { ...baseJob, remote_type: "On-site" },
    { ...basePrefs, remote_preference: "Remote only" },
    baseProfile
  );
  assert(
    !remoteOnlyOnsiteReasons.some((r) => r.category === "remote"),
    "Remote only + On-site job: should NOT produce a remote reason"
  );

  // Remote only — job is Remote: remote reason SHOULD appear
  const remoteOnlyRemoteReasons = getStructuredMatchReasons(
    { ...baseJob, remote_type: "Remote" },
    { ...basePrefs, remote_preference: "Remote only" },
    baseProfile
  );
  assert(
    remoteOnlyRemoteReasons.some((r) => r.category === "remote"),
    "Remote only + Remote job: should produce a remote reason"
  );

  // Hybrid preference — job is Hybrid (should match)
  const hybridPrefHybridReasons = getStructuredMatchReasons(
    { ...baseJob, remote_type: "Hybrid" },
    { ...basePrefs, remote_preference: "Hybrid" },
    baseProfile
  );
  assert(
    hybridPrefHybridReasons.some((r) => r.category === "remote"),
    "Hybrid pref + Hybrid job: should produce a remote reason"
  );

  // Hybrid preference — job is Remote (should NOT match)
  const hybridPrefRemoteReasons = getStructuredMatchReasons(
    { ...baseJob, remote_type: "Remote" },
    { ...basePrefs, remote_preference: "Hybrid" },
    baseProfile
  );
  assert(
    !hybridPrefRemoteReasons.some((r) => r.category === "remote"),
    "Hybrid pref + Remote job: should NOT produce a remote reason"
  );

  // On-site only — job is On-site (should match)
  const onsitePrefOnsiteReasons = getStructuredMatchReasons(
    { ...baseJob, remote_type: "On-site" },
    { ...basePrefs, remote_preference: "On-site only" },
    baseProfile
  );
  assert(
    onsitePrefOnsiteReasons.some((r) => r.category === "remote"),
    "On-site only + On-site job: should produce a remote reason"
  );

  // On-site only — job is Remote (should NOT match)
  const onsitePrefRemoteReasons = getStructuredMatchReasons(
    { ...baseJob, remote_type: "Remote" },
    { ...basePrefs, remote_preference: "On-site only" },
    baseProfile
  );
  assert(
    !onsitePrefRemoteReasons.some((r) => r.category === "remote"),
    "On-site only + Remote job: should NOT produce a remote reason"
  );

  // Remote preferred — Hybrid job (should match)
  const remotePrefHybridReasons = getStructuredMatchReasons(
    { ...baseJob, remote_type: "Hybrid" },
    { ...basePrefs, remote_preference: "Remote preferred" },
    baseProfile
  );
  assert(
    remotePrefHybridReasons.some((r) => r.category === "remote"),
    "Remote preferred + Hybrid job: should produce a remote reason"
  );

  // --- 4. Employment type -----------------------------------------------

  // Matching employment type
  assert(
    computeMatchLevel(baseJob, basePrefs, baseProfile) !== "Review Needed",
    "Employment type match: should score"
  );

  // Non-matching employment type
  const partTimePrefs = { ...basePrefs, employment_types: ["Part-time"] };
  const levelPartTime = computeMatchLevel(baseJob, partTimePrefs, baseProfile);
  const levelFullTime = computeMatchLevel(baseJob, basePrefs, baseProfile);
  assert(
    levelFullTime !== "Review Needed" || levelPartTime === "Review Needed",
    "Employment type: matching should not be weaker than non-matching"
  );

  // --- 5. Consistency between score and reasons --------------------------

  // getMatchReasons and getStructuredMatchReasons produce the same labels
  const structured = getStructuredMatchReasons(baseJob, basePrefs, baseProfile);
  const plain = getMatchReasons(baseJob, basePrefs, baseProfile);
  assertEqual(
    plain,
    structured.map((r) => r.label),
    "getMatchReasons should be a thin wrapper of getStructuredMatchReasons"
  );

  // Remote reason consistency: if structured reasons include a remote reason,
  // computeMatchLevel should also award a remote point (i.e. isRemoteMatch is true)
  const remoteJob = { ...baseJob, remote_type: "Remote" };
  const remotePrefs = { ...basePrefs, remote_preference: "Remote only" };
  const structuredRemote = getStructuredMatchReasons(remoteJob, remotePrefs, baseProfile);
  const hasRemoteReason = structuredRemote.some((r) => r.category === "remote");
  const levelRemote = computeMatchLevel(remoteJob, remotePrefs, baseProfile);
  assert(
    hasRemoteReason,
    "Remote match: structured reasons should include a remote reason"
  );
  assert(
    levelRemote !== "Review Needed",
    "Remote match: computeMatchLevel should not be Review Needed when remote reason is present"
  );

  // If no remote reason, computeMatchLevel should not award remote
  const onsiteJob = { ...baseJob, remote_type: "On-site" };
  const structuredOnsite = getStructuredMatchReasons(onsiteJob, remotePrefs, baseProfile);
  const noRemoteReason = !structuredOnsite.some((r) => r.category === "remote");
  assert(
    noRemoteReason,
    "Remote mismatch: structured reasons should NOT include a remote reason"
  );

  // Employment type reason consistency
  const structuredEmp = getStructuredMatchReasons(baseJob, basePrefs, baseProfile);
  const hasEmpReason = structuredEmp.some((r) => r.category === "employment_type");
  assert(hasEmpReason, "Employment type match: structured reasons should include it");

  const mismatchedEmpPrefs = { ...basePrefs, employment_types: ["Part-time"] };
  const structuredEmpMismatch = getStructuredMatchReasons(baseJob, mismatchedEmpPrefs, baseProfile);
  const noEmpReason = !structuredEmpMismatch.some((r) => r.category === "employment_type");
  assert(noEmpReason, "Employment type mismatch: structured reasons should NOT include it");

  // Title reason consistency
  const structuredTitle = getStructuredMatchReasons(baseJob, basePrefs, baseProfile);
  const hasTitleReason = structuredTitle.some((r) => r.category === "interests");
  assert(hasTitleReason, "Title match: structured reasons should include interests");

  const noTitlePrefs = { ...basePrefs, desired_job_titles: ["software engineer"] };
  const structuredNoTitle = getStructuredMatchReasons(baseJob, noTitlePrefs, baseProfile);
  const noTitleReason = !structuredNoTitle.some((r) => r.category === "interests");
  assert(noTitleReason, "Title mismatch: structured reasons should NOT include interests");

  // computeMatchScore uses shared predicates for career goals
  // (title, employment type, state, industry, remote)
  const scoreResult = computeMatchScore(baseJob, baseProfile);
  assert(
    scoreResult.level !== undefined && scoreResult.score !== undefined,
    "computeMatchScore: should return level and score"
  );

  // If remote matches, computeMatchScore career goals should count it
  const scoreRemote = computeMatchScore(remoteJob, {
    ...baseProfile,
    preferences: [remotePrefs],
  });
  const scoreNoRemote = computeMatchScore(onsiteJob, {
    ...baseProfile,
    preferences: [remotePrefs],
  });
  // The remote match should contribute to a higher or equal career goals score
  assert(
    scoreRemote.score >= scoreNoRemote.score,
    "computeMatchScore: remote match should not lower the score vs remote mismatch"
  );

  // --- Summary -----------------------------------------------------------
  const total = _pass + _fail;
  const result = {
    total,
    passed: _pass,
    failed: _fail,
    failures: _failures,
    allPassed: _fail === 0,
  };
  return result;
}

export { runTests };