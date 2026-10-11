/**
 * Job Matcher — dedicated module for all job matching calculations.
 *
 * The engine never calculates job matching directly — it always
 * delegates to this module.
 *
 * Public API:
 *   - matchJobs(snapshot, jobs)              → { totalMatches, strongMatches, moderateMatches }
 *   - computeMatchScore(job, rawData)        → { score, level, reasons, missing }
 *   - computeMatchLevel(job, preferences)    → match level string
 *   - getMatchReasons(job, pref, snapshot)   → string[]
 *   - getStructuredMatchReasons(job, pref, s) → { category, label }[]
 */

import { buildProfileSnapshot } from "./profileSnapshot";
import { JOB_MATCH_THRESHOLDS } from "./weights";

// ─── Shared predicates ────────────────────────────────────────────────────

function matchedDesiredTitles(job, preferences) {
  if (!preferences?.desired_job_titles?.length) return [];
  const jobTitleLower = (job.job_title || "").toLowerCase();
  return preferences.desired_job_titles.filter((t) =>
    jobTitleLower.includes(t.toLowerCase())
  );
}

function matchedDesiredIndustries(job, preferences) {
  if (!preferences?.desired_industries?.length || !job.industry) return [];
  const jobIndustryLower = job.industry.toLowerCase();
  return preferences.desired_industries.filter((i) =>
    jobIndustryLower.includes(i.toLowerCase())
  );
}

function isStateMatch(job, snapshot) {
  const userProfile = snapshot?.profile;
  if (!userProfile?.state || !job.state) return false;
  return job.state.toLowerCase() === userProfile.state.toLowerCase();
}

function isCityMatch(job, snapshot) {
  const userProfile = snapshot?.profile;
  if (!userProfile?.city || !job.city) return false;
  return job.city.toLowerCase() === userProfile.city.toLowerCase();
}

function isEmploymentTypeMatch(job, preferences) {
  if (!preferences?.employment_types?.length || !job.employment_type) return false;
  return preferences.employment_types.includes(job.employment_type);
}

function isRemoteMatch(job, preferences) {
  if (!preferences?.remote_preference || !job.remote_type || job.remote_type === "Not specified") {
    return false;
  }
  const pref = preferences.remote_preference;
  const remote = job.remote_type;
  return (
    pref === "No preference" ||
    (pref === "Remote only" && remote === "Remote") ||
    (pref === "Remote preferred" && (remote === "Remote" || remote === "Hybrid")) ||
    (pref === "Hybrid" && remote === "Hybrid") ||
    (pref === "On-site only" && remote === "On-site")
  );
}

function matchedSkills(job, skills) {
  if (!skills?.length || !job.keywords?.length) return [];
  return skills.filter((s) =>
    job.keywords.some((jk) => jk.toLowerCase().includes(s.skill_name.toLowerCase()))
  );
}

function hasKeywordMatch(job, desiredKeywords) {
  if (!desiredKeywords?.length || !job.keywords?.length) return false;
  return desiredKeywords.some((k) =>
    job.keywords.some((jk) => jk.toLowerCase().includes(k.toLowerCase()))
  );
}

// ─── Match level (lightweight) ────────────────────────────────────────────

export function computeMatchLevel(job, preferences, profile) {
  if (!preferences && !profile) return "Review Needed";

  const snapshot = buildProfileSnapshot(profile);
  const prefs = preferences || snapshot.preferences;

  let score = 0;
  let maxScore = 0;

  if (prefs?.desired_job_titles?.length > 0) {
    maxScore += 3;
    if (matchedDesiredTitles(job, prefs).length > 0) score += 3;
  }

  const userProfile = snapshot.profile;
  if (userProfile?.city || userProfile?.state) {
    maxScore += 2;
    if (isStateMatch(job, snapshot)) score += 1;
    if (isCityMatch(job, snapshot)) score += 1;
  }

  if (prefs?.employment_types?.length > 0 && job.employment_type) {
    maxScore += 1;
    if (isEmploymentTypeMatch(job, prefs)) score += 1;
  }

  if (prefs?.remote_preference && job.remote_type) {
    maxScore += 1;
    if (isRemoteMatch(job, prefs)) score += 1;
  }

  if (prefs?.desired_keywords?.length > 0 && job.keywords?.length > 0) {
    maxScore += 1;
    if (hasKeywordMatch(job, prefs.desired_keywords)) score += 1;
  }

  if (maxScore === 0) return "Review Needed";

  const ratio = score / maxScore;
  if (ratio >= 0.7) return "Strong Match";
  if (ratio >= 0.4) return "Possible Match";
  if (ratio > 0) return "Stretch Opportunity";
  return "Review Needed";
}

// ─── Structured match reasons ──────────────────────────────────────────────

export function getMatchReasons(job, preferences, rawData) {
  return getStructuredMatchReasons(job, preferences, rawData).map((r) => r.label);
}

export function getStructuredMatchReasons(job, preferences, rawData) {
  const snapshot = buildProfileSnapshot(rawData);
  const prefs = preferences || snapshot.preferences;
  const reasons = [];

  const matchedTitles = matchedDesiredTitles(job, prefs);
  if (matchedTitles.length > 0) {
    reasons.push({
      category: "interests",
      label: `Matches your interest in ${matchedTitles.join(", ")}`,
    });
  }

  if (snapshot.employmentHistory?.length > 0) {
    const jobTitleLower = (job.job_title || "").toLowerCase();
    const hasMatch = snapshot.employmentHistory.some((emp) => {
      const empTitle = (emp.job_title || "").toLowerCase();
      return empTitle && (jobTitleLower.includes(empTitle) || empTitle.includes(jobTitleLower));
    });
    if (hasMatch) {
      reasons.push({ category: "experience", label: "Matches your work experience" });
    }
  }

  const matchedSk = matchedSkills(job, snapshot.skills);
  if (matchedSk.length > 0) {
    reasons.push({
      category: "skills",
      label: `You have relevant skills: ${matchedSk.map((s) => s.skill_name).join(", ")}`,
    });
  }

  if (prefs?.pay_preference && (job.salary_min || job.salary_max || job.salary_text)) {
    const prefLower = prefs.pay_preference.toLowerCase();
    const isFlexible = prefLower.includes("flexible");
    const jobMin = job.salary_min || 0;
    const hasPay = jobMin > 0 || job.salary_text;
    if (isFlexible || hasPay) {
      reasons.push({ category: "pay", label: "Matches your preferred pay range" });
    }
  }

  if (isStateMatch(job, snapshot)) {
    reasons.push({ category: "location", label: `Located in your state (${job.state})` });
  }

  if (isRemoteMatch(job, prefs)) {
    reasons.push({ category: "remote", label: "Matches your work arrangement preference" });
  }

  if (isEmploymentTypeMatch(job, prefs)) {
    reasons.push({
      category: "employment_type",
      label: `${job.employment_type} position, which you're looking for`,
    });
  }

  return reasons;
}

// ─── Domain experience detection ───────────────────────────────────────────

const DOMAIN_KEYWORDS = {
  "Behavioral Health Experience": ["behavioral health", "mental health", "psychiatric", "psych"],
  "Substance Use Experience": ["substance use", "substance abuse", "addiction", "recovery", "sud", "drug counseling", "chemical dependency", "alcohol"],
  "Care Coordination Experience": ["care coordination", "care coordinator", "discharge planning", "discharge plan", "transition of care"],
  "Corrections Experience": ["corrections", "correctional", "prison", "jail", "inmate", "detention", "probation", "parole"],
  "Case Management": ["case management", "case manager", "casework"],
  "Group Facilitation": ["group counseling", "group therapy", "group facilitation", "group session", "group treatment"],
};

function detectDomainExperience(employment, skills, credentials) {
  const results = [];
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    const lowerKeywords = keywords.map((k) => k.toLowerCase());
    const inEmployment = employment.some((e) => {
      const text = `${e.job_title || ""} ${e.employer_name || ""} ${e.duties || ""}`.toLowerCase();
      return lowerKeywords.some((k) => text.includes(k));
    });
    const inSkills = skills.some((s) => {
      const text = (s.skill_name || "").toLowerCase();
      return lowerKeywords.some((k) => text.includes(k));
    });
    const inCredentials = credentials.some((c) => {
      const text = `${c.credential_name || ""} ${c.issuing_organization || ""}`.toLowerCase();
      return lowerKeywords.some((k) => text.includes(k));
    });
    if (inEmployment || inSkills || inCredentials) {
      results.push(domain);
    }
  }
  return results;
}

function findMissingQualifications(job, credentials, education, skills) {
  const missing = [];

  if (job.required_credentials) {
    const reqCreds = job.required_credentials.split(/[\n,;]/).map((s) => s.trim()).filter(Boolean);
    for (const req of reqCreds) {
      if (req.length < 3) continue;
      const reqLower = req.toLowerCase();
      const hasMatch = credentials.some((c) => {
        const credText = `${c.credential_name || ""} ${c.credential_type || ""}`.toLowerCase();
        return credText.includes(reqLower) || reqLower.includes(credText);
      });
      if (!hasMatch) missing.push(req);
    }
  }

  if (job.preferred_qualifications) {
    const prefLines = job.preferred_qualifications.split(/\n/).map((s) => s.trim()).filter(Boolean);
    for (const pref of prefLines) {
      if (pref.length < 3) continue;
      const prefLower = pref.toLowerCase();
      const hasCred = credentials.some((c) => {
        const credText = `${c.credential_name || ""} ${c.credential_type || ""}`.toLowerCase();
        return credText.includes(prefLower) || prefLower.includes(credText);
      });
      const hasEdu = education.some((e) => {
        const eduText = `${e.degree_or_credential || ""} ${e.field_of_study || ""}`.toLowerCase();
        return eduText.includes(prefLower) || prefLower.includes(eduText);
      });
      const hasSkill = skills.some((s) => {
        const skillText = (s.skill_name || "").toLowerCase();
        return skillText.includes(prefLower) || prefLower.includes(skillText);
      });
      if (!hasCred && !hasEdu && !hasSkill) missing.push(pref);
    }
  }

  return missing;
}

// ─── Comprehensive match score ─────────────────────────────────────────────

/**
 * Comprehensive match score using only verified profile data.
 * Accepts either a raw profileData object or a snapshot.
 *
 * @returns {{ score, level, reasons, missing, totalScore, totalMax }}
 */
export function computeMatchScore(job, rawData) {
  const snapshot = buildProfileSnapshot(rawData);
  const {
    education = [],
    employmentHistory: employment = [],
    skills = [],
    certifications: credentials = [],
    preferences: prefsRaw,
  } = snapshot;

  const prefs = Array.isArray(prefsRaw) ? prefsRaw[0] : prefsRaw;

  const reasons = [];
  let totalScore = 0;
  let totalMax = 0;

  // 1. Education (max 17)
  const maxEdu = 17;
  let eduScore = 0;
  if (education.length === 0) {
    reasons.push("No education records — cannot assess education fit");
  } else if (job.required_education) {
    const reqLower = job.required_education.toLowerCase();
    const hasMatch = education.some((e) => {
      const degreeLower = (e.degree_or_credential || "").toLowerCase();
      const fieldLower = (e.field_of_study || "").toLowerCase();
      return reqLower.includes(degreeLower) || reqLower.includes(fieldLower) ||
        degreeLower.includes(reqLower) || fieldLower.includes(reqLower);
    });
    eduScore = hasMatch ? maxEdu : Math.floor(maxEdu * 0.3);
    reasons.push(hasMatch
      ? "Your education records match the job's education requirements"
      : "Your education records don't clearly match the job's education requirements");
  } else {
    eduScore = Math.floor(maxEdu * 0.7);
    reasons.push("You have education records (job has no specific education requirement)");
  }
  totalScore += eduScore;
  totalMax += maxEdu;

  // 2. Employment History (max 17)
  const maxEmp = 17;
  let empScore = 0;
  if (employment.length === 0) {
    reasons.push("No employment history — cannot assess experience fit");
  } else {
    const jobTitleLower = (job.job_title || "").toLowerCase();
    const hasTitleMatch = employment.some((e) => {
      const empTitle = (e.job_title || "").toLowerCase();
      return empTitle && (jobTitleLower.includes(empTitle) || empTitle.includes(jobTitleLower));
    });
    if (hasTitleMatch) {
      empScore = maxEmp;
      reasons.push("Your work experience directly relates to this job title");
    } else if (employment.length >= 2) {
      empScore = Math.floor(maxEmp * 0.5);
      reasons.push("You have work history, though not directly matching this job title");
    } else {
      empScore = Math.floor(maxEmp * 0.3);
      reasons.push("Limited work history relevant to this position");
    }
  }
  totalScore += empScore;
  totalMax += maxEmp;

  // 3. Skills (max 17)
  const maxSkills = 17;
  let skillsScore = 0;
  if (skills.length === 0) {
    reasons.push("No skills recorded — cannot assess skills fit");
  } else if (job.keywords && job.keywords.length > 0) {
    const jobKeywords = job.keywords.map((k) => k.toLowerCase());
    const matched = skills.filter((s) =>
      jobKeywords.some((jk) => jk.includes(s.skill_name.toLowerCase()) || s.skill_name.toLowerCase().includes(jk))
    );
    const ratio = matched.length / Math.max(job.keywords.length, 1);
    skillsScore = Math.round(maxSkills * ratio);
    if (matched.length > 0) {
      reasons.push(`You have ${matched.length} relevant skill${matched.length > 1 ? "s" : ""}: ${matched.map((s) => s.skill_name).join(", ")}`);
    } else {
      reasons.push("Your recorded skills don't match the job's key skills");
    }
  } else {
    skillsScore = Math.floor(maxSkills * 0.5);
    reasons.push("You have skills recorded (job has no specific skill keywords)");
  }
  totalScore += skillsScore;
  totalMax += maxSkills;

  // 4. Licensure (max 16)
  const maxLicense = 16;
  let licenseScore = 0;
  const licenses = credentials.filter((c) => c.credential_type === "License");
  if (job.required_credentials) {
    const reqLower = job.required_credentials.toLowerCase();
    if (licenses.length === 0) {
      reasons.push("No licenses recorded — job may require specific licensure");
    } else {
      const hasMatch = licenses.some((l) =>
        reqLower.includes((l.credential_name || "").toLowerCase()) ||
        (l.credential_name || "").toLowerCase().includes(reqLower)
      );
      licenseScore = hasMatch ? maxLicense : Math.floor(maxLicense * 0.3);
      reasons.push(hasMatch
        ? "You have a license that matches the job's requirements"
        : "Your licenses don't clearly match the job's credential requirements");
    }
  } else {
    if (licenses.length > 0) {
      licenseScore = Math.floor(maxLicense * 0.7);
      reasons.push("You have active licenses on file");
    } else {
      reasons.push("No licenses recorded (job has no specific license requirement)");
    }
  }
  totalScore += licenseScore;
  totalMax += maxLicense;

  // 5. Certifications (max 16)
  const maxCert = 16;
  let certScore = 0;
  const certifications = credentials.filter((c) => c.credential_type === "Certification");
  if (job.preferred_qualifications) {
    const prefLower = job.preferred_qualifications.toLowerCase();
    if (certifications.length === 0) {
      reasons.push("No certifications recorded — job lists preferred qualifications");
    } else {
      const hasMatch = certifications.some((c) =>
        prefLower.includes((c.credential_name || "").toLowerCase()) ||
        (c.credential_name || "").toLowerCase().includes(prefLower)
      );
      certScore = hasMatch ? maxCert : Math.floor(maxCert * 0.4);
      reasons.push(hasMatch
        ? "You have a certification that matches the job's preferred qualifications"
        : "Your certifications don't match the job's preferred qualifications");
    }
  } else {
    if (certifications.length > 0) {
      certScore = Math.floor(maxCert * 0.6);
      reasons.push("You have certifications on file");
    } else {
      reasons.push("No certifications recorded");
    }
  }
  totalScore += certScore;
  totalMax += maxCert;

  // 6. Career Goals (max 17)
  const maxGoals = 17;
  let goalsScore = 0;
  if (!prefs) {
    reasons.push("No career goals recorded — cannot assess goals alignment");
  } else {
    let goalMatches = 0;
    let goalChecks = 0;

    if (prefs.desired_job_titles?.length > 0) {
      goalChecks++;
      if (matchedDesiredTitles(job, prefs).length > 0) goalMatches++;
    }
    if (prefs.desired_industries?.length > 0 && job.industry) {
      goalChecks++;
      if (matchedDesiredIndustries(job, prefs).length > 0) goalMatches++;
    }
    if (prefs.employment_types?.length > 0 && job.employment_type) {
      goalChecks++;
      if (isEmploymentTypeMatch(job, prefs)) goalMatches++;
    }
    if (snapshot.profile?.state && job.state) {
      goalChecks++;
      if (isStateMatch(job, snapshot)) goalMatches++;
    }
    if (prefs.remote_preference && job.remote_type) {
      goalChecks++;
      if (isRemoteMatch(job, prefs)) goalMatches++;
    }

    if (goalChecks > 0) {
      goalsScore = Math.round(maxGoals * (goalMatches / goalChecks));
      reasons.push(`Career goals match: ${goalMatches} of ${goalChecks} preferences align with this job`);
    } else {
      goalsScore = Math.floor(maxGoals * 0.3);
      reasons.push("No specific career goals to compare against this job");
    }
  }
  totalScore += goalsScore;
  totalMax += maxGoals;

  // Domain experience (bonus reasons, not scored)
  const domainMatches = detectDomainExperience(employment, skills, credentials);
  domainMatches.forEach((d) => reasons.push(`✓ ${d}`));

  // Missing qualifications
  const missing = findMissingQualifications(job, credentials, education, skills);

  const score = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;
  let level;
  if (score >= 70) level = "Strong Match";
  else if (score >= 40) level = "Possible Match";
  else if (score > 0) level = "Stretch Opportunity";
  else level = "Review Needed";

  return { score, level, reasons, missing, totalScore, totalMax };
}

// ─── Aggregate job matching ───────────────────────────────────────────────

/**
 * Calculates how many jobs match the user's profile.
 *
 * @param {EmploymentProfileSnapshot} snapshot
 * @param {Array} jobs — JobPosting records to evaluate
 * @returns {JobMatchAggregate}
 */
export function matchJobs(snapshot, jobs = []) {
  if (!snapshot || !jobs || jobs.length === 0) {
    return { total: 0, strong: 0, moderate: 0, highConfidence: 0, mediumConfidence: 0, lowConfidence: 0 };
  }

  let strong = 0;
  let moderate = 0;
  let low = 0;

  for (const job of jobs) {
    const { score } = computeMatchScore(job, snapshot);
    const ratio = score / 100;
    if (ratio >= JOB_MATCH_THRESHOLDS.high) strong++;
    else if (ratio >= JOB_MATCH_THRESHOLDS.medium) moderate++;
    else if (ratio > 0) low++;
  }

  return {
    total: strong + moderate + low,
    strong,
    moderate,
    // Backward-compatible aliases
    highConfidence: strong,
    mediumConfidence: moderate,
    lowConfidence: low,
  };
}