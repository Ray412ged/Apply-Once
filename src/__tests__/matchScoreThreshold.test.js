import { describe, it, expect } from "vitest";
import { computeMatchScore } from "../lib/readiness/jobMatcher.js";

describe("Match score threshold — verifies MatchBadge's Review-Needed fallback isn't triggered incorrectly", () => {
  const job = { job_title: "Warehouse Associate", employment_type: "Full-time", industry: "Logistics" };

  it("returns score 0 / level Review Needed for a genuinely empty profile — no fabricated number", () => {
    const result = computeMatchScore(job, {
      profile: {},
      education: [],
      employment: [],
      skills: [],
      credentials: [],
      preferences: null,
    });
    expect(result.score).toBe(0);
    expect(result.level).toBe("Review Needed");
  });

  it("returns a real, non-zero score for a populated participant profile", () => {
    const result = computeMatchScore(job, {
      profile: { state: "PA" },
      education: [{ degree_or_credential: "High School Diploma" }],
      employment: [{ job_title: "Stock Clerk" }],
      skills: [{ skill_name: "forklift" }],
      credentials: [],
      preferences: { desired_job_titles: ["Warehouse Associate"], employment_types: ["Full-time"] },
    });
    expect(result.score).toBeGreaterThan(0);
    expect(result.level).not.toBe("Review Needed");
  });
});