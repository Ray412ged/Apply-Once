import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

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

    const links = user
      ? await svc.entities.ParticipantOrgLink.filter(
          { participant_id: user.id, status: "active" }, "-linked_at", 1
        )
      : [];

    let allowed = false;
    if (links.length > 0) {
      allowed = job.organization_id === links[0].organization_id && job.verification_status === "Verified";
    } else {
      allowed = !job.organization_id;
    }

    if (!allowed && user) {
      const apps = await svc.entities.Application.filter(
        { created_by_id: user.id, job_posting_id: id }, "-created_date", 1
      );
      if (apps.length > 0) {
        allowed = links.length > 0
          ? job.organization_id === links[0].organization_id
          : !job.organization_id;
      }
    }

    if (!allowed) return Response.json({ error: "Job not available" }, { status: 404 });
    return Response.json({ job });
  } catch (error) {
    return Response.json({ error: error?.message || "Failed to load job" }, { status: 500 });
  }
}