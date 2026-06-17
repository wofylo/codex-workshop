# CCA-F Website Handoff

This document is the resume point for continuing the CCA-F exam prep website later. It summarizes the current repository state, the approved product/design decisions, and the next concrete implementation step.

## Current State

### What Is Done

The project is still in planning mode; no application scaffold has been implemented yet. The repository contains the approved design spec, a beginner setup guide, the seed CCA-F study-guide content, and the foundation implementation plan. The latest design update adds a modern dark theme with restrained gold accents.

Use these commands to orient yourself when resuming:

| Description | Command | Expected Result |
|---|---|---|
| Check working tree | `git status --short` | No changes listed |
| View recent commits | `git log --oneline -8` | Latest commit is `749e3bb Add dark gold UI direction` |
| List project files | `Get-ChildItem -Recurse -File -Depth 3` | Shows `CCA-F/`, `docs/superpowers/specs/`, and `docs/superpowers/plans/` |

The recurring warning `unable to access 'C:\Users\WofyLo/.config/git/ignore': Permission denied` has appeared during Git commands. It has not blocked commits so far.

## Important Files

### Resume Reading Order

Read these files in order before implementing. The design spec is the source of truth, the beginner guide explains operational setup, and the foundation plan is the next executable plan.

| Description | Command | Expected Result |
|---|---|---|
| Read technical design spec | `Get-Content -Raw docs\superpowers\specs\2026-06-18-cca-f-exam-prep-website-design.md` | Full product, architecture, schema, RLS, AI, CI/CD, and UI direction |
| Read beginner guide | `Get-Content -Raw docs\superpowers\specs\2026-06-18-cca-f-beginner-setup-guide.md` | Plain-language GitHub, Vercel, Supabase, env, and migration guidance |
| Read foundation plan | `Get-Content -Raw docs\superpowers\plans\2026-06-18-cca-f-foundation-implementation-plan.md` | Task-by-task implementation plan for the Next.js foundation |
| Confirm seed study content | `Get-ChildItem -File CCA-F | Select-Object Name,Length` | 12 English/Chinese CCA-F Markdown files |

## Approved Product Decisions

### Scope

The website is a multi-user CCA-F exam prep app. Users request access, admins approve them, and approved users study bilingual content, take learning quizzes, take mock exams, track progress, and appear on a public leaderboard. Premium users can use AI features when the Siraya API is configured.

Key scope decisions:

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

Visual requirements:

- Dark theme only for v1.
- Near-black page background.
- Charcoal panels.
- Muted slate text.
- Soft borders.
- Restrained gold accent for primary actions, selected state, progress, score, premium markers, badges, and focus rings.
- Avoid purple/blue gradient SaaS styling.
- Avoid one-note gold/brown dominance.
- Use shadcn/ui with custom dark/gold CSS variables.
- Cards use restrained borders and `8px` radius or less.
- Layouts prioritize scanning and repeated study use.

## Key Technical Decisions

### Foundation Stack

The foundation plan uses Next.js App Router, React, TypeScript, pnpm, Tailwind CSS, shadcn/ui, Supabase SSR client, Zod, GitHub Actions, and Vercel. Supabase access is split into browser, server, proxy, and admin clients to keep secrets out of client bundles.

Important environment-variable rule:

- Browser code may use only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `SUPABASE_SECRET_KEY`, AI keys, and email keys are server-only.

### Database And Auth Direction

The implementation-ready spec defines:

- Postgres enums for roles, approval status, question status, quiz mode, attempt status, and AI feature.
- `profiles` table linked to Supabase Auth users.
- `app_settings` singleton table.
- study domain/section tables.
- question bank with review status.
- `quiz_attempt_questions` for frozen question snapshots and order.
- attempt answers linked to attempt questions.
- review queue.
- AI usage events.
- admin audit events.
- RLS helper functions: `is_admin()`, `is_approved_active_user()`, `is_premium_user()`.

## Next Step

### Execute The Foundation Plan

The next action is to execute:

`docs/superpowers/plans/2026-06-18-cca-f-foundation-implementation-plan.md`

This plan scaffolds the app foundation only. It intentionally does not implement database migrations, RLS policies, auth pages, study pages, quiz flows, admin pages, or AI features.

When resuming, choose an execution mode:

| Option | Command / Action | Expected Result |
|---|---|---|
| Recommended | Say `execute foundation plan subagent-driven` | Use `subagent-driven-development`, one fresh worker per task with review gates |
| Alternative | Say `execute foundation plan inline` | Use `executing-plans`, implement tasks in this session with checkpoints |

## Commit History

### Relevant Commits

These commits capture the planning and content state. Use them to verify the handoff matches the repository.

| Commit | Message | Meaning |
|---|---|---|
| `749e3bb` | `Add dark gold UI direction` | Adds modern dark/gold visual direction to spec and foundation plan |
| `d7ade92` | `Add CCA-F foundation implementation plan` | Adds the executable foundation plan |
| `4d3d54d` | `Add CCA-F study guides` | Adds 12 English/Chinese seed Markdown files |
| `9fde373` | `Make CCA-F design implementation-ready` | Adds concrete RLS, schema, mock exam, CI, Markdown, and error details |
| `a8f299c` | `Address CCA-F design review risks` | Fixes high-risk design issues from first review |
| `0079e73` | `Add CCA-F website design docs` | Adds initial technical spec and beginner guide |

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

