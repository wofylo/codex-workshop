-- Add domain_id to quiz_attempts to track which domain a learning-mode attempt targets.
-- Nullable: existing attempts and future mock_exam attempts spanning multiple domains remain valid.
alter table public.quiz_attempts
  add column if not exists domain_id uuid references public.study_domains(id);

create index if not exists quiz_attempts_user_domain_idx
  on public.quiz_attempts (user_id, domain_id);
