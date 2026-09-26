// Multiple-choice session shared by the map quiz (and reusable for any topic).
import { makeQuestion, maxLevel, type Question, type Topic } from "../curriculum.js";
import type { Dir } from "../focus/grid.js";

export const STREAK_TO_LEVEL_UP = 2; // matches the coach (alexa-learning-coach store.PROMOTE_AFTER)
export interface QuizState {
  topic: Topic; level: number; question: Question; focus: number; // index into choices (2x2 grid)
  picked: number | null; streak: number; correct: number; attempts: number; leveledUp: boolean;
}
type Rng = () => number;

export function newQuiz(topic: Topic, level = 1, rng: Rng = Math.random): QuizState {
  return { topic, level, question: makeQuestion(topic, level, rng), focus: 0, picked: null, streak: 0, correct: 0, attempts: 0, leveledUp: false };
}

/** Move focus in the 2x2 grid; clamps at edges. Ignored after answering. */
export function moveChoice(s: QuizState, dir: Dir): QuizState {
  if (s.picked !== null) return s;
  const n = s.question.choices.length; const cols = 2;
  let r = Math.floor(s.focus / cols), c = s.focus % cols;
  if (dir === "left") c--; if (dir === "right") c++; if (dir === "up") r--; if (dir === "down") r++;
  const idx = r * cols + c;
  return c < 0 || c >= cols || r < 0 || idx < 0 || idx >= n ? s : { ...s, focus: idx };
}

export function submit(s: QuizState): QuizState {
  if (s.picked !== null) return s;
  const ok = s.question.choices[s.focus] === s.question.answer;
  const streak = ok ? s.streak + 1 : 0;
  const leveledUp = ok && streak >= STREAK_TO_LEVEL_UP && s.level < maxLevel(s.topic);
  return { ...s, picked: s.focus, streak: leveledUp ? 0 : streak, correct: s.correct + (ok ? 1 : 0), attempts: s.attempts + 1, leveledUp };
}

export const isCorrect = (s: QuizState) => s.picked !== null && s.question.choices[s.picked] === s.question.answer;

export function next(s: QuizState, rng: Rng = Math.random): QuizState {
  if (s.picked === null) return s;
  const level = s.leveledUp ? s.level + 1 : s.level;
  return { ...s, level, question: makeQuestion(s.topic, level, rng), focus: 0, picked: null, leveledUp: false };
}
