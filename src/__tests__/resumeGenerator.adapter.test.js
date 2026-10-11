import { describe, it, expect } from "vitest";
import { runTests } from "../lib/resume/resumeGenerator.test.js";

describe("Live Resume — sensitive-field exclusion and generation", () => {
  it("produces the spec scenarios correctly (experienced user, first-time applicant, resolved sections omitted, sensitive fields never present)", () => {
    const result = runTests();
    if (!result.allPassed) {
      // eslint-disable-next-line no-console
      console.error(result.failures.join("\n"));
    }
    expect(result.failed, result.failures.join("\n")).toBe(0);
    expect(result.allPassed).toBe(true);
  });
});