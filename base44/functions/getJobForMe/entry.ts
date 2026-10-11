import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveJobSeekerOrg } from '../../shared/jobSeekerOrg.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}

    const body = await req.json().catch(() => ({}));
    const id = body?.id;
    if (!id) return Response.json({ error: "Job id is required" }, { status: 400 });

    const svc = base44.asServiceRole;
    const job = await svc.entities.JobPosting.get(id);
    if (!job) return Response.json({ error: "Job not found" }, { status: 404 });

    const orgContext = await resolveJobSeekerOrg(base44, user);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const closingDate = job.application_deadline || job.expiration_date;
    const stillOpen =
      !closingDate ||
      (Number.isFinite(new Date(closingDate).getTime()) && new Date(closingDate) >= today);

    let allowed = false;

    if (orgContext) {
      allowed =
        job.organization_id === orgContext.organizationId &&
        job.verification_status === "Verified" &&
        job.status === "Active" &&
        stillOpen;
    } else {
      allowed = !job.organization_id && job.status === "Active" && stillOpen;
    }

    // Historical application access is narrower than live opportunity
    // visibility. Public jobs remain available to the applicant. Org-owned
    // jobs are only returned when the participant had a real connection to
    // that organization on or before the application was created.
    if (!allowed && user) {
      const apps = await svc.entities.Application.filter(
        { created_by_id: user.id, job_posting_id: id },
        "-created_date",
        1
      );

      const application = apps[0] || null;
      if (application) {
        if (!job.organization_id) {
          allowed = true;
        } else {
          const historicalLinks = await svc.entities.ParticipantOrgLink.filter(
            { participant_id: user.id, organization_id: job.organization_id },
            "-linked_at",
            50
          );
          const applicationTime = new Date(application.created_date).getTime();
          allowed = historicalLinks.some((link) => {
            const linkedTime = new Date(link.linked_at).getTime();
            return Number.isFinite(applicationTime) &&
              Number.isFinite(linkedTime) &&
              linkedTime <= applicationTime;
          });
        }
      }
    }

    if (!allowed) return Response.json({ error: "Job not available" }, { status: 404 });
    return Response.json({ job });
  } catch (error) {
    const status = Number(error?.status) || 500;
    return Response.json(
      { error: error?.message || "Failed to load job" },
      { status }
    );
  }
}