import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runTests } from "../components/command-center/CommandCenter.test.js";
import * as statusHelpers from "../components/command-center/statusHelpers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("Command Center — single primary action, no duplicate scoring", () => {
  it("has exactly one Next Best Step, no child-component readiness duplication, and non-punitive Optional/N-A styling", () => {
    const homeSource = fs.readFileSync(path.resolve(__dirname, "../pages/Home.jsx"), "utf8");
    const sectionStatusCardSource = fs.readFileSync(
      path.resolve(__dirname, "../components/dashboard/SectionStatusCard.jsx"),
      "utf8"
    );
    const ccDir = path.resolve(__dirname, "../components/command-center");
    const commandCenterSources = fs
      .readdirSync(ccDir)
      .filter((f) => (f.endsWith(".jsx") || f.endsWith(".js")) && !f.endsWith(".test.js"))
      .map((f) => ({ path: path.join(ccDir, f), content: fs.readFileSync(path.join(ccDir, f), "utf8") }));

    const result = runTests({
      deriveOverallState: statusHelpers.deriveOverallState,
      getReadinessExplanation: statusHelpers.getReadinessExplanation,
      getStateCopy: statusHelpers.getStateCopy,
      homeSource,
      commandCenterSources,
      sectionStatusCardSource,
    });
    if (!result.allPassed) {
      // eslint-disable-next-line no-console
      console.error(result.failures.join("\n"));
    }
    expect(result.failed, result.failures.join("\n")).toBe(0);
    expect(result.allPassed).toBe(true);
  });
});