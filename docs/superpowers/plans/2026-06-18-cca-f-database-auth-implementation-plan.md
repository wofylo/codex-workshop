# CCA-F Database Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the database and authentication foundation for the CCA-F exam prep app: Supabase schema migrations, RLS helpers and policies, generated database types, email/password auth pages, profile bootstrap, account status gates, approved-user route guards, admin route guards, and first-admin setup docs.

**Architecture:** Supabase Auth remains the identity source, while `public.profiles` stores application role, approval, premium, and soft-delete state. Database safety is enforced with RLS helper functions and policies, and the Next.js app adds server-side guards for account status and admin access. This phase creates minimal authenticated pages only to prove the gates work; study content rendering, quiz flows, admin question management, AI, email notifications, and rich dashboards stay out of scope.

**Tech Stack:** Next.js App Router, React Server Components, server actions, TypeScript, Supabase Auth, Supabase Postgres, Row Level Security, pnpm, Zod, Tailwind CSS, shadcn/ui-compatible components.

## Global Constraints

- App framework: Next.js with React and TypeScript.
- UI: shadcn/ui and Tailwind CSS.
- Package manager: pnpm.
- Auth and database: Supabase Auth and Supabase Postgres.
- Hosting: Vercel.
- Source control and CI: GitHub and GitHub Actions.
- Public browser code may use only public environment variables.
- `SUPABASE_SECRET_KEY`, AI keys, and email provider keys must stay server-only and must never be imported into client components or exposed in browser bundles.
- Use one Supabase environment for v1.
- Vercel preview deployments are disabled for v1 unless a separate preview Supabase project is created.
- Email/password auth only for v1.
- New users start with `approval_status = 'pending'`.
- Full app access requires an authenticated user with an approved, non-deleted profile.
- Admin routes and privileged data are protected server-side, not only hidden in navigation.
- Soft-deleted users are blocked by app guards and RLS helper functions.
- The first admin is created manually in Supabase for v1.
- Study content rendering, quiz flows, admin question management, AI, and email delivery are outside this phase.
- Visual direction: Dark Scholarly Command Center. Use dark theme only for v1, near-black background, charcoal panels, muted slate text, soft borders, and restrained gold accents.

---

## File Structure

- `supabase/config.toml`: local Supabase project configuration used by CLI commands.
- `supabase/migrations/202606180001_auth_core_schema.sql`: enums, tables, constraints, indexes, triggers, and seed rows for the database/auth foundation.
- `supabase/migrations/202606180002_auth_rls_policies.sql`: RLS helper functions and table policies.
- `src/lib/supabase/database.types.ts`: generated Supabase TypeScript types from the migration-derived schema.
- `src/lib/auth/display-name.ts`: display-name normalization and validation shared by signup and tests.
- `src/lib/auth/profiles.ts`: typed profile lookup helpers for server guards.
- `src/lib/auth/guards.ts`: server-side auth, approved-user, and admin guard functions.
- `src/app/auth/actions.ts`: server actions for signup, login, and logout.
- `src/app/auth/sign-up/page.tsx`: signup form page.
- `src/app/auth/login/page.tsx`: login form page.
- `src/app/auth/pending/page.tsx`: pending approval page.
- `src/app/auth/rejected/page.tsx`: rejected account page.
- `src/app/auth/deactivated/page.tsx`: soft-deleted account page.
- `src/app/auth/verify-email/page.tsx`: email confirmation status page.
- `src/app/auth/error/page.tsx`: safe generic auth error page.
- `src/app/dashboard/page.tsx`: minimal approved-user gated page.
- `src/app/admin/page.tsx`: minimal admin gated page.
- `src/proxy.ts`: route guard integration after Supabase cookie refresh.
- `docs/deployment/foundation.md`: add database/auth setup and first-admin instructions.
- `package.json`: add database type generation/check scripts.

---

### Task 1: Add Supabase CLI Project Files And Core Schema Migration

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/202606180001_auth_core_schema.sql`

**Interfaces:**
- Consumes: Supabase project from the user setup guide.
- Produces: application tables, enum types, updated-at trigger, last-admin protection trigger, seeded `app_settings`, and seeded study domains/sections.

- [ ] **Step 1: Create the Supabase config file**

Write `supabase/config.toml`:

```toml
project_id = "cca-f-exam-prep"

[api]
enabled = true
port = 54321
schemas = ["public", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 17

[studio]
enabled = true
port = 54323

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000"]
jwt_expiry = 3600
enable_signup = true

[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false
secure_password_change = true
```

- [ ] **Step 2: Create the core schema migration**

Write `supabase/migrations/202606180001_auth_core_schema.sql`:

```sql
create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum ('student', 'admin');
create type public.approval_status as enum ('pending', 'approved', 'rejected');
create type public.question_status as enum ('draft', 'pending_review', 'active', 'disabled');
create type public.quiz_mode as enum ('learning', 'mock_exam');
create type public.quiz_attempt_status as enum ('in_progress', 'completed', 'abandoned', 'expired');
create type public.ai_feature as enum ('question_generation', 'tutor', 'translation');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  display_name_normalized text not null,
  role public.app_role not null default 'student',
  approval_status public.approval_status not null default 'pending',
  is_premium boolean not null default false,
  is_deleted boolean not null default false,
  approved_at timestamptz,
  approved_by uuid references public.profiles(id) on delete set null,
  rejected_at timestamptz,
  rejected_by uuid references public.profiles(id) on delete set null,
  deleted_at timestamptz,
  deleted_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (char_length(display_name) between 3 and 40),
  constraint profiles_display_name_normalized_not_blank check (display_name_normalized = lower(btrim(display_name))),
  constraint profiles_approval_metadata check (
    (approval_status = 'approved' and approved_at is not null)
    or approval_status <> 'approved'
  ),
  constraint profiles_deleted_metadata check (
    (is_deleted = true and deleted_at is not null)
    or is_deleted = false
  )
);

create unique index profiles_display_name_active_unique
  on public.profiles (display_name_normalized)
  where is_deleted = false;

create index profiles_approval_status_idx on public.profiles (approval_status);
create index profiles_role_idx on public.profiles (role);

create table public.app_settings (
  id boolean primary key default true,
  daily_ai_limit integer not null default 25,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id = true),
  constraint app_settings_daily_ai_limit_nonnegative check (daily_ai_limit >= 0)
);

create table public.study_domains (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_en text not null,
  title_zh text not null,
  exam_weight numeric not null,
  mock_question_count integer not null,
  sort_order integer not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_domains_exam_weight_positive check (exam_weight > 0),
  constraint study_domains_mock_question_count_positive check (mock_question_count > 0)
);

create table public.study_sections (
  id uuid primary key default gen_random_uuid(),
  domain_id uuid not null references public.study_domains(id) on delete cascade,
  slug text not null,
  title_en text not null,
  title_zh text not null,
  source_path_en text not null,
  source_path_zh text not null,
  heading_anchor_en text,
  heading_anchor_zh text,
  sort_order integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_sections_domain_slug_unique unique (domain_id, slug),
  constraint study_sections_domain_sort_unique unique (domain_id, sort_order)
);

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  question_en text not null,
  question_zh text,
  choices_en jsonb not null,
  choices_zh jsonb,
  correct_choice_index integer not null,
  explanation_en text not null,
  explanation_zh text,
  domain_id uuid not null references public.study_domains(id) on delete restrict,
  section_id uuid references public.study_sections(id) on delete set null,
  source_reference text,
  status public.question_status not null default 'draft',
  generated_by_user_id uuid references public.profiles(id) on delete set null,
  generated_at timestamptz,
  generated_model text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint questions_correct_choice_index_range check (correct_choice_index between 0 and 3),
  constraint questions_choices_en_length check (jsonb_array_length(choices_en) = 4),
  constraint questions_choices_zh_length check (choices_zh is null or jsonb_array_length(choices_zh) = 4),
  constraint questions_active_generated_reviewed check (
    status <> 'active'
    or generated_by_user_id is null
    or (reviewed_by is not null and reviewed_at is not null)
  )
);

create index questions_domain_status_idx on public.questions (domain_id, status);
create index questions_section_status_idx on public.questions (section_id, status);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mode public.quiz_mode not null,
  status public.quiz_attempt_status not null default 'in_progress',
  language text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  timer_deadline timestamptz,
  score numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quiz_attempts_language_check check (language in ('en', 'zh')),
  constraint quiz_attempts_score_range check (score is null or (score >= 0 and score <= 100)),
  constraint quiz_attempts_mock_deadline_required check (mode <> 'mock_exam' or timer_deadline is not null),
  constraint quiz_attempts_completed_requires_score check (
    status <> 'completed'
    or (completed_at is not null and score is not null)
  )
);

create index quiz_attempts_user_status_idx on public.quiz_attempts (user_id, status);

create table public.quiz_attempt_questions (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  position integer not null,
  choice_order integer[] not null,
  question_snapshot jsonb not null,
  correct_choice_index_snapshot integer not null,
  created_at timestamptz not null default now(),
  constraint quiz_attempt_questions_attempt_position_unique unique (attempt_id, position),
  constraint quiz_attempt_questions_attempt_question_unique unique (attempt_id, question_id),
  constraint quiz_attempt_questions_position_positive check (position >= 1),
  constraint quiz_attempt_questions_choice_order_length check (array_length(choice_order, 1) = 4),
  constraint quiz_attempt_questions_correct_snapshot_range check (correct_choice_index_snapshot between 0 and 3)
);

create table public.quiz_attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  attempt_question_id uuid not null references public.quiz_attempt_questions(id) on delete cascade,
  selected_choice_index integer,
  is_correct boolean,
  answered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quiz_attempt_answers_attempt_question_unique unique (attempt_question_id),
  constraint quiz_attempt_answers_selected_choice_range check (
    selected_choice_index is null or selected_choice_index between 0 and 3
  )
);

create table public.review_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  source_attempt_id uuid references public.quiz_attempts(id) on delete set null,
  added_at timestamptz not null default now(),
  resolved_at timestamptz
);

create unique index review_queue_active_unique
  on public.review_queue (user_id, question_id)
  where resolved_at is null;

create table public.ai_usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  feature public.ai_feature not null,
  model text,
  created_at timestamptz not null default now()
);

create index ai_usage_events_user_created_idx on public.ai_usage_events (user_id, created_at desc);

create table public.admin_audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_admin_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger app_settings_set_updated_at before update on public.app_settings
  for each row execute function public.set_updated_at();
create trigger study_domains_set_updated_at before update on public.study_domains
  for each row execute function public.set_updated_at();
create trigger study_sections_set_updated_at before update on public.study_sections
  for each row execute function public.set_updated_at();
create trigger questions_set_updated_at before update on public.questions
  for each row execute function public.set_updated_at();
create trigger quiz_attempts_set_updated_at before update on public.quiz_attempts
  for each row execute function public.set_updated_at();
create trigger quiz_attempt_answers_set_updated_at before update on public.quiz_attempt_answers
  for each row execute function public.set_updated_at();

create function public.prevent_last_active_admin_loss()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_admin_count integer;
begin
  if old.role = 'admin'
    and old.approval_status = 'approved'
    and old.is_deleted = false
    and (new.role <> 'admin' or new.approval_status <> 'approved' or new.is_deleted = true)
  then
    select count(*)
    into active_admin_count
    from public.profiles
    where role = 'admin'
      and approval_status = 'approved'
      and is_deleted = false
      and id <> old.id;

    if active_admin_count = 0 then
      raise exception 'Cannot remove the last active approved admin';
    end if;
  end if;

  return new;
end;
$$;

create trigger profiles_prevent_last_active_admin_loss
  before update of role, approval_status, is_deleted on public.profiles
  for each row execute function public.prevent_last_active_admin_loss();

insert into public.app_settings (id, daily_ai_limit)
values (true, 25)
on conflict (id) do nothing;

insert into public.study_domains (slug, title_en, title_zh, exam_weight, mock_question_count, sort_order)
values
  ('agentic-architecture-orchestration', 'Agentic Architecture & Orchestration', 'Agentic Architecture & Orchestration', 27, 16, 1),
  ('claude-code-configuration', 'Claude Code Configuration', 'Claude Code Configuration', 20, 12, 2),
  ('tool-design-mcp-integration', 'Tool Design & MCP Integration', 'Tool Design & MCP Integration', 18, 11, 3),
  ('prompt-engineering', 'Prompt Engineering', 'Prompt Engineering', 18, 11, 4),
  ('context-management', 'Context Management', 'Context Management', 17, 10, 5)
on conflict (slug) do nothing;

insert into public.study_sections (
  domain_id,
  slug,
  title_en,
  title_zh,
  source_path_en,
  source_path_zh,
  sort_order
)
select id, slug, title_en, title_zh, source_path_en, source_path_zh, sort_order
from (
  values
    ('agentic-architecture-orchestration', 'overview', 'Agentic Architecture & Orchestration', 'Agentic Architecture & Orchestration', 'CCA-F/01_Domain_Agentic_Architecture.md', 'CCA-F/01_Domain_Agentic_Architecture_zh.md', 1),
    ('claude-code-configuration', 'overview', 'Claude Code Configuration', 'Claude Code Configuration', 'CCA-F/02_Domain_Claude_Code.md', 'CCA-F/02_Domain_Claude_Code_zh.md', 1),
    ('tool-design-mcp-integration', 'overview', 'Tool Design & MCP Integration', 'Tool Design & MCP Integration', 'CCA-F/03_Domain_Tool_Design_MCP.md', 'CCA-F/03_Domain_Tool_Design_MCP_zh.md', 1),
    ('prompt-engineering', 'overview', 'Prompt Engineering', 'Prompt Engineering', 'CCA-F/04_Domain_Prompt_Engineering.md', 'CCA-F/04_Domain_Prompt_Engineering_zh.md', 1),
    ('context-management', 'overview', 'Context Management', 'Context Management', 'CCA-F/05_Domain_Context_Management.md', 'CCA-F/05_Domain_Context_Management_zh.md', 1)
) as section_seed(domain_slug, slug, title_en, title_zh, source_path_en, source_path_zh, sort_order)
join public.study_domains on study_domains.slug = section_seed.domain_slug
on conflict (domain_id, slug) do nothing;
```

- [ ] **Step 3: Apply the migration locally**

Run:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm dlx supabase@latest db reset
```

Expected:

```text
Finished supabase db reset
```

- [ ] **Step 4: Commit the schema migration**

Run:

```powershell
git add supabase/config.toml supabase/migrations/202606180001_auth_core_schema.sql
git commit -m "feat: add auth database schema"
```

Expected:

```text
Commit created.
```

### Task 2: Add RLS Helpers And Policies

**Files:**
- Create: `supabase/migrations/202606180002_auth_rls_policies.sql`

**Interfaces:**
- Consumes: tables from Task 1 and Supabase Auth JWT state.
- Produces:
  - `public.current_profile_id() returns uuid`
  - `public.is_approved_active_user() returns boolean`
  - `public.is_admin() returns boolean`
  - `public.is_premium_user() returns boolean`
  - RLS policies that block soft-deleted and unapproved users from app data.

- [ ] **Step 1: Create the RLS migration**

Write `supabase/migrations/202606180002_auth_rls_policies.sql`:

```sql
create function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid();
$$;

create function public.is_approved_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and approval_status = 'approved'
        and is_deleted = false
    ),
    false
  );
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and role = 'admin'
        and approval_status = 'approved'
        and is_deleted = false
    ),
    false
  );
$$;

create function public.is_premium_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    exists (
      select 1
      from public.profiles
      where id = auth.uid()
        and approval_status = 'approved'
        and is_deleted = false
        and is_premium = true
    ),
    false
  );
$$;

alter table public.profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.study_domains enable row level security;
alter table public.study_sections enable row level security;
alter table public.questions enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_attempt_questions enable row level security;
alter table public.quiz_attempt_answers enable row level security;
alter table public.review_queue enable row level security;
alter table public.ai_usage_events enable row level security;
alter table public.admin_audit_events enable row level security;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "profiles_select_public_approved"
on public.profiles for select
to authenticated
using (
  public.is_approved_active_user()
  and approval_status = 'approved'
  and is_deleted = false
);

create policy "profiles_insert_own_pending"
on public.profiles for insert
to authenticated
with check (
  id = auth.uid()
  and role = 'student'
  and approval_status = 'pending'
  and is_deleted = false
);

create policy "profiles_admin_all"
on public.profiles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "app_settings_select_approved"
on public.app_settings for select
to authenticated
using (public.is_approved_active_user());

create policy "app_settings_admin_all"
on public.app_settings for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "study_domains_select_approved"
on public.study_domains for select
to authenticated
using (public.is_approved_active_user());

create policy "study_domains_admin_all"
on public.study_domains for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "study_sections_select_approved"
on public.study_sections for select
to authenticated
using (public.is_approved_active_user());

create policy "study_sections_admin_all"
on public.study_sections for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "questions_select_active_approved"
on public.questions for select
to authenticated
using (public.is_approved_active_user() and status = 'active');

create policy "questions_admin_all"
on public.questions for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "quiz_attempts_owner_all"
on public.quiz_attempts for all
to authenticated
using (public.is_approved_active_user() and user_id = auth.uid())
with check (public.is_approved_active_user() and user_id = auth.uid());

create policy "quiz_attempts_admin_select"
on public.quiz_attempts for select
to authenticated
using (public.is_admin());

create policy "quiz_attempt_questions_owner_all"
on public.quiz_attempt_questions for all
to authenticated
using (
  public.is_approved_active_user()
  and exists (
    select 1 from public.quiz_attempts
    where quiz_attempts.id = quiz_attempt_questions.attempt_id
      and quiz_attempts.user_id = auth.uid()
  )
)
with check (
  public.is_approved_active_user()
  and exists (
    select 1 from public.quiz_attempts
    where quiz_attempts.id = quiz_attempt_questions.attempt_id
      and quiz_attempts.user_id = auth.uid()
  )
);

create policy "quiz_attempt_questions_admin_select"
on public.quiz_attempt_questions for select
to authenticated
using (public.is_admin());

create policy "quiz_attempt_answers_owner_all"
on public.quiz_attempt_answers for all
to authenticated
using (
  public.is_approved_active_user()
  and exists (
    select 1 from public.quiz_attempts
    where quiz_attempts.id = quiz_attempt_answers.attempt_id
      and quiz_attempts.user_id = auth.uid()
  )
)
with check (
  public.is_approved_active_user()
  and exists (
    select 1 from public.quiz_attempts
    where quiz_attempts.id = quiz_attempt_answers.attempt_id
      and quiz_attempts.user_id = auth.uid()
  )
);

create policy "quiz_attempt_answers_admin_select"
on public.quiz_attempt_answers for select
to authenticated
using (public.is_admin());

create policy "review_queue_owner_all"
on public.review_queue for all
to authenticated
using (public.is_approved_active_user() and user_id = auth.uid())
with check (public.is_approved_active_user() and user_id = auth.uid());

create policy "review_queue_admin_select"
on public.review_queue for select
to authenticated
using (public.is_admin());

create policy "ai_usage_events_owner_insert"
on public.ai_usage_events for insert
to authenticated
with check (public.is_premium_user() and user_id = auth.uid());

create policy "ai_usage_events_owner_select"
on public.ai_usage_events for select
to authenticated
using (public.is_premium_user() and user_id = auth.uid());

create policy "ai_usage_events_admin_select"
on public.ai_usage_events for select
to authenticated
using (public.is_admin());

create policy "admin_audit_events_admin_select"
on public.admin_audit_events for select
to authenticated
using (public.is_admin());
```

- [ ] **Step 2: Reset the local database and verify policies apply**

Run:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm dlx supabase@latest db reset
```

Expected:

```text
Finished supabase db reset
```

- [ ] **Step 3: Commit the RLS migration**

Run:

```powershell
git add supabase/migrations/202606180002_auth_rls_policies.sql
git commit -m "feat: add auth RLS policies"
```

Expected:

```text
Commit created.
```

### Task 3: Generate Database Types And Add Type Freshness Scripts

**Files:**
- Modify: `src/lib/supabase/database.types.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: migrations from Tasks 1 and 2.
- Produces:
  - typed `Database["public"]["Tables"]["profiles"]`
  - `pnpm db:types` for regenerating types from the local Supabase database
  - `pnpm db:types:check` for CI/local freshness checks.

- [ ] **Step 1: Add package scripts**

Run:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm pkg set scripts.db:types="supabase gen types typescript --local --schema public > src/lib/supabase/database.types.ts"
corepack pnpm pkg set scripts.db:types:check="git diff --exit-code -- src/lib/supabase/database.types.ts"
```

Expected:

```text
No command errors.
```

- [ ] **Step 2: Generate database types**

Run:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm dlx supabase@latest gen types typescript --local --schema public > src/lib/supabase/database.types.ts
```

Expected:

```text
src/lib/supabase/database.types.ts contains typed public Tables, Functions, and Enums.
```

- [ ] **Step 3: Run TypeScript verification**

Run:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm typecheck
```

Expected:

```text
Command exits 0.
```

- [ ] **Step 4: Commit generated types**

Run:

```powershell
git add package.json src/lib/supabase/database.types.ts
git commit -m "chore: generate Supabase database types"
```

Expected:

```text
Commit created.
```

### Task 4: Add Auth Domain Helpers And Server Guards

**Files:**
- Create: `src/lib/auth/display-name.ts`
- Create: `src/lib/auth/profiles.ts`
- Create: `src/lib/auth/guards.ts`

**Interfaces:**
- Consumes:
  - `createServerSupabaseClient()` from `src/lib/supabase/server.ts`
  - generated database types from Task 3.
- Produces:
  - `normalizeDisplayName(displayName: string): string`
  - `validateDisplayName(displayName: string): { ok: true; value: string; normalized: string } | { ok: false; message: string }`
  - `getCurrentProfile(): Promise<AuthProfileResult>`
  - `requireApprovedUser(): Promise<ApprovedProfile>`
  - `requireAdmin(): Promise<ApprovedProfile>`
  - `getAccountRedirectPath(profile: ApprovedProfile | ProfileRow | null, emailConfirmed: boolean): string | null`

- [ ] **Step 1: Create display-name validation**

Write `src/lib/auth/display-name.ts`:

```ts
const DISPLAY_NAME_PATTERN = /^[\p{L}\p{N} _-]+$/u;

export type DisplayNameValidationResult =
  | { ok: true; value: string; normalized: string }
  | { ok: false; message: string };

export function normalizeDisplayName(displayName: string) {
  return displayName.trim().replace(/\s+/g, " ").toLowerCase();
}

export function validateDisplayName(displayName: string): DisplayNameValidationResult {
  const value = displayName.trim().replace(/\s+/g, " ");

  if (value.length < 3 || value.length > 40) {
    return { ok: false, message: "Display name must be 3-40 characters." };
  }

  if (!DISPLAY_NAME_PATTERN.test(value)) {
    return {
      ok: false,
      message: "Display name may use letters, numbers, spaces, underscores, and hyphens.",
    };
  }

  return {
    ok: true,
    value,
    normalized: normalizeDisplayName(value),
  };
}
```

- [ ] **Step 2: Create profile lookup helpers**

Write `src/lib/auth/profiles.ts`:

```ts
import "server-only";
import type { User } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ApprovedProfile = ProfileRow & {
  approval_status: "approved";
  is_deleted: false;
};

export type AuthProfileResult = {
  user: User | null;
  profile: ProfileRow | null;
};

export async function getCurrentProfile(): Promise<AuthProfileResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile };
}

export function isEmailConfirmed(user: User | null) {
  if (!user) {
    return false;
  }

  return Boolean(user.email_confirmed_at || user.confirmed_at);
}

export function getAccountRedirectPath(
  profile: ProfileRow | null,
  emailConfirmed: boolean,
) {
  if (!profile) {
    return "/auth/pending";
  }

  if (!emailConfirmed) {
    return "/auth/verify-email";
  }

  if (profile.is_deleted) {
    return "/auth/deactivated";
  }

  if (profile.approval_status === "pending") {
    return "/auth/pending";
  }

  if (profile.approval_status === "rejected") {
    return "/auth/rejected";
  }

  return null;
}
```

- [ ] **Step 3: Create route guard helpers**

Write `src/lib/auth/guards.ts`:

```ts
import "server-only";
import { notFound, redirect } from "next/navigation";
import {
  getAccountRedirectPath,
  getCurrentProfile,
  isEmailConfirmed,
  type ApprovedProfile,
} from "@/lib/auth/profiles";

export async function requireApprovedUser(): Promise<ApprovedProfile> {
  const { user, profile } = await getCurrentProfile();

  if (!user) {
    redirect("/auth/login");
  }

  const redirectPath = getAccountRedirectPath(profile, isEmailConfirmed(user));
  if (redirectPath) {
    redirect(redirectPath);
  }

  return profile as ApprovedProfile;
}

export async function requireAdmin(): Promise<ApprovedProfile> {
  const profile = await requireApprovedUser();

  if (profile.role !== "admin") {
    notFound();
  }

  return profile;
}
```

- [ ] **Step 4: Run typecheck**

Run:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm typecheck
```

Expected:

```text
Command exits 0.
```

- [ ] **Step 5: Commit auth helpers**

Run:

```powershell
git add src/lib/auth/display-name.ts src/lib/auth/profiles.ts src/lib/auth/guards.ts
git commit -m "feat: add auth guard helpers"
```

Expected:

```text
Commit created.
```

### Task 5: Add Signup, Login, Logout, And Account Status Pages

**Files:**
- Create: `src/app/auth/actions.ts`
- Create: `src/app/auth/sign-up/page.tsx`
- Create: `src/app/auth/login/page.tsx`
- Create: `src/app/auth/pending/page.tsx`
- Create: `src/app/auth/rejected/page.tsx`
- Create: `src/app/auth/deactivated/page.tsx`
- Create: `src/app/auth/verify-email/page.tsx`
- Create: `src/app/auth/error/page.tsx`

**Interfaces:**
- Consumes:
  - `validateDisplayName()` from Task 4.
  - `createServerSupabaseClient()` from foundation.
  - `profiles_insert_own_pending` RLS policy from Task 2.
- Produces:
  - `signUpAction(formData: FormData): Promise<void>`
  - `loginAction(formData: FormData): Promise<void>`
  - `logoutAction(): Promise<void>`

- [ ] **Step 1: Create auth server actions**

Write `src/app/auth/actions.ts`:

```ts
"use server";

import { redirect } from "next/navigation";
import { validateDisplayName } from "@/lib/auth/display-name";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function signUpAction(formData: FormData) {
  const email = getString(formData, "email").trim();
  const password = getString(formData, "password");
  const consent = getString(formData, "public_consent");
  const displayName = validateDisplayName(getString(formData, "display_name"));

  if (!email || !password || !displayName.ok || consent !== "on") {
    redirect("/auth/error?reason=signup");
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error || !data.user) {
    redirect("/auth/error?reason=signup");
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    display_name: displayName.value,
    display_name_normalized: displayName.normalized,
  });

  if (profileError) {
    redirect("/auth/error?reason=profile");
  }

  redirect("/auth/pending");
}

export async function loginAction(formData: FormData) {
  const email = getString(formData, "email").trim();
  const password = getString(formData, "password");
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect("/auth/error?reason=login");
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
```

- [ ] **Step 2: Create signup page**

Write `src/app/auth/sign-up/page.tsx`:

```tsx
import Link from "next/link";
import { signUpAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 py-12 text-foreground">
      <Card className="w-full max-w-md rounded-lg border-border bg-card">
        <CardHeader>
          <CardTitle>Request access</CardTitle>
          <CardDescription>
            Create an account for admin approval before entering the study cockpit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signUpAction} className="space-y-4">
            <label className="block space-y-2 text-sm">
              <span>Email</span>
              <input className="w-full rounded-md border border-input bg-background px-3 py-2" name="email" type="email" required />
            </label>
            <label className="block space-y-2 text-sm">
              <span>Password</span>
              <input className="w-full rounded-md border border-input bg-background px-3 py-2" name="password" type="password" minLength={8} required />
            </label>
            <label className="block space-y-2 text-sm">
              <span>Display name</span>
              <input className="w-full rounded-md border border-input bg-background px-3 py-2" name="display_name" minLength={3} maxLength={40} required />
            </label>
            <label className="flex gap-3 text-sm text-muted-foreground">
              <input className="mt-1" name="public_consent" type="checkbox" required />
              <span>I understand my display name, progress summary, and leaderboard score will be visible to approved users.</span>
            </label>
            <Button className="w-full" type="submit">Create account</Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            Already approved? <Link className="text-primary underline-offset-4 hover:underline" href="/auth/login">Sign in</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
```

- [ ] **Step 3: Create login page**

Write `src/app/auth/login/page.tsx`:

```tsx
import Link from "next/link";
import { loginAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-6 py-12 text-foreground">
      <Card className="w-full max-w-md rounded-lg border-border bg-card">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Use the email and password from your access request.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={loginAction} className="space-y-4">
            <label className="block space-y-2 text-sm">
              <span>Email</span>
              <input className="w-full rounded-md border border-input bg-background px-3 py-2" name="email" type="email" required />
            </label>
            <label className="block space-y-2 text-sm">
              <span>Password</span>
              <input className="w-full rounded-md border border-input bg-background px-3 py-2" name="password" type="password" required />
            </label>
            <Button className="w-full" type="submit">Sign in</Button>
          </form>
          <p className="mt-4 text-sm text-muted-foreground">
            Need access? <Link className="text-primary underline-offset-4 hover:underline" href="/auth/sign-up">Request an account</Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
```

- [ ] **Step 4: Create status pages**

Write each status page with the same shell and the listed copy.

`src/app/auth/pending/page.tsx`:

```tsx
export default function PendingPage() {
  return <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center px-6 text-foreground"><h1 className="text-3xl font-semibold">Approval pending</h1><p className="mt-4 text-muted-foreground">Your account request was received. An admin must approve it before you can enter the study cockpit.</p></main>;
}
```

`src/app/auth/rejected/page.tsx`:

```tsx
export default function RejectedPage() {
  return <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center px-6 text-foreground"><h1 className="text-3xl font-semibold">Access not approved</h1><p className="mt-4 text-muted-foreground">This account request was rejected. Contact an admin if you believe this is incorrect.</p></main>;
}
```

`src/app/auth/deactivated/page.tsx`:

```tsx
export default function DeactivatedPage() {
  return <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center px-6 text-foreground"><h1 className="text-3xl font-semibold">Account deactivated</h1><p className="mt-4 text-muted-foreground">This account is no longer active and cannot access the app.</p></main>;
}
```

`src/app/auth/verify-email/page.tsx`:

```tsx
export default function VerifyEmailPage() {
  return <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center px-6 text-foreground"><h1 className="text-3xl font-semibold">Verify your email</h1><p className="mt-4 text-muted-foreground">Confirm your email address, then sign in again. App approval is separate from email verification.</p></main>;
}
```

`src/app/auth/error/page.tsx`:

```tsx
import Link from "next/link";

export default function AuthErrorPage() {
  return <main className="mx-auto flex min-h-svh max-w-xl flex-col justify-center px-6 text-foreground"><h1 className="text-3xl font-semibold">Authentication problem</h1><p className="mt-4 text-muted-foreground">The request could not be completed. Check your details and try again.</p><Link className="mt-6 text-primary underline-offset-4 hover:underline" href="/auth/login">Return to sign in</Link></main>;
}
```

- [ ] **Step 5: Run lint and typecheck**

Run:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm lint
corepack pnpm typecheck
```

Expected:

```text
Both commands exit 0.
```

- [ ] **Step 6: Commit auth pages and actions**

Run:

```powershell
git add src/app/auth
git commit -m "feat: add email password auth pages"
```

Expected:

```text
Commit created.
```

### Task 6: Add Approved User And Admin Route Guards

**Files:**
- Create: `src/app/dashboard/page.tsx`
- Create: `src/app/admin/page.tsx`
- Modify: `src/proxy.ts`

**Interfaces:**
- Consumes:
  - `requireApprovedUser()` from Task 4.
  - `requireAdmin()` from Task 4.
  - `updateSession(request: NextRequest)` from foundation.
- Produces:
  - `/dashboard` redirects unauthenticated users to `/auth/login`.
  - `/dashboard` redirects pending, rejected, deactivated, and unconfirmed users to status pages.
  - `/admin` returns 404 for non-admin approved users.

- [ ] **Step 1: Create minimal approved dashboard page**

Write `src/app/dashboard/page.tsx`:

```tsx
import { logoutAction } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { requireApprovedUser } from "@/lib/auth/guards";

export default async function DashboardPage() {
  const profile = await requireApprovedUser();

  return (
    <main className="mx-auto flex min-h-svh max-w-4xl flex-col justify-center px-6 text-foreground">
      <p className="text-sm uppercase tracking-[0.18em] text-primary">Study cockpit</p>
      <h1 className="mt-4 text-4xl font-semibold">Welcome, {profile.display_name}</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Your approved account can enter protected app routes. Study guides, quizzes, and progress arrive in later phases.
      </p>
      <form action={logoutAction} className="mt-8">
        <Button type="submit" variant="outline">Sign out</Button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Create minimal admin page**

Write `src/app/admin/page.tsx`:

```tsx
import { requireAdmin } from "@/lib/auth/guards";

export default async function AdminPage() {
  const profile = await requireAdmin();

  return (
    <main className="mx-auto flex min-h-svh max-w-4xl flex-col justify-center px-6 text-foreground">
      <p className="text-sm uppercase tracking-[0.18em] text-primary">Admin</p>
      <h1 className="mt-4 text-4xl font-semibold">Admin access verified</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        {profile.display_name} can enter admin-only routes. User management and question management arrive in later phases.
      </p>
    </main>
  );
}
```

- [ ] **Step 3: Keep proxy focused on auth cookie refresh**

Ensure `src/proxy.ts` still has this content:

```ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 4: Run lint and typecheck**

Run:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm lint
corepack pnpm typecheck
```

Expected:

```text
Both commands exit 0.
```

- [ ] **Step 5: Commit guarded pages**

Run:

```powershell
git add src/app/dashboard/page.tsx src/app/admin/page.tsx src/proxy.ts
git commit -m "feat: add protected route guard pages"
```

Expected:

```text
Commit created.
```

### Task 7: Document Manual Migration And First Admin Setup

**Files:**
- Modify: `docs/deployment/foundation.md`

**Interfaces:**
- Consumes: migrations and auth flows from Tasks 1-6.
- Produces: beginner-safe instructions for applying migrations, creating a first admin, and verifying auth gates.

- [ ] **Step 1: Append database/auth setup instructions**

Append this section to `docs/deployment/foundation.md`:

````markdown

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
3. Open Supabase Table Editor or SQL Editor.
4. Find the matching row in `public.profiles`.
5. Set:

```sql
update public.profiles
set
  role = 'admin',
  approval_status = 'approved',
  approved_at = now(),
  approved_by = id
where display_name_normalized = lower('YOUR DISPLAY NAME');
```

6. Sign in at `/auth/login`.
7. Verify `/dashboard` loads.
8. Verify `/admin` loads for the admin account.

Do not soft-delete, reject, or demote the only active approved admin. The database trigger blocks this, but the operational rule is to create a second admin before changing the first one.
````

- [ ] **Step 2: Commit deployment docs**

Run:

```powershell
git add docs/deployment/foundation.md
git commit -m "docs: add database auth setup notes"
```

Expected:

```text
Commit created.
```

### Task 8: Final Database/Auth Verification

**Files:**
- Read: `supabase/migrations/202606180001_auth_core_schema.sql`
- Read: `supabase/migrations/202606180002_auth_rls_policies.sql`
- Read: `src/lib/supabase/database.types.ts`
- Read: `src/lib/auth/guards.ts`
- Read: `src/app/auth/actions.ts`
- Read: `docs/deployment/foundation.md`

**Interfaces:**
- Consumes: all previous database/auth tasks.
- Produces: verified database/auth foundation ready for study content or admin-user-management planning.

- [ ] **Step 1: Run local database reset**

Run:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm dlx supabase@latest db reset
```

Expected:

```text
Finished supabase db reset
```

- [ ] **Step 2: Regenerate database types and verify no diff**

Run:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm dlx supabase@latest gen types typescript --local --schema public > src/lib/supabase/database.types.ts
git diff --exit-code -- src/lib/supabase/database.types.ts
```

Expected:

```text
No diff is printed and git diff exits 0.
```

- [ ] **Step 3: Run app checks**

Run:

```powershell
$env:COREPACK_HOME = 'D:\Lab\codex-workshop\.corepack'
corepack pnpm lint
corepack pnpm typecheck
$env:NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co'
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='placeholder'
corepack pnpm build
```

Expected:

```text
Lint, typecheck, and build exit 0.
The build includes /, /auth/login, /auth/sign-up, /auth/pending, /dashboard, /admin, and /api/health.
```

- [ ] **Step 4: Verify server secrets are not exposed through public env names**

Run:

```powershell
$paths = @('.env.example') + (Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx | Select-Object -ExpandProperty FullName)
Select-String -Path $paths -Pattern "NEXT_PUBLIC_.*SECRET|NEXT_PUBLIC_.*KEY.*SECRET|SUPABASE_SECRET_KEY" -CaseSensitive
```

Expected:

```text
SUPABASE_SECRET_KEY appears only in .env.example, src/lib/env/server.ts, and src/lib/supabase/admin.ts.
```

- [ ] **Step 5: Verify scope boundaries**

Run:

```powershell
Test-Path src/app/study
Test-Path src/app/quiz
Test-Path src/app/api/ai
```

Expected:

```text
False
False
False
```

- [ ] **Step 6: Confirm working tree state**

Run:

```powershell
git status --short --branch
```

Expected:

```text
Only expected database/auth implementation changes are present, or the tree is clean after commits.
```

## Self-Review

Spec coverage:

- Supabase migrations for enums, core tables, constraints, indexes, helper trigger functions, settings seed, and study-domain seed: Task 1.
- Initial RLS helper functions and policies for approved active users, admins, premium users, public content, user-owned quiz data, AI usage, and admin audit reads: Task 2.
- Generated Supabase TypeScript database types: Task 3.
- Auth signup/login/logout pages: Task 5.
- Profile bootstrap after signup: Task 5.
- Pending, rejected, deactivated, verify-email, and generic auth error pages: Task 5.
- Server-side approved-user and admin route guards: Tasks 4 and 6.
- First admin manual setup instructions: Task 7.
- Secret boundary verification: Task 8.
- Study content rendering, quiz flows, admin question management, AI, and email are explicitly out of scope for this plan and remain follow-up phases.

Placeholder scan:

- No prohibited placeholder language is intentionally present.
- Code-producing steps include exact file paths and concrete content or commands.

Type consistency:

- `ApprovedProfile`, `ProfileRow`, `requireApprovedUser()`, and `requireAdmin()` are defined before pages consume them.
- `signUpAction()`, `loginAction()`, and `logoutAction()` are defined before pages consume them.
- Database table and enum names in TypeScript snippets match migration names.
