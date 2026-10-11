// CSV template generation, parsing, validation, and mapping for local job imports.

export const CSV_COLUMNS = [
  "employer_name",
  "job_title",
  "industry",
  "full_description",
  "responsibilities",
  "minimum_qualifications",
  "preferred_qualifications",
  "location",
  "city",
  "state",
  "postal_code",
  "remote_type",
  "employment_type",
  "salary_min",
  "salary_max",
  "salary_period",
  "schedule",
  "benefits",
  "application_method",
  "posting_url",
  "application_email",
  "application_phone",
  "application_instructions",
  "contact_name",
  "posting_date",
  "application_deadline",
  "number_of_openings",
  "background_requirements",
  "apprenticeship_available",
  "second_chance_friendly",
  "external_job_id",
];

export const APPLICATION_METHODS = [
  "External website",
  "Email employer",
  "Call employer",
  "Apply in person",
  "Employer instructions",
  "Future Apply Once employer application",
];

export function downloadCSVTemplate() {
  const header = CSV_COLUMNS.join(",");
  const sample = [
    "Sample Restaurant",
    "Line Cook",
    "Hospitality",
    "Prepare and cook menu items in a fast-paced kitchen.",
    "Food preparation; station setup; kitchen cleaning",
    "1+ year kitchen experience",
    "Culinary degree preferred",
    "123 Main Street",
    "Pittsburgh",
    "PA",
    "15219",
    "On-site",
    "Full-time",
    "15",
    "18",
    "hourly",
    "Mon-Fri 9am-5pm",
    "Free meals; health insurance",
    "External website",
    "https://example.com/apply",
    "",
    "",
    "",
    "Jane Smith",
    "2026-07-22",
    "2026-08-22",
    "2",
    "",
    "false",
    "false",
    "",
  ].map((v) => `"${v}"`).join(",");
  const csv = `${header}\n${sample}`;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "local_jobs_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function parseCSV(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === "," && !inQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const headers = parseLine(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const values = parseLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (values[i] || "").trim();
    });
    return obj;
  });

  return { headers, rows };
}

export function validateRow(row) {
  const errors = [];
  if (!row.employer_name) errors.push("Employer is required");
  if (!row.job_title) errors.push("Job title is required");

  const hasLocation = row.city || row.state || row.postal_code || row.location;
  const isRemote = row.remote_type === "Remote" || row.remote_type === "Hybrid";
  if (!hasLocation && !isRemote) {
    errors.push("Location or remote status is required");
  }

  const hasAppMethod =
    row.application_method ||
    row.posting_url ||
    row.application_email ||
    row.application_phone ||
    row.application_instructions;
  if (!hasAppMethod) {
    errors.push("At least one application method is required");
  }

  return errors;
}

export function mapRowToJobPosting(row) {
  const parseBool = (v) => v === "true" || v === "1" || v === "yes";
  const parseNum = (v) => (v !== "" && v != null ? Number(v) : undefined);
  const parseBenefits = (v) =>
    v ? v.split(";").map((s) => s.trim()).filter(Boolean) : [];

  return {
    employer_name: row.employer_name || undefined,
    job_title: row.job_title || undefined,
    industry: row.industry || undefined,
    full_description: row.full_description || undefined,
    responsibilities: row.responsibilities || undefined,
    minimum_qualifications: row.minimum_qualifications || undefined,
    preferred_qualifications: row.preferred_qualifications || undefined,
    location: row.location || undefined,
    city: row.city || undefined,
    state: row.state || undefined,
    postal_code: row.postal_code || undefined,
    remote_type: row.remote_type || "Not specified",
    employment_type: row.employment_type || undefined,
    salary_min: parseNum(row.salary_min),
    salary_max: parseNum(row.salary_max),
    salary_period: row.salary_period || undefined,
    schedule: row.schedule || undefined,
    benefits: parseBenefits(row.benefits),
    application_method: row.application_method || undefined,
    posting_url: row.posting_url || undefined,
    application_email: row.application_email || undefined,
    application_phone: row.application_phone || undefined,
    application_instructions: row.application_instructions || undefined,
    source_name: row.contact_name || undefined,
    posting_date: row.posting_date || undefined,
    application_deadline: row.application_deadline || undefined,
    number_of_openings: parseNum(row.number_of_openings),
    background_requirements: row.background_requirements || undefined,
    apprenticeship_available: parseBool(row.apprenticeship_available),
    second_chance_friendly: parseBool(row.second_chance_friendly),
    external_job_id: row.external_job_id || undefined,
    local_job: true,
    provider: "manual",
    status: "Draft",
    administrator_verified: false,
  };
}

export function generateDedupKey(job) {
  if (job.external_job_id && job.employer_name) {
    return `${job.employer_name.toLowerCase()}|${job.external_job_id}`;
  }
  const parts = [
    job.employer_name?.toLowerCase(),
    job.job_title?.toLowerCase(),
    job.location?.toLowerCase(),
    job.application_deadline || "",
  ].filter(Boolean);
  return parts.join("|");
}