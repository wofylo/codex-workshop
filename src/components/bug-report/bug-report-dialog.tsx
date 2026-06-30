"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, Loader2, Paperclip, X } from "lucide-react";
import Link from "next/link";
import { createBugReportAction, createGuestBugReportAction } from "@/app/bug-report/actions";
import { MAX_FILE_SIZE, MAX_FILES } from "@/lib/bug-reports/validation";
import { cn } from "@/lib/utils";

type DialogState = "idle" | "success" | "error";

export function BugReportDialog({
  onClose,
  isGuest,
}: {
  onClose: () => void;
  isGuest: boolean;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<DialogState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pageUrl] = useState(() =>
    typeof window !== "undefined" ? window.location.href : ""
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const incoming = Array.from(e.target.files ?? []);

    const oversized = incoming.find((f) => f.size > MAX_FILE_SIZE);
    if (oversized) {
      setFileError(`"${oversized.name}" exceeds the 5 MB limit`);
      e.target.value = "";
      return;
    }

    const merged = [...files, ...incoming].slice(0, MAX_FILES);
    setFileError(null);
    setFiles(merged);
    e.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      let result;
      if (isGuest) {
        result = await createGuestBugReportAction(formData);
      } else {
        files.forEach((f) => formData.append("files", f));
        result = await createBugReportAction(formData);
      }

      if (result.success) {
        setDialogState("success");
      } else {
        setDialogState("error");
        setErrorMessage(result.error);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-center sm:justify-center">
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Dialog panel */}
      <div
        className="relative w-full max-w-lg rounded-lg border border-border bg-background shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Report an issue"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Report an issue</h2>
          <button
            aria-label="Close dialog"
            className="flex size-7 items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        {dialogState === "success" ? (
          <div className="flex flex-col items-center gap-4 px-5 py-12 text-center">
            <CheckCircle2 className="size-10 text-green-400" aria-hidden="true" />
            <p className="font-medium">Report submitted — thank you!</p>
            <p className="text-sm text-muted-foreground">
              We will review it and update the status.
            </p>
            {!isGuest && (
              <Link
                className="text-sm text-primary underline underline-offset-2"
                href="/my-bugs"
                onClick={onClose}
              >
                View your reports →
              </Link>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
            <input name="page_url" type="hidden" value={pageUrl} />

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="bug-title">
                Title <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <input
                className="w-full rounded-md border border-border bg-background/70 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                id="bug-title"
                maxLength={200}
                name="title"
                placeholder="Brief summary of the issue"
                required
                type="text"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="bug-description">
                Description <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <textarea
                className="w-full resize-none rounded-md border border-border bg-background/70 px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                id="bug-description"
                name="description"
                placeholder="Steps to reproduce, expected vs actual behavior..."
                required
                rows={4}
              />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="bug-category">
                Category <span className="text-destructive" aria-hidden="true">*</span>
              </label>
              <select
                className="w-full rounded-md border border-border bg-background/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                id="bug-category"
                name="category"
                required
              >
                <option value="bug">Bug</option>
                <option value="feature">Feature request</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* File upload — signed-in users only */}
            {!isGuest && (
              <div className="space-y-1.5">
                <p className="text-sm font-medium">
                  Attachments{" "}
                  <span className="font-normal text-muted-foreground">
                    (up to {MAX_FILES} files, 5 MB each)
                  </span>
                </p>
                {files.length < MAX_FILES && (
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-primary hover:underline">
                    <Paperclip className="size-4" aria-hidden="true" />
                    Add file
                    <input
                      accept="image/*,.pdf,.txt"
                      className="sr-only"
                      multiple
                      onChange={handleFileChange}
                      type="file"
                    />
                  </label>
                )}
                {files.length > 0 && (
                  <ul className="space-y-1">
                    {files.map((f, i) => (
                      <li key={`${f.name}-${f.size}`} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="min-w-0 flex-1 truncate">{f.name}</span>
                        <span className="shrink-0">({(f.size / 1024).toFixed(0)} KB)</span>
                        <button
                          aria-label={`Remove ${f.name}`}
                          className="ml-1 shrink-0 text-muted-foreground hover:text-foreground"
                          onClick={() => removeFile(i)}
                          type="button"
                        >
                          <X className="size-3" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {fileError && (
                  <p className="text-xs text-destructive">{fileError}</p>
                )}
              </div>
            )}

            {/* Submission error */}
            {dialogState === "error" && errorMessage && (
              <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
                {errorMessage}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-1">
              <button
                className="rounded-md border border-border px-4 py-2 text-sm transition hover:bg-muted"
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
              <button
                className={cn(
                  "flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50",
                )}
                disabled={isPending || !!fileError}
                type="submit"
              >
                {isPending && (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                )}
                Submit report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
