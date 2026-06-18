create index admin_audit_events_actor_admin_id_idx
  on public.admin_audit_events (actor_admin_id);

create index profiles_approved_by_idx on public.profiles (approved_by);
create index profiles_deleted_by_idx on public.profiles (deleted_by);
create index profiles_rejected_by_idx on public.profiles (rejected_by);

create index questions_generated_by_user_id_idx
  on public.questions (generated_by_user_id);
create index questions_reviewed_by_idx on public.questions (reviewed_by);

create index quiz_attempt_answers_attempt_id_idx
  on public.quiz_attempt_answers (attempt_id);
create index quiz_attempt_answers_question_id_idx
  on public.quiz_attempt_answers (question_id);

create index quiz_attempt_questions_question_id_idx
  on public.quiz_attempt_questions (question_id);

create index review_queue_question_id_idx on public.review_queue (question_id);
create index review_queue_source_attempt_id_idx
  on public.review_queue (source_attempt_id);

create or replace function private.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select (select auth.uid());
$$;

create or replace function private.is_approved_active_user()
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
      where id = (select auth.uid())
        and approval_status = 'approved'
        and is_deleted = false
    ),
    false
  );
$$;

create or replace function private.is_admin()
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
      where id = (select auth.uid())
        and role = 'admin'
        and approval_status = 'approved'
        and is_deleted = false
    ),
    false
  );
$$;

create or replace function private.is_premium_user()
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
      where id = (select auth.uid())
        and approval_status = 'approved'
        and is_deleted = false
        and is_premium = true
    ),
    false
  );
$$;

drop policy "profiles_select_own" on public.profiles;
drop policy "profiles_select_public_approved" on public.profiles;
drop policy "profiles_insert_own_pending" on public.profiles;
drop policy "profiles_admin_all" on public.profiles;

drop policy "app_settings_select_approved" on public.app_settings;
drop policy "app_settings_admin_all" on public.app_settings;

drop policy "study_domains_select_approved" on public.study_domains;
drop policy "study_domains_admin_all" on public.study_domains;

drop policy "study_sections_select_approved" on public.study_sections;
drop policy "study_sections_admin_all" on public.study_sections;

drop policy "questions_select_active_approved" on public.questions;
drop policy "questions_admin_all" on public.questions;

drop policy "quiz_attempts_owner_all" on public.quiz_attempts;
drop policy "quiz_attempts_admin_select" on public.quiz_attempts;

drop policy "quiz_attempt_questions_owner_all" on public.quiz_attempt_questions;
drop policy "quiz_attempt_questions_admin_select" on public.quiz_attempt_questions;

drop policy "quiz_attempt_answers_owner_all" on public.quiz_attempt_answers;
drop policy "quiz_attempt_answers_admin_select" on public.quiz_attempt_answers;

drop policy "review_queue_owner_all" on public.review_queue;
drop policy "review_queue_admin_select" on public.review_queue;

drop policy "ai_usage_events_owner_insert" on public.ai_usage_events;
drop policy "ai_usage_events_owner_select" on public.ai_usage_events;
drop policy "ai_usage_events_admin_select" on public.ai_usage_events;

drop policy "admin_audit_events_admin_select" on public.admin_audit_events;

create policy "profiles_select"
on public.profiles for select
to authenticated
using (
  id = (select auth.uid())
  or (
    (select private.is_approved_active_user())
    and approval_status = 'approved'
    and is_deleted = false
  )
  or (select private.is_admin())
);

create policy "profiles_insert"
on public.profiles for insert
to authenticated
with check (
  (
    id = (select auth.uid())
    and role = 'student'
    and approval_status = 'pending'
    and is_deleted = false
  )
  or (select private.is_admin())
);

create policy "profiles_update_admin"
on public.profiles for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "profiles_delete_admin"
on public.profiles for delete
to authenticated
using ((select private.is_admin()));

create policy "app_settings_select"
on public.app_settings for select
to authenticated
using ((select private.is_approved_active_user()) or (select private.is_admin()));

create policy "app_settings_insert_admin"
on public.app_settings for insert
to authenticated
with check ((select private.is_admin()));

create policy "app_settings_update_admin"
on public.app_settings for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "app_settings_delete_admin"
on public.app_settings for delete
to authenticated
using ((select private.is_admin()));

create policy "study_domains_select"
on public.study_domains for select
to authenticated
using ((select private.is_approved_active_user()) or (select private.is_admin()));

create policy "study_domains_insert_admin"
on public.study_domains for insert
to authenticated
with check ((select private.is_admin()));

create policy "study_domains_update_admin"
on public.study_domains for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "study_domains_delete_admin"
on public.study_domains for delete
to authenticated
using ((select private.is_admin()));

create policy "study_sections_select"
on public.study_sections for select
to authenticated
using ((select private.is_approved_active_user()) or (select private.is_admin()));

create policy "study_sections_insert_admin"
on public.study_sections for insert
to authenticated
with check ((select private.is_admin()));

create policy "study_sections_update_admin"
on public.study_sections for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "study_sections_delete_admin"
on public.study_sections for delete
to authenticated
using ((select private.is_admin()));

create policy "questions_select"
on public.questions for select
to authenticated
using (
  ((select private.is_approved_active_user()) and status = 'active')
  or (select private.is_admin())
);

create policy "questions_insert_admin"
on public.questions for insert
to authenticated
with check ((select private.is_admin()));

create policy "questions_update_admin"
on public.questions for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "questions_delete_admin"
on public.questions for delete
to authenticated
using ((select private.is_admin()));

create policy "quiz_attempts_select"
on public.quiz_attempts for select
to authenticated
using (
  ((select private.is_approved_active_user()) and user_id = (select auth.uid()))
  or (select private.is_admin())
);

create policy "quiz_attempts_insert_owner"
on public.quiz_attempts for insert
to authenticated
with check ((select private.is_approved_active_user()) and user_id = (select auth.uid()));

create policy "quiz_attempts_update_owner"
on public.quiz_attempts for update
to authenticated
using ((select private.is_approved_active_user()) and user_id = (select auth.uid()))
with check ((select private.is_approved_active_user()) and user_id = (select auth.uid()));

create policy "quiz_attempts_delete_owner"
on public.quiz_attempts for delete
to authenticated
using ((select private.is_approved_active_user()) and user_id = (select auth.uid()));

create policy "quiz_attempt_questions_select"
on public.quiz_attempt_questions for select
to authenticated
using (
  (
    (select private.is_approved_active_user())
    and exists (
      select 1 from public.quiz_attempts
      where quiz_attempts.id = quiz_attempt_questions.attempt_id
        and quiz_attempts.user_id = (select auth.uid())
    )
  )
  or (select private.is_admin())
);

create policy "quiz_attempt_questions_insert_owner"
on public.quiz_attempt_questions for insert
to authenticated
with check (
  (select private.is_approved_active_user())
  and exists (
    select 1 from public.quiz_attempts
    where quiz_attempts.id = quiz_attempt_questions.attempt_id
      and quiz_attempts.user_id = (select auth.uid())
  )
);

create policy "quiz_attempt_questions_update_owner"
on public.quiz_attempt_questions for update
to authenticated
using (
  (select private.is_approved_active_user())
  and exists (
    select 1 from public.quiz_attempts
    where quiz_attempts.id = quiz_attempt_questions.attempt_id
      and quiz_attempts.user_id = (select auth.uid())
  )
)
with check (
  (select private.is_approved_active_user())
  and exists (
    select 1 from public.quiz_attempts
    where quiz_attempts.id = quiz_attempt_questions.attempt_id
      and quiz_attempts.user_id = (select auth.uid())
  )
);

create policy "quiz_attempt_questions_delete_owner"
on public.quiz_attempt_questions for delete
to authenticated
using (
  (select private.is_approved_active_user())
  and exists (
    select 1 from public.quiz_attempts
    where quiz_attempts.id = quiz_attempt_questions.attempt_id
      and quiz_attempts.user_id = (select auth.uid())
  )
);

create policy "quiz_attempt_answers_select"
on public.quiz_attempt_answers for select
to authenticated
using (
  (
    (select private.is_approved_active_user())
    and exists (
      select 1 from public.quiz_attempts
      where quiz_attempts.id = quiz_attempt_answers.attempt_id
        and quiz_attempts.user_id = (select auth.uid())
    )
  )
  or (select private.is_admin())
);

create policy "quiz_attempt_answers_insert_owner"
on public.quiz_attempt_answers for insert
to authenticated
with check (
  (select private.is_approved_active_user())
  and exists (
    select 1 from public.quiz_attempts
    where quiz_attempts.id = quiz_attempt_answers.attempt_id
      and quiz_attempts.user_id = (select auth.uid())
  )
);

create policy "quiz_attempt_answers_update_owner"
on public.quiz_attempt_answers for update
to authenticated
using (
  (select private.is_approved_active_user())
  and exists (
    select 1 from public.quiz_attempts
    where quiz_attempts.id = quiz_attempt_answers.attempt_id
      and quiz_attempts.user_id = (select auth.uid())
  )
)
with check (
  (select private.is_approved_active_user())
  and exists (
    select 1 from public.quiz_attempts
    where quiz_attempts.id = quiz_attempt_answers.attempt_id
      and quiz_attempts.user_id = (select auth.uid())
  )
);

create policy "quiz_attempt_answers_delete_owner"
on public.quiz_attempt_answers for delete
to authenticated
using (
  (select private.is_approved_active_user())
  and exists (
    select 1 from public.quiz_attempts
    where quiz_attempts.id = quiz_attempt_answers.attempt_id
      and quiz_attempts.user_id = (select auth.uid())
  )
);

create policy "review_queue_select"
on public.review_queue for select
to authenticated
using (
  ((select private.is_approved_active_user()) and user_id = (select auth.uid()))
  or (select private.is_admin())
);

create policy "review_queue_insert_owner"
on public.review_queue for insert
to authenticated
with check ((select private.is_approved_active_user()) and user_id = (select auth.uid()));

create policy "review_queue_update_owner"
on public.review_queue for update
to authenticated
using ((select private.is_approved_active_user()) and user_id = (select auth.uid()))
with check ((select private.is_approved_active_user()) and user_id = (select auth.uid()));

create policy "review_queue_delete_owner"
on public.review_queue for delete
to authenticated
using ((select private.is_approved_active_user()) and user_id = (select auth.uid()));

create policy "ai_usage_events_select"
on public.ai_usage_events for select
to authenticated
using (
  ((select private.is_premium_user()) and user_id = (select auth.uid()))
  or (select private.is_admin())
);

create policy "ai_usage_events_insert_owner"
on public.ai_usage_events for insert
to authenticated
with check ((select private.is_premium_user()) and user_id = (select auth.uid()));

create policy "admin_audit_events_select_admin"
on public.admin_audit_events for select
to authenticated
using ((select private.is_admin()));
