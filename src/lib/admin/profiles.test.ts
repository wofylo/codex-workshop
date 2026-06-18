import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAdminProfileUpdate,
  getProfileQueueSummary,
  type AdminProfileAction,
  type AdminProfileListItem,
} from "./profiles.ts";

const baseProfile: AdminProfileListItem = {
  id: "profile-1",
  display_name: "Learner",
  role: "student",
  approval_status: "pending",
  is_deleted: false,
  is_premium: false,
  created_at: "2026-06-18T00:00:00Z",
  updated_at: "2026-06-18T00:00:00Z",
  approved_at: null,
  rejected_at: null,
  deleted_at: null,
  email: "learner@example.com",
  email_confirmed: false,
};

test("getProfileQueueSummary counts account states for admin overview", () => {
  const profiles: AdminProfileListItem[] = [
    baseProfile,
    { ...baseProfile, id: "profile-2", approval_status: "approved", is_premium: true },
    { ...baseProfile, id: "profile-3", approval_status: "rejected" },
    { ...baseProfile, id: "profile-4", approval_status: "approved", is_deleted: true },
  ];

  assert.deepEqual(getProfileQueueSummary(profiles), {
    total: 4,
    pending: 1,
    approved: 2,
    rejected: 1,
    deleted: 1,
    premium: 1,
  });
});

test("buildAdminProfileUpdate returns scoped mutations for profile actions", () => {
  const actorId = "admin-1";
  const at = "2026-06-18T12:00:00.000Z";

  const cases: Array<[AdminProfileAction, Record<string, unknown>]> = [
    [
      "approve",
      {
        approval_status: "approved",
        approved_at: at,
        approved_by: actorId,
        rejected_at: null,
        rejected_by: null,
      },
    ],
    [
      "reject",
      {
        approval_status: "rejected",
        rejected_at: at,
        rejected_by: actorId,
      },
    ],
    [
      "deactivate",
      {
        is_deleted: true,
        deleted_at: at,
        deleted_by: actorId,
      },
    ],
    [
      "restore",
      {
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
      },
    ],
  ];

  for (const [action, expected] of cases) {
    assert.deepEqual(buildAdminProfileUpdate(action, actorId, at), expected);
  }
});

test("buildAdminProfileUpdate toggles premium explicitly", () => {
  assert.deepEqual(buildAdminProfileUpdate("toggle_premium", "admin-1", "now", true), {
    is_premium: true,
  });
  assert.deepEqual(buildAdminProfileUpdate("toggle_premium", "admin-1", "now", false), {
    is_premium: false,
  });
});
