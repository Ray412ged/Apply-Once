import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveOrgContext, orgErrorResponse } from '../../shared/orgAuth.ts';
import { httpError } from '../../shared/orgEmployerSecurity.ts';

const ALLOWED_EMPLOYMENT = new Set(["Full-time","Part-time","Temporary","Contract","Seasonal","Internship"]);
const ALLOWED_REMOTE = new Set(["On-site","Hybrid","Remote","Not specified"]);

function clean(value) {
  return typeof value === "string" ? value.trim() : "";
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    await resolveOrgContext(base44);
    const body = await req.json().catch(() => ({}));
    const jobUrl = clean(body?.job_url);
    const employerName = clean(body?.employer_name);

    if (!jobUrl) throw httpError("Job link is required", 400);
    if (!employerName) throw httpError("Employer name is required", 400);
    try {
      const parsed = new URL(jobUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("bad protocol");
    } catch (_) {
      throw httpError("Enter a valid job link", 400);
    }

    const prompt =
      "You are importing one employer job posting into a workforce organization's private employment platform. " +
      "Use the supplied job URL and web context to extract only facts supported by the current posting. " +
      "Do not invent missing details. Employer name supplied by staff: " + employerName + ". " +
      "Job URL: " + jobUrl + ". " +
      "Return concise structured data. Keep the original application URL when it is the direct application page. " +
      "For employment_type use only Full-time, Part-time, Temporary, Contract, Seasonal, Internship, or blank. " +
      "For remote_type use only On-site, Hybrid, Remote, Not specified.";

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          job_title: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          location: { type: 'string' },
          employment_type: { type: 'string' },
          remote_type: { type: 'string' },
          salary_text: { type: 'string' },
          application_url: { type: 'string' },
          full_description: { type: 'string' },
          minimum_qualifications: { type: 'string' },
          preferred_qualifications: { type: 'string' },
          required_education: { type: 'string' },
          required_experience: { type: 'string' },
          required_credentials: { type: 'string' },
          schedule: { type: 'string' },
          application_deadline: { type: 'string' }
        }
      }
    });

    const job = result || {};
    const employmentType = ALLOWED_EMPLOYMENT.has(job.employment_type) ? job.employment_type : "";
    const remoteType = ALLOWED_REMOTE.has(job.remote_type) ? job.remote_type : "Not specified";

    return Response.json({
      preview: true,
      job: {
        job_title: clean(job.job_title),
        city: clean(job.city),
        state: clean(job.state),
        location: clean(job.location),
        employment_type: employmentType,
        remote_type: remoteType,
        salary_text: clean(job.salary_text),
        application_url: clean(job.application_url) || jobUrl,
        posting_url: jobUrl,
        full_description: clean(job.full_description),
        minimum_qualifications: clean(job.minimum_qualifications),
        preferred_qualifications: clean(job.preferred_qualifications),
        required_education: clean(job.required_education),
        required_experience: clean(job.required_experience),
        required_credentials: clean(job.required_credentials),
        schedule: clean(job.schedule),
        application_deadline: clean(job.application_deadline),
        opportunity_type: "Job",
        application_method: "External website"
      }
    });
  } catch (error) {
    return orgErrorResponse(error);
  }
}