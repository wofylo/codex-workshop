import assert from "node:assert/strict";
import test from "node:test";
import { scoreAnswer, scoreAttempt, parseChoiceIndex, choiceLabel } from "./helpers.ts";

test("scoreAnswer: correct index returns true", () => {
  assert.equal(scoreAnswer(2, 2), true);
});

test("scoreAnswer: wrong index returns false", () => {
  assert.equal(scoreAnswer(0, 2), false);
});

test("scoreAnswer: null selected returns false", () => {
  assert.equal(scoreAnswer(null, 2), false);
});

test("scoreAttempt: empty answers returns zeros", () => {
  assert.deepEqual(scoreAttempt([]), { score: 0, total: 0, percentage: 0 });
});

test("scoreAttempt: all correct returns 100%", () => {
  const result = scoreAttempt([
    { selectedChoiceIndex: 1, correctChoiceIndex: 1 },
    { selectedChoiceIndex: 0, correctChoiceIndex: 0 },
  ]);
  assert.deepEqual(result, { score: 2, total: 2, percentage: 100 });
});

test("scoreAttempt: partial correct rounds percentage", () => {
  const result = scoreAttempt([
    { selectedChoiceIndex: 1, correctChoiceIndex: 1 },
    { selectedChoiceIndex: 0, correctChoiceIndex: 2 },
    { selectedChoiceIndex: 3, correctChoiceIndex: 1 },
    { selectedChoiceIndex: 0, correctChoiceIndex: 0 },
  ]);
  assert.deepEqual(result, { score: 2, total: 4, percentage: 50 });
});

test("scoreAttempt: null selected counts as incorrect", () => {
  const result = scoreAttempt([{ selectedChoiceIndex: null, correctChoiceIndex: 0 }]);
  assert.deepEqual(result, { score: 0, total: 1, percentage: 0 });
});

test("scoreAttempt: percentage rounds to nearest integer", () => {
  const result = scoreAttempt([
    { selectedChoiceIndex: 0, correctChoiceIndex: 0 },
    { selectedChoiceIndex: 1, correctChoiceIndex: 0 },
    { selectedChoiceIndex: 1, correctChoiceIndex: 0 },
  ]);
  assert.equal(result.percentage, 33);
});

test("parseChoiceIndex: returns null for null", () => {
  assert.equal(parseChoiceIndex(null), null);
});

test("parseChoiceIndex: parses numeric string", () => {
  assert.equal(parseChoiceIndex("2"), 2);
});

test("parseChoiceIndex: returns null for empty string", () => {
  assert.equal(parseChoiceIndex(""), null);
});

test("parseChoiceIndex: returns null for non-numeric string", () => {
  assert.equal(parseChoiceIndex("abc"), null);
});

test("choiceLabel: returns A-D for indices 0-3", () => {
  assert.equal(choiceLabel(0), "A");
  assert.equal(choiceLabel(1), "B");
  assert.equal(choiceLabel(2), "C");
  assert.equal(choiceLabel(3), "D");
});
