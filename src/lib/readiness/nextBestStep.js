/**
 * Next Best Step — returns exactly ONE primary recommendation.
 *
 * The engine never recommends multiple competing primary actions.
 * It always returns the single highest-value next step based on
 * the user's current section statuses.
 *
 * Priority order (required sections first):
 *   Contact → Experience → Skills → Professional Summary
 * Then:
 *   Explore Matching Jobs
 *
 * After the four required core sections are complete, the engine
 * guides the user through the supporting sections (education,
 * credentials, references) sequentially as the primary Next Best
 * Step, so the user is not sent to job search until those sections
 * are resolved.  Remaining supporting sections are still returned
 * via getOptionalEnhancements() as secondary actions.
 *
 * This module is a leaf node — imports only from constants.
 */

import { SECTION_STATUS } from "./constants";

const STEP_META = {
  contact:     { id: "complete-contact",    title: "Complete Contact Information",  reason: "Employers need a way to reach you. Add your name, email, and phone to get started.", estimatedTime: "2 min",  route: "/profile/edit?section=about" },
  employment:  { id: "add-experience",       title: "Add Your Experience",             reason: "Your work history is the foundation of every application. Even volunteer or informal work counts.", estimatedTime: "10 min", route: "/profile/edit?section=employment" },
  skills:      { id: "add-skills",           title: "Add Your Skills",                 reason: "Skills help Apply Once identify suitable jobs and present your experience clearly.", estimatedTime: "5 min",  route: "/profile/edit?section=skills" },
  summary:     { id: "complete-summary",     title: "Complete Professional Summary",  reason: "A professional summary gives employers a quick snapshot of your value.", estimatedTime: "5 min",  route: "/profile/edit?section=introduction" },
  jobs:        { id: "explore-jobs",          title: "Explore Matching Jobs",           reason: "Your profile is ready. Browse jobs that match your skills and experience.", estimatedTime: "Ongoing", route: "/jobs" },
};

const OPTIONAL_META = {
  education:   { id: "add-education",     title: "Add Education",                   reason: "Adding your education level helps you qualify for more positions.", estimatedTime: "5 min",  route: "/profile/edit?section=education" },
  credentials: { id: "add-credentials",   title: "Add Licenses & Certifications",    reason: "Licenses and certifications unlock qualified job matches for many positions.", estimatedTime: "5 min",  route: "/profile/edit?section=credentials" },
  references:  { id: "add-references",    title: "Add References",                   reason: "Having references ready speeds up the hiring process when employers request them.", estimatedTime: "10 min", route: "/profile/edit?section=references" },
};

const REQUIRED_PRIORITY = ["contact", "employment", "skills", "summary"];
const OPTIONAL_ORDER = ["education", "credentials", "references"];

/**
 * Returns the single highest-priority next step.
 *
 * @param {Record<string, SectionStatus>} sectionStatuses — from evaluateSections()
 * @returns {{ id, sectionId, title, reason, route, priority, requiredForGeneralReadiness, estimatedTime } | null}
 */
export function getNextBestStep(sectionStatuses) {
  if (!sectionStatuses) return null;

  // Required sections: first one that is Needs Attention or In Progress
  for (const key of REQUIRED_PRIORITY) {
    const s = sectionStatuses[key];
    if (s && (s.status === SECTION_STATUS.NEEDS_ATTENTION || s.status === SECTION_STATUS.IN_PROGRESS)) {
      return buildStep(key, s);
    }
  }

  // Core complete → guide through supporting sections (education,
  // credentials, references) sequentially before job search.
  for (const key of OPTIONAL_ORDER) {
    const s = sectionStatuses[key];
    if (s && (s.status === SECTION_STATUS.OPTIONAL || s.status === SECTION_STATUS.IN_PROGRESS)) {
      return buildSupportingStep(key, s);
    }
  }

  // All core + supporting sections resolved → explore matching jobs
  return {
    ...STEP_META.jobs,
    sectionId: "jobs",
    priority: "high",
    requiredForGeneralReadiness: true,
  };
}

function buildSupportingStep(key, sectionStatus) {
  const meta = OPTIONAL_META[key];
  return {
    ...meta,
    sectionId: key,
    priority: "medium",
    requiredForGeneralReadiness: false,
    route: sectionStatus.route || meta.route,
  };
}

/**
 * Returns optional enhancement recommendations for sections that are
 * unaddressed (Optional) or partially started (In Progress).
 * These never replace the primary Next Best Step.
 *
 * @param {Record<string, SectionStatus>} sectionStatuses
 * @returns {Array<{ id, title, reason, route, priority, requiredForGeneralReadiness, estimatedTime }>}
 */
export function getOptionalEnhancements(sectionStatuses) {
  if (!sectionStatuses) return [];
  const result = [];
  for (const key of OPTIONAL_ORDER) {
    const s = sectionStatuses[key];
    if (!s) continue;
    if (s.status === SECTION_STATUS.OPTIONAL || s.status === SECTION_STATUS.IN_PROGRESS) {
      const meta = OPTIONAL_META[key];
      result.push({
        ...meta,
        sectionId: key,
        priority: "optional",
        requiredForGeneralReadiness: false,
      });
    }
  }
  return result;
}

function buildStep(key, sectionStatus) {
  const meta = STEP_META[key] || STEP_META.jobs;
  return {
    ...meta,
    sectionId: key,
    priority: "high",
    requiredForGeneralReadiness: true,
    route: sectionStatus.route || meta.route,
  };
}