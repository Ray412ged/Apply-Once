/**
 * Employment Profile Snapshot builder.
 *
 * Normalizes raw profile data (from useProfileData, guest storage, or
 * any other source) into a single standardized EmploymentProfileSnapshot
 * that every engine module consumes.
 *
 * No module should destructure raw profile data directly — always
 * build a snapshot first.
 */

/**
 * Builds a standardized EmploymentProfileSnapshot from raw profile data.
 *
 * Accepts both the legacy shape (employmentRecords, educationRecords,
 * credentials) and the canonical shape (employmentHistory, education,
 * certifications), normalizing field names so downstream modules
 * always see the same structure.
 *
 * @param {object} raw — raw profile data from any source
 * @returns {EmploymentProfileSnapshot}
 */
export function buildProfileSnapshot(raw) {
  if (!raw) return createEmptySnapshot();

  return {
    profile: raw.profile || null,
    employmentHistory: raw.employmentHistory || raw.employmentRecords || [],
    education: raw.education || raw.educationRecords || [],
    documents: raw.documents || [],
    references: raw.references || [],
    certifications: raw.certifications || raw.credentials || [],
    skills: raw.skills || [],
    reusableAnswers: raw.reusableAnswers || [],
    savedJobs: raw.savedJobs || [],
    preferences: raw.preferences || null,
    percentage: raw.percentage ?? null,
  };
}

/**
 * Returns an empty snapshot (used when no data is available).
 */
export function createEmptySnapshot() {
  return {
    profile: null,
    employmentHistory: [],
    education: [],
    documents: [],
    references: [],
    certifications: [],
    skills: [],
    reusableAnswers: [],
    savedJobs: [],
    preferences: null,
    percentage: null,
  };
}

/**
 * Validates that a snapshot is safe to pass to engine modules.
 * Returns the snapshot if valid, or an empty snapshot if not.
 */
export function validateSnapshot(snapshot) {
  if (!snapshot) return createEmptySnapshot();
  return snapshot;
}