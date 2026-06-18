import assert from "node:assert/strict";
import test from "node:test";
import { getAuthErrorCopy } from "./error-copy.ts";

test("getAuthErrorCopy explains invalid login credentials", () => {
  assert.deepEqual(getAuthErrorCopy("login"), {
    title: "Sign in failed",
    message:
      "Supabase did not accept that email and password. Create an account first, or check the credentials and try again.",
  });
});

test("getAuthErrorCopy explains signup and profile bootstrap failures", () => {
  assert.equal(getAuthErrorCopy("signup").title, "Account request failed");
  assert.equal(getAuthErrorCopy("profile").title, "Profile setup failed");
});

test("getAuthErrorCopy falls back to a generic message", () => {
  assert.equal(getAuthErrorCopy(null).title, "Authentication problem");
  assert.equal(getAuthErrorCopy("unexpected").title, "Authentication problem");
});
