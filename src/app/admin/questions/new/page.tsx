import Link from "next/link";
import { ArrowLeft, TriangleAlert } from "lucide-react";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createQuestionAction } from "@/app/admin/questions/actions";

const ERROR_MESSAGES: Record<string, string> = {
  "missing-fields": "All fields are required. Please fill in every field and try again.",
  "invalid-correct-index": "Correct answer must be A, B, C, or D.",
};

const CHOICE_LABELS = ["A", "B", "C", "D"] as const;

type Props = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function NewQuestionPage({ searchParams }: Props) {
  await requireAdmin();

  const params = await searchParams;
  const errorMessage = params?.error
    ? (ERROR_MESSAGES[params.error] ?? "Something went wrong.")
    : null;

  const supabase = createAdminSupabaseClient();
  const { data: domains } = await supabase
    .from("study_domains")
    .select("id, title_en")
    .order("sort_order");

  return (
    <main className="min-h-svh bg-background text-foreground">
      <section className="mx-auto w-full max-w-3xl space-y-6 px-6 py-8">
        <header className="flex flex-col gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <Link
              className={cn(buttonVariants({ variant: "outline" }), "h-8 w-fit")}
              href="/admin/questions"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Questions
            </Link>
            <Badge
              className="w-fit border-primary/40 bg-primary/10 text-primary"
              variant="outline"
            >
              Admin console
            </Badge>
          </div>
          <h1 className="text-2xl font-semibold">New Question</h1>
        </header>

        {errorMessage ? (
          <div className="flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
            {errorMessage}
          </div>
        ) : null}

        <form action={createQuestionAction} className="space-y-6">
          {/* Domain */}
          <Card className="rounded-lg bg-card/92">
            <CardHeader>
              <CardTitle className="text-base">Domain</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                name="domain_id"
                required
              >
                <option value="">Select a domain…</option>
                {(domains ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title_en}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          {/* Question */}
          <Card className="rounded-lg bg-card/92">
            <CardHeader>
              <CardTitle className="text-base">Question (English)</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                name="question_en"
                placeholder="Enter the question text…"
                required
              />
            </CardContent>
          </Card>

          {/* Choices */}
          <Card className="rounded-lg bg-card/92">
            <CardHeader>
              <CardTitle className="text-base">Answer Choices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {([0, 1, 2, 3] as const).map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="shrink-0 font-mono text-xs font-semibold text-primary w-4">
                    {CHOICE_LABELS[i]}
                  </span>
                  <input
                    className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    name={`choice_${i}`}
                    placeholder={`Choice ${CHOICE_LABELS[i]}…`}
                    required
                    type="text"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Correct answer */}
          <Card className="rounded-lg bg-card/92">
            <CardHeader>
              <CardTitle className="text-base">Correct Answer</CardTitle>
            </CardHeader>
            <CardContent>
              <fieldset>
                <legend className="sr-only">Select the correct answer</legend>
                <div className="flex flex-wrap gap-3">
                  {([0, 1, 2, 3] as const).map((i) => (
                    <label
                      key={i}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-4 py-2 text-sm text-muted-foreground transition hover:border-primary/40 hover:bg-primary/5 hover:text-foreground has-[:checked]:border-primary has-[:checked]:bg-primary/15 has-[:checked]:text-foreground has-[:checked]:ring-1 has-[:checked]:ring-primary/50"
                    >
                      <input
                        className="sr-only"
                        name="correct_choice_index"
                        required
                        type="radio"
                        value={i}
                      />
                      <span className="font-mono font-semibold">{CHOICE_LABELS[i]}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </CardContent>
          </Card>

          {/* Explanation */}
          <Card className="rounded-lg bg-card/92">
            <CardHeader>
              <CardTitle className="text-base">Explanation (English)</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                name="explanation_en"
                placeholder="Explain why the correct answer is correct…"
                required
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Link
              className={cn(buttonVariants({ variant: "outline" }))}
              href="/admin/questions"
            >
              Cancel
            </Link>
            <button
              className={cn(buttonVariants({ variant: "default" }))}
              type="submit"
            >
              Create Question
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
