import { describe, expect, it } from "vitest";
import {
  dateInsideLink,
  validateEmploymentStartDate,
  resolveApplicationForOutcome,
} from "../../base44/shared/orgOutcomeSecurity.ts";

describe("organization employment outcome security", () => {
  it("attributes a date inside an active connection period", () => {
    const link = { linked_at: "2026-01-01T00:00:00.000Z" };
    expect(dateInsideLink(link, "2026-06-01")).toBe(true);
  });

  it("rejects a date before the connection began", () => {
    const link = { linked_at: "2026-06-01T00:00:00.000Z" };
    expect(dateInsideLink(link, "2026-05-31")).toBe(false);
  });

  it("rejects a date after a revoked connection ended", () => {
    const link = {
      linked_at: "2026-01-01T00:00:00.000Z",
      revoked_at: "2026-06-01T23:59:59.000Z",
    };
    expect(dateInsideLink(link, "2026-06-02")).toBe(false);
  });

  it("accepts a valid nonfuture employment start date", () => {
    expect(validateEmploymentStartDate("2026-01-01")).toBe("2026-01-01");
  });

  it("rejects an invalid employment start date", () => {
    expect(() => validateEmploymentStartDate("not-a-date")).toThrow();
  });

  it("rejects an application owned by another participant", async () => {
    const svc = {
      entities: {
        Application: {
          get: async () => ({
            id: "a1",
            created_by_id: "participant-b",
            job_posting_id: "j1",
          }),
        },
      },
    };

    await expect(
      resolveApplicationForOutcome(svc, "participant-a", "a1")
    ).rejects.toMatchObject({ status: 404 });
  });

  it("returns the participant's application and its job", async () => {
    const svc = {
      entities: {
        Application: {
          get: async () => ({
            id: "a1",
            created_by_id: "participant-a",
            job_posting_id: "j1",
          }),
        },
        JobPosting: {
          get: async () => ({
            id: "j1",
            organization_id: "org-a",
          }),
        },
      },
    };

    const result = await resolveApplicationForOutcome(
      svc,
      "participant-a",
      "a1"
    );
    expect(result.application.id).toBe("a1");
    expect(result.job.id).toBe("j1");
  });
});