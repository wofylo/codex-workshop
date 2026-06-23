"use server";

import { revalidatePath } from "next/cache";
import { requireApprovedUser } from "@/lib/auth/guards";
import { getStudyContent, type StudyLanguage } from "@/lib/study/content";
import { buildStudyProgressMutation } from "@/lib/study/progress";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getLanguage(value: string): StudyLanguage {
  return value === "zh" ? "zh" : "en";
}

export async function setSectionReadAction(formData: FormData) {
  const profile = await requireApprovedUser();
  const domainSlug = getString(formData, "domain_slug");
  const language = getLanguage(getString(formData, "language"));
  const sectionId = getString(formData, "section_id");
  const read = getString(formData, "read") === "true";
  const content = getStudyContent(domainSlug, language);
  const path = `/study/${domainSlug}`;

  if (!content) {
    revalidatePath(path);
    return;
  }

  const section = content.sections.find((candidate) => candidate.id === sectionId);

  if (!section) {
    revalidatePath(path);
    return;
  }

  const supabase = await createServerSupabaseClient();
  const mutation = buildStudyProgressMutation({
    userId: profile.id,
    domainSlug: content.domain.slug,
    language: content.language,
    section,
    read,
    now: new Date().toISOString(),
  });
  const { error } = await supabase
    .from("study_progress")
    .upsert(mutation, { onConflict: "user_id,domain_slug,language,section_id" });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(path);
}
