"use server";

import { redirect } from "next/navigation";
import { requireApprovedUser } from "@/lib/auth/guards";
import { parseChoiceIndex, scoreAnswer } from "@/lib/quiz/helpers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { QuizQuestionSnapshot } from "@/lib/quiz/helpers";

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function startQuizAction(formData: FormData) {
  const profile = await requireApprovedUser();
  const domainId = getString(formData, "domain_id");

  if (!domainId) {
    redirect("/practice?error=missing-domain");
  }

  const supabase = await createServerSupabaseClient();

  const { data: domain } = await supabase
    .from("study_domains")
    .select("id, slug, title_en")
    .eq("id", domainId)
    .single();

  if (!domain) {
    redirect("/practice?error=invalid-domain");
  }

  const { data: questions } = await supabase
    .from("questions")
    .select("id, question_en, choices_en, correct_choice_index, explanation_en")
    .eq("domain_id", domainId)
    .eq("status", "active")
    .limit(10);

  if (!questions || questions.length === 0) {
    redirect("/practice?error=no-questions");
  }

  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .insert({
      user_id: profile.id,
      domain_id: domainId,
      language: "en",
      mode: "learning",
      status: "in_progress",
    })
    .select("id")
    .single();

  if (attemptError || !attempt) {
    throw new Error("Failed to create quiz attempt");
  }

  const attemptQuestions = questions.map((q, i) => ({
    attempt_id: attempt.id,
    question_id: q.id,
    position: i + 1,
    question_snapshot: {
      question_en: q.question_en,
      choices_en: q.choices_en as string[],
      explanation_en: q.explanation_en,
    } satisfies QuizQuestionSnapshot,
    choice_order: [0, 1, 2, 3],
    correct_choice_index_snapshot: q.correct_choice_index,
  }));

  const { error: questionsError } = await supabase
    .from("quiz_attempt_questions")
    .insert(attemptQuestions);

  if (questionsError) {
    throw new Error("Failed to create attempt questions");
  }

  redirect(`/practice/${attempt.id}`);
}

export async function submitAttemptAction(formData: FormData) {
  const profile = await requireApprovedUser();
  const attemptId = getString(formData, "attempt_id");

  if (!attemptId) {
    redirect("/practice");
  }

  const supabase = await createServerSupabaseClient();

  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("id, status, user_id")
    .eq("id", attemptId)
    .single();

  if (!attempt || attempt.user_id !== profile.id || attempt.status !== "in_progress") {
    redirect("/practice");
  }

  const { data: attemptQuestions } = await supabase
    .from("quiz_attempt_questions")
    .select("id, question_id, correct_choice_index_snapshot")
    .eq("attempt_id", attemptId);

  if (!attemptQuestions || attemptQuestions.length === 0) {
    redirect("/practice");
  }

  const now = new Date().toISOString();

  const answers = attemptQuestions.map((aq) => {
    const raw = formData.get(`q_${aq.id}`);
    const selectedIndex = parseChoiceIndex(raw);
    const isCorrect = selectedIndex !== null
      ? scoreAnswer(selectedIndex, aq.correct_choice_index_snapshot)
      : null;
    return {
      attempt_id: attemptId,
      attempt_question_id: aq.id,
      question_id: aq.question_id,
      selected_choice_index: selectedIndex,
      is_correct: isCorrect,
      answered_at: selectedIndex !== null ? now : null,
    };
  });

  const { error: answersError } = await supabase
    .from("quiz_attempt_answers")
    .upsert(answers, { onConflict: "attempt_question_id" });

  if (answersError) {
    throw new Error("Failed to save answers");
  }

  const correctCount = answers.filter((a) => a.is_correct === true).length;

  const { error: updateError } = await supabase
    .from("quiz_attempts")
    .update({
      score: correctCount,
      status: "completed",
      completed_at: now,
    })
    .eq("id", attemptId);

  if (updateError) {
    throw new Error("Failed to finalize attempt");
  }

  redirect(`/practice/${attemptId}/review`);
}
