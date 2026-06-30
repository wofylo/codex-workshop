# Architecture — CCA-F Exam Prep

## Overview

A Next.js 15 App Router application for CCA-F exam preparation. Users study domain guides, take practice quizzes, and submit bug reports. Admins manage questions, review bug reports, and approve user accounts.

**Production URL:** https://codex-workshop-two.vercel.app  
**Repo:** `git@github.com:wofylo/codex-workshop.git`

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          Developer                              │
│                                                                 │
│   git push origin main                                          │
└───────────────┬─────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         GitHub                                  │
│                                                                 │
│   ┌─────────────────────┐   ┌──────────────────────────────┐   │
│   │   ci.yml            │   │   migrate.yml                │   │
│   │   (push + PR)       │   │   (push, migrations/** only) │   │
│   │                     │   │                              │   │
│   │  pnpm test          │   │  supabase db push --linked   │   │
│   │  pnpm lint          │   │                              │   │
│   │  pnpm typecheck     │   └──────────────┬───────────────┘   │
│   │  pnpm build         │                  │                   │
│   └─────────────────────┘                  │                   │
│                                            │                   │
│   ──────────────────── on merge to main ───┼──────────────►    │
│                                            │                   │
└────────────────────────────────────────────┼───────────────────┘
                                             │
              ┌──────────────────────────────┘
              │
    ┌─────────▼──────────┐          ┌─────────────────────────┐
    │      Supabase       │          │         Vercel           │
    │   (ap-northeast-1)  │          │                         │
    │                     │◄────────►│  Next.js 15 App Router  │
    │  PostgreSQL          │  SSR     │  (Node.js runtime)      │
    │  Auth (GoTrue)       │  queries │                         │
    │  Storage             │          │  Auto-deploy on push    │
    │  Row Level Security  │          │  to main via GitHub     │
    └─────────────────────┘          │  integration            │
                                     └─────────────────────────┘
                                               ▲
                                               │ HTTPS
                                               │
                                     ┌─────────┴──────────┐
                                     │      Browser        │
                                     └─────────────────────┘
```

---

## CI/CD Flow

### ci.yml — Quality Gate

**Triggers:** every push to `main`; every PR targeting `main`

```
push / PR
    │
    ├── pnpm install --frozen-lockfile
    ├── pnpm test          (node:test, unit tests)
    ├── pnpm lint          (ESLint)
    ├── pnpm typecheck     (tsc --noEmit)
    └── pnpm build         (Next.js build with placeholder env vars)
```

Build uses placeholder Supabase values so the CI never touches production data.

### migrate.yml — Database Migrations

**Triggers:** push to `main` when `supabase/migrations/**` changes

```
push (migrations changed)
    │
    ├── supabase/setup-cli@v1
    ├── supabase link --project-ref ufqcfniaxmwwcwmrssfk
    └── supabase db push --linked
            │
            └── applies new local migration files not yet in
                supabase_migrations.schema_migrations on prod DB
```

**Secret required:** `SUPABASE_ACCESS_TOKEN` (set as GitHub Actions repo secret).

### Vercel Deployment

Vercel is connected to the GitHub repo via the GitHub integration. Every push to `main` that passes CI triggers an automatic production deployment. No separate deploy step in GitHub Actions.

```
push to main → Vercel detects → runs next build → deploys
```

Environment variables (set in Vercel project settings):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `BUG_API_KEY`

---

## Application Architecture

### Framework

- **Next.js 15** with App Router
- **TypeScript** throughout
- **Tailwind CSS** + shadcn/ui components
- **pnpm** (managed via corepack)

### Rendering Model

All pages are **React Server Components** by default. Data fetching happens server-side via `createServerSupabaseClient()`. Client Components (`"use client"`) are used only for interactive UI (forms with optimistic state, file upload widgets).

Server Actions (`"use server"`) handle all mutations — no separate API layer except the single `GET /api/bugs` REST endpoint for external integrations.

### Route Map

```
/                          Landing page (public)
/auth/login                Email/password login
/auth/sign-up              Account registration
/auth/verify-email         Post-signup email confirmation gate
/auth/pending              Awaiting admin approval
/auth/rejected             Account rejected
/auth/deactivated          Account deactivated
/auth/error                Auth error fallback

/dashboard                 Approved user home — study domains, quiz history
/study/[domainSlug]        Study guide reader (markdown, progress tracking)
/practice                  Quiz launcher — domain select or mock exam
/practice/[attemptId]      Active quiz attempt
/practice/[attemptId]/review  Quiz results and answer review
/my-bugs                   User's own bug report list

/admin                     Admin dashboard
/admin/bugs                Bug report management
/admin/questions           Question list
/admin/questions/new       New question form

/api/bugs                  REST endpoint (GET), static API key auth
```

### Auth Guards

All guarded routes call one of three guards at the top of the Server Component:

| Guard | Requirement | Redirects |
|-------|-------------|-----------|
| `requireApprovedUser()` | Logged in + email confirmed + approved + active | `/auth/login`, `/auth/verify-email`, `/auth/pending`, `/auth/rejected`, `/auth/deactivated` |
| `requireAdmin()` | `requireApprovedUser()` + `role = 'admin'` | 404 if not admin |

The middleware (`src/middleware.ts`) runs `updateSession()` on every request to refresh the Supabase session token via cookie before any Server Component reads it.

---

## Supabase

**Project ref:** `ufqcfniaxmwwcwmrssfk`  
**Region:** ap-northeast-1 (Tokyo)

### Clients

Three Supabase client factories, each with a distinct trust level:

| Client | File | Key | RLS | Use |
|--------|------|-----|-----|-----|
| `createServerSupabaseClient()` | `src/lib/supabase/server.ts` | Publishable | Enforced | All Server Components and Server Actions |
| `createAdminSupabaseClient()` | `src/lib/supabase/admin.ts` | Service role (`SUPABASE_SECRET_KEY`) | Bypassed | Admin actions, bug report filing, `GET /api/bugs` |
| `updateSession()` | `src/lib/supabase/proxy.ts` | Publishable | N/A | Middleware session refresh only |

`createServerSupabaseClient()` is async (reads `cookies()`). `createAdminSupabaseClient()` is sync and must never be called client-side.

### Auth

- **Provider:** Email + password (Supabase GoTrue)
- **Email confirmation:** required before access
- **Approval flow:** signup creates a `profiles` row with `approval_status = 'pending'`; an admin must set it to `'approved'` before the user can access the app
- **Roles:** `app_role` enum — `'student'` or `'admin'`
- **Session:** JWT stored in cookies, refreshed by middleware on every request

### Database Schema

```
auth.users                    (Supabase managed)
    │
    └── public.profiles       role, approval_status, display_name
            │
            ├── public.study_progress      section read tracking
            ├── public.quiz_attempts       quiz sessions
            │       └── public.quiz_attempt_questions   question snapshots
            │               └── public.quiz_attempt_answers
            ├── public.bug_reports         user feedback
            │       └── public.bug_report_files
            └── public.admin_audit_events  admin action log

public.study_domains          domain metadata (weight, mock_question_count)
public.questions              question bank (status: active/inactive)
public.ai_usage_events        AI feature telemetry
```

### Row Level Security

All tables have RLS enabled. The core predicate used by most policies is a `private` schema helper:

```sql
-- Users with an approved, active profile
private.is_approved_active_user()
  → checks profiles.approval_status = 'approved'
     AND profiles.is_active = true
     AND auth.uid() IS NOT NULL
```

Ownership policies (e.g. `quiz_attempts`, `bug_reports`) additionally check `user_id = auth.uid()`.

Admin-only tables (`admin_audit_events`, `questions` write access) use a separate `private.is_admin()` predicate.

### Migrations

Migration files live in `supabase/migrations/` named `YYYYMMDDHHMMSS_<description>.sql`.

```
202606180001_auth_core_schema.sql        profiles, enums, RLS bootstrap
20260618074937_auth_rls_policies.sql     full RLS policy set
20260618120842_optimize_rls_and_indexes.sql
202606210001_study_progress.sql
202606230001_quiz_attempts_domain.sql
202606250001_bug_reports.sql
202606260001_fix_bug_report_rls.sql
```

**Never apply schema changes via the Supabase dashboard SQL editor.** All changes must go through migration files so the CLI tracking table stays in sync. The `migrate.yml` workflow applies them automatically on push to `main`.

### Storage

Used for bug report file attachments. Bucket: `bug-report-files`. Access is controlled via Supabase Storage RLS.

---

## Content

Study guide markdown files live in `CCA-F/` at the repo root, one file per domain per language:

```
CCA-F/
  00_Master_Study_Guide.md / _zh.md
  01_Domain_Agentic_Architecture.md / _zh.md
  02_Domain_Claude_Code.md / _zh.md
  03_Domain_Tool_Design_MCP.md / _zh.md
  04_Domain_Prompt_Engineering.md / _zh.md
  05_Domain_Context_Management.md / _zh.md
```

`src/lib/study/content.ts` reads these at request time via `readFileSync` (server only). The parser (`renderMarkdownBlocks`) converts markdown to a typed `MarkdownBlock[]` AST; the study page renders it including inline `[text](url)` link parsing.

---

## External API

`GET /api/bugs` is a REST endpoint for external tooling (e.g. n8n, monitoring scripts):

- **Auth:** `Authorization: Bearer <BUG_API_KEY>` (static key, env var)
- **Params:** `?status=open|resolved|...`, `?limit=N`, `?offset=N`
- **Returns:** bug reports with attached file metadata
- Uses `createAdminSupabaseClient()` to bypass RLS

---

## Local Development

```powershell
# Install deps
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm install

# Run dev server (requires .env.local with Supabase keys)
corepack pnpm dev

# Quality checks
corepack pnpm test
corepack pnpm lint
corepack pnpm typecheck

# Regen DB types from live schema
supabase gen types typescript --linked > src/lib/supabase/database.types.ts

# Apply pending migrations to prod
supabase db push --linked

# Check migration sync state
supabase migration list
```

Secrets for local dev: copy from `C:\secrets\.env` into `.env.local` (gitignored).
