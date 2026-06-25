import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireApprovedUser } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

const STATUS_CLASSES: Record<string, string> = {
  open: "border-amber-500/40 bg-amber-500/10 text-amber-200",
  in_progress: "border-blue-500/40 bg-blue-500/10 text-blue-200",
  resolved: "border-green-500/40 bg-green-500/10 text-green-200",
  closed: "border-border text-muted-foreground",
};

const CATEGORY_LABELS: Record<string, string> = {
  bug: "Bug",
  feature: "Feature request",
  other: "Other",
};

export default async function MyBugsPage() {
  const profile = await requireApprovedUser();
  const supabase = await createServerSupabaseClient();

  const { data: reports } = await supabase
    .from("bug_reports")
    .select(
      "id, title, description, category, status, admin_note, created_at, bug_report_files(id, file_name, storage_path)",
    )
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  const adminSupabase = createAdminSupabaseClient();

  const reportsWithUrls = await Promise.all(
    (reports ?? []).map(async (report) => {
      const files = Array.isArray(report.bug_report_files)
        ? report.bug_report_files
        : [];
      const filesWithUrls = await Promise.all(
        files.map(async (file) => {
          const { data } = await adminSupabase.storage
            .from("bug-attachments")
            .createSignedUrl(file.storage_path, 3600);
          return { ...file, signedUrl: data?.signedUrl ?? null };
        }),
      );
      return { ...report, files: filesWithUrls };
    }),
  );

  return (
    <main className="min-h-svh bg-background text-foreground">
      <section className="mx-auto w-full max-w-3xl space-y-6 px-6 py-8">
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
          <Link
            className={cn(buttonVariants({ variant: "outline" }), "h-8 w-fit")}
            href="/dashboard"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Dashboard
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">My Reports</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {reportsWithUrls.length}{" "}
              {reportsWithUrls.length === 1 ? "report" : "reports"} submitted
            </p>
          </div>
        </header>

        {reportsWithUrls.length === 0 ? (
          <Card className="rounded-lg bg-card/92">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No reports yet. Click the bug icon on any page to submit one.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {reportsWithUrls.map((report) => {
              const createdAt = new Date(report.created_at).toLocaleString(
                "zh-TW",
                {
                  timeZone: "Asia/Taipei",
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                },
              );
              return (
                <Card key={report.id} className="rounded-lg bg-card/92">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        className={cn(
                          STATUS_CLASSES[report.status] ??
                            "border-border text-muted-foreground",
                        )}
                        variant="outline"
                      >
                        {STATUS_LABELS[report.status] ?? report.status}
                      </Badge>
                      <Badge variant="secondary">
                        {CATEGORY_LABELS[report.category] ?? report.category}
                      </Badge>
                    </div>
                    <CardTitle className="mt-2 text-base">
                      {report.title}
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs">
                      {createdAt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm leading-6 text-muted-foreground">
                      {report.description}
                    </p>
                  </CardContent>
                  {(report.admin_note || report.files.length > 0) && (
                    <CardContent className="space-y-3">
                      {report.admin_note && (
                        <div className="rounded-md border border-border bg-background/45 px-3 py-2 text-sm">
                          <span className="mr-2 font-medium text-foreground">
                            Response
                          </span>
                          <span className="text-muted-foreground">
                            {report.admin_note}
                          </span>
                        </div>
                      )}
                      {report.files.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-muted-foreground">
                            Attachments
                          </p>
                          {report.files.map((file) =>
                            file.signedUrl ? (
                              <a
                                key={file.id}
                                className="block text-xs text-primary underline underline-offset-2"
                                href={file.signedUrl}
                                rel="noopener noreferrer"
                                target="_blank"
                              >
                                {file.file_name}
                              </a>
                            ) : (
                              <span
                                key={file.id}
                                className="block text-xs text-muted-foreground"
                              >
                                {file.file_name}
                              </span>
                            ),
                          )}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
