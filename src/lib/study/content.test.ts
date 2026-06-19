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

test("renderMarkdownBlocks adds section anchors for h2 and h3 headings", () => {
  const blocks = renderMarkdownBlocks("# Title\n\n## Core Patterns\n\n### Failure Gates\n\nText");

  assert.deepEqual(blocks, [
    { type: "heading", depth: 1, text: "Title" },
    { type: "heading", depth: 2, text: "Core Patterns", anchor: "core-patterns" },
    { type: "heading", depth: 3, text: "Failure Gates", anchor: "failure-gates" },
    { type: "paragraph", text: "Text" },
  ]);
});

test("getStudyContent exposes h2 and h3 sections without including the title h1", () => {
  const content = getStudyContent("agentic-architecture", "en");

  assert.ok(content);
  assert.ok(content.sections.length > 0);
  assert.equal(content.sections.every((section) => section.depth === 2 || section.depth === 3), true);
  assert.equal(content.sections[0].depth, 2);
  assert.equal(typeof content.sections[0].id, "string");
  assert.equal(typeof content.sections[0].title, "string");
});

test("renderMarkdownBlocks makes duplicate and non-latin heading anchors deterministic", () => {
  const blocks = renderMarkdownBlocks("## Overview\n\n## Overview\n\n## 主題 概覽\n\n## <script>");

  assert.deepEqual(blocks, [
    { type: "heading", depth: 2, text: "Overview", anchor: "overview" },
    { type: "heading", depth: 2, text: "Overview", anchor: "overview-2" },
    { type: "heading", depth: 2, text: "主題 概覽", anchor: "主題-概覽" },
    { type: "heading", depth: 2, text: "<script>", anchor: "script" },
  ]);
});
