import assert from "node:assert/strict";
import test from "node:test";
import {
  getDashboardSummary,
  getStudyDomains,
  getSuggestedDomain,
} from "./dashboard.ts";

test("getStudyDomains exposes the five CCA-F study domains in exam order", () => {
  const domains = getStudyDomains();

  assert.equal(domains.length, 5);
  assert.deepEqual(
    domains.map((domain) => domain.slug),
    [
      "agentic-architecture",
      "claude-code",
      "tool-design-mcp",
      "prompt-engineering",
      "context-management",
    ],
  );
  assert.equal(domains[0].weight, 27);
  assert.equal(domains[0].difficulty, "Hardest");
});

test("getDashboardSummary totals static domain metadata", () => {
  assert.deepEqual(getDashboardSummary(), {
    domainCount: 5,
    totalExamWeight: 100,
    guideCount: 10,
  });
});

test("getSuggestedDomain recommends the highest-weight domain first", () => {
  const suggested = getSuggestedDomain();

  assert.equal(suggested.slug, "agentic-architecture");
  assert.equal(suggested.nextAction, "Start with scenario patterns and failure gates.");
});
