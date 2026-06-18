# CCA-F Website Handoff

This document is the resume point for continuing the CCA-F exam prep website later. It summarizes the current repository state, what was implemented in the foundation phase, important environment notes, and the next concrete implementation step.

## Current State

### Foundation Is Implemented

The Next.js foundation has been implemented and merged into `main`. The app now has a deployable root Next.js App Router project with TypeScript, Tailwind CSS, shadcn/ui-compatible components, Supabase client boundaries, environment validation, a real health endpoint, CI workflow, and deployment notes. Database migrations, RLS policies, auth pages, study pages, quiz flows, admin pages, and AI features are still intentionally outside this completed foundation phase.

Use these commands first when resuming. They verify the branch state and show the latest merged foundation commits.

| Description | Command | Expected Result |
|---|---|---|
| Check working tree | `git status --short --branch` | Clean tree on `main`; currently shows `main...origin/main [gone]` because the upstream tracking ref is stale |
| View recent commits | `git log --oneline -10` | Latest commit is `44f8047 fix: make foundation build deterministic` |
| List app files | `Get-ChildItem -Recurse -File -Depth 3 src,docs,.github | Select-Object FullName` | Shows the Next.js app, deployment guide, and CI workflow |

The branch `cca-f-foundation` was fast-forward merged into `main` and then deleted locally. A separate branch named `feature/foundation` still exists locally, but it was not part of the completed merge workflow.

## Verification State

### Last Verified Commands

The merged `main` branch was verified immediately after the fast-forward merge. The production build needs placeholder public Supabase values when no real local `.env.local` exists because the proxy/env modules validate public Supabase configuration.

Run these checks again after any future change. If build fails because Supabase env values are missing, use the placeholder command below for local build-only verification.

| Description | Command | Expected Result |
|---|---|---|
| Lint app | `$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'; corepack pnpm lint` | Exits 0 |
| Typecheck app | `$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'; corepack pnpm typecheck` | Exits 0 |
| Build app with placeholder public env | `$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'; $env:NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co'; $env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='placeholder'; corepack pnpm build` | Exits 0 and lists `/`, `/_not-found`, and `/api/health` |
| Secret exposure scan | `$paths = @('.env.example') + (Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx | Select-Object -ExpandProperty FullName); Select-String -Path $paths -Pattern "NEXT_PUBLIC_.*SECRET|NEXT_PUBLIC_.*KEY.*SECRET|SUPABASE_SECRET_KEY" -CaseSensitive` | `SUPABASE_SECRET_KEY` appears only in `.env.example`, `src/lib/env/server.ts`, and `src/lib/supabase/admin.ts` |

There is no `test` script yet. For now, lint, typecheck, and build are the foundation verification gate.

## Implemented Foundation

### App Foundation

The app lives at the repository root. It uses the Next.js App Router, React, TypeScript, pnpm, Tailwind CSS v4, and a `src/` directory. The first screen is a dark scholarly command-center status page, not a marketing landing page.

Important implemented files:

| Area | Files | Purpose |
|---|---|---|
| App shell | `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css` | Root layout, metadata, dark/gold theme, and foundation status page |
| Health check | `src/app/api/health/route.ts`, `scripts/check-health.mjs` | Real `/api/health` endpoint and smoke-check script |
| UI components | `components.json`, `src/lib/utils.ts`, `src/components/ui/*` | shadcn/ui-compatible `Button`, `Card`, `Badge`, and `Separator` foundation |
| Package/config | `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `next.config.ts` | App scripts, dependencies, TypeScript, ESLint, Tailwind/PostCSS, and Next config |
| CI/deployment | `.github/workflows/ci.yml`, `docs/deployment/foundation.md` | GitHub Actions lint/typecheck workflow and Vercel setup notes |

The build was made deterministic by avoiding `next/font/google`, because network-restricted builds cannot fetch Google Fonts. Font stacks are defined in CSS instead.

## Environment And Tooling Notes

### Local Package Manager

The plan uses pnpm. In this environment, `pnpm` was made available through Corepack using a local Corepack cache at `.corepack`, which is ignored by Git. Some installs ran with an escalated environment and used `D:\.pnpm-store`; if pnpm reports an unexpected store location later, run install with the same store or reinstall cleanly.

Use these commands to restore local tooling if needed.

| Description | Command | Expected Result |
|---|---|---|
| Activate pnpm with local Corepack cache | `$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'; corepack prepare pnpm@latest --activate` | pnpm is available through Corepack |
| Install dependencies | `$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'; corepack pnpm install` | Dependencies installed |
| Install with existing escalated store if needed | `$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'; corepack pnpm install --store-dir D:\.pnpm-store` | Dependencies linked from existing store |

Ignored local artifacts include `.corepack/`, `.pnpm-store/`, `node_modules/`, `.next/`, `next-env.d.ts`, and TypeScript build info.

## Important Files

### Resume Reading Order

Read these files in order before starting the next implementation phase. The design spec remains the source of truth, while the completed foundation plan explains the boundaries of what was intentionally not implemented.

| Description | Command | Expected Result |
|---|---|---|
| Read technical design spec | `Get-Content -Raw docs\superpowers\specs\2026-06-18-cca-f-exam-prep-website-design.md` | Full product, architecture, schema, RLS, AI, CI/CD, and UI direction |
| Read beginner guide | `Get-Content -Raw docs\superpowers\specs\2026-06-18-cca-f-beginner-setup-guide.md` | Plain-language GitHub, Vercel, Supabase, env, and migration guidance |
| Read completed foundation plan | `Get-Content -Raw docs\superpowers\plans\2026-06-18-cca-f-foundation-implementation-plan.md` | Original task-by-task foundation implementation plan |
| Read deployment guide | `Get-Content -Raw docs\deployment\foundation.md` | Foundation deployment checklist and Vercel preview warning |
| Confirm seed study content | `Get-ChildItem -File CCA-F | Select-Object Name,Length` | 12 English/Chinese CCA-F Markdown files |

## Approved Product Decisions

### Scope

The website is a multi-user CCA-F exam prep app. Users request access, admins approve them, and approved users study bilingual content, take learning quizzes, take mock exams, track progress, and appear on a public leaderboard. Premium users can use AI features when the Siraya API is configured.

Key scope decisions remain unchanged:

- Multiple users.
- Email/password auth only for v1.
- Admin-approved access after signup.
- Admin dashboard required.
- Admin can approve, reject, soft-delete, restore, toggle premium, view progress, and manage questions.
- First admin is created manually in Supabase.
- Study guides are Markdown files in GitHub for v1.
- Question bank is managed in Supabase/admin dashboard.
- One Supabase environment for v1.
- Supabase CLI is used locally.
- SQL migrations are stored in GitHub and applied manually in phase one.
- Vercel deploys production from `main`.
- GitHub Actions must run on pull requests and `main`.
- Vercel preview deployments are disabled for v1 unless a separate preview Supabase project exists.

## Approved UI Direction

### Dark Scholarly Command Center

The visual direction is modern, dark, and serious, with restrained gold accents. The app should feel like a focused certification study cockpit, not a marketing landing page. Gold is used for emphasis and state, not as the whole palette.

Visual requirements still apply:

- Dark theme only for v1.
- Near-black page background.
- Charcoal panels.
- Muted slate text.
- Soft borders.
- Restrained gold accent for primary actions, selected state, progress, score, premium markers, badges, and focus rings.
- Avoid purple/blue gradient SaaS styling.
- Avoid one-note gold/brown dominance.
- Use shadcn/ui-compatible components with custom dark/gold CSS variables.
- Cards use restrained borders and `8px` radius or less.
- Layouts prioritize scanning and repeated study use.

## Next Step

### Create The Database/Auth Implementation Plan

The foundation phase is complete. The next action should be to create a new implementation plan for the database and authentication foundation, then execute that plan.

Recommended next scope:

- Supabase migration files for enums, core tables, constraints, indexes, helper functions, and initial RLS policies.
- Generated Supabase TypeScript database types.
- Auth signup/login/logout pages.
- Profile bootstrap after signup.
- Pending, rejected, deactivated, and verify-email status pages.
- Server-side route guards for approved users and admins.
- First admin manual setup instructions.

Do not start study content rendering, quiz flows, admin question management, AI, or email until the database/auth foundation is implemented and verified.

Suggested next commands and actions:

| Description | Command / Action | Expected Result |
|---|---|---|
| Start by writing a plan | Create `docs/superpowers/plans/YYYY-MM-DD-cca-f-database-auth-implementation-plan.md` | A task-by-task plan for migrations, auth pages, route guards, and verification |
| Use implementation workflow | Say `execute database auth plan inline` or use subagent-driven execution if available | Work proceeds with review gates and verification |
| Keep secrets server-only | Ensure browser code imports only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | No secret leakage into client bundles |

## Commit History

### Relevant Commits

These commits capture the current foundation state. Use them to verify the handoff matches the repository.

| Commit | Message | Meaning |
|---|---|---|
| `44f8047` | `fix: make foundation build deterministic` | Removes network-dependent font fetch and stale shadcn CSS import |
| `2a241e9` | `ci: add foundation checks` | Adds GitHub Actions lint/typecheck workflow and deployment notes |
| `670649b` | `feat: add shadcn UI foundation` | Adds shadcn-compatible UI components and componentized foundation page |
| `554c5f7` | `feat: add health check endpoint` | Adds `/api/health` and `pnpm health:check` |
| `ab26c98` | `feat: add Supabase client foundation` | Adds env validation and browser/server/admin/proxy Supabase clients |
| `e32e73e` | `feat: scaffold Next.js foundation` | Adds root Next.js app foundation |
| `c8aa497` | `Add project handoff document` | Adds the original handoff document |
| `749e3bb` | `Add dark gold UI direction` | Adds modern dark/gold visual direction to spec and foundation plan |

## Do Not Forget

### Implementation Cautions

These constraints were explicitly decided and should not be casually changed during implementation. They prevent common security and deployment mistakes.

| Concern | Requirement | Why It Matters |
|---|---|---|
| Client secrets | Never expose `SUPABASE_SECRET_KEY`, AI keys, or email keys to browser code | Prevents credential leakage |
| AI usage limits | Derive user from `auth.uid()` in the database/RPC layer | Prevents user-id spoofing |
| Vercel previews | Disable previews unless a separate preview Supabase exists | Prevents test builds touching production data |
| Main branch | Require PR checks and no direct pushes | Prevents broken production deploys |
| Quiz attempts | Store frozen question and choice order snapshots | Keeps old scores stable after question edits |
| RLS | Enforce soft-deleted user blocking in DB helper functions | Prevents UI-only security |
| AI questions | Save generated questions as `pending_review` | Prevents polluted shared question bank |

