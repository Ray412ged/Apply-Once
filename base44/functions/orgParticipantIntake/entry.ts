import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveOrgContext, orgErrorResponse } from '../../shared/orgAuth.ts';
import { httpError, requireOrgAdmin } from '../../shared/orgEmployerSecurity.ts';

async function sha256Hex(value: string) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function clean(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return clean(value).toLowerCase();
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function createToken() {
  return crypto.randomUUID().replaceAll("-", "") + crypto.randomUUID().replaceAll("-", "");
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const ctx = await resolveOrgContext(base44);
    requireOrgAdmin(ctx);
    const body = await req.json().catch(() => ({}));
    const action = body?.action || "list";

    if (action === "list") {
      const referrals = await ctx.svc.entities.OrgParticipantReferral.filter(
        { organization_id: ctx.organizationId },
        "-created_date",
        500
      );
      return Response.json({
        referrals: referrals.map((r) => ({
          id: r.id,
          participant_name: r.participant_name,
          phone: r.phone,
          email: r.email,
          referring_staff: r.referring_staff,
          status: r.status,
          participant_id: r.participant_id || null,
          invite_created_at: r.invite_created_at || null,
          claimed_at: r.claimed_at || null,
          created_date: r.created_date,
        })),
      });
    }

    if (action === "invite") {
      const participantName = clean(body?.participant_name);
      const phone = clean(body?.phone);
      const email = normalizeEmail(body?.email);
      const referringStaff = clean(body?.referring_staff);

      if (!participantName) throw httpError("Participant name is required", 400);
      if (!phone) throw httpError("Participant phone is required", 400);
      if (!email || !validEmail(email)) throw httpError("A valid participant email is required", 400);
      if (!referringStaff) throw httpError("Referring staff is required", 400);

      const existing = await ctx.svc.entities.OrgParticipantReferral.filter(
        { organization_id: ctx.organizationId, email },
        "-created_date",
        20
      );
      const joined = existing.find((r) => r.status === "Joined");
      if (joined) {
        throw httpError("This participant has already joined Apply Once", 409);
      }

      const token = createToken();
      const tokenHash = await sha256Hex(token);
      const inviteCreatedAt = new Date().toISOString();
      const open = existing.find((r) => r.status !== "Joined");

      const referral = open
        ? await ctx.svc.entities.OrgParticipantReferral.update(open.id, {
            participant_name: participantName,
            phone,
            referring_staff: referringStaff,
            invite_token_hash: tokenHash,
            invite_created_at: inviteCreatedAt,
            status: "Invited",
          })
        : await ctx.svc.entities.OrgParticipantReferral.create({
            organization_id: ctx.organizationId,
            participant_name: participantName,
            phone,
            email,
            referring_staff: referringStaff,
            status: "Invited",
            invite_token_hash: tokenHash,
            invite_created_at: inviteCreatedAt,
            created_by_staff_id: ctx.staffAccount.id,
          });

      return Response.json({
        referral: {
          id: referral.id,
          participant_name: referral.participant_name,
          phone: referral.phone,
          email: referral.email,
          referring_staff: referral.referring_staff,
          status: referral.status,
        },
        invite_token: token,
      });
    }

    if (action === "resend") {
      const referralId = clean(body?.referral_id);
      if (!referralId) throw httpError("Referral id is required", 400);
      const rows = await ctx.svc.entities.OrgParticipantReferral.filter(
        { id: referralId, organization_id: ctx.organizationId },
        "-created_date",
        1
      );
      const referral = rows[0];
      if (!referral) throw httpError("Invitation not found", 404);
      if (referral.status === "Joined") throw httpError("Participant has already joined", 409);

      const token = createToken();
      const tokenHash = await sha256Hex(token);
      const updated = await ctx.svc.entities.OrgParticipantReferral.update(referral.id, {
        invite_token_hash: tokenHash,
        invite_created_at: new Date().toISOString(),
        status: "Invited",
      });
      return Response.json({
        referral: {
          id: updated.id,
          participant_name: updated.participant_name,
          phone: updated.phone,
          email: updated.email,
          referring_staff: updated.referring_staff,
          status: updated.status,
        },
        invite_token: token,
      });
    }

    throw httpError("Unknown participant intake action", 400);
  } catch (error) {
    return orgErrorResponse(error);
  }
}