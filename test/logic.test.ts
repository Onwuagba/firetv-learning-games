import { test } from "node:test";
import assert from "node:assert/strict";
import { makeQuestion, maxLevel, type Topic } from "../src/curriculum.js";
import * as A from "../src/games/abacus.js";
import * as Q from "../src/games/quiz.js";
import * as B from "../src/games/balance.js";
import { moveFocus, type FocusNode } from "../src/focus/grid.js";
import { back, go, initialNav, current, atHome } from "../src/nav.js";
import { MockProgressClient } from "../src/progress/mock.js";
import { ProgressSync, applyEvents, mergeProgress } from "../src/progress/sync.js";
import { HttpProgressClient } from "../src/progress/http.js";
import { PermanentError } from "../src/progress/types.js";
import { mapKey } from "../src/ui/keys.js";

const seeded = (seed = 1) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

test("curriculum: 300 random questions per level are valid, answer in choices, choices unique", () => {
  const rng = seeded(7);
  for (const t of ["abacus", "algebra", "geography"] as Topic[])
    for (let l = 1; l <= maxLevel(t); l++)
      for (let i = 0; i < 300; i++) {
        const q = makeQuestion(t, l, rng);
        assert.equal(new Set(q.choices).size, 4, `${t}${l}: ${q.choices}`);
        assert.ok(q.choices.includes(q.answer));
        if (t !== "geography") assert.ok(q.choices.every((c) => Number(c) >= 0));
      }
});

test("abacus: rods clamp 0..9, cursor clamps, third rod, correctness", () => {
  let s = A.newAbacus(3);
  s = A.press(s, "down"); assert.equal(A.value(s), 0);
  for (let i = 0; i < 12; i++) s = A.press(s, "up"); assert.equal(s.rods[0], 9);
  s = A.press(A.press(A.press(A.press(s, "left"), "left"), "left"), "left"); assert.equal(s.cursor, 2);
  s = A.press(s, "up"); assert.equal(A.value(s), 109);
  s = A.press(A.press(s, "right"), "right"); assert.equal(s.cursor, 0);
  assert.equal(A.press(s, "right").cursor, 0);
  assert.equal(A.press(s, "select"), s);
  assert.ok(A.isCorrect(s, "109")); assert.ok(!A.isCorrect(s, "108"));
  assert.equal(A.value(A.reset(s)), 0); assert.equal(A.rodCount(100), 3); assert.equal(A.rodCount(20), 2);
  const before = A.newAbacus(); A.press(before, "up"); assert.deepEqual(before.rods, [0, 0]); // immutable
});

test("quiz: 2x2 focus movement clamps; submit right/wrong; streak and level up", () => {
  const rng = seeded(3);
  let s = Q.newQuiz("geography", 1, rng);
  assert.equal(s.focus, 0);
  s = Q.moveChoice(s, "left"); s = Q.moveChoice(s, "up"); assert.equal(s.focus, 0);
  s = Q.moveChoice(s, "right"); assert.equal(s.focus, 1);
  s = Q.moveChoice(s, "down"); assert.equal(s.focus, 3);
  s = Q.moveChoice(s, "right"); s = Q.moveChoice(s, "down"); assert.equal(s.focus, 3);
  // answer correctly 3 times
  for (let i = 0; i < 3; i++) {
    s = { ...s, focus: s.question.choices.indexOf(s.question.answer) };
    s = Q.submit(s); assert.ok(Q.isCorrect(s));
    assert.equal(Q.submit(s), s); assert.equal(Q.moveChoice(s, "left"), s);
    s = Q.next(s, rng);
  }
  assert.equal(s.level, 2); assert.equal(s.streak, 0); assert.equal(s.correct, 3);
  const wrongIdx = s.question.choices.findIndex((c) => c !== s.question.answer);
  s = Q.submit({ ...s, focus: wrongIdx }); assert.ok(!Q.isCorrect(s)); assert.equal(s.streak, 0);
});

test("quiz: no level up past max", () => {
  const top = maxLevel("geography"); let s = Q.newQuiz("geography", top, seeded(2)); s.streak = 2;
  s = Q.submit({ ...s, focus: s.question.choices.indexOf(s.question.answer) });
  assert.equal(s.leveledUp, false); assert.equal(Q.next(s).level, top);
});

test("balance: parse all equation shapes", () => {
  assert.deepEqual(B.parseEquation("x + 4 = 9"), { a: 1, b: 4, c: 9 });
  assert.deepEqual(B.parseEquation("3x = 12"), { a: 3, b: 0, c: 12 });
  assert.deepEqual(B.parseEquation("4x + 7 = 23"), { a: 4, b: 7, c: 23 });
  assert.throws(() => B.parseEquation("nonsense"));
  const rng = seeded(11);
  for (let l = 1; l <= maxLevel("algebra"); l++) for (let i = 0; i < 100; i++) {
    const q = makeQuestion("algebra", l, rng); const e = B.parseEquation(q.prompt);
    assert.equal(B.imbalance(e, Number(q.answer)), 0, q.prompt);
  }
});

test("balance: tilt direction, clamp, solve by adjusting", () => {
  const e = { a: 2, b: 1, c: 9 }; // x=4
  assert.ok(B.tiltDegrees(e, 0) < 0); assert.ok(B.tiltDegrees(e, 10) > 0);
  assert.equal(B.tiltDegrees(e, 4), 0); assert.equal(Math.abs(B.tiltDegrees(e, 1000)), 14);
  let s = B.newBalance(1, seeded(5)); const target = Number(s.question.answer);
  s = B.adjust(s, "down"); assert.equal(s.guess, 0); assert.ok(!s.solved);
  for (let i = 0; i < target; i++) s = B.adjust(s, "up");
  assert.ok(s.solved); assert.equal(B.adjust(s, "up"), s);
  let t = { ...B.newBalance(1, seeded(5)) }; for (let i = 0; i < 40; i++) t = B.adjust({ ...t, solved: false }, "right"); assert.equal(t.guess, 20);
});

test("focus grid: moves, edges, disabled, empty rows", () => {
  const n: FocusNode[] = [{ id: "a", row: 0, col: 0 }, { id: "b", row: 0, col: 1 }, { id: "c", row: 0, col: 2, disabled: true }, { id: "d", row: 1, col: 0 }, { id: "e", row: 1, col: 1 }];
  assert.equal(moveFocus(n, "a", "right"), "b"); assert.equal(moveFocus(n, "b", "right"), "b"); // skip disabled
  assert.equal(moveFocus(n, "a", "left"), "a"); assert.equal(moveFocus(n, "a", "down"), "d");
  assert.equal(moveFocus(n, "e", "up"), "b"); assert.equal(moveFocus(n, "d", "up"), "a");
  assert.equal(moveFocus(n, "zzz", "up"), "a");
  assert.equal(moveFocus([{ id: "x", row: 0, col: 0 }, { id: "y", row: 2, col: 5 }], "x", "down"), "y");
});

test("nav: push, back to home, no-op at home, no duplicate push", () => {
  let n = initialNav(); assert.ok(atHome(n));
  n = go(n, "abacus"); n = go(n, "abacus"); assert.equal(n.stack.length, 2); assert.equal(current(n), "abacus");
  n = back(n); assert.equal(current(n), "home"); assert.equal(back(n), n);
});

test("keys: remote mapping", () => {
  assert.equal(mapKey("ArrowUp"), "up"); assert.equal(mapKey("Enter"), "select"); assert.equal(mapKey("Escape"), "back"); assert.equal(mapKey("KeyQ"), null);
});

test("progress: applyEvents levels up after 3 correct streak, wrong resets", () => {
  const ev = (correct: boolean, at: number, level = 1) => ({ topic: "abacus" as Topic, level, correct, at });
  let p = applyEvents({}, [ev(true, 1), ev(true, 2), ev(false, 3), ev(true, 4), ev(true, 5)]);
  assert.equal(p.abacus!.level, 1); assert.equal(p.abacus!.attempts, 5); assert.equal(p.abacus!.correct, 4);
  p = applyEvents({}, [ev(true, 1), ev(true, 2), ev(true, 3)]); assert.equal(p.abacus!.level, 2); assert.equal(p.abacus!.updatedAt, 3);
});

test("progress: merge keeps higher level and both topics", () => {
  const m = mergeProgress({ abacus: { level: 3, correct: 5, attempts: 6, updatedAt: 9 } }, { abacus: { level: 2, correct: 8, attempts: 9, updatedAt: 4 }, algebra: { level: 1, correct: 0, attempts: 1, updatedAt: 1 } });
  assert.equal(m.abacus!.level, 3); assert.equal(m.abacus!.correct, 8); assert.ok(m.algebra);
});

test("sync: offline queue is retained then flushed; load merges remote", async () => {
  const api = new MockProgressClient(); let t = 0;
  api.store.set("kid", { geography: { level: 2, correct: 4, attempts: 4, updatedAt: 1 } });
  const s = new ProgressSync(api, "kid", () => ++t);
  await s.load(); assert.equal(s.currentLevel("geography"), 2);
  s.record("abacus", 1, true); s.record("abacus", 1, true); s.record("abacus", 1, true);
  api.failNext = 1; assert.equal(await s.flush(), false); assert.equal(s.queue.length, 3);
  assert.equal(await s.flush(), true); assert.equal(s.queue.length, 0);
  assert.equal(api.store.get("kid")!.abacus!.level, 2); assert.equal(s.currentLevel("abacus"), 2);
  api.failNext = 1; await s.load(); // offline load stays local
  assert.equal(s.currentLevel("geography"), 2);
});

test("http client: matches the coach TV API contract (fetch stubbed)", async () => {
  const calls: { url: string; init?: RequestInit }[] = [];
  const reply = { progress: { abacus: { level: 2, correct: 2, attempts: 2, streak: 0, updatedAt: 5 } } };
  const f = (async (url: string, init?: RequestInit) => { calls.push({ url, init }); return { ok: true, status: 200, json: async () => reply }; }) as unknown as typeof fetch;
  const c = new HttpProgressClient("https://x.test/", "tok", f);
  const p = await c.fetchProgress("a b");
  assert.equal(p.abacus!.level, 2);
  await c.pushEvents("a b", [{ topic: "abacus", level: 7, correct: true, at: 9, id: "k1" }]);
  assert.equal(calls[0].url, "https://x.test/api/progress/a%20b");
  assert.equal((calls[0].init!.headers as Record<string, string>).authorization, "Bearer tok");
  assert.equal(calls[1].url, "https://x.test/api/progress/a%20b/events");
  assert.equal(calls[1].init?.method, "POST");
  assert.deepEqual(JSON.parse(calls[1].init!.body as string), { events: [{ id: "k1", topic: "abacus", correct: true, at: 9 }] }); // no client-claimed level
});

test("http client: errors; 400 is permanent, 5xx/401 are retryable, bad shape rejected", async () => {
  const mk = (status: number, body: unknown = {}) => new HttpProgressClient("http://x", "t", (async () => ({ ok: status < 300, status, json: async () => body })) as unknown as typeof fetch);
  await assert.rejects(mk(401).fetchProgress("a"), (e: Error) => !(e instanceof PermanentError));
  await assert.rejects(mk(500).pushEvents("a", []), (e: Error) => !(e instanceof PermanentError));
  await assert.rejects(mk(400).pushEvents("a", []), PermanentError);
  await assert.rejects(mk(200, { nope: 1 }).fetchProgress("a"), /unexpected/);
});

function memStore() {
  const m = new Map<string, string>();
  return { m, getItem: async (k: string) => m.get(k) ?? null, setItem: async (k: string, v: string) => { m.set(k, v); } };
}

test("sync: state persists across restarts and unsent events flush when back online", async () => {
  const st = memStore(); const api = new MockProgressClient(); let t = 0;
  const a = new ProgressSync(api, "kid", () => ++t, st);
  await a.restore(); await a.load();
  api.failNext = 5;
  a.record("abacus", 1, true); a.record("abacus", 1, true); a.record("abacus", 1, true);
  assert.equal(await a.flush(), false); assert.equal(a.status, "offline");
  await new Promise((r) => setTimeout(r, 0));
  // "restart": new instance, same storage, server still offline for the first load
  const b = new ProgressSync(api, "kid", () => ++t, st);
  await b.restore(); await b.load();
  assert.equal(b.queue.length, 3); assert.equal(b.currentLevel("abacus"), 2); assert.equal(b.status, "offline");
  api.failNext = 0;
  assert.equal(await b.flush(), true); assert.equal(b.status, "synced");
  assert.equal(api.store.get("kid")!.abacus!.attempts, 3);
  assert.equal(JSON.parse(st.m.get("learncoach:v1:kid")!).queue.length, 0);
});

test("sync: server is source of truth on load; queued events are re-applied on top; permanent errors drop the batch", async () => {
  const api = new MockProgressClient(); const s = new ProgressSync(api, "kid", () => 1);
  api.store.set("kid", { abacus: { level: 4, correct: 9, attempts: 9, updatedAt: 1 } });
  s.progress = { abacus: { level: 1, correct: 0, attempts: 0, updatedAt: 0 } };
  await s.load(); assert.equal(s.currentLevel("abacus"), 4);
  s.record("abacus", 4, true); await s.load(); assert.equal(s.progress.abacus!.attempts, 10); assert.equal(s.status, "pending");
  api.pushEvents = async () => { throw new PermanentError("bad"); };
  assert.equal(await s.flush(), false); assert.equal(s.queue.length, 0);
});
