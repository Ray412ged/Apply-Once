import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import {
  discoverISolvedHireJobs,
  parseISolvedHireJobPage,
  normalizeISolvedHireJob,
  isJobClosed,
  getISolvedSitemapUrl,
} from '../../shared/localJobUtils.ts';

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
    if (source.provider_type !== 'iSolved Hire') {
      return Response.json({ error: 'Source is not an iSolved Hire source' }, { status: 400 });
    }

    const careersUrl = source.careers_page_url ||
      `https://${source.provider_identifier}.isolvedhire.com/jobs/`;

    // Discover jobs via sitemap.xml (the listing page is a Vue SPA)
    const sitemapUrl = getISolvedSitemapUrl(careersUrl, source.provider_identifier);
    if (!sitemapUrl) {
      return Response.json({ error: 'No careers page URL or provider identifier configured' }, { status: 400 });
    }

    const sitemapRes = await fetch(sitemapUrl, {
      headers: { 'User-Agent': 'ApplyOnce-JobSync/1.0' },
    });
    if (!sitemapRes.ok) {
      const errText = await sitemapRes.text();
      await base44.asServiceRole.entities.EmployerSource.update(employer_source_id, {
        last_sync_at: new Date().toISOString(),
        last_sync_result: `Error: sitemap ${sitemapRes.status} - ${errText.substring(0, 200)}`,
        source_status: 'Error',
      });
      return Response.json({ error: `Failed to fetch sitemap: ${sitemapRes.status}` }, { status: 502 });
    }

    const sitemapXml = await sitemapRes.text();
    const discoveredJobs = discoverISolvedHireJobs(sitemapXml);
    const discoveredIds = new Set(discoveredJobs.map((j) => j.jobId));

    let added = 0, updated = 0, deactivated = 0, skipped = 0, failed = 0;
    const errors = [];

    // Process each discovered job
    for (const discovered of discoveredJobs) {
      try {
        const jobRes = await fetch(discovered.url, {
          headers: { 'User-Agent': 'ApplyOnce-JobSync/1.0' },
        });
        if (!jobRes.ok) {
          errors.push(`Failed to fetch ${discovered.url}: ${jobRes.status}`);
          failed++;
          continue;
        }
        const jobHtml = await jobRes.text();
        const closed = isJobClosed(jobHtml);
        const parsed = parseISolvedHireJobPage(jobHtml);
        const normalized = normalizeISolvedHireJob(
          parsed, discovered.url, discovered.jobId, source.employer_name, source.industry
        );

        // Primary dedup: provider + external_job_id
        const existing = await base44.asServiceRole.entities.JobPosting.filter({
          external_job_id: discovered.jobId,
          provider: 'isolved_hire',
        }, '-updated_date', 1);

        if (existing.length > 0) {
          const existingJob = existing[0];
          if (closed) {
            if (existingJob.status === 'Active' || existingJob.status === 'Draft') {
              await base44.asServiceRole.entities.JobPosting.update(existingJob.id, {
                status: 'Expired',
                last_synced_date: new Date().toISOString(),
              });
              deactivated++;
            } else {
              skipped++;
            }
          } else {
            await base44.asServiceRole.entities.JobPosting.update(existingJob.id, {
              ...normalized,
              employer_source_id: employer_source_id,
            });
            updated++;
          }
        } else {
          // Secondary dedup: employer + source_url
          const secondary = await base44.asServiceRole.entities.JobPosting.filter({
            employer_name: source.employer_name,
            source_url: discovered.url,
          }, '-updated_date', 1);

          if (secondary.length > 0) {
            const existingJob = secondary[0];
            if (closed) {
              if (existingJob.status === 'Active' || existingJob.status === 'Draft') {
                await base44.asServiceRole.entities.JobPosting.update(existingJob.id, {
                  status: 'Expired',
                  external_job_id: discovered.jobId,
                  provider: 'isolved_hire',
                  last_synced_date: new Date().toISOString(),
                });
                deactivated++;
              } else {
                skipped++;
              }
            } else {
              await base44.asServiceRole.entities.JobPosting.update(existingJob.id, {
                ...normalized,
                employer_source_id: employer_source_id,
              });
              updated++;
            }
          } else if (!closed) {
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
          } else {
            skipped++;
          }
        }
      } catch (err) {
        errors.push(`Error processing ${discovered.url}: ${err.message}`);
        failed++;
      }
    }

    // Deactivate jobs that were in DB but no longer on the listing page
    const existingJobs = await base44.asServiceRole.entities.JobPosting.filter({
      employer_source_id: employer_source_id,
      provider: 'isolved_hire',
    }, '-updated_date', 200);

    for (const existingJob of existingJobs) {
      if (!discoveredIds.has(existingJob.external_job_id)) {
        if (existingJob.status === 'Active' || existingJob.status === 'Draft') {
          await base44.asServiceRole.entities.JobPosting.update(existingJob.id, {
            status: 'Expired',
            last_synced_date: new Date().toISOString(),
          });
          deactivated++;
        }
      }
    }

    const syncResult = `Success: ${discoveredJobs.length} discovered, ${added} added, ${updated} updated, ${deactivated} deactivated, ${skipped} skipped, ${failed} failed`;
    await base44.asServiceRole.entities.EmployerSource.update(employer_source_id, {
      last_sync_at: new Date().toISOString(),
      last_sync_result: syncResult,
      source_status: 'Active',
    });

    return Response.json({
      discovered: discoveredJobs.length,
      added,
      updated,
      deactivated,
      skipped,
      failed,
      errors: errors.slice(0, 10),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});