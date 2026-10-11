/**
 * Sub-score evaluators for the Employment Intelligence Engine.
 *
 * Each function evaluates one readiness category and returns a 0–100 score.
 * The main engine applies configurable weights to these sub-scores.
 *
 * This module ONLY calculates scores — no recommendations, no UI logic,
 * no dashboard logic.
 *
 * Functions accept either a legacy profileData object (with employmentRecords,
 * educationRecords, credentials) or a canonical snapshot (with
 * employmentHistory, education, certifications).
 */

import { mergeSkills, identifyTransferableSkills } from "./transferableSkills";

export function scoreContact(profile) {
  if (!profile) return 0;
  const parts = [profile.email, profile.phone, profile.city, profile.state, profile.postal_code].filter(Boolean);
  return Math.min(100, Math.round((parts.length / 5) * 100));
}

export function scoreSummary(profile) {
  if (!profile) return 0;
  const summary = profile.professional_summary?.trim();
  const intro = profile.interview_introduction?.trim();
  if (summary && summary.length > 100) return 100;
  if (summary && summary.length > 0) return 60;
  if (intro) return 30;
  return 0;
}

export function scoreEmployment(employmentRecords = []) {
  if (employmentRecords.length === 0) return 0;
  let points = 0;
  points += Math.min(50, employmentRecords.length * 25);
  const hasAccomplishments = employmentRecords.some((e) => e.accomplishments?.trim());
  const hasDuties = employmentRecords.some((e) => e.duties?.trim());
  const hasSupervisor = employmentRecords.some((e) => e.supervisor_name?.trim());
  if (hasAccomplishments) points += 25;
  if (hasDuties) points += 15;
  if (hasSupervisor) points += 10;
  return Math.min(100, points);
}

// Education answers that represent "no formal education to add" — the user
// resolved the section rather than providing records. These earn partial
// credit (the section was addressed) but not full credit.
const NONE_EDUCATION_ANSWERS = ["none_declared", "No High School Diploma or GED"];

export function scoreEducation(profile, educationRecords = []) {
  if (educationRecords.length > 0) {
    if (educationRecords.some((e) => e.completed)) return 100;
    return 80;
  }
  const answer = profile?.education_level_answer;
  if (NONE_EDUCATION_ANSWERS.includes(answer)) return 50; // resolved — partial credit
  if (answer) return 100;                                // education level selected — full credit
  return 0;
}

export function scoreSkills(skills = [], transferable = []) {
  const total = mergeSkills(skills, transferable).length;
  if (total === 0) return 0;
  if (total >= 8) return 100;
  if (total >= 5) return 75;
  if (total >= 3) return 50;
  return 25;
}

export function scoreResume(documents = []) {
  return documents.some((d) => d.document_type === "Resume") ? 100 : 0;
}

export function scoreReferences(profile, references = []) {
  if (references.length > 0) {
    const confirmed = references.filter((r) => r.permission_confirmed).length;
    if (confirmed >= 3) return 100;
    if (references.length >= 3) return 70;
    if (references.length >= 1) return 40;
    return 20;
  }
  const status = profile?.references_status;
  if (status === "dont_have") return 50; // resolved — partial credit
  if (status === "yes") return 25;        // in progress — acknowledged intent
  return 0;
}

export function scoreCredentials(profile, credentials = []) {
  if (credentials.length > 0) {
    const active = credentials.filter((c) => c.active_status !== false);
    return Math.min(100, active.length >= 2 ? 100 : 60);
  }
  const status = profile?.credentials_status;
  if (status === "no") return 50;  // resolved — partial credit
  if (status === "yes") return 25; // in progress — acknowledged intent
  return 0;
}

export function scoreQuestions(reusableAnswers = []) {
  if (!reusableAnswers || reusableAnswers.length === 0) return 0;
  if (reusableAnswers.length >= 5) return 100;
  if (reusableAnswers.length >= 3) return 70;
  return 40;
}

/**
 * Calculates the profile completion sub-score from a snapshot or
 * legacy profileData object.
 */
export function scoreProfileCompletion(data) {
  if (data?.percentage != null) return data.percentage;
  return calculateProfileCompletion(data).percentage;
}

/**
 * Calculates an overall profile completion percentage with per-check detail.
 * Accepts either a snapshot or legacy profileData.
 *
 * @returns {{ percentage: number, checks: Array }}
 */
export function calculateProfileCompletion(data) {
  if (!data) return { percentage: 0, checks: [] };

  // Normalize field names — accept both snapshot and legacy shapes
  const employmentRecords = data.employmentHistory || data.employmentRecords || [];
  const educationRecords = data.education || data.educationRecords || [];
  const credentials = data.certifications || data.credentials || [];

  const {
    profile,
    preferences,
    skills = [],
    references = [],
    documents = [],
  } = data;

  // Only core sections contribute to profile completion.
  // Education, credentials, references, resume, and reusable answers
  // are optional and never lower the completion percentage.
  const checks = [
    { label: "Name", passed: !!(profile?.first_name && profile?.last_name) },
    { label: "Contact", passed: !!(profile?.email || profile?.phone) },
    { label: "Address", passed: !!(profile?.city && profile?.state) },
    { label: "Professional Summary", passed: !!profile?.professional_summary?.trim() },
    { label: "Experience", passed: employmentRecords.length > 0 },
    { label: "Skills", passed: skills.length > 0 },
    { label: "Job Preferences", passed: !!(preferences?.desired_job_titles?.length || preferences?.work_categories?.length) },
  ];

  const passed = checks.filter((c) => c.passed).length;
  return { percentage: Math.round((passed / checks.length) * 100), checks };
}

/**
 * Calculates all sub-scores from a snapshot and returns them keyed
 * by category. The engine calls this — individual consumers should
 * not call it directly.
 *
 * @param {EmploymentProfileSnapshot} snapshot
 * @param {object} opts — { reusableAnswers? }
 * @returns {Record<string, number>} — { contact: 80, summary: 60, ... }
 */
export function calculateSubScores(snapshot, opts = {}) {
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

  return {
    contact: scoreContact(profile),
    summary: scoreSummary(profile),
    employment: scoreEmployment(employmentHistory),
    education: scoreEducation(profile, education),
    skills: scoreSkills(skills, transferable),
    resume: scoreResume(documents),
    references: scoreReferences(profile, references),
    credentials: scoreCredentials(profile, certifications),
    profile: scoreProfileCompletion(snapshot),
    questions: scoreQuestions(opts.reusableAnswers || snapshot.reusableAnswers || []),
  };
}