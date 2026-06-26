"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function getString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function createQuestionAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const domainId = getString(formData, "domain_id");
  const questionEn = getString(formData, "question_en");
  const choice0 = getString(formData, "choice_0");
  const choice1 = getString(formData, "choice_1");
  const choice2 = getString(formData, "choice_2");
  const choice3 = getString(formData, "choice_3");
  const correctRaw = getString(formData, "correct_choice_index");
  const explanationEn = getString(formData, "explanation_en");

  if (
    !domainId ||
    !questionEn ||
    !choice0 ||
    !choice1 ||
    !choice2 ||
    !choice3 ||
    !correctRaw ||
    !explanationEn
  ) {
    redirect("/admin/questions/new?error=missing-fields");
  }

  const correctIndex = parseInt(correctRaw, 10);
  if (isNaN(correctIndex) || correctIndex < 0 || correctIndex > 3) {
    redirect("/admin/questions/new?error=invalid-correct-index");
  }

  const supabase = createAdminSupabaseClient();

  const { error } = await supabase.from("questions").insert({
    domain_id: domainId,
    question_en: questionEn,
    choices_en: [choice0, choice1, choice2, choice3],
    correct_choice_index: correctIndex,
    explanation_en: explanationEn,
    status: "active",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/questions");
  redirect("/admin/questions");
}

export async function toggleQuestionStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const questionId = getString(formData, "question_id");
  const currentStatus = getString(formData, "current_status");

  if (!questionId || !currentStatus) return;

  const newStatus = currentStatus === "active" ? "disabled" : "active";

  const supabase = createAdminSupabaseClient();

  await supabase
    .from("questions")
    .update({ status: newStatus })
    .eq("id", questionId);

  revalidatePath("/admin/questions");
}
