import assert from "node:assert/strict";
import test from "node:test";
import { validateDisplayName } from "./display-name.ts";

test("validateDisplayName trims and normalizes a valid name", () => {
  assert.deepEqual(validateDisplayName("  Wofy Lo  "), {
    ok: true,
    value: "Wofy Lo",
    normalized: "wofy lo",
  });
});

test("validateDisplayName rejects names outside the length bounds", () => {
  assert.deepEqual(validateDisplayName("ab"), {
    ok: false,
    reason: "length",
  });

  assert.deepEqual(validateDisplayName("a".repeat(41)), {
    ok: false,
    reason: "length",
  });
});

test("validateDisplayName rejects blank and control-character names", () => {
  assert.deepEqual(validateDisplayName("   "), {
    ok: false,
    reason: "length",
  });

  assert.deepEqual(validateDisplayName("bad\nname"), {
    ok: false,
    reason: "characters",
  });
});
