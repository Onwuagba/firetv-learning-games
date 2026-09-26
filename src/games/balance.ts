// Balance scales: equation a*x + b = r*x + c. Left pan holds a x-blocks + b units; right pan holds r x-blocks + c units (r is 0 for the
// curriculum levels, >0 for the harder "x on both sides" puzzles). The player sets a guess for x, the beam tilts by (left - right),
// and the puzzle is only solved when the player presses Check on a balanced scale: it never auto-solves.
import { curriculum, levelSpec, makeQuestion, type Question } from "../curriculum.js";
import type { Rng } from "../rng.js";

export interface Equation { a: number; b: number; c: number; r?: number }

export function parseEquation(prompt: string): Equation {
  const two = /^(?:(\d+))?x(?: \+ (\d+))? = (?:(\d+))?x(?: \+ (\d+))?$/.exec(prompt);
  if (two) return { a: two[1] ? Number(two[1]) : 1, b: two[2] ? Number(two[2]) : 0, r: two[3] ? Number(two[3]) : 1, c: two[4] ? Number(two[4]) : 0 };
  const m = /^(?:(\d+))?x(?: \+ (\d+))? = (\d+)$/.exec(prompt) ?? /^x \+ (\d+) = (\d+)$/.exec(prompt);
  if (!m) throw new Error(`not an equation: ${prompt}`);
  if (m.length === 3) return { a: 1, b: Number(m[1]), c: Number(m[2]) };
  return { a: m[1] ? Number(m[1]) : 1, b: m[2] ? Number(m[2]) : 0, c: Number(m[3]) };
}

export const leftWeight = (e: Equation, x: number) => e.a * x + e.b;
export const rightWeight = (e: Equation, x: number) => (e.r ?? 0) * x + e.c;
/** Signed imbalance: >0 left heavy, <0 right heavy, 0 balanced. */
export const imbalance = (e: Equation, x: number) => leftWeight(e, x) - rightWeight(e, x);
/** Beam angle in degrees, clamped to +-maxDeg; sign>0 means left pan down. */
export function tiltDegrees(e: Equation, x: number, maxDeg = 14): number {
  const d = imbalance(e, x); if (d === 0) return 0;
  return Math.sign(d) * Math.min(maxDeg, 3 + Math.abs(d) * 1.2);
}
export const solution = (e: Equation): number | null => {
  const k = e.a - (e.r ?? 0); if (k === 0) return null;
  const x = (e.c - e.b) / k; return Number.isInteger(x) && x >= 0 ? x : null;
};

/** Harder type beyond the curriculum: x on both sides, e.g. "5x + 3 = 2x + 18" (x = 5). Always an integer solution. */
export function makeTwoSided(rng: Rng, maxX = 12): Question {
  const x = 1 + Math.floor(rng() * maxX), r = 1 + Math.floor(rng() * 4), a = r + 1 + Math.floor(rng() * 4), b = 1 + Math.floor(rng() * 12);
  const c = (a - r) * x + b;
  const term = (k: number) => (k === 1 ? "x" : `${k}x`);
  return { topic: "algebra" as Question["topic"], level: 0, prompt: `${term(a)} + ${b} = ${term(r)} + ${c}`, answer: String(x), choices: [] };
}

export interface BalanceState {
  question: Question; eq: Equation; guess: number; max: number; solved: boolean; moves: number;
  attempts: number; missed: boolean; hard: boolean;
}
export const topLevelOf = (topic = "algebra") => curriculum.topics[topic]?.levels.length ?? 1;

/** `hard` swaps in a two-sided puzzle; the screen uses it once the child is on the top level. */
export function newBalance(level: number, rng: Rng = Math.random, hard = false): BalanceState {
  const question = hard ? makeTwoSided(rng) : makeQuestion("algebra" as never, level, rng);
  const eq = parseEquation(question.prompt);
  const ans = Number(question.answer);
  return { question, eq, guess: 0, max: Math.max(20, ans + 10), solved: false, moves: 0, attempts: 0, missed: false, hard };
}
export type BalanceKey = "up" | "down" | "left" | "right";
/** Step size: 1, but left/right jump by 5 on big ranges (level with x up to 50) so the dial is not a chore. */
export const stepFor = (s: BalanceState, k: BalanceKey) => ((k === "left" || k === "right") && s.max > 20 ? 5 : 1);
export function adjust(s: BalanceState, k: BalanceKey): BalanceState {
  if (s.solved) return s;
  const delta = (k === "up" || k === "right" ? 1 : -1) * stepFor(s, k);
  const guess = Math.min(s.max, Math.max(0, s.guess + delta));
  return { ...s, guess, moves: s.moves + 1, missed: false };
}
/** Press Check. Balanced -> solved; otherwise a miss (counts as a wrong attempt). */
export function check(s: BalanceState): BalanceState {
  if (s.solved) return s;
  const ok = imbalance(s.eq, s.guess) === 0;
  return { ...s, attempts: s.attempts + 1, solved: ok, missed: !ok };
}
export const levelIsTop = (level: number) => level >= topLevelOf();
export { levelSpec };
