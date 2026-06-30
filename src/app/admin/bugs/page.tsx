import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth/guards";
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
import { updateBugStatusAction } from "./actions";

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

export default async function AdminBugsPage() {
  await requireAdmin();

  const adminSupabase = createAdminSupabaseClient();

  const { data: reports } = await adminSupabase
    .from("bug_reports")
    .select(
      "id, title, description, category, page_url, status, admin_note, created_at, user_id, bug_report_files(id, file_name, storage_path)",
    )
    .order("created_at", { ascending: false });

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

  const openCount = reportsWithUrls.filter((r) => r.status === "open").length;

  return (
    <main className="min-h-svh bg-background text-foreground">
      <section className="mx-auto w-full max-w-4xl space-y-6 px-6 py-8">
        <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
          <Link
            className={cn(buttonVariants({ variant: "outline" }), "h-8 w-fit")}
            href="/admin"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Admin
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Bug Reports</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {reportsWithUrls.length} total · {openCount} open
            </p>
          </div>
        </header>

        <div className="space-y-4">
          {reportsWithUrls.length === 0 ? (
            <Card className="rounded-lg bg-card/92">
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No bug reports yet.
              </CardContent>
            </Card>
          ) : (
            reportsWithUrls.map((report) => {
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
                    <div className="flex flex-wrap items-center justify-between gap-2">
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
                        {report.user_id === null && (
                          <Badge variant="secondary" className="text-xs">
                            Guest
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {createdAt}
                      </span>
                    </div>
                    <CardTitle className="mt-2 text-base">
                      {report.title}
                    </CardTitle>
                    {report.page_url && (
                      <CardDescription className="mt-1 truncate text-xs">
                        {report.page_url}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm leading-6 text-muted-foreground">
                      {report.description}
                    </p>

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

                    {/* Inline status update form */}
                    <form
                      action={(fd) => void updateBugStatusAction(fd)}
                      className="space-y-3 rounded-md border border-border bg-background/45 p-3"
                    >
                      <input name="report_id" type="hidden" value={report.id} />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label
                            className="text-xs font-medium text-muted-foreground"
                            htmlFor={`status-${report.id}`}
                          >
                            Status
                          </label>
                          <select
                            className="w-full rounded-md border border-border bg-background/70 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            defaultValue={report.status}
                            id={`status-${report.id}`}
                            name="status"
                          >
                            <option value="open">Open</option>
                            <option value="in_progress">In progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label
                          className="text-xs font-medium text-muted-foreground"
                          htmlFor={`note-${report.id}`}
                        >
                          Response to user (optional)
                        </label>
                        <textarea
                          className="w-full resize-none rounded-md border border-border bg-background/70 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          defaultValue={report.admin_note ?? ""}
                          id={`note-${report.id}`}
                          name="admin_note"
                          placeholder="Visible to the user on their My Reports page"
                          rows={2}
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          className={cn(
                            buttonVariants({ variant: "default" }),
                            "h-8 text-xs",
                          )}
                          type="submit"
                        >
                          Update
                        </button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
