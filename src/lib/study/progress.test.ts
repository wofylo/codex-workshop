import assert from "node:assert/strict";
import test from "node:test";
import {
  buildStudyProgressMutation,
  buildStudyProgressState,
  type StudyProgressRow,
} from "./progress.ts";
import type { StudySection } from "./content.ts";

const sections = [
  { id: "core-patterns", depth: 2, title: "Core Patterns" },
  { id: "failure-gates", depth: 3, title: "Failure Gates" },
] satisfies StudySection[];

test("buildStudyProgressState returns zero progress without rows", () => {
  const state = buildStudyProgressState(sections, []);

  assert.deepEqual(state.summary, {
    totalSections: 2,
    readSections: 0,
    percentage: 0,
  });
  assert.equal(state.bySectionId["core-patterns"]?.isRead, false);
});

test("buildStudyProgressState counts only current content sections", () => {
  const rows = [
    {
      section_id: "core-patterns",
      section_title: "Core Patterns",
      is_read: true,
      read_at: "2026-06-21T00:00:00.000Z",
    },
    {
      section_id: "stale-section",
      section_title: "Stale",
      is_read: true,
      read_at: "2026-06-21T00:00:00.000Z",
    },
  ] satisfies StudyProgressRow[];

  const state = buildStudyProgressState(sections, rows);

  assert.equal(state.summary.readSections, 1);
  assert.equal(state.summary.percentage, 50);
  assert.equal(state.bySectionId["core-patterns"]?.isRead, true);
  assert.equal(state.bySectionId["failure-gates"]?.isRead, false);
});

test("buildStudyProgressMutation creates read and unread upsert payloads", () => {
  const read = buildStudyProgressMutation({
    userId: "user-1",
    domainSlug: "agentic-architecture",
    language: "en",
    section: sections[0],
    read: true,
    now: "2026-06-21T00:00:00.000Z",
  });
  const unread = buildStudyProgressMutation({
    userId: "user-1",
    domainSlug: "agentic-architecture",
    language: "en",
    section: sections[0],
    read: false,
    now: "2026-06-21T00:00:00.000Z",
  });

  assert.equal(read.is_read, true);
  assert.equal(read.read_at, "2026-06-21T00:00:00.000Z");
  assert.equal(unread.is_read, false);
  assert.equal(unread.read_at, null);
});
