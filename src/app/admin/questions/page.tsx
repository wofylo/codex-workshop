import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toggleQuestionStatusAction } from "@/app/admin/questions/actions";

const STATUS_CLASSES: Record<string, string> = {
  active: "border-green-500/40 bg-green-500/10 text-green-200",
  draft: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  pending_review: "border-blue-500/40 bg-blue-500/10 text-blue-200",
  disabled: "border-border text-muted-foreground",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  draft: "Draft",
  pending_review: "Pending review",
  disabled: "Disabled",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value));
}

export default async function AdminQuestionsPage() {
  await requireAdmin();
  const supabase = createAdminSupabaseClient();

  const { data: questions } = await supabase
    .from("questions")
    .select("id, question_en, status, domain_id, created_at, study_domains(title_en)")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-svh bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 sm:py-10">
        <header className="flex flex-col gap-4 border-b border-border pb-7">
          <div className="flex items-center gap-3">
            <Link
              className={cn(buttonVariants({ variant: "outline" }), "h-8 w-fit")}
              href="/admin"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Admin
            </Link>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
                Question Bank
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
                {questions?.length ?? 0} questions total. Active questions appear in quizzes.
              </p>
            </div>
            <Link
              className={cn(buttonVariants({ variant: "default" }), "w-full sm:w-auto")}
              href="/admin/questions/new"
            >
              <Plus className="size-4" aria-hidden="true" />
              New Question
            </Link>
          </div>
        </header>

        {!questions?.length ? (
          <Card className="rounded-lg bg-card/92">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No questions yet.{" "}
              <Link className="text-primary underline underline-offset-2" href="/admin/questions/new">
                Create the first one.
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {questions.map((q) => {
              const domainTitle = Array.isArray(q.study_domains)
                ? q.study_domains[0]?.title_en
                : (q.study_domains as { title_en: string } | null)?.title_en ?? "Unknown domain";

              const truncated =
                q.question_en.length > 120
                  ? q.question_en.slice(0, 120) + "…"
                  : q.question_en;

              const toggleLabel = q.status === "active" ? "Disable" : "Activate";

              return (
                <Card key={q.id} className="rounded-lg bg-card/92">
                  <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">{domainTitle}</Badge>
                        <Badge
                          className={
                            STATUS_CLASSES[q.status] ?? "border-border text-muted-foreground"
                          }
                          variant="outline"
                        >
                          {STATUS_LABELS[q.status] ?? q.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-base font-medium leading-6">
                        {truncated}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {q.id} · {formatDate(q.created_at)}
                      </CardDescription>
                    </div>
                    <form action={toggleQuestionStatusAction} className="shrink-0">
                      <input name="question_id" type="hidden" value={q.id} />
                      <input name="current_status" type="hidden" value={q.status} />
                      <Button size="sm" type="submit" variant="outline">
                        {toggleLabel}
                      </Button>
                    </form>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
