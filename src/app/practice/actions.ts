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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MOCK_EXAM_TOTAL = 40;

export async function startQuizAction(formData: FormData) {
  const profile = await requireApprovedUser();
  const rawMode = getString(formData, "mode");
  const mode: "learning" | "mock_exam" = rawMode === "mock_exam" ? "mock_exam" : "learning";
  const supabase = await createServerSupabaseClient();

  type QuestionRow = {
    id: string;
    question_en: string;
    choices_en: unknown;
    correct_choice_index: number;
    explanation_en: string;
    domain_id: string;
  };

  let questions: QuestionRow[];
  let domainId: string | null = null;

  if (mode === "mock_exam") {
    const { data: allQ } = await supabase
      .from("questions")
      .select("id, question_en, choices_en, correct_choice_index, explanation_en, domain_id")
      .eq("status", "active");

    if (!allQ || allQ.length === 0) {
      redirect("/practice?error=no-questions");
    }

    const { data: domains } = await supabase
      .from("study_domains")
      .select("id, exam_weight");

    const weightMap = new Map((domains ?? []).map((d) => [d.id, d.exam_weight as number]));

    const byDomain = new Map<string, QuestionRow[]>();
    for (const q of allQ) {
      const list = byDomain.get(q.domain_id) ?? [];
      byDomain.set(q.domain_id, [...list, q as QuestionRow]);
    }

    const selected: QuestionRow[] = [];
    for (const [did, domainQs] of byDomain) {
      const weight = weightMap.get(did) ?? 0;
      const count = Math.max(1, Math.round((weight / 100) * MOCK_EXAM_TOTAL));
      selected.push(...shuffle(domainQs).slice(0, count));
    }

    questions = shuffle(selected);
    domainId = null;
  } else {
    domainId = getString(formData, "domain_id");

    if (!domainId) {
      redirect("/practice?error=missing-domain");
    }

    const { data: domain } = await supabase
      .from("study_domains")
      .select("id")
      .eq("id", domainId)
      .single();

    if (!domain) {
      redirect("/practice?error=invalid-domain");
    }

    const { data: q } = await supabase
      .from("questions")
      .select("id, question_en, choices_en, correct_choice_index, explanation_en, domain_id")
      .eq("domain_id", domainId)
      .eq("status", "active")
      .limit(10);

    if (!q || q.length === 0) {
      redirect("/practice?error=no-questions");
    }

    questions = q as QuestionRow[];
  }

  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .insert({
      user_id: profile.id,
      domain_id: domainId,
      language: "en",
      mode,
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

export async function saveAnswerAction(formData: FormData): Promise<void> {
  const profile = await requireApprovedUser();
  const attemptId = getString(formData, "attempt_id");
  const attemptQuestionId = getString(formData, "attempt_question_id");
  const questionId = getString(formData, "question_id");
  const answerRaw = getString(formData, "answer");
  const choiceOrderRaw = getString(formData, "choice_order");

  if (!attemptId || !attemptQuestionId || !questionId || !answerRaw || !choiceOrderRaw) return;

  const displayIdx = parseInt(answerRaw, 10);
  if (isNaN(displayIdx) || displayIdx < 0 || displayIdx > 3) return;

  let choiceOrder: number[];
  try {
    choiceOrder = JSON.parse(choiceOrderRaw) as number[];
  } catch {
    return;
  }

  const origIdx = choiceOrder[displayIdx];
  if (origIdx === undefined) return;

  const supabase = await createServerSupabaseClient();

  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("id, user_id, status")
    .eq("id", attemptId)
    .single();

  if (!attempt || attempt.user_id !== profile.id || attempt.status !== "in_progress") return;

  await supabase.from("quiz_attempt_answers").upsert(
    {
      attempt_id: attemptId,
      attempt_question_id: attemptQuestionId,
      question_id: questionId,
      selected_choice_index: origIdx,
      is_correct: null,
      answered_at: new Date().toISOString(),
    },
    { onConflict: "attempt_question_id" },
  );
}

export async function abandonAttemptAction(formData: FormData): Promise<void> {
  const profile = await requireApprovedUser();
  const attemptId = getString(formData, "attempt_id");

  if (!attemptId) {
    redirect("/practice");
  }

  const supabase = await createServerSupabaseClient();

  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("id, user_id, status")
    .eq("id", attemptId)
    .single();

  if (!attempt || attempt.user_id !== profile.id || attempt.status !== "in_progress") {
    redirect("/practice");
  }

  await supabase
    .from("quiz_attempts")
    .update({ status: "abandoned" })
    .eq("id", attemptId);

  redirect("/practice");
}
