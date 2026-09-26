// Streaks, stars and badges. Everything is derived from a small per-child Stats record plus the coach-synced Progress,
// and badges for topics are generated from the curriculum, so new topics/levels earn badges with no code change.
import { allTopics, maxLevel, playableTopics, topicTitle, type Topic } from "./curriculum.js";
import type { Progress } from "./progress/types.js";
import type { RoundResult } from "./games/round.js";

export interface Stats {
  days: string[];            // distinct local dates (YYYY-MM-DD) with any practice, ascending, capped
  dailyDone: string[];       // dates the daily challenge was completed
  stars: number; rounds: number; perfectRounds: number; answers: number;
  badges: string[];          // earned badge ids (persisted so a badge is celebrated once)
}
export const emptyStats = (): Stats => ({ days: [], dailyDone: [], stars: 0, rounds: 0, perfectRounds: 0, answers: 0, badges: [] });
const KEEP_DAYS = 400;

/** Local calendar date key. `offsetMin` = minutes behind UTC (Date#getTimezoneOffset); injectable for tests. */
export function dateKey(ms: number, offsetMin = new Date(ms).getTimezoneOffset()): string {
  return new Date(ms - offsetMin * 60000).toISOString().slice(0, 10);
}
const dayNum = (k: string) => Math.round(Date.parse(`${k}T00:00:00Z`) / 86400000);

/** Consecutive practice days ending today, or yesterday (the streak is still alive until the day is over). */
export function dayStreak(st: Stats, today: string): number {
  const set = new Set(st.days);
  let d = dayNum(today);
  if (!set.has(today)) d -= 1;
  let n = 0;
  const keyOf = (num: number) => new Date(num * 86400000).toISOString().slice(0, 10);
  while (set.has(keyOf(d))) { n++; d--; }
  return n;
}
export function bestStreak(st: Stats): number {
  let best = 0, run = 0, prev = NaN;
  for (const k of [...new Set(st.days)].sort()) { const n = dayNum(k); run = n === prev + 1 ? run + 1 : 1; prev = n; best = Math.max(best, run); }
  return best;
}
export function recordAnswers(st: Stats, count: number, today: string): Stats {
  const days = st.days.includes(today) ? st.days : [...st.days, today].sort().slice(-KEEP_DAYS);
  return { ...st, days, answers: st.answers + count };
}
export function recordRound(st: Stats, r: RoundResult, today: string): Stats {
  const base = recordAnswers(st, 0, today);
  return {
    ...base, rounds: st.rounds + 1, stars: st.stars + r.stars,
    perfectRounds: st.perfectRounds + (r.correct === r.total && r.total > 0 ? 1 : 0),
    dailyDone: r.daily && !st.dailyDone.includes(today) ? [...st.dailyDone, today].slice(-KEEP_DAYS) : st.dailyDone,
  };
}

export interface Badge { id: string; title: string; blurb: string; emoji: string }
export interface BadgeContext { stats: Stats; progress: Progress; today: string }
interface BadgeDef extends Badge { earned: (c: BadgeContext) => boolean }

/** Static badges plus per-topic ones generated from the curriculum. */
export function badgeDefs(): BadgeDef[] {
  const defs: BadgeDef[] = [
    { id: "first-steps", title: "First steps", blurb: "Answer your first question", emoji: "👣", earned: (c) => c.stats.answers >= 1 || totalAttempts(c.progress) >= 1 },
    { id: "perfect-round", title: "Perfect round", blurb: "Get every answer in a round right", emoji: "🎯", earned: (c) => c.stats.perfectRounds >= 1 },
    { id: "streak-3", title: "3-day streak", blurb: "Practise 3 days in a row", emoji: "🔥", earned: (c) => bestStreak(c.stats) >= 3 },
    { id: "streak-7", title: "Week warrior", blurb: "Practise 7 days in a row", emoji: "🏅", earned: (c) => bestStreak(c.stats) >= 7 },
    { id: "stars-10", title: "Star collector", blurb: "Earn 10 stars", emoji: "⭐", earned: (c) => c.stats.stars >= 10 },
    { id: "stars-50", title: "Superstar", blurb: "Earn 50 stars", emoji: "🌟", earned: (c) => c.stats.stars >= 50 },
    { id: "daily-hero", title: "Daily hero", blurb: "Finish a daily challenge", emoji: "📅", earned: (c) => c.stats.dailyDone.length >= 1 },
  ];
  const topics = playableTopics();
  for (const t of topics) {
    defs.push({ id: `level2-${t}`, title: `${topicTitle(t)}: level 2`, blurb: `Reach level 2 in ${topicTitle(t)}`, emoji: "🚀", earned: (c) => (c.progress[t]?.level ?? 1) >= 2 });
    defs.push({ id: `master-${t}`, title: `${topicTitle(t)} master`, blurb: `Reach the top level of ${topicTitle(t)}`, emoji: "🏆", earned: (c) => (c.progress[t]?.level ?? 1) >= maxLevel(t) });
  }
  if (topics.length > 1) defs.push({ id: "explorer", title: "Explorer", blurb: "Try every game", emoji: "🧭", earned: (c) => topics.every((t) => (c.progress[t]?.attempts ?? 0) > 0) });
  return defs;
}
const totalAttempts = (p: Progress) => allTopics().reduce((n, t) => n + (p[t]?.attempts ?? 0), 0);
export const earnedBadges = (c: BadgeContext): Badge[] => badgeDefs().filter((b) => b.earned(c)).map(({ earned: _e, ...b }) => b);
/** Badges earned now that are not already stored in stats.badges; returns updated stats too. */
export function awardBadges(c: BadgeContext): { stats: Stats; fresh: Badge[] } {
  const now = earnedBadges(c);
  const fresh = now.filter((b) => !c.stats.badges.includes(b.id));
  return { stats: fresh.length ? { ...c.stats, badges: [...c.stats.badges, ...fresh.map((b) => b.id)] } : c.stats, fresh };
}
export const allBadges = (): Badge[] => badgeDefs().map(({ earned: _e, ...b }) => b);

/** Per-topic dashboard row. */
export interface TopicRow { topic: Topic; title: string; level: number; maxLevel: number; correct: number; attempts: number; accuracy: number | null; streak: number }
export function topicRows(progress: Progress): TopicRow[] {
  return playableTopics().map((t) => {
    const p = progress[t];
    return { topic: t, title: topicTitle(t), level: Math.min(p?.level ?? 1, maxLevel(t)), maxLevel: maxLevel(t), correct: p?.correct ?? 0, attempts: p?.attempts ?? 0, accuracy: p && p.attempts ? Math.round((100 * p.correct) / p.attempts) : null, streak: p?.streak ?? 0 };
  });
}
