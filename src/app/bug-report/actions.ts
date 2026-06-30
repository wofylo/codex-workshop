"use server";

import { requireApprovedUser } from "@/lib/auth/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import {
  validateBugTitle,
  validateBugDescription,
  isBugCategory,
  validateBugFiles,
} from "@/lib/bug-reports/validation";

export type CreateBugReportResult =
  | { success: true; reportId: string }
  | { success: false; error: string };

export async function createBugReportAction(
  formData: FormData,
): Promise<CreateBugReportResult> {
  const profile = await requireApprovedUser();

  const title = formData.get("title");
  const description = formData.get("description");
  const category = formData.get("category");
  const pageUrl = formData.get("page_url") as string | null;
  const rawFiles = formData.getAll("files") as File[];
  const files = rawFiles.filter((f) => f.size > 0);

  const titleError = validateBugTitle(title);
  if (titleError) return { success: false, error: titleError };

  const descError = validateBugDescription(description);
  if (descError) return { success: false, error: descError };

  if (!isBugCategory(category)) {
    return { success: false, error: "Invalid category" };
  }

  const filesError = validateBugFiles(files);
  if (filesError) return { success: false, error: filesError };

  const supabase = await createServerSupabaseClient();

  const { data: report, error: reportError } = await supabase
    .from("bug_reports")
    .insert({
      user_id: profile.id,
      title: (title as string).trim(),
      description: (description as string).trim(),
      category,
      page_url: pageUrl || null,
    })
    .select("id")
    .single();

  if (reportError || !report) {
    return { success: false, error: "Failed to create report. Please try again." };
  }

  if (files.length > 0) {
    const adminSupabase = createAdminSupabaseClient();
    for (const file of files) {
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const path = `${profile.id}/${report.id}/${safeName}`;
      const buffer = await file.arrayBuffer();

      const { error: uploadError } = await adminSupabase.storage
        .from("bug-attachments")
        .upload(path, buffer, { contentType: file.type });

      if (uploadError) {
        console.error("[bug-report] storage upload failed", { path, error: uploadError.message });
        continue;
      }

      const { error: insertError } = await supabase.from("bug_report_files").insert({
        report_id: report.id,
        storage_path: path,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type || null,
      });

      if (insertError) {
        console.error("[bug-report] bug_report_files insert failed — orphaned storage object", { path, error: insertError.message });
      }
    }
  }

  return { success: true, reportId: report.id };
}

export async function createGuestBugReportAction(
  formData: FormData,
): Promise<CreateBugReportResult> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.is_anonymous) {
    return { success: false, error: "Guest session required." };
  }

  const title = formData.get("title");
  const description = formData.get("description");
  const category = formData.get("category");
  const pageUrl = formData.get("page_url") as string | null;

  const titleError = validateBugTitle(title);
  if (titleError) return { success: false, error: titleError };

  const descError = validateBugDescription(description);
  if (descError) return { success: false, error: descError };

  if (!isBugCategory(category)) {
    return { success: false, error: "Invalid category" };
  }

  const adminSupabase = createAdminSupabaseClient();
  const { data: report, error: reportError } = await adminSupabase
    .from("bug_reports")
    .insert({
      user_id: null,
      title: (title as string).trim(),
      description: (description as string).trim(),
      category,
      page_url: pageUrl || null,
    })
    .select("id")
    .single();

  if (reportError || !report) {
    return { success: false, error: "Failed to create report. Please try again." };
  }

  return { success: true, reportId: report.id };
}
