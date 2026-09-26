// Integration: start the real coach locally, play the child through MCP (scripts/demo_tv.py), run the TV client against it.
// Needs alexa-learning-coach/.venv (see its README). Skipped if missing. Override path with COACH_DIR.
import test from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { HttpProgressClient } from "../src/progress/http.js";
import { ProgressSync } from "../src/progress/sync.js";

const COACH = process.env.COACH_DIR ?? resolve(import.meta.dirname, "../../alexa-learning-coach");
const PY = join(COACH, ".venv/bin/python");
const skip = existsSync(PY) ? false : "coach .venv not found";

const freePort = () => new Promise<number>((ok) => { const s = createServer().listen(0, () => { const p = (s.address() as { port: number }).port; s.close(() => ok(p)); }); });

test("TV client against a locally running coach (Alexa+ side simulated over MCP)", { skip }, async () => {
  const port = await freePort(); const url = `http://127.0.0.1:${port}`;
  const db = join(mkdtempSync(join(tmpdir(), "coach-")), "p.db");
  const proc: ChildProcess = spawn(PY, ["-m", "learning_coach.server"], { cwd: COACH, stdio: "ignore",
    env: { ...process.env, PORT: String(port), PROGRESS_DB: db, PARENT_PIN: "4321", MCP_AUTH_TOKEN: "mcp-secret", TV_API_TOKEN: "tv-secret" } });
  try {
    for (let i = 0; i < 100; i++) { try { if ((await fetch(`${url}/healthz`)).ok) break; } catch { /* starting */ } await new Promise((r) => setTimeout(r, 100)); }
    const tv = new ProgressSync(new HttpProgressClient(url, "tv-secret"), "ada");
    await tv.load(); assert.equal(tv.status, "synced"); assert.equal(tv.currentLevel("abacus"), 1);

    // Alexa+ side: two right answers over real MCP -> the coach levels up
    const r = spawnSync(PY, ["scripts/demo_tv.py", "--child", "ada", "--answers", "2", "--url", url, "--db", db, "--mcp-token", "mcp-secret"], { cwd: COACH, encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr);
    await tv.load();
    assert.equal(tv.currentLevel("abacus"), 2); assert.equal(tv.progress.abacus!.attempts, 2);

    // TV side: plays and syncs; coach applies its own rules (2 right = level 3)
    tv.record("abacus", 2, true); tv.record("abacus", 2, true);
    assert.equal(await tv.flush(), true); await tv.load();
    assert.equal(tv.currentLevel("abacus"), 3); assert.equal(tv.progress.abacus!.attempts, 4);
    assert.equal(await tv.flush(), true); // nothing queued
    // Retrying the same batch (e.g. lost response) does not double count
    const c = new HttpProgressClient(url, "tv-secret");
    await c.pushEvents("ada", [{ topic: "abacus", level: 1, correct: true, at: 1, id: "dup-1" }]);
    await c.pushEvents("ada", [{ topic: "abacus", level: 1, correct: true, at: 1, id: "dup-1" }]);
    assert.equal((await c.fetchProgress("ada")).abacus!.attempts, 5);

    // Security: wrong token, and a locked topic cannot be unlocked / written from the TV
    await assert.rejects(new HttpProgressClient(url, "wrong").fetchProgress("ada"), /401/);
    await assert.rejects(new HttpProgressClient(url, "mcp-secret").fetchProgress("ada"), /401/); // MCP token is not a TV token
    await c.pushEvents("ada", [{ topic: "algebra", level: 1, correct: true, at: 2, id: "lock-1" }]);
    assert.equal((await c.fetchProgress("ada")).algebra, undefined);

    // Offline TV: bad URL keeps events queued
    const off = new ProgressSync(new HttpProgressClient(`http://127.0.0.1:1`, "x"), "ada");
    off.record("abacus", 1, true); assert.equal(await off.flush(), false); assert.equal(off.queue.length, 1);
  } finally { proc.kill(); }
});
