-- Add private.is_guest() helper for anonymous session detection
CREATE OR REPLACE FUNCTION private.is_guest()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false)
$$;

-- study_domains: guests can read (needed for /practice domain list and quiz start)
CREATE POLICY "study_domains_select_guest"
ON public.study_domains FOR SELECT
TO authenticated
USING ((SELECT private.is_guest()));

-- questions: guests can read active questions (needed for startQuizAction)
CREATE POLICY "questions_select_guest"
ON public.questions FOR SELECT
TO authenticated
USING ((SELECT private.is_guest()) AND status = 'active');

-- quiz_attempts: guests own their attempts
CREATE POLICY "quiz_attempts_select_guest"
ON public.quiz_attempts FOR SELECT
TO authenticated
USING ((SELECT private.is_guest()) AND user_id = (SELECT auth.uid()));

CREATE POLICY "quiz_attempts_insert_guest"
ON public.quiz_attempts FOR INSERT
TO authenticated
WITH CHECK ((SELECT private.is_guest()) AND user_id = (SELECT auth.uid()));

CREATE POLICY "quiz_attempts_update_guest"
ON public.quiz_attempts FOR UPDATE
TO authenticated
USING ((SELECT private.is_guest()) AND user_id = (SELECT auth.uid()))
WITH CHECK ((SELECT private.is_guest()) AND user_id = (SELECT auth.uid()));

-- quiz_attempt_questions: guests can read/insert for their own attempts
CREATE POLICY "quiz_attempt_questions_select_guest"
ON public.quiz_attempt_questions FOR SELECT
TO authenticated
USING (
  (SELECT private.is_guest())
  AND EXISTS (
    SELECT 1 FROM public.quiz_attempts
    WHERE quiz_attempts.id = quiz_attempt_questions.attempt_id
      AND quiz_attempts.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "quiz_attempt_questions_insert_guest"
ON public.quiz_attempt_questions FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT private.is_guest())
  AND EXISTS (
    SELECT 1 FROM public.quiz_attempts
    WHERE quiz_attempts.id = quiz_attempt_questions.attempt_id
      AND quiz_attempts.user_id = (SELECT auth.uid())
  )
);

-- quiz_attempt_answers: guests can read/insert/update for their own attempts
CREATE POLICY "quiz_attempt_answers_select_guest"
ON public.quiz_attempt_answers FOR SELECT
TO authenticated
USING (
  (SELECT private.is_guest())
  AND EXISTS (
    SELECT 1 FROM public.quiz_attempts
    WHERE quiz_attempts.id = quiz_attempt_answers.attempt_id
      AND quiz_attempts.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "quiz_attempt_answers_insert_guest"
ON public.quiz_attempt_answers FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT private.is_guest())
  AND EXISTS (
    SELECT 1 FROM public.quiz_attempts
    WHERE quiz_attempts.id = quiz_attempt_answers.attempt_id
      AND quiz_attempts.user_id = (SELECT auth.uid())
  )
);

CREATE POLICY "quiz_attempt_answers_update_guest"
ON public.quiz_attempt_answers FOR UPDATE
TO authenticated
USING (
  (SELECT private.is_guest())
  AND EXISTS (
    SELECT 1 FROM public.quiz_attempts
    WHERE quiz_attempts.id = quiz_attempt_answers.attempt_id
      AND quiz_attempts.user_id = (SELECT auth.uid())
  )
)
WITH CHECK (
  (SELECT private.is_guest())
  AND EXISTS (
    SELECT 1 FROM public.quiz_attempts
    WHERE quiz_attempts.id = quiz_attempt_answers.attempt_id
      AND quiz_attempts.user_id = (SELECT auth.uid())
  )
);
