import { describe, expect, it } from "vitest";
import {
  isOpportunityOwner,
  canEditOpportunity,
  canCloseOpportunity,
  requireOrgOpportunity,
} from "../../base44/shared/orgOpportunitySecurity.ts";

function ctx(overrides = {}) {
  return {
    organizationId: "org-a",
    orgRole: "staff",
    staffAccount: { id: "staff-a" },
    svc: {
      entities: {
        JobPosting: { get: async () => null },
      },
    },
    ...overrides,
  };
}

describe("organization opportunity security", () => {
  it("recognizes the submitting staff member as owner", () => {
    expect(isOpportunityOwner(ctx(), { submitted_by_staff_id: "staff-a" })).toBe(true);
  });

  it("lets staff edit their own draft unverified opportunity", () => {
    expect(canEditOpportunity(ctx(), {
      submitted_by_staff_id: "staff-a",
      status: "Draft",
      verification_status: "Unverified",
    })).toBe(true);
  });

  it("lets staff edit their own returned opportunity", () => {
    expect(canEditOpportunity(ctx(), {
      submitted_by_staff_id: "staff-a",
      status: "Draft",
      verification_status: "Returned",
    })).toBe(true);
  });

  it("denies staff editing another staff member's draft", () => {
    expect(canEditOpportunity(ctx(), {
      submitted_by_staff_id: "staff-b",
      status: "Draft",
      verification_status: "Unverified",
    })).toBe(false);
  });

  it("denies staff editing an active verified opportunity", () => {
    expect(canEditOpportunity(ctx(), {
      submitted_by_staff_id: "staff-a",
      status: "Active",
      verification_status: "Verified",
    })).toBe(false);
  });

  it("allows org admin to edit opportunities", () => {
    expect(canEditOpportunity(ctx({ orgRole: "org_admin" }), {
      submitted_by_staff_id: "staff-b",
      status: "Active",
      verification_status: "Verified",
    })).toBe(true);
  });

  it("lets submitter close their active verified opportunity", () => {
    expect(canCloseOpportunity(ctx(), {
      submitted_by_staff_id: "staff-a",
      status: "Active",
      verification_status: "Verified",
    })).toBe(true);
  });

  it("denies another staff member closing an active opportunity", () => {
    expect(canCloseOpportunity(ctx(), {
      submitted_by_staff_id: "staff-b",
      status: "Active",
      verification_status: "Verified",
    })).toBe(false);
  });

  it("returns 404 for another organization's opportunity", async () => {
    const c = ctx({
      svc: {
        entities: {
          JobPosting: {
            get: async () => ({ id: "job-1", organization_id: "org-b" }),
          },
        },
      },
    });
    await expect(requireOrgOpportunity(c, "job-1")).rejects.toMatchObject({ status: 404 });
  });

  it("returns 404 when Base44 get throws for a missing id", async () => {
    const c = ctx({
      svc: {
        entities: {
          JobPosting: {
            get: async () => { throw new Error("not found"); },
          },
        },
      },
    });
    await expect(requireOrgOpportunity(c, "missing")).rejects.toMatchObject({ status: 404 });
  });
});