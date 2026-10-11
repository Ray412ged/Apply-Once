import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveOrgContext, orgErrorResponse } from '../../shared/orgAuth.ts';
import {
  httpError,
  requireOrgEmployer,
  requireOrgContact,
  requireActiveOrgStaff,
} from '../../shared/orgEmployerSecurity.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const ctx = await resolveOrgContext(base44);
    const body = await req.json().catch(() => ({}));
    const action = body?.action || "list";

    if (action === "list") {
      const employer = await requireOrgEmployer(ctx, body?.employer_id);
      const activities = await ctx.svc.entities.EmployerActivity.filter(
        { organization_id: ctx.organizationId, employer_id: employer.id },
        "-activity_date",
        500
      );
      return Response.json({ activities });
    }

    if (action === "create") {
      const employer = await requireOrgEmployer(ctx, body?.employer_id);

      if (body?.contact_id) {
        const contact = await requireOrgContact(ctx, body.contact_id);
        if (contact.employer_id !== employer.id) {
          throw httpError("Contact does not belong to this employer", 404);
        }
      }

      let nextStepOwnerStaffId = body?.next_step_owner_staff_id || ctx.staffAccount.id;
      if (body?.next_step) {
        await requireActiveOrgStaff(ctx, nextStepOwnerStaffId);
      } else {
        nextStepOwnerStaffId = "";
      }

      const note = String(body?.note || "").trim();
      if (!note) throw httpError("Activity note is required", 400);

      const activityDate = body?.activity_date || new Date().toISOString();
      const activityTime = new Date(activityDate).getTime();
      const serverNow = Date.now();
      if (!Number.isFinite(activityTime)) {
        throw httpError("Activity date is invalid", 400);
      }
      if (activityTime > serverNow) {
        throw httpError("Activity date cannot be in the future", 400);
      }

      const created = await ctx.svc.entities.EmployerActivity.create({
        organization_id: ctx.organizationId,
        employer_id: employer.id,
        contact_id: body?.contact_id || "",
        staff_user_id: ctx.user.id,
        activity_date: activityDate,
        activity_type: body?.activity_type || "Follow-up",
        note,
        next_step: body?.next_step || "",
        next_step_due: body?.next_step_due || "",
        next_step_owner_staff_id: nextStepOwnerStaffId,
        next_step_done: false,
      });

      const existingLastActivityTime = employer.last_activity_date
        ? new Date(employer.last_activity_date).getTime()
        : NaN;
      const lastActivityDate =
        Number.isFinite(existingLastActivityTime) && existingLastActivityTime > activityTime
          ? employer.last_activity_date
          : activityDate;

      await ctx.svc.entities.OrgEmployer.update(employer.id, {
        last_activity_date: lastActivityDate,
      });

      return Response.json({ activity: created });
    }

    if (action === "complete_next_step") {
      const activityId = body?.activity_id;
      if (!activityId) throw httpError("Activity id is required", 400);
      const activity = await ctx.svc.entities.EmployerActivity.get(activityId);
      if (!activity || activity.organization_id !== ctx.organizationId) {
        throw httpError("Activity not found", 404);
      }

      const ownsNextStep =
        activity.next_step_owner_staff_id === ctx.staffAccount.id ||
        activity.staff_user_id === ctx.user.id;
      if (ctx.orgRole !== "org_admin" && !ownsNextStep) {
        throw httpError("You do not have permission to update this next step", 403);
      }

      const updated = await ctx.svc.entities.EmployerActivity.update(activity.id, {
        next_step_done: true,
      });
      return Response.json({ activity: updated });
    }

    if (action === "open_next_steps") {
      const activities = await ctx.svc.entities.EmployerActivity.filter(
        { organization_id: ctx.organizationId, next_step_done: false },
        "next_step_due",
        1000
      );
      const open = activities.filter((a) => a.next_step);
      return Response.json({ activities: open });
    }

    throw httpError("Unknown activity action", 400);
  } catch (error) {
    return orgErrorResponse(error);
  }
}