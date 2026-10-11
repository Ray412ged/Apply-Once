import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveJobSeekerOrg } from '../../shared/jobSeekerOrg.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}

    const svc = base44.asServiceRole;
    const orgContext = await resolveJobSeekerOrg(base44, user);

    let jobs;
    let organizationId = null;

    if (orgContext) {
      organizationId = orgContext.organizationId;

      // One participant-facing Jobs board:
      // 1) opportunities published by this organization, plus
      // 2) local jobs added by Apply Once to strengthen the board when needed.
      const [organizationJobs, sharedLocalJobs] = await Promise.all([
        svc.entities.JobPosting.filter(
          {
            status: "Active",
            organization_id: organizationId,
            verification_status: "Verified",
          },
          "-created_date",
          500
        ),
        svc.entities.JobPosting.filter(
          {
            status: "Active",
            local_job: true,
            administrator_verified: true,
          },
          "-created_date",
          500
        ),
      ]);

      const seen = new Set();
      jobs = [...organizationJobs, ...sharedLocalJobs].filter((job) => {
        if (job.organization_id && job.organization_id !== organizationId) return false;
        if (seen.has(job.id)) return false;
        seen.add(job.id);
        return true;
      });
    } else {
      // This deployment is organization-led; participants join through an
      // organization invitation before seeing the Jobs board.
      jobs = [];
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    jobs = jobs.filter((job) => {
      const closingDate = job.application_deadline || job.expiration_date;
      if (!closingDate) return true;
      const closes = new Date(closingDate);
      return Number.isFinite(closes.getTime()) && closes >= today;
    });

    return Response.json({ organization_id: organizationId, jobs });
  } catch (error) {
    const status = Number(error?.status) || 500;
    return Response.json(
      { error: error?.message || "Failed to load opportunities" },
      { status }
    );
  }
}