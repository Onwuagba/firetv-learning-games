// Parent gate: a multiplication a child under ~8 cannot do quickly, answered with the D-pad. Wrong answers lock it briefly.
import { shuffled, type Rng } from "./rng.js";
export interface Gate { prompt: string; answer: string; choices: string[] }
export const GATE_LOCK_MS = 15000;
export const GATE_MAX_WRONG = 2;
export function makeGate(rng: Rng = Math.random): Gate {
  const a = 6 + Math.floor(rng() * 4), b = 6 + Math.floor(rng() * 4); // 6..9
  const ans = a * b;
  const wrong = new Set<number>();
  while (wrong.size < 3) { const w = ans + (Math.floor(rng() * 9) - 4) * (1 + Math.floor(rng() * 2)); if (w !== ans && w > 0) wrong.add(w); }
  return { prompt: `${a} × ${b}`, answer: String(ans), choices: shuffled([ans, ...wrong].map(String), rng) };
}
export interface GateState { gate: Gate; wrong: number; lockedUntil: number; open: boolean }
export const newGateState = (rng: Rng = Math.random): GateState => ({ gate: makeGate(rng), wrong: 0, lockedUntil: 0, open: false });
export const isLocked = (s: GateState, now: number) => now < s.lockedUntil;
export function attempt(s: GateState, choice: string, now: number, rng: Rng = Math.random): GateState {
  if (s.open || isLocked(s, now)) return s;
  if (choice === s.gate.answer) return { ...s, open: true };
  const wrong = s.wrong + 1;
  return wrong >= GATE_MAX_WRONG
    ? { gate: makeGate(rng), wrong: 0, lockedUntil: now + GATE_LOCK_MS, open: false }
    : { ...s, gate: makeGate(rng), wrong };
}
