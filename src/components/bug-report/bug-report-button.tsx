"use client";

import { useState } from "react";
import { Bug } from "lucide-react";
import { BugReportDialog } from "./bug-report-dialog";

export function BugReportButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Report a bug or give feedback"
        className="fixed bottom-6 right-6 z-40 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        onClick={() => setOpen(true)}
        type="button"
      >
        <Bug className="size-5" aria-hidden="true" />
      </button>
      {open && <BugReportDialog onClose={() => setOpen(false)} />}
    </>
  );
}
