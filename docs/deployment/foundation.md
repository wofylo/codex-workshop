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
