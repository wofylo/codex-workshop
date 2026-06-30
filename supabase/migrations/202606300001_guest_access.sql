-- Migration: guest_access
-- Enables anonymous (guest) users to take quizzes and submit bug reports.
--
-- Migration A: quiz_attempts.user_id FK → auth.users(id)
-- Allows anonymous Supabase users (who exist in auth.users but not profiles)
-- to create quiz attempts. Cascade-deletes attempts when the anon user is cleaned up.
ALTER TABLE public.quiz_attempts
  DROP CONSTRAINT quiz_attempts_user_id_fkey;

ALTER TABLE public.quiz_attempts
  ADD CONSTRAINT quiz_attempts_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Migration B: bug_reports.user_id → nullable
-- Allows guest (unauthenticated) users to submit bug reports with user_id = null.
-- ON DELETE SET NULL so reports are retained when a profile is deleted.
ALTER TABLE public.bug_reports
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.bug_reports
  DROP CONSTRAINT bug_reports_user_id_fkey;

ALTER TABLE public.bug_reports
  ADD CONSTRAINT bug_reports_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;
