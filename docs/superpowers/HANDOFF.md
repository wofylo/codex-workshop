# CCA-F Exam Prep Full Handoff

This document is the complete handoff for Claude Code, Codex CLI, or another coding agent taking over the CCA-F exam prep app. It intentionally avoids relying on desktop plugins. Use local commands, Git, Vercel CLI/API, Supabase CLI/API, and direct HTTP checks.

The project has a working foundation, but it is still product-light. The next agent should prioritize quiz practice and scoring instead of spending more time on static reading-page polish.

## 1. Current Snapshot

### Overview

This section identifies the live project, repository, hosting, and database resources. Verify these before making changes so the next work happens against the expected repo and production environment. If this section is skipped, an agent may deploy to the wrong Vercel project or mutate the wrong Supabase project.

| Description | Value | Notes |
|---|---|---|
| Workspace | `D:\Lab\codex-workshop` | Main local checkout |
| Repo | `git@github.com:wofylo/codex-workshop.git` | Normal Git access uses SSH |
| Branch | `main` | Production branch |
| Production URL | `https://codex-workshop-two.vercel.app/` | Vercel production |
| Vercel project id | `prj_3Pb4cARgnOOI8PoMAOHgxPrsgjvi` | Use with Vercel API |
| Vercel team id | `team_lEkdAVKvWzUfDSPAQw13RsQs` | Use with Vercel API |
| Supabase project ref | `ufqcfniaxmwwcwmrssfk` | Remote DB/Auth project |
| Supabase URL | `https://ufqcfniaxmwwcwmrssfk.supabase.co` | Public project URL |
| Supabase region | `ap-northeast-1` | Asia Pacific Northeast |
| App package | `cca-f-exam-prep` | `package.json` name |

### Current Reality

The app currently supports login, approval-gated dashboard access, basic admin user management, static CCA-F guide reading, section navigation, and section-level read/unread progress. That is not enough for a useful exam prep product. The user explicitly complained that progress has been slow and not much useful functionality exists.

The next high-value feature is quiz practice:

| Priority | Work | Reason |
|---|---|---|
| 1 | Quiz practice MVP | Core exam-prep value is missing |
| 2 | Attempt scoring and review | Users need measurable practice and feedback |
| 3 | Dashboard progress summaries | Dashboard should show learning/practice state, not only static domain cards |
| 4 | CI hardening | Current CI does not run tests or production build |
| 5 | Admin production UI verification | Existing admin actions need browser-level confidence |

## 2. Communication And Secret Rules

### Overview

Use Traditional Chinese for normal user-facing communication. Keep commands, paths, env vars, package names, API names, and code identifiers in English. Never print secret values, even when debugging.

### Secrets

Secrets are stored locally at:

```text
C:\secrets\.env
```

Known keys:

| Key | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL used by browser/server code |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser-safe Supabase publishable key |
| `SUPABASE_SECRET_KEY` | Server-only Supabase key for privileged operations |
| `SUPABASE_ACCESS_TOKEN` | Supabase CLI/API token |
| `VERCEL_TOKEN` | Vercel CLI/API token |
| `PROD_TEST_EMAIL` | Approved production test account email |
| `PROD_TEST_PASSWORD` | Approved production test account password |
| `JIRA_API_TOKEN` / `JIRA_BASE_URL` / `JIRA_EMAIL` / `JIRA_DEFAULT_PROJECT_KEY` | Jira integration leftovers, not part of core app |

Load secrets into environment variables without echoing values. Do not commit `.env` files.

### GitHub Access

Git operations use SSH, not a GitHub token.

```text
C:\Users\WofyLo\.ssh\github_wofylo.pub
```

Use these commands for normal repo work:

| Description | Command | Expected Result |
|---|---|---|
| Fetch latest refs | `git fetch origin` | Remote refs update |
| Sync main | `git pull --ff-only` | Main fast-forwards or reports up to date |
| Push main | `git push origin main` | Remote main receives commits |

Only ask for `GITHUB_TOKEN` / `GH_TOKEN` if the task specifically needs GitHub API features such as Actions log API access, PR API creation, or repository administration.

## 3. Product Requirements

### Overview

This section describes the intended product direction. The current codebase is a foundation, not the finished app. Future work should be judged against whether it helps a learner prepare for the CCA-F exam.

### Existing User Stories

| User | Requirement | Current Status |
|---|---|---|
| New learner | Sign up with email/password | Implemented |
| New learner | Wait for approval before accessing content | Implemented |
| Approved learner | Log in and access dashboard | Implemented |
| Approved learner | Read English and Traditional Chinese study guides | Implemented |
| Approved learner | Jump between sections in a guide | Implemented |
| Approved learner | Mark sections read/unread | Implemented |
| Admin | Approve/reject/deactivate/restore users | Implemented basic UI |
| Admin | Toggle premium flag | Implemented basic UI |

### Missing Useful User Stories

These are the highest priority remaining product requirements.

| User | Requirement | Suggested Priority |
|---|---|---|
| Approved learner | Start a practice quiz by domain | P0 |
| Approved learner | Answer multiple-choice questions | P0 |
| Approved learner | Submit a quiz and receive score | P0 |
| Approved learner | Review correct answer and explanation | P0 |
| Approved learner | See weak domains and recent attempts | P1 |
| Approved learner | Resume an unfinished attempt | P1 |
| Admin | Manage question bank | P1/P2, after learner MVP |
| Admin | Import question bank from structured files | P1/P2 |
| Admin | See aggregate progress | P2 |

### Recommended Quiz MVP

The smallest useful quiz slice should avoid building a large admin system first. Seed a curated question set in SQL, then build learner-facing practice.

| Step | Requirement | Acceptance Criteria |
|---|---|---|
| 1 | DB schema for question bank and attempts | RLS prevents users reading/changing other users' attempts |
| 2 | Seed questions for one domain | At least 10 questions for `agentic-architecture` |
| 3 | Practice start page | Approved user can choose a domain and start a quiz |
| 4 | Attempt page | User can answer all questions in an attempt |
| 5 | Submit action | Server scores answers and finalizes attempt |
| 6 | Review page | User sees score, selected answers, correct answers, and explanations |
| 7 | Dashboard summary | Dashboard shows recent score and attempts count |

## 4. Architecture

### Overview

This is a Next.js App Router application backed by Supabase Auth/Postgres and deployed on Vercel. Server actions handle mutations. Supabase RLS is expected to enforce user boundaries at the database layer.

### Runtime Architecture

```text
Browser
  -> Next.js App Router on Vercel
      -> Server Components for protected pages
      -> Server Actions for auth/admin/study mutations
      -> Supabase SSR client for user-scoped queries
      -> Supabase admin client only for server-only privileged work
  -> Supabase Auth for sessions
  -> Supabase Postgres for profiles, audit events, study progress, future quiz data
```

### Code Architecture

| Layer | Files | Notes |
|---|---|---|
| App routes | `src/app/**` | App Router pages, route handlers, server actions |
| Auth pages/actions | `src/app/auth/**` | Signup/login/logout/error/status pages |
| Dashboard | `src/app/dashboard/page.tsx` | Protected static cockpit |
| Admin | `src/app/admin/page.tsx`, `src/app/admin/actions.ts` | Approved-admin-only user management |
| Study pages | `src/app/study/[domainSlug]/page.tsx`, `actions.ts` | Protected reading/progress pages |
| Auth domain logic | `src/lib/auth/*` | Guards, profiles, status decisions, validation |
| Study domain logic | `src/lib/study/*` | Domain metadata, markdown parser, progress helpers |
| Supabase clients | `src/lib/supabase/*` | Browser/server/admin/proxy clients and generated types |
| Admin helpers | `src/lib/admin/profiles.ts` | Admin profile query/mutation helpers |
| UI primitives | `src/components/ui/*` | shadcn-style local components |
| DB migrations | `supabase/migrations/*.sql` | Schema/RLS changes |
| Study content | `CCA-F/*.md` | English and Traditional Chinese guide files |

### Auth And Authorization Model

| Concept | Implementation |
|---|---|
| Supabase Auth user | Created by `/auth/sign-up` |
| App profile | `public.profiles`, one row per auth user |
| Approval gate | `requireApprovedUser()` redirects inactive/pending/rejected/deleted users |
| Admin gate | `requireAdminProfile()` protects `/admin` |
| Soft delete | `public.profiles.is_deleted` |
| Audit log | `public.admin_audit_events` |
| Last admin protection | DB trigger prevents losing final active approved admin |

### Study Content Model

Current guide content is file-backed, not database-backed.

| Source | Purpose |
|---|---|
| `CCA-F/01_Domain_Agentic_Architecture.md` | English domain 1 |
| `CCA-F/01_Domain_Agentic_Architecture_zh.md` | Traditional Chinese domain 1 |
| `CCA-F/02_Domain_Claude_Code.md` | English domain 2 |
| `CCA-F/02_Domain_Claude_Code_zh.md` | Traditional Chinese domain 2 |
| `CCA-F/03_Domain_Tool_Design_MCP.md` | English domain 3 |
| `CCA-F/03_Domain_Tool_Design_MCP_zh.md` | Traditional Chinese domain 3 |
| `CCA-F/04_Domain_Prompt_Engineering.md` | English domain 4 |
| `CCA-F/04_Domain_Prompt_Engineering_zh.md` | Traditional Chinese domain 4 |
| `CCA-F/05_Domain_Context_Management.md` | English domain 5 |
| `CCA-F/05_Domain_Context_Management_zh.md` | Traditional Chinese domain 5 |

`src/lib/study/content.ts` uses a fixed allowlist from `src/lib/study/dashboard.ts`. Keep this allowlist behavior to avoid arbitrary file reads.

## 5. Database State And Migrations

### Overview

Supabase is the source of truth for auth, profile state, admin audit events, and study progress. Migration handling needs care because the remote migration history does not perfectly match local filenames for older migrations.

### Local Migration Files

| File | Purpose |
|---|---|
| `supabase/migrations/202606180001_auth_core_schema.sql` | Profiles, admin audit, enums/triggers foundation |
| `supabase/migrations/20260618074937_auth_rls_policies.sql` | Auth/profile RLS policies |
| `supabase/migrations/20260618120842_optimize_rls_and_indexes.sql` | RLS/index optimization |
| `supabase/migrations/202606210001_study_progress.sql` | Section-level reading progress |

### Remote Migration History Warning

Remote Supabase has older migration versions that differ from local filenames:

```text
remote: 20260618081553 auth_core_schema
remote: 20260618081641 auth_rls_policies
remote: 20260618121127 optimize_rls_and_indexes

local:  202606180001_auth_core_schema.sql
local:  20260618074937_auth_rls_policies.sql
local:  20260618120842_optimize_rls_and_indexes.sql
```

The latest `202606210001 study_progress` migration was applied through the Supabase Management API and recorded in `supabase_migrations.schema_migrations`.

Do not blindly run:

```powershell
corepack pnpm dlx supabase@latest db push --linked
```

until migration history has been reconciled. Doing so may fail or tempt unsafe repair operations.

### Current Useful DB Tables

| Table | Purpose |
|---|---|
| `public.profiles` | App-level user profile, role, approval, premium, soft delete |
| `public.admin_audit_events` | Admin mutation audit trail |
| `public.study_progress` | Per-user/domain/language/section read state |

### Future Quiz Tables Recommendation

For quiz MVP, add tables similar to:

| Table | Purpose |
|---|---|
| `public.questions` | Question prompt, domain, difficulty, explanation, active flag |
| `public.question_options` | Multiple-choice options per question |
| `public.quiz_attempts` | User attempt header, domain, status, score, started/submitted timestamps |
| `public.quiz_answers` | Per-question user answer and correctness |

Use RLS:

| Table | RLS Rule |
|---|---|
| `questions` | Approved authenticated users can read active questions; admin can manage later |
| `question_options` | Approved authenticated users can read options for active questions |
| `quiz_attempts` | Users can read/write own attempts only |
| `quiz_answers` | Users can read/write answers for own attempts only |

## 6. CI/CD

### Overview

Current CI exists but is incomplete. It runs lint and typecheck on push/PR to `main`. It does not run tests or production build, so regressions can still reach Vercel.

### Current GitHub Actions Workflow

File:

```text
.github/workflows/ci.yml
```

Current workflow:

| Trigger | Job | Steps |
|---|---|---|
| `pull_request` to `main` | `Lint and typecheck` | checkout, setup pnpm, setup Node 22, install, lint, typecheck |
| `push` to `main` | `Lint and typecheck` | checkout, setup pnpm, setup Node 22, install, lint, typecheck |

### CI Gap

Add these before relying on CI as a deployment gate:

| Missing Check | Why It Matters |
|---|---|
| `pnpm test` | Current unit tests cover auth helpers, study parsing, progress helpers, admin helpers |
| `pnpm build` | Next.js build catches route/server/env/import problems |
| Secret-boundary scan | Reduces risk of exposing server-only secrets to browser code |
| Optional DB type freshness check | Ensures `database.types.ts` matches migrations |

### Recommended CI Commands

The following commands should be added to CI after env placeholders are set for build:

| Description | Command | Expected Result |
|---|---|---|
| Run tests | `pnpm test` | Node test suite passes |
| Run lint | `pnpm lint` | ESLint exits 0 |
| Run typecheck | `pnpm typecheck` | TypeScript exits 0 |
| Run build | `pnpm build` | Next.js build exits 0 |

For CI build, set placeholder env values unless using real preview env:

```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: https://example.supabase.co
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: placeholder
  SUPABASE_SECRET_KEY: placeholder-secret
```

## 7. Local Development

### Overview

Local development uses pnpm through Corepack. The app imports validated env vars in server code, so build/dev may fail if required Supabase vars are missing. Use local secrets or placeholders depending on whether you need real auth/database behavior.

### Commands

Run from `D:\Lab\codex-workshop`.

| Description | Command | Expected Result |
|---|---|---|
| Set Corepack cache | `$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'` | Corepack uses workspace cache |
| Install deps | `corepack pnpm install` | Dependencies installed |
| Start dev server | `corepack pnpm dev` | Next dev server starts |
| Run tests | `corepack pnpm test` | Test suite passes |
| Run lint | `corepack pnpm lint` | ESLint exits 0 |
| Run typecheck | `corepack pnpm typecheck` | TypeScript exits 0 |
| Build | `corepack pnpm build` | Next.js build exits 0 |

If using placeholders for build:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co'
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='placeholder'
$env:SUPABASE_SECRET_KEY='placeholder-secret'
$env:COREPACK_HOME='D:\Lab\codex-workshop\.corepack'
corepack pnpm build
```

If using real local/prod-connected behavior, load values from `C:\secrets\.env` without printing them.

### Package Scripts

| Script | Command | Purpose |
|---|---|---|
| `dev` | `next dev` | Local development server |
| `build` | `next build` | Production build |
| `start` | `next start` | Serve built app |
| `lint` | `eslint .` | Static linting |
| `test` | `node --test ...` | Unit tests |
| `typecheck` | `tsc --noEmit` | Type checking |
| `health:check` | `node scripts/check-health.mjs` | Health endpoint check |
| `db:types` | `supabase gen types typescript --local --schema public > src/lib/supabase/database.types.ts` | Generate local DB types |
| `db:types:check` | `git diff --exit-code -- src/lib/supabase/database.types.ts` | Ensure generated DB types are committed |

## 8. Web Deployment

### Overview

Production is hosted on Vercel. The intended production deployment path is pushing or merging to `main`, after local checks pass. Vercel builds from the repository root as a Next.js app.

### Vercel Configuration

| Setting | Value |
|---|---|
| Framework | Next.js |
| Production branch | `main` |
| Root directory | repository root |
| Install command | `pnpm install --frozen-lockfile` |
| Build command | `pnpm build` |
| Production URL | `https://codex-workshop-two.vercel.app/` |

### Required Production Environment Variables

Set these in Vercel production:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
```

Optional future vars:

```text
AI_PROVIDER
AI_BASE_URL
AI_API_KEY
AI_MODEL
EMAIL_PROVIDER
EMAIL_API_KEY
EMAIL_FROM
```

### Deploy Through Git

Use this path for normal deploys:

| Description | Command | Expected Result |
|---|---|---|
| Confirm clean branch | `git status --short --branch` | Clean `main...origin/main` or expected feature branch |
| Sync latest | `git pull --ff-only` | Local branch is current |
| Run tests | `corepack pnpm test` | Tests pass |
| Run lint | `corepack pnpm lint` | Lint passes |
| Run typecheck | `corepack pnpm typecheck` | Typecheck passes |
| Run build | `corepack pnpm build` | Production build passes |
| Commit changes | `git add ...; git commit -m "..."` | Commit created |
| Push | `git push origin main` | Vercel deployment starts |

### Deploy Through Vercel CLI

Use this when Git integration is insufficient or you need to inspect/deploy directly. Load `VERCEL_TOKEN` from `C:\secrets\.env` without printing it.

| Description | Command | Expected Result |
|---|---|---|
| Check Vercel CLI | `npx vercel --version` | Version prints |
| Inspect production | `npx vercel inspect https://codex-workshop-two.vercel.app --token $env:VERCEL_TOKEN` | Deployment metadata prints |
| Read logs | `npx vercel logs https://codex-workshop-two.vercel.app --token $env:VERCEL_TOKEN` | Runtime logs print |
| Deploy production | `npx vercel deploy --prod --token $env:VERCEL_TOKEN` | Production deployment starts |
| List env | `npx vercel env ls production --token $env:VERCEL_TOKEN` | Production env list prints |

### Vercel API Notes

The current `VERCEL_TOKEN` previously returned `forbidden` for deployment-list API calls. Route-level checks and `vercel inspect` may still work. If deployment IDs are required and the API is forbidden, use the Vercel dashboard or a token with deployment-list permission.

## 9. Database Deployment

### Overview

Database deployment is Supabase Postgres. Because of migration-history mismatch, treat DB changes as a separate, deliberate operation. Do not rely on blind `db push` until the mismatch is fixed.

### Safe DB Change Workflow

Use this workflow for a future schema change:

| Description | Command | Expected Result |
|---|---|---|
| Create migration file | `corepack pnpm dlx supabase@latest migration new quiz_practice` | New SQL file created |
| Write SQL migration | edit `supabase/migrations/<timestamp>_quiz_practice.sql` | Schema/RLS expressed as SQL |
| Reset local DB if local Supabase is available | `corepack pnpm dlx supabase@latest db reset` | Local DB rebuilds from migrations |
| Generate types | `corepack pnpm dlx supabase@latest gen types typescript --local --schema public > src/lib/supabase/database.types.ts` | Types update |
| Run tests/typecheck | `corepack pnpm test; corepack pnpm typecheck` | Code matches DB types |
| Apply remote carefully | SQL Editor or Management API until migration history is reconciled | Remote schema updated |
| Verify remote schema | SQL checks | Expected tables/policies exist |

### Supabase CLI Commands

Use `SUPABASE_ACCESS_TOKEN` from `C:\secrets\.env`.

| Description | Command | Expected Result |
|---|---|---|
| Check CLI version | `corepack pnpm dlx supabase@latest --version` | Version prints |
| List projects | `corepack pnpm dlx supabase@latest projects list` | Project list includes `ufqcfniaxmwwcwmrssfk` |
| Link project | `corepack pnpm dlx supabase@latest link --project-ref ufqcfniaxmwwcwmrssfk` | Local project linked |
| List remote migrations | `corepack pnpm dlx supabase@latest migration list --linked` | Shows remote/local mismatch |
| Lint DB | `corepack pnpm dlx supabase@latest db lint --linked` | Advisor output prints |

### Supabase Management API

Use only when CLI is blocked or insufficient. Load `SUPABASE_ACCESS_TOKEN` without printing it.

| Description | Command | Expected Result |
|---|---|---|
| Get project metadata | `Invoke-RestMethod -Headers $headers -Uri "https://api.supabase.com/v1/projects/ufqcfniaxmwwcwmrssfk"` | Project metadata returns |
| Query database | POST to `https://api.supabase.com/v1/projects/ufqcfniaxmwwcwmrssfk/database/query` | SQL result returns |

Do not print API keys returned from API endpoints. Redact output before sharing.

### Useful SQL Checks

```sql
select
  (select count(*) from auth.users) as auth_user_count,
  (select count(*) from public.profiles) as profile_count,
  (select count(*) from public.profiles where role = 'admin' and approval_status = 'approved' and is_deleted = false) as active_admin_count;
```

```sql
select version, name
from supabase_migrations.schema_migrations
order by version;
```

```sql
select
  to_regclass('public.study_progress') is not null as table_exists,
  exists (
    select 1
    from supabase_migrations.schema_migrations
    where version = '202606210001'
  ) as migration_exists,
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.study_progress'::regclass
  ) as rls_enabled,
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'study_progress'
  ) as policy_count;
```

## 10. Implemented Features

### Overview

This section records what is already present so the next agent does not rebuild it. Existing features are functional foundation pieces, but the app still lacks quiz practice.

### Foundation

| Feature | Status |
|---|---|
| Next.js App Router with TypeScript | Done |
| Tailwind CSS and shadcn-style components | Done |
| `/api/health` route | Done |
| Supabase browser/server/admin clients | Done |
| Supabase SSR proxy/session refresh | Done |
| Env validation split between browser and server | Done |

### Auth And Account Gates

| Route | Behavior |
|---|---|
| `/auth/sign-up` | Creates Supabase Auth user and `public.profiles` row |
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

`/dashboard` currently shows a static CCA-F study cockpit:

| Item | Status |
|---|---|
| Five exam domains | Done |
| Domain weights | Done |
| Difficulty labels | Done |
| Question estimates | Static only |
| Next actions | Static only |
| English/Traditional Chinese guide file references | Done |
| Admin shortcut for admins | Done |
| Reading page links | Done |

It does not yet show useful quiz/practice metrics.

### Admin User Management

Implemented admin actions:

| Action | Effect |
|---|---|
| Approve | Sets `approval_status = approved`, `approved_at`, `approved_by` |
| Reject | Sets `approval_status = rejected`, `rejected_at`, `rejected_by` |
| Deactivate | Soft-deletes with `is_deleted = true`, `deleted_at`, `deleted_by` |
| Restore | Clears soft-delete fields |
| Toggle premium | Sets `is_premium` true/false |

Mutations write `admin_audit_events`. DB trigger `private.prevent_last_active_admin_loss()` prevents removing the last active approved admin.

### Study Reading Pages

Protected pages are live at:

```text
/study/[domainSlug]
```

Implemented:

| Feature | Status |
|---|---|
| Fixed allowlist loading for local `CCA-F/*.md` guides | Done |
| English default guide rendering | Done |
| Traditional Chinese via `?lang=zh` | Done |
| `generateStaticParams()` for five domain slugs | Done |
| Approved-user guard through `requireApprovedUser()` | Done |
| Dashboard links into reading pages | Done |
| React-safe Markdown block model without `dangerouslySetInnerHTML` | Done |
| Stable anchors for `h2` and `h3` | Done |
| Desktop/mobile section navigation | Done |
| Supabase-backed section read/unread state | Done |

## 11. Verification History

### Overview

These are previously observed verification results. Re-run relevant checks after any new change. Do not claim a fresh pass unless the command was actually run in the current session.

### Local Verification

After the reading-progress slice:

| Description | Command | Result |
|---|---|---|
| Run tests | `$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'; corepack pnpm test` | `26 passed, 0 failed` |
| Run lint | `$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'; corepack pnpm lint` | exit 0 |
| Run typecheck | `$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'; corepack pnpm typecheck` | exit 0 |
| Run build | placeholder Supabase env + `corepack pnpm build` | exit 0 |

### Production Auth Verification

Completed with `PROD_TEST_EMAIL` / `PROD_TEST_PASSWORD` from `C:\secrets\.env` without printing values:

```text
login_status=303
login_location=/dashboard
dashboard_status=200
dashboard_has_welcome=True
dashboard_has_admin_verified=True
admin_status=200
admin_has_user_management=True
admin_has_admin_console=True
```

### Production Study Navigation Verification

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

### Production Reading Progress Verification

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

### Remote DB Verification

```text
table_exists=True
migration_exists=True
rls_enabled=True
policy_count=4
```

## 12. Troubleshooting

### Auth Shows `/auth/error?reason=login`

Root cause: Supabase rejected email/password.

Check:

```sql
select count(*) from auth.users;
select id, email, email_confirmed_at, created_at from auth.users order by created_at desc limit 5;
select display_name, role, approval_status, is_deleted from public.profiles order by created_at desc limit 5;
```

If there are no users, create one through `/auth/sign-up`. If the user exists but login fails, check email confirmation and Supabase Auth logs.

### Auth Shows `/auth/error?reason=signup`

Root cause: Supabase could not create the auth user.

Check:

| Check | Expected |
|---|---|
| Email/password signup | Enabled |
| Password policy | Password meets policy |
| Duplicate account | Email not already registered |
| Supabase Auth logs | Specific failure visible |

### Auth Shows `/auth/error?reason=profile`

Root cause: auth user was created, but server-only profile insert failed.

Check:

| Check | Expected |
|---|---|
| Vercel `SUPABASE_SECRET_KEY` | Present in production |
| Secret key type | Server-only Supabase secret/service key, not publishable key |
| `src/lib/supabase/admin.ts` | Remains server-only |
| `public.profiles` row | Exists for auth user |

### `/dashboard` Redirects To Pending

Expected when the profile exists but is not approved.

Promote first admin:

```sql
update public.profiles
set
  role = 'admin',
  approval_status = 'approved',
  approved_at = now(),
  approved_by = id
where display_name_normalized = lower('YOUR DISPLAY NAME');
```

### `/admin` 404s

Expected for approved non-admin users. Set the intended profile `role = 'admin'`.

## 13. Next Implementation Plan

### Overview

The next implementation should deliver user-visible exam practice. Keep the slice small and vertical: DB schema, a few questions, start quiz, answer, submit, review. Avoid building a broad CMS before learners can practice.

### Suggested Slice: Quiz Practice MVP

| Step | Work | Files Likely Touched |
|---|---|---|
| 1 | Create quiz schema migration | `supabase/migrations/*_quiz_practice.sql` |
| 2 | Update DB types | `src/lib/supabase/database.types.ts` |
| 3 | Add quiz domain helpers/tests | `src/lib/quiz/*` |
| 4 | Add practice start route | `src/app/practice/page.tsx` |
| 5 | Add attempt route/actions | `src/app/practice/[attemptId]/page.tsx`, `actions.ts` |
| 6 | Add result/review route | `src/app/practice/[attemptId]/review/page.tsx` |
| 7 | Add dashboard summary | `src/app/dashboard/page.tsx`, helper tests |
| 8 | Harden CI | `.github/workflows/ci.yml` |

### Suggested Schema Shape

Use this as a starting point, not final SQL:

```sql
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  domain_slug text not null,
  prompt text not null,
  explanation text not null,
  difficulty text not null default 'medium',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.question_options (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  option_label text not null,
  option_text text not null,
  is_correct boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  domain_slug text not null,
  status text not null default 'in_progress',
  score integer,
  total_questions integer not null default 0,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id),
  selected_option_id uuid references public.question_options(id),
  is_correct boolean,
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);
```

### Acceptance Criteria

| Requirement | Verification |
|---|---|
| Approved user can start quiz | Production/local authenticated route returns 200 |
| User can answer and submit | Attempt status changes to submitted |
| Score is correct | Unit tests cover scoring helper |
| User can review explanations | Review page includes prompt, selected answer, correct answer, explanation |
| Users cannot see others' attempts | RLS test or SQL/manual check |
| Dashboard shows attempt summary | Dashboard page includes recent attempt data |
| CI runs full checks | GitHub Actions includes test/lint/typecheck/build |

## 14. Final Notes

Do not lose time expanding the current handoff or polishing static guide UI unless the user asks. The product needs quiz practice. The safest path is a small vertical MVP with real DB persistence, server-side scoring, RLS, tests, and production smoke verification.
