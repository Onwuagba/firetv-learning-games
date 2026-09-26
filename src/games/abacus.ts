// D-pad abacus: LEFT/RIGHT picks a rod (ones, tens), UP/DOWN slides a bead, SELECT submits.
export type Key = "left" | "right" | "up" | "down" | "select";
export interface Abacus { rods: number[]; cursor: number }   // rods[0] = ones, each 0..9

export const newAbacus = (rods = 2): Abacus => ({ rods: Array(rods).fill(0), cursor: 0 });

export function press(s: Abacus, k: Key): Abacus {
  const rods = [...s.rods];
  switch (k) {
    case "left": return { rods, cursor: Math.min(s.cursor + 1, rods.length - 1) };
    case "right": return { rods, cursor: Math.max(s.cursor - 1, 0) };
    case "up": rods[s.cursor] = Math.min(rods[s.cursor] + 1, 9); return { rods, cursor: s.cursor };
    case "down": rods[s.cursor] = Math.max(rods[s.cursor] - 1, 0); return { rods, cursor: s.cursor };
    default: return s;
  }
}

export const value = (s: Abacus) => s.rods.reduce((sum, r, i) => sum + r * 10 ** i, 0);

/** Target for a question: the numeric answer (count/add/subtract levels). */
export const isCorrect = (s: Abacus, answer: string) => value(s) === Number(answer);
export const rodCount = (max: number) => (max >= 100 ? 3 : 2);
export const reset = (s: Abacus): Abacus => newAbacus(s.rods.length);

// ---- Target-number mode: "Make 47" (no arithmetic, pure place value) ----
import { levelSpec, makeQuestion, numericChoices, type Question } from "../curriculum.js";
import type { Rng } from "../rng.js";
export interface AbacusQuestion { prompt: string; answer: string; rods: number; mode: "sum" | "target"; question: Question }
/** Largest value the level can ask for (from curriculum.json `max`, sums included). */
export const levelMax = (level: number) => levelSpec("abacus" as never, level).max ?? 10;
/**
 * Question for a level. Odd rounds from level 2 up use target mode ("Make 47"): the curriculum's own sum/subtract prompts still
 * appear on the other rounds, so every level's `kind` and `max` from curriculum.json are respected.
 */
export function abacusQuestion(level: number, index: number, rng: Rng = Math.random): AbacusQuestion {
  const max = levelMax(level);
  const q = makeQuestion("abacus" as never, level, rng);
  if (level >= 2 && index % 2 === 1) {
    const n = 2 + Math.floor(rng() * (max - 1)); // 2..max
    return { prompt: `Make ${n}`, answer: String(n), rods: rodCount(max), mode: "target", question: { ...q, prompt: `Make ${n}`, answer: String(n), choices: numericChoices(n, rng) } };
  }
  return { prompt: q.prompt, answer: q.answer, rods: rodCount(max), mode: "sum", question: q };
}
