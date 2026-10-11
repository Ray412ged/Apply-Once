import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

/**
 * Web-search fallback for job URLs that can't be scraped directly
 * (anti-bot portals such as ADP). Uses InvokeLLM with web context to
 * extract a normalized job preview the admin can review and save.
 *
 * Admin-only. Returns { preview: true, job: {...} }.
 */
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const body = await req.json();
    const { job_url, employer_name, job_title } = body || {};
    if (!job_url && !employer_name && !job_title) {
      return Response.json({ error: 'Provide a job URL, employer name, or job title' }, { status: 400 });
    }

    const prompt =
      'You are helping an admin add a local job posting. Using web search, find the actual job posting and extract its details.' +
      (job_url ? ` Job URL: ${job_url}.` : '') +
      (employer_name ? ` Employer: ${employer_name}.` : '') +
      (job_title ? ` Job title: ${job_title}.` : '') +
      ' Return only facts visible on the posting; leave any unknown field empty. The application_url must be the direct link where a candidate applies.';

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          job_title: { type: 'string' },
          employer_name: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          location: { type: 'string' },
          employment_type: { type: 'string' },
          remote_type: { type: 'string' },
          application_url: { type: 'string' },
          full_description: { type: 'string' },
        },
      },
    });

    return Response.json({ preview: true, job: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}