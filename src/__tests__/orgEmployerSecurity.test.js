import { describe, expect, it } from "vitest";
import {
  normalizeEmployerName,
  canEditEmployer,
  requireOrgEmployer,
  requireOrgContact,
  requireActiveOrgStaff,
} from "../../base44/shared/orgEmployerSecurity.ts";

function ctx(overrides = {}) {
  return {
    organizationId: "org-a",
    orgRole: "staff",
    staffAccount: { id: "staff-a" },
    svc: {
      entities: {
        OrgEmployer: { get: async () => null },
        EmployerContact: { get: async () => null },
        OrganizationStaffAccount: { filter: async () => [] },
      },
    },
    ...overrides,
  };
}

describe("organization employer security", () => {
  it("normalizes employer names consistently", () => {
    expect(normalizeEmployerName("  UPMC & Mercy, Inc. ")).toBe("upmc and mercy inc");
  });

  it("allows an org admin to edit any employer in their org", () => {
    expect(canEditEmployer(ctx({ orgRole: "org_admin" }), { relationship_owner_staff_id: "other", status: "Active" })).toBe(true);
  });

  it("allows relationship owners to edit their active employer", () => {
    expect(canEditEmployer(ctx(), { relationship_owner_staff_id: "staff-a", status: "Active" })).toBe(true);
  });

  it("allows staff to edit a lead they created", () => {
    expect(canEditEmployer(ctx(), { relationship_owner_staff_id: "other", created_by_staff_id: "staff-a", status: "Lead" })).toBe(true);
  });

  it("denies staff editing an active employer they do not own", () => {
    expect(canEditEmployer(ctx(), { relationship_owner_staff_id: "staff-b", created_by_staff_id: "staff-a", status: "Active" })).toBe(false);
  });

  it("denies a lead creator after promotion when they are not the owner", () => {
    expect(canEditEmployer(ctx(), { relationship_owner_staff_id: "staff-b", created_by_staff_id: "staff-a", status: "Active" })).toBe(false);
  });

  it("rejects a cross-org employer id", async () => {
    const c = ctx({
      svc: {
        entities: {
          OrgEmployer: { get: async () => ({ id: "e1", organization_id: "org-b" }) },
        },
      },
    });
    await expect(requireOrgEmployer(c, "e1")).rejects.toMatchObject({ status: 404 });
  });

  it("rejects a cross-org contact id", async () => {
    const c = ctx({
      svc: {
        entities: {
          EmployerContact: { get: async () => ({ id: "c1", organization_id: "org-b" }) },
        },
      },
    });
    await expect(requireOrgContact(c, "c1")).rejects.toMatchObject({ status: 404 });
  });

  it("validates staff ownership inside the same org", async () => {
    const c = ctx({
      svc: {
        entities: {
          OrganizationStaffAccount: {
            filter: async (query) =>
              query.id === "staff-b" && query.organization_id === "org-a" && query.active === true
                ? [{ id: "staff-b", organization_id: "org-a", active: true }]
                : [],
          },
        },
      },
    });
    await expect(requireActiveOrgStaff(c, "staff-b")).resolves.toMatchObject({ id: "staff-b" });
  });

  it("rejects inactive or other-org staff assignments", async () => {
    const c = ctx({
      svc: {
        entities: {
          OrganizationStaffAccount: {
            filter: async () => [],
          },
        },
      },
    });
    await expect(requireActiveOrgStaff(c, "staff-b")).rejects.toMatchObject({ status: 404 });
  });
});