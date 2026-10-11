import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import {
  parseISolvedHireJobPage,
  normalizeISolvedHireJob,
  isJobClosed,
  extractJobIdFromUrl,
} from '../../shared/localJobUtils.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const body = await req.json();
    const { job_url, employer_source_id, save, job_data } = body;

    // ─── Save mode: persist admin-edited data ───────────────────────
    if (save && job_data) {
      const existing = await base44.asServiceRole.entities.JobPosting.filter({
        external_job_id: job_data.external_job_id,
        provider: 'isolved_hire',
      }, '-updated_date', 1);

      if (existing.length > 0) {
        const updated = await base44.asServiceRole.entities.JobPosting.update(existing[0].id, {
          ...job_data,
          employer_source_id: employer_source_id || undefined,
          last_synced_date: new Date().toISOString(),
          verified_at: new Date().toISOString(),
        });
        return Response.json({ saved: true, action: 'updated', job: updated });
      }

      const created = await base44.asServiceRole.entities.JobPosting.create({
        ...job_data,
        local_job: true,
        source_employer: job_data.employer_name,
        employer_source_id: employer_source_id || undefined,
        status: 'Draft',
        administrator_verified: false,
        import_date: new Date().toISOString(),
      });
      return Response.json({ saved: true, action: 'created', job: created });
    }

    // ─── Preview mode: fetch and parse ──────────────────────────────
    if (!job_url) return Response.json({ error: 'job_url is required' }, { status: 400 });

    const jobRes = await fetch(job_url, {
      headers: { 'User-Agent': 'ApplyOnce-JobSync/1.0' },
    });
    if (!jobRes.ok) {
      return Response.json({ error: `Failed to fetch job page: ${jobRes.status}` }, { status: 502 });
    }
    const jobHtml = await jobRes.text();

    const closed = isJobClosed(jobHtml);
    const parsed = parseISolvedHireJobPage(jobHtml);
    const jobId = extractJobIdFromUrl(job_url);

    let employerName = '';
    let industry = '';
    if (employer_source_id) {
      const source = await base44.asServiceRole.entities.EmployerSource.get(employer_source_id);
      if (source) {
        employerName = source.employer_name;
        industry = source.industry;
      }
    }

    const normalized = normalizeISolvedHireJob(parsed, job_url, jobId, employerName, industry);

    return Response.json({
      preview: true,
      closed,
      job: normalized,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});