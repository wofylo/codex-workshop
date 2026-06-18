import assert from "node:assert/strict";
import test from "node:test";
import { getAccountRedirectPath, isApprovedActiveProfile } from "./account-status.ts";
import type { AccountStatusProfile } from "./account-status.ts";

const approvedProfile: AccountStatusProfile = {
  approval_status: "approved",
  is_deleted: false,
};

test("getAccountRedirectPath sends missing profiles to pending", () => {
  assert.equal(getAccountRedirectPath(null, true), "/auth/pending");
});

test("getAccountRedirectPath requires email confirmation before approval state", () => {
  assert.equal(getAccountRedirectPath(approvedProfile, false), "/auth/verify-email");
});

test("getAccountRedirectPath maps account state pages", () => {
  assert.equal(getAccountRedirectPath({ approval_status: "pending", is_deleted: false }, true), "/auth/pending");
  assert.equal(getAccountRedirectPath({ approval_status: "rejected", is_deleted: false }, true), "/auth/rejected");
  assert.equal(getAccountRedirectPath({ approval_status: "approved", is_deleted: true }, true), "/auth/deactivated");
  assert.equal(getAccountRedirectPath(approvedProfile, true), null);
});

test("isApprovedActiveProfile accepts only approved non-deleted profiles", () => {
  assert.equal(isApprovedActiveProfile(approvedProfile), true);
  assert.equal(isApprovedActiveProfile({ approval_status: "pending", is_deleted: false }), false);
  assert.equal(isApprovedActiveProfile({ approval_status: "approved", is_deleted: true }), false);
  assert.equal(isApprovedActiveProfile(null), false);
});
