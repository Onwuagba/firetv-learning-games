// Daily challenge: the same mixed set for a child on a given day (seeded by date + child), one topic after another.
import { clampLevel, makeQuestion, playableTopics, topicTitle, type Question, type Topic } from "./curriculum.js";
import { makeGeoQuestion, type GeoQuestion } from "./games/geo.js";
import { abacusQuestion } from "./games/abacus.js";
import { makeTwoSided } from "./games/balance.js";
import { seededFrom } from "./rng.js";
import type { Progress } from "./progress/types.js";

export const DAILY_LENGTH = 6;
export interface DailyItem { topic: Topic; level: number; question: Question | GeoQuestion; kind: string }

export function makeDaily(date: string, childKey: string, progress: Progress, length = DAILY_LENGTH, topics: Topic[] = playableTopics()): DailyItem[] {
  const rng = seededFrom(`${date}|${childKey}`);
  const items: DailyItem[] = [];
  if (!topics.length) return items;
  for (let i = 0; i < length; i++) {
    const topic = topics[i % topics.length];
    const level = clampLevel(topic, progress[topic]?.level ?? 1);
    let question: Question | GeoQuestion; let kind = "curriculum";
    if (topic === ("geography" as Topic)) { question = makeGeoQuestion(level, rng, topic); kind = (question as GeoQuestion).mode; }
    else if (topic === ("abacus" as Topic)) { const a = abacusQuestion(level, i, rng); question = a.question; kind = a.mode; }
    else if (topic === ("algebra" as Topic) && level >= 4 && i >= topics.length) {
      const q = makeTwoSided(rng); const n = Number(q.answer);
      question = { ...q, level, choices: [...new Set([n, n + 1, Math.max(0, n - 1), n + 2])].map(String).sort(() => rng() - 0.5) }; kind = "two-sided";
    } else question = makeQuestion(topic, level, rng);
    items.push({ topic, level, question, kind });
  }
  return items;
}
export const dailyTitle = () => "Daily challenge";
export { topicTitle };
