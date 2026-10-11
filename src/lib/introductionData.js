// Building blocks and helpers for the Professional Introduction section.

// Build a text context from confirmed profile data for LLM prompts.
export function buildProfileContext(completion) {
  const profile = completion?.profile || {};
  const prefs = completion?.preferences || {};
  const employment = completion?.employmentRecords || [];
  const skills = completion?.skills || [];
  const education = completion?.educationRecords || [];
  const credentials = completion?.credentials || [];

  const parts = [];

  if (profile.preferred_name || profile.first_name) {
    parts.push(`Name: ${profile.preferred_name || profile.first_name}`);
  }
  if (profile.strength_words?.length > 0) {
    parts.push(`Strengths: ${profile.strength_words.join(", ")}`);
  }
  if (profile.growth_experiences?.length > 0) {
    const filtered = profile.growth_experiences.filter((e) => e !== "Prefer not to answer");
    if (filtered.length > 0) parts.push(`Life experiences: ${filtered.join(", ")}`);
  }
  if (profile.growth_lessons?.length > 0) {
    parts.push(`Lessons learned: ${profile.growth_lessons.join(", ")}`);
  }
  if (profile.story_proud_of) {
    parts.push(`Proud of: ${profile.story_proud_of}`);
  }
  if (profile.story_motivates) {
    parts.push(`What motivates them: ${profile.story_motivates}`);
  }
  if (profile.story_employer_should_know) {
    parts.push(`What employer should know: ${profile.story_employer_should_know}`);
  }
  if (prefs.desired_job_titles?.length > 0) {
    parts.push(`Desired job titles: ${prefs.desired_job_titles.join(", ")}`);
  }
  if (prefs.employment_types?.length > 0) {
    parts.push(`Employment types sought: ${prefs.employment_types.join(", ")}`);
  }
  if (prefs.work_types_enjoyed?.length > 0) {
    parts.push(`Work types enjoyed: ${prefs.work_types_enjoyed.join(", ")}`);
  }
  if (employment.length > 0) {
    const jobs = employment.map((e) => `${e.job_title || "Worker"} at ${e.employer_name || "a company"}`);
    parts.push(`Work experience: ${jobs.join("; ")}`);
  }
  if (skills.length > 0) {
    parts.push(`Skills: ${skills.map((s) => s.skill_name).join(", ")}`);
  }
  if (education.length > 0) {
    const edu = education.map((e) => `${e.degree_or_credential || e.education_type || "Program"} from ${e.institution_name}`);
    parts.push(`Education: ${edu.join("; ")}`);
  }
  if (credentials.length > 0) {
    parts.push(`Credentials: ${credentials.map((c) => c.credential_name).join(", ")}`);
  }

  return parts.join("\n");
}