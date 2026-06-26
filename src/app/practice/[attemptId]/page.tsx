import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireApprovedUser } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AttemptForm } from "@/components/quiz/attempt-form";
import { choiceLabel } from "@/lib/quiz/helpers";
import type { QuizQuestionSnapshot } from "@/lib/quiz/helpers";
import { cn } from "@/lib/utils";

type AttemptPageProps = {
  params: Promise<{ attemptId: string }>;
};

export default async function AttemptPage({ params }: AttemptPageProps) {
  const profile = await requireApprovedUser();
  const { attemptId } = await params;

  const supabase = await createServerSupabaseClient();

  const { data: attempt } = await supabase
    .from("quiz_attempts")
    .select("id, status, user_id, mode, study_domains(title_en)")
    .eq("id", attemptId)
    .single();

  if (!attempt || attempt.user_id !== profile.id) {
    notFound();
  }

  if (attempt.status === "completed") {
    redirect(`/practice/${attemptId}/review`);
  }

  const { data: attemptQuestions } = await supabase
    .from("quiz_attempt_questions")
    .select("id, position, question_snapshot, correct_choice_index_snapshot, choice_order, question_id")
    .eq("attempt_id", attemptId)
    .order("position");

  if (!attemptQuestions || attemptQuestions.length === 0) {
    redirect("/practice");
  }

  // Fetch existing saved answers to pre-fill the form
  const { data: existingAnswers } = await supabase
    .from("quiz_attempt_answers")
    .select("attempt_question_id, selected_choice_index")
    .eq("attempt_id", attemptId);

  // Map attemptQuestionId → origIdx (selected_choice_index stored in DB)
  const answerMap = new Map<string, number>(
    (existingAnswers ?? [])
      .filter((a): a is typeof a & { selected_choice_index: number } =>
        a.selected_choice_index !== null,
      )
      .map((a) => [a.attempt_question_id, a.selected_choice_index]),
  );

  // Build maps for AttemptForm props
  const questionChoiceOrders: Record<string, number[]> = {};
  const questionIds: Record<string, string> = {};
  for (const aq of attemptQuestions) {
    questionChoiceOrders[aq.id] = aq.choice_order as number[];
    questionIds[aq.id] = aq.question_id;
  }

  const isMockExam = attempt.mode === "mock_exam";
  const domainTitle = isMockExam
    ? "Mock Exam"
    : Array.isArray(attempt.study_domains)
      ? attempt.study_domains[0]?.title_en
      : (attempt.study_domains as { title_en: string } | null)?.title_en ?? "Practice Quiz";

  return (
    <main className="min-h-svh bg-background text-foreground">
      <section className="mx-auto w-full max-w-3xl space-y-6 px-6 py-8">
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
          <Link className={cn(buttonVariants({ variant: "outline" }), "h-8 w-fit")} href="/practice">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Practice
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-primary/40 bg-primary/10 text-primary" variant="outline">
                {isMockExam ? "Mock Exam" : "In Progress"}
              </Badge>
            </div>
            <h1 className="mt-2 text-xl font-semibold leading-6">{domainTitle}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {attemptQuestions.length} questions · Answer all and submit to see your score.
            </p>
          </div>
        </header>

        <AttemptForm
          attemptId={attemptId}
          questionChoiceOrders={questionChoiceOrders}
          questionIds={questionIds}
        >
          {attemptQuestions.map((aq, qIdx) => {
            const snapshot = aq.question_snapshot as QuizQuestionSnapshot;
            const choiceOrder = aq.choice_order as number[];
            const displayChoices = choiceOrder.map((origIdx) => ({
              origIdx,
              text: snapshot.choices_en[origIdx] ?? "",
            }));
            const existingOrigIdx = answerMap.get(aq.id);

            return (
              <Card key={aq.id} className="rounded-lg bg-card/92">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Q{qIdx + 1}
                    </span>
                    <CardTitle className="text-base font-medium leading-6">
                      {snapshot.question_en}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <fieldset>
                    <legend className="sr-only">Question {qIdx + 1} choices</legend>
                    <div className="group space-y-2">
                      {displayChoices.map((choice, displayIdx) => (
                        <label
                          key={displayIdx}
                          className="flex cursor-pointer items-start gap-3 rounded-md border border-border px-4 py-3 text-sm leading-6 text-muted-foreground transition group-has-[:checked]:opacity-60 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground has-[:checked]:!opacity-100 has-[:checked]:border-primary has-[:checked]:bg-primary/15 has-[:checked]:text-foreground has-[:checked]:ring-1 has-[:checked]:ring-primary/50"
                        >
                          <input
                            className="sr-only"
                            defaultChecked={
                              existingOrigIdx !== undefined && existingOrigIdx === choice.origIdx
                            }
                            name={`q_${aq.id}`}
                            type="radio"
                            value={displayIdx}
                          />
                          <span className="mt-0.5 shrink-0 font-mono text-xs font-semibold text-primary">
                            {choiceLabel(displayIdx)}
                          </span>
                          <span>{choice.text}</span>
                        </label>
                      ))}
                    </div>
                  </fieldset>
                </CardContent>
              </Card>
            );
          })}

          <div className="flex justify-end pt-2">
            <button
              className={cn(buttonVariants({ variant: "default" }), "w-full sm:w-auto")}
              type="submit"
            >
              Submit Quiz
            </button>
          </div>
        </AttemptForm>
      </section>
    </main>
  );
}
