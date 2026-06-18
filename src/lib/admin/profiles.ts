import type { Database } from "@/lib/supabase/database.types";

export type AdminProfileAction =
  | "approve"
  | "reject"
  | "deactivate"
  | "restore"
  | "toggle_premium";

export type AdminProfileListItem = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  | "id"
  | "display_name"
  | "role"
  | "approval_status"
  | "is_deleted"
  | "is_premium"
  | "created_at"
  | "updated_at"
  | "approved_at"
  | "rejected_at"
  | "deleted_at"
> & {
  email: string | null;
  email_confirmed: boolean;
};

export function getProfileQueueSummary(profiles: AdminProfileListItem[]) {
  return profiles.reduce(
    (summary, profile) => {
      summary.total += 1;

      if (profile.approval_status === "pending") {
        summary.pending += 1;
      }

      if (profile.approval_status === "approved") {
        summary.approved += 1;
      }

      if (profile.approval_status === "rejected") {
        summary.rejected += 1;
      }

      if (profile.is_deleted) {
        summary.deleted += 1;
      }

      if (profile.is_premium) {
        summary.premium += 1;
      }

      return summary;
    },
    {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      deleted: 0,
      premium: 0,
    },
  );
}

export function buildAdminProfileUpdate(
  action: AdminProfileAction,
  actorAdminId: string,
  now: string,
  premiumValue?: boolean,
) {
  if (action === "approve") {
    return {
      approval_status: "approved" as const,
      approved_at: now,
      approved_by: actorAdminId,
      rejected_at: null,
      rejected_by: null,
    };
  }

  if (action === "reject") {
    return {
      approval_status: "rejected" as const,
      rejected_at: now,
      rejected_by: actorAdminId,
    };
  }

  if (action === "deactivate") {
    return {
      is_deleted: true,
      deleted_at: now,
      deleted_by: actorAdminId,
    };
  }

  if (action === "restore") {
    return {
      is_deleted: false,
      deleted_at: null,
      deleted_by: null,
    };
  }

  return {
    is_premium: Boolean(premiumValue),
  };
}

export function isAdminProfileAction(action: string): action is AdminProfileAction {
  return (
    action === "approve" ||
    action === "reject" ||
    action === "deactivate" ||
    action === "restore" ||
    action === "toggle_premium"
  );
}
