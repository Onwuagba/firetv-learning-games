// One progress-sync instance for the app. Mock client by default (see src/progress/http.ts for the skeleton real client).
import { ProgressSync } from "../../src/progress/sync";
import { MockProgressClient } from "../../src/progress/mock";
import { STREAK_TO_LEVEL_UP } from "../../src/games/quiz";
import type { Topic } from "../../src/curriculum";

export const sync = new ProgressSync(new MockProgressClient(), "demo-learner");
export const STREAK_NEEDED = STREAK_TO_LEVEL_UP;
export const streakOf = (t: Topic) => sync.progress[t]?.streak ?? 0;
export const record = (t: Topic, level: number, ok: boolean) => { sync.record(t, level, ok); void sync.flush(); };
