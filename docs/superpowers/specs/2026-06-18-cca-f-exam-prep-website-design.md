# CCA-F Exam Prep Website Design

Date: 2026-06-18

## Purpose

Build a multi-user CCA-F exam preparation website using GitHub, Vercel, Supabase, and optional AI services. The site helps approved users study bilingual CCA-F material, practice with exam-style multiple-choice questions, track progress, review mistakes, and use premium AI tools when configured.

The first release should be production-shaped but beginner-manageable: real authentication, row-level security, admin approval, CI checks, Vercel deployment, SQL migrations in GitHub, and clear setup documentation. Advanced automation such as automatic database migration deployment and internet content ingestion are later phases.

## Release Strategy

Use a production-shaped MVP.

The first release includes the important foundations:

- Next.js app deployed on Vercel.
- Supabase Auth, Postgres, and Row Level Security.
- Admin approval and user management.
- Markdown study guides from the repo as the first content source.
- Database-managed question bank.
- Learning quizzes, mock exams, review queue, progress, and leaderboard.
- Optional premium AI features through Siraya-compatible API environment variables.
- Optional free email provider for approval/rejection notifications.
- GitHub Actions lightweight checks on `main`.

The first release does not include:

- Payment or subscription integration.
- Automatic internet content pull/update.
- Automatic production database migration deployment.
- Multi-environment Supabase setup.
- Google/GitHub OAuth.

## Architecture

### Stack

- App framework: Next.js with React and TypeScript.
- UI: shadcn/ui and Tailwind CSS.
- Package manager: pnpm.
- Auth and database: Supabase Auth and Supabase Postgres.
- Hosting: Vercel.
- Source control and CI: GitHub and GitHub Actions.
- AI provider: optional Siraya API, assumed OpenAI-compatible through base URL plus API key.
- Email provider: optional free provider such as Resend if configured; otherwise approval/rejection status appears in-app.

### App Areas

- Public/auth area: sign up, login, pending approval, rejected status, deleted/deactivated status.
- Student area: bilingual study guides, learning quizzes, mock exams, review queue, progress, leaderboard, premium AI tools.
- Admin area: approve/reject/restore users, soft-delete users, toggle premium, manage questions, view progress, configure AI daily limit.

### Environments

Use one Supabase environment for v1. Choose Vercel and Supabase regions close to Taiwan/Asia if available.

## Authentication And Authorization

Supabase Auth is the source of identity. The app uses email/password only for v1.

The app stores all application-level authorization in `profiles`, keyed to `auth.users.id`.

Profile state:

- `role`: `student` or `admin`.
- `approval_status`: `pending`, `approved`, or `rejected`.
- `is_premium`: enables premium AI features.
- `is_deleted`: soft-deletes a user without deleting the Supabase Auth account.

Access behavior:

- Pending users see only the pending approval page.
- Rejected users see rejected status and cannot enter the app.
- Approved users can use the student app.
- Soft-deleted users are blocked by app logic after login and excluded from public views.
- Admin routes and admin data are protected server-side, not only hidden in navigation.
- Admins cannot soft-delete themselves from the dashboard.

The first admin is created manually in Supabase for v1.

## User Flows

### Sign Up

1. User enters email, password, and display name.
2. Supabase creates the auth user.
3. App creates a `profiles` row with `approval_status = pending`.
4. User sees a pending approval page.
5. Admin approves or rejects the request.
6. If a free email provider is configured, the app sends an approval/rejection email.
7. If email is not configured, the user sees status when logging in.

### Student Learning

The default interface language is English. Users can switch the app and study content between English and Chinese.

The learning path is:

1. Choose domain or section.
2. Read the relevant guide.
3. Take scenario-style multiple-choice questions.
4. See immediate explanations in learning mode.
5. Incorrect questions are added automatically to the personal review queue.
6. Review weak areas by domain and section.

### Mock Exam

Mock exams should follow the real CCA-F exam as closely as the available information allows.

V1 behavior:

- 60 questions.
- Timed mode matching the real exam duration.
- Domain-weighted question selection.
- Explanations only after finishing.
- Users can visually pause/resume, but the timed exam deadline keeps counting while away.
- Unfinished attempts remain until completed.
- Users may retake mock exams.

### Public Progress And Leaderboard

Approved, non-deleted users appear in public progress and leaderboard views.

Public fields:

- Display name.
- Public progress summary.
- Leaderboard score.

Users cannot opt out in v1. The leaderboard ranks by best mock exam score.

## Database Design

### Tables

#### `profiles`

One row per Supabase Auth user.

Key fields:

- `id uuid primary key references auth.users(id)`
- `display_name text not null`
- `role text not null default 'student'`
- `approval_status text not null default 'pending'`
- `is_premium boolean not null default false`
- `is_deleted boolean not null default false`
- `approved_at timestamptz`
- `approved_by uuid references profiles(id)`
- `rejected_at timestamptz`
- `rejected_by uuid references profiles(id)`
- `deleted_at timestamptz`
- `deleted_by uuid references profiles(id)`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

#### `app_settings`

Stores admin-configurable app settings.

Initial setting:

- `daily_ai_limit` default `25`.

#### `study_domains`

Stores CCA-F domains, display labels, exam weights, and sort order.

#### `study_sections`

Stores sections inside each domain and links them to Markdown source paths.

#### `questions`

Shared question bank.

Key behavior:

- Exactly 4 choices.
- Exactly 1 correct answer.
- One primary domain.
- Optional section tag.
- Optional source/reference field.
- Bilingual text and explanation when available.
- `status`: `active` or `disabled`.
- AI metadata when generated.

Suggested fields:

- `question_en text not null`
- `question_zh text`
- `choices_en jsonb not null`
- `choices_zh jsonb`
- `correct_choice_index integer not null`
- `explanation_en text not null`
- `explanation_zh text`
- `domain_id uuid not null`
- `section_id uuid`
- `source_reference text`
- `status text not null default 'active'`
- `generated_by_user_id uuid`
- `generated_at timestamptz`
- `generated_model text`

#### `quiz_attempts`

Stores learning quiz and mock exam attempts.

Key fields:

- `user_id uuid not null`
- `mode text not null`: learning or mock exam.
- `status text not null`: in progress or completed.
- `language text not null`
- `started_at timestamptz not null`
- `completed_at timestamptz`
- `timer_deadline timestamptz`
- `score numeric`

#### `quiz_attempt_answers`

Stores per-question answers.

Key fields:

- `attempt_id uuid not null`
- `question_id uuid not null`
- `selected_choice_index integer`
- `is_correct boolean`
- `answered_at timestamptz`

#### `review_queue`

Automatically tracks incorrectly answered questions per user.

Key fields:

- `user_id uuid not null`
- `question_id uuid not null`
- `source_attempt_id uuid`
- `added_at timestamptz not null default now()`
- `resolved_at timestamptz`

#### `ai_usage_events`

Stores one row per AI action for daily premium limit enforcement and admin usage counts.

Key fields:

- `user_id uuid not null`
- `feature text not null`: question generation or tutor.
- `created_at timestamptz not null default now()`
- `model text`

Do not store temporary AI tutor chat history in v1.

#### `admin_audit_events`

Records sensitive admin actions.

Examples:

- Approve user.
- Reject user.
- Soft-delete user.
- Restore user.
- Toggle premium.
- Change AI daily limit.
- Create/edit/disable/delete question.

### RLS Direction

Enable Row Level Security on user data tables.

Policy direction:

- Users can read limited own profile fields.
- Users can read active shared questions and public study metadata.
- Users can read/write only their own attempts, answers, review queue, and AI usage records.
- Users can read public leaderboard summaries for approved, non-deleted users.
- Admins can manage profiles, settings, questions, and progress views.
- Soft-deleted users are blocked by app logic after login and excluded from public views.

Use server-side checks for admin pages and privileged mutations. RLS remains the database safety net.

## Study Content

The first content source is the existing Markdown files in `CCA-F/`.

Current source files include:

- `00_Master_Study_Guide.md`
- `00_Master_Study_Guide_zh.md`
- `01_Domain_Agentic_Architecture.md`
- `01_Domain_Agentic_Architecture_zh.md`
- `02_Domain_Claude_Code.md`
- `02_Domain_Claude_Code_zh.md`
- `03_Domain_Tool_Design_MCP.md`
- `03_Domain_Tool_Design_MCP_zh.md`
- `04_Domain_Prompt_Engineering.md`
- `04_Domain_Prompt_Engineering_zh.md`
- `05_Domain_Context_Management.md`
- `05_Domain_Context_Management_zh.md`

V1 content changes happen by editing Markdown files in GitHub and redeploying. A later phase can add internet pull/update workflows.

## Quiz And Question Behavior

Question format:

- Multiple choice.
- Exactly 4 choices.
- Exactly 1 correct answer.
- Bilingual question and explanation when available.

Learning quiz behavior:

- Immediate explanation after each answer.
- Mistakes automatically enter the user's review queue.

Mock exam behavior:

- Follow real CCA-F format as closely as possible.
- 60 questions.
- Domain-weighted selection.
- Timed.
- Explanations after completion.

Question management:

- Admins create, edit, disable, and delete questions in the admin dashboard.
- AI-generated questions go live immediately into the shared question bank.
- Admins can clean up AI-generated questions after publication.

## AI Behavior

AI is optional. If AI environment variables are missing, AI features are disabled and the admin dashboard shows AI is not configured.

Configuration is through environment variables only in v1.

Required conceptual environment variables:

- `AI_PROVIDER`
- `AI_BASE_URL`
- `AI_API_KEY`
- `AI_MODEL`

Premium-only features:

- AI question generation.
- AI chat tutor.

Daily limit:

- Shared across AI question generation and AI tutor.
- Default `25` actions per premium user per day.
- Admin-configurable in the dashboard.
- Enforced through `ai_usage_events`.

Question generation:

- Premium user chooses domain, section, and number of questions.
- AI generates English questions first.
- Generated questions go live immediately into the shared bank.
- Chinese translation is generated automatically when needed and then stored.

AI tutor:

- Premium-only.
- Answers only from current CCA-F study-guide content.
- Does not use general outside knowledge.
- Does not guess.
- If the answer is not supported by the study material, it politely says it does not know from the current study material.
- Chat history is temporary and disappears after the session.

## Email Behavior

Approval/rejection emails are optional.

Supabase's default SMTP is not enough for real user notifications because it is intended for testing and has strict restrictions. V1 supports a free email provider if configured. If no free provider is configured, the app does not send approval/rejection emails and uses login status pages as fallback.

Email provider settings should be environment variables. Do not require a paid provider for v1.

## CI/CD Design

### GitHub

GitHub stores:

- Next.js app code.
- Markdown study guides.
- SQL migrations.
- Generated Supabase TypeScript database types.
- Design and setup documentation.

### Vercel

Use Vercel GitHub integration.

Behavior:

- Production deploys automatically from `main`.
- Default Vercel domain is enough for v1.
- Secrets are configured manually in the Vercel dashboard for v1.
- Later phase can add Vercel CLI/env sync.

### GitHub Actions

Run on push to `main` for v1.

Checks:

- `pnpm lint`
- `pnpm typecheck`
- Generated Supabase types are current.

Include a smoke test script stub in `package.json` for future expansion, but do not require real tests until they exist.

### Supabase Migrations

Use Supabase CLI locally.

Phase one:

- Store ordered SQL migration files in GitHub.
- Apply migrations manually through Supabase CLI or Supabase SQL Editor.
- Commit generated Supabase TypeScript types.

Later phases:

- Validate migrations in CI.
- Add automatic migration deployment from `main` only after backup and rollback practices are clear.

## Beginner Setup Guide

Create a separate beginner guide covering:

- GitHub repo basics.
- Vercel project creation and GitHub integration.
- Supabase project creation.
- Supabase CLI usage.
- Environment variables.
- Manual database migration workflow.
- Row Level Security basics.
- How to create the first admin.
- How to modify Markdown content.
- How to modify database schema safely.
- How CI/CD works in this project.
- Later automation path.

## Error Handling

Expected error states:

- Pending approval.
- Rejected account.
- Soft-deleted account.
- Non-admin attempts to access admin routes.
- AI not configured.
- AI daily limit reached.
- Email provider not configured.
- Not enough active questions for a requested quiz/mock exam.
- Timed exam expired.

The UI should explain what happened in plain language without exposing secrets or internal stack traces.

## Testing And Verification

V1 checks:

- Lint.
- Typecheck.
- Supabase generated types freshness check.

Implementation should later add targeted tests for:

- Auth gating.
- Admin authorization.
- RLS-sensitive data access.
- Quiz scoring.
- Review queue behavior.
- AI daily limit enforcement.
- Soft-delete behavior.

## Later Phases

Likely next phases:

1. Migration validation in CI.
2. Automatic Supabase migration deployment from `main`.
3. Vercel CLI/env sync.
4. Internet pull/update workflow for study content.
5. Payment/subscription integration for premium.
6. OAuth login.
7. More advanced analytics and weak-area adaptive generation.
