// One progress-sync instance for the app. Coach REST client if EXPO_PUBLIC_COACH_URL is set, else the mock.
// Local state (progress + unsent events) is persisted in AsyncStorage and re-synced when the coach is reachable.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ProgressSync } from "../../src/progress/sync";
import { MockProgressClient } from "../../src/progress/mock";
import { HttpProgressClient } from "../../src/progress/http";
import { STREAK_TO_LEVEL_UP } from "../../src/games/quiz";
import type { Topic } from "../../src/curriculum";
import { config, useCoach } from "./config";

const api = useCoach ? new HttpProgressClient(config.coachUrl, config.tvToken || undefined) : new MockProgressClient();
export const sync = new ProgressSync(api, config.child, Date.now, AsyncStorage, useCoach);
export const STREAK_NEEDED = STREAK_TO_LEVEL_UP;
export const streakOf = (t: Topic) => sync.progress[t]?.streak ?? 0;

/** Push queued events, then pull the coach's authoritative progress (levels are decided by the coach). */
export async function syncNow(): Promise<void> {
  await sync.flush();
  await sync.load();
}
export const record = (t: Topic, level: number, ok: boolean) => { sync.record(t, level, ok); void syncNow(); };

/** Startup: restore local state, sync, then poll so progress made via Alexa+ appears without a restart. */
export async function startSession(pollMs = 8000): Promise<() => void> {
  await sync.restore();
  await syncNow();
  if (!useCoach) return () => {};
  const id = setInterval(() => void syncNow(), pollMs);
  return () => clearInterval(id);
}
