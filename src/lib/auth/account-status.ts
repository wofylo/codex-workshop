import type { Database } from "@/lib/supabase/database.types";

type ApprovalStatus = Database["public"]["Enums"]["approval_status"];

export type AccountStatusProfile = {
  approval_status: ApprovalStatus;
  is_deleted: boolean;
};

export function isApprovedActiveProfile(profile: AccountStatusProfile | null) {
  return profile?.approval_status === "approved" && !profile.is_deleted;
}

export function getAccountRedirectPath(
  profile: AccountStatusProfile | null,
  isEmailConfirmed: boolean,
) {
  if (!isEmailConfirmed) {
    return "/auth/verify-email";
  }

  if (!profile) {
    return "/auth/pending";
  }

  if (profile.is_deleted) {
    return "/auth/deactivated";
  }

  if (profile.approval_status === "pending") {
    return "/auth/pending";
  }

  if (profile.approval_status === "rejected") {
    return "/auth/rejected";
  }

  return null;
}
