import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function clean(value) {
  return String(value || "").trim();
}

async function findReferral(svc, token: string) {
  if (!token || token.length < 32) return null;
  const tokenHash = await sha256Hex(token);
  const rows = await svc.entities.OrgParticipantReferral.filter(
    { invite_token_hash: tokenHash },
    "-invite_created_at",
    2
  );
  const valid = rows.filter((r) => ["Invited", "Invite Ready"].includes(r.status));
  if (valid.length !== 1) return null;
  return valid[0];
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body?.action || "preview";
    const token = clean(body?.token);
    const svc = base44.asServiceRole;
    const referral = await findReferral(svc, token);

    if (!referral) {
      return Response.json({ error: "This invitation is invalid or no longer available." }, { status: 404 });
    }

    const orgRows = await svc.entities.Organization.filter({ id: referral.organization_id }, "-created_date", 1);
    const organization = orgRows[0] || null;
    if (!organization || organization.active === false) {
      return Response.json({ error: "This Auberle Employment Institute invitation is unavailable." }, { status: 404 });
    }

    if (action === "preview") {
      return Response.json({
        participant_name: referral.participant_name,
        email: referral.email,
        organization_name: "Auberle Employment Institute",
      });
    }

    if (action === "claim") {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: "Sign in to continue." }, { status: 401 });

      const userEmail = String(user.email || "").trim().toLowerCase();
      if (!userEmail || userEmail !== String(referral.email || "").trim().toLowerCase()) {
        return Response.json({ error: "This invitation was sent to a different email address." }, { status: 403 });
      }

      const activeLinks = await svc.entities.ParticipantOrgLink.filter(
        { participant_id: user.id, status: "active" },
        "-linked_at",
        10
      );
      const otherOrg = activeLinks.find((l) => l.organization_id !== referral.organization_id);
      if (otherOrg) {
        return Response.json({ error: "This account cannot use this Auberle Employment Institute invitation." }, { status: 409 });
      }

      let link = activeLinks.find((l) => l.organization_id === referral.organization_id) || null;
      if (!link) {
        link = await svc.entities.ParticipantOrgLink.create({
          participant_id: user.id,
          organization_id: referral.organization_id,
          status: "active",
          linked_at: new Date().toISOString(),
          consent_scope: "Employment progress and outcomes for Auberle Employment Institute support",
          post_engagement_followup_consent: false,
          followup_checkin_answered: false,
          connected_by_staff_id: referral.created_by_staff_id || "",
          age_confirmed_18_plus: false,
          consent_timestamp: new Date().toISOString(),
          connection_method: "ei_invite",
          referral_id: referral.id,
        });
      }

      await svc.entities.OrgParticipantReferral.update(referral.id, {
        status: "Joined",
        participant_id: user.id,
        claimed_at: new Date().toISOString(),
        invite_token_hash: "",
      });

      return Response.json({
        joined: true,
        participant_id: user.id,
        organization_name: "Auberle Employment Institute",
        link_id: link.id,
      });
    }

    return Response.json({ error: "Unknown invitation action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error?.message || "Could not process invitation." }, { status: 500 });
  }
}