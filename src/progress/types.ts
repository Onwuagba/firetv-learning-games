import type { Topic } from "../curriculum.js";
export interface TopicProgress { level: number; correct: number; attempts: number; updatedAt: number; streak?: number }
export type Progress = Partial<Record<Topic, TopicProgress>>;
export interface ProgressEvent { topic: Topic; level: number; correct: boolean; at: number }
/** Pluggable transport to the Learning Coach's store. Implementations must be idempotent-friendly. */
export interface ProgressApiClient {
  fetchProgress(learnerId: string): Promise<Progress>;
  pushEvents(learnerId: string, events: ProgressEvent[]): Promise<void>;
}
