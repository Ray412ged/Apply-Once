/**
 * Employment Intelligence Engine
 * ============================================================
 * THE single source of truth for all application readiness data.
 *
 * This file is an ORCHESTRATOR ONLY. It contains no scoring logic.
 * It receives an EmploymentProfileSnapshot, validates it, delegates
 * to each evaluation module, and returns one standardized response
 * object that every consumer in the application uses.
 *
 * No page, component, hook, service, or AI feature may calculate
 * readiness, resume strength, recommendations, profile completion,
 * transferable skills, or job matching independently — all
 * application intelligence comes from this engine.
 *
 * ── Standardized Output ──────────────────────────────────────
 *   runEngine(profileData, opts) → {
 *     applicationReadiness: { score, status, confidence, breakdown, strengths, weakAreas, missing },
 *     resume: { score, strength, missingSections, suggestions },
 *     profileCompletion,            // 0–100
 *     jobMatches: { total, strong, moderate },
 *     transferableSkills: [],
 *     recommendations: [],
 *     progressHistory: [],
 *   }
 *
 * ── Convenience Exports (backward-compatible) ─────────────────
 *   calculateReadiness(profileData, opts?)
 *   calculateResumeStrength(profileData)
 *   calculateJobMatches(profileData, jobs)
 *   generateRecommendations(profileData, opts?)
 *   calculateProfileCompletion(profileData)
 *   identifyTransferableSkills(employmentRecords)
 *   getAllSkills(profileData)
 *   getDashboardMetrics(profileData, jobs?, opts?)
 *   getAIContext(profileData, jobs?, opts?)
 *   analyzeJobReadiness(job, profileData)
 *   runEngine(profileData, opts?)   ← the canonical entry point
 *
 * Symbols not listed here (identifyTransferableSkills, computeMatchScore,
 * calculateProfileCompletion, etc.) are imported directly from their
 * respective modules — not re-exported through the engine.
 */

import { analyzeReadiness } from "@/lib/readinessScanner";
import { validateWeights } from "./weights";
import { identifyTransferableSkills, mergeSkills } from "./transferableSkills";
import { buildProfileSnapshot } from "./profileSnapshot";
import { analyzeResume } from "./resumeAnalyzer";
import { matchJobs } from "./jobMatcher";
import { generateRecommendations as _generateRecommendations } from "./recommendations";
import { getProgressHistory } from "./progressHistory";
import { calculateSubScores, calculateProfileCompletion } from "./subScores";
import { evaluateSections } from "./sectionStatuses";
import { buildImproveNextRecommendations } from "./improveNext";
import { getNextBestStep, getOptionalEnhancements } from "./nextBestStep";
import {
  getScoreStatus,
  getReadinessStatus,
  getReadinessConfidence,
  SCORE_STATUS,
  SECTION_STATUS,
} from "./constants";

// ─── Canonical engine entry point ─────────────────────────────────────────

/**
 * Runs the full Employment Intelligence Engine and returns a
 * standardized output object.
 *
 * @param {object} rawData — profile data from useProfileData() or any source
 * @param {object} opts — { weights?, jobs?, reusableAnswers? }
 * @returns {EngineOutput}
 */
export function runEngine(rawData, opts = {}) {
  const snapshot = buildProfileSnapshot(rawData);
  if (!snapshot || !snapshot.profile) {
    return createEmptyOutput();
  }

  const weights = validateWeights(opts.weights);
  const reusableAnswers = opts.reusableAnswers || snapshot.reusableAnswers || [];

  // 1. Evaluate per-section statuses (applicable scoring)
  const sectionStatuses = evaluateSections(snapshot);

  // 2. Calculate sub-scores
  const subScores = calculateSubScores(snapshot, { reusableAnswers });

  // 3. Aggregate into application readiness (applicable scoring)
  const applicationReadiness = buildApplicationReadiness(subScores, weights, sectionStatuses, snapshot);

  // 4. Next best step (single primary recommendation)
  const nextBestStep = getNextBestStep(sectionStatuses);
  let optionalEnhancements = getOptionalEnhancements(sectionStatuses);
  // Avoid showing the promoted supporting section twice (once as the
  // primary Next Best Step and again in the optional-enhancements card).
  if (nextBestStep?.sectionId) {
    optionalEnhancements = optionalEnhancements.filter(
      (e) => e.sectionId !== nextBestStep.sectionId
    );
  }

  // 5. Resume analysis
  const resume = analyzeResume(snapshot);

  // 6. Profile completion
  const completion = calculateProfileCompletion(snapshot);
  const profileCompletion = completion.percentage;

  // 7. Transferable skills
  const transferableSkills = identifyTransferableSkills(snapshot.employmentHistory);

  // 8. Job matches
  const jobMatches = opts.jobs
    ? matchJobs(snapshot, opts.jobs)
    : { total: 0, strong: 0, moderate: 0, highConfidence: 0, mediumConfidence: 0, lowConfidence: 0 };

  // 9. Recommendations
  const recommendations = _generateRecommendations(snapshot, {
    weights,
    breakdown: applicationReadiness.breakdown,
  });

  // 10. Progress history
  const progressHistory = getProgressHistory();

  return {
    applicationReadiness,
    sectionStatuses,
    nextBestStep,
    optionalEnhancements,
    resume,
    profileCompletion,
    jobMatches,
    transferableSkills,
    recommendations,
    progressHistory,
  };
}

/**
 * Builds the applicationReadiness object from the CORE sub-scores plus the
 * SUPPORTING sub-scores (education, credentials, references) and their
 * configurable weights.
 *
 * Core sections (contact, employment, skills, summary, profile) are the
 * primary drivers. Supporting sections carry significantly lower weight and
 * only enhance the score: resolving one ("none to add") earns partial
 * credit, and full credit is awarded only when useful information is
 * provided. Resume and reusable answers remain outside this calculation.
 *
 * "Application Ready" is still gated on the four required core sections
 * (contact, employment, skills, summary) — supporting sections never block
 * that status. A user can reach Application Ready without formal employment
 * (meaningful other experience satisfies the experience category), college
 * education, credentials, or references.
 */
function buildApplicationReadiness(subScores, weights, sectionStatuses, snapshot) {
  const breakdown = {};
  const strengths = [];
  const weakAreas = []; // backward-compatible weighted-category labels
  let totalScore = 0;
  let dataPoints = 0;

  for (const [key, def] of Object.entries(weights)) {
    const sub = subScores[key] ?? 0;
    const points = sub * def.weight;
    totalScore += points;

    const status = getScoreStatus(sub);
    if (sub > 0) dataPoints++;

    if (status === SCORE_STATUS.STRONG) strengths.push(def.label);
    else weakAreas.push(def.label);

    breakdown[key] = {
      label: def.label,
      score: sub,
      weight: def.weight,
      points: Math.round(points * 10) / 10,
      status,
      applicable: true,
    };
  }

  const score = Math.min(100, Math.max(0, Math.round(totalScore)));

  // Application Ready: all required core sections are at least In Progress
  const REQUIRED_SECTIONS = ["contact", "employment", "skills", "summary"];
  const applicationReady = REQUIRED_SECTIONS.every((key) => {
    const s = sectionStatuses?.[key];
    return s && s.status !== SECTION_STATUS.NEEDS_ATTENTION;
  });

  // Collect not-applicable optional sections for display. Weighted
  // supporting sections (education, credentials, references) that the user
  // resolved ("none to add") now earn partial credit in the breakdown, so
  // they are NOT listed as not-applicable — only truly non-weighted sections
  // (e.g. resume) appear here.
  const notApplicable = [];
  for (const [key, s] of Object.entries(sectionStatuses || {})) {
    if (s && s.status === SECTION_STATUS.NOT_APPLICABLE && !weights[key]) {
      notApplicable.push(s.label);
    }
  }

  const improveNext = buildImproveNextRecommendations(snapshot, sectionStatuses);

  return {
    score,
    status: getReadinessStatus(score),
    confidence: getReadinessConfidence(score, dataPoints),
    breakdown,
    strengths,
    improveNext,
    weakAreas, // backward-compatible weighted-category labels
    missing: [],
    notApplicable,
    applicationReady,
  };
}

function createEmptyOutput() {
  return {
    applicationReadiness: {
      score: 0,
      status: "Not Started",
      confidence: "Low",
      breakdown: {},
      strengths: [],
      improveNext: [],
      weakAreas: [],
      missing: [],
      notApplicable: [],
      applicationReady: false,
    },
    sectionStatuses: {},
    nextBestStep: null,
    optionalEnhancements: [],
    resume: {
      score: 0,
      strength: "Needs Improvement",
      missingSections: ["All"],
      suggestions: [],
    },
    profileCompletion: 0,
    jobMatches: { total: 0, strong: 0, moderate: 0, highConfidence: 0, mediumConfidence: 0, lowConfidence: 0 },
    transferableSkills: [],
    recommendations: [],
    progressHistory: [],
  };
}

// ─── Backward-compatible convenience exports ──────────────────────────────

/**
 * Calculates the overall Employment Readiness Score (0–100).
 * Delegates to runEngine and extracts the applicationReadiness object.
 */
export function calculateReadiness(profileData, opts = {}) {
  return runEngine(profileData, opts).applicationReadiness;
}

/**
 * Evaluates the user's resume strength.
 * Delegates to the resumeAnalyzer module.
 */
export function calculateResumeStrength(profileData) {
  const snapshot = buildProfileSnapshot(profileData);
  const result = analyzeResume(snapshot);
  return {
    rating: result.strength,
    factors: {},
    missingSections: result.missingSections,
    score: result.score,
    strength: result.strength,
    suggestions: result.suggestions,
  };
}

/**
 * Calculates how many jobs match the user's profile.
 * Delegates to the jobMatcher module.
 */
export function calculateJobMatches(profileData, jobs = []) {
  const snapshot = buildProfileSnapshot(profileData);
  return matchJobs(snapshot, jobs);
}

/**
 * Generates prioritized recommendations ordered by highest impact.
 * Delegates to the recommendations module.
 */
export function generateRecommendations(profileData, opts = {}) {
  const snapshot = buildProfileSnapshot(profileData);
  const readiness = calculateReadiness(profileData, opts);
  return _generateRecommendations(snapshot, { breakdown: readiness.breakdown });
}

/**
 * Returns the merged set of manual + inferred skills.
 */
export function getAllSkills(profileData) {
  if (!profileData) return [];
  const snapshot = buildProfileSnapshot(profileData);
  const transferable = identifyTransferableSkills(snapshot.employmentHistory);
  return mergeSkills(snapshot.skills, transferable);
}

// ─── Dashboard metrics ─────────────────────────────────────────────────────

/**
 * Returns all data required for an Employment Command Center dashboard.
 * Every metric comes directly from the engine — no independent calculations.
 */
export function getDashboardMetrics(profileData, jobs = [], opts = {}) {
  if (!profileData) {
    return {
      readinessScore: 0,
      resumeStrength: "Needs Improvement",
      matchingJobs: { total: 0, highConfidence: 0, mediumConfidence: 0 },
      transferableSkillsCount: 0,
      recommendationCount: 0,
    };
  }

  const output = runEngine(profileData, { ...opts, jobs });

  return {
    readinessScore: output.applicationReadiness.score,
    resumeStrength: output.resume.strength,
    matchingJobs: {
      total: output.jobMatches.total,
      highConfidence: output.jobMatches.strong,
      mediumConfidence: output.jobMatches.moderate,
    },
    transferableSkillsCount: output.transferableSkills.length,
    recommendationCount: output.recommendations.length,
    breakdown: output.applicationReadiness.breakdown,
    strengths: output.applicationReadiness.strengths,
    weakAreas: output.applicationReadiness.weakAreas,
  };
}

// ─── AI context ─────────────────────────────────────────────────────────────

/**
 * Returns a structured, LLM-consumable snapshot of the user's readiness.
 * AI assistants should call this instead of recalculating anything.
 */
export function getAIContext(profileData, jobs = [], opts = {}) {
  if (!profileData) return null;

  const output = runEngine(profileData, { ...opts, jobs });
  const completion = calculateProfileCompletion(buildProfileSnapshot(profileData));

  return {
    currentScore: output.applicationReadiness.score,
    summary: `Employment readiness is ${output.applicationReadiness.score}%. Strong areas: ${output.applicationReadiness.strengths.join(", ") || "none yet"}. Areas needing improvement: ${output.applicationReadiness.weakAreas.join(", ") || "none"}.`,
    breakdown: output.applicationReadiness.breakdown,
    strengths: output.applicationReadiness.strengths,
    weakAreas: output.applicationReadiness.weakAreas,
    missing: output.applicationReadiness.missing,
    resumeStrength: output.resume.strength,
    resumeMissingSections: output.resume.missingSections,
    transferableSkills: output.transferableSkills.map((s) => s.skill_name),
    matchingJobs: {
      total: output.jobMatches.total,
      highConfidence: output.jobMatches.strong,
      mediumConfidence: output.jobMatches.moderate,
    },
    recommendations: output.recommendations.map((r) => ({
      title: r.title,
      reason: r.reason,
      expectedIncrease: r.impact,
      actionUrl: r.route,
    })),
    profileCompletion: completion.percentage,
    profileChecks: completion.checks,
  };
}

// ─── Section status helpers (UI validation, not engine scoring) ────────────

const CONFIRMED_STATUSES = ["User Confirmed", "User Entered", "Document Extracted"];

function getRecordsStatus(records) {
  if (!records || records.length === 0) return "missing";
  if (records.some((r) => CONFIRMED_STATUSES.includes(r.verified_status))) return "ready";
  return "needs_review";
}

function getPersonalStatus(profile) {
  if (!profile) return "missing";
  const has = [profile.first_name, profile.last_name, profile.email, profile.phone].filter(Boolean);
  if (has.length >= 4) return "ready";
  if (has.length > 0) return "needs_review";
  return "missing";
}

function getSkillsStatus(skills) {
  if (!skills || skills.length === 0) return "missing";
  if (skills.some((s) => s.confirmed_by_user)) return "ready";
  return "needs_review";
}

function getReferencesStatus(references) {
  if (!references || references.length === 0) return "missing";
  if (references.some((r) => r.permission_confirmed)) return "ready";
  return "needs_review";
}

function getDocumentStatus(documents) {
  if (!documents || documents.length === 0) return "missing";
  return "ready";
}

/**
 * Compute section-level statuses from profile data.
 * UI-facing validation — not engine scoring logic.
 */
export function computeSectionStatuses(data) {
  const sections = {
    personal: getPersonalStatus(data.profile),
    employment: getRecordsStatus(data.employment),
    education: getRecordsStatus(data.education),
    skills: getSkillsStatus(data.skills),
    credentials: getRecordsStatus(data.credentials),
    references: getReferencesStatus(data.references),
    resume: getDocumentStatus(data.resume),
    coverLetter: getDocumentStatus(data.coverLetter),
    reusableAnswers: getDocumentStatus(data.reusableAnswers),
  };
  const statuses = Object.values(sections);
  const readyCount = statuses.filter((s) => s === "ready").length;
  const needsReviewCount = statuses.filter((s) => s === "needs_review").length;
  const missingCount = statuses.filter((s) => s === "missing").length;
  const total = statuses.length;
  const percentage = Math.round((readyCount / total) * 100);
  return { sections, percentage, readyCount, needsReviewCount, missingCount, total };
}

/**
 * Compute application progress stages from readiness + application status.
 * UI-facing helper — not engine scoring logic.
 */
export function computeApplicationProgress(readiness, application, employerOpened) {
  const stages = {
    started: !!application,
    preparing: readiness.readyCount >= 3,
    completing: employerOpened,
    submitted: application?.status === "Submitted",
    completed: application?.status === "Submitted" && readiness.missingCount === 0,
  };
  const completedCount = Object.values(stages).filter(Boolean).length;
  const percentage = Math.round((completedCount / 5) * 100);
  return { stages, percentage, completedCount };
}

// ─── Job-specific readiness ────────────────────────────────────────────────

/**
 * Job-specific readiness analysis for a single job posting.
 * Combines the scanner's requirement matching with section-level
 * statuses and the engine's general readiness.
 */
export function analyzeJobReadiness(job, profileData) {
  if (!job || !profileData) return null;

  const analysis = analyzeReadiness(job, profileData);
  if (!analysis) return null;

  const general = calculateReadiness(profileData);

  const snapshot = buildProfileSnapshot(profileData);
  const sectionData = {
    profile: snapshot.profile,
    employment: snapshot.employmentHistory,
    education: snapshot.education,
    skills: snapshot.skills,
    credentials: snapshot.certifications,
    references: snapshot.references,
    resume: snapshot.documents.filter((d) => d.document_type === "Resume"),
    coverLetter: snapshot.documents.filter((d) => d.document_type === "Cover Letter"),
    reusableAnswers: snapshot.reusableAnswers,
  };

  const sections = computeSectionStatuses(sectionData);

  return {
    // Job-specific (from scanner)
    score: analysis.score,
    ready: analysis.ready,
    needsReview: analysis.needsReview,
    missing: analysis.missing,
    optional: analysis.optional,
    matchReasons: analysis.matchReasons,
    atsInfo: analysis.atsInfo,
    profileCompletion: analysis.profileCompletion,
    remainingQuestions: analysis.remainingQuestions,
    // Item counts
    itemReadyCount: analysis.readyCount,
    itemTotalCount: analysis.totalItems,
    // Section-level statuses
    sections: sections.sections,
    percentage: sections.percentage,
    readyCount: sections.readyCount,
    needsReviewCount: sections.needsReviewCount,
    missingCount: sections.missingCount,
    total: sections.total,
    // General readiness
    overallScore: general.score,
    overallBreakdown: general.breakdown,
  };
}