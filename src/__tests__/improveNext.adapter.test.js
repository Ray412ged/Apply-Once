import { describe, it, expect } from "vitest";
import { runTests } from "../lib/readiness/improveNext.test.js";

// Adapter: improveNext.test.js already imports the real module directly
// (Vite/vitest resolve extensionless relative imports natively, unlike
// plain Node), so this wrapper just gives it real describe/it/expect
// reporting instead of relying on its self-run console output.
describe("Improve Next — specific, actionable recommendations", () => {
  it("produces the spec scenarios correctly (resolved sections, no-formal-employment, thin records, fully strengthened)", () => {
    const result = runTests();
    if (!result.allPassed) {
      // eslint-disable-next-line no-console
      console.error(result.failures.join("\n"));
    }
    expect(result.failed, result.failures.join("\n")).toBe(0);
    expect(result.allPassed).toBe(true);
  });
});