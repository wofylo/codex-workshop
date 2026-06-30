import assert from "node:assert/strict";
import test from "node:test";
import { isGuestUser } from "./guest-user.ts";
import type { GuestUser } from "./guest-user.ts";
import type { ApprovedProfile } from "./profiles.ts";

const guestUser: GuestUser = { id: "anon-uuid", is_guest: true };

const approvedProfile = {
  id: "user-uuid",
  display_name: "Test",
  display_name_normalized: "test",
  approval_status: "approved",
  is_deleted: false,
  is_premium: false,
  role: "student",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  approved_at: null,
  approved_by: null,
  deleted_at: null,
  deleted_by: null,
  rejected_at: null,
  rejected_by: null,
} as ApprovedProfile;

test("isGuestUser returns true for GuestUser", () => {
  assert.equal(isGuestUser(guestUser), true);
});

test("isGuestUser returns false for ApprovedProfile", () => {
  assert.equal(isGuestUser(approvedProfile), false);
});
