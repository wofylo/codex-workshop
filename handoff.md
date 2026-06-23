# CCA-F Exam Prep Handoff

This is the short resume file for continuing the CCA-F exam prep app later from `D:\Lab\codex-workshop`. Use Traditional Chinese for general communication, keep commands and identifiers in English, and do not print secret values.

For the full CLI handoff, see `docs/superpowers/HANDOFF.md`.

## Current State

### Snapshot

The repository is on `main` and was clean when this handoff was written. The latest completed feature before this root handoff refresh is `5c14a70 feat: add reading progress tracking`.

Key endpoints and resources:

| Description | Value | Notes |
|---|---|---|
| Workspace | `D:\Lab\codex-workshop` | Main working directory |
| Repo | `git@github.com:wofylo/codex-workshop.git` | Normal Git operations use SSH |
| Branch | `main` | Currently synced with `origin/main` |
| Production URL | `https://codex-workshop-two.vercel.app/` | Vercel production |
| Supabase project ref | `ufqcfniaxmwwcwmrssfk` | Region `ap-northeast-1` |
| Vercel project id | `prj_3Pb4cARgnOOI8PoMAOHgxPrsgjvi` | Team `team_lEkdAVKvWzUfDSPAQw13RsQs` |

### Secrets

Secrets are stored locally at `C:\secrets\.env`. Do not print values. Known keys include:

| Key | Use |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public Supabase browser/server key |
| `SUPABASE_SECRET_KEY` | Server-only app secret key |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI / Management API |
| `VERCEL_TOKEN` | Vercel CLI / REST API |
| `PROD_TEST_EMAIL` / `PROD_TEST_PASSWORD` | Production approved test account for authenticated checks |

GitHub access uses SSH through `C:\Users\WofyLo\.ssh\github_wofylo.pub`; do not ask for a GitHub token for normal `git fetch`, `git pull`, or `git push`.

## Implemented

### Auth And Account Gates

The auth gate is live with sign-up, login, account status pages, protected dashboard, and admin guard.

Implemented routes:

| Route | Behavior |
|---|---|
| `/auth/sign-up` | Creates Supabase Auth user and server-side `public.profiles` row |
| `/auth/login` | Email/password login |
| `/auth/pending` | Pending approval state |
| `/auth/rejected` | Rejected account state |
| `/auth/deactivated` | Soft-deleted account state |
| `/auth/verify-email` | Email confirmation required state |
| `/auth/error?reason=...` | Reason-aware auth error copy |
| `/dashboard` | Requires authenticated approved non-deleted profile |
| `/admin` | Requires approved admin profile |

The first production account has profile display name `wofy`, is email-confirmed, and is `admin` / `approved`.

### Dashboard

`/dashboard` shows a static CCA-F study cockpit with five exam domains, domain weights, difficulty, question estimates, next actions, bilingual guide file references, an admin shortcut for approved admins, and reading-page links.

Important files:

| Description | Path |
|---|---|
| Dashboard page | `src/app/dashboard/page.tsx` |
| Study domain metadata | `src/lib/study/dashboard.ts` |
| Study dashboard tests | `src/lib/study/dashboard.test.ts` |

### Admin User Management

`/admin` includes user management v1. It lists profiles with auth email and email confirmation state, shows summary counts, and provides server actions for approval and account flags.

Implemented admin actions:

| Action | Effect |
|---|---|
| Approve | Sets `approval_status = approved`, `approved_at`, and `approved_by` |
| Reject | Sets `approval_status = rejected`, `rejected_at`, and `rejected_by` |
| Deactivate | Soft-deletes by setting `is_deleted = true`, `deleted_at`, and `deleted_by` |
| Restore | Clears soft-delete fields |
| Toggle premium | Sets `is_premium` true or false |

Important files:

| Description | Path |
|---|---|
| Admin page | `src/app/admin/page.tsx` |
| Admin server actions | `src/app/admin/actions.ts` |
| Admin profile helpers | `src/lib/admin/profiles.ts` |
| Admin helper tests | `src/lib/admin/profiles.test.ts` |

Mutations write `admin_audit_events`. The database trigger `private.prevent_last_active_admin_loss()` prevents removing the last active approved admin.

### Study Reading Pages

Protected reading pages are live at `/study/[domainSlug]`.

Implemented behavior:

| Feature | Status |
|---|---|
| Fixed allowlist loading for local `CCA-F/*.md` guides | Done |
| English default guide rendering | Done |
| Traditional Chinese via `?lang=zh` | Done |
| `generateStaticParams()` for five domain slugs | Done |
| Approved-user guard through `requireApprovedUser()` | Done |
| Dashboard links into reading pages | Done |
| React-safe Markdown block model without `dangerouslySetInnerHTML` | Done |

Important files:

| Description | Path |
|---|---|
| Study content loader | `src/lib/study/content.ts` |
| Study content tests | `src/lib/study/content.test.ts` |
| Study reading page | `src/app/study/[domainSlug]/page.tsx` |

### Study Section Navigation

Study pages include in-page section navigation.

Implemented behavior:

| Feature | Status |
|---|---|
| Stable anchors for Markdown `h2` and `h3` headings | Done |
| Duplicate heading suffixes such as `overview-2` | Done |
| Traditional Chinese heading anchors | Done |
| `StudyContent.sections` for page rendering | Done |
| Desktop sidebar section navigation | Done |
| Mobile section navigation above the article | Done |
| Section links match rendered heading `id` attributes | Verified in production |

### Reading Progress Tracking

Study pages include Supabase-backed section-level progress tracking.

Implemented behavior:

| Feature | Status |
|---|---|
| Remote migration `202606210001 study_progress` | Applied |
| `public.study_progress` table | Done |
| User-scoped RLS policies | Done, 4 policies verified |
| Per-user/domain/language/section read state | Done |
| Read-count summary on study pages | Done |
| Mark read/unread controls in section navigation | Done |
| Production persistence smoke check | Verified |

## Verification

### Local Verification

Fresh verification after the reading progress slice:

| Description | Command | Result |
|---|---|---|
| Run tests | `$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'; corepack pnpm test` | `26 passed, 0 failed` |
| Run lint | `$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'; corepack pnpm lint` | exit 0 |
| Run typecheck | `$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'; corepack pnpm typecheck` | exit 0 |
| Run production build | placeholder Supabase env + `corepack pnpm build` | exit 0, includes `/study/[domainSlug]` |

### Production Verification

Unauthenticated route check:

```text
GET https://codex-workshop-two.vercel.app/study/agentic-architecture
status=307
location=/auth/login
```

Authenticated section-navigation verification completed on 2026-06-20 using `PROD_TEST_EMAIL` / `PROD_TEST_PASSWORD` from `C:\secrets\.env` without printing secret values:

```text
login_status=303
login_location=/dashboard
dashboard_status=200
dashboard_has_welcome=True
study_en_status=200
study_en_title_present=True
study_en_has_sections_nav=True
study_en_section_link_count=11
study_en_missing_matching_ids=0
study_en_has_language_toggle_to_zh=True
study_zh_status=200
study_zh_title_present=True
study_zh_has_sections_nav=True
study_zh_section_link_count=11
study_zh_missing_matching_ids=0
study_zh_has_language_toggle_to_en=True
```

Remote migration verification completed on 2026-06-21:

```text
table_exists=True
migration_exists=True
rls_enabled=True
policy_count=4
```

Authenticated reading-progress verification completed on 2026-06-21 using `PROD_TEST_EMAIL` / `PROD_TEST_PASSWORD` from `C:\secrets\.env` without printing secret values:

```text
login_status=303
target_section_id=weight-27-hardest-domain-16-questions
before_unique_read_count=0
mark_read_status=200
after_unique_read_count=1
reload_unique_read_count=1
cleanup_status=200
after_cleanup_unique_read_count=0
read_incremented=True
persisted_after_reload=True
cleanup_restored=True
```

Vercel deployment-list API verification was not available with the current token scope; it returned `forbidden`. Use route checks, Vercel dashboard, or a token with deployment-list permission when deployment IDs are required.

## Recent Commits

```text
5c14a707 feat: add reading progress tracking
6dff14d7 docs: plan reading progress tracking
76078f29 docs: design reading progress tracking
39b9d241 docs: record production section nav verification
0319dc40 docs: refresh section navigation handoff
4c553796 feat: add study section navigation
0400a10f docs: design study section navigation
aa70f809 docs: refresh CLI handoff
9e5ecebf feat: add study reading pages
```

## Next Work

Recommended next slices:

| Priority | Work | Notes |
|---|---|---|
| 1 | Quiz practice | Requires question model, answer flow, scoring, and review behavior |
| 2 | Dashboard progress summaries | Use `study_progress` to show domain-level progress on `/dashboard` |
| 3 | Production admin UI verification | Verify approve/reject/deactivate/restore/premium actions through browser UI if not already covered manually |

## Operational Notes

Use Vercel CLI/API and Supabase CLI/API, not desktop plugins. Load tokens from `C:\secrets\.env` without printing values.

Before any new code changes:

| Description | Command | Expected Result |
|---|---|---|
| Confirm clean repo | `git status --short --branch` | `main...origin/main`, no changes |
| Sync latest | `git pull --ff-only` | Already up to date or fast-forward |
| Re-run checks after edits | `corepack pnpm test; corepack pnpm lint; corepack pnpm typecheck` | All pass |
| Build before completion | placeholder Supabase env + `corepack pnpm build` | Next.js build exits 0 |

Do not expose secret values in terminal output or documentation.
