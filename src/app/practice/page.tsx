import Link from "next/link";
import { ArrowLeft, BookOpenCheck, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireApprovedUser } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { startQuizAction } from "@/app/practice/actions";
import { cn } from "@/lib/utils";

type PracticePageProps = {
  searchParams?: Promise<{ error?: string }>;
};

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
              Choose a domain to start a focused practice session.
            </p>
          </div>
        </header>

        {errorMessage ? (
          <div className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
            {errorMessage}
          </div>
        ) : null}

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
