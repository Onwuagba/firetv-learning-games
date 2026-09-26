// A round is a short session (default 5 questions) that ends on a results screen with stars.
export const ROUND_LENGTH = 5;
export interface Round { topic: string; total: number; answered: number; correct: number; leveledUp: boolean; startLevel: number }
export const newRound = (topic: string, startLevel = 1, total = ROUND_LENGTH): Round => ({ topic, total, answered: 0, correct: 0, leveledUp: false, startLevel });
export function answer(r: Round, ok: boolean, leveledUp = false): Round {
  if (isComplete(r)) return r;
  return { ...r, answered: r.answered + 1, correct: r.correct + (ok ? 1 : 0), leveledUp: r.leveledUp || leveledUp };
}
export const isComplete = (r: Round) => r.answered >= r.total;
/** 0..3 stars: all right = 3, at least 60% = 2, at least one right = 1. */
export function starsFor(correct: number, total: number): 0 | 1 | 2 | 3 {
  if (total <= 0 || correct <= 0) return 0;
  const p = correct / total;
  return p >= 1 ? 3 : p >= 0.6 ? 2 : 1;
}
export const starsOf = (r: Round) => starsFor(r.correct, r.total);
export interface RoundResult { topic: string; title: string; correct: number; total: number; stars: 0 | 1 | 2 | 3; leveledUp: boolean; daily?: boolean }
export const resultOf = (r: Round, title: string, daily = false): RoundResult =>
  ({ topic: r.topic, title, correct: r.correct, total: r.total, stars: starsOf(r), leveledUp: r.leveledUp, ...(daily ? { daily: true } : {}) });
