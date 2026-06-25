"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isBugStatus } from "@/lib/bug-reports/validation";

export type UpdateBugStatusResult =
  | { success: true }
  | { success: false; error: string };

/**
 * Updates bug report status and admin note.
 * Note: when invoked via form action with `void` wrapper, error results are not
 * surfaced to the browser — callers using useActionState can access them.
 */
export async function updateBugStatusAction(
  formData: FormData,
): Promise<UpdateBugStatusResult> {
  await requireAdmin();

  const reportId = formData.get("report_id") as string | null;
  const status = formData.get("status");
  const adminNote = formData.get("admin_note") as string | null;

  if (!reportId) return { success: false, error: "Missing report ID" };
  if (!isBugStatus(status)) return { success: false, error: "Invalid status" };

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("bug_reports")
    .update({
      status,
      admin_note: adminNote?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reportId);

  if (error) return { success: false, error: "Failed to update report" };
  revalidatePath("/admin/bugs");
  return { success: true };
}
