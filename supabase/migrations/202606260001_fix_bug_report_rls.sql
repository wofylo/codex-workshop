-- Replace inline admin subqueries with private.is_admin() helper for consistency
-- with existing RLS patterns in this codebase.

-- bug_reports: replace admin policies
drop policy if exists "Admins read all bug reports" on public.bug_reports;
drop policy if exists "Admins update bug reports" on public.bug_reports;

create policy "Admins can view all bug reports"
  on public.bug_reports for select
  using ((select private.is_admin()));

create policy "Admins can update bug reports"
  on public.bug_reports for update
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- bug_report_files: replace admin policy
drop policy if exists "Admins read all bug report files" on public.bug_report_files;

create policy "Admins can view all bug report files"
  on public.bug_report_files for select
  using ((select private.is_admin()));
