/**
 * Shared constants for the Employment Intelligence Engine.
 *
 * Centralizes status bands, strength ratings, priorities, and helper
 * functions so every module uses the same vocabulary.
 */

// ─── Sub-score status bands ──────────────────────────────────────────────

export const SECTION_STATUS = {
  COMPLETE: "Complete",
  NEEDS_ATTENTION: "Needs Attention",
  IN_PROGRESS: "In Progress",
  OPTIONAL: "Optional",
  NOT_APPLICABLE: "Not Applicable",
};

export const SCORE_STATUS = {
  STRONG: "strong",
  MODERATE: "moderate",
  WEAK: "weak",
  MISSING: "missing",
};

// ─── Resume strength ratings ──────────────────────────────────────────────

export const RESUME_STRENGTH = {
  EXCELLENT: "Excellent",
  STRONG: "Strong",
  GOOD: "Good",
  NEEDS_IMPROVEMENT: "Needs Improvement",
};

// ─── Recommendation priorities ────────────────────────────────────────────

export const RECOMMENDATION_PRIORITY = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

// ─── Readiness confidence levels ──────────────────────────────────────────

export const READINESS_CONFIDENCE = {
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

// ─── Sub-score category keys (must match weights.js keys) ─────────────────

export const SUB_SCORE_KEYS = [
  "contact",
  "summary",
  "employment",
  "education",
  "skills",
  "resume",
  "references",
  "credentials",
  "profile",
  "questions",
];

// ─── Score → status helpers ───────────────────────────────────────────────

/** Maps a 0–100 sub-score to a status band. */
export function getScoreStatus(score) {
  if (score >= 75) return SCORE_STATUS.STRONG;
  if (score >= 40) return SCORE_STATUS.MODERATE;
  if (score > 0) return SCORE_STATUS.WEAK;
  return SCORE_STATUS.MISSING;
}

/** Maps a 0–100 readiness score to a human-readable status label. */
export function getReadinessStatus(score) {
  if (score >= 85) return "Application Ready";
  if (score >= 70) return "Almost Ready";
  if (score >= 50) return "Building Momentum";
  if (score >= 25) return "Getting Started";
  return "Not Started";
}

/** Determines confidence level based on score and data completeness. */
export function getReadinessConfidence(score, dataPoints) {
  if (dataPoints < 3) return READINESS_CONFIDENCE.LOW;
  if (score >= 70) return READINESS_CONFIDENCE.HIGH;
  if (score >= 40) return READINESS_CONFIDENCE.MEDIUM;
  return READINESS_CONFIDENCE.LOW;
}

/** Maps a numeric impact to a recommendation priority. */
export function getRecommendationPriority(impact) {
  if (impact >= 10) return RECOMMENDATION_PRIORITY.HIGH;
  if (impact >= 5) return RECOMMENDATION_PRIORITY.MEDIUM;
  return RECOMMENDATION_PRIORITY.LOW;
}