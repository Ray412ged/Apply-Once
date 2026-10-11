// Per-section completion validation functions.
// Each returns: "not_started" | "in_progress" | "completed"

/**
 * About Me — completed when first_name AND last_name are filled.
 */
export function isAboutMeComplete(profile) {
  if (!profile) return "not_started";
  const hasFirst = !!profile.first_name?.trim();
  const hasLast = !!profile.last_name?.trim();
  if (hasFirst && hasLast) return "completed";
  const hasAny = !!(
    hasFirst || hasLast ||
    profile.preferred_name?.trim() ||
    profile.email?.trim() ||
    profile.phone?.trim() ||
    profile.city?.trim() ||
    profile.state?.trim() ||
    profile.postal_code?.trim()
  );
  return hasAny ? "in_progress" : "not_started";
}

/**
 * Job Goals — completed when at least one job interest is selected
 * (desired_job_titles, work_categories, or work_types_enjoyed).
 * Optional preferences never block completion.
 */
export function isJobGoalsComplete(pref) {
  if (!pref) return "not_started";
  const hasJobInterest = !!(
    pref.desired_job_titles?.length > 0 ||
    pref.work_categories?.length > 0 ||
    pref.work_types_enjoyed?.length > 0
  );
  if (hasJobInterest) return "completed";
  const hasAnyData = !!(
    pref.pay_preference ||
    pref.available_days?.length > 0 ||
    pref.available_times?.length > 0 ||
    pref.earliest_start_date?.trim() ||
    pref.remote_preference ||
    pref.employment_types?.length > 0 ||
    pref.experience_level ||
    pref.desired_industries?.length > 0 ||
    pref.desired_keywords?.length > 0
  );
  return hasAnyData ? "in_progress" : "not_started";
}

/**
 * Employment — completed when at least one employment record exists.
 */
export function isEmploymentComplete(records) {
  return (!records || records.length === 0) ? "not_started" : "completed";
}

/**
 * Skills — completed when at least one skill exists.
 */
export function isSkillsComplete(records) {
  return (!records || records.length === 0) ? "not_started" : "completed";
}

/**
 * Education — returns one of: "completed" | "resolved" | "in_progress" | "not_started".
 *
 *   completed  — records exist OR any education level was selected (selecting a
 *                level — including "No High School Diploma or GED" — is itself
 *                information the user added).
 *   resolved   — the user explicitly declared they have no education or
 *                training to add ("none_declared") and added no records.
 *   not_started — the section has not been addressed.
 *
 * Optional sections never affect Application Readiness; "resolved" counts as
 * addressed for Profile Resolution only.
 */
export function isEducationComplete(profile, records) {
  if (records?.length > 0) return "completed";
  const answer = profile?.education_level_answer;
  if (answer === "none_declared") return "resolved";
  if (answer) return "completed";
  return "not_started";
}

/**
 * Credentials — returns one of: "completed" | "resolved" | "in_progress" | "not_started".
 *
 *   completed  — credentials exist OR the user confirmed they have them ("yes").
 *   resolved   — the user explicitly declared they do not have any ("no") and
 *                added no records.
 *   in_progress — the user chose to add them ("yes") but has not added any yet.
 *   not_started — deferred ("later") or not addressed.
 */
export function isCredentialsComplete(profile, records) {
  if (records?.length > 0) return "completed";
  const answer = profile?.credentials_status;
  if (answer === "no") return "resolved";
  if (answer === "yes") return "in_progress";
  return "not_started";
}

/**
 * References — returns one of: "completed" | "resolved" | "in_progress" | "not_started".
 *
 *   completed  — references exist OR the user confirmed they have them ("yes").
 *   resolved   — the user explicitly declared they do not have any
 *                ("dont_have") and added no records.
 *   in_progress — the user chose to add them ("yes") but has not added any yet.
 *   not_started — deferred ("later") or not addressed.
 */
export function isReferencesComplete(profile, records) {
  if (records?.length > 0) return "completed";
  const answer = profile?.references_status;
  if (answer === "dont_have") return "resolved";
  if (answer === "yes") return "in_progress";
  return "not_started";
}


/**
 * Professional Introduction — completed when a professional summary exists.
 */
export function isProfessionalIntroductionComplete(profile) {
  if (!profile) return "not_started";
  const hasSummary = !!(profile.professional_summary?.trim());
  if (hasSummary) return "completed";
  const hasInterviewIntro = !!(profile.interview_introduction?.trim());
  return hasInterviewIntro ? "in_progress" : "not_started";
}

/** Helper: returns true only when status is "completed". */
export function isComplete(status) {
  return status === "completed";
}

/**
 * Helper: returns true when a section has been "addressed" for Profile
 * Resolution — either completed (information added) or resolved (the user
 * explicitly declared they have nothing to add). Optional sections that are
 * resolved count toward profile completion but never toward Application
 * Readiness.
 */
export function isAddressed(status) {
  return status === "completed" || status === "resolved";
}