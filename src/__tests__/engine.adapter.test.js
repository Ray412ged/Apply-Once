import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runTests } from "../lib/readiness/engine.test.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Adapter: runs the existing engine.test.js spec (which takes real file
// content as input) as an actual vitest suite, so `npm test` reports
// pass/fail instead of requiring manual invocation.
function walk(dir, acc) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, acc);
    else if (/\.(js|jsx)$/.test(entry.name)) acc.push(p);
  }
}

describe("Readiness Engine — canonical contract", () => {
  it("exports the public API, honors the output contract, and has no active references to deprecated shims", () => {
    const engineSource = fs.readFileSync(
      path.resolve(__dirname, "../lib/readiness/engine.js"),
      "utf8"
    );
    const files = [];
    walk(path.resolve(__dirname, ".."), files);
    const fileReferences = files.map((p) => ({ path: p, content: fs.readFileSync(p, "utf8") }));

    const result = runTests({ engineSource, fileReferences });
    if (!result.allPassed) {
      // eslint-disable-next-line no-console
      console.error(result.failures.join("\n"));
    }
    expect(result.failed, result.failures.join("\n")).toBe(0);
    expect(result.allPassed).toBe(true);
  });
});