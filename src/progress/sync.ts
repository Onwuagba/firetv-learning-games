import { maxLevel } from "../curriculum.js";
import { STREAK_TO_LEVEL_UP } from "../games/quiz.js";
import type { Progress, ProgressApiClient, ProgressEvent } from "./types.js";

/** Fold events into progress. Level goes up after STREAK_TO_LEVEL_UP consecutive correct at the current level. */
export function applyEvents(p: Progress, events: ProgressEvent[]): Progress {
  const out: Progress = structuredClone(p);
  for (const e of [...events].sort((a, b) => a.at - b.at)) {
    const t = out[e.topic] ?? { level: 1, correct: 0, attempts: 0, updatedAt: 0, streak: 0 };
    t.attempts++; if (e.correct) t.correct++;
    t.streak = e.correct ? (t.streak ?? 0) + 1 : 0;
    if (t.streak >= STREAK_TO_LEVEL_UP && t.level < maxLevel(e.topic)) { t.level++; t.streak = 0; }
    t.updatedAt = Math.max(t.updatedAt, e.at);
    out[e.topic] = t;
  }
  return out;
}

/** Merge two progress snapshots: per topic keep the higher level; counts take the max; newest timestamp. */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const out: Progress = {};
  for (const t of new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof Progress & string>) {
    const x = a[t], y = b[t];
    out[t] = x && y ? { level: Math.max(x.level, y.level), correct: Math.max(x.correct, y.correct), attempts: Math.max(x.attempts, y.attempts), updatedAt: Math.max(x.updatedAt, y.updatedAt) } : (x ?? y);
  }
  return out;
}

/** Local-first sync: record() queues events; flush() pushes, keeping the queue on failure (offline-safe). */
export class ProgressSync {
  progress: Progress = {};
  queue: ProgressEvent[] = [];
  constructor(private api: ProgressApiClient, private learnerId: string, private now: () => number = Date.now) {}
  async load(): Promise<Progress> {
    try { this.progress = mergeProgress(await this.api.fetchProgress(this.learnerId), this.progress); } catch { /* stay local */ }
    return this.progress;
  }
  record(topic: ProgressEvent["topic"], level: number, correct: boolean): void {
    const ev = { topic, level, correct, at: this.now() };
    this.queue.push(ev); this.progress = applyEvents(this.progress, [ev]);
  }
  async flush(): Promise<boolean> {
    if (!this.queue.length) return true;
    const batch = this.queue.slice();
    try { await this.api.pushEvents(this.learnerId, batch); this.queue = this.queue.slice(batch.length); return true; }
    catch { return false; }
  }
  currentLevel(topic: ProgressEvent["topic"]) { return this.progress[topic]?.level ?? 1; }
}
