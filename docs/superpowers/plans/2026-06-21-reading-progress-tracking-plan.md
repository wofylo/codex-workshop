# Reading Progress Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Supabase-backed section-level reading progress tracking to protected CCA-F study pages.

**Architecture:** Add a `public.study_progress` table with user-scoped RLS and generated database types. Add a focused `src/lib/study/progress.ts` helper for progress math and payload validation, server actions for read/unread toggles, and render read state in the existing study section navigation.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, Supabase Postgres/RLS, Supabase SSR client, Node test runner, Tailwind CSS, lucide-react.

## Global Constraints

- Persist section-level read state for authenticated approved users.
- Track progress separately for English and Traditional Chinese guide pages.
- Show a read-count summary on the study reading page.
- Let users mark individual sections read or unread from the section navigation.
- Keep progress scoped to the current user through RLS.
- Do not add time-on-page analytics, scroll-position auto tracking, event logs, admin cross-user progress views, quiz generation, or spaced repetition.
- Use TDD for helper/action logic before production code.
- Use server Supabase client for ordinary progress writes so RLS applies.
- Run `corepack pnpm test`, `corepack pnpm lint`, `corepack pnpm typecheck`, placeholder-env `corepack pnpm build`, migration verification, and production authenticated smoke check before completion.

---

### Task 1: Database Schema And Types

**Files:**
- Create: `supabase/migrations/202606210001_study_progress.sql`
- Modify: `src/lib/supabase/database.types.ts`

**Interfaces:**
- Produces table `public.study_progress`
- Produces generated type entry `Database["public"]["Tables"]["study_progress"]`

- [ ] **Step 1: Write migration**

Create `supabase/migrations/202606210001_study_progress.sql`:

```sql
create table public.study_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  domain_slug text not null,
  language text not null,
  section_id text not null,
  section_title text not null,
  is_read boolean not null default false,
  last_viewed_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_progress_language_check check (language in ('en', 'zh')),
  constraint study_progress_domain_slug_length check (char_length(domain_slug) between 1 and 120),
  constraint study_progress_section_id_length check (char_length(section_id) between 1 and 160),
  constraint study_progress_user_domain_language_section_unique unique (
    user_id,
    domain_slug,
    language,
    section_id
  )
);

create index study_progress_user_domain_language_read_idx
  on public.study_progress (user_id, domain_slug, language, is_read);

create trigger study_progress_set_updated_at before update on public.study_progress
  for each row execute function private.set_updated_at();

alter table public.study_progress enable row level security;

create policy "Users can read own study progress"
  on public.study_progress
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own study progress"
  on public.study_progress
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own study progress"
  on public.study_progress
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own study progress"
  on public.study_progress
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
```

- [ ] **Step 2: Update database types**

Use Supabase type generation if available. If CLI access is blocked, update `src/lib/supabase/database.types.ts` manually to include `study_progress` with `Row`, `Insert`, `Update`, and `Relationships` matching the migration.

- [ ] **Step 3: Verify SQL shape**

Run:

```powershell
Select-String -Path supabase\migrations\202606210001_study_progress.sql -Pattern 'study_progress|enable row level security|auth.uid|user_domain_language_section_unique'
```

Expected: migration includes table, unique constraint, indexes, RLS enablement, and four user-scoped policies.

### Task 2: Progress Helper With TDD

**Files:**
- Create: `src/lib/study/progress.test.ts`
- Create: `src/lib/study/progress.ts`
- Modify: `package.json`

**Interfaces:**
- Produces `type StudyProgressRow`
- Produces `type StudyProgressSummary = { totalSections: number; readSections: number; percentage: number }`
- Produces `buildStudyProgressState(sections, rows)`
- Produces `buildStudyProgressMutation(input)`

- [ ] **Step 1: Write failing tests**

Create `src/lib/study/progress.test.ts` with tests for:

```ts
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
    { section_id: "core-patterns", section_title: "Core Patterns", is_read: true, read_at: "2026-06-21T00:00:00.000Z" },
    { section_id: "stale-section", section_title: "Stale", is_read: true, read_at: "2026-06-21T00:00:00.000Z" },
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
```

Add `src/lib/study/progress.test.ts` to the `test` script in `package.json`.

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm test
```

Expected: FAIL because `src/lib/study/progress.ts` does not exist.

- [ ] **Step 3: Implement helper**

Create `src/lib/study/progress.ts` with:

- exported row and summary types
- `buildStudyProgressState(sections, rows)`
- `buildStudyProgressMutation(input)`

The helper must ignore stale row section ids that are not present in current `StudySection[]`.

- [ ] **Step 4: Run test to verify it passes**

Run:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm test
```

Expected: PASS with all tests green.

### Task 3: Server Actions And Study Page UI

**Files:**
- Create: `src/app/study/[domainSlug]/actions.ts`
- Modify: `src/app/study/[domainSlug]/page.tsx`

**Interfaces:**
- Consumes `buildStudyProgressState()`
- Consumes `buildStudyProgressMutation()`
- Produces server action `setSectionReadAction(formData: FormData)`

- [ ] **Step 1: Add server action**

Create `src/app/study/[domainSlug]/actions.ts`.

Action behavior:

- `requireApprovedUser()`
- read `domain_slug`, `language`, `section_id`, and `read`
- validate content via `getStudyContent(domainSlug, language)`
- if section is unknown, revalidate and return without writing
- upsert into `study_progress` with conflict target `user_id,domain_slug,language,section_id`
- use `createServerSupabaseClient()` so RLS applies
- `revalidatePath(`/study/${domainSlug}`)`

- [ ] **Step 2: Fetch progress on page**

Update `src/app/study/[domainSlug]/page.tsx`:

- keep `const profile = await requireApprovedUser()`
- after `content` exists, query `study_progress` rows for `profile.id`, `content.domain.slug`, and `content.language`
- compute progress state with `buildStudyProgressState(content.sections, rows)`

- [ ] **Step 3: Render progress UI**

Update `StudySectionNavigation`:

- add progress summary text such as `3 / 11 read`
- add a small read/unread submit button per section
- keep section link behavior unchanged
- use separate focus targets for link and button
- include hidden inputs: `domain_slug`, `language`, `section_id`, `read`

- [ ] **Step 4: Run static verification**

Run:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm test
corepack pnpm lint
corepack pnpm typecheck
```

Expected: all commands exit 0.

### Task 4: Remote Migration, Production Verification, Handoff

**Files:**
- Modify: `handoff.md`
- Modify: `docs/superpowers/HANDOFF.md`

**Interfaces:**
- Documents applied migration, verification commands, and production smoke result.

- [ ] **Step 1: Apply migration remotely**

Load `SUPABASE_ACCESS_TOKEN` from `C:\secrets\.env` without printing it. Use Supabase CLI or Management API to apply `202606210001_study_progress.sql` to project `ufqcfniaxmwwcwmrssfk`.

Expected: remote migration appears in migration list or SQL verification confirms `public.study_progress` exists with RLS enabled.

- [ ] **Step 2: Run full verification**

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

- [ ] **Step 3: Commit and push implementation**

Run:

```powershell
git add package.json supabase/migrations/202606210001_study_progress.sql src/lib/supabase/database.types.ts src/lib/study/progress.ts src/lib/study/progress.test.ts src/app/study/[domainSlug]/actions.ts src/app/study/[domainSlug]/page.tsx docs/superpowers/plans/2026-06-21-reading-progress-tracking-plan.md
git commit -m "feat: add reading progress tracking"
git push origin main
```

- [ ] **Step 4: Production authenticated smoke check**

Use `PROD_TEST_EMAIL` / `PROD_TEST_PASSWORD` from `C:\secrets\.env` without printing values:

- login through production `/auth/login`
- open `/study/agentic-architecture`
- mark one section read
- verify read count changes to include one read section
- reload and verify read count persists
- toggle the same section unread to leave the test account clean

- [ ] **Step 5: Update handoffs**

Update `handoff.md` and `docs/superpowers/HANDOFF.md` with:

- latest commit
- migration version
- local verification results
- production progress smoke check result
- remaining next work

Commit and push:

```powershell
git add handoff.md docs/superpowers/HANDOFF.md
git commit -m "docs: record reading progress verification"
git push origin main
```

