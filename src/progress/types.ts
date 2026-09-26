import type { Topic } from "../curriculum.js";
export interface TopicProgress { level: number; correct: number; attempts: number; updatedAt: number; streak?: number }
export type Progress = Partial<Record<Topic, TopicProgress>>;
/** `id` makes retries idempotent on the coach (it ignores ids it has already applied). */
export interface ProgressEvent { topic: Topic; level: number; correct: boolean; at: number; id?: string }
/** Minimal async key-value storage (AsyncStorage satisfies this). */
export interface KeyValueStorage { getItem(k: string): Promise<string | null>; setItem(k: string, v: string): Promise<void> }
export type SyncStatus = "local" | "synced" | "pending" | "offline";
/** Thrown by a client when retrying the same batch can never succeed (the batch is then dropped). */
export class PermanentError extends Error {}
/** Pluggable transport to the Learning Coach's store. Implementations must be idempotent-friendly. */
export interface ProgressApiClient {
  fetchProgress(learnerId: string): Promise<Progress>;
  pushEvents(learnerId: string, events: ProgressEvent[]): Promise<void>;
}
