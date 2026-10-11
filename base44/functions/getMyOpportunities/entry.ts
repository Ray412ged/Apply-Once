import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch (_) {}
    const svc = base44.asServiceRole;
    const links = user
      ? await svc.entities.ParticipantOrgLink.filter(
          { participant_id: user.id, status: "active" },
          "-linked_at",
          1
        )
      : [];

    const allActive = await svc.entities.JobPosting.filter(
      { status: "Active" },
      "-created_date",
      500
    );

    let jobs;
    let organizationId = null;
    if (links.length > 0) {
      organizationId = links[0].organization_id;
      jobs = allActive.filter(
        (job) =>
          job.organization_id === organizationId &&
          job.verification_status === "Verified"
      );
    } else {
      // Independent AO users keep the existing public feed. Organization
      // opportunities are never mixed into it.
      jobs = allActive.filter((job) => !job.organization_id);
    }

    return Response.json({ organization_id: organizationId, jobs });
  } catch (error) {
    return Response.json({ error: error?.message || "Failed to load opportunities" }, { status: 500 });
  }
}