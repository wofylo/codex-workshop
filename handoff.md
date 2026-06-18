# CCA-F Exam Prep Handoff

This is the short resume file for continuing the CCA-F exam prep app later from `D:\Lab\codex-workshop`. Use Traditional Chinese for general communication, keep commands and identifiers in English, and do not print secret values.

## Current State

### Snapshot

The repository is on `main` and was clean when this handoff was written. The latest local and pushed commit is `be7be9c0 feat: add admin user management`. Production health was checked on 2026-06-18 23:34 +08:00 and returned `{"ok":true,"service":"cca-f-exam-prep"}`.

Key endpoints and resources:

| Description | Value | Notes |
|---|---|---|
| Workspace | `D:\Lab\codex-workshop` | Main working directory |
| Repo | `git@github.com:wofylo/codex-workshop.git` | Normal Git operations use SSH |
| Branch | `main` | Push directly only when requested |
| Production URL | `https://codex-workshop-two.vercel.app/` | Vercel production |
| Supabase project ref | `ufqcfniaxmwwcwmrssfk` | Region `ap-northeast-1` |
| Vercel project id | `prj_3Pb4cARgnOOI8PoMAOHgxPrsgjvi` | Team `team_lEkdAVKvWzUfDSPAQw13RsQs` |

### Secrets

Secrets are stored locally at `C:\secrets\.env`. Do not print values. Available keys include `VERCEL_TOKEN`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_SECRET_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

GitHub access uses SSH through `C:\Users\WofyLo\.ssh\github_wofylo.pub`; do not ask for a GitHub token for normal `git fetch`, `git pull`, or `git push`.

## Implemented

### Auth And First Admin

The auth gate is live with sign-up, login, account status pages, protected dashboard, and admin guard. The first production account exists, is email-confirmed, and has profile display name `wofy` with `role = admin`, `approval_status = approved`, and `is_deleted = false`.

Current known production auth state:

| Metric | Current value |
|---|---:|
| `auth.users` | 1 |
| `public.profiles` | 1 |
| active approved admins | 1 |

The earlier login failure was caused by the auth user not being email-confirmed. It was fixed with the Supabase Admin API by setting `email_confirm=true`.

### Dashboard

`/dashboard` is no longer empty. It now shows a static CCA-F study cockpit with five exam domains, domain weights, difficulty, question estimates, next actions, bilingual guide file references, and an admin shortcut for approved admins.

The static dashboard data lives in:

| Description | Path |
|---|---|
| Dashboard page | `src/app/dashboard/page.tsx` |
| Study dashboard metadata | `src/lib/study/dashboard.ts` |
| Study dashboard tests | `src/lib/study/dashboard.test.ts` |

### Admin User Management

`/admin` now includes user management v1. It lists profiles with auth email and email confirmation state, shows summary counts, and provides server actions for approval and account flags.

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

## Verification

### Commands Already Run

The latest implementation was verified with the full local check suite before commit and push.

| Description | Command | Expected Result |
|---|---|---|
| Run tests | `$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'; corepack pnpm test` | 16 tests pass |
| Run lint | `$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'; corepack pnpm lint` | ESLint exits 0 |
| Run typecheck | `$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'; corepack pnpm typecheck` | TypeScript exits 0 |
| Run production build | `$env:NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co'; $env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='placeholder'; $env:SUPABASE_SECRET_KEY='placeholder-secret'; $env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'; corepack pnpm build` | Next.js build exits 0 |
| Check production health | `Invoke-WebRequest -Uri 'https://codex-workshop-two.vercel.app/api/health' -UseBasicParsing` | HTTP 200 with health JSON |

### Local Dev Server

A local dev server was started during the session with secrets loaded from `C:\secrets\.env`. It responded at `http://127.0.0.1:3000` with HTTP 200. Dev server logs are ignored by `.gitignore` via `dev-server*.log`.

## Next Work

### Immediate Production Verification

After Vercel finishes deploying `be7be9c0`, verify the new protected pages in production with the first admin account.

| Description | URL | Expected Result |
|---|---|---|
| Sign in | `https://codex-workshop-two.vercel.app/auth/login` | Login succeeds with the first admin account |
| Check dashboard | `https://codex-workshop-two.vercel.app/dashboard` | Static CCA-F study cockpit appears |
| Check admin console | `https://codex-workshop-two.vercel.app/admin` | User management console appears |

If `/dashboard` or `/admin` still shows old content, wait for Vercel deployment to finish or inspect the deployment.

### Recommended Next Slice

Build domain and section reading pages next. The database already has `study_domains` and `study_sections`, and local markdown guides exist under `CCA-F/`.

Suggested scope:

| Feature | Notes |
|---|---|
| `/study` | Domain list using existing metadata |
| `/study/[domain]` | Domain overview with guide links or rendered markdown |
| Markdown rendering | Start read-only from local `CCA-F/*.md`; avoid progress schema until reading UX is stable |
| Dashboard links | Link each dashboard domain card to its study page |

### Later Slices

After reading pages, build progress tracking and quiz workflows. Those will require schema/RLS review, tests, and production verification.

## Operational Notes

Use Vercel CLI/API and Supabase CLI/API, not desktop plugins. Load tokens from `C:\secrets\.env` without printing values. If Vercel deployment list returns forbidden with the current token, rely on health checks and Vercel dashboard/manual verification unless API access is fixed.

Before any new code changes:

| Description | Command | Expected Result |
|---|---|---|
| Confirm clean repo | `git status --short --branch` | `main...origin/main`, no changes |
| Sync latest | `git pull --ff-only` | Already up to date or fast-forward |
| Re-run checks after edits | `corepack pnpm test; corepack pnpm lint; corepack pnpm typecheck` | All pass |

Do not expose secret values in terminal output or documentation.
