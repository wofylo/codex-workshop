revoke all on schema private from public;
grant usage on schema public to authenticated;
grant usage on schema private to authenticated;

grant select, insert, update, delete on table
  public.profiles,
  public.app_settings,
  public.study_domains,
  public.study_sections,
  public.questions,
  public.quiz_attempts,
  public.quiz_attempt_questions,
  public.quiz_attempt_answers,
  public.review_queue,
  public.ai_usage_events,
  public.admin_audit_events
to authenticated;

create function private.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid();
$$;

create function private.is_approved_active_user()
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

create function private.is_admin()
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

create function private.is_premium_user()
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

grant execute on function private.current_profile_id() to authenticated;
grant execute on function private.is_approved_active_user() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_premium_user() to authenticated;

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
  private.is_approved_active_user()
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
using (private.is_admin())
with check (private.is_admin());

create policy "app_settings_select_approved"
on public.app_settings for select
to authenticated
using (private.is_approved_active_user());

create policy "app_settings_admin_all"
on public.app_settings for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "study_domains_select_approved"
on public.study_domains for select
to authenticated
using (private.is_approved_active_user());

create policy "study_domains_admin_all"
on public.study_domains for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "study_sections_select_approved"
on public.study_sections for select
to authenticated
using (private.is_approved_active_user());

create policy "study_sections_admin_all"
on public.study_sections for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "questions_select_active_approved"
on public.questions for select
to authenticated
using (private.is_approved_active_user() and status = 'active');

create policy "questions_admin_all"
on public.questions for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "quiz_attempts_owner_all"
on public.quiz_attempts for all
to authenticated
using (private.is_approved_active_user() and user_id = auth.uid())
with check (private.is_approved_active_user() and user_id = auth.uid());

create policy "quiz_attempts_admin_select"
on public.quiz_attempts for select
to authenticated
using (private.is_admin());

create policy "quiz_attempt_questions_owner_all"
on public.quiz_attempt_questions for all
to authenticated
using (
  private.is_approved_active_user()
  and exists (
    select 1 from public.quiz_attempts
    where quiz_attempts.id = quiz_attempt_questions.attempt_id
      and quiz_attempts.user_id = auth.uid()
  )
)
with check (
  private.is_approved_active_user()
  and exists (
    select 1 from public.quiz_attempts
    where quiz_attempts.id = quiz_attempt_questions.attempt_id
      and quiz_attempts.user_id = auth.uid()
  )
);

create policy "quiz_attempt_questions_admin_select"
on public.quiz_attempt_questions for select
to authenticated
using (private.is_admin());

create policy "quiz_attempt_answers_owner_all"
on public.quiz_attempt_answers for all
to authenticated
using (
  private.is_approved_active_user()
  and exists (
    select 1 from public.quiz_attempts
    where quiz_attempts.id = quiz_attempt_answers.attempt_id
      and quiz_attempts.user_id = auth.uid()
  )
)
with check (
  private.is_approved_active_user()
  and exists (
    select 1 from public.quiz_attempts
    where quiz_attempts.id = quiz_attempt_answers.attempt_id
      and quiz_attempts.user_id = auth.uid()
  )
);

create policy "quiz_attempt_answers_admin_select"
on public.quiz_attempt_answers for select
to authenticated
using (private.is_admin());

create policy "review_queue_owner_all"
on public.review_queue for all
to authenticated
using (private.is_approved_active_user() and user_id = auth.uid())
with check (private.is_approved_active_user() and user_id = auth.uid());

create policy "review_queue_admin_select"
on public.review_queue for select
to authenticated
using (private.is_admin());

create policy "ai_usage_events_owner_insert"
on public.ai_usage_events for insert
to authenticated
with check (private.is_premium_user() and user_id = auth.uid());

create policy "ai_usage_events_owner_select"
on public.ai_usage_events for select
to authenticated
using (private.is_premium_user() and user_id = auth.uid());

create policy "ai_usage_events_admin_select"
on public.ai_usage_events for select
to authenticated
using (private.is_admin());

create policy "admin_audit_events_admin_select"
on public.admin_audit_events for select
to authenticated
using (private.is_admin());
