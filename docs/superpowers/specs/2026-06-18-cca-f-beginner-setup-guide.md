# CCA-F Website Beginner Setup And Modification Guide

Date: 2026-06-18

This guide explains how the planned CCA-F exam prep website uses GitHub, Vercel, Supabase, and CI/CD. It is written for a first-time Vercel and Supabase user.

## Big Picture

The project has four main services:

| Service | What It Does |
|---|---|
| GitHub | Stores the code, Markdown study guides, SQL migrations, generated database types, and docs. |
| Vercel | Hosts the Next.js website and deploys automatically from GitHub. |
| Supabase | Provides login, users, Postgres database, and Row Level Security. |
| Siraya API | Optional AI provider for premium AI question generation and tutor features. |

The normal flow is:

1. Edit code, Markdown, or SQL files locally.
2. Commit and push to GitHub.
3. GitHub Actions runs checks on `main`.
4. Vercel deploys the website from `main`.
5. Supabase stores users, quiz data, progress, questions, and settings.

## GitHub

GitHub is the source of truth for the project.

Important things stored in the repo:

- App code.
- CCA-F Markdown study guides.
- SQL migration files.
- Generated Supabase TypeScript types.
- Documentation.
- GitHub Actions workflow files.

Do not commit secrets such as API keys, Supabase service role keys, or email provider keys.

## Vercel

Vercel hosts the Next.js app.

V1 uses the standard Vercel GitHub integration:

1. Create a Vercel project.
2. Connect it to the GitHub repo.
3. Set the framework to Next.js.
4. Add environment variables in the Vercel dashboard.
5. Deploy from the `main` branch.

Production deploys automatically when `main` changes.

The default Vercel domain is enough for v1. A custom domain can be added later.

Disable Vercel preview deployments for v1 unless a separate preview Supabase project exists. A preview deployment connected to production Supabase would let test builds read or mutate production users, questions, progress, and admin data.

## Supabase

Supabase provides:

- Auth: email/password sign-up and login.
- Postgres: database tables for profiles, questions, attempts, review queue, AI usage, and settings.
- Row Level Security: database rules that prevent users from reading or changing data they should not access.

Use one Supabase project for v1.

Choose a region close to Taiwan/Asia if available.

## Environment Variables

Environment variables are settings the app reads at runtime.

Examples:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AI_PROVIDER=
AI_BASE_URL=
AI_API_KEY=
AI_MODEL=
EMAIL_PROVIDER=
EMAIL_API_KEY=
EMAIL_FROM=
```

Rules:

- Put variable names in `.env.example`.
- Put real values in local `.env.local` and Vercel dashboard.
- Never commit real secrets to GitHub.
- Never expose server secrets to browser/client code. `SUPABASE_SERVICE_ROLE_KEY`, AI keys, and email keys must stay server-only.
- The AI and email variables are optional for v1.

If AI variables are missing, AI features are disabled.

If email variables are missing, approval/rejection emails are skipped and users see status after login.

## Supabase CLI

The Supabase CLI is used locally for database work.

Main uses:

- Create migration files.
- Apply migrations during development or manually to the linked project.
- Generate TypeScript database types.

The repo should keep a `supabase/migrations/` folder with ordered SQL migration files.

Example migration filename:

```text
supabase/migrations/202606180001_create_profiles.sql
```

## Manual Migration Workflow In V1

In phase one, database changes are not automatically pushed by CI.

The workflow is:

1. Create or edit a SQL migration file in GitHub.
2. Review the SQL.
3. Apply it manually through Supabase CLI or Supabase SQL Editor.
4. Regenerate Supabase TypeScript types.
5. Commit the SQL migration and generated types.

This is slower than full automation, but safer while learning because every database change is visible.

## Later Migration Automation

Phase 2 can validate migrations in CI:

- GitHub Actions checks whether migration files are valid.
- Production database is not changed automatically.

Phase 3 can deploy migrations automatically:

- GitHub Actions applies migrations to Supabase after checks pass on `main`.
- This should wait until backup and rollback practices are clear.

## Row Level Security

Row Level Security, usually called RLS, is Supabase/Postgres database protection.

Without RLS, a user might accidentally read or write data that belongs to another user if the app has a bug.

With RLS:

- Users can read/write their own quiz attempts.
- Users can read their own review queue.
- Users can read shared active questions.
- Users can read public leaderboard summaries.
- Admins can manage users and questions.

The app should also protect admin pages server-side. RLS is the database safety net, not the only protection.

## First Admin

V1 creates the first admin manually.

Basic process:

1. Sign up through the website with email/password/display name.
2. Open Supabase.
3. Find the matching row in `profiles`.
4. Set `role = 'admin'`.
5. Set `approval_status = 'approved'`.

After that, this admin can approve other users in the dashboard.

## User Approval

New users are pending by default.

During sign-up, users must explicitly accept that their display name, progress summary, and leaderboard score are visible to other approved users. This is required because v1 does not include a leaderboard opt-out.

Display names are public, so v1 validates them:

- 3-40 characters.
- Letters, numbers, spaces, underscores, and hyphens only.
- Unique among active users.
- Users cannot change them themselves in v1.
- Admins can edit them for moderation.

Supabase email confirmation and app approval are separate:

- Supabase email confirmation proves the email address is valid if confirmation is enabled.
- App approval is the admin decision stored in the `profiles` table.
- A user needs both email confirmation, when enabled, and app approval before full access.

Admin choices:

- Approve.
- Reject.
- Soft-delete.
- Restore.
- Toggle premium.

Soft-delete means the app keeps the user record and history but blocks access and removes the user from public views.

The dashboard and database must protect the admin account set:

- An admin cannot demote or delete themselves.
- The last active approved admin cannot be demoted, rejected, or soft-deleted.

## Content Editing

Study-guide content starts as Markdown files in the repo.

To update content:

1. Edit the Markdown file.
2. Commit and push to GitHub.
3. Vercel redeploys the website.
4. Users see the updated content.

Question bank content is different. Questions are managed in the admin dashboard and stored in Supabase.

Markdown should be rendered safely:

- Load only known files from the repo.
- Parse on the server.
- Escape or sanitize raw HTML.
- Allow only expected Markdown elements.
- Do not render user-submitted Markdown in v1.

## Question Editing

Admins manage questions in the dashboard.

V1 question rules:

- Multiple choice.
- Exactly 4 choices.
- Exactly 1 correct answer.
- One primary CCA-F domain.
- Optional section tag.
- Optional source/reference.
- English first.
- Chinese generated or added later.

AI-generated questions do not become active immediately. They enter `pending_review`, and admins publish them after review. Quizzes and mock exams use only `active` questions.

Attempts store a frozen copy of the selected questions, answer choices, correct answer, and order. This keeps old scores stable even if an admin edits a question later.

## AI Configuration

AI is optional and premium-only.

V1 expects Siraya API configuration through environment variables. If the API is OpenAI-compatible, the app can use a base URL, API key, and model name.

Admins can see whether AI is configured, but never see the API key.

Premium users have one shared daily AI limit across:

- AI question generation.
- AI tutor.

The default limit is 25 actions per day, configurable in the admin dashboard.

The daily AI limit must be enforced by the database in one atomic operation. The app should not check the count in one request and insert the usage event in another, because two fast requests could otherwise exceed the limit.

The first version uses UTC day boundaries for the daily limit.

The AI usage check must identify the user from the logged-in session on the server/database side. The client must not send a user id that the server trusts.

The AI tutor should answer from retrieved study-guide chunks only. If the current Markdown study material does not support an answer, it should politely say it does not know from the current study material.

## Email Configuration

Approval/rejection emails are optional.

Use a free email provider if configured. If no free provider is configured, the app skips email and users see approval/rejection status when they log in.

Do not require a paid email provider for v1.

## CI/CD

CI/CD means automatic checks and deployment.

For v1:

- GitHub Actions runs checks on pull requests and push to `main`.
- Vercel deploys from `main`.
- Supabase migrations are applied manually.

GitHub Actions checks:

- Lint.
- Typecheck.
- Supabase generated types are current.

The generated-types check should compare committed TypeScript types against a schema created from committed migrations. It should not depend on the live production Supabase database in v1, because production migrations are still applied manually.

Vercel handles deployment through the GitHub integration.

Protect the `main` branch so pull requests cannot merge until checks pass. Do not include a fake smoke test script. Add a real smoke test only when it starts the app and checks a real health endpoint.

## How To Modify The Database Safely

Use this pattern:

1. Decide the schema change.
2. Write a new SQL migration file.
3. Apply the migration manually to Supabase.
4. Regenerate TypeScript database types.
5. Update app code to use the new schema.
6. Run lint and typecheck.
7. Commit and push.

Avoid editing production tables directly without also creating a migration file. The migration file is the project history of the database.

## How To Modify The App Safely

Use this pattern:

1. Make a small change.
2. Run local checks.
3. Commit the change.
4. Push to GitHub.
5. Confirm GitHub Actions passes.
6. Confirm Vercel deploys.

For admin or auth changes, also verify:

- Normal users cannot access admin pages.
- Pending/rejected/deleted users are blocked correctly.
- RLS policies still protect private data.

## Later Improvements

Good next steps after v1:

- Add migration validation in CI.
- Add automatic migration deployment.
- Add Vercel CLI/env sync.
- Add internet content pull/update for study guides.
- Add payment/subscription support for premium.
- Add OAuth login.
- Add stronger test coverage.
