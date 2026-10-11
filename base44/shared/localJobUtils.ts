// Shared utilities for normalizing Greenhouse and Lever API responses into JobPosting fields.

export function normalizeGreenhouseJob(apiJob, employerName, defaultIndustry) {
  const locationName = apiJob.location?.name || "";
  const [city, state] = parseLocation(locationName);
  return {
    job_title: apiJob.title || "Untitled Position",
    employer_name: employerName,
    external_job_id: String(apiJob.id),
    posting_url: apiJob.absolute_url || "",
    city,
    state,
    location: locationName,
    industry: defaultIndustry,
    provider: "greenhouse",
    source_name: employerName,
    last_synced_date: new Date().toISOString(),
    posting_date: apiJob.updated_at ? apiJob.updated_at.split("T")[0] : undefined,
    provider_data: JSON.stringify({
      departments: (apiJob.departments || []).map((d) => d.name),
      offices: (apiJob.offices || []).map((o) => o.name),
    }),
  };
}

export function normalizeLeverJob(posting, employerName, defaultIndustry) {
  const locationName = posting.categories?.location || "";
  const [city, state] = parseLocation(locationName);
  const commitment = posting.categories?.commitment || "";
  return {
    job_title: posting.text || "Untitled Position",
    employer_name: employerName,
    external_job_id: posting.id,
    posting_url: posting.hostedUrl || "",
    full_description: posting.descriptionPlain || posting.description || "",
    city,
    state,
    location: locationName,
    industry: defaultIndustry,
    employment_type: mapLeverCommitment(commitment),
    provider: "lever",
    source_name: employerName,
    last_synced_date: new Date().toISOString(),
    provider_data: JSON.stringify({
      team: posting.categories?.team || "",
      commitment,
    }),
  };
}

function parseLocation(locationStr) {
  if (!locationStr) return [undefined, undefined];
  const parts = locationStr.split(",").map((s) => s.trim());
  if (parts.length >= 2) return [parts[0], parts[1]];
  return [parts[0], undefined];
}

function mapLeverCommitment(commitment) {
  if (!commitment) return undefined;
  const lower = commitment.toLowerCase();
  if (lower.includes("full")) return "Full-time";
  if (lower.includes("part")) return "Part-time";
  if (lower.includes("contract")) return "Contract";
  if (lower.includes("temp")) return "Temporary";
  if (lower.includes("season")) return "Seasonal";
  if (lower.includes("intern")) return "Internship";
  return undefined;
}

export function jobMatchesLocation(normalizedJob, city, state) {
  if (!city && !state) return true;
  const jobCity = (normalizedJob.city || "").toLowerCase();
  const jobState = (normalizedJob.state || "").toLowerCase();
  const filterCity = (city || "").toLowerCase();
  const filterState = (state || "").toLowerCase();
  if (filterCity && filterState) {
    return jobCity.includes(filterCity) || jobState.includes(filterState);
  }
  if (filterCity) return jobCity.includes(filterCity);
  if (filterState) return jobState.includes(filterState);
  return true;
}

// ─── iSolved Hire utilities ──────────────────────────────────────────

const CLOSED_PHRASES = [
  "this position has been closed",
  "position closed",
  "no longer accepting applications",
  "job unavailable",
  "position has been filled",
  "no longer available",
  "position is no longer",
];

export function isJobClosed(html) {
  const lower = html.toLowerCase();
  return CLOSED_PHRASES.some((p) => lower.includes(p));
}

export function extractJobIdFromUrl(url) {
  const m = url.match(/\/jobs\/(\d+)/);
  return m ? m[1] : "";
}

// Parse job URLs from an iSolved Hire sitemap.xml
export function discoverISolvedHireJobs(xml) {
  const jobs = [];
  const seen = new Set();
  const urlRegex = /<loc>([^<]+\/jobs\/(\d+)(?:\.html)?)<\/loc>/g;
  let match;
  while ((match = urlRegex.exec(xml)) !== null) {
    const url = match[1];
    const jobId = match[2];
    if (seen.has(jobId)) continue;
    seen.add(jobId);
    jobs.push({ url, jobId });
  }
  return jobs;
}

// Construct the sitemap URL from a careers page URL or subdomain
export function getISolvedSitemapUrl(careersUrl, providerIdentifier) {
  if (careersUrl) {
    try {
      const origin = new URL(careersUrl).origin;
      return `${origin}/sitemap.xml`;
    } catch (_) { /* fall through */ }
  }
  if (providerIdentifier) {
    return `https://${providerIdentifier}.isolvedhire.com/sitemap.xml`;
  }
  return null;
}

export function sanitizeHtml(html) {
  if (!html) return "";
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<form[^>]*>[\s\S]*?<\/form>/gi, "")
    .replace(/<(input|button|select|textarea)[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/<(input|button|select|textarea)[^>]*\/?>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/href\s*=\s*"javascript:[^"]*"/gi, 'href="#"')
    .replace(/\sdata-v-[a-z0-9]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\sclass\s*=\s*"[^"]*"/gi, "")
    .replace(/\sid\s*=\s*"[^"]*"/gi, "")
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/\n\s*\n/g, "\n")
    .trim();
}

function parseJsonField(val) {
  if (!val) return null;
  if (typeof val === "object") return val;
  try { return JSON.parse(val); } catch (_) { return null; }
}

function mapISolvedEmploymentType(typeStr) {
  if (!typeStr) return undefined;
  const lower = typeStr.toLowerCase().trim();
  if (lower.includes("full")) return "Full-time";
  if (lower.includes("part")) return "Part-time";
  if (lower.includes("contract")) return "Contract";
  if (lower.includes("temp")) return "Temporary";
  if (lower.includes("season")) return "Seasonal";
  if (lower.includes("intern")) return "Internship";
  return undefined;
}

function parseDateField(dateStr) {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  return undefined;
}

// Parse a job page using JSON-LD JobPosting structured data (preferred),
// falling back to HTML parsing when JSON-LD is absent.
export function parseISolvedHireJobPage(html) {
  // Try JSON-LD first
  const ldMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (ldMatch) {
    try {
      const jsonLd = JSON.parse(ldMatch[1]);
      if (jsonLd["@type"] === "JobPosting" || (Array.isArray(jsonLd) && jsonLd.some(j => j["@type"] === "JobPosting"))) {
        const ld = Array.isArray(jsonLd) ? jsonLd.find(j => j["@type"] === "JobPosting") : jsonLd;
        const loc = parseJsonField(ld.jobLocation);
        const addr = loc?.address || {};
        const geo = loc?.geo || {};
        const salary = parseJsonField(ld.baseSalary);
        const salaryValue = salary?.value;

        const locationParts = [
          addr.streetAddress, addr.addressLocality, addr.addressRegion,
          addr.addressCountry === "US" ? "USA" : addr.addressCountry,
        ].filter(Boolean);

        let salaryText = undefined;
        if (salaryValue?.value) {
          const unit = (salaryValue.unitText || "").toUpperCase();
          if (unit === "HOUR") salaryText = `$${salaryValue.value}/hr`;
          else if (unit === "YEAR") salaryText = `$${salaryValue.value}/yr`;
          else salaryText = `$${salaryValue.value}`;
        }

        return {
          title: ld.title || "",
          postingDate: parseDateField(ld.datePosted),
          closingDate: parseDateField(ld.validThrough),
          employmentType: mapISolvedEmploymentType(ld.employmentType),
          description: sanitizeHtml(ld.description || ""),
          city: addr.addressLocality,
          state: addr.addressRegion,
          postalCode: addr.postalCode,
          location: locationParts.join(", "),
          latitude: geo.latitude ? parseFloat(geo.latitude) : undefined,
          longitude: geo.longitude ? parseFloat(geo.longitude) : undefined,
          salaryText,
          isClosed: isJobClosed(html),
        };
      }
    } catch (_) { /* fall through to HTML parsing */ }
  }

  // Fallback: HTML parsing (for pages without JSON-LD)
  const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
  const title = titleMatch ? titleMatch[1].trim() : "";

  let postingDate = null;
  const d1 = html.match(/Posted:?\s*(\d{1,2}-\w{3}-\d{4})/i);
  if (d1) {
    postingDate = parseDateField(d1[1]);
  } else {
    const d2 = html.match(/Posted:?\s*(\w+\s+\d{1,2},?\s*\d{4})/i);
    if (d2) postingDate = parseDateField(d2[1]);
  }

  let location = "";
  const locMatch = html.match(/>([^<]{5,},\s*[A-Z]{2},?\s*USA)</);
  if (locMatch) {
    location = locMatch[1].trim();
  } else {
    const locMatch2 = html.match(/>([^<]{5,},\s*[A-Z]{2})</);
    if (locMatch2) location = locMatch2[1].trim();
  }

  let employmentType = undefined;
  const empMatch = html.match(/>(Full\s*Time|Part\s*Time|Contract|Temporary|Seasonal|Internship)</i);
  if (empMatch) employmentType = mapISolvedEmploymentType(empMatch[1]);

  return {
    title,
    postingDate,
    closingDate: undefined,
    employmentType,
    description: "",
    city: undefined,
    state: undefined,
    postalCode: undefined,
    location,
    latitude: undefined,
    longitude: undefined,
    salaryText: undefined,
    isClosed: isJobClosed(html),
  };
}

export function normalizeISolvedHireJob(parsed, jobUrl, jobId, employerName, defaultIndustry) {
  return {
    job_title: parsed.title || "Untitled Position",
    employer_name: employerName,
    external_job_id: jobId,
    posting_url: jobUrl,
    source_url: jobUrl,
    city: parsed.city,
    state: parsed.state,
    postal_code: parsed.postalCode,
    latitude: parsed.latitude,
    longitude: parsed.longitude,
    location: parsed.location,
    industry: defaultIndustry,
    employment_type: parsed.employmentType || undefined,
    provider: "isolved_hire",
    source_name: employerName,
    full_description: parsed.description || "",
    posting_date: parsed.postingDate || undefined,
    application_deadline: parsed.closingDate || undefined,
    salary_text: parsed.salaryText || undefined,
    application_method: "External website",
    last_synced_date: new Date().toISOString(),
    verified_at: new Date().toISOString(),
  };
}