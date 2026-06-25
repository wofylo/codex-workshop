import assert from "node:assert/strict";
import test from "node:test";
import {
  validateBugTitle,
  validateBugDescription,
  isBugCategory,
  isBugStatus,
  validateBugFiles,
  MAX_FILES,
  MAX_FILE_SIZE,
} from "./validation.ts";

test("validateBugTitle: empty string returns error", () => {
  assert.ok(validateBugTitle("") !== null);
});

test("validateBugTitle: whitespace-only returns error", () => {
  assert.ok(validateBugTitle("   ") !== null);
});

test("validateBugTitle: valid title returns null", () => {
  assert.equal(validateBugTitle("Login page crashes"), null);
});

test("validateBugTitle: title over 200 chars returns error", () => {
  assert.ok(validateBugTitle("a".repeat(201)) !== null);
});

test("validateBugTitle: title exactly 200 chars returns null", () => {
  assert.equal(validateBugTitle("a".repeat(200)), null);
});

test("validateBugTitle: non-string returns error", () => {
  assert.ok(validateBugTitle(null) !== null);
  assert.ok(validateBugTitle(42) !== null);
});

test("validateBugDescription: empty string returns error", () => {
  assert.ok(validateBugDescription("") !== null);
});

test("validateBugDescription: whitespace-only returns error", () => {
  assert.ok(validateBugDescription("   ") !== null);
});

test("validateBugDescription: valid description returns null", () => {
  assert.equal(validateBugDescription("Steps to reproduce the issue"), null);
});

test("isBugCategory: valid categories return true", () => {
  assert.equal(isBugCategory("bug"), true);
  assert.equal(isBugCategory("feature"), true);
  assert.equal(isBugCategory("other"), true);
});

test("isBugCategory: invalid value returns false", () => {
  assert.equal(isBugCategory("unknown"), false);
  assert.equal(isBugCategory(""), false);
  assert.equal(isBugCategory(null), false);
  assert.equal(isBugCategory(undefined), false);
});

test("isBugStatus: valid statuses return true", () => {
  assert.equal(isBugStatus("open"), true);
  assert.equal(isBugStatus("in_progress"), true);
  assert.equal(isBugStatus("resolved"), true);
  assert.equal(isBugStatus("closed"), true);
});

test("isBugStatus: invalid value returns false", () => {
  assert.equal(isBugStatus("done"), false);
  assert.equal(isBugStatus(""), false);
  assert.equal(isBugStatus(null), false);
});

test("validateBugFiles: empty array returns null", () => {
  assert.equal(validateBugFiles([]), null);
});

test("validateBugFiles: over MAX_FILES files returns error", () => {
  const files = Array.from({ length: MAX_FILES + 1 }, (_, i) =>
    new File(["x"], `f${i}.txt`),
  );
  assert.ok(validateBugFiles(files) !== null);
});

test("validateBugFiles: exactly MAX_FILES under-limit files returns null", () => {
  const files = Array.from({ length: MAX_FILES }, (_, i) =>
    new File(["x"], `f${i}.txt`),
  );
  assert.equal(validateBugFiles(files), null);
});

test("validateBugFiles: file over MAX_FILE_SIZE returns error", () => {
  const big = new File([new Uint8Array(MAX_FILE_SIZE + 1)], "big.png", { type: "image/png" });
  assert.ok(validateBugFiles([big]) !== null);
});

test("validateBugFiles: file exactly MAX_FILE_SIZE returns null", () => {
  const exact = new File([new Uint8Array(MAX_FILE_SIZE)], "exact.png", { type: "image/png" });
  assert.equal(validateBugFiles([exact]), null);
});
