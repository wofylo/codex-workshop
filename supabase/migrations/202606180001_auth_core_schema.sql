create extension if not exists pgcrypto with schema extensions;
create schema if not exists private;

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
  constraint quiz_attempt_questions_choice_order_length check (cardinality(choice_order) = 4),
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

create function private.set_updated_at()
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
  for each row execute function private.set_updated_at();
create trigger app_settings_set_updated_at before update on public.app_settings
  for each row execute function private.set_updated_at();
create trigger study_domains_set_updated_at before update on public.study_domains
  for each row execute function private.set_updated_at();
create trigger study_sections_set_updated_at before update on public.study_sections
  for each row execute function private.set_updated_at();
create trigger questions_set_updated_at before update on public.questions
  for each row execute function private.set_updated_at();
create trigger quiz_attempts_set_updated_at before update on public.quiz_attempts
  for each row execute function private.set_updated_at();
create trigger quiz_attempt_answers_set_updated_at before update on public.quiz_attempt_answers
  for each row execute function private.set_updated_at();

create function private.prevent_last_active_admin_loss()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  active_admin_count integer;
  removing_admin boolean;
begin
  if tg_op = 'DELETE' then
    removing_admin :=
      old.role = 'admin'
      and old.approval_status = 'approved'
      and old.is_deleted = false;
  else
    removing_admin :=
      old.role = 'admin'
      and old.approval_status = 'approved'
      and old.is_deleted = false
      and (
        new.role <> 'admin'
        or new.approval_status <> 'approved'
        or new.is_deleted = true
      );
  end if;

  if removing_admin then
    perform pg_advisory_xact_lock(20260618, 1);

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

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create trigger profiles_prevent_last_active_admin_loss
  before update or delete on public.profiles
  for each row execute function private.prevent_last_active_admin_loss();

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
select
  study_domains.id,
  section_seed.slug,
  section_seed.title_en,
  section_seed.title_zh,
  section_seed.source_path_en,
  section_seed.source_path_zh,
  section_seed.sort_order
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
