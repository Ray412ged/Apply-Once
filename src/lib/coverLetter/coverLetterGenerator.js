/**
 * Cover Letter Generator
 * ============================================================
 * Pure transform: Employment Profile + Job Posting → a concise,
 * professional, job-tailored cover letter model. No database access,
 * no duplicate storage, no AI calls. The Employment Profile and the
 * JobPosting remain the single sources of truth.
 *
 * Output:
 *   {
 *     dateLine, greeting, paragraphs: [string], closing, signOff,
 *     name, contactLine, canGenerate, signature, toText()
 *   }
 *
 * Sensitive information (criminal history, disability, demographics,
 * references, supervisor contact, reason for leaving, salary) is
 * NEVER included — same exclusion rules as the resume generator.
 */

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

// ─── Small text helpers ──────────────────────────────────────────────────────

function trim(v) {
  return (v == null ? "" : String(v)).trim();
}

function formatName(profile) {
  const first = trim(profile.first_name);
  const middle = trim(profile.middle_name);
  const last = trim(profile.last_name);
  const full = [first, middle, last].filter(Boolean).join(" ").trim();
  return full || trim(profile.preferred_name);
}

function formatLocation(city, state) {
  const c = trim(city);
  const s = trim(state);
  if (c && s) return `${c}, ${s}`;
  return c || s || "";
}

/** Returns the first sentence of a block of text (ending at the first ". "),
 *  ensured to end with a period. Empty string if none. */
function firstSentence(text) {
  const t = trim(text);
  if (!t) return "";
  const match = t.match(/^(.+?[.!?])\s/);
  const s = match ? match[1] : t;
  return / [.!?]$/.test(s) || /[.!?]$/.test(s) ? s : `${s}.`;
}

/** Title-cases a skill name (preserves acronyms/proper nouns by casing each word's first letter). */
function normalizeSkillName(name) {
  const clean = trim(name).replace(/\s+/g, " ");
  if (!clean) return "";
  return clean.replace(/\b([a-zA-Z])/g, (m, c) => c.toUpperCase());
}

// ─── Employment selection ────────────────────────────────────────────────────

function pickMostRecent(employment) {
  if (!employment || employment.length === 0) return null;
  return [...employment].sort((a, b) => {
    const ay = a.currently_employed ? 9999 : parseInt(a.start_year, 10) || 0;
    const by = b.currently_employed ? 9999 : parseInt(b.start_year, 10) || 0;
    return by - ay;
  })[0];
}

// ─── Stable signature ───────────────────────────────────────────────────────

function djb2Hash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & 0xffffffff;
  }
  return (hash >>> 0).toString(36);
}

// ─── Canonical entry point ──────────────────────────────────────────────────

/**
 * @param {object} profileData — useProfileData shape or snapshot
 * @param {object} job — JobPosting record
 * @returns {CoverLetterModel}
 */
export function generateCoverLetter(profileData, job) {
  if (!profileData || !job) return emptyLetter();

  const profile = profileData.profile || null;
  if (!profile) return emptyLetter();

  const employment = profileData.employmentHistory || profileData.employmentRecords || [];
  const skills = (profileData.skills || [])
    .filter((s) => {
      if (!trim(s.skill_name)) return false;
      const source = trim(s.source);
      if (source === "Inferred" && !s.confirmed_by_user) return false;
      return true;
    })
    .map((s) => normalizeSkillName(s.skill_name))
    .filter(Boolean);
  const summary = trim(profile.professional_summary);
  const strengthStatement = trim(profile.strength_statement);

  const name = formatName(profile);
  const email = trim(profile.email);
  const phone = trim(profile.phone);
  const profileLocation = formatLocation(profile.city, profile.state);

  const jobTitle = trim(job.job_title);
  const employer = trim(job.employer_name);
  const jobLocation = formatLocation(job.city, job.state);

  const today = new Date();
  const dateLine = `${MONTH_NAMES[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;

  const greeting = employer
    ? `Dear ${employer} Hiring Team,`
    : "Dear Hiring Manager,";

  // Paragraph 1 — opening / interest
  const locationPhrase = jobLocation ? ` in ${jobLocation}` : "";
  const employerPhrase = employer ? ` at ${employer}` : "";
  const p1 = `I am writing to express my interest in the ${jobTitle || "open"} position${employerPhrase}${locationPhrase}. I am confident my background and dedication would make me a valuable addition to your team.`;

  // Paragraph 2 — experience / fit
  const mostRecent = pickMostRecent(employment);
  const fitParts = [];
  if (mostRecent) {
    fitParts.push(`Most recently, I served as ${trim(mostRecent.job_title)}${trim(mostRecent.employer_name) ? ` at ${trim(mostRecent.employer_name)}` : ""}.`);
  }
  if (skills.length > 0) {
    const listed = skills.slice(0, 4).join(", ");
    fitParts.push(`I bring strong skills in ${listed}.`);
  }
  if (mostRecent) {
    const duties = firstSentence(mostRecent.duties);
    if (duties) fitParts.push(duties);
  }
  if (fitParts.length === 0 && summary) {
    fitParts.push(firstSentence(summary));
  }
  const p2 = fitParts.join(" ") || `I am eager to learn and ready to contribute to ${employer || "your organization"}.`;

  // Paragraph 3 — value / strengths
  const valueSource = strengthStatement || summary;
  const p3 = valueSource
    ? `${firstSentence(valueSource)} I would welcome the chance to bring that same commitment to ${employer || "your team"}.`
    : `I take pride in my work and would welcome the opportunity to contribute to ${employer || "your organization"}.`;

  // Closing
  const reachParts = [];
  if (email) reachParts.push(email);
  if (phone) reachParts.push(phone);
  const reachLine = reachParts.length > 0 ? ` You can reach me at ${reachParts.join(" or ")}.` : "";
  const closing = `Thank you for considering my application. I would welcome the opportunity to discuss how my background aligns with the ${jobTitle || "role"}${employer ? ` at ${employer}` : ""}.${reachLine}`;

  const signOff = "Sincerely,";
  const contactLine = [email, phone, profileLocation].filter(Boolean).join(" | ");

  const letter = {
    dateLine,
    greeting,
    paragraphs: [p1, p2, p3],
    closing,
    signOff,
    name,
    contactLine,
  };

  letter.canGenerate = canGenerateLetter({ name, email, phone, employment, skills, summary });
  letter.signature = djb2Hash(JSON.stringify({
    dateLine: today.toDateString(),
    greeting, paragraphs: letter.paragraphs, closing, signOff, name,
  }));
  letter.toText = () => [
    letter.dateLine,
    letter.greeting,
    ...letter.paragraphs,
    letter.closing,
    `${letter.signOff}\n${letter.name}`,
  ].join("\n\n");

  return letter;
}

function canGenerateLetter({ name, email, phone, employment, skills, summary }) {
  return (
    !!name &&
    (!!email || !!phone) &&
    ((employment && employment.length > 0) || (skills && skills.length > 0) || !!summary)
  );
}

function emptyLetter() {
  const letter = {
    dateLine: "",
    greeting: "",
    paragraphs: [],
    closing: "",
    signOff: "",
    name: "",
    contactLine: "",
  };
  letter.canGenerate = false;
  letter.signature = "";
  letter.toText = () => "";
  return letter;
}

export { MONTH_NAMES };