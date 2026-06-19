# Study Section Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add section navigation anchors and table-of-contents links to protected CCA-F study reading pages.

**Architecture:** Extend `src/lib/study/content.ts` so Markdown heading parsing produces stable section anchors and a `sections` list. Render those sections in `src/app/study/[domainSlug]/page.tsx` using server-rendered links and existing shadcn-compatible UI primitives.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, Node test runner, Tailwind CSS, lucide-react, shadcn-compatible components.

## Global Constraints

- Keep the route shape `/study/[domainSlug]` and existing `?lang=zh` language behavior.
- Do not add persistence, database schema changes, RLS changes, active-scroll tracking, or quiz logic.
- Keep Markdown rendering React-safe; raw HTML remains text.
- Use TDD: write failing tests before production code.
- Run `corepack pnpm test`, `corepack pnpm lint`, `corepack pnpm typecheck`, and placeholder-env `corepack pnpm build` before completion.

---

### Task 1: Content Sections And Anchors

**Files:**
- Modify: `src/lib/study/content.test.ts`
- Modify: `src/lib/study/content.ts`

**Interfaces:**
- Produces: `StudySection = { id: string; depth: 2 | 3; title: string }`
- Produces: heading blocks with optional `anchor?: string`
- Produces: `StudyContent.sections: StudySection[]`

- [x] **Step 1: Write the failing tests**

Add tests to `src/lib/study/content.test.ts`:

```ts
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
```

- [x] **Step 2: Run test to verify it fails**

Run:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm test
```

Expected: FAIL because heading blocks do not yet include `anchor` and `StudyContent.sections` does not exist.

- [x] **Step 3: Write minimal implementation**

Update `src/lib/study/content.ts`:

```ts
export type StudySection = {
  id: string;
  depth: 2 | 3;
  title: string;
};

export type MarkdownBlock =
  | { type: "heading"; depth: 1 | 2 | 3; text: string; anchor?: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "quote"; text: string }
  | { type: "code"; text: string }
  | { type: "rule" };

export type StudyContent = {
  domain: StudyDomain;
  language: StudyLanguage;
  sourcePath: string;
  title: string;
  blocks: MarkdownBlock[];
  sections: StudySection[];
};
```

When parsing headings, call a helper that returns deterministic anchors for depth 2 and 3 headings only. Return `sections` from `getStudyContent()` by filtering heading blocks that have anchors.

- [x] **Step 4: Run test to verify it passes**

Run:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm test
```

Expected: PASS with all tests green.

### Task 2: Reading Page Section Navigation UI

**Files:**
- Modify: `src/app/study/[domainSlug]/page.tsx`

**Interfaces:**
- Consumes: `StudyContent.sections`
- Consumes: heading block `anchor?: string`

- [x] **Step 1: Render anchors on article headings**

Update `MarkdownBlockView` so heading elements receive `id={block.anchor}` when present and use `scroll-mt-24` to prevent sticky/top chrome overlap.

- [x] **Step 2: Render section navigation**

Add a small `StudySectionNavigation` component in `src/app/study/[domainSlug]/page.tsx`:

```tsx
function StudySectionNavigation({ sections }: { sections: StudySection[] }) {
  if (sections.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Study sections" className="space-y-2">
      {sections.map((section) => (
        <Link
          className={cn(
            "block rounded-md px-2 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground",
            section.depth === 3 && "ml-3 text-xs",
          )}
          href={`#${section.id}`}
          key={section.id}
        >
          {section.title}
        </Link>
      ))}
    </nav>
  );
}
```

Use it once in a mobile-visible panel above the article and once in the desktop sidebar below `Study focus`.

- [x] **Step 3: Run static verification**

Run:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm lint
corepack pnpm typecheck
```

Expected: both commands exit 0.

### Task 3: Final Verification And Commit

**Files:**
- Modify: `docs/superpowers/HANDOFF.md`

**Interfaces:**
- Documents latest feature commit and verification state.

- [x] **Step 1: Run full verification**

Run:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm test
corepack pnpm lint
corepack pnpm typecheck
$env:NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co'
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='placeholder'
$env:SUPABASE_SECRET_KEY='placeholder-secret'
corepack pnpm build
```

Expected: all commands exit 0.

- [ ] **Step 2: Update handoff**

Update `docs/superpowers/HANDOFF.md` with the new section navigation feature, verification result, and latest commit after committing the implementation.

- [ ] **Step 3: Commit and push**

Run:

```powershell
git add docs/superpowers/plans/2026-06-19-study-section-navigation-plan.md src/lib/study/content.test.ts src/lib/study/content.ts src/app/study/[domainSlug]/page.tsx docs/superpowers/HANDOFF.md
git commit -m "feat: add study section navigation"
git push origin main
```

Expected: branch `main` pushes to `origin/main`.
