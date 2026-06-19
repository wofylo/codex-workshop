# Study Section Navigation Design

## Purpose

Add section navigation to the protected study reading pages so approved users can scan long CCA-F domain guides, jump to major sections, and keep their place while reading. This is the next small slice after the initial `/study/[domainSlug]` page because it improves reading ergonomics without introducing persistence, database changes, or quiz logic.

## Scope

This slice covers:

- Generate stable anchors for Markdown `h2` and `h3` headings.
- Render matching `id` attributes on heading elements in the reading article.
- Show a section table of contents in the existing study sidebar on desktop.
- Show the same section table of contents above the article on narrow/mobile layouts.
- Preserve the existing language toggle and auth guard behavior.
- Add unit coverage for section extraction, anchor generation, duplicate heading handling, and rendering-safe text behavior.

This slice does not cover:

- Reading progress persistence.
- Database schema or RLS changes.
- Active-section scroll tracking.
- Quiz generation or scoring.
- Full Markdown rendering beyond the current safe block model.

## Architecture

The existing `src/lib/study/content.ts` remains the source of truth for reading-page content. It already converts fixed allowlisted guide files into a React-safe `MarkdownBlock[]`. This slice extends that model rather than introducing a third-party Markdown renderer.

Planned additions:

- Extend heading blocks with an optional `anchor` field.
- Add a `StudySection` type with `id`, `depth`, and `title`.
- Add a helper such as `getStudySections(blocks)` or compute `sections` inside `getStudyContent()`.
- Add an anchor generator that lowercases heading text, removes unsafe punctuation, collapses whitespace to hyphens, and appends numeric suffixes for duplicates.

Keeping this in `content.ts` makes the behavior easy to test without rendering Next.js pages and avoids client-side parsing work.

## Data Flow

1. `getStudyContent(slug, language)` loads the fixed English or Traditional Chinese Markdown file.
2. `renderMarkdownBlocks(markdown)` parses the Markdown into safe blocks.
3. A new section enrichment step assigns anchors to `h2` and `h3` heading blocks and returns a `sections` list.
4. `src/app/study/[domainSlug]/page.tsx` renders article headings with `id={block.anchor}` when present.
5. The page renders `sections` as in-page links using `href="#section-id"`.

The URL shape remains unchanged:

```text
/study/agentic-architecture
/study/agentic-architecture?lang=zh
```

Section links are fragment-only additions:

```text
/study/agentic-architecture#core-patterns
```

## UI Design

The current study page uses a quiet scholarly layout: article content on the left and a sticky sidebar on the right. Section navigation should keep that tone and avoid adding visual noise.

Desktop:

- Keep the existing `Study focus` card.
- Add a `Sections` card below it, or combine the section list into a clearly separated area if spacing is tighter.
- Use compact text links, with subtle indentation for `h3` under `h2`.
- Keep the sidebar sticky behavior.

Mobile:

- Place a compact `Sections` panel between the toolbar and the article.
- Use a dense vertical list rather than a dropdown, because the section count is expected to be modest and visible scanning is useful.
- Avoid nested cards inside cards.

Accessibility:

- Use a `nav` landmark with `aria-label="Study sections"`.
- Preserve visible heading text as the link label.
- Keep links keyboard reachable.
- Do not rely on color alone for hierarchy; use spacing and text size.

## Error Handling

- Unknown `domainSlug` continues to call `notFound()`.
- Guides with no `h2` or `h3` headings render the article normally and omit the sections navigation.
- Duplicate headings receive stable suffixes such as `overview`, `overview-2`, `overview-3`.
- Headings that normalize to an empty string fall back to a deterministic section id such as `section-1`.

## Testing

Add tests to `src/lib/study/content.test.ts` before implementation:

- `renderMarkdownBlocks` or the new section helper assigns anchors to `h2` and `h3` headings.
- `h1` is not included in the section navigation.
- duplicate headings get unique deterministic anchors.
- unsafe/raw HTML heading text remains text and does not create rendered HTML.
- Chinese headings produce non-empty stable anchors, using either preserved CJK characters or deterministic fallback ids.

Run the existing verification set after implementation:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm test
corepack pnpm lint
corepack pnpm typecheck
```

Run the placeholder-env build before completion:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co'
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='placeholder'
$env:SUPABASE_SECRET_KEY='placeholder-secret'
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm build
```

## Acceptance Criteria

- Approved users can open a study page and see section navigation for guides with `h2` or `h3` headings.
- Clicking a section link jumps to the matching article heading.
- English and Traditional Chinese pages both produce valid section links.
- Duplicate headings do not produce duplicate `id` attributes.
- Existing auth redirects and language toggles continue to work.
- Tests, lint, typecheck, and build pass.

