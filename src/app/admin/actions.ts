"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/guards";
import {
  buildAdminProfileUpdate,
  isAdminProfileAction,
  type AdminProfileAction,
} from "@/lib/admin/profiles";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getPremiumValue(formData: FormData) {
  return getString(formData, "premium_value") === "true";
}

export async function updateProfileAction(formData: FormData) {
  const actor = await requireAdmin();
  const profileId = getString(formData, "profile_id");
  const action = getString(formData, "action");

  if (!profileId || !isAdminProfileAction(action)) {
    throw new Error("Invalid admin profile action.");
  }

  const supabase = createAdminSupabaseClient();
  const now = new Date().toISOString();
  const update = buildAdminProfileUpdate(
    action,
    actor.id,
    now,
    getPremiumValue(formData),
  );

  const { error } = await supabase.from("profiles").update(update).eq("id", profileId);

  if (error) {
    throw new Error(error.message);
  }

  await recordAdminAuditEvent(action, actor.id, profileId);
  revalidatePath("/admin");
}

async function recordAdminAuditEvent(
  action: AdminProfileAction,
  actorAdminId: string,
  targetProfileId: string,
) {
  const supabase = createAdminSupabaseClient();

  await supabase.from("admin_audit_events").insert({
    actor_admin_id: actorAdminId,
    action: `profile.${action}`,
    target_table: "profiles",
    target_id: targetProfileId,
  });
}
