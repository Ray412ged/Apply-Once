// Job filter definitions and filtering logic for the Jobs page.

export const FILTER_DEFAULTS = {
  payMin: "",
  industry: "",
  occupation: "",
  employmentType: "",
  experienceLevel: "",
  remote: "",
  educationRequired: "",
  postedWithin: "",
  company: "",
};

export const POSTED_WITHIN_OPTIONS = [
  { value: "1", label: "Last 24 hours" },
  { value: "3", label: "Last 3 days" },
  { value: "7", label: "Last week" },
  { value: "14", label: "Last 2 weeks" },
  { value: "30", label: "Last month" },
];

export const EMPLOYMENT_TYPE_OPTIONS = [
  "Full-time",
  "Part-time",
  "Temporary",
  "Contract",
  "Seasonal",
  "Internship",
];

export const REMOTE_OPTIONS = ["Remote", "Hybrid", "On-site"];

export const EXPERIENCE_LEVEL_OPTIONS = [
  "No experience",
  "Less than 1 year",
  "1–3 years",
  "3–5 years",
  "5–10 years",
  "10+ years",
];

export const EDUCATION_REQUIRED_OPTIONS = [
  "None",
  "High School or GED",
  "Trade School / Certificate",
  "Associate's Degree",
  "Bachelor's Degree",
  "Master's Degree",
];

export function applyFilters(jobs, filters) {
  return jobs.filter((job) => {
    if (filters.payMin && job.salary_min && job.salary_min < Number(filters.payMin)) {
      return false;
    }
    if (filters.industry && job.industry !== filters.industry) {
      return false;
    }
    if (filters.employmentType && job.employment_type !== filters.employmentType) {
      return false;
    }
    if (filters.remote && job.remote_type !== filters.remote) {
      return false;
    }
    if (filters.experienceLevel && job.experience_level_required !== filters.experienceLevel) {
      return false;
    }
    if (filters.educationRequired && job.required_education !== filters.educationRequired) {
      return false;
    }
    if (filters.postedWithin && job.posting_date) {
      const daysAgo = Math.floor(
        (Date.now() - new Date(job.posting_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysAgo > Number(filters.postedWithin)) return false;
    }
    if (filters.company) {
      const c = filters.company.toLowerCase();
      if (!job.employer_name?.toLowerCase().includes(c)) return false;
    }
    if (filters.occupation) {
      const occ = filters.occupation.toLowerCase();
      const titleMatch = job.job_title?.toLowerCase().includes(occ);
      const keywordMatch = job.keywords?.some((k) => k.toLowerCase().includes(occ));
      if (!titleMatch && !keywordMatch) return false;
    }
    return true;
  });
}

export function getUniqueIndustries(jobs) {
  const set = new Set(jobs.map((j) => j.industry).filter(Boolean));
  return Array.from(set).sort();
}

export function getUniqueCompanies(jobs) {
  const set = new Set(jobs.map((j) => j.employer_name).filter(Boolean));
  return Array.from(set).sort();
}

/**
 * One canonical filter pipeline consumed by BOTH the Discovery and List
 * views. Switching views must never change the eligible job set.
 *
 * Pipeline: exclude dismissed → search term → active filters → tab partition.
 *
 * The participant experience is one curated Jobs board.
 * "Saved" is simply a personal view of that same board.
 */
export function getFilteredJobs({
  jobs,
  searchQuery = "",
  filters = FILTER_DEFAULTS,
  activeTab = "all",
  savedIds,
  passIds,
}) {
  const passSet = passIds instanceof Set ? passIds : new Set(passIds || []);
  const savedSet = savedIds instanceof Set ? savedIds : new Set(savedIds || []);

  const runCommonPipeline = (list) => {
    let out = list.filter((j) => !passSet.has(j.id));
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      out = out.filter(
        (j) =>
          j.job_title?.toLowerCase().includes(q) ||
          j.employer_name?.toLowerCase().includes(q) ||
          j.city?.toLowerCase().includes(q) ||
          j.state?.toLowerCase().includes(q)
      );
    }
    return applyFilters(out, filters);
  };

  let result = runCommonPipeline(jobs);

  if (activeTab === "saved") {
    result = result.filter((j) => savedSet.has(j.id));
  }

  return result;
}

export function countActiveFilters(filters) {
  return Object.entries(filters).filter(([key, val]) => val !== "" && val !== null).length;
}