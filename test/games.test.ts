import { test } from "node:test";
import assert from "node:assert/strict";
import { makeQuestion, maxLevel, type Topic } from "../src/curriculum.js";
import { newAbacus, press, value } from "../src/games/abacus.js";

test("every level makes a question whose answer is among 4 choices", () => {
  for (const t of ["abacus", "algebra", "geography"] as Topic[])
    for (let l = 1; l <= maxLevel(t); l++) {
      const q = makeQuestion(t, l);
      assert.equal(q.choices.length, 4, `${t} ${l}`);
      assert.ok(q.choices.includes(q.answer));
    }
});

test("abacus: 23 with the remote", () => {
  let s = newAbacus();
  for (const k of ["up", "up", "up", "left", "up", "up"] as const) s = press(s, k);
  assert.equal(value(s), 23);
});
