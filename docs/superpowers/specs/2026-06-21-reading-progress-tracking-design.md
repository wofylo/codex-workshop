# Reading Progress Tracking Design

## Purpose

Add Supabase-backed reading progress tracking to the protected CCA-F study reading pages. The first version should let approved users track which sections they have read per domain and language, keep that state across devices, and prepare the app for later dashboard progress summaries and quiz recommendations.

## Scope

This slice covers:

- Persist section-level read state for authenticated approved users.
- Track progress separately for English and Traditional Chinese guide pages.
- Show a read-count summary on the study reading page.
- Let users mark individual sections read or unread from the section navigation.
- Keep progress scoped to the current user through RLS.
- Add tests for progress math, payload validation, and server-action mutation shaping.
- Apply and verify a Supabase migration remotely before production verification.

This slice does not cover:

- Time-on-page analytics.
- Scroll-position auto tracking.
- Event logs or historical analytics.
- Admin views into other users' progress.
- Quiz generation, quiz recommendations, or spaced repetition.
- Backfilling progress for users before they interact with the new UI.

## Recommended Approach

Use a dedicated `public.study_progress` table keyed by user, domain slug, language, and section id. This is more useful than domain-only progress because the reading page already has stable section anchors, and it is simpler than an event-log model because the product only needs current read state in this slice.

## Data Model

Create a new migration under `supabase/migrations/`.

Table: `public.study_progress`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid primary key default gen_random_uuid()` | Stable row id for future references |
| `user_id` | `uuid not null references public.profiles(id) on delete cascade` | Owner profile; must match `auth.uid()` under RLS |
| `domain_slug` | `text not null` | Uses app route slugs such as `agentic-architecture` |
| `language` | `text not null` | Check constraint: `en` or `zh` |
| `section_id` | `text not null` | The stable heading anchor from `StudySection.id` |
| `section_title` | `text not null` | Snapshot of the rendered heading title for readable rows |
| `is_read` | `boolean not null default false` | Current read state |
| `last_viewed_at` | `timestamptz` | Reserved for explicit user navigation or later continue-reading behavior |
| `read_at` | `timestamptz` | Set when marking read; cleared when marking unread |
| `created_at` | `timestamptz not null default now()` | Row creation time |
| `updated_at` | `timestamptz not null default now()` | Maintained by existing `private.set_updated_at()` trigger |

Constraints and indexes:

- `unique (user_id, domain_slug, language, section_id)`
- `check (language in ('en', 'zh'))`
- `check (char_length(domain_slug) between 1 and 120)`
- `check (char_length(section_id) between 1 and 160)`
- index on `(user_id, domain_slug, language, is_read)`
- trigger using `private.set_updated_at()`

The table deliberately stores route slugs instead of joining to `study_domains` because the current reading-page metadata is file-backed and its slugs differ from the seeded database `study_domains.slug` values.

## RLS

Enable RLS on `public.study_progress`.

Policies:

- Users can `select` rows where `user_id = auth.uid()`.
- Users can `insert` rows where `user_id = auth.uid()`.
- Users can `update` rows where `user_id = auth.uid()` and the new row still has `user_id = auth.uid()`.
- Users can `delete` rows where `user_id = auth.uid()`.

Admins do not receive cross-user read access in v1. That keeps the privacy boundary simple and avoids designing reporting semantics before the product needs them.

## Server Architecture

Add a focused progress helper module, likely `src/lib/study/progress.ts`.

Responsibilities:

- Validate `domainSlug`, `language`, and `sectionId` against current fixed study content.
- Convert raw rows into a section progress map.
- Compute read-count summary:
  - `totalSections`
  - `readSections`
  - `percentage`
- Build upsert payloads for mark-read / mark-unread operations.

Add server actions near the study route, likely `src/app/study/[domainSlug]/actions.ts`.

Actions:

- `setSectionReadAction(formData)`
  - requires approved user
  - validates domain/language/section against `getStudyContent()`
  - upserts the row for the current user
  - sets `is_read=true` and `read_at=now()` when marking read
  - sets `is_read=false` and `read_at=null` when marking unread
  - calls `revalidatePath("/study/[domainSlug]")` for the concrete path

The action should use the server Supabase client so RLS applies under the logged-in user. It should not use the admin Supabase client for ordinary progress writes.

## UI Design

Keep the reading page dense and functional.

Desktop:

- Add a compact progress summary in the existing sidebar, near section navigation.
- Display text such as `3 / 11 read` and a subtle progress bar.
- Each section navigation row shows a small read/unread control.
- Read sections use a check icon and muted styling; unread sections stay normal.

Mobile:

- The existing mobile sections panel also shows `3 / 11 read`.
- Each section row includes the same mark-read control.

Interaction:

- Clicking the section text still jumps to the heading.
- Clicking the read control submits the server action.
- For v1, no optimistic client state is required; the server-rendered page refresh after action is acceptable.

Accessibility:

- The read control has an explicit label such as `Mark Core Patterns as read` or `Mark Core Patterns as unread`.
- The section link and read control are separate focus targets.
- The progress summary is visible text, not only a progress bar.

## Data Flow

1. Study page calls `requireApprovedUser()`.
2. Study page loads `getStudyContent(domainSlug, language)`.
3. Study page fetches current user's `study_progress` rows for that domain and language.
4. Helper computes `progressBySectionId` and summary counts.
5. Page renders section navigation with read state and forms for toggling read/unread.
6. Server action validates the submitted section against current content, upserts the progress row, and revalidates the route.

## Error Handling

- Unknown domain continues to call `notFound()`.
- Unknown section id in a server action returns a safe failure path by revalidating/redirecting back to the study page without writing a row.
- Invalid language defaults to English on page load; action payloads must accept only `en` or `zh`.
- Database errors should not expose raw details to the user. For v1, redirecting back to the page without mutation is acceptable, but server logs should retain the thrown error in development.

## Testing

Unit tests:

- Progress summary returns `0 / N` when no rows exist.
- Progress summary counts only current content sections.
- Extra stale rows do not inflate the progress count.
- Upsert payload validation rejects unknown sections.
- Mark-read payload sets `is_read=true` and `read_at`.
- Mark-unread payload sets `is_read=false` and clears `read_at`.

Integration / verification:

- Supabase migration applies remotely.
- Generated database types are refreshed if the project convention requires it after schema changes.
- `corepack pnpm test`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- placeholder-env `corepack pnpm build`
- Production authenticated check using `PROD_TEST_EMAIL` / `PROD_TEST_PASSWORD`:
  - open `/study/agentic-architecture`
  - mark one section read
  - verify progress count changes
  - reload page and verify progress persists
  - toggle it unread to leave the test account clean

## Acceptance Criteria

- Approved users can mark individual reading sections read/unread.
- Progress is stored in Supabase and survives page reload.
- Progress is scoped per user, domain slug, and language.
- English and Traditional Chinese progress are independent.
- The study page shows read-count progress for the current guide.
- Existing auth guards, language toggle, and section navigation continue to work.
- Tests, lint, typecheck, build, migration verification, and production authenticated smoke check pass.

