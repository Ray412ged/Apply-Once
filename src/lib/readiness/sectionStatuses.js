/**
 * Section Status Evaluator — the canonical source of truth for
 * per-section profile status with applicable scoring support.
 *
 * Each section returns one of:
 *   Complete | Needs Attention | In Progress | Optional | Not Applicable
 *
 * Optional sections (education, credentials, references, resume, questions)
 * are "applicable" only when they contain data. When Not Applicable or
 * unaddressed (Optional), they are excluded from the readiness score so
 * users are never penalized for legitimately lacking optional information.
 *
 * This module is a leaf node — it imports only from constants and
 * transferableSkills (both leaves). No cross-module dependencies.
 */

import { SECTION_STATUS } from "./constants";
import { mergeSkills, identifyTransferableSkills } from "./transferableSkills";

const SECTION_META = {
  contact:     { label: "Contact Information",   icon: "User",          route: "/profile/edit?section=about",        optional: false },
  summary:     { label: "Professional Summary",  icon: "FileText",      route: "/profile/edit?section=introduction", optional: false },
  employment:  { label: "Employment History",    icon: "Briefcase",     route: "/profile/edit?section=employment",  optional: false },
  skills:      { label: "Skills",                icon: "Wrench",         route: "/profile/edit?section=skills",       optional: false },
  education:   { label: "Education",             icon: "GraduationCap", route: "/profile/edit?section=education",    optional: true },
  credentials: { label: "Credentials",           icon: "Award",          route: "/profile/edit?section=credentials",  optional: true },
  references:  { label: "References",            icon: "Users",          route: "/profile/edit?section=references",   optional: true },
  resume:      { label: "Resume",                icon: "FileText",       route: "/profile/edit?section=documents",    optional: true },
};

const NO_EDUCATION_LEVELS = ["No High School Diploma or GED"];

/**
 * Evaluates every profile section and returns a map of section-key → status.
 *
 * @param {EmploymentProfileSnapshot} snapshot
 * @returns {Record<string, SectionStatus>}
 */
export function evaluateSections(snapshot) {
  if (!snapshot) return {};

  const {
    profile,
    employmentHistory = [],
    education = [],
    skills = [],
    certifications = [],
    references = [],
    documents = [],
  } = snapshot;

  const transferable = identifyTransferableSkills(employmentHistory);
  const allSkills = mergeSkills(skills, transferable);

  return {
    contact: evaluateContact(profile),
    summary: evaluateSummary(profile),
    employment: evaluateEmployment(employmentHistory),
    skills: evaluateSkills(allSkills, transferable),
    education: evaluateEducation(profile, education),
    credentials: evaluateCredentials(profile, certifications),
    references: evaluateReferences(profile, references),
    resume: evaluateResume(documents),
  };
}

function makeStatus(meta, status, detail, count, applicable) {
  return { ...meta, status, detail, count, applicable };
}

function evaluateContact(profile) {
  const meta = SECTION_META.contact;
  if (!profile) return makeStatus(meta, SECTION_STATUS.NEEDS_ATTENTION, "Not started", 0, true);
  const parts = [profile.first_name, profile.last_name, profile.email, profile.phone, profile.city, profile.state].filter(Boolean);
  if (parts.length >= 5) return makeStatus(meta, SECTION_STATUS.COMPLETE, "All contact info added", null, true);
  if (parts.length > 0) return makeStatus(meta, SECTION_STATUS.IN_PROGRESS, `${parts.length} of 6 fields added`, parts.length, true);
  return makeStatus(meta, SECTION_STATUS.NEEDS_ATTENTION, "Not started", 0, true);
}

function evaluateSummary(profile) {
  const meta = SECTION_META.summary;
  if (!profile) return makeStatus(meta, SECTION_STATUS.NEEDS_ATTENTION, "Not completed", null, true);
  if (profile.professional_summary?.trim()) return makeStatus(meta, SECTION_STATUS.COMPLETE, "Completed", null, true);
  if (profile.interview_introduction?.trim()) return makeStatus(meta, SECTION_STATUS.IN_PROGRESS, "Interview intro added", null, true);
  return makeStatus(meta, SECTION_STATUS.NEEDS_ATTENTION, "Not completed", null, true);
}

function evaluateEmployment(employmentHistory) {
  const meta = SECTION_META.employment;
  const count = employmentHistory.length;
  if (count > 0) return makeStatus(meta, SECTION_STATUS.COMPLETE, `${count} ${count === 1 ? "Experience" : "Experiences"} Added`, count, true);
  return makeStatus(meta, SECTION_STATUS.NEEDS_ATTENTION, "No experience added yet", 0, true);
}

function evaluateSkills(allSkills, transferable) {
  const meta = SECTION_META.skills;
  const count = allSkills.length;
  const transferableCount = transferable.length;
  if (count >= 3) {
    const detail = transferableCount > 0
      ? `${count} Skills Identified (${transferableCount} transferable)`
      : `${count} Skills Identified`;
    return makeStatus(meta, SECTION_STATUS.COMPLETE, detail, count, true);
  }
  if (count > 0) return makeStatus(meta, SECTION_STATUS.IN_PROGRESS, `${count} Skills Identified`, count, true);
  return makeStatus(meta, SECTION_STATUS.NEEDS_ATTENTION, "No skills added", 0, true);
}

function evaluateEducation(profile, educationRecords) {
  const meta = SECTION_META.education;
  const answer = profile?.education_level_answer;
  const count = educationRecords.length;

  // "none_declared" is the explicit none path for the profile flow; it stays
  // excluded from Application Readiness (non-weighted), like "No High School
  // Diploma or GED".
  const isNoneDeclaration =
    (answer && NO_EDUCATION_LEVELS.includes(answer)) || answer === "none_declared";
  if (isNoneDeclaration && count === 0) {
    return makeStatus(meta, SECTION_STATUS.NOT_APPLICABLE, "No education added", 0, false);
  }
  if (answer || count > 0) {
    const detail = count > 0
      ? `${count} Education ${count === 1 ? "Entry" : "Entries"} Added`
      : answer;
    return makeStatus(meta, SECTION_STATUS.COMPLETE, detail, count, true);
  }
  return makeStatus(meta, SECTION_STATUS.OPTIONAL, "No education added", 0, false);
}

function evaluateCredentials(profile, credentials) {
  const meta = SECTION_META.credentials;
  const answer = profile?.credentials_status;
  const count = credentials.length;

  if (answer === "no" && count === 0) {
    return makeStatus(meta, SECTION_STATUS.NOT_APPLICABLE, "None added", 0, false);
  }
  if (count > 0) {
    return makeStatus(meta, SECTION_STATUS.COMPLETE, `${count} ${count === 1 ? "Credential" : "Credentials"} Added`, count, true);
  }
  if (answer === "yes" || answer === "later") {
    return makeStatus(meta, SECTION_STATUS.IN_PROGRESS, "None added yet", 0, true);
  }
  return makeStatus(meta, SECTION_STATUS.OPTIONAL, "None added", 0, false);
}

function evaluateReferences(profile, references) {
  const meta = SECTION_META.references;
  const answer = profile?.references_status;
  const count = references.length;

  if (answer === "dont_have" && count === 0) {
    return makeStatus(meta, SECTION_STATUS.NOT_APPLICABLE, "Not added", 0, false);
  }
  if (count > 0) {
    return makeStatus(meta, SECTION_STATUS.COMPLETE, `${count} ${count === 1 ? "Reference" : "References"} Added`, count, true);
  }
  if (answer === "yes" || answer === "later") {
    return makeStatus(meta, SECTION_STATUS.IN_PROGRESS, "Not added yet", 0, true);
  }
  return makeStatus(meta, SECTION_STATUS.OPTIONAL, "Not added", 0, false);
}

function evaluateResume(documents) {
  const meta = SECTION_META.resume;
  const hasResume = documents.some((d) => d.document_type === "Resume");
  if (hasResume) return makeStatus(meta, SECTION_STATUS.COMPLETE, "Resume uploaded", 1, true);
  return makeStatus(meta, SECTION_STATUS.OPTIONAL, "Not uploaded", 0, false);
}