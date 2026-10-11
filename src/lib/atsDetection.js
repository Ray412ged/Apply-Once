// ATS (Applicant Tracking System) detection and classification utilities.
// Detects which ATS platform an employer uses, classifies the application
// experience, and provides template metadata for the Readiness Scanner.

export const APPLICATION_STYLES = {
  QUICK_APPLY: "Quick Apply",
  ONE_CLICK: "One-Click Apply",
  ENTERPRISE: "Enterprise Application",
  MULTI_STEP: "Multi-Step Application",
};

export const ATS_PLATFORMS = {
  Workday: {
    urlPatterns: ["workday", "myworkdayjobs.com", "wd1.myworkdayjobs.com", "wd3.myworkdayjobs.com"],
    requiresEmployerAccount: true,
    defaultStyle: APPLICATION_STYLES.ENTERPRISE,
    estimatedCompletionMinutes: { firstTime: 20, returning: 8 },
    resumeRequired: true,
    resumeParsing: false,
    coverLetterAccepted: true,
    estimatedSteps: 9,
    applicationStages: [
      "My Information",
      "General Questions",
      "Job Specific Questions",
      "Qualifications",
      "EEO Self-Identify",
      "Disability",
      "File Attachments",
      "eSignature",
      "Review & Submit",
    ],
    initialRequiredFields: [
      "First & Last Name",
      "Address",
      "Phone & Email",
      "Minimum Pay",
      "Work Authorization",
    ],
  },
  Taleo: {
    urlPatterns: ["taleo.net", "taleocloud.net"],
    requiresEmployerAccount: true,
    defaultStyle: APPLICATION_STYLES.ENTERPRISE,
    estimatedCompletionMinutes: { firstTime: 18, returning: 7 },
    resumeRequired: true,
    resumeParsing: false,
    coverLetterAccepted: true,
    estimatedSteps: 7,
    applicationStages: [
      "Account Creation",
      "Personal Information",
      "Work Experience",
      "Education",
      "Additional Questions",
      "Resume Upload",
      "Review & Submit",
    ],
    initialRequiredFields: ["Account", "Personal Info", "Work History", "Resume"],
  },
  iCIMS: {
    urlPatterns: ["icims.com", "careers.icims.com"],
    requiresEmployerAccount: true,
    defaultStyle: APPLICATION_STYLES.ENTERPRISE,
    estimatedCompletionMinutes: { firstTime: 15, returning: 6 },
    resumeRequired: true,
    resumeParsing: true,
    coverLetterAccepted: true,
    estimatedSteps: 6,
    applicationStages: [
      "Sign In / Create Account",
      "Personal Information",
      "Work History",
      "Education",
      "Questionnaire",
      "Resume Upload & Submit",
    ],
    initialRequiredFields: ["Account", "Personal Info", "Work History", "Resume"],
  },
  BrassRing: {
    urlPatterns: ["brassring.com", "kr2.brassring.com"],
    requiresEmployerAccount: true,
    defaultStyle: APPLICATION_STYLES.ENTERPRISE,
    estimatedCompletionMinutes: { firstTime: 16, returning: 7 },
    resumeRequired: true,
    resumeParsing: false,
    coverLetterAccepted: true,
    estimatedSteps: 6,
    applicationStages: [
      "Account Sign-In",
      "Personal Information",
      "Experience & Education",
      "Screening Questions",
      "Resume Upload",
      "Review & Submit",
    ],
    initialRequiredFields: ["Account", "Personal Info", "Work History", "Resume"],
  },
  Greenhouse: {
    urlPatterns: ["greenhouse.io", "boards.greenhouse.io"],
    requiresEmployerAccount: false,
    defaultStyle: APPLICATION_STYLES.QUICK_APPLY,
    estimatedCompletionMinutes: { firstTime: 6, returning: 3 },
    resumeRequired: true,
    resumeParsing: true,
    coverLetterAccepted: true,
    estimatedSteps: 2,
    applicationStages: ["Application Form", "Questionnaire (optional)"],
    initialRequiredFields: ["Name", "Email", "Phone", "Resume"],
  },
  Lever: {
    urlPatterns: ["lever.co", "jobs.lever.co"],
    requiresEmployerAccount: false,
    defaultStyle: APPLICATION_STYLES.QUICK_APPLY,
    estimatedCompletionMinutes: { firstTime: 5, returning: 2 },
    resumeRequired: true,
    resumeParsing: true,
    coverLetterAccepted: true,
    estimatedSteps: 1,
    applicationStages: ["Application Form"],
    initialRequiredFields: ["Name", "Email", "Resume"],
  },
  iSolvedHire: {
    urlPatterns: ["isolvedhire.com", "isolved.peopleedge.com"],
    requiresEmployerAccount: false,
    defaultStyle: APPLICATION_STYLES.MULTI_STEP,
    estimatedCompletionMinutes: { firstTime: 10, returning: 4 },
    resumeRequired: true,
    resumeParsing: true,
    coverLetterAccepted: true,
    estimatedSteps: 5,
    applicationStages: [
      "Personal Information",
      "Employment History",
      "Education",
      "Additional Questions",
      "Resume Upload & eSignature",
    ],
    initialRequiredFields: ["Personal Info", "Work Authorization", "Resume"],
  },
  Ashby: {
    urlPatterns: ["ashbyhq.com", "careers.ashbyhq.com"],
    requiresEmployerAccount: false,
    defaultStyle: APPLICATION_STYLES.MULTI_STEP,
    estimatedCompletionMinutes: { firstTime: 8, returning: 3 },
    resumeRequired: true,
    resumeParsing: true,
    coverLetterAccepted: true,
    estimatedSteps: 3,
    applicationStages: ["Application", "Questionnaire", "Resume Upload"],
    initialRequiredFields: ["Name", "Email", "Resume"],
  },
  Phenom: {
    urlPatterns: ["phenompeople.com"],
    requiresEmployerAccount: false,
    defaultStyle: APPLICATION_STYLES.MULTI_STEP,
    estimatedCompletionMinutes: { firstTime: 10, returning: 4 },
    resumeRequired: true,
    resumeParsing: true,
    coverLetterAccepted: true,
    estimatedSteps: 4,
    applicationStages: ["Profile", "Experience", "Questions", "Resume Upload"],
    initialRequiredFields: ["Personal Info", "Work History", "Resume"],
  },
};

/**
 * Detects the ATS platform from an application URL or posting URL.
 * @param {string} url - The application or posting URL
 * @returns {string|null} The ATS platform key, or null if not detected
 */
export function detectAtsType(url) {
  if (!url) return null;
  const lower = url.toLowerCase();

  for (const [platformName, config] of Object.entries(ATS_PLATFORMS)) {
    if (config.urlPatterns.some((pattern) => lower.includes(pattern))) {
      return platformName;
    }
  }

  return null;
}

/**
 * Determines whether the ATS requires the user to create or sign in to
 * an employer-specific account before completing the application.
 */
export function requiresEmployerAccount(atsType) {
  const platform = ATS_PLATFORMS[atsType];
  return platform?.requiresEmployerAccount ?? false;
}

/**
 * Classifies the application experience style.
 * Returns one of APPLICATION_STYLES values.
 * Falls back to the ATS default, or "Multi-Step Application" if unknown.
 */
export function classifyApplicationStyle(atsType, job) {
  const platform = ATS_PLATFORMS[atsType];
  if (!platform) {
    // No ATS detected — infer from job data
    if (job?.easy_apply) return APPLICATION_STYLES.QUICK_APPLY;
    if (job?.application_url || job?.posting_url) return APPLICATION_STYLES.MULTI_STEP;
    return APPLICATION_STYLES.MULTI_STEP;
  }
  return platform.defaultStyle;
}

/**
 * Returns full ATS metadata for a job, including detected platform,
 * application style, estimated time, resume requirements, and stages.
 * This is the primary function the Readiness Scanner should call.
 */
export function getAtsMetadata(job) {
  const url = job?.application_url || job?.posting_url || job?.posting_url || "";
  const atsType = detectAtsType(url) || job?.ats_type || null;
  const platform = atsType ? ATS_PLATFORMS[atsType] : null;
  const applicationStyle = classifyApplicationStyle(atsType, job);

  return {
    atsType,
    atsLabel: formatAtsLabel(atsType),
    applicationStyle,
    requiresAccount: platform?.requiresEmployerAccount ?? false,
    resumeRequired: platform?.resumeRequired ?? true,
    resumeParsing: platform?.resumeParsing ?? false,
    coverLetterAccepted: platform?.coverLetterAccepted ?? false,
    estimatedCompletionMinutes: platform?.estimatedCompletionMinutes ?? null,
    estimatedSteps: platform?.estimatedSteps ?? null,
    applicationStages: platform?.applicationStages ?? [],
    initialRequiredFields: platform?.initialRequiredFields ?? [],
    isKnown: !!platform,
  };
}

/**
 * Formats the ATS type key into a human-readable label.
 */
export function formatAtsLabel(atsType) {
  if (!atsType) return "External Website";
  const labels = {
    Workday: "Workday",
    Taleo: "Oracle Taleo",
    iCIMS: "iCIMS",
    BrassRing: "IBM BrassRing",
    Greenhouse: "Greenhouse",
    Lever: "Lever",
    iSolvedHire: "iSolved Hire (ApplicantPro)",
    Ashby: "Ashby",
    Phenom: "Phenom",
  };
  return labels[atsType] || atsType;
}