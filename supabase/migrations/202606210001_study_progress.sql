create table public.study_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  domain_slug text not null,
  language text not null,
  section_id text not null,
  section_title text not null,
  is_read boolean not null default false,
  last_viewed_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint study_progress_language_check check (language in ('en', 'zh')),
  constraint study_progress_domain_slug_length check (char_length(domain_slug) between 1 and 120),
  constraint study_progress_section_id_length check (char_length(section_id) between 1 and 160),
  constraint study_progress_user_domain_language_section_unique unique (
    user_id,
    domain_slug,
    language,
    section_id
  )
);

create index study_progress_user_domain_language_read_idx
  on public.study_progress (user_id, domain_slug, language, is_read);

create trigger study_progress_set_updated_at before update on public.study_progress
  for each row execute function private.set_updated_at();

alter table public.study_progress enable row level security;

create policy "Users can read own study progress"
  on public.study_progress
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can insert own study progress"
  on public.study_progress
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update own study progress"
  on public.study_progress
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own study progress"
  on public.study_progress
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
