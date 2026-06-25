-- Enums
create type public.bug_category as enum ('bug', 'feature', 'other');
create type public.bug_status as enum ('open', 'in_progress', 'resolved', 'closed');

-- Bug reports
create table public.bug_reports (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references public.profiles(id) on delete cascade,
  title       text        not null check (char_length(title) > 0 and char_length(title) <= 200),
  description text        not null check (char_length(description) > 0),
  category    public.bug_category not null default 'bug',
  page_url    text,
  status      public.bug_status   not null default 'open',
  admin_note  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index bug_reports_user_id_idx    on public.bug_reports(user_id);
create index bug_reports_status_idx     on public.bug_reports(status);
create index bug_reports_created_at_idx on public.bug_reports(created_at desc);

-- Bug report files
create table public.bug_report_files (
  id            uuid        primary key default gen_random_uuid(),
  report_id     uuid        not null references public.bug_reports(id) on delete cascade,
  storage_path  text        not null,
  file_name     text        not null,
  file_size     bigint      not null,
  mime_type     text,
  created_at    timestamptz not null default now()
);

create index bug_report_files_report_id_idx on public.bug_report_files(report_id);

-- RLS
alter table public.bug_reports      enable row level security;
alter table public.bug_report_files enable row level security;

-- bug_reports: users insert own
create policy "Users insert own bug reports" on public.bug_reports
  for insert to authenticated
  with check (user_id = (select id from public.profiles where id = auth.uid()));

-- bug_reports: users read own
create policy "Users read own bug reports" on public.bug_reports
  for select to authenticated
  using (user_id = (select id from public.profiles where id = auth.uid()));

-- bug_reports: admins read all
create policy "Admins read all bug reports" on public.bug_reports
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role = 'admin'
        and approval_status = 'approved'
        and not is_deleted
    )
  );

-- bug_reports: admins update (status + admin_note)
create policy "Admins update bug reports" on public.bug_reports
  for update to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role = 'admin'
        and approval_status = 'approved'
        and not is_deleted
    )
  )
  with check (true);

-- bug_report_files: users insert for own reports
create policy "Users insert own bug report files" on public.bug_report_files
  for insert to authenticated
  with check (
    exists (
      select 1 from public.bug_reports
      where id = report_id
        and user_id = (select id from public.profiles where id = auth.uid())
    )
  );

-- bug_report_files: users read own
create policy "Users read own bug report files" on public.bug_report_files
  for select to authenticated
  using (
    exists (
      select 1 from public.bug_reports
      where id = report_id
        and user_id = (select id from public.profiles where id = auth.uid())
    )
  );

-- bug_report_files: admins read all
create policy "Admins read all bug report files" on public.bug_report_files
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and role = 'admin'
        and approval_status = 'approved'
        and not is_deleted
    )
  );
