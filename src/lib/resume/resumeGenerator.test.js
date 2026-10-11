/**
 * Standalone tests for the resume generator (self-contained, runs in the
 * exec sandbox by importing the pure module). Covers the spec scenarios:
 *   - Experienced user: reverse-chron order, clean formatting, sensitive
 *     fields excluded.
 *   - First-time applicant (no formal employment): volunteer/school
 *     experience, skills — resume still complete and respectful.
 *   - Resolved optional sections (no education / no certifications) are
 *     omitted rather than shown as missing.
 *   - resumeCanGenerate threshold.
 */

import { generateResume, canGenerateResume } from "./resumeGenerator";

let _pass = 0, _fail = 0;
const _failures = [];
function assert(cond, msg) { if (cond) _pass++; else { _fail++; _failures.push(msg); } }

function experiencedInput() {
  return {
    profile: {
      first_name: "Maria", last_name: "Gomez", email: "maria@example.com", phone: "412-555-0100",
      city: "Pittsburgh", state: "PA", professional_summary: "Dependable crew lead with five years of retail and food service experience.",
    },
    employmentRecords: [
      {
        job_title: "Shift Supervisor", employer_name: "Acme Markets", city: "Pittsburgh", state: "PA",
        start_month: "3", start_year: "2022", end_month: "", end_year: "", currently_employed: true,
        duties: "Supervised five crew members; ran the register during peak hours; trained new hires.",
        accomplishments: "Cut closing time by 30 minutes by reorganizing the stocking workflow.",
        supervisor_name: "Pat Lee", supervisor_phone: "412-555-0000", reason_for_leaving: "n/a",
        starting_pay: "$14", ending_pay: "$18", additional_notes: "internal note: favorite employee",
      },
      {
        job_title: "Cashier", employer_name: "Corner Store", city: "Pittsburgh", state: "PA",
        start_month: "January", start_year: "2019", end_month: "February", end_year: "2022",
        currently_employed: false, duties: "Ran register; stocked shelves; greeted customers.",
        accomplishments: "",
      },
    ],
    skills: [
      { skill_name: "customer service", source: "User Entered" },
      { skill_name: "cash handling", source: "User Entered" },
      { skill_name: "team leadership", source: "User Entered" },
      { skill_name: "POS", source: "User Entered" },
      { skill_name: "Inferred Unreviewed Skill", source: "Inferred", confirmed_by_user: false },
    ],
    educationRecords: [
      { institution_name: "Community College of Allegheny County", degree_or_credential: "Associate of Science", field_of_study: "Business", graduation_year: "2018", completed: true },
    ],
    credentials: [
      { credential_name: "ServSafe Food Handler", issuing_organization: "National Restaurant Association", active_status: true, expiration_date: "2027-01-01" },
    ],
  };
}

function firstTimeInput() {
  return {
    profile: {
      first_name: "Devon", last_name: "Reed", email: "devon@example.com",
      city: "Pittsburgh", state: "PA", professional_summary: "",
    },
    employmentRecords: [
      { job_title: "Volunteer", employer_name: "Community Food Bank", experience_type: "Volunteer work",
        duties: "Sorted and packed food orders for distribution.", currently_employed: true, start_year: "2024", start_month: "6" },
    ],
    skills: [
      { skill_name: "teamwork", source: "User Entered" },
      { skill_name: "organization", source: "User Entered" },
      { skill_name: "reliability", source: "User Entered" },
    ],
    educationRecords: [],
  };
}

export function runTests() {
  _pass = 0; _fail = 0; _failures.length = 0;

  // 1. Experienced user
  const r1 = generateResume(experiencedInput());
  assert(r1.contact.fullName === "Maria Gomez", `fullName: ${r1.contact.fullName}`);
  assert(r1.canGenerate === true, "experienced canGenerate");
  // reverse-chronological: supervisor role (current) first
  assert(r1.employment[0].title === "Shift Supervisor", "first job is the current supervisor role");
  assert(r1.employment[1].title === "Cashier", "second job is cashier");
  // sensitive fields excluded
  const firstBullets = r1.employment[0].bullets.join(" ");
  assert(!firstBullets.includes("Pat Lee") && !firstBullets.includes("$14") && !firstBullets.includes("favorite employee"),
    "supervisor name, salary, and internal notes excluded from bullets");
  assert(!r1.employment[0].dates.includes("undefined"), `dates formatted: '${r1.employment[0].dates}'`);
  assert(r1.employment[1].dates.includes("January 2019"), `second job start date: '${r1.employment[1].dates}'`);
  // unreviewed inferred skill excluded
  assert(!r1.skills.some((s) => s.includes("Inferred Unreviewed")), "unreviewed inferred skill excluded");
  assert(r1.skills.some((s) => s === "Customer Service"), "skills normalized to title case");
  // education + certs present
  assert(r1.education.length === 1 && r1.certifications.length === 1, "education + certifications present");
  assert(r1.certifications[0].expiration, "certification expiration formatted");

  // 2. First-time applicant (no formal employment, volunteer only)
  const r2 = generateResume(firstTimeInput());
  assert(r2.canGenerate === true, "first-time canGenerate (volunteer counts as experience)");
  assert(r2.employment.length === 1 && r2.employment[0].title === "Volunteer", "volunteer experience included");
  assert(!r2.professionalSummary, "blank summary omitted (empty string, not invented)");
  // education resolved with none added → omitted
  const r3 = generateResume({ ...firstTimeInput(), profile: { ...firstTimeInput().profile, education_level_answer: "none_declared" }, credentials: [] });
  assert(r3.education.length === 0, "resolved education omitted");
  assert(r3.certifications.length === 0, "no certifications → omitted");
  // no "None"/"Not applicable" placeholders leak into the model
  const modelStr = JSON.stringify(r3);
  assert(!/None|Not applicable|No education added/i.test(modelStr), "no missing-section placeholders");

  // 3. Threshold: below minimum
  const r4 = generateResume({ profile: { first_name: "A", last_name: "B" }, employmentRecords: [], skills: [] });
  assert(r4.canGenerate === false, "no experience/skills → not ready");
  const r5 = generateResume({ profile: { first_name: "A", last_name: "B", email: "a@b.com" }, employmentRecords: [{ job_title: "X", employer_name: "Y" }], skills: [{ skill_name: "one", source: "User Entered" }, { skill_name: "two", source: "User Entered" }] });
  assert(r5.canGenerate === false, "two skills → not ready (need 3)");
  const r6 = generateResume({ profile: { first_name: "A", last_name: "B", email: "a@b.com" }, employmentRecords: [{ job_title: "X", employer_name: "Y" }], skills: [{ skill_name: "one", source: "User Entered" }, { skill_name: "two", source: "User Entered" }, { skill_name: "three", source: "User Entered" }] });
  assert(r6.canGenerate === true, "name + contact + 1 experience + 3 skills → ready");

  // 4. Signature changes when content changes (for "Updated" detection)
  const sigA = generateResume(experiencedInput()).signature;
  const sigB = generateResume({ ...experiencedInput(), profile: { ...experiencedInput().profile, first_name: "Maria2" } }).signature;
  assert(sigA && sigA === generateResume(experiencedInput()).signature, "signature stable for identical input");
  assert(sigA !== sigB, "signature changes when content changes");

  // 5. Sensitive categories never appear anywhere
  const sensitiveBlob = JSON.stringify(generateResume({
    profile: { first_name: "X", last_name: "Y", email: "x@y.com" },
    employmentRecords: [{ job_title: "Crew", employer_name: "Z", duties: "work", reason_for_leaving: "terminated", supervisor_name: "Boss", supervisor_phone: "555" }],
    skills: [{ skill_name: "a", source: "User Entered" }, { skill_name: "b", source: "User Entered" }, { skill_name: "c", source: "User Entered" }],
  }));
  assert(!/criminal|disability|demographic|reference|supervisor|reason for leaving|salary/i.test(sensitiveBlob),
    "no sensitive categories in resume model");

  return { total: _pass + _fail, passed: _pass, failed: _fail, failures: _failures, allPassed: _fail === 0 };
}

if (typeof window === "undefined") {
  try {
    const r = runTests();
    console.log("[resumeGenerator.test]", JSON.stringify(r));
  } catch (err) {
    console.error("[resumeGenerator.test] crashed:", err);
  }
}