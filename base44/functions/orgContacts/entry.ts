import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { resolveOrgContext, orgErrorResponse } from '../../shared/orgAuth.ts';
import {
  httpError,
  requireOrgEmployer,
  requireOrgContact,
  requireActiveOrgStaff,
  requireOrgAdmin,
} from '../../shared/orgEmployerSecurity.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const ctx = await resolveOrgContext(base44);
    const body = await req.json().catch(() => ({}));
    const action = body?.action || "list";

    if (action === "list") {
      const employer = await requireOrgEmployer(ctx, body?.employer_id);
      const contacts = await ctx.svc.entities.EmployerContact.filter(
        { organization_id: ctx.organizationId, employer_id: employer.id },
        "-created_date",
        500
      );
      return Response.json({ contacts });
    }

    if (action === "create") {
      const employer = await requireOrgEmployer(ctx, body?.employer_id);
      const name = String(body?.name || "").trim();
      if (!name) throw httpError("Contact name is required", 400);

      const ownerStaffId = body?.relationship_owner_staff_id || ctx.staffAccount.id;
      await requireActiveOrgStaff(ctx, ownerStaffId);

      const created = await ctx.svc.entities.EmployerContact.create({
        organization_id: ctx.organizationId,
        employer_id: employer.id,
        name,
        title: body?.title || "",
        department: body?.department || "",
        email: body?.email || "",
        phone: body?.phone || "",
        location: body?.location || "",
        preferred_contact_method: body?.preferred_contact_method || undefined,
        relationship_owner_staff_id: ownerStaffId,
        status: "Active",
      });
      return Response.json({ contact: created });
    }

    if (action === "update") {
      const contact = await requireOrgContact(ctx, body?.contact_id);
      await requireOrgEmployer(ctx, contact.employer_id);

      const ownsContact = contact.relationship_owner_staff_id === ctx.staffAccount.id;
      if (ctx.orgRole !== "org_admin" && !ownsContact) {
        throw httpError("You do not have permission to edit this contact", 403);
      }

      const updates = {};
      for (const field of ["name", "title", "department", "email", "phone", "location", "preferred_contact_method"]) {
        if (body?.[field] !== undefined) updates[field] = body[field];
      }

      if (body?.relationship_owner_staff_id !== undefined) {
        if (ctx.orgRole !== "org_admin" && body.relationship_owner_staff_id !== ctx.staffAccount.id) {
          throw httpError("Only an organization admin can reassign contact ownership", 403);
        }
        await requireActiveOrgStaff(ctx, body.relationship_owner_staff_id);
        updates.relationship_owner_staff_id = body.relationship_owner_staff_id;
      }

      if (body?.status !== undefined) {
        if (ctx.orgRole !== "org_admin") {
          throw httpError("Only an organization admin can change contact status", 403);
        }
        updates.status = body.status;
      }

      const updated = await ctx.svc.entities.EmployerContact.update(contact.id, updates);
      return Response.json({ contact: updated });
    }

    if (action === "deactivate") {
      requireOrgAdmin(ctx);
      const contact = await requireOrgContact(ctx, body?.contact_id);
      const updated = await ctx.svc.entities.EmployerContact.update(contact.id, { status: "Inactive" });
      return Response.json({ contact: updated });
    }

    throw httpError("Unknown contact action", 400);
  } catch (error) {
    return orgErrorResponse(error);
  }
}