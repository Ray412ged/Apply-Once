// Building blocks and helpers for the Professional Introduction section.

export const BUILDING_BLOCKS = {
  whoIAm: [
    "Dependable worker",
    "Hardworking professional",
    "Hands-on worker",
    "Entry-level job seeker",
    "Experienced professional",
    "Career changer",
    "Skilled trades worker",
    "Customer-service professional",
    "Administrative professional",
    "Team leader",
    "Community-focused professional",
    "Returning to the workforce",
  ],
  whatIBring: [
    "Reliable and punctual",
    "Strong attendance",
    "Fast learner",
    "Works well with others",
    "Works well independently",
    "Organized",
    "Detail-oriented",
    "Calm under pressure",
    "Safety-conscious",
    "Good communicator",
    "Problem solver",
    "Takes initiative",
    "Willing to learn",
    "Experienced with tools and equipment",
    "Strong customer-service skills",
  ],
  whatILookFor: [
    "A stable full-time opportunity",
    "A part-time opportunity",
    "An entry-level opportunity with training",
    "A position where I can grow",
    "Hands-on work",
    "Work helping people",
    "Work where I can use my technical skills",
    "Work where I can use my customer-service skills",
    "A dependable employer and long-term opportunity",
  ],
};

// Maps confirmed strength words to "What I Bring" building blocks.
const STRENGTH_TO_BRING = {
  Reliable: "Reliable and punctual",
  "On time": "Strong attendance",
  "Fast learner": "Fast learner",
  "Team-oriented": "Works well with others",
  Independent: "Works well independently",
  Organized: "Organized",
  "Detail-oriented": "Detail-oriented",
  "Calm under pressure": "Calm under pressure",
  "Safety-conscious": "Safety-conscious",
  "Good with people": "Good communicator",
  "Problem solver": "Problem solver",
  "Takes initiative": "Takes initiative",
  "Willing to learn": "Willing to learn",
};

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

// Suggest relevant building blocks based on confirmed profile data.
export function suggestBlocks(completion) {
  const suggested = { whoIAm: new Set(), whatIBring: new Set(), whatILookFor: new Set() };
  const profile = completion?.profile || {};
  const prefs = completion?.preferences || {};
  const employment = completion?.employmentRecords || [];
  const skills = completion?.skills || [];

  const hasEmployment = employment.length > 0;
  const allText = [
    ...employment.map((e) => `${e.job_title || ""} ${e.duties || ""} ${e.employer_name || ""}`),
    ...skills.map((s) => s.skill_name || ""),
    profile.strength_statement || "",
    ...(prefs.work_types_enjoyed || []),
  ].join(" ").toLowerCase();

  // WHO I AM
  if (!hasEmployment) {
    suggested.whoIAm.add("Entry-level job seeker");
    suggested.whoIAm.add("Returning to the workforce");
  } else {
    suggested.whoIAm.add("Experienced professional");
  }
  if (allText.includes("customer") || allText.includes("cashier") || allText.includes("retail") || allText.includes("sales associate")) {
    suggested.whoIAm.add("Customer-service professional");
  }
  if (allText.includes("trade") || allText.includes("weld") || allText.includes("construct") || allText.includes("mechanic") || allText.includes("electric") || allText.includes("plumb")) {
    suggested.whoIAm.add("Skilled trades worker");
    suggested.whoIAm.add("Hands-on worker");
  }
  if (allText.includes("admin") || allText.includes("office") || allText.includes("clerk") || allText.includes("reception") || allText.includes("data entry")) {
    suggested.whoIAm.add("Administrative professional");
  }
  if (allText.includes("lead") || allText.includes("supervis") || allText.includes("manager")) {
    suggested.whoIAm.add("Team leader");
  }
  if (allText.includes("volunteer") || allText.includes("community")) {
    suggested.whoIAm.add("Community-focused professional");
  }
  const strengthWords = profile.strength_words || [];
  if (strengthWords.includes("Hardworking") || strengthWords.includes("Reliable")) {
    suggested.whoIAm.add("Dependable worker");
    suggested.whoIAm.add("Hardworking professional");
  }

  // WHAT I BRING (from confirmed strength words)
  strengthWords.forEach((w) => {
    if (STRENGTH_TO_BRING[w]) suggested.whatIBring.add(STRENGTH_TO_BRING[w]);
  });
  if (allText.includes("tool") || allText.includes("equipment") || allText.includes("machine") || allText.includes("forklift")) {
    suggested.whatIBring.add("Experienced with tools and equipment");
  }
  if (allText.includes("customer") || allText.includes("service") || allText.includes("cashier")) {
    suggested.whatIBring.add("Strong customer-service skills");
  }

  // WHAT I AM LOOKING FOR
  if (prefs.employment_types?.includes("Full-time")) {
    suggested.whatILookFor.add("A stable full-time opportunity");
  }
  if (prefs.employment_types?.includes("Part-time")) {
    suggested.whatILookFor.add("A part-time opportunity");
  }
  if (!hasEmployment) {
    suggested.whatILookFor.add("An entry-level opportunity with training");
  }
  suggested.whatILookFor.add("A position where I can grow");
  if (prefs.work_types_enjoyed?.some((w) => w.includes("Building") || w.includes("repair") || w.includes("outdoor"))) {
    suggested.whatILookFor.add("Hands-on work");
  }
  if (prefs.work_types_enjoyed?.some((w) => w.includes("Helping people") || w.includes("Healthcare"))) {
    suggested.whatILookFor.add("Work helping people");
  }
  if (allText.includes("computer") || allText.includes("technology") || allText.includes("software") || allText.includes("data entry")) {
    suggested.whatILookFor.add("Work where I can use my technical skills");
  }
  if (allText.includes("customer") || allText.includes("service") || allText.includes("cashier")) {
    suggested.whatILookFor.add("Work where I can use my customer-service skills");
  }
  suggested.whatILookFor.add("A dependable employer and long-term opportunity");

  return {
    whoIAm: [...suggested.whoIAm],
    whatIBring: [...suggested.whatIBring],
    whatILookFor: [...suggested.whatILookFor],
  };
}

// Compose a draft introduction from selected building blocks.
export function composeFromBlocks(selected) {
  const who = selected.whoIAm || [];
  const bring = selected.whatIBring || [];
  const looking = selected.whatILookFor || [];
  const own = selected.ownWords || [];

  const joinList = (list) => {
    if (list.length <= 1) return list.join("");
    const last = list.pop();
    return `${list.join(", ")} and ${last}`;
  };

  const sentences = [];

  if (who.length > 0) {
    sentences.push(`I am a ${joinList(who.map((w) => w.toLowerCase()))}.`);
  }
  if (bring.length > 0) {
    sentences.push(`I am ${joinList(bring.map((b) => b.toLowerCase()))}.`);
  }
  if (looking.length > 0) {
    sentences.push(`I am looking for ${joinList(looking.map((l) => l.toLowerCase()))}.`);
  }
  if (own.length > 0) {
    sentences.push(own.join(" "));
  }

  return sentences.join(" ");
}