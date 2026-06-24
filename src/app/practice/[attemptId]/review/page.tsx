import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireApprovedUser } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { choiceLabel } from "@/lib/quiz/helpers";
import type { QuizQuestionSnapshot } from "@/lib/quiz/helpers";
import { cn } from "@/lib/utils";

type ReviewPageProps = {
  params: Promise<{ attemptId: string }>;
};

export default async function ReviewPage({ params }: ReviewPageProps) {
  const profile = await requireApprovedUser();
  const { attemptId } = await params;

  const supabase = await createServerSupabaseClient();

  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("id, status, score, user_id, completed_at, mode, study_domains(title_en)")
    .eq("id", attemptId)
    .single();

  if (!attempt || attempt.user_id !== profile.id || attempt.status !== "completed") {
    notFound();
  }

  const { data: attemptQuestions } = await supabase
    .from("quiz_attempt_questions")
    .select("id, position, question_snapshot, correct_choice_index_snapshot, choice_order")
    .eq("attempt_id", attemptId)
    .order("position");

  const { data: attemptAnswers } = await supabase
    .from("quiz_attempt_answers")
    .select("attempt_question_id, selected_choice_index, is_correct")
    .eq("attempt_id", attemptId);

  const answerByQuestionId = new Map(
    (attemptAnswers ?? []).map((a) => [a.attempt_question_id, a]),
  );

  const total = attemptQuestions?.length ?? 0;
  const score = attempt.score ?? 0;
  const percentage = total === 0 ? 0 : Math.round((score / total) * 100);

  const isMockExam = attempt.mode === "mock_exam";
  const domainTitle = isMockExam
    ? "Mock Exam"
    : Array.isArray(attempt.study_domains)
      ? attempt.study_domains[0]?.title_en
      : (attempt.study_domains as { title_en: string } | null)?.title_en ?? "Practice Quiz";

  const completedAt = attempt.completed_at
    ? new Date(attempt.completed_at).toLocaleString("zh-TW", {
        timeZone: "Asia/Taipei",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <main className="min-h-svh bg-background text-foreground">
      <section className="mx-auto w-full max-w-3xl space-y-6 px-6 py-8">
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link className={cn(buttonVariants({ variant: "outline" }), "h-8")} href="/practice">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Practice
            </Link>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")} href="/dashboard">
              Dashboard
            </Link>
            <Link className={cn(buttonVariants({ variant: "default" }), "w-full sm:w-auto")} href="/practice">
              Try Again
            </Link>
          </div>
        </header>

        {/* Score summary */}
        <Card className={cn(
          "rounded-lg border-2",
          percentage >= 70 ? "border-green-500/40 bg-green-500/5" : "border-amber-500/40 bg-amber-500/5",
        )}>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Badge
                  className={cn(
                    percentage >= 70
                      ? "border-green-500/40 bg-green-500/10 text-green-200"
                      : "border-amber-500/40 bg-amber-500/10 text-amber-200",
                  )}
                  variant="outline"
                >
                  {percentage >= 70 ? "Passed" : "Keep Practicing"}
                </Badge>
                <CardTitle className="mt-3 text-3xl font-bold">
                  {score} / {total}
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{domainTitle}</p>
                {completedAt ? (
                  <p className="mt-1 text-xs text-muted-foreground">{completedAt}</p>
                ) : null}
              </div>
              <div className="text-right">
                <div className="text-5xl font-bold tabular-nums text-primary">{percentage}%</div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Per-question review */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Review</h2>
          {(attemptQuestions ?? []).map((aq, qIdx) => {
            const snapshot = aq.question_snapshot as QuizQuestionSnapshot;
            const choiceOrder = aq.choice_order as number[];
            const answer = answerByQuestionId.get(aq.id);
            const selectedDisplay = answer?.selected_choice_index ?? null;
            const correctDisplay = choiceOrder.indexOf(aq.correct_choice_index_snapshot);
            const isCorrect = answer?.is_correct === true;
            const questionExplanation = snapshot.explanation_en;

            return (
              <Card key={aq.id} className="rounded-lg bg-card/92">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0">
                      {isCorrect ? (
                        <CheckCircle2 className="size-5 text-green-400" aria-label="Correct" />
                      ) : (
                        <XCircle className="size-5 text-red-400" aria-label="Incorrect" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-muted-foreground">Q{qIdx + 1}</span>
                      <CardTitle className="mt-1 text-base font-medium leading-6">
                        {snapshot.question_en}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    {choiceOrder.map((origIdx, displayIdx) => {
                      const text = snapshot.choices_en[origIdx] ?? "";
                      const isThisCorrect = displayIdx === correctDisplay;
                      const isThisSelected = displayIdx === selectedDisplay;
                      const isWrongSelection = isThisSelected && !isThisCorrect;

                      return (
                        <div
                          key={displayIdx}
                          className={cn(
                            "flex items-start gap-3 rounded-md border px-4 py-3 text-sm leading-6",
                            isThisCorrect
                              ? "border-green-500/40 bg-green-500/10 text-green-100"
                              : isWrongSelection
                                ? "border-red-500/40 bg-red-500/10 text-red-200 line-through"
                                : "border-border text-muted-foreground",
                          )}
                        >
                          <span className="mt-0.5 shrink-0 font-mono text-xs font-semibold">
                            {choiceLabel(displayIdx)}
                          </span>
                          <span>{text}</span>
                          {isThisCorrect && (
                            <CheckCircle2 className="ml-auto mt-0.5 size-4 shrink-0 text-green-400" aria-hidden="true" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {questionExplanation ? (
                    <div className="rounded-md border border-border bg-background/45 px-4 py-3 text-sm leading-6 text-muted-foreground">
                      <span className="mr-2 font-medium text-foreground">Explanation</span>
                      {questionExplanation}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
