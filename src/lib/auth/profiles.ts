import type { User } from "@supabase/supabase-js";
import { getAccountRedirectPath } from "@/lib/auth/account-status";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type ApprovedProfile = ProfileRow & {
  approval_status: "approved";
  is_deleted: false;
};

export function isEmailConfirmed(user: User) {
  return Boolean(user.email_confirmed_at || user.confirmed_at);
}

export async function getCurrentProfile(): Promise<{
  user: User | null;
  profile: ProfileRow | null;
}> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      profile: null,
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    user,
    profile,
  };
}

export { getAccountRedirectPath };
