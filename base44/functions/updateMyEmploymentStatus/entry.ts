import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const svc = base44.asServiceRole;
    const links = await svc.entities.ParticipantOrgLink.filter(
      { participant_id: user.id, status: "active" },
      "-linked_at",
      2
    );
    if (links.length !== 1) {
      return Response.json({ error: "Auberle Employment Institute participant access is required." }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || "").trim();

    const profiles = await svc.entities.UserProfile.filter(
      { created_by_id: user.id },
      "-created_date",
      1
    );
    const profile = profiles[0] || null;
    if (!profile) {
      return Response.json({ error: "Profile not found." }, { status: 404 });
    }

    if (action === "employed") {
      const employerName = String(body?.employer_name || "").trim();
      const positionTitle = String(body?.position_title || "").trim();

      const updated = await svc.entities.UserProfile.update(profile.id, {
        employment_status: "Offer Accepted",
        current_employer_name: employerName,
        current_position_title: positionTitle,
      });
      return Response.json({ profile: updated });
    }

    if (action === "searching") {
      const updated = await svc.entities.UserProfile.update(profile.id, {
        employment_status: "Searching",
        current_employer_name: "",
        current_position_title: "",
      });
      return Response.json({ profile: updated });
    }

    return Response.json({ error: "Unknown employment status action." }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error?.message || "Could not update employment status." }, { status: 500 });
  }
}