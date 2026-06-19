import assert from "node:assert/strict";
import test from "node:test";
import {
  getStudyContent,
  getStudyDomainBySlug,
  getStudyDomainSlugs,
  renderMarkdownBlocks,
} from "./content.ts";

test("getStudyDomainSlugs exposes route slugs for all five domains", () => {
  assert.deepEqual(getStudyDomainSlugs(), [
    "agentic-architecture",
    "claude-code",
    "tool-design-mcp",
    "prompt-engineering",
    "context-management",
  ]);
});

test("getStudyDomainBySlug returns null for unknown domains", () => {
  assert.equal(getStudyDomainBySlug("missing-domain"), null);
});

test("getStudyContent loads fixed English and Chinese guide files", () => {
  const english = getStudyContent("agentic-architecture", "en");
  const chinese = getStudyContent("agentic-architecture", "zh");

  assert.ok(english);
  assert.ok(chinese);
  assert.equal(english.domain.slug, "agentic-architecture");
  assert.equal(english.language, "en");
  assert.equal(english.title, "Domain 1: Agentic Architecture & Orchestration");
  assert.equal(chinese.language, "zh");
  assert.equal(chinese.title, "主題 1：Agentic Architecture 與 Orchestration");
  assert.ok(english.blocks.some((block) => block.type === "heading" && block.depth === 2));
  assert.ok(chinese.blocks.some((block) => block.type === "list"));
});

test("renderMarkdownBlocks escapes raw html by keeping it as text", () => {
  const blocks = renderMarkdownBlocks("# Title\n\n<script>alert('x')</script>\n\n- Item");

  assert.deepEqual(blocks, [
    { type: "heading", depth: 1, text: "Title" },
    { type: "paragraph", text: "<script>alert('x')</script>" },
    { type: "list", ordered: false, items: ["Item"] },
  ]);
});
