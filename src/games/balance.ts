// Balance scales: equation ax + b = c. Left pan holds a x-blocks + b units; right pan holds c units.
// Player sets a guess for x with UP/DOWN (LEFT/RIGHT = -/+ 1 too); the beam tilts by (left - right).
import { makeQuestion, type Question } from "../curriculum.js";

export interface Equation { a: number; b: number; c: number }

export function parseEquation(prompt: string): Equation {
  const m = /^(?:(\d+))?x(?: \+ (\d+))? = (\d+)$/.exec(prompt) ?? /^x \+ (\d+) = (\d+)$/.exec(prompt);
  if (!m) throw new Error(`not an equation: ${prompt}`);
  if (m.length === 3) return { a: 1, b: Number(m[1]), c: Number(m[2]) };
  return { a: m[1] ? Number(m[1]) : 1, b: m[2] ? Number(m[2]) : 0, c: Number(m[3]) };
}

export const leftWeight = (e: Equation, x: number) => e.a * x + e.b;
/** Signed imbalance: >0 left heavy, <0 right heavy, 0 balanced. */
export const imbalance = (e: Equation, x: number) => leftWeight(e, x) - e.c;
/** Beam angle in degrees, clamped to +-maxDeg; sign>0 means left pan down. */
export function tiltDegrees(e: Equation, x: number, maxDeg = 14): number {
  const d = imbalance(e, x); if (d === 0) return 0;
  return Math.sign(d) * Math.min(maxDeg, 3 + Math.abs(d) * 1.2);
}

export interface BalanceState { question: Question; eq: Equation; guess: number; max: number; solved: boolean; moves: number }
export function newBalance(level: number, rng: () => number = Math.random): BalanceState {
  const question = makeQuestion("algebra", level, rng);
  return { question, eq: parseEquation(question.prompt), guess: 0, max: 20, solved: false, moves: 0 };
}
export type BalanceKey = "up" | "down" | "left" | "right";
export function adjust(s: BalanceState, k: BalanceKey): BalanceState {
  if (s.solved) return s;
  const delta = k === "up" || k === "right" ? 1 : -1;
  const guess = Math.min(s.max, Math.max(0, s.guess + delta));
  return { ...s, guess, moves: s.moves + 1, solved: imbalance(s.eq, guess) === 0 && guess > 0 };
}
