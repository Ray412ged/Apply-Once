/**
 * JSDoc type definitions for the Employment Intelligence Engine.
 *
 * These are documentation-only types (no runtime code). They define
 * the contracts that every module and consumer should follow.
 */

/**
 * Standardized snapshot of all user data required by the engine.
 *
 * @typedef {Object} EmploymentProfileSnapshot
 * @property {object|null} profile          — UserProfile record
 * @property {Array}      employmentHistory  — EmploymentRecord[]
 * @property {Array}      education          — EducationRecord[]
 * @property {Array}      documents           — UserDocument[]
 * @property {Array}      references          — Reference[]
 * @property {Array}      certifications      — Credential[]
 * @property {Array}      skills              — Skill[]
 * @property {Array}      reusableAnswers     — ReusableAnswer[]
 * @property {Array}      savedJobs           — SavedJob[]
 * @property {object|null} preferences        — JobPreference
 * @property {number|null} percentage         — pre-computed completion %
 */

/**
 * A single sub-score entry in the readiness breakdown.
 *
 * @typedef {Object} SubScoreEntry
 * @property {string} label   — human-readable category name
 * @property {number} score   — 0–100
 * @property {number} weight   — 0–1
 * @property {number} points   — score × weight
 * @property {string} status   — SCORE_STATUS value
 */

/**
 * Application readiness result.
 *
 * @typedef {Object} ApplicationReadinessResult
 * @property {number} score       — 0–100
 * @property {string} status       — human-readable readiness band
 * @property {string} confidence   — READINESS_CONFIDENCE value
 * @property {Record<string, SubScoreEntry>} breakdown
 * @property {string[]} strengths
 * @property {string[]} weakAreas
 * @property {string[]} missing
 */

/**
 * Resume analysis result.
 *
 * @typedef {Object} ResumeAnalysisResult
 * @property {number} score            — 0–100
 * @property {string} strength          — RESUME_STRENGTH value
 * @property {string[]} missingSections
 * @property {string[]} suggestions
 */

/**
 * Job match aggregate.
 *
 * @typedef {Object} JobMatchAggregate
 * @property {number} total
 * @property {number} strong    — count of strong matches
 * @property {number} moderate  — count of moderate matches
 */

/**
 * A prioritized recommendation.
 *
 * @typedef {Object} Recommendation
 * @property {string} id
 * @property {string} title
 * @property {string} priority      — RECOMMENDATION_PRIORITY value
 * @property {number} impact         — expected readiness point increase
 * @property {string} estimatedTime  — human-readable time estimate
 * @property {string} reason
 * @property {string} route          — app route to complete the action
 */

/**
 * A progress history entry.
 *
 * @typedef {Object} ProgressEntry
 * @property {number} previousScore
 * @property {number} newScore
 * @property {string} timestamp   — ISO 8601
 * @property {string} trigger      — what caused the change
 */

/**
 * The standardized engine output returned by `runEngine()`.
 *
 * @typedef {Object} EngineOutput
 * @property {ApplicationReadinessResult} applicationReadiness
 * @property {ResumeAnalysisResult} resume
 * @property {number} profileCompletion   — 0–100
 * @property {JobMatchAggregate} jobMatches
 * @property {Array} transferableSkills
 * @property {Recommendation[]} recommendations
 * @property {ProgressEntry[]} progressHistory
 */