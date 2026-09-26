// Same content and question rules as alexa-learning-coach/learning_coach/curriculum.py.
import data from "./curriculum.json" with { type: "json" };

export type Topic = keyof typeof data.topics;
export interface Question { topic: Topic; level: number; prompt: string; answer: string; choices: string[] }

const rand = (rng: () => number, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1));

export function makeQuestion(topic: Topic, level: number, rng: () => number = Math.random): Question {
  const spec = data.topics[topic].levels[level - 1] as { kind: string; max?: number; region?: string };
  const max = spec.max ?? 10;
  let prompt: string, answer: string;
  switch (spec.kind) {
    case "count": { const n = rand(rng, 1, max); prompt = `Slide ${n} beads`; answer = String(n); break; }
    case "add": { const a = rand(rng, 1, Math.floor(max / 2)); const b = rand(rng, 1, max - a); prompt = `${a} + ${b}`; answer = String(a + b); break; }
    case "subtract": { const a = rand(rng, 2, max); const b = rand(rng, 1, a - 1); prompt = `${a} − ${b}`; answer = String(a - b); break; }
    case "x_plus_a": { const x = rand(rng, 1, max); const a = rand(rng, 1, max); prompt = `x + ${a} = ${x + a}`; answer = String(x); break; }
    case "a_times_x": { const x = rand(rng, 1, max); const a = rand(rng, 2, 9); prompt = `${a}x = ${a * x}`; answer = String(x); break; }
    case "a_times_x_plus_b": { const x = rand(rng, 1, max); const a = rand(rng, 2, 9); const b = rand(rng, 1, 20); prompt = `${a}x + ${b} = ${a * x + b}`; answer = String(x); break; }
    case "continent":
    case "capital": {
      const pool = data.countries.filter((c) => spec.region === "world" || c.region === spec.region);
      const c = pool[rand(rng, 0, pool.length - 1)];
      const field = spec.kind === "continent" ? "continent" : "capital";
      prompt = spec.kind === "continent" ? `Which continent is ${c.name} in?` : `Capital of ${c.name}?`;
      answer = c[field];
      const others = [...new Set(data.countries.map((o) => o[field]).filter((v) => v !== answer))];
      return { topic, level, prompt, answer, choices: shuffle([answer, ...shuffle(others, rng).slice(0, 3)], rng) };
    }
    default: throw new Error(`unknown kind ${spec.kind}`);
  }
  return { topic, level, prompt, answer, choices: numericChoices(Number(answer), rng) };
}

/** 4 numeric choices near the answer: remote-friendly (D-pad + select, no typing). */
export function numericChoices(n: number, rng: () => number = Math.random): string[] {
  const near = new Set([n]);
  for (let d = 1; near.size < 4; d++) { if (n - d >= 0) near.add(n - d); if (near.size < 4) near.add(n + d); }
  return shuffle([...near].map(String), rng);
}

export const maxLevel = (t: Topic) => data.topics[t].levels.length;

// ---- Curriculum-driven metadata: the UI is built from these, never from hard-coded topic lists. ----
export interface LevelSpec { level: number; kind: string; max?: number; region?: string }
export const curriculum = data as unknown as {
  topics: Record<string, { title: string; min_age?: number; levels: LevelSpec[] }>;
  countries: { name: string; capital: string; continent: string; region: string }[];
};
/** Question kinds makeQuestion can build. A topic using any other kind is hidden (not crashed on). */
export const KNOWN_KINDS = new Set(["count", "add", "subtract", "x_plus_a", "a_times_x", "a_times_x_plus_b", "continent", "capital"]);
export const allTopics = (): Topic[] => Object.keys(curriculum.topics) as Topic[];
/** Topics this build can play (every level's kind is known and there is at least one level). */
export const playableTopics = (): Topic[] =>
  allTopics().filter((t) => curriculum.topics[t].levels.length > 0 && curriculum.topics[t].levels.every((l) => KNOWN_KINDS.has(l.kind)));
export const topicTitle = (t: Topic) => curriculum.topics[t].title;
export const levelSpec = (t: Topic, level: number): LevelSpec =>
  curriculum.topics[t].levels[Math.min(Math.max(level, 1), curriculum.topics[t].levels.length) - 1];
export const clampLevel = (t: Topic, level: number) => Math.min(Math.max(1, Math.floor(level) || 1), maxLevel(t));

function shuffle<T>(xs: T[], rng: () => number): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Which screen plays a topic, decided from its level kinds (not its name): new topics of a known shape work with no UI change. */
export type GameKind = "abacus" | "balance" | "geo" | "generic";
const KIND_GROUPS: [GameKind, string[]][] = [
  ["abacus", ["count", "add", "subtract"]],
  ["balance", ["x_plus_a", "a_times_x", "a_times_x_plus_b"]],
  ["geo", ["continent", "capital"]],
];
export function gameFor(t: Topic): GameKind {
  const kinds = curriculum.topics[t].levels.map((l) => l.kind);
  for (const [g, ks] of KIND_GROUPS) if (kinds.length && kinds.every((k) => ks.includes(k))) return g;
  return "generic";
}
