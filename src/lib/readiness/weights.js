/**
 * Configurable scoring weights for the Application Readiness Engine.
 *
 * The score is driven by two tiers:
 *
 *   CORE sections (primary drivers) — Contact, Experience, Skills,
 *   Professional Summary, Profile Completion. These remain the dominant
 *   contributors and determine whether a user is "Application Ready".
 *
 *   SUPPORTING sections (modest enhancement) — Education & Training,
 *   Licenses & Certifications, References. These carry significantly
 *   lower weight than any core section. They reward users for building a
 *   stronger application profile without ever outweighing core
 *   employment information. A user who resolves a supporting section
 *   ("I have none to add") receives partial credit; full credit is only
 *   awarded when useful information is provided.
 *
 * Resume and reusable answers stay deliberately absent from this map —
 * they never reduce the score and their weight is never redistributed.
 *
 * Weights sum to 1.0 so the score lands on a clean 0–100 scale.
 * To rebalance, change the `weight` values here (or pass a custom
 * override into runEngine()).  The `validateWeights()` helper enforces
 * the 1.0 total at runtime.
 */

export const DEFAULT_READINESS_WEIGHTS = {
  // — Core (primary drivers) —
  contact:     { weight: 0.17, label: "Contact Information",      key: "contact" },
  employment:  { weight: 0.26, label: "Experience",              key: "employment" },
  skills:      { weight: 0.22, label: "Skills",                  key: "skills" },
  summary:     { weight: 0.13, label: "Professional Summary",     key: "summary" },
  profile:     { weight: 0.09, label: "Profile Completion",       key: "profile" },
  // — Supporting (modest enhancement) —
  education:   { weight: 0.05, label: "Education & Training",     key: "education" },
  credentials: { weight: 0.04, label: "Licenses & Certifications",key: "credentials" },
  references:  { weight: 0.04, label: "References",               key: "references" },
};

/** High-confidence job-match threshold (user-configured at 50%). */
export const JOB_MATCH_THRESHOLDS = {
  high: 0.50,   // >= 50% → high confidence
  medium: 0.01, // > 0% and < 50% → medium confidence
};

/**
 * Ensures a custom weight map sums to 1.0.
 * Returns the map if valid; otherwise returns the defaults so the
 * engine never silently produces a miscalibrated score.
 */
export function validateWeights(custom) {
  if (!custom) return DEFAULT_READINESS_WEIGHTS;
  const sum = Object.values(custom).reduce((acc, c) => acc + (c?.weight || 0), 0);
  if (Math.abs(sum - 1.0) > 0.001) {
    console.warn(`[ReadinessEngine] Weights sum to ${sum}, expected 1.0. Using defaults.`);
    return DEFAULT_READINESS_WEIGHTS;
  }
  return custom;
}