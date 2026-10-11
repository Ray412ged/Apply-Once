import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { normalizeLeverJob, jobMatchesLocation } from '../../shared/localJobUtils.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const body = await req.json();
    const { employer_source_id } = body;
    if (!employer_source_id) return Response.json({ error: 'employer_source_id is required' }, { status: 400 });

    const source = await base44.asServiceRole.entities.EmployerSource.get(employer_source_id);
    if (!source) return Response.json({ error: 'Employer source not found' }, { status: 404 });
    if (source.provider_type !== 'Lever') return Response.json({ error: 'Source is not a Lever site' }, { status: 400 });

    const siteName = source.provider_identifier;
    if (!siteName) return Response.json({ error: 'No Lever site name configured' }, { status: 400 });

    const apiUrl = `https://api.lever.co/v0/postings/${siteName}?mode=json`;
    const apiRes = await fetch(apiUrl);
    if (!apiRes.ok) {
      const errText = await apiRes.text();
      await base44.asServiceRole.entities.EmployerSource.update(employer_source_id, {
        last_sync_at: new Date().toISOString(),
        last_sync_result: `Error: ${apiRes.status} - ${errText.substring(0, 200)}`,
        source_status: 'Error',
      });
      return Response.json({ error: `Lever API error: ${apiRes.status}` }, { status: 502 });
    }

    const postings = await apiRes.json();
    let added = 0, updated = 0, failed = 0;

    for (const posting of postings) {
      try {
        const normalized = normalizeLeverJob(posting, source.employer_name, source.industry);

        if (!jobMatchesLocation(normalized, source.city, source.state)) continue;

        const existing = await base44.asServiceRole.entities.JobPosting.filter({
          external_job_id: normalized.external_job_id,
          employer_name: source.employer_name,
        }, '-updated_date', 1);

        if (existing.length > 0) {
          await base44.asServiceRole.entities.JobPosting.update(existing[0].id, {
            ...normalized,
            last_synced_date: new Date().toISOString(),
          });
          updated++;
        } else {
          await base44.asServiceRole.entities.JobPosting.create({
            ...normalized,
            local_job: true,
            source_employer: source.employer_name,
            employer_source_id: employer_source_id,
            status: 'Draft',
            administrator_verified: false,
            import_date: new Date().toISOString(),
          });
          added++;
        }
      } catch (err) {
        failed++;
      }
    }

    await base44.asServiceRole.entities.EmployerSource.update(employer_source_id, {
      last_sync_at: new Date().toISOString(),
      last_sync_result: `Success: ${added} added, ${updated} updated, ${failed} failed`,
      source_status: 'Active',
    });

    return Response.json({ added, updated, failed, total: postings.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});