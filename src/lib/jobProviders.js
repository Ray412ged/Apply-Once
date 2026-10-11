// Job Provider Abstraction
// Each provider normalizes external job data into the unified JobPosting model.
// To add a new provider: register it in PROVIDERS and implement a normalize function.
// The UI never needs to change — it always works with the normalized JobPosting shape.

export const PROVIDER_IDS = {
  ADZUNA: "adzuna",
  GREENHOUSE: "greenhouse",
  LEVER: "lever",
  ASHBY: "ashby",
  COMPANY_CAREER: "company_career",
  EMPLOYER_PORTAL: "employer_portal",
  MANUAL: "manual",
};

export const PROVIDERS = {
  [PROVIDER_IDS.ADZUNA]: {
    id: PROVIDER_IDS.ADZUNA,
    label: "Adzuna",
    type: "api",
    normalize: normalizeAdzuna,
  },
  [PROVIDER_IDS.GREENHOUSE]: {
    id: PROVIDER_IDS.GREENHOUSE,
    label: "Greenhouse",
    type: "ats",
    normalize: normalizeGreenhouse,
  },
  [PROVIDER_IDS.LEVER]: {
    id: PROVIDER_IDS.LEVER,
    label: "Lever",
    type: "ats",
    normalize: normalizeLever,
  },
  [PROVIDER_IDS.ASHBY]: {
    id: PROVIDER_IDS.ASHBY,
    label: "Ashby",
    type: "ats",
    normalize: normalizeAshby,
  },
  [PROVIDER_IDS.COMPANY_CAREER]: {
    id: PROVIDER_IDS.COMPANY_CAREER,
    label: "Company Career Page",
    type: "scrape",
    normalize: normalizeCompanyCareer,
  },
  [PROVIDER_IDS.EMPLOYER_PORTAL]: {
    id: PROVIDER_IDS.EMPLOYER_PORTAL,
    label: "Employer Portal",
    type: "direct",
    normalize: normalizeEmployerPortal,
  },
  [PROVIDER_IDS.MANUAL]: {
    id: PROVIDER_IDS.MANUAL,
    label: "Manual Entry",
    type: "direct",
    normalize: (raw) => raw,
  },
};

// Unified normalization entry point.
// Takes a provider ID and raw job data, returns a normalized JobPosting-shaped object.
export function normalizeJob(providerId, rawJob) {
  const provider = PROVIDERS[providerId];
  if (!provider) {
    throw new Error(`Unknown provider: ${providerId}`);
  }
  const normalized = provider.normalize(rawJob);
  return {
    ...normalized,
    provider: providerId,
    source_name: normalized.source_name || provider.label,
    external_job_id: normalized.external_job_id || rawJob.id?.toString(),
    import_date: normalized.import_date || new Date().toISOString(),
    last_synced_date: new Date().toISOString(),
    status: normalized.status || "Active",
    salary_currency: normalized.salary_currency || "USD",
  };
}

export function getProvider(providerId) {
  return PROVIDERS[providerId];
}

export function getProviderLabel(providerId) {
  return PROVIDERS[providerId]?.label || "Unknown";
}

export function getAllProviders() {
  return Object.values(PROVIDERS);
}

// --- Provider-specific normalizers ---
// Each takes raw provider data and returns a partial JobPosting object.
// These are stubs ready for when live APIs are connected.

function normalizeAdzuna(raw) {
  return {
    job_title: raw.title || raw.label,
    employer_name: raw.company?.display_name || raw.company_name,
    company_logo_url: raw.company?.logo_url,
    location: raw.location?.display_name || raw.location_string,
    city: raw.location?.area?.[1],
    state: raw.location?.area?.[2],
    postal_code: raw.location?.postcode,
    latitude: raw.latitude,
    longitude: raw.longitude,
    salary_min: raw.salary_min,
    salary_max: raw.salary_max,
    salary_text: raw.salary_is_predicted ? null : raw.salary_display_name,
    posting_url: raw.redirect_url || raw.url,
    external_job_id: raw.id?.toString(),
    posting_date: raw.created || raw.date,
    full_description: raw.description,
    keywords: raw.tags || [],
  };
}

function normalizeGreenhouse(raw) {
  return {
    job_title: raw.title,
    employer_name: raw.company_name || raw.departments?.[0]?.name,
    company_logo_url: raw.logo_url,
    location: raw.location?.name,
    city: raw.location?.name?.split(",")[0]?.trim(),
    posting_url: raw.absolute_url,
    external_job_id: raw.id?.toString(),
    posting_date: raw.updated_at,
    full_description: raw.content,
    employment_type: raw.metadata?.find((m) => m.name === "Employment Type")?.value,
    provider_data: JSON.stringify(raw),
  };
}

function normalizeLever(raw) {
  const locParts = raw.categories?.location?.split(",") || [];
  return {
    job_title: raw.text,
    employer_name: raw.company,
    company_logo_url: raw.companyLogo,
    location: raw.categories?.location,
    city: locParts[0]?.trim(),
    state: locParts[1]?.trim(),
    posting_url: raw.hostedUrl || raw.url,
    external_job_id: raw.id,
    posting_date: raw.createdAt,
    full_description: raw.descriptionPlain || raw.description,
    employment_type: raw.categories?.commitment,
    remote_type: raw.categories?.location?.toLowerCase().includes("remote") ? "Remote" : "Not specified",
    provider_data: JSON.stringify(raw),
  };
}

function normalizeAshby(raw) {
  const locParts = raw.locationName?.split(",") || [];
  return {
    job_title: raw.title,
    employer_name: raw.departmentName || raw.companyName,
    company_logo_url: raw.companyLogoUrl,
    location: raw.locationName,
    city: locParts[0]?.trim(),
    state: locParts[1]?.trim(),
    posting_url: raw.externalLink || raw.url,
    external_job_id: raw.id,
    posting_date: raw.publishedAt,
    full_description: raw.descriptionPlain || raw.descriptionHtml,
    employment_type: raw.employmentType,
    provider_data: JSON.stringify(raw),
  };
}

function normalizeCompanyCareer(raw) {
  return {
    job_title: raw.title,
    employer_name: raw.company_name,
    company_logo_url: raw.logo_url,
    location: raw.location,
    city: raw.city,
    state: raw.state,
    posting_url: raw.url,
    external_job_id: raw.id || raw.url,
    posting_date: raw.date,
    full_description: raw.description,
    keywords: raw.keywords || [],
  };
}

function normalizeEmployerPortal(raw) {
  // Employer-posted jobs are already in the unified format.
  return {
    ...raw,
    status: raw.status || "Active",
    administrator_verified: false,
  };
}