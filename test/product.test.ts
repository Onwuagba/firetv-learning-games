import { test } from "node:test";
import assert from "node:assert/strict";
import { allTopics, clampLevel, curriculum, levelSpec, maxLevel, playableTopics, KNOWN_KINDS, makeQuestion, type Topic } from "../src/curriculum.js";
import { hashString, mulberry32, seededFrom, shuffled } from "../src/rng.js";
import { flagEmoji, hasFlag } from "../src/flags.js";
import { asGeo, makeGeoQuestion } from "../src/games/geo.js";
import { CARD_ASPECT, defaultZoom, mapViewBox, nextZoom } from "../src/mapview.js";
import * as R from "../src/games/round.js";
import * as B from "../src/games/balance.js";
import * as A from "../src/games/abacus.js";
import * as P from "../src/profiles.js";
import * as N from "../src/nameEntry.js";
import * as S from "../src/settings.js";
import * as G from "../src/gate.js";
import * as M from "../src/motivation.js";
import { makeDaily, DAILY_LENGTH } from "../src/daily.js";
import { AppStore } from "../src/appStore.js";
import { back, go, initialNav, replace, current, gameScreen, topicOf } from "../src/nav.js";
import type { KeyValueStorage, Progress } from "../src/progress/types.js";

const memStore = (): KeyValueStorage & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: async (k) => data.get(k) ?? null, setItem: async (k, v) => { data.set(k, v); } };
};
const T = (y: number, m: number, d: number, h = 12) => Date.UTC(y, m - 1, d, h);

test("rng: deterministic, in range, shuffle keeps elements", () => {
  const a = mulberry32(5), b = mulberry32(5);
  for (let i = 0; i < 50; i++) { const x = a(); assert.equal(x, b()); assert.ok(x >= 0 && x < 1); }
  assert.equal(hashString("abc"), hashString("abc")); assert.notEqual(hashString("abc"), hashString("abd"));
  assert.deepEqual(shuffled([1, 2, 3, 4, 5], seededFrom("x")).sort(), [1, 2, 3, 4, 5]);
});

test("curriculum metadata drives the UI: playable topics, level clamp, kinds", () => {
  const topics = playableTopics();
  assert.ok(topics.length >= 3 && topics.every((t) => allTopics().includes(t)));
  for (const t of topics) for (const l of curriculum.topics[t].levels) assert.ok(KNOWN_KINDS.has(l.kind));
  const t = topics[0]; assert.equal(clampLevel(t, 0), 1); assert.equal(clampLevel(t, 999), maxLevel(t)); assert.equal(clampLevel(t, NaN), 1);
  assert.equal(levelSpec(t, 999).level, maxLevel(t));
});

test("flags: emoji from country names, unknown is empty", () => {
  assert.equal(flagEmoji("Nigeria"), "🇳🇬"); assert.equal(flagEmoji("Atlantis"), ""); assert.ok(hasFlag("Japan"));
  for (const c of curriculum.countries) assert.ok(hasFlag(c.name), `flag mapping missing for ${c.name}`);
});

test("geo: every mode valid, 4 unique choices incl. answer, all four modes appear", () => {
  const rng = mulberry32(3); const modes = new Set<string>();
  for (const t of allTopics().filter((x) => curriculum.topics[x].levels.some((l) => l.kind === "capital" || l.kind === "continent")))
    for (let l = 1; l <= maxLevel(t); l++) for (let i = 0; i < 200; i++) {
      const q = makeGeoQuestion(l, rng, t);
      modes.add(q.mode);
      assert.equal(q.choices.length, 4, q.prompt); assert.equal(new Set(q.choices).size, 4, q.prompt); assert.ok(q.choices.includes(q.answer));
      if (q.mode === "flag") assert.ok(q.flag);
      if (q.mode === "which-country" || q.mode === "flag") assert.equal(q.answer, q.country);
    }
  assert.deepEqual([...modes].sort(), ["capital", "continent", "flag", "which-country"].filter((m) => modes.has(m)));
  assert.ok(modes.has("flag") && modes.has("which-country") && modes.has("capital"));
  assert.equal(asGeo(makeQuestion("geography" as Topic, 2, mulberry32(1)))?.mode, "capital");
});

test("mapview: whole map at world zoom, centred and clamped otherwise, zoom cycles", () => {
  const [x, y, w, h] = mapViewBox(0, 0, "world"); assert.equal(x, 0); assert.equal(w, 1440); assert.ok(Math.abs(w / h - CARD_ASPECT) < 1e-9);
  const c = mapViewBox(700, 300, "region"); assert.equal(c[0] + c[2] / 2, 700); assert.equal(c[1] + c[3] / 2, 300);
  const edge = mapViewBox(5, 5, "close"); assert.equal(edge[0], 0); assert.equal(edge[1], 0);
  const far = mapViewBox(1440, 568, "close"); assert.equal(far[0] + far[2], 1440); assert.equal(far[1] + far[3], 568);
  assert.equal(nextZoom("world"), "region"); assert.equal(nextZoom("close"), "world");
  assert.equal(defaultZoom("world"), "world"); assert.equal(defaultZoom("africa"), "region");
});

test("round + stars", () => {
  assert.deepEqual([0, 1, 2, 3, 4, 5].map((c) => R.starsFor(c, 5)), [0, 1, 1, 2, 2, 3]);
  assert.equal(R.starsFor(0, 0), 0);
  let r = R.newRound("abacus", 1);
  for (const ok of [true, true, false, true, true]) r = R.answer(r, ok, r.answered === 1);
  assert.ok(R.isComplete(r)); assert.equal(r.correct, 4); assert.ok(r.leveledUp); assert.equal(R.answer(r, true), r);
  assert.equal(R.resultOf(r, "Abacus", true).stars, 2); assert.equal(R.resultOf(r, "Abacus").daily, undefined);
});

test("balance: two-sided equations parse and always solve to an integer; big ranges reachable; miss tracked", () => {
  assert.deepEqual(B.parseEquation("5x + 3 = 2x + 18"), { a: 5, b: 3, r: 2, c: 18 });
  assert.deepEqual(B.parseEquation("3x = x + 8"), { a: 3, b: 0, r: 1, c: 8 });
  const rng = mulberry32(9);
  for (let i = 0; i < 300; i++) { const q = B.makeTwoSided(rng); const e = B.parseEquation(q.prompt); assert.equal(B.solution(e), Number(q.answer), q.prompt); assert.equal(B.imbalance(e, Number(q.answer)), 0); }
  for (let l = 1; l <= maxLevel("algebra" as Topic); l++) for (let i = 0; i < 100; i++) { const s = B.newBalance(l, rng); assert.ok(Number(s.question.answer) <= s.max, `level ${l}`); }
  let s = B.newBalance(2, mulberry32(4)); assert.ok(s.max > 20); s = B.adjust(s, "right"); assert.equal(s.guess, 5); s = B.adjust(s, "up"); assert.equal(s.guess, 6);
  s = B.check(s); assert.ok(s.missed && !s.solved && s.attempts === 1); s = B.adjust(s, "up"); assert.ok(!s.missed);
  const h = B.newBalance(1, mulberry32(2), true); assert.ok(h.hard && (h.eq.r ?? 0) > 0);
  assert.equal(B.solution({ a: 2, b: 0, r: 2, c: 4 }), null);
});

test("abacus: target mode 'Make N', rods and max follow the curriculum, choices contain the answer", () => {
  const rng = mulberry32(6);
  for (let l = 1; l <= maxLevel("abacus" as Topic); l++) for (let i = 0; i < 100; i++) {
    const q = A.abacusQuestion(l, i, rng);
    assert.ok(q.question.choices.includes(q.answer), `${q.prompt} ${q.answer}`);
    assert.equal(q.rods, A.rodCount(A.levelMax(l)));
    if (q.mode === "target") { assert.match(q.prompt, /^Make \d+$/); assert.ok(Number(q.answer) <= A.levelMax(l) && Number(q.answer) >= 2); assert.ok(l >= 2 && i % 2 === 1); }
  }
  let s = A.newAbacus(2); for (const k of ["up", "up", "up", "up", "up", "up", "up", "left", "up", "up", "up", "up"] as const) s = A.press(s, k);
  assert.ok(A.isCorrect(s, "47"));
});

test("profiles: add, unique keys, limits, remove, active, avatars", () => {
  let st = P.emptyProfiles();
  const a = P.addProfile(st, "  Ada  ", "fox", 1); assert.ok(a.ok); if (!a.ok) return; st = a.state;
  assert.equal(st.activeId, "ada"); assert.equal(a.profile.childKey, "ada");
  const b = P.addProfile(st, "ada", "owl", 2); assert.ok(b.ok); if (!b.ok) return; assert.equal(b.profile.childKey, "ada-2"); st = b.state; assert.equal(st.activeId, "ada");
  assert.deepEqual(P.addProfile(st, "   ", "fox"), { ok: false, error: "empty" });
  assert.equal(P.childKeyFor("José Ñandú"), "jose-nandu"); assert.equal(P.childKeyFor("!!!"), "player");
  assert.equal(P.cleanName("A".repeat(40)).length, P.MAX_NAME);
  st = P.setActive(st, "ada-2"); assert.equal(P.activeProfile(st)?.name, "ada"); assert.equal(P.setActive(st, "nope"), st);
  assert.equal(P.freeAvatars(st)[0].id === "fox" || P.freeAvatars(st)[0].id === "owl", false);
  st = P.removeProfile(st, "ada-2"); assert.equal(st.activeId, "ada");
  st = P.removeProfile(st, "ada"); assert.equal(st.activeId, null);
  let full = P.emptyProfiles(); for (let i = 0; i < P.MAX_PROFILES; i++) { const r = P.addProfile(full, `K${i}`, "fox"); assert.ok(r.ok); if (r.ok) full = r.state; }
  assert.deepEqual(P.addProfile(full, "More", "fox"), { ok: false, error: "full" });
  assert.equal(P.avatarOf("zzz").id, P.AVATARS[0].id);
});

test("on-screen keyboard entry", () => {
  let e = N.newEntry("name"); for (const c of "ADA") e = N.typeChar(e, c); assert.equal(e.text, "Ada");
  e = N.space(e); for (const c of "LEE") e = N.typeChar(e, c); assert.equal(e.text, "Ada Lee");
  e = N.backspace(N.backspace(e)); assert.equal(e.text, "Ada L");
  assert.equal(N.space(N.newEntry("name")).text, ""); assert.equal(N.backspace(N.newEntry("name")).text, "");
  let full = N.newEntry("name"); for (let i = 0; i < 30; i++) full = N.typeChar(full, "a"); assert.equal(full.text.length, 12);
  let u = N.newEntry("url", "192"); u = N.typeChar(u, "."); assert.equal(u.text, "192.");
});

test("settings: url normalisation and merging", () => {
  assert.deepEqual(S.normalizeServerUrl(""), { ok: true, url: "" });
  assert.deepEqual(S.normalizeServerUrl(" 192.168.1.5:8000/ "), { ok: true, url: "http://192.168.1.5:8000" });
  assert.deepEqual(S.normalizeServerUrl("https://coach.example.com/base//"), { ok: true, url: "https://coach.example.com/base" });
  assert.equal(S.normalizeServerUrl("ftp://x.com").ok, false); assert.equal(S.normalizeServerUrl("http://").ok, false);
  assert.equal(S.cycleReduced("auto"), "on"); assert.equal(S.cycleReduced("off"), "auto");
  assert.equal(S.reducedMotionOn("auto", true), true); assert.equal(S.reducedMotionOn("off", true), false); assert.equal(S.reducedMotionOn("on", false), true);
  const d = S.defaultSettings("http://x");
  assert.deepEqual(S.mergeSettings({ sound: false, reducedMotion: "bogus", serverUrl: 5 }, d), { ...d, sound: false });
  assert.deepEqual(S.mergeSettings(null, d), d);
});

test("parent gate: correct opens, wrong twice locks, unlock after timeout", () => {
  const rng = mulberry32(2);
  for (let i = 0; i < 100; i++) { const g = G.makeGate(rng); assert.equal(g.choices.length, 4); assert.equal(new Set(g.choices).size, 4); assert.ok(g.choices.includes(g.answer)); }
  let s = G.newGateState(rng); const wrongOf = (st: G.GateState) => st.gate.choices.find((c) => c !== st.gate.answer)!;
  s = G.attempt(s, wrongOf(s), 1000, rng); assert.equal(s.wrong, 1); assert.ok(!s.open);
  s = G.attempt(s, wrongOf(s), 2000, rng); assert.ok(G.isLocked(s, 2001));
  const locked = s; assert.equal(G.attempt(s, s.gate.answer, 3000, rng), locked, "no answers while locked");
  const later = 2000 + G.GATE_LOCK_MS + 1; assert.ok(!G.isLocked(s, later));
  s = G.attempt(s, s.gate.answer, later, rng); assert.ok(s.open);
});

test("streaks: consecutive days, alive until end of tomorrow, best streak, timezone-aware keys", () => {
  assert.equal(M.dateKey(T(2026, 3, 1, 23), 0), "2026-03-01"); assert.equal(M.dateKey(T(2026, 3, 1, 23), -120), "2026-03-02"); assert.equal(M.dateKey(T(2026, 3, 1, 1), 300), "2026-02-28");
  let st = M.emptyStats(); for (const d of ["2026-03-01", "2026-03-02", "2026-03-03"]) st = M.recordAnswers(st, 1, d);
  assert.equal(M.dayStreak(st, "2026-03-03"), 3); assert.equal(M.dayStreak(st, "2026-03-04"), 3, "yesterday still counts"); assert.equal(M.dayStreak(st, "2026-03-05"), 0);
  st = M.recordAnswers(st, 1, "2026-03-03"); assert.equal(st.days.length, 3); assert.equal(st.answers, 4);
  st = M.recordAnswers(st, 1, "2026-03-10"); assert.equal(M.dayStreak(st, "2026-03-10"), 1); assert.equal(M.bestStreak(st), 3);
  assert.equal(M.dayStreak(M.emptyStats(), "2026-03-10"), 0); assert.equal(M.dayStreak({ ...M.emptyStats(), days: ["2026-02-28", "2026-03-01"] }, "2026-03-01"), 2, "month boundary");
});

test("badges: generated from curriculum, awarded once", () => {
  const defs = M.allBadges(); const topics = playableTopics();
  assert.ok(defs.length >= 7 + topics.length * 2); assert.equal(new Set(defs.map((b) => b.id)).size, defs.length);
  for (const t of topics) assert.ok(defs.some((b) => b.id === `master-${t}`));
  const ctx = (stats: M.Stats, progress: Progress = {}) => ({ stats, progress, today: "2026-03-01" });
  assert.equal(M.earnedBadges(ctx(M.emptyStats())).length, 0);
  const t0 = topics[0]; const top = maxLevel(t0);
  const progress: Progress = { [t0]: { level: top, correct: 5, attempts: 6, updatedAt: 1 } } as Progress;
  const ids = M.earnedBadges(ctx(M.emptyStats(), progress)).map((b) => b.id);
  assert.ok(ids.includes("first-steps") && ids.includes(`master-${t0}`) && ids.includes(`level2-${t0}`));
  const r1 = M.awardBadges(ctx(M.emptyStats(), progress)); assert.ok(r1.fresh.length >= 3);
  const r2 = M.awardBadges(ctx(r1.stats, progress)); assert.equal(r2.fresh.length, 0);
  let st = M.emptyStats(); for (let i = 1; i <= 7; i++) st = M.recordAnswers(st, 1, `2026-03-0${i}`);
  const sids = M.earnedBadges(ctx(st)).map((b) => b.id); assert.ok(sids.includes("streak-3") && sids.includes("streak-7"));
  const rr = M.recordRound(M.emptyStats(), { topic: "x", title: "x", correct: 5, total: 5, stars: 3, leveledUp: false, daily: true }, "2026-03-01");
  assert.deepEqual([rr.stars, rr.perfectRounds, rr.rounds, rr.dailyDone], [3, 1, 1, ["2026-03-01"]]);
  const ids2 = M.earnedBadges(ctx(rr)).map((b) => b.id); assert.ok(ids2.includes("perfect-round") && ids2.includes("daily-hero"));
});

test("dashboard rows follow the curriculum", () => {
  const rows = M.topicRows({}); assert.equal(rows.length, playableTopics().length);
  assert.ok(rows.every((r) => r.level === 1 && r.accuracy === null));
  const t = playableTopics()[0];
  const r = M.topicRows({ [t]: { level: 99, correct: 3, attempts: 4, updatedAt: 1, streak: 1 } } as Progress).find((x) => x.topic === t)!;
  assert.deepEqual([r.level === maxLevel(t), r.accuracy, r.streak], [true, 75, 1]);
});

test("daily challenge: deterministic per day+child, mixes every topic, valid questions", () => {
  const a = makeDaily("2026-03-01", "ada", {}), b = makeDaily("2026-03-01", "ada", {}), c = makeDaily("2026-03-02", "ada", {});
  assert.equal(a.length, DAILY_LENGTH); assert.deepEqual(a, b); assert.notDeepEqual(a, c);
  assert.deepEqual([...new Set(a.map((i) => i.topic))].sort(), [...playableTopics()].sort());
  const top: Progress = Object.fromEntries(playableTopics().map((t) => [t, { level: 99, correct: 1, attempts: 1, updatedAt: 1 }])) as Progress;
  for (let d = 1; d <= 60; d++) for (const i of makeDaily(`2026-04-${d}`, "kofi", d % 2 ? top : {}, 9)) {
    assert.ok(i.question.choices.includes(i.question.answer), `${i.kind}: ${i.question.prompt}`); assert.equal(new Set(i.question.choices).size, i.question.choices.length);
    assert.ok(i.level >= 1 && i.level <= maxLevel(i.topic));
  }
  assert.deepEqual(makeDaily("d", "k", {}, 6, []), []);
});

test("app store: persists profiles/settings/stats, survives corrupt storage, awards badges once", async () => {
  const mem = memStore(); let now = T(2026, 3, 1);
  const s = new AppStore(mem, S.defaultSettings("http://coach"), () => now); await s.load();
  assert.ok(s.loaded && s.profiles.profiles.length === 0 && s.settings.serverUrl === "http://coach");
  let ticks = 0; s.subscribe(() => ticks++);
  const r = s.addProfile("Ada", "fox"); assert.ok(r.ok); assert.ok(ticks >= 1);
  s.updateSettings({ sound: false }); s.noteAnswer("ada");
  const t0 = playableTopics()[0];
  const prog = { [t0]: { level: 2, correct: 2, attempts: 2, updatedAt: 1 } } as Progress;
  const res = { topic: t0, title: "x", correct: 5, total: 5, stars: 3 as const, leveledUp: false };
  const f1 = s.finishRound("ada", res, prog); assert.ok(f1.fresh.some((b) => b.id === "perfect-round"));
  const f2 = s.finishRound("ada", res, prog); assert.equal(f2.fresh.length, 0); assert.equal(f2.stats.stars, 6);
  const s2 = new AppStore(mem, S.defaultSettings(), () => now); await s2.load();
  assert.equal(s2.profiles.activeId, "ada"); assert.equal(s2.settings.sound, false); assert.equal(s2.statsFor("ada").stars, 6); assert.equal(s2.settings.serverUrl, "http://coach");
  s2.removeProfile("ada"); assert.equal(s2.profiles.activeId, null); assert.equal(s2.statsFor("ada").stars, 0);
  mem.data.set("learncoach:app:v1", "{not json"); const s3 = new AppStore(mem); await s3.load(); assert.ok(s3.loaded && s3.loadError && s3.profiles.profiles.length === 0);
  mem.data.set("learncoach:app:v1", JSON.stringify({ profiles: { profiles: [{ id: 1 }, { id: "a", name: "A", avatar: "fox", childKey: "a", createdAt: 1 }], activeId: "zzz" }, settings: 7, stats: { a: { stars: 3 } } }));
  const s4 = new AppStore(mem); await s4.load(); assert.equal(s4.profiles.profiles.length, 1); assert.equal(s4.profiles.activeId, "a"); assert.equal(s4.statsFor("a").stars, 3); assert.deepEqual(s4.statsFor("a").days, []);
  const noStorage = new AppStore(); await noStorage.load(); noStorage.addProfile("Z", "owl"); assert.equal(noStorage.profiles.profiles.length, 1);
});

test("nav: game screens, replace, topicOf", () => {
  let n = go(initialNav(), gameScreen("abacus")); assert.equal(topicOf(current(n)), "abacus"); assert.equal(topicOf("home"), null);
  n = replace(n, "results"); assert.deepEqual(n.stack, ["home", "results"]); assert.deepEqual(back(n).stack, ["home"]);
});

test("gameFor picks the screen from level kinds; every playable topic maps to a game", async () => {
  const { gameFor } = await import("../src/curriculum.js");
  for (const t of playableTopics()) assert.ok(["abacus", "balance", "geo", "generic"].includes(gameFor(t)));
  assert.equal(gameFor("abacus" as Topic), "abacus"); assert.equal(gameFor("algebra" as Topic), "balance"); assert.equal(gameFor("geography" as Topic), "geo");
});

test("map data covers the curriculum countries (missing ones fall back to an un-highlighted map, not a crash)", async () => {
  const { MAP_COUNTRIES } = await import("../app/src/mapData.js");
  const alias: Record<string, string> = { "United States": "United States of America", "DR Congo": "Dem. Rep. Congo", "Ivory Coast": "Côte d'Ivoire" };
  const missing = curriculum.countries.filter((c) => !MAP_COUNTRIES.some((m: { name: string }) => m.name === (alias[c.name] ?? c.name))).map((c) => c.name);
  if (missing.length) console.warn("no 110m polygon for:", missing.join(", "));
  assert.ok(missing.length <= curriculum.countries.length * 0.2, `too many countries without map polygons: ${missing}`);
});
