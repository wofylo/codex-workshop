# CCA-F Exam Prep Handoff

This is the short handoff for another coding agent picking up the CCA-F exam prep app from `D:\Lab\codex-workshop`. The full operational handoff is `docs/superpowers/HANDOFF.md`.

Use Traditional Chinese for user-facing conversation. Keep commands, file paths, env vars, package names, and code identifiers in English. Do not print secret values.

## Current Reality

The project is deployed and has a working auth/admin/study-reading foundation, but it is not yet a useful exam-prep product. The main missing product value is quiz practice: questions, answer flow, scoring, review, and progress summaries. Do not spend more time polishing the current static reading pages unless it directly supports quiz practice.

| Item | Value |
|---|---|
| Workspace | `D:\Lab\codex-workshop` |
| Repo | `git@github.com:wofylo/codex-workshop.git` |
| Branch | `main` |
| Production URL | `https://codex-workshop-two.vercel.app/` |
| Supabase project ref | `ufqcfniaxmwwcwmrssfk` |
| Supabase URL | `https://ufqcfniaxmwwcwmrssfk.supabase.co` |
| Supabase region | `ap-northeast-1` |
| Vercel project id | `prj_3Pb4cARgnOOI8PoMAOHgxPrsgjvi` |
| Vercel team id | `team_lEkdAVKvWzUfDSPAQw13RsQs` |

Latest known relevant commits:

```text
2889eb17 docs: record reading progress verification
5c14a707 feat: add reading progress tracking
6dff14d7 docs: plan reading progress tracking
76078f29 docs: design reading progress tracking
```

## Secrets

Secrets are local only at:

```text
C:\secrets\.env
```

Known keys:

| Key | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser/server Supabase URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase key |
| `SUPABASE_SECRET_KEY` | Server-only Supabase key |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI/API |
| `VERCEL_TOKEN` | Vercel CLI/API |
| `PROD_TEST_EMAIL` / `PROD_TEST_PASSWORD` | Production approved test account |

GitHub normal git access uses SSH, not a GitHub token:

```text
C:\Users\WofyLo\.ssh\github_wofylo.pub
```

## Implemented

| Area | Status |
|---|---|
| Next.js app foundation | Done, App Router, TypeScript, Tailwind, shadcn-style components |
| CI | Partial, GitHub Actions runs `pnpm lint` and `pnpm typecheck` only |
| Vercel production deploy | Done through Git integration / Vercel project |
| Supabase schema | Done for auth/profile/admin/progress foundation |
| Auth pages | Done: sign up, login, pending, rejected, deactivated, verify-email, reason-aware error |
| Approval gate | Done: `/dashboard` requires approved active profile |
| Admin UI | Basic user management only |
| Study dashboard | Static five-domain cockpit only |
| Study reading pages | Protected markdown reading pages with English/Traditional Chinese guides |
| Section navigation | Done for `h2`/`h3` headings |
| Reading progress | Basic section read/unread persistence |

## Not Yet Useful Enough

The project needs exam-practice functionality before it is meaningfully useful.

Recommended next priority:

| Priority | Work | Why |
|---|---|---|
| 1 | Quiz practice MVP | This is the core value missing from the product |
| 2 | Attempt scoring and review | Makes practice measurable and repeatable |
| 3 | Dashboard progress summaries | Surface useful progress beyond reading completion |
| 4 | CI hardening | Add tests/build to CI so deploys are safer |
| 5 | Admin production UI verification | Existing admin mutations need browser-level verification |

## Important Architecture

| Layer | Files |
|---|---|
| Routes | `src/app/**` |
| Auth guards | `src/lib/auth/guards.ts`, `src/lib/auth/profiles.ts`, `src/lib/auth/account-status.ts` |
| Supabase clients | `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts` |
| Study domain metadata | `src/lib/study/dashboard.ts` |
| Study markdown loader | `src/lib/study/content.ts` |
| Study progress helper | `src/lib/study/progress.ts` |
| Admin helpers | `src/lib/admin/profiles.ts` |
| UI primitives | `src/components/ui/*` |
| DB migrations | `supabase/migrations/*.sql` |
| Study source content | `CCA-F/*.md` |

## Deploy Web

Production is Vercel. The intended deployment path is push/merge to `main`; Vercel builds the Next.js app from the repo root.

| Description | Command | Expected Result |
|---|---|---|
| Check repo state | `git status --short --branch` | Clean `main...origin/main` |
| Run local checks | `corepack pnpm test; corepack pnpm lint; corepack pnpm typecheck` | All pass |
| Build locally | `corepack pnpm build` with required env vars | Next.js build exits 0 |
| Push to production branch | `git push origin main` | Vercel production deploy starts |
| Inspect deploy | `npx vercel inspect https://codex-workshop-two.vercel.app --token $env:VERCEL_TOKEN` | Shows deployment metadata |

Production Vercel env must include:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
```

## Deploy DB

Database migrations live in `supabase/migrations`.

Important warning: remote Supabase migration history currently has older versions that do not match the local migration filenames:

```text
remote: 20260618081553, 20260618081641, 20260618121127
local:  202606180001,   20260618074937, 20260618120842
```

Because of that, do not blindly run `supabase db push --linked` until migration history is reconciled. The latest progress migration `202606210001 study_progress` was applied manually through the Supabase Management API and recorded in migration history.

For future schema changes, safest options are:

| Option | Use When | Notes |
|---|---|---|
| Supabase SQL Editor | One-off manual change | Also record exactly what was applied |
| Supabase Management API database query endpoint | Agent-driven one-off change | Do not print secrets |
| Reconcile migration history first, then CLI | Long-term preferred | Requires careful repair plan |

## Verification Already Done

Local after reading-progress slice:

```text
corepack pnpm test      -> 26 passed, 0 failed
corepack pnpm lint      -> exit 0
corepack pnpm typecheck -> exit 0
corepack pnpm build     -> exit 0
```

Remote DB:

```text
table_exists=True
migration_exists=True
rls_enabled=True
policy_count=4
```

Production reading-progress smoke:

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

## Next Agent Recommendation

Implement quiz practice MVP next. Suggested first slice:

1. Add `questions`, `question_options`, `quiz_attempts`, and `quiz_answers` schema with RLS.
2. Seed a small curated question set for one high-weight domain first.
3. Build `/practice` domain/session selection.
4. Build `/practice/[attemptId]` answer flow.
5. Build result/review screen.
6. Show practice stats on `/dashboard`.
7. Update CI to run `pnpm test` and `pnpm build`, not only lint/typecheck.

Full details are in `docs/superpowers/HANDOFF.md`.
