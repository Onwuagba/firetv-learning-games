import { maxLevel } from "../curriculum.js";
import { STREAK_TO_LEVEL_UP } from "../games/quiz.js";
import { PermanentError, type KeyValueStorage, type Progress, type ProgressApiClient, type ProgressEvent, type SyncStatus } from "./types.js";

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

/**
 * Local-first sync: record() queues events; flush() pushes, keeping the queue on failure (offline-safe).
 * With `storage`, progress and the queue survive restarts (restore() / load()). The server (coach) is the
 * source of truth: after a successful load, progress = server progress + still-queued local events.
 */
export class ProgressSync {
  progress: Progress = {};
  queue: ProgressEvent[] = [];
  status: SyncStatus;
  private seq = 0;
  private listeners = new Set<() => void>();
  constructor(private api: ProgressApiClient, private learnerId: string, private now: () => number = Date.now,
              private storage?: KeyValueStorage, private remote = true) { this.status = remote ? "pending" : "local"; }
  private get key() { return `learncoach:v1:${this.learnerId}`; }
  subscribe(fn: () => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }
  private emit() { this.listeners.forEach((f) => f()); }
  private setStatus(s: SyncStatus) { if (this.remote && this.status !== s) { this.status = s; this.emit(); } }
  private async persist() {
    try { await this.storage?.setItem(this.key, JSON.stringify({ progress: this.progress, queue: this.queue })); } catch { /* storage is best-effort */ }
  }
  /** Load persisted local state (call once at startup, before load()). */
  async restore(): Promise<void> {
    try {
      const raw = await this.storage?.getItem(this.key);
      if (!raw) return;
      const j = JSON.parse(raw) as { progress?: Progress; queue?: ProgressEvent[] };
      if (j.progress && typeof j.progress === "object") this.progress = mergeProgress(this.progress, j.progress);
      if (Array.isArray(j.queue)) this.queue = [...j.queue, ...this.queue];
      this.emit();
    } catch { /* corrupt storage: start fresh */ }
  }
  async load(): Promise<Progress> {
    try {
      const remote = await this.api.fetchProgress(this.learnerId);
      this.progress = this.queue.length ? applyEvents(remote, this.queue) : Object.keys(remote).length ? remote : this.progress;
      this.setStatus(this.queue.length ? "pending" : "synced");
      await this.persist();
    } catch { this.setStatus("offline"); /* stay local */ }
    this.emit();
    return this.progress;
  }
  record(topic: ProgressEvent["topic"], level: number, correct: boolean): void {
    const at = this.now();
    const id = `${at.toString(36)}-${(this.seq++).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const ev = { topic, level, correct, at, id };
    this.queue.push(ev); this.progress = applyEvents(this.progress, [ev]);
    this.setStatus("pending"); void this.persist(); this.emit();
  }
  async flush(): Promise<boolean> {
    if (!this.queue.length) return true;
    const batch = this.queue.slice();
    try { await this.api.pushEvents(this.learnerId, batch); this.queue = this.queue.slice(batch.length); this.setStatus(this.queue.length ? "pending" : "synced"); await this.persist(); return true; }
    catch (e) {
      if (e instanceof PermanentError) { this.queue = this.queue.slice(batch.length); await this.persist(); } // can never succeed: drop
      else this.setStatus("offline");
      return false;
    }
  }
  currentLevel(topic: ProgressEvent["topic"]) { return this.progress[topic]?.level ?? 1; }
}
