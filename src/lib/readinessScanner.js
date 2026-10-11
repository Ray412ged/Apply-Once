// Application Readiness Scanner — analysis engine.
// Pure functions that compare a job posting with the user's saved career
// profile and classify each requirement as Ready, Needs Review, Missing,
// or Optional. Also produces a strengths-based readiness score,
// profile-grounded match reasons, and ATS metadata for the scanner UI.

import { getAtsMetadata } from "./atsDetection";
import { calculateProfileCompletion as _calculateProfileCompletion } from "@/lib/readiness/subScores";

const PATTERNS = {
  drivers_license: /driver'?s?\s*license|valid\s+license|clean\s+driving\s+record|\bcdl\b/i,
  background_check: /background\s+check|background\s+screening|background\s+investigation|criminal\s+background|drug\s+screen|drug\s+test/i,
  physical: /lift\s+\d+|able\s+to\s+lift|stand\s+for|physical\s+(?:requirements|demands|ability)|stoop|bend|kneel|carry\s+\d+|heavy\s+lifting/i,
  work_authorization: /authorized\s+to\s+work|work\s+authorization|eligible\s+to\s+work|sponsorship|work\s+visa|legally\s+authorized/i,
  references_req: /references\s+(?:will|may|are|can)\s+be|provide\s+references|three\s+references|professional\s+references/i,
  resume_req: /resume\s+(?:is\s+)?(?:required|needed|requested|necessary)|submit\s+(?:a\s+)?resume|attach\s+(?:your\s+)?resume/i,
  cover_letter_req: /cover\s+letter\s+(?:is\s+)?(?:required|needed|requested|preferred)|submit\s+(?:a\s+)?cover\s+letter|attach\s+(?:your\s+)?cover\s+letter/i,
  weekend: /weekend|saturdays?|sundays?/i,
  overtime: /overtime/i,
  night_shift: /night\s+shift|overnight|graveyard|evening\s+shift/i,
  salary_req: /salary\s+(?:expectation|requirement|history|range)|desired\s+salary|pay\s+expectation|expected\s+salary/i,
  start_date: /start\s+date|earliest\s+start|when\s+can\s+you\s+start|available\s+to\s+start|start\s+immediately/i,
  travel_req: /travel\s+(?:required|expected|may\s+be)|willing\s+to\s+travel|travel\s+required/i,
};

const WEIGHT = {
  REQUIRED_APP_INFO: 3,
  REQUIRED_QUAL: 2.5,
  EMPLOYER_QUESTION: 1.5,
  PREFERRED: 1,
  OPTIONAL: 0.1,
};

function buildJobText(job) {
  return [
    job.full_description, job.responsibilities, job.minimum_qualifications,
    job.preferred_qualifications, job.required_education, job.required_experience,
    job.required_credentials, job.background_requirements, job.schedule,
  ].filter(Boolean).join(" \n ");
}

export function analyzeReadiness(job, profileData) {
  if (!job || !profileData) return null;

  const jobText = buildJobText(job);
  const atsInfo = getAtsMetadata(job);
  const {
    profile,
    preferences,
    employmentRecords = [],
    educationRecords = [],
    skills = [],
    credentials = [],
    references = [],
    documents = [],
  } = profileData;

  const ready = [];
  const needsReview = [];
  const missing = [];
  const optional = [];
  const matchReasons = [];

  let totalWeight = 0;
  let readyWeight = 0;

  const addReady = (item) => {
    ready.push(item);
    totalWeight += item.weight;
    readyWeight += item.weight;
  };
  const addReview = (item) => { needsReview.push(item); totalWeight += item.weight; };
  const addMissing = (item) => { missing.push(item); totalWeight += item.weight; };
  const addOptional = (item) => { optional.push(item); totalWeight += item.weight; };

  // --- Contact information ---
  const contactParts = [profile?.email, profile?.phone].filter(Boolean);
  if (contactParts.length > 0) {
    addReady({ id: "contact", label: "Contact information", detail: contactParts.join(" · "), category: "contact", weight: WEIGHT.REQUIRED_APP_INFO });
  } else {
    addMissing({ id: "contact", label: "Contact information", question: "How can employers reach you? Add your email or phone in your profile.", type: "link", linkTo: "/profile/edit?section=about", category: "contact", saveable: false, weight: WEIGHT.REQUIRED_APP_INFO });
  }

  // --- Employment history ---
  if (employmentRecords.length > 0) {
    addReady({ id: "employment", label: "Employment history", detail: `${employmentRecords.length} saved position${employmentRecords.length !== 1 ? "s" : ""} available`, category: "employment", weight: WEIGHT.REQUIRED_APP_INFO });
    if (employmentRecords.length > 1) {
      addReview({ id: "employment_select", label: "Which experiences to emphasize", detail: "Choose the most relevant positions for this application", reason: "You have multiple positions. Select the ones that best fit this job.", category: "employment", weight: WEIGHT.PREFERRED });
    }
    const jobTitleLower = (job.job_title || "").toLowerCase();
    const hasTitleMatch = employmentRecords.some((e) => {
      const t = (e.job_title || "").toLowerCase();
      return t && (jobTitleLower.includes(t) || t.includes(jobTitleLower));
    });
    if (hasTitleMatch) {
      matchReasons.push("Your work experience directly relates to this job title.");
    }
    matchReasons.push("Your employment history demonstrates experience in similar work environments.");
  } else {
    addMissing({ id: "employment", label: "Employment history", question: "Add your work experience to your profile.", type: "link", linkTo: "/profile/edit?section=employment", category: "employment", saveable: false, weight: WEIGHT.REQUIRED_APP_INFO });
  }

  // --- Education ---
  if (job.required_education) {
    const reqLower = job.required_education.toLowerCase();
    const hasMatch = educationRecords.some((e) => {
      const degree = (e.degree_or_credential || "").toLowerCase();
      const field = (e.field_of_study || "").toLowerCase();
      return reqLower.includes(degree) || reqLower.includes(field) || (degree && degree.includes(reqLower)) || (field && field.includes(reqLower));
    });
    if (hasMatch) {
      addReady({ id: "education", label: "Education", detail: `Meets requirement: ${job.required_education}`, category: "education", weight: WEIGHT.REQUIRED_QUAL });
      matchReasons.push("Your education meets the job's stated requirement.");
    } else if (educationRecords.length > 0) {
      addReview({ id: "education", label: "Education", detail: `Job requires: ${job.required_education}`, reason: "Your education records don't clearly match. Confirm if they apply.", category: "education", weight: WEIGHT.REQUIRED_QUAL });
    } else {
      addMissing({ id: "education", label: "Education", question: `This job requires: ${job.required_education}`, type: "link", linkTo: "/profile/edit?section=education", category: "education", saveable: false, weight: WEIGHT.REQUIRED_QUAL });
    }
  } else if (educationRecords.length > 0) {
    addReady({ id: "education", label: "Education", detail: `${educationRecords.length} education record${educationRecords.length !== 1 ? "s" : ""} on file`, category: "education", weight: WEIGHT.REQUIRED_APP_INFO });
  }

  // --- Skills ---
  const jobKeywords = job.keywords || [];
  if (jobKeywords.length > 0) {
    const matchedSkills = skills.filter((s) =>
      jobKeywords.some((jk) => {
        const jkLower = jk.toLowerCase();
        const sLower = (s.skill_name || "").toLowerCase();
        return jkLower.includes(sLower) || sLower.includes(jkLower);
      })
    );
    if (matchedSkills.length > 0) {
      addReady({ id: "skills", label: "Relevant skills", detail: matchedSkills.map((s) => s.skill_name).join(", "), category: "skills", weight: WEIGHT.REQUIRED_QUAL });
      matchReasons.push(`You have ${matchedSkills.length} relevant skill${matchedSkills.length !== 1 ? "s" : ""} for this job.`);
    } else {
      addReview({ id: "skills", label: "Skills", detail: `Job lists ${jobKeywords.length} keyword${jobKeywords.length !== 1 ? "s" : ""}. Review whether your skills apply.`, reason: "None of your saved skills directly match the job's keywords.", category: "skills", weight: WEIGHT.PREFERRED });
    }
  } else if (skills.length > 0) {
    addReady({ id: "skills", label: "Skills", detail: `${skills.length} skills on file`, category: "skills", weight: WEIGHT.REQUIRED_APP_INFO });
  }

  // --- Credentials / Licenses ---
  if (job.required_credentials) {
    const reqCreds = job.required_credentials.split(/[\n,;]/).map((s) => s.trim()).filter((s) => s.length >= 3);
    const matchedCreds = [];
    const missingCreds = [];
    for (const req of reqCreds) {
      const reqLower = req.toLowerCase();
      const match = credentials.find((c) => {
        const credText = `${c.credential_name || ""} ${c.credential_type || ""}`.toLowerCase();
        return credText.includes(reqLower) || (reqLower.length > 4 && reqLower.includes(credText));
      });
      if (match) matchedCreds.push(req);
      else missingCreds.push(req);
    }
    if (matchedCreds.length > 0) {
      addReady({ id: "credentials", label: "Licenses & certifications", detail: `Matches: ${matchedCreds.join(", ")}`, category: "credentials", weight: WEIGHT.REQUIRED_QUAL });
      matchReasons.push(`Your ${matchedCreds.join(", ")} ${matchedCreds.length > 1 ? "support" : "supports"} the job's requirements.`);
    }
    if (missingCreds.length > 0) {
      if (credentials.length > 0) {
        addReview({ id: "credentials_missing", label: "Required credentials", detail: `May need: ${missingCreds.join(", ")}`, reason: "The job requires credentials not clearly matched in your profile. Confirm if you have them.", category: "credentials", weight: WEIGHT.REQUIRED_QUAL });
      } else {
        addMissing({ id: "credentials", label: "Required credentials", question: `This job requires: ${missingCreds.join(", ")}`, type: "link", linkTo: "/profile/edit?section=credentials", category: "credentials", saveable: false, weight: WEIGHT.REQUIRED_QUAL });
      }
    }
  } else if (credentials.length > 0) {
    addReady({ id: "credentials", label: "Licenses & certifications", detail: `${credentials.length} on file`, category: "credentials", weight: WEIGHT.REQUIRED_APP_INFO });
  }

  // Credential expiration check
  const expiringCreds = credentials.filter((c) => {
    if (!c.expiration_date) return false;
    const exp = new Date(c.expiration_date);
    const sixMonths = new Date();
    sixMonths.setMonth(sixMonths.getMonth() + 6);
    return exp <= sixMonths;
  });
  if (expiringCreds.length > 0) {
    addReview({ id: "credential_expiration", label: "Certification currency", detail: expiringCreds.map((c) => c.credential_name).join(", "), reason: "Some credentials may be expiring or expired. Confirm they are current.", category: "credentials", weight: WEIGHT.PREFERRED });
  }

  // --- Driver's license ---
  if (PATTERNS.drivers_license.test(jobText)) {
    const hasLicense = credentials.some((c) => /license|permit/i.test(c.credential_name || ""));
    if (hasLicense) {
      addReady({ id: "drivers_license", label: "Driver's license", detail: "On file", category: "credentials", weight: WEIGHT.REQUIRED_QUAL });
    } else {
      addMissing({ id: "drivers_license", label: "Driver's license", question: "This job requires a valid driver's license. Do you have one?", type: "boolean", category: "credentials", saveable: true, weight: WEIGHT.REQUIRED_QUAL });
    }
  }

  // --- References ---
  if (PATTERNS.references_req.test(jobText)) {
    if (references.length > 0) {
      addReady({ id: "references", label: "References", detail: `${references.length} reference${references.length !== 1 ? "s" : ""} available`, category: "references", weight: WEIGHT.REQUIRED_QUAL });
      const unconfirmed = references.filter((r) => !r.permission_confirmed);
      if (unconfirmed.length > 0) {
        addReview({ id: "references_permission", label: "Reference permission", detail: `${unconfirmed.length} reference${unconfirmed.length !== 1 ? "s" : ""} need permission confirmation`, reason: "Confirm that your references have agreed to be contacted.", category: "references", weight: WEIGHT.PREFERRED });
      }
    } else {
      addMissing({ id: "references", label: "References", question: "This employer may request references. Add them to your profile.", type: "link", linkTo: "/profile/edit?section=references", category: "references", saveable: false, weight: WEIGHT.REQUIRED_QUAL });
    }
  } else if (references.length > 0) {
    addReady({ id: "references", label: "References", detail: `${references.length} on file`, category: "references", weight: WEIGHT.PREFERRED });
  }

  // --- Resume ---
  const resumeDocs = documents.filter((d) => d.document_type === "Resume");
  if (PATTERNS.resume_req.test(jobText) || resumeDocs.length > 0) {
    if (resumeDocs.length > 0) {
      addReady({ id: "resume", label: "Resume", detail: resumeDocs.length > 1 ? `${resumeDocs.length} resumes on file` : resumeDocs[0].document_name, category: "documents", weight: WEIGHT.REQUIRED_APP_INFO });
      if (resumeDocs.length > 1) {
        addReview({ id: "resume_select", label: "Which resume to use", detail: "Select the best version for this application", reason: "You have multiple resumes. Choose the one that best fits this job.", category: "documents", weight: WEIGHT.PREFERRED });
      }
    } else {
      addMissing({ id: "resume", label: "Resume", question: "This employer requires a resume. Upload one to your profile.", type: "link", linkTo: "/profile/edit?section=documents", category: "documents", saveable: false, weight: WEIGHT.REQUIRED_APP_INFO });
    }
  }

  // --- Cover letter ---
  if (PATTERNS.cover_letter_req.test(jobText)) {
    const coverDocs = documents.filter((d) => d.document_type === "Cover Letter");
    if (coverDocs.length > 0) {
      addReady({ id: "cover_letter", label: "Cover letter", detail: coverDocs[0].document_name, category: "documents", weight: WEIGHT.EMPLOYER_QUESTION });
    } else {
      addMissing({ id: "cover_letter", label: "Cover letter", question: "This employer requests a cover letter. Would you like to prepare one?", type: "boolean", category: "documents", saveable: false, weight: WEIGHT.EMPLOYER_QUESTION });
    }
  }

  // --- Work preferences ---
  if (preferences) {
    const prefParts = [
      preferences.employment_types?.[0],
      preferences.remote_preference !== "No preference" ? preferences.remote_preference : null,
      preferences.preferred_schedule !== "Any" ? preferences.preferred_schedule : null,
    ].filter(Boolean);
    if (prefParts.length > 0) {
      addReady({ id: "preferences", label: "Work preferences", detail: prefParts.join(" · "), category: "preferences", weight: WEIGHT.PREFERRED });
    }
  }

  // --- Background check ---
  if (PATTERNS.background_check.test(jobText)) {
    addReady({ id: "background_check", label: "Background check", detail: "Be prepared — this employer conducts background checks.", category: "requirements", weight: WEIGHT.PREFERRED });
  }

  // --- Missing questions (common application questions not in profile) ---

  // Start date
  if (preferences?.earliest_start_date) {
    addReady({ id: "start_date", label: "Start date", detail: `Available: ${preferences.earliest_start_date}`, category: "preferences", weight: WEIGHT.EMPLOYER_QUESTION });
  } else {
    addMissing({ id: "start_date", label: "When can you start?", question: "When can you start?", type: "date", category: "preferences", saveable: true, weight: WEIGHT.EMPLOYER_QUESTION });
  }

  // Availability
  if (preferences?.available_days?.length > 0) {
    addReady({ id: "availability", label: "Availability", detail: preferences.available_days.join(", "), category: "preferences", weight: WEIGHT.EMPLOYER_QUESTION });
  } else {
    addMissing({ id: "availability", label: "Available days and hours", question: "What days and hours are you available?", type: "text", category: "preferences", saveable: true, weight: WEIGHT.EMPLOYER_QUESTION });
  }

  // Salary (only if job mentions it or user has no preference)
  if (PATTERNS.salary_req.test(jobText)) {
    if (preferences?.pay_preference || preferences?.minimum_hourly_pay) {
      addReady({ id: "salary", label: "Salary expectations", detail: preferences.pay_preference || `$${preferences.minimum_hourly_pay}/hr`, category: "preferences", weight: WEIGHT.EMPLOYER_QUESTION });
    } else {
      addMissing({ id: "salary", label: "Desired salary", question: "What is your desired salary?", type: "text", category: "preferences", saveable: true, weight: WEIGHT.EMPLOYER_QUESTION });
    }
  }

  // Travel
  if (PATTERNS.travel_req.test(jobText)) {
    if (preferences?.willing_to_travel !== undefined && preferences?.willing_to_travel !== null) {
      addReady({ id: "travel", label: "Willingness to travel", detail: preferences.willing_to_travel ? "Yes, willing to travel" : "Prefer not to travel", category: "preferences", weight: WEIGHT.EMPLOYER_QUESTION });
    } else {
      addMissing({ id: "travel", label: "Willingness to travel", question: "Are you willing to travel for this position?", type: "boolean", category: "preferences", saveable: true, weight: WEIGHT.EMPLOYER_QUESTION });
    }
  }

  // Weekends
  if (PATTERNS.weekend.test(jobText)) {
    const hasWeekendPref = preferences?.available_days?.some((d) => /saturday|sunday|weekend/i.test(d)) || preferences?.preferred_schedule === "Any" || preferences?.preferred_schedule === "Weekend";
    if (hasWeekendPref) {
      addReady({ id: "weekend", label: "Weekend availability", detail: "Available for weekends", category: "preferences", weight: WEIGHT.EMPLOYER_QUESTION });
    } else {
      addMissing({ id: "weekend", label: "Weekend availability", question: "Are you willing to work weekends?", type: "boolean", category: "preferences", saveable: true, weight: WEIGHT.EMPLOYER_QUESTION });
    }
  }

  // Work authorization / sponsorship
  if (PATTERNS.work_authorization.test(jobText)) {
    addMissing({ id: "sponsorship", label: "Work authorization", question: "Do you now or will you in the future require sponsorship for employment?", type: "boolean", category: "requirements", saveable: true, weight: WEIGHT.EMPLOYER_QUESTION });
  }

  // --- Location match reason ---
  if (profile?.state && job.state && profile.state.toLowerCase() === job.state.toLowerCase()) {
    matchReasons.push(`This position is located in your state (${job.state}).`);
  }

  // --- Optional strengthening items ---
  if (employmentRecords.length > 0) {
    const hasAccomplishments = employmentRecords.some((e) => e.accomplishments?.trim());
    if (!hasAccomplishments) {
      addOptional({ id: "opt_accomplishment", label: "Add a measurable accomplishment", detail: "Highlight a specific achievement from a previous position.", category: "optional", weight: WEIGHT.OPTIONAL });
    }
  }
  if (credentials.length > 0) {
    addOptional({ id: "opt_credential", label: "Highlight a relevant certification", detail: "Call attention to a certification that aligns with this job.", category: "optional", weight: WEIGHT.OPTIONAL });
  }
  if (employmentRecords.length > 0) {
    addOptional({ id: "opt_responsibility", label: "Add a relevant responsibility", detail: "Feature a duty from your work history that matches this job.", category: "optional", weight: WEIGHT.OPTIONAL });
  }
  if (!PATTERNS.cover_letter_req.test(jobText)) {
    addOptional({ id: "opt_cover_letter", label: "Prepare a short cover letter", detail: "A brief, personalized cover letter can strengthen your application.", category: "optional", weight: WEIGHT.OPTIONAL });
  }
  if (references.length > 0) {
    const unconfirmed = references.filter((r) => !r.permission_confirmed);
    if (unconfirmed.length > 0) {
      addOptional({ id: "opt_reference", label: "Confirm a professional reference", detail: "Reach out to your references to confirm their willingness.", category: "optional", weight: WEIGHT.OPTIONAL });
    }
  }

  // --- Profile completion percentage ---
  const profileCompletion = _calculateProfileCompletion(profileData).percentage;

  // --- Remaining employer-specific questions ---
  const remainingQuestions = missing.filter(
    (m) => m.saveable !== false && m.type !== "link"
  ).length;

  // --- Score ---
  const score = totalWeight > 0 ? Math.round((readyWeight / totalWeight) * 100) : 0;
  const totalItems = ready.length + needsReview.length + missing.length;

  return {
    score: Math.min(100, Math.max(0, score)),
    totalItems,
    readyCount: ready.length,
    ready,
    needsReview,
    missing,
    optional,
    matchReasons,
    atsInfo,
    profileCompletion,
    remainingQuestions,
  };
}