# CCA-F Exam Prep Handoff For Codex CLI

This is the current resume point for continuing the CCA-F exam prep app from Codex CLI or another non-plugin agent. It intentionally uses local commands, CLIs, and HTTP APIs instead of Codex desktop plugins.

## Current Snapshot

- Workspace: `D:\Lab\codex-workshop`
- Repo: `git@github.com:wofylo/codex-workshop.git`
- Branch: `main`
- Latest pushed commit before this handoff refresh: `be1fa472 docs: update CLI handoff`
- Production URL: `https://codex-workshop-two.vercel.app/`
- Latest Vercel deployment: `dpl_4X6jEGJd8SHMPydnDuVt4oRJAzzb`
- Vercel project id: `prj_3Pb4cARgnOOI8PoMAOHgxPrsgjvi`
- Vercel team id: `team_lEkdAVKvWzUfDSPAQw13RsQs`
- Supabase project ref: `ufqcfniaxmwwcwmrssfk`
- Supabase URL: `https://ufqcfniaxmwwcwmrssfk.supabase.co`
- Supabase region: `ap-northeast-1`

## Implemented

- Next.js App Router app with TypeScript, Tailwind CSS, shadcn-compatible UI components, and dark scholarly styling.
- `/api/health` returns `{"ok":true,"service":"cca-f-exam-prep"}`.
- Supabase browser/server/admin clients with public/server-only env separation.
- Supabase migrations applied remotely:
  - `20260618081553 auth_core_schema`
  - `20260618081641 auth_rls_policies`
  - `20260618121127 optimize_rls_and_indexes`
- Generated Supabase database types in `src/lib/supabase/database.types.ts`.
- Auth gate v1:
  - `/auth/sign-up`
  - `/auth/login`
  - `/auth/pending`
  - `/auth/rejected`
  - `/auth/deactivated`
  - `/auth/verify-email`
  - `/auth/error?reason=...`
  - `/dashboard`
  - `/admin`
- Signup creates a Supabase Auth user, then creates `public.profiles` using the server-only `SUPABASE_SECRET_KEY`.
- `/dashboard` requires an authenticated, approved, non-deleted profile.
- `/admin` requires an approved admin profile.
- Auth error page now distinguishes:
  - `reason=login`
  - `reason=signup`
  - `reason=profile`

## Current Production Auth State

As of the last plugin check:

```text
auth.users = 0
public.profiles = 0
active approved admins = 0
```

This explains the screenshot showing `Authentication problem`: the user tried to log in before any account existed. Supabase Auth logs showed:

```text
400: Invalid login credentials
path: /token
grant_type: password
```

Correct next manual flow:

1. Visit `https://codex-workshop-two.vercel.app/auth/sign-up`.
2. Create the first account.
3. Open Supabase SQL Editor.
4. Promote that account to first admin:

```sql
update public.profiles
set
  role = 'admin',
  approval_status = 'approved',
  approved_at = now(),
  approved_by = id
where display_name_normalized = lower('YOUR DISPLAY NAME');
```

5. Sign in at `/auth/login`.
6. Verify `/dashboard`.
7. Verify `/admin`.

## Verification Commands

Use PowerShell from `D:\Lab\codex-workshop`.

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm test
corepack pnpm lint
corepack pnpm typecheck
```

For local build, env vars are required because server routes import validated env:

```powershell
$env:NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co'
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='placeholder'
$env:SUPABASE_SECRET_KEY='placeholder-secret'
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm build
```

Expected build routes include:

```text
/
/admin
/api/health
/auth/deactivated
/auth/error
/auth/login
/auth/pending
/auth/rejected
/auth/sign-up
/auth/verify-email
/dashboard
```

Secret boundary scan:

```powershell
$paths = @('.env.example') + (Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx | Select-Object -ExpandProperty FullName)
Select-String -Path $paths -Pattern 'NEXT_PUBLIC_.*SECRET|NEXT_PUBLIC_.*KEY.*SECRET|SUPABASE_SECRET_KEY' -CaseSensitive
```

Expected: `SUPABASE_SECRET_KEY` only appears in `.env.example`, `src/lib/env/server.ts`, `src/lib/supabase/admin.ts`, and server-only auth code.

## Secrets And Environment

Local secrets are not committed. The user previously placed secrets at:

```text
C:\secrets\.env
```

Current checked key names in that file:

```text
JIRA_API_TOKEN
JIRA_BASE_URL
JIRA_DEFAULT_PROJECT_KEY
JIRA_EMAIL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
SUPABASE_ACCESS_TOKEN
VERCEL_TOKEN
```

Do not print secret values. Source them only when needed.

GitHub does not use a token for normal git operations in this workspace. The user uses SSH:

```text
C:\Users\WofyLo\.ssh\github_wofylo.pub
```

Do not ask for `GITHUB_TOKEN` / `GH_TOKEN` for `git pull`, `git fetch`, or `git push`. Only ask for a GitHub token if the task specifically requires GitHub API or `gh` CLI features that SSH cannot cover, such as Actions API logs, PR API creation, or repo administration.

`VERCEL_TOKEN` exists in `C:\secrets\.env`; use it for Vercel CLI/API troubleshooting instead of asking the user again.

Vercel production env must contain:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
```

Optional later:

```text
AI_PROVIDER
AI_BASE_URL
AI_API_KEY
AI_MODEL
EMAIL_PROVIDER
EMAIL_API_KEY
EMAIL_FROM
```

## Plugin Replacement: CLI And API Equivalents

The desktop session used Vercel and Supabase plugins. Codex CLI can do the same work through official CLIs or HTTPS APIs.

### Vercel CLI

Install/use through Corepack or `npx` if not already installed. Load `VERCEL_TOKEN` from `C:\secrets\.env` without printing it:

```powershell
npx vercel --version
```

Project inspection:

```powershell
npx vercel project ls --token $env:VERCEL_TOKEN
npx vercel inspect https://codex-workshop-two.vercel.app --token $env:VERCEL_TOKEN
npx vercel logs https://codex-workshop-two.vercel.app --token $env:VERCEL_TOKEN
```

Deploy from CLI if Git integration is not enough:

```powershell
npx vercel deploy --prod --token $env:VERCEL_TOKEN
```

Production env management:

```powershell
npx vercel env ls production --token $env:VERCEL_TOKEN
npx vercel env add NEXT_PUBLIC_SUPABASE_URL production --token $env:VERCEL_TOKEN
npx vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY production --token $env:VERCEL_TOKEN
npx vercel env add SUPABASE_SECRET_KEY production --token $env:VERCEL_TOKEN
```

### Vercel REST API

Use if CLI is unavailable. Replace token and ids.

```powershell
$headers = @{ Authorization = "Bearer $env:VERCEL_TOKEN" }
$team = 'team_lEkdAVKvWzUfDSPAQw13RsQs'
$project = 'prj_3Pb4cARgnOOI8PoMAOHgxPrsgjvi'
Invoke-RestMethod -Headers $headers -Uri "https://api.vercel.com/v6/deployments?projectId=$project&teamId=$team"
Invoke-RestMethod -Headers $headers -Uri "https://api.vercel.com/v9/projects/$project?teamId=$team"
```

Build logs:

```powershell
$deployment = 'dpl_4X6jEGJd8SHMPydnDuVt4oRJAzzb'
Invoke-RestMethod -Headers $headers -Uri "https://api.vercel.com/v2/deployments/$deployment/events?teamId=$team&limit=100"
```

### Supabase CLI

Use `SUPABASE_ACCESS_TOKEN` from `C:\secrets\.env` without printing it:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm dlx supabase@latest --version
corepack pnpm dlx supabase@latest projects list
```

Link local project if needed:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm dlx supabase@latest link --project-ref ufqcfniaxmwwcwmrssfk
```

List migrations:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm dlx supabase@latest migration list --linked
```

Generate remote database types:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm dlx supabase@latest gen types typescript --project-id ufqcfniaxmwwcwmrssfk --schema public > src/lib/supabase/database.types.ts
```

Advisors:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm dlx supabase@latest db lint --linked
```

If the installed CLI lacks a command, check help first:

```powershell
corepack pnpm dlx supabase@latest --help
corepack pnpm dlx supabase@latest db --help
corepack pnpm dlx supabase@latest migration --help
```

### Supabase Management API

Use when CLI cannot do a task. Replace token and project ref.

```powershell
$headers = @{ Authorization = "Bearer $env:SUPABASE_ACCESS_TOKEN" }
Invoke-RestMethod -Headers $headers -Uri "https://api.supabase.com/v1/projects/ufqcfniaxmwwcwmrssfk"
Invoke-RestMethod -Headers $headers -Uri "https://api.supabase.com/v1/projects/ufqcfniaxmwwcwmrssfk/api-keys"
```

Avoid printing API keys in logs. If a response contains secrets, inspect locally and redact before sharing.

### Direct SQL Without Plugin

Preferred for Codex CLI is `psql` using a database connection string from Supabase dashboard, stored in an env var:

```powershell
$env:SUPABASE_DB_URL = '<postgresql connection string>'
psql $env:SUPABASE_DB_URL -c "select count(*) from auth.users;"
psql $env:SUPABASE_DB_URL -c "select count(*) from public.profiles;"
```

If `psql` is not installed, use Supabase SQL Editor manually for one-off checks.

Current useful checks:

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

### GitHub CLI

Normal GitHub git operations use SSH and do not require `GITHUB_TOKEN`:

```powershell
git fetch origin
git pull --ff-only
git push origin main
```

SSH public key:

```text
C:\Users\WofyLo\.ssh\github_wofylo.pub
```

If `gh` is available and API features are explicitly needed:

```powershell
gh repo view wofylo/codex-workshop
gh run list --repo wofylo/codex-workshop --limit 10
gh run view --repo wofylo/codex-workshop --log
```

Only request `GITHUB_TOKEN` / `GH_TOKEN` when these API-style operations are required and SSH is not enough.

## Troubleshooting Playbook Without Plugins

### Auth Shows `/auth/error?reason=login`

Root cause class: Supabase rejected email/password.

Check:

```sql
select count(*) from auth.users;
select id, email, email_confirmed_at, created_at from auth.users order by created_at desc limit 5;
select display_name, role, approval_status, is_deleted from public.profiles order by created_at desc limit 5;
```

If there are no users, create one through `/auth/sign-up`.

### Auth Shows `/auth/error?reason=signup`

Root cause class: Supabase could not create the auth user.

Check Supabase Auth settings:

- Email/password signup enabled.
- Email confirmation setting understood.
- Password meets Supabase policy.
- Email is not already registered.

Check Auth logs in Supabase dashboard or with API/CLI if available.

### Auth Shows `/auth/error?reason=profile`

Root cause class: auth user was created, but server-only profile insert failed.

Check:

- Vercel production has `SUPABASE_SECRET_KEY`.
- `SUPABASE_SECRET_KEY` is a Supabase secret/service key, not the publishable key.
- `src/lib/supabase/admin.ts` remains server-only.

Then check:

```sql
select count(*) from auth.users;
select count(*) from public.profiles;
```

If an auth user exists without a profile, manually create a profile or delete/retry the auth user.

### `/dashboard` Redirects To Pending

Expected when profile exists but is not approved.

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

Expected for approved non-admin users. Set `role = 'admin'` for the intended admin profile.

## Important Files

- `src/app/auth/actions.ts`: signup/login/logout server actions.
- `src/app/auth/error/page.tsx`: reason-aware auth error page.
- `src/lib/auth/error-copy.ts`: auth error copy mapping.
- `src/lib/auth/display-name.ts`: display name validation.
- `src/lib/auth/account-status.ts`: redirect decision logic.
- `src/lib/auth/profiles.ts`: server-side current user/profile lookup.
- `src/lib/auth/guards.ts`: approved-user/admin guards.
- `src/lib/supabase/admin.ts`: server-only admin Supabase client.
- `src/lib/supabase/server.ts`: server Supabase client with cookies.
- `src/lib/supabase/proxy.ts` and `src/proxy.ts`: Supabase session refresh.
- `supabase/migrations/*.sql`: database schema, RLS, and optimization migrations.
- `docs/deployment/foundation.md`: deployment and first-admin notes.

## Recent Commits

```text
5b2127bd fix: explain auth errors
1a093aa3 feat: add auth gate pages
51bf478a fix: optimize Supabase RLS policies
d44e9f97 feat: prepare Supabase deploy foundation
1d1880e3 feat: add auth database schema
013730d6 docs: add database auth implementation plan
2453cb31 docs: update CCA-F handoff
44f8047c fix: make foundation build deterministic
```

## Next Recommended Work

1. Create the first account through `/auth/sign-up`.
2. Promote it to admin in Supabase.
3. Verify `/dashboard` and `/admin` in production.
4. Build the admin user-management slice:
   - list pending users
   - approve user
   - reject user
   - soft-delete user
   - restore user
   - toggle premium
5. After admin user management, build study dashboard and domain/section reading pages.

Keep each slice small and verify with:

```powershell
corepack pnpm test
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm build
```
