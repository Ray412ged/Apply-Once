import { describe, it, expect } from "vitest";
import { resolveOrgContext } from "../../base44/shared/orgAuth.ts";
import { resolveJobSeekerOrg } from "../../base44/shared/jobSeekerOrg.ts";

function makeBase44({ user = { id: "u1" }, staffRows = [], orgRows = [], linkRows = [] } = {}) {
  return {
    auth: {
      me: async () => user,
    },
    asServiceRole: {
      entities: {
        OrganizationStaffAccount: {
          filter: async () => staffRows,
        },
        Organization: {
          filter: async ({ id }) => orgRows.filter((o) => o.id === id),
        },
        ParticipantOrgLink: {
          filter: async () => linkRows,
        },
      },
    },
  };
}

describe("organization security helpers", () => {
  it("rejects multiple active staff assignments", async () => {
    const base44 = makeBase44({
      staffRows: [
        { id: "s1", organization_id: "o1", active: true },
        { id: "s2", organization_id: "o2", active: true },
      ],
    });

    await expect(resolveOrgContext(base44)).rejects.toMatchObject({ status: 409 });
  });

  it("rejects inactive staff organization", async () => {
    const base44 = makeBase44({
      staffRows: [{ id: "s1", organization_id: "o1", active: true }],
      orgRows: [{ id: "o1", active: false }],
    });

    await expect(resolveOrgContext(base44)).rejects.toMatchObject({ status: 403 });
  });

  it("returns the single active staff organization", async () => {
    const base44 = makeBase44({
      staffRows: [{ id: "s1", organization_id: "o1", active: true, org_role: "org_admin" }],
      orgRows: [{ id: "o1", active: true }],
    });

    const result = await resolveOrgContext(base44);
    expect(result.organizationId).toBe("o1");
    expect(result.orgRole).toBe("org_admin");
  });

  it("treats a participant link to an inactive organization as unconnected", async () => {
    const base44 = makeBase44({
      linkRows: [{ id: "l1", participant_id: "u1", organization_id: "o1", status: "active" }],
      orgRows: [{ id: "o1", active: false }],
    });

    await expect(resolveJobSeekerOrg(base44, { id: "u1" })).resolves.toBeNull();
  });

  it("rejects ambiguous multiple active participant links", async () => {
    const base44 = makeBase44({
      linkRows: [
        { id: "l1", participant_id: "u1", organization_id: "o1", status: "active" },
        { id: "l2", participant_id: "u1", organization_id: "o2", status: "active" },
      ],
    });

    await expect(resolveJobSeekerOrg(base44, { id: "u1" })).rejects.toMatchObject({ status: 409 });
  });
});