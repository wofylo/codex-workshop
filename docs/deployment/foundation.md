# Foundation Deployment Guide

## Local Checks

Run these before pushing:

```powershell
pnpm lint
pnpm typecheck
```

Both commands must exit 0.

## GitHub Branch Protection

Configure the `main` branch with these rules:

- Require a pull request before merging.
- Require the `CI / Lint and typecheck` check to pass.
- Block direct pushes to `main`.

## Vercel Project Setup

Create a Vercel project from the GitHub repository.

Use these settings:

- Framework preset: Next.js.
- Production branch: `main`.
- Root directory: repository root.
- Install command: `pnpm install --frozen-lockfile`.
- Build command: `pnpm build`.

## Preview Deployments

Disable preview deployments for v1 unless a separate preview Supabase project exists.

Reason: preview deployments connected to production Supabase can read or mutate production users, questions, progress, and admin data.

## Environment Variables

Set these in Vercel production only:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SECRET_KEY
```

The AI and email variables are optional until those features are implemented.

## Database And Auth Setup

This phase uses manual Supabase migration application.

Local migration check:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm dlx supabase@latest db reset
corepack pnpm dlx supabase@latest gen types typescript --local --schema public > src/lib/supabase/database.types.ts
corepack pnpm typecheck
```

Production setup:

1. Create the Supabase project.
2. Configure email/password auth.
3. Apply the SQL files in `supabase/migrations/` in filename order through Supabase CLI or the SQL Editor.
4. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY` in Vercel production.
5. Deploy from `main`.

## First Admin

The first admin is created manually for v1.

1. Visit `/auth/sign-up`.
2. Create the account that should become the first admin.
3. Confirm the email address through the verification email, or use the Supabase Admin API/Authentication dashboard to mark the first account as email-confirmed.
4. Open Supabase Table Editor or SQL Editor.
5. Find the matching row in `public.profiles`.
6. Set:

```sql
update public.profiles
set
  role = 'admin',
  approval_status = 'approved',
  approved_at = now(),
  approved_by = id
where display_name_normalized = lower('YOUR DISPLAY NAME');
```

7. Sign in at `/auth/login`.
8. Verify `/dashboard` loads.
9. Verify `/admin` loads for the admin account.

Do not soft-delete, reject, or demote the only active approved admin. The database trigger blocks this, but the operational rule is to create a second admin before changing the first one.
