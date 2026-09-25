import { registerRootComponent } from "expo";
import App from "./App";
// Hermes has no structuredClone in every RN release; src/progress uses it. Minimal JSON-safe polyfill.
if (typeof globalThis.structuredClone !== "function") {
  globalThis.structuredClone = (v) => JSON.parse(JSON.stringify(v));
}
registerRootComponent(App);
