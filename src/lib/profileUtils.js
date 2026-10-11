import { base44 } from "@/api/base44Client";
import { queryClientInstance, PROFILE_DATA_QUERY_KEY } from "@/lib/query-client";
import { PROFILE_SECTIONS, TOTAL_SECTIONS, CONTENT_SECTIONS } from "@/lib/profileSections";
import { logCredentialEvent, setCredentialSource, setCredentialOrigin } from "@/lib/credentialDebugLog";
import {
  isAboutMeComplete,
  isJobGoalsComplete,
  isEmploymentComplete,
  isSkillsComplete,
  isEducationComplete,
  isCredentialsComplete,
  isReferencesComplete,
  isProfessionalIntroductionComplete,
  isComplete,
  isAddressed,
} from "@/lib/sectionCompletion";

// Load all profile section data and compute completion
export async function loadProfileCompletion() {
  return loadApiCompletion();
}

async function loadApiCompletion() {
  setCredentialSource("profileUtils.js", "loadApiCompletion");
  setCredentialOrigin("Profile Refresh");
  const [
    profiles, preferences, employment, education, skills,
    credentials, references, documents
  ] = await Promise.all([
    base44.entities.UserProfile.filter({}, "-updated_date", 1),
    base44.entities.JobPreference.filter({}, "-updated_date", 1),
    base44.entities.EmploymentRecord.filter({}, "-updated_date", 50),
    base44.entities.EducationRecord.filter({}, "-updated_date", 50),
    base44.entities.Skill.filter({}, "-updated_date", 50),
    base44.entities.Credential.filter({}, "-updated_date", 50),
    base44.entities.Reference.filter({}, "-updated_date", 50),
    base44.entities.UserDocument.filter({}, "-updated_date", 50),
  ]);

  console.log(`[CRED-DEBUG] ${new Date().toISOString()} — loadApiCompletion credentials_returned=${credentials.length}`);
  logCredentialEvent({ eventName: "Credentials returned after refresh", details: `count=${credentials.length}` });
  credentials.forEach((c, i) => {
    console.log(`[CRED-DEBUG] ${new Date().toISOString()} — DB credential[${i}] id="${c.id}" name="${c.credential_name}" issuer="${c.issuing_organization}"`);
    logCredentialEvent({ eventName: "Credential in DB", credentialName: c.credential_name || "", recordId: c.id, details: `index=${i} issuer="${c.issuing_organization || ""}"` });
  });

  return buildCompletion({
    profiles, preferences, employment, education, skills,
    credentials, references, documents,
  });
}

function buildCompletion(data) {
  const profile = data.profiles[0];
  const preferences = data.preferences[0];

  // Three-state statuses: "not_started" | "in_progress" | "completed"
  const sectionStatuses = {
    about: isAboutMeComplete(profile),
    goals: isJobGoalsComplete(preferences),
    employment: isEmploymentComplete(data.employment),
    skills: isSkillsComplete(data.skills),
    education: isEducationComplete(profile, data.education),
    credentials: isCredentialsComplete(profile, data.credentials),
    references: isReferencesComplete(profile, data.references),
    introduction: isProfessionalIntroductionComplete(profile),
  };

  // Review is complete when all CORE sections are completed.
  // Optional sections (education, credentials, references) do not
  // block review or general Application Readiness.
  const CORE_SECTION_KEYS = ["about", "goals", "employment", "skills", "introduction"];
  const allOthersComplete = CORE_SECTION_KEYS.every((key) => isComplete(sectionStatuses[key]));
  sectionStatuses.review = allOthersComplete ? "completed" : "not_started";

  // Boolean map for backward compatibility — a section is "addressed" when it
  // is completed (information added) OR resolved (user declared none). Optional
  // sections that are resolved count toward profile completion but never toward
  // Application Readiness.
  const sections = {};
  for (const [key, status] of Object.entries(sectionStatuses)) {
    sections[key] = isAddressed(status);
  }

  const completedCount = CONTENT_SECTIONS.filter((s) => sections[s.id]).length;
  const totalSections = CONTENT_SECTIONS.length;
  const percentage = Math.round((completedCount / totalSections) * 100);

  return {
    sections,
    sectionStatuses,
    percentage,
    completedCount,
    totalSections,
    profile,
    preferences,
    counts: {
      employment: data.employment.length,
      education: data.education.length,
      skills: data.skills.length,
      credentials: data.credentials.length,
      references: data.references.length,
      documents: data.documents.length,
    },
    employmentRecords: data.employment,
    educationRecords: data.education,
    skills: data.skills,
    credentials: data.credentials,
    references: data.references,
    documents: data.documents,
  };
}

// Recalculate and persist the profile completion percentage
export async function updateProfileCompletion() {
  setCredentialSource("profileUtils.js", "updateProfileCompletion");
  setCredentialOrigin("Profile Refresh");
  console.log(`[CRED-DEBUG] ${new Date().toISOString()} — updateProfileCompletion ENTER credentials_in_completion=${0}`);
  logCredentialEvent({ eventName: "updateProfileCompletion() called", details: "entering" });
  const completion = await loadProfileCompletion();
  console.log(`[CRED-DEBUG] ${new Date().toISOString()} — updateProfileCompletion loaded credentials_count=${completion.credentials?.length || 0}`);
  logCredentialEvent({ eventName: "Profile refreshed", details: `credentials_in_completion=${completion.credentials?.length || 0}` });
  completion.credentials?.forEach((c, i) => {
    console.log(`[CRED-DEBUG] ${new Date().toISOString()} — updateProfileCompletion credential[${i}] id="${c.id}" name="${c.credential_name}"`);
    logCredentialEvent({ eventName: "Credential in completion", credentialName: c.credential_name || "", recordId: c.id, details: `index=${i}` });
  });

  let profileUpdate = {};
  if (completion.profile) {
    profileUpdate = {
      profile_completion_percentage: completion.percentage,
      onboarding_status: completion.percentage === 100 ? "completed" : "in_progress",
    };
    await base44.entities.UserProfile.update(completion.profile.id, profileUpdate);
  }

  // Update the React Query cache so consumers see the fresh data immediately
  queryClientInstance.setQueryData(PROFILE_DATA_QUERY_KEY, {
    ...completion,
    profile: completion.profile
      ? { ...completion.profile, ...profileUpdate }
      : completion.profile,
  });
  console.log(`[CRED-DEBUG] ${new Date().toISOString()} — updateProfileCompletion setQueryData DONE credentials_count=${completion.credentials?.length || 0}`);
  logCredentialEvent({ eventName: "updateProfileCompletion() done", details: `final_credentials_count=${completion.credentials?.length || 0}` });

  return completion;
}

// Find the next incomplete section for auto-routing
export function getNextIncompleteSection(sections) {
  for (const section of PROFILE_SECTIONS) {
    if (section.id === "review") continue;
    if (!sections?.[section.id]) {
      return section;
    }
  }
  // If all sections are complete, go to review
  return PROFILE_SECTIONS.find((s) => s.id === "review") || PROFILE_SECTIONS[0];
}

// Find the previous section before a given section ID
export function getPrevSection(currentSectionId) {
  const idx = PROFILE_SECTIONS.findIndex((s) => s.id === currentSectionId);
  if (idx <= 0) return null;
  return PROFILE_SECTIONS[idx - 1];
}

export { PROFILE_SECTIONS, TOTAL_SECTIONS, CONTENT_SECTIONS };