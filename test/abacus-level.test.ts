import test from "node:test";
import assert from "node:assert/strict";
import { ProgressSync } from "../src/progress/sync.js";
import { MockProgressClient } from "../src/progress/mock.js";
import { STREAK_TO_LEVEL_UP } from "../src/games/quiz.js";

// The RN Abacus screen takes its level from ProgressSync, so this is the abacus level-up rule.
test("abacus levels up after STREAK_TO_LEVEL_UP correct in a row, wrong resets", () => {
  const s = new ProgressSync(new MockProgressClient(), "t", () => 1);
  for (let i = 0; i < STREAK_TO_LEVEL_UP - 1; i++) s.record("abacus", 1, true);
  s.record("abacus", 1, false);
  assert.equal(s.currentLevel("abacus"), 1);
  for (let i = 0; i < STREAK_TO_LEVEL_UP; i++) s.record("abacus", 1, true);
  assert.equal(s.currentLevel("abacus"), 2);
});
