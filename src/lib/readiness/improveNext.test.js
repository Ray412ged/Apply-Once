/**
 * Focused tests for the Improve Next recommendation builder.
 *
 * Verifies the spec scenarios:
 *   - References resolved with none added → "Add a Professional Reference"
 *     (not "Experience").
 *   - Education resolved → education-specific actionable recommendation.
 *   - Credentials resolved → credential-specific recommendation.
 *   - Thin employment record → "Add Responsibilities", not "Improve Experience".
 *   - No formal employment → "Other Meaningful Experience" without telling the
 *     user to gain more experience.
 *   - Fully strengthened profile → "Explore Your Job Matches".
 *   - Recommendations are always structured objects with a route.
 *
 * Self-contained: imports the pure builder + section-status constants.
 */

import { buildImproveNextRecommendations } from "./improveNext";
import { SECTION_STATUS } from "./constants";

let _pass = 0;
let _fail = 0;
const _failures = [];

function assert(cond, msg) {
  if (cond) _pass++;
  else { _fail++; _failures.push(msg); }
}

function firstId(recs) {
  return recs?.[0]?.id;
}

/** A fully-strengthened core + supporting baseline, overridden per scenario. */
function baseSnapshot(overrides = {}) {
  return {
    profile: {
      first_name: "Test",
      last_name: "User",
      email: "t@e.com",
      phone: "555-0100",
      city: "Pittsburgh",
      state: "PA",
      professional_summary:
        "Dependable team member with retail and food service experience ready to contribute.",
      ...overrides.profile,
    },
    employmentHistory: overrides.employmentHistory ?? [
      {
        employer_name: "Acme",
        job_title: "Crew Member",
        duties: "Ran register, stocked shelves, cleaned, prepped food.",
        accomplishments: "Employee of the month twice.",
        supervisor_name: "Pat",
      },
    ],
    education: overrides.education ?? [{ institution_name: "Community College", completed: true }],
    certifications: overrides.certifications ?? [{ credential_name: "ServSafe", active_status: true }],
    references: overrides.references ?? [{ full_name: "Sam", permission_confirmed: true }],
    skills: overrides.skills ?? [{ skill_name: "Customer Service" }, { skill_name: "Cash Handling" }, { skill_name: "Food Prep" }],
  };
}

/** Section statuses for a fully-strengthened profile, overridden per scenario. */
function baseStatuses(overrides = {}) {
  return {
    contact: { status: SECTION_STATUS.COMPLETE },
    summary: { status: SECTION_STATUS.COMPLETE },
    employment: { status: SECTION_STATUS.COMPLETE },
    skills: { status: SECTION_STATUS.COMPLETE },
    education: { status: SECTION_STATUS.COMPLETE },
    credentials: { status: SECTION_STATUS.COMPLETE },
    references: { status: SECTION_STATUS.COMPLETE },
    resume: { status: SECTION_STATUS.OPTIONAL },
    ...overrides,
  };
}

export function runTests() {
  _pass = 0; _fail = 0; _failures.length = 0;

  // --- 1. References resolved with none added → Add a Professional Reference
  const refsResolved = buildImproveNextRecommendations(
    baseSnapshot({ profile: { references_status: "dont_have" }, references: [] }),
    baseStatuses({ references: { status: SECTION_STATUS.NOT_APPLICABLE } })
  );
  assert(firstId(refsResolved) === "add-reference",
    `References resolved → add-reference (got ${firstId(refsResolved)})`);
  assert(refsResolved[0].title !== "Experience",
    "References resolved must NOT produce generic 'Experience' label");
  assert(refsResolved[0].route === "/profile/edit?section=references",
    "add-reference routes to references section");

  // --- 2. Education resolved with none added → Add Your Highest Grade or Training
  const eduResolved = buildImproveNextRecommendations(
    baseSnapshot({ profile: { education_level_answer: "none_declared" }, education: [] }),
    baseStatuses({ education: { status: SECTION_STATUS.NOT_APPLICABLE } })
  );
  assert(firstId(eduResolved) === "add-education",
    `Education resolved → add-education (got ${firstId(eduResolved)})`);
  assert(eduResolved[0].route === "/profile/edit?section=education",
    "add-education routes to education section");

  // --- 3. Credentials resolved with none added → Add a License or Certification
  const credResolved = buildImproveNextRecommendations(
    baseSnapshot({ profile: { credentials_status: "no" }, certifications: [] }),
    baseStatuses({ credentials: { status: SECTION_STATUS.NOT_APPLICABLE } })
  );
  assert(firstId(credResolved) === "add-credential",
    `Credentials resolved → add-credential (got ${firstId(credResolved)})`);
  assert(credResolved[0].route === "/profile/edit?section=credentials",
    "add-credential routes to credentials section");

  // --- 4. Thin employment record (no responsibilities) → Add Responsibilities
  const thinExp = buildImproveNextRecommendations(
    baseSnapshot({
      employmentHistory: [
        { employer_name: "Acme", job_title: "Crew", accomplishments: "Recognized for speed." },
      ],
    }),
    baseStatuses()
  );
  assert(firstId(thinExp) === "add-responsibilities",
    `Thin employment → add-responsibilities (got ${firstId(thinExp)})`);
  assert(thinExp[0].title !== "Experience" && !thinExp[0].title.includes("Improve"),
    "Thin employment must not produce 'Improve Experience'");

  // --- 5. No formal employment → Add Employment or Other Meaningful Experience
  const noExp = buildImproveNextRecommendations(
    baseSnapshot({ employmentHistory: [] }),
    baseStatuses({ employment: { status: SECTION_STATUS.NEEDS_ATTENTION } })
  );
  assert(firstId(noExp) === "add-experience",
    `No employment → add-experience (got ${firstId(noExp)})`);
  assert(/volunteer|caregiving|community|self-employment/i.test(noExp[0].description),
    "add-experience description references existing experience types");
  assert(!/gain more|obtain more|get more experience/i.test(noExp[0].description),
    "add-experience must not tell the user to gain more experience");

  // --- 6. Fully strengthened profile → Explore Your Job Matches
  const ready = buildImproveNextRecommendations(baseSnapshot(), baseStatuses());
  assert(firstId(ready) === "explore-jobs",
    `Fully strengthened → explore-jobs (got ${firstId(ready)})`);
  assert(ready.length === 1 && ready[0].route === "/jobs",
    "Ready state returns exactly one explore-jobs recommendation");

  // --- 7. Structural guarantees: every rec is an object with id/title/route
  const all = [refsResolved, eduResolved, credResolved, thinExp, noExp, ready].flat();
  for (const r of all) {
    assert(typeof r === "object" && r !== null, "Every recommendation is an object");
    assert(typeof r.id === "string" && typeof r.title === "string" && typeof r.route === "string",
      `Recommendation ${r.id} has id, title, route`);
    assert(!["Experience", "Education & Training", "References", "Skills", "Contact Information"].includes(r.title),
      `Recommendation title is not a generic category label: ${r.title}`);
  }

  // --- 8. Priority ordering: supporting-resolved beats thin-experience
  const mixed = buildImproveNextRecommendations(
    baseSnapshot({
      profile: { references_status: "dont_have" },
      references: [],
      employmentHistory: [{ employer_name: "Acme", job_title: "Crew" }],
    }),
    baseStatuses({ references: { status: SECTION_STATUS.NOT_APPLICABLE } })
  );
  assert(firstId(mixed) === "add-reference",
    `Supporting-resolved (references) prioritized over thin experience (got ${firstId(mixed)})`);

  return {
    total: _pass + _fail,
    passed: _pass,
    failed: _fail,
    failures: _failures,
    allPassed: _fail === 0,
  };
}

// Self-run when executed directly in the sandbox.
if (typeof window === "undefined") {
  try {
    const result = runTests();
    // eslint-disable-next-line no-console
    console.log("[improveNext.test]", JSON.stringify(result));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[improveNext.test] crashed:", err);
  }
}