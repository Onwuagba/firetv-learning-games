import { registerRootComponent } from "expo";
import App from "./App";
// Hermes has no structuredClone in every RN release; src/progress uses it. Minimal JSON-safe polyfill.
if (typeof globalThis.structuredClone !== "function") {
  globalThis.structuredClone = (v) => JSON.parse(JSON.stringify(v));
}
// Web only: ?seed=N makes Math.random deterministic (used by scripts/screenshots.mjs so every run shows the same questions).
if (typeof location !== "undefined" && /[?&]seed=(\d+)/.test(location.search)) {
  let a = Number(/[?&]seed=(\d+)/.exec(location.search)[1]) >>> 0;
  Math.random = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
registerRootComponent(App);
