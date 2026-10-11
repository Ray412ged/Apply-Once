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
      // Organization users only receive their own org's verified active opportunities.
      jobs = await svc.entities.JobPosting.filter(
        {
          status: "Active",
          organization_id: organizationId,
          verification_status: "Verified",
        },
        "-created_date",
        500
      );
    } else {
      // Independent AO users retain the existing public feed. Organization
      // postings are removed from the result set and never mixed into it.
      const publicCandidates = await svc.entities.JobPosting.filter(
        { status: "Active" },
        "-created_date",
        500
      );
      jobs = publicCandidates.filter((job) => !job.organization_id);
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