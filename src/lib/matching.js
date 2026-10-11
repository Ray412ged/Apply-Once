/**
 * @deprecated This module is now a thin shim.
 *
 * All job matching logic has moved to:
 *   @/lib/readiness/jobMatcher
 *
 * Import from the job matcher directly for new code:
 *   import { computeMatchScore, matchJobs } from "@/lib/readiness/jobMatcher";
 *
 * This shim exists only for backward compatibility with existing imports.
 */

export {
  computeMatchLevel,
  getMatchReasons,
  getStructuredMatchReasons,
  computeMatchScore,
  matchJobs,
} from "@/lib/readiness/jobMatcher";