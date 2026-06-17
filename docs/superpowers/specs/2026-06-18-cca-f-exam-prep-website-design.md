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
- GitHub Actions lightweight checks on pull requests and `main`.

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

Security boundary:

- Public browser code may use only public environment variables, such as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY`, AI keys, and email provider keys must stay server-only and must never be imported into client components or exposed in browser bundles.

### App Areas

- Public/auth area: sign up, login, pending approval, rejected status, deleted/deactivated status.
- Student area: bilingual study guides, learning quizzes, mock exams, review queue, progress, leaderboard, premium AI tools.
- Admin area: approve/reject/restore users, soft-delete users, toggle premium, manage questions, view progress, configure AI daily limit.

### Visual Direction

The v1 interface uses a modern dark theme with restrained gold accents. The design tone is **Dark Scholarly Command Center**: serious, polished, focused, and optimized for repeated study sessions and exam-prep workflows.

Visual rules:

- Dark theme only for v1.
- Base palette: near-black page background, charcoal panels, muted slate text, soft borders, and gold accents.
- Gold is an accent, not the dominant color. Use it for primary actions, selected navigation, focus rings, score highlights, premium markers, progress emphasis, and important badges.
- Avoid purple/blue gradient SaaS styling and avoid one-note gold/brown dominance.
- Use shadcn/ui with customized dark/gold CSS variables.
- Cards use restrained borders and `8px` radius or less.
- Layouts prioritize scanning and repeated use: side navigation, compact cards, readable tables, quiz panels, and clear state indicators.
- Typography should be clean and serious. Avoid playful, decorative, or marketing-style exam-site presentation.
- The first screen after login should feel like the actual study cockpit, not a landing page.

### Environments

Use one Supabase environment for v1. Choose Vercel and Supabase regions close to Taiwan/Asia if available.

Vercel preview deployments are disabled for v1 unless a separate preview Supabase project is created. Preview deployments pointed at production Supabase would mix test and production users, questions, progress, and admin actions. If previews are later enabled against production data by explicit choice, the preview UI must clearly label that it uses production data and must block admin mutations outside the production deployment.

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

1. User enters email, password, display name, and accepts that display name, progress summary, and leaderboard score are public to approved users.
2. Supabase creates the auth user.
3. Supabase email confirmation runs if enabled for the project.
4. App creates a `profiles` row with `approval_status = pending`.
5. User sees a pending approval page. If email confirmation is required and not complete, the page also explains that email verification is still needed.
6. Admin approves or rejects the request.
7. If a free email provider is configured, the app sends an approval/rejection email.
8. If email is not configured, the user sees status when logging in.

There are two separate gates:

- Supabase Auth email confirmation, represented by Supabase Auth user state.
- Application approval, represented by `profiles.approval_status`.

The app grants full access only when the user is email-confirmed if confirmation is enabled, approved, and not soft-deleted.

Display name rules:

- Required at sign-up.
- Trimmed before storage.
- Length: 3-40 characters.
- Allowed characters: letters, numbers, spaces, underscores, and hyphens.
- Case-insensitive uniqueness among non-deleted users.
- Users cannot change display name in v1.
- Admins can edit display names for moderation.

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
- Duration: 120 minutes.
- Domain-weighted question selection.
- Scoring: one point per correct answer, no penalty for wrong answers, percentage score = correct answers / 60.
- Explanations only after finishing.
- Users can visually pause/resume, but the timed exam deadline keeps counting while away.
- Unfinished attempts remain until completed.
- Users may retake mock exams.

Domain-weighted selection for 60 questions:

| Domain | Weight | Questions |
|---|---:|---:|
| Agentic Architecture & Orchestration | 27% | 16 |
| Claude Code Configuration | 20% | 12 |
| Tool Design & MCP Integration | 18% | 11 |
| Prompt Engineering | 18% | 11 |
| Context Management | 17% | 10 |

Each mock attempt creates an ordered frozen question list at start. Question order and answer choice order are stored for that attempt and do not change if the shared question bank changes later.

### Public Progress And Leaderboard

Approved, non-deleted users appear in public progress and leaderboard views.

Public fields:

- Display name.
- Public progress summary.
- Leaderboard score.

Users cannot opt out in v1, so explicit consent is required during sign-up before the account request is submitted. The leaderboard ranks by best mock exam score.

## Database Design

### Tables

All application tables use `uuid primary key default gen_random_uuid()` unless a different key is specified. User-owned rows reference `profiles(id)` rather than `auth.users(id)` directly, except `profiles.id`.

Use Postgres enum types for controlled fields:

- `app_role`: `student`, `admin`
- `approval_status`: `pending`, `approved`, `rejected`
- `question_status`: `draft`, `pending_review`, `active`, `disabled`
- `quiz_mode`: `learning`, `mock_exam`
- `quiz_attempt_status`: `in_progress`, `completed`, `abandoned`, `expired`
- `ai_feature`: `question_generation`, `tutor`, `translation`

#### `profiles`

One row per Supabase Auth user.

Key fields:

- `id uuid primary key references auth.users(id)`
- `display_name text not null`
- `display_name_normalized text not null`
- `role app_role not null default 'student'`
- `approval_status approval_status not null default 'pending'`
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

Constraints and indexes:

- `check (char_length(display_name) between 3 and 40)`
- unique partial index on `display_name_normalized` where `is_deleted = false`
- `approved_by`, `rejected_by`, and `deleted_by` reference `profiles(id) on delete set null`

Admin safety:

- Dashboard mutations must prevent an admin from soft-deleting, demoting, or rejecting themselves.
- Database triggers or RPCs must prevent removing the last active approved admin.

#### `app_settings`

Stores singleton admin-configurable app settings.

Use a one-row table with a fixed primary key so the app has one typed settings record instead of arbitrary key/value strings.

Suggested fields:

- `id boolean primary key default true`
- `daily_ai_limit integer not null default 25`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraint:

- `check (id = true)`
- `check (daily_ai_limit >= 0)`

This supports type-safe reads and updates from application code.

#### `study_domains`

Stores CCA-F domains, display labels, exam weights, and sort order.

Suggested fields:

- `id uuid primary key default gen_random_uuid()`
- `slug text not null unique`
- `title_en text not null`
- `title_zh text not null`
- `exam_weight numeric not null`
- `mock_question_count integer not null`
- `sort_order integer not null unique`

Constraints:

- `check (exam_weight > 0)`
- `check (mock_question_count > 0)`

#### `study_sections`

Stores sections inside each domain and links them to Markdown source paths.

Suggested fields:

- `id uuid primary key default gen_random_uuid()`
- `domain_id uuid not null references study_domains(id) on delete cascade`
- `slug text not null`
- `title_en text not null`
- `title_zh text not null`
- `source_path_en text not null`
- `source_path_zh text not null`
- `heading_anchor_en text`
- `heading_anchor_zh text`
- `sort_order integer not null`

Constraints:

- unique `(domain_id, slug)`
- unique `(domain_id, sort_order)`

#### `questions`

Shared question bank.

Key behavior:

- Exactly 4 choices.
- Exactly 1 correct answer.
- One primary domain.
- Optional section tag.
- Optional source/reference field.
- Bilingual text and explanation when available.
- `status`: `draft`, `pending_review`, `active`, or `disabled`.
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
- `status question_status not null default 'draft'`
- `generated_by_user_id uuid`
- `generated_at timestamptz`
- `generated_model text`
- `reviewed_by uuid references profiles(id)`
- `reviewed_at timestamptz`

Required constraints:

- `domain_id references study_domains(id) on delete restrict`
- `section_id references study_sections(id) on delete set null`
- `generated_by_user_id references profiles(id) on delete set null`
- `reviewed_by references profiles(id) on delete set null`
- `correct_choice_index between 0 and 3`
- `jsonb_array_length(choices_en) = 4`
- `choices_zh is null or jsonb_array_length(choices_zh) = 4`
- If `status = active`, reviewed AI-generated questions must have `reviewed_by` and `reviewed_at`.

Deletion behavior:

- Prefer `status = disabled` for questions that have attempts.
- Hard delete is allowed only for questions with no attempt references.

#### `quiz_attempts`

Stores learning quiz and mock exam attempts.

Key fields:

- `user_id uuid not null`
- `mode quiz_mode not null`: learning or mock exam.
- `status quiz_attempt_status not null default 'in_progress'`: in_progress, completed, abandoned, or expired.
- `language text not null`
- `started_at timestamptz not null`
- `completed_at timestamptz`
- `timer_deadline timestamptz`
- `score numeric`

Required constraints:

- `user_id references profiles(id) on delete cascade`
- `language in ('en', 'zh')`
- `score is null or (score >= 0 and score <= 100)`
- For mock exams, `timer_deadline` is required and equals `started_at + interval '120 minutes'`.
- For completed attempts, `completed_at` and `score` are required.

#### `quiz_attempt_questions`

Stores the frozen ordered question set for each attempt.

Key fields:

- `id uuid primary key default gen_random_uuid()`
- `attempt_id uuid not null references quiz_attempts(id) on delete cascade`
- `question_id uuid not null references questions(id) on delete restrict`
- `position integer not null`
- `choice_order integer[] not null`
- `question_snapshot jsonb not null`
- `correct_choice_index_snapshot integer not null`
- `created_at timestamptz not null default now()`

Required constraints:

- unique `(attempt_id, position)`
- unique `(attempt_id, question_id)`
- `position >= 1`
- `array_length(choice_order, 1) = 4`
- `correct_choice_index_snapshot between 0 and 3`

For mock exams, exactly 60 `quiz_attempt_questions` rows are created at attempt start. For learning quizzes, the count depends on the selected quiz size.

#### `quiz_attempt_answers`

Stores per-question answers.

Key fields:

- `attempt_id uuid not null`
- `question_id uuid not null`
- `attempt_question_id uuid not null`
- `selected_choice_index integer`
- `is_correct boolean`
- `answered_at timestamptz`

Required constraints:

- `attempt_id references quiz_attempts(id) on delete cascade`
- `attempt_question_id references quiz_attempt_questions(id) on delete cascade`
- `question_id references questions(id) on delete restrict`
- unique `(attempt_question_id)`
- `selected_choice_index between 0 and 3`

Scoring uses the snapshot stored in `quiz_attempt_questions`, not the mutable current question row. This prevents old attempt scoring from changing if an admin later edits the question text, choices, explanation, or correct answer.

#### `review_queue`

Automatically tracks incorrectly answered questions per user.

Key fields:

- `user_id uuid not null`
- `question_id uuid not null`
- `source_attempt_id uuid`
- `added_at timestamptz not null default now()`
- `resolved_at timestamptz`

Required constraints:

- `user_id references profiles(id) on delete cascade`
- `question_id references questions(id) on delete cascade`
- `source_attempt_id references quiz_attempts(id) on delete set null`
- unique `(user_id, question_id)` where `resolved_at is null`

#### `ai_usage_events`

Stores one row per AI action for daily premium limit enforcement and admin usage counts.

Key fields:

- `user_id uuid not null`
- `feature ai_feature not null`: question generation, tutor, or translation.
- `created_at timestamptz not null default now()`
- `model text`

Required constraints:

- `user_id references profiles(id) on delete cascade`

Do not store temporary AI tutor chat history in v1.

Daily limit enforcement must use a database RPC, not a client-side count followed by insert.

RPC behavior:

1. Accept `feature` and optional model metadata.
2. Lock the relevant user/settings scope or otherwise perform an atomic check-and-insert in one transaction.
3. Derive the user from `auth.uid()` inside the function; never accept a caller-supplied `user_id`.
4. Count usage since the start of the current UTC day.
5. Insert a usage row only if the authenticated user is premium, approved, not soft-deleted, and still under the configured daily limit.
6. Return allowed/denied plus remaining count.

Use UTC day boundaries for v1. A later phase can add per-user timezone-aware limits.

#### `admin_audit_events`

Records sensitive admin actions.

Key fields:

- `id uuid primary key default gen_random_uuid()`
- `actor_admin_id uuid references profiles(id) on delete set null`
- `action text not null`
- `target_table text`
- `target_id uuid`
- `metadata jsonb not null default '{}'::jsonb`
- `created_at timestamptz not null default now()`

Actions to record:

- Approve user.
- Reject user.
- Soft-delete user.
- Restore user.
- Toggle premium.
- Change AI daily limit.
- Create/edit/disable/delete question.
- Publish/reject AI-generated question.
- Edit public display name.

Audit rows are append-only. Admins can read them; normal users cannot.

### RLS Direction

Enable Row Level Security on user data tables.

Helper functions:

- `public.current_profile_id()` returns `auth.uid()`.
- `public.is_approved_active_user()` returns true when `auth.uid()` has a profile with `approval_status = approved` and `is_deleted = false`.
- `public.is_admin()` returns true when `auth.uid()` has a profile with `role = admin`, `approval_status = approved`, and `is_deleted = false`.
- `public.is_premium_user()` returns true when the user is approved, active, and premium.

These helper functions should be `security definer`, set a fixed `search_path`, and return false when `auth.uid()` is null.

Policy direction:

- `profiles`: users can read their own profile; approved active users can read public profile fields for approved active users; admins can manage profiles only through controlled server actions/RPCs.
- `app_settings`: approved active users can read non-secret settings; only admins can update.
- `study_domains` and `study_sections`: approved active users can read; admins can manage.
- `questions`: approved active users can read only `active` questions; admins can manage all statuses.
- `quiz_attempts`, `quiz_attempt_questions`, `quiz_attempt_answers`, `review_queue`, and `ai_usage_events`: users can read/write only their own rows and only when `is_approved_active_user()` is true; admins can read for dashboards.
- Public leaderboard view: approved active users can read summary rows for approved, non-deleted users only.
- Soft-deleted users are denied by RLS helper functions, not only blocked by app UI or middleware.

Use server-side checks for admin pages and privileged mutations. RLS remains the database safety net.

Use the service role key only in server-only code paths that need privileged operations, such as admin actions, profile bootstrap, AI/email side effects, or controlled RPC calls. Never expose it to client components.

Use database functions or triggers for high-risk admin mutations:

- Prevent deleting, demoting, or rejecting the current admin user.
- Prevent deleting, demoting, or rejecting the last active approved admin.
- Record an `admin_audit_events` row for each sensitive mutation.

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

Markdown rendering pipeline:

1. Load Markdown from known repo file paths only.
2. Parse Markdown server-side with a maintained Markdown/MDX pipeline.
3. Sanitize rendered HTML or use React-rendered Markdown components that escape raw HTML by default.
4. Disable raw HTML in Markdown unless explicitly sanitized.
5. Allow only expected elements such as headings, paragraphs, lists, links, tables, inline code, and code blocks.
6. Add `rel="noopener noreferrer"` to external links.
7. Route structure: `/study/[domainSlug]` for domain pages and `/study/[domainSlug]/[sectionSlug]` for section pages.

Do not render arbitrary user-submitted Markdown in v1.

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
- Domain-weighted selection using the fixed per-domain counts in this spec.
- Timed for 120 minutes.
- Explanations after completion.
- Frozen attempt question list and answer choice order.

Question management:

- Admins create, edit, disable, and delete questions in the admin dashboard.
- AI-generated questions enter `pending_review` by default.
- Admins review, edit if needed, and publish AI-generated questions by changing status to `active`.
- Learning quizzes and mock exams draw only from `active` questions.

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
- Enforced through an atomic database RPC that writes to `ai_usage_events`.

Question generation:

- Premium user chooses domain, section, and number of questions.
- AI generates English questions first.
- Generated questions are saved as `pending_review` shared-bank drafts.
- Admins publish reviewed generated questions by setting them to `active`.
- Chinese translation is generated automatically when needed and then stored.

AI tutor:

- Premium-only.
- Answers only from current CCA-F study-guide content.
- Does not use general outside knowledge.
- Does not guess.
- If the answer is not supported by the study material, it politely says it does not know from the current study material.
- Chat history is temporary and disappears after the session.

Minimal grounding architecture:

1. Load the current English and Chinese Markdown study-guide files into server-side searchable chunks at build time or startup.
2. Store chunk metadata: source file, heading path, language, and text.
3. For each tutor question, retrieve a small set of relevant chunks from the study-guide corpus before calling the model.
4. Send only those chunks plus strict instructions to the model.
5. Require the model to answer only from retrieved chunks.
6. If no retrieved chunk supports the answer, return the polite "I don't know from the current study material" response.

V1 can use simple lexical search over local Markdown chunks. Vector embeddings can be a later improvement if lexical retrieval is not good enough.

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

Run on pull requests and push to `main` for v1.

Checks:

- `pnpm lint`
- `pnpm typecheck`
- Generated Supabase types are current for the checked-in migration-derived schema.

Do not include a fake smoke test stub. Either omit smoke tests until implemented or add a real smoke test that starts the Next.js app and checks a lightweight `/api/health` endpoint.

Branch protection:

- Require GitHub Actions checks to pass before merging to `main`.
- Require pull requests for changes to `main`; no direct pushes.
- Vercel production deploys from `main` only after merge.
- This prevents broken code from being merged and deployed before CI catches it.

Type freshness check design:

- CI must not depend on the live production Supabase database for v1.
- CI should create or reset a local Supabase/Postgres schema from checked-in migrations, generate TypeScript types from that local schema, and compare the result with the committed generated types.
- If local Supabase is too heavy for the first implementation pass, this check must be staged behind a documented script and not represented as production-DB verification.
- The goal is to prove committed types match committed migrations, not to prove production has already been manually migrated.

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
- Why preview deployments are disabled unless a separate preview Supabase project exists.
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

Error ownership:

| Error state | Detection layer | Behavior |
|---|---|---|
| Pending approval | middleware/server route guard | redirect to pending page, HTTP 200 |
| Email not confirmed | middleware/server route guard | redirect to verify-email page, HTTP 200 |
| Rejected account | middleware/server route guard | redirect to rejected page, HTTP 200 |
| Soft-deleted account | middleware/server route guard plus RLS helpers | redirect to deactivated page, HTTP 200 |
| Non-admin admin route access | middleware/server action plus RLS | return 404 or redirect to app home; do not leak admin data |
| AI not configured | server action | return typed disabled result, HTTP 200 |
| AI daily limit reached | database RPC | return typed limit result, HTTP 429 for API route or inline UI state for server action |
| Email provider not configured | server action | skip send, record audit/status, HTTP 200 |
| Not enough active questions | server action/RPC | block attempt creation with actionable UI message |
| Timed exam expired | server action/RPC when loading/submitting attempt | mark attempt `expired`, show expired state |

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
