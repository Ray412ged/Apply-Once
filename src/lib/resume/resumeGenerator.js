/**
 * Resume Generator
 * ============================================================
 * Transforms an Employment Profile snapshot into ONE normalized,
 * ATS-friendly resume model. The Employment Profile remains the
 * single source of truth — this module performs NO database access
 * and stores NO duplicate resume content. It is a pure transform.
 *
 * Input: the standardized profile data shape produced by
 * useProfileData() (or a pre-built snapshot). Both the legacy
 * shape (employmentRecords, educationRecords, credentials) and the
 * canonical shape (employmentHistory, education, certifications)
 * are accepted.
 *
 * Output:
 *   {
 *     contact: { fullName, email, phone, city, state },
 *     professionalSummary,
 *     skills: [string],
 *     employment: [{ title, employer, location, dates, current, bullets }],
 *     education: [{ institution, location, degree, field, year, status }],
 *     certifications: [{ name, issuingOrganization, expiration, active }],
 *     canGenerate,      // boolean — enough content for a useful resume
 *     signature,         // stable hash for "Updated" detection
 *   }
 *
 * Sensitive information (criminal history, disability, demographics,
 * references, internal notes, salary, supervisor contact, reason for
 * leaving) is NEVER included.
 */

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const NONE_EDUCATION_ANSWERS = ["none_declared", "No High School Diploma or GED"];

// Skills cap — "a practical number of relevant skills, such as 8–15".
const MAX_SKILLS = 15;

// ─── Small text helpers ─────────────────────────────────────────────────────

function trim(v) {
  return (v == null ? "" : String(v)).trim();
}

function formatLocation(city, state) {
  const c = trim(city);
  const s = trim(state);
  if (c && s) return `${c}, ${s}`;
  return c || s || "";
}

/** Normalizes a month value (name or 1–12 number string) to a month name. */
function monthToName(month) {
  const m = trim(month);
  if (!m) return "";
  if (/^\d{1,2}$/.test(m)) {
    const idx = parseInt(m, 10) - 1;
    return MONTH_NAMES[idx] || "";
  }
  // Already a name (or partial) — title-case it.
  const found = MONTH_NAMES.find((n) => n.toLowerCase() === m.toLowerCase());
  return found || m;
}

function formatMonthYear(month, year) {
  const m = monthToName(month);
  const y = trim(year);
  return [m, y].filter(Boolean).join(" ");
}

function formatDateRange(rec) {
  const start = formatMonthYear(rec.start_month, rec.start_year);
  const end = rec.currently_employed
    ? "Present"
    : formatMonthYear(rec.end_month, rec.end_year);
  if (start && end) return `${start} – ${end}`;
  if (start) return `${start} – Present`;
  if (end && end !== "Present") return end;
  return "";
}

function formatName(profile) {
  const first = trim(profile.first_name);
  const middle = trim(profile.middle_name);
  const last = trim(profile.last_name);
  const full = [first, middle, last].filter(Boolean).join(" ").trim();
  if (full) return full;
  return trim(profile.preferred_name);
}

/**
 * Converts a paragraph of responsibilities/accomplishments into concise
 * bullet points WITHOUT changing factual meaning. Splits on newlines,
 * bullet glyphs, and semicolons — never invents new content.
 */
function toBullets(text) {
  if (!text) return [];
  return String(text)
    .split(/\r?\n|\u2022|•|;\s*/)
    .map((s) => s.replace(/^[-–—\s]+/, "").trim())
    .filter(Boolean);
}

function normalizeSkillName(name) {
  const clean = trim(name).replace(/\s+/g, " ");
  if (!clean) return "";
  // Capitalize the first letter of each word; leave the rest as entered
  // (preserves acronyms like "POS" and proper nouns).
  return clean.replace(/\b([a-zA-Z])/g, (m, c) => c.toUpperCase());
}

/** A skill belongs on the resume if the user entered/confirmed it.
 *  Unreviewed inferences (source "Inferred" && not confirmed) are excluded. */
function isResumeWorthySkill(skill) {
  if (!skill || !trim(skill.skill_name)) return false;
  const source = trim(skill.source);
  if (source === "Inferred" && !skill.confirmed_by_user) return false;
  return true;
}

// ─── Reverse-chronological sort ─────────────────────────────────────────────

function recordSortValue(rec) {
  const year = rec.currently_employed ? 9999 : parseInt(rec.start_year, 10) || 0;
  const monthNum = parseInt(rec.start_month, 10) || 0;
  return [rec.currently_employed ? 1 : 0, year, monthNum];
}

function sortByRecent(records) {
  return [...records].sort((a, b) => {
    const av = recordSortValue(a);
    const bv = recordSortValue(b);
    return bv[0] - av[0] || bv[1] - av[1] || bv[2] - av[2];
  });
}

// ─── Entry builders ──────────────────────────────────────────────────────────

function buildEmploymentEntry(rec) {
  const bullets = [];
  // Accomplishments are prioritized above routine duties.
  toBullets(rec.accomplishments).forEach((b) => bullets.push(b));
  toBullets(rec.duties).forEach((b) => bullets.push(b));
  [
    ...(rec.responsibilities_selected || []),
    ...(rec.responsibilities_custom || []),
  ].forEach((b) => {
    const v = trim(b);
    if (v) bullets.push(v);
  });

  return {
    title: trim(rec.job_title),
    employer: trim(rec.employer_name),
    location: formatLocation(rec.city, rec.state),
    dates: formatDateRange(rec),
    current: !!rec.currently_employed,
    bullets,
    // NOTE: supervisor contact, phone, reason for leaving, salary,
    // permission status, and internal notes are intentionally excluded.
  };
}

function buildEducationEntry(rec) {
  const degree = trim(rec.degree_or_credential);
  const field = trim(rec.field_of_study);
  const year = trim(rec.graduation_year) || (rec.graduation_date
    ? String(new Date(rec.graduation_date).getFullYear())
    : "");
  let status = year;
  if (rec.completed === false && !year) status = "In progress";
  else if (rec.completed === false) status = `${year} (in progress)`;
  return {
    institution: trim(rec.institution_name),
    location: formatLocation(rec.city, rec.state),
    degree,
    field,
    year,
    status,
  };
}

function buildCertificationEntry(rec) {
  const expDate = rec.expiration_date ? new Date(rec.expiration_date) : null;
  const expiration = expDate && !isNaN(expDate)
    ? expDate.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "";
  return {
    name: trim(rec.credential_name),
    issuingOrganization: trim(rec.issuing_organization),
    credentialType: trim(rec.credential_type),
    expiration,
    active: rec.active_status !== false, // default true
  };
}

// ─── Stable signature for "Updated" detection ───────────────────────────────

function djb2Hash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & 0xffffffff;
  }
  return (hash >>> 0).toString(36);
}

function computeSignature(resume) {
  const payload = {
    contact: resume.contact,
    professionalSummary: resume.professionalSummary,
    skills: resume.skills,
    employment: resume.employment,
    education: resume.education,
    certifications: resume.certifications,
  };
  return djb2Hash(JSON.stringify(payload));
}

// ─── Canonical entry point ──────────────────────────────────────────────────

/**
 * Generates a normalized resume model from profile data.
 *
 * @param {object} raw — profile data (useProfileData shape or snapshot)
 * @param {object} [opts] — { transferableSkills?: [] }
 * @returns {ResumeModel}
 */
export function generateResume(raw, opts = {}) {
  if (!raw) return emptyResume();

  // Normalize both legacy and canonical shapes without depending on the
  // readiness engine's internal snapshot builder.
  const profile = raw.profile || null;
  const employmentHistory = raw.employmentHistory || raw.employmentRecords || [];
  const education = raw.education || raw.educationRecords || [];
  const certifications = raw.certifications || raw.credentials || [];
  const manualSkills = raw.skills || [];
  const transferableSkills = opts.transferableSkills || raw.transferableSkills || [];

  const contact = {
    fullName: profile ? formatName(profile) : "",
    email: profile ? trim(profile.email) : "",
    phone: profile ? trim(profile.phone) : "",
    city: profile ? trim(profile.city) : "",
    state: profile ? trim(profile.state) : "",
  };

  const professionalSummary = profile ? trim(profile.professional_summary) : "";

  // Skills: manual + confirmed transferable, deduped, capped.
  const mergedSkills = [...manualSkills, ...transferableSkills]
    .filter(isResumeWorthySkill);
  const seen = new Set();
  const skills = [];
  for (const s of mergedSkills) {
    const name = normalizeSkillName(s.skill_name);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    skills.push(name);
    if (skills.length >= MAX_SKILLS) break;
  }

  const employment = sortByRecent(
    employmentHistory.map(buildEmploymentEntry).filter((e) => e.title || e.employer)
  );

  const educationRecords = (education || []).map(buildEducationEntry).filter((e) => e.institution);

  // If the user resolved Education with nothing to add, the section is
  // omitted cleanly — no "None" / "Not applicable" placeholders.
  const educationSection =
    educationRecords.length > 0 || !NONE_EDUCATION_ANSWERS.includes(profile?.education_level_answer)
      ? educationRecords
      : [];

  const certificationsSection = (certifications || [])
    .map(buildCertificationEntry)
    .filter((c) => c.name);

  const resume = {
    contact,
    professionalSummary,
    skills,
    employment,
    education: educationSection,
    certifications: certificationsSection,
  };

  resume.canGenerate = canGenerateResume(resume);
  resume.signature = computeSignature(resume);
  return resume;
}

/**
 * Whether enough content exists to produce a useful resume.
 * Requires name, at least one contact method, at least one experience
 * record, and at least three skills. Summary, education, and
 * certifications strengthen but do not block creation.
 */
export function canGenerateResume(resume) {
  if (!resume) return false;
  return (
    !!resume.contact?.fullName &&
    !!(resume.contact?.email || resume.contact?.phone) &&
    resume.employment?.length > 0 &&
    resume.skills?.length >= 3
  );
}

function emptyResume() {
  const resume = {
    contact: { fullName: "", email: "", phone: "", city: "", state: "" },
    professionalSummary: "",
    skills: [],
    employment: [],
    education: [],
    certifications: [],
  };
  resume.canGenerate = false;
  resume.signature = "";
  return resume;
}

export { MAX_SKILLS };