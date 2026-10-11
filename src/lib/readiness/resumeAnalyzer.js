/**
 * Resume Analyzer — dedicated module for evaluating resume strength.
 *
 * Returns:
 *   { score, strength, missingSections, suggestions }
 *
 * Strength values: "Excellent" | "Strong" | "Good" | "Needs Improvement"
 *
 * This module never calculates overall readiness — only resume strength.
 */

import { identifyTransferableSkills, mergeSkills } from "./transferableSkills";
import { RESUME_STRENGTH } from "./constants";

/**
 * Evaluates the user's resume independently from the readiness score.
 *
 * @param {EmploymentProfileSnapshot} snapshot
 * @returns {ResumeAnalysisResult}
 */
export function analyzeResume(snapshot) {
  if (!snapshot) {
    return {
      score: 0,
      strength: RESUME_STRENGTH.NEEDS_IMPROVEMENT,
      missingSections: ["All"],
      suggestions: [],
    };
  }

  const {
    profile,
    employmentHistory = [],
    skills = [],
    documents = [],
  } = snapshot;

  const transferable = identifyTransferableSkills(employmentHistory);
  const allSkills = mergeSkills(skills, transferable);

  // Only core sections factor into resume strength.
  // Education, credentials, and references are optional and never
  // lower the resume strength rating.
  const factors = {
    hasResume: documents.some((d) => d.document_type === "Resume"),
    hasContact: !!(profile?.email && profile?.phone),
    hasSummary: !!profile?.professional_summary?.trim(),
    hasEmployment: employmentHistory.length > 0,
    hasAccomplishments: employmentHistory.some((e) => e.accomplishments?.trim()),
    hasSkills: allSkills.length > 0,
  };

  const missingSections = [];
  if (!factors.hasResume) missingSections.push("Resume file");
  if (!factors.hasContact) missingSections.push("Contact information");
  if (!factors.hasSummary) missingSections.push("Professional summary");
  if (!factors.hasEmployment) missingSections.push("Employment history");
  if (!factors.hasSkills) missingSections.push("Skills");

  const totalFactors = Object.keys(factors).length;
  const passedCount = Object.values(factors).filter(Boolean).length;
  const score = Math.round((passedCount / totalFactors) * 100);

  let strength;
  if (missingSections.length === 0) strength = RESUME_STRENGTH.EXCELLENT;
  else if (missingSections.length <= 1) strength = RESUME_STRENGTH.STRONG;
  else if (missingSections.length <= 3) strength = RESUME_STRENGTH.GOOD;
  else strength = RESUME_STRENGTH.NEEDS_IMPROVEMENT;

  const suggestions = generateResumeSuggestions(factors);

  return { score, strength, missingSections, suggestions };
}

function generateResumeSuggestions(factors) {
  const suggestions = [];
  if (!factors.hasResume) {
    suggestions.push("Upload your resume so employers can evaluate your qualifications immediately.");
  }
  if (!factors.hasSummary) {
    suggestions.push("Add a professional summary to give employers a quick snapshot of your value.");
  }
  if (!factors.hasAccomplishments) {
    suggestions.push("Add measurable accomplishments to your employment history to stand out.");
  }
  if (!factors.hasSkills) {
    suggestions.push("Add skills to improve keyword matching with applicant tracking systems.");
  }
  return suggestions;
}