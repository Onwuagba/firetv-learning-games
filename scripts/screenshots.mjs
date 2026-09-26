// Drives the web build of the TV app with ARROW KEYS ONLY in headless Chrome and saves a screenshot of every screen.
// Usage: npm run screenshots            (exports the Expo web build, serves it, runs the flow)
//        node scripts/screenshots.mjs --no-build     (reuse app/dist)
// Needs Chrome: set CHROME=/path/to/chrome, or it looks in ~/.cache/puppeteer and /Applications. Output: docs/screenshots/*.png
import { createServer } from "node:http";
import { existsSync, readFileSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { execSync } from "node:child_process";
import { extname, join, resolve } from "node:path";
import { homedir } from "node:os";
import puppeteer from "puppeteer-core";

const root = resolve(new URL("..", import.meta.url).pathname);
const dist = join(root, "app/dist");
const out = join(root, "docs/screenshots");
mkdirSync(out, { recursive: true });
if (!process.argv.includes("--no-build")) execSync("npx expo export --platform web", { cwd: join(root, "app"), stdio: "inherit" });

function findChrome() {
  if (process.env.CHROME) return process.env.CHROME;
  const cache = join(homedir(), ".cache/puppeteer/chrome");
  if (existsSync(cache)) for (const v of readdirSync(cache)) for (const sub of readdirSync(join(cache, v))) {
    const p = join(cache, v, sub, "Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing");
    if (existsSync(p)) return p; const q = join(cache, v, sub, "chrome"); if (existsSync(q)) return q;
  }
  for (const p of ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"]) if (existsSync(p)) return p;
  throw new Error("Chrome not found: set CHROME=/path/to/chrome");
}
const MIME = { ".html": "text/html", ".js": "text/javascript", ".wav": "audio/wav", ".png": "image/png", ".json": "application/json", ".ttf": "font/ttf" };
const server = createServer((req, res) => {
  let p = join(dist, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!existsSync(p) || statSync(p).isDirectory()) p = join(dist, "index.html");
  res.writeHead(200, { "content-type": MIME[extname(p)] ?? "application/octet-stream" }); res.end(readFileSync(p));
});
await new Promise((r) => server.listen(5199, r));

for (const f of readdirSync(out)) if (/^\d\d-.*\.png$/.test(f)) rmSync(join(out, f)); // keep coach-sync-* legacy captures
const browser = await puppeteer.launch({ executablePath: findChrome(), headless: true, args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080 });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
await page.goto("http://localhost:5199/?debug=1&seed=11", { waitUntil: "networkidle0" });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const key = async (k, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await sleep(110); } };
const NAV = 650; // wait for the next screen to mount and register its focus nodes
const R = (n = 1) => key("ArrowRight", n), L = (n = 1) => key("ArrowLeft", n), U = (n = 1) => key("ArrowUp", n), D = (n = 1) => key("ArrowDown", n), OK = () => key("Enter"), BACK = () => key("Escape");
const OKgo = async () => { await OK(); await sleep(NAV); }, BACKgo = async () => { await BACK(); await sleep(NAV); };
let shotN = 0;
const shot = async (name, wait = 900) => { await sleep(wait); const f = `${String(++shotN).padStart(2, "0")}-${name}.png`; await page.screenshot({ path: join(out, f) }); console.log("shot", f); };
const lp = () => page.evaluate(() => globalThis.__lp);
const text = () => page.evaluate(() => document.body.innerText);

const focused = () => page.evaluate(() => document.querySelector('[data-testid="focused"]')?.getAttribute("aria-label") ?? "");
/** Arrow-key to the element whose label matches `re` (tries each direction until focus stops changing). Fails loudly if unreachable. */
async function focusOn(re) {
  if (re.test(await focused())) return;
  for (const dir of ["ArrowDown", "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "ArrowRight"]) {
    for (let i = 0; i < 6; i++) {
      const before = await focused(); await key(dir);
      const now = await focused(); if (re.test(now)) return; if (now === before) break;
    }
  }
  throw new Error(`could not focus ${re}; focused: ${await focused()}`);
}
/** Answer the current multiple-choice question (2x2 grid, focus starts top-left). */
async function answerChoice(correct = true) {
  const q = await lp(); const right = q.choices.indexOf(q.answer);
  const idx = correct ? right : [0, 1, 2, 3].find((i) => i !== right);
  if (idx % 2) await R(); if (idx >= 2) await D(); await OK();
}
async function solveAbacus(correct = true) {
  const q = await lp(); let n = Number(q.answer); if (!correct) n = n === 0 ? 1 : n - 1;
  const digits = String(n).split("").reverse().map(Number);
  for (let r = 0; r < digits.length; r++) { if (r > 0) await L(); await U(digits[r]); }
  await OK();
}
async function solveBalance(correct = true) {
  const q = await lp(); const n = Number(q.answer);
  await U(correct ? n : Math.max(1, n - 3));
  await OK();
}

// 1. First run: welcome -> new player with the on-screen keyboard
await shot("welcome-no-players");
await OKgo();
await shot("new-player-keyboard");
{ // type "Ada" (grid A B C ...; focus starts on A). Path: A, D (3 right), A (3 left)
  await OK(); await R(3); await OK(); await L(3); await OK();
  await shot("new-player-typed", 400);
  await D(3); await R(2); await OKgo(); // bottom row: [space][delete][Done] -> Done
}
await shot("home");
await R(); await shot("home-focus-next-tile", 500);
await L();

// 2. Abacus round: right, wrong, then right-right (level up), then target mode
await OKgo(); await shot("abacus-start");
await U(3); await shot("abacus-beads", 400);
await L(); await U(1); await shot("abacus-two-rods", 300);
await R(); await D(3); await L(); await D(1); await R(); // clear both rods, focus back on ones
await solveAbacus(true); await shot("abacus-correct");
await OKgo(); await solveAbacus(true); await shot("abacus-level-up", 500);
await OKgo(); await solveAbacus(false); await shot("abacus-wrong");
await OKgo(); await shot("abacus-target-mode", 500);
await solveAbacus(true); await OKgo(); await solveAbacus(true); await OKgo();
await shot("results-stars", 1800);
await BACKgo(); // results -> home

// 3. Balance scales: needs Check, tilt, miss, solve
await R(); await OKgo(); await shot("balance-start");
await U(2); await shot("balance-tilt-left-heavy", 700);
await OK(); await shot("balance-not-balanced-yet", 500);
{ const q = await lp(); const n = Number(q.answer); await U(Math.max(0, n - 2)); }
await shot("balance-level-before-check", 700);
await OK(); await shot("balance-solved", 700);
await BACKgo();

// 4. Map quiz: region focus, zoom, flags
await R(); await OKgo();
for (let i = 0; i < 12; i++) { const q = await lp(); if (q.prompt.startsWith("Which country is highlighted") || q.prompt.startsWith("Capital")) break; await answerChoice(true); await OKgo(); }
await shot("map-quiz-region");
await D(2); await OK(); await shot("map-quiz-zoom-close", 500);
await OK(); await shot("map-quiz-zoom-world", 500);
await OK(); await U(2);
await answerChoice(false); await shot("map-quiz-wrong-zoomed", 700);
await OKgo();
for (let i = 0; i < 14; i++) { const q = await lp(); if (q.prompt.startsWith("Whose flag")) break; await answerChoice(true); await OKgo(); }
await shot("flag-question");
await answerChoice(true); await shot("flag-correct", 500);
await BACKgo();

// 5. Daily challenge
await focusOn(/^Daily challenge/); await shot("home-daily-focused", 500);
await OKgo(); await shot("daily-question");
for (let i = 0; i < 6; i++) { await answerChoice(i !== 2); if (i === 0) await shot("daily-feedback", 500); await OKgo(); }
await shot("results-daily", 2000);
await focusOn(/^My progress/); await OKgo(); // results: Play again | Home | My progress
await shot("progress-dashboard", 900);
await BACKgo();

// 6. Level map, parent gate, settings, players
await focusOn(/^Level map/); await OKgo(); await shot("level-map", 900);
await BACKgo();
await focusOn(/^Settings/); await OKgo();
await shot("parent-gate");
{ const t = await text(); const m = /(\d) × (\d)/.exec(t); const ans = m ? String(Number(m[1]) * Number(m[2])) : "";
  const nums = (await page.$$eval("[aria-label]", (els) => els.map((e) => e.getAttribute("aria-label")))).filter((l) => /^\d+$/.test(l)); const at = nums.indexOf(ans); if (at > 0) await R(at); await OKgo(); }
await shot("settings");
await focusOn(/^Coach server/); await OKgo(); await shot("server-url-keyboard", 700);
await BACKgo(); await focusOn(/^Reduced motion/); await OK(); await shot("settings-reduced-motion-on", 500); await BACKgo();
await focusOn(/Change player/); await OKgo(); await shot("who-is-playing", 700); // profile chip -> picker

console.log(errors.length ? `console errors (${errors.length}):\n${[...new Set(errors)].slice(0, 8).join("\n")}` : "no console errors");
await browser.close(); server.close();
