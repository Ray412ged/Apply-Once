/**
 * Improve Next recommendation builder.
 *
 * Produces a prioritized list of actionable, specific recommendations that
 * tell the user exactly what they can do next to strengthen their application
 * profile. This replaces the old generic weighted-category labels
 * ("Experience", "Education & Training", "References") which described
 * scoring categories but never told the user what action to take.
 *
 * Priority order:
 *   1. Supporting sections the user resolved without adding information
 *      (references / education / credentials marked "none to add").
 *   2. Missing or incomplete core information
 *      (contact, skills, professional summary, employment).
 *   3. Thin existing information (e.g. employment without responsibilities
 *      or accomplishments).
 *   4. Ready state → explore job matches.
 *
 * This module performs NO scoring. It only reads snapshot data and the
 * section statuses the engine already computed, then maps them to concrete,
 * respectful, route-connected actions.
 *
 * Leaf module — imports only from constants.
 */

import { SECTION_STATUS } from "./constants";

const NO_EDUCATION_ANSWERS = ["none_declared", "No High School Diploma or GED"];

/** An employment record counts as having responsibilities if any duty,
 *  responsibility selection, or notes describing the work are present. */
function recordHasResponsibilities(record) {
  return !!(
    record?.duties?.trim() ||
    (record?.responsibilities_selected?.length) ||
    (record?.responsibilities_custom?.length) ||
    record?.additional_notes?.trim()
  );
}

function recordHasAccomplishments(record) {
  return !!record?.accomplishments?.trim();
}

/**
 * Builds the prioritized Improve Next recommendation list from a snapshot
 * and the engine's section statuses.
 *
 * @param {EmploymentProfileSnapshot} snapshot
 * @param {Record<string, SectionStatus>} sectionStatuses
 * @returns {Array<{id:string,title:string,description:string,route:string,sectionId:string,priority:number,cta:string}>}
 */
export function buildImproveNextRecommendations(snapshot, sectionStatuses = {}) {
  if (!snapshot) return [];

  const {
    profile,
    employmentHistory = [],
    education = [],
    certifications = [],
    references = [],
  } = snapshot;

  const recs = [];

  // ── Priority 1: Supporting sections resolved without adding information ──
  if (references.length === 0 && profile?.references_status === "dont_have") {
    recs.push({
      id: "add-reference",
      title: "Add a Professional Reference",
      description:
        "A workforce specialist, supervisor, instructor, volunteer coordinator, or other professional contact may be able to serve as a reference.",
      route: "/profile/edit?section=references",
      sectionId: "references",
      priority: 1,
      cta: "Add Reference",
    });
  }

  if (education.length === 0 && NO_EDUCATION_ANSWERS.includes(profile?.education_level_answer)) {
    recs.push({
      id: "add-education",
      title: "Add Your Highest Grade or Training",
      description:
        "Include the highest grade you completed, GED preparation, vocational training, apprenticeship, or other education that applies to you.",
      route: "/profile/edit?section=education",
      sectionId: "education",
      priority: 1,
      cta: "Add Education",
    });
  }

  if (certifications.length === 0 && profile?.credentials_status === "no") {
    recs.push({
      id: "add-credential",
      title: "Add a License or Certification",
      description:
        "Include any current license, safety card, training certificate, professional credential, or program completion certificate.",
      route: "/profile/edit?section=credentials",
      sectionId: "credentials",
      priority: 1,
      cta: "Add Credential",
    });
  }

  // ── Priority 2: Missing or incomplete core information ───────────────────
  const contactStatus = sectionStatuses.contact?.status;
  if (contactStatus === SECTION_STATUS.NEEDS_ATTENTION || contactStatus === SECTION_STATUS.IN_PROGRESS) {
    recs.push({
      id: "complete-contact",
      title: "Complete Your Contact Information",
      description:
        "Employers need your name, email, phone, and location to reach you. Add the missing contact details so applications go through smoothly.",
      route: "/profile/edit?section=about",
      sectionId: "contact",
      priority: 2,
      cta: "Complete Info",
    });
  }

  const skillsStatus = sectionStatuses.skills?.status;
  if (skillsStatus === SECTION_STATUS.NEEDS_ATTENTION || skillsStatus === SECTION_STATUS.IN_PROGRESS) {
    recs.push({
      id: "add-skills",
      title: "Add Your Skills",
      description:
        "List the skills you've gained from work, training, volunteering, or daily life so employers can see what you bring to the role.",
      route: "/profile/edit?section=skills",
      sectionId: "skills",
      priority: 2,
      cta: "Add Skills",
    });
  }

  const summaryStatus = sectionStatuses.summary?.status;
  if (summaryStatus === SECTION_STATUS.NEEDS_ATTENTION || summaryStatus === SECTION_STATUS.IN_PROGRESS) {
    recs.push({
      id: "complete-summary",
      title: "Complete Your Professional Summary",
      description:
        "A short summary helps employers understand your strengths and what kind of work you're looking for.",
      route: "/profile/edit?section=introduction",
      sectionId: "summary",
      priority: 2,
      cta: "Add Summary",
    });
  }

  const employmentStatus = sectionStatuses.employment?.status;
  if (employmentStatus === SECTION_STATUS.NEEDS_ATTENTION) {
    recs.push({
      id: "add-experience",
      title: "Add Employment or Other Meaningful Experience",
      description:
        "Add any paid work, volunteer roles, caregiving, informal or side jobs, community service, training projects, or self-employment that shows what you can do.",
      route: "/profile/edit?section=employment",
      sectionId: "employment",
      priority: 2,
      cta: "Add Experience",
    });
  }

  // ── Priority 3: Thin existing information ────────────────────────────────
  if (employmentHistory.length > 0) {
    const missingResponsibilities = employmentHistory.filter((r) => !recordHasResponsibilities(r));
    const missingAccomplishments = employmentHistory.filter((r) => !recordHasAccomplishments(r));

    if (missingResponsibilities.length > 0) {
      recs.push({
        id: "add-responsibilities",
        title: "Add Responsibilities to Your Experience",
        description:
          "Describe what you did in each role — the tasks you handled, the tools you used, and how you contributed day to day.",
        route: "/profile/edit?section=employment",
        sectionId: "employment",
        priority: 3,
        cta: "Add Responsibilities",
      });
    } else if (missingAccomplishments.length > 0) {
      recs.push({
        id: "add-accomplishments",
        title: "Add Accomplishments to Your Experience",
        description:
          "Add a proud moment, a problem you solved, or recognition you earned in each role. Accomplishments help your experience stand out.",
        route: "/profile/edit?section=employment",
        sectionId: "employment",
        priority: 3,
        cta: "Add Accomplishments",
      });
    }
  }

  // ── Priority 4: Ready state ─────────────────────────────────────────────
  if (recs.length === 0) {
    return [readyRecommendation()];
  }

  recs.sort((a, b) => a.priority - b.priority);
  return recs;
}

function readyRecommendation() {
  return {
    id: "explore-jobs",
    title: "Explore Your Job Matches",
    description: "Your application profile is ready. Review jobs matched to your information.",
    route: "/jobs",
    sectionId: "jobs",
    priority: 4,
    cta: "Explore Jobs",
  };
}