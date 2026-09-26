// Geography question variety on top of the curriculum: capitals, continents, "which country is highlighted", flags.
import { curriculum, levelSpec, makeQuestion, type Question, type Topic } from "../curriculum.js";
import { flagEmoji, hasFlag } from "../flags.js";
import { shuffled, type Rng } from "../rng.js";

export type GeoMode = "continent" | "capital" | "which-country" | "flag";
export interface GeoQuestion extends Question { mode: GeoMode; country: string; flag: string; region: string }

const pick = <T>(xs: T[], rng: Rng) => xs[Math.floor(rng() * xs.length)];

/** Four unique choices: the answer plus three distractors drawn from `pool` (topped up from the world list if the pool is small). */
export function choicesFor(answer: string, pool: string[], rng: Rng): string[] {
  const uniq = [...new Set(pool.filter((v) => v !== answer))];
  return shuffled([answer, ...shuffled(uniq, rng).slice(0, 3)], rng);
}

/**
 * Build a geography question for `level`. The curriculum level decides the base kind (continent/capital) and region;
 * the mode varies so the same level is not repetitive: flags and "which country is highlighted" mix in.
 */
export function makeGeoQuestion(level: number, rng: Rng = Math.random, topic: Topic = "geography" as Topic): GeoQuestion {
  const spec = levelSpec(topic, level);
  const pool = curriculum.countries.filter((c) => spec.region === "world" || spec.region === undefined || c.region === spec.region);
  const c = pick(pool.length ? pool : curriculum.countries, rng);
  const roll = rng();
  const flagOk = hasFlag(c.name) && pool.filter((p) => hasFlag(p.name)).length >= 4;
  const names = (pool.length >= 4 ? pool : curriculum.countries).map((p) => p.name);
  const base = { topic, level, country: c.name, flag: flagEmoji(c.name), region: spec.region === "africa" ? "africa" : "world" };
  if (flagOk && roll < 0.25) {
    const withFlags = names.filter(hasFlag);
    return { ...base, mode: "flag", prompt: "Whose flag is this?", answer: c.name, choices: choicesFor(c.name, withFlags, rng) };
  }
  if (roll < 0.5) {
    return { ...base, mode: "which-country", prompt: "Which country is highlighted?", answer: c.name, choices: choicesFor(c.name, names, rng) };
  }
  if (spec.kind === "continent") {
    const all = curriculum.countries.map((o) => o.continent);
    return { ...base, mode: "continent", prompt: `Which continent is ${c.name} in?`, answer: c.continent, choices: choicesFor(c.continent, all, rng) };
  }
  const all = curriculum.countries.map((o) => o.capital);
  return { ...base, mode: "capital", prompt: `Capital of ${c.name}?`, answer: c.capital, choices: choicesFor(c.capital, all, rng) };
}

/** Attach geo fields to a plain curriculum question (e.g. the coach-compatible makeQuestion output). */
export function asGeo(q: Question): GeoQuestion | null {
  const m = /^Which continent is (.+) in\?$/.exec(q.prompt) ?? /^Capital of (.+)\?$/.exec(q.prompt);
  if (!m) return null;
  return { ...q, mode: q.prompt.startsWith("Capital") ? "capital" : "continent", country: m[1], flag: flagEmoji(m[1]), region: "world" };
}
export { makeQuestion };
