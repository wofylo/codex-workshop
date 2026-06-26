import Link from "next/link";
import { ArrowLeft, BookOpenCheck, ClipboardList, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireApprovedUser } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { startQuizAction, abandonAttemptAction } from "@/app/practice/actions";
import { cn } from "@/lib/utils";

type PracticePageProps = {
  searchParams?: Promise<{ error?: string }>;
};

function sevenDaysAgoISO(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
}

const ERROR_MESSAGES: Record<string, string> = {
  "no-questions": "This domain has no active questions yet. Try another domain.",
  "invalid-domain": "Invalid domain selected.",
  "missing-domain": "Please select a domain to start.",
};

export default async function PracticePage({ searchParams }: PracticePageProps) {
  await requireApprovedUser();

  const params = await searchParams;
  const errorMessage = params?.error ? (ERROR_MESSAGES[params.error] ?? "Something went wrong.") : null;

  const supabase = await createServerSupabaseClient();

  const sevenDaysAgo = sevenDaysAgoISO();
  const { data: resumeAttempt } = await supabase
    .from("quiz_attempts")
    .select("id, mode, started_at, domain_id, study_domains(title_en)")
    .eq("status", "in_progress")
    .gte("started_at", sevenDaysAgo)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: domains } = await supabase
    .from("study_domains")
    .select("id, slug, title_en, exam_weight, mock_question_count, sort_order")
    .order("sort_order");

  return (
    <main className="min-h-svh bg-background text-foreground">
      <section className="mx-auto w-full max-w-3xl space-y-6 px-6 py-8">
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
          <Link className={cn(buttonVariants({ variant: "outline" }), "h-8 w-fit")} href="/dashboard">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Dashboard
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Practice Quiz</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Choose a domain for focused practice, or take a full mock exam.
            </p>
          </div>
        </header>

        {errorMessage ? (
          <div className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
            {errorMessage}
          </div>
        ) : null}

        {resumeAttempt ? (
          <Card className="rounded-lg border-amber-500/30 bg-amber-500/5">
            <CardHeader className="flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    className="border-amber-500/40 bg-amber-500/10 text-amber-200"
                    variant="outline"
                  >
                    In Progress
                  </Badge>
                  <Badge variant="secondary">
                    {resumeAttempt.mode === "mock_exam"
                      ? "Mock Exam"
                      : (
                          Array.isArray(resumeAttempt.study_domains)
                            ? resumeAttempt.study_domains[0]?.title_en
                            : (resumeAttempt.study_domains as { title_en: string } | null)
                                ?.title_en
                        ) ?? "Practice Quiz"}
                  </Badge>
                </div>
                <CardTitle className="mt-2 text-base leading-6">Unfinished attempt</CardTitle>
                <CardDescription className="mt-1 text-xs">
                  Started{" "}
                  {new Date(resumeAttempt.started_at).toLocaleDateString("zh-TW", {
                    timeZone: "Asia/Taipei",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  })}
                </CardDescription>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <Link
                  className={cn(buttonVariants({ variant: "default" }), "w-full sm:w-auto")}
                  href={`/practice/${resumeAttempt.id}`}
                >
                  Resume Quiz
                </Link>
                <form action={abandonAttemptAction}>
                  <input name="attempt_id" type="hidden" value={resumeAttempt.id} />
                  <button
                    className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    type="submit"
                  >
                    Abandon
                  </button>
                </form>
              </div>
            </CardHeader>
          </Card>
        ) : null}

        {/* Mock exam card */}
        <Card className="rounded-lg border-primary/30 bg-primary/5">
          <CardHeader className="flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-primary/40 bg-primary/10 text-primary" variant="outline">
                  Mock Exam
                </Badge>
                <Badge variant="secondary">~40 questions · All domains</Badge>
              </div>
              <CardTitle className="mt-2 text-lg leading-6">Full CCA-F Simulation</CardTitle>
              <CardDescription className="mt-1">
                Proportional mix across all five domains. No hints — results after submission.
              </CardDescription>
            </div>
            <form action={startQuizAction} className="shrink-0">
              <input name="mode" type="hidden" value="mock_exam" />
              <button
                className={cn(buttonVariants({ variant: "default" }), "w-full sm:w-auto")}
                type="submit"
              >
                <ClipboardList className="size-4" aria-hidden="true" />
                Start Mock Exam
              </button>
            </form>
          </CardHeader>
        </Card>

        <div className="relative flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or practice by domain</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <div className="grid gap-3">
          {domains?.map((domain) => (
            <Card key={domain.id} className="rounded-lg bg-card/92">
              <CardHeader className="flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="border-primary/40 text-primary" variant="outline">
                      {domain.exam_weight}%
                    </Badge>
                    <Badge variant="secondary">
                      {domain.mock_question_count} questions
                    </Badge>
                  </div>
                  <CardTitle className="mt-2 text-lg leading-6">{domain.title_en}</CardTitle>
                </div>
                <form action={startQuizAction} className="shrink-0">
                  <input name="domain_id" type="hidden" value={domain.id} />
                  <button
                    className={cn(buttonVariants({ variant: "default" }), "w-full sm:w-auto")}
                    type="submit"
                  >
                    <BookOpenCheck className="size-4" aria-hidden="true" />
                    Start Quiz
                  </button>
                </form>
              </CardHeader>
            </Card>
          ))}
        </div>

        {!domains?.length ? (
          <Card className="rounded-lg bg-card/92">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              <CardDescription>No domains available yet.</CardDescription>
            </CardContent>
          </Card>
        ) : null}
      </section>
    </main>
  );
}
