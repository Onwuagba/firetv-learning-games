// App session: device store (profiles/settings/stats) + one ProgressSync per (child, server URL).
// Coach REST client when a server URL is set (Settings or EXPO_PUBLIC_COACH_URL), else the in-memory mock. Local state
// (progress + unsent events) is persisted in AsyncStorage per child and re-synced when the coach is reachable.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ProgressSync } from "../../src/progress/sync";
import { MockProgressClient } from "../../src/progress/mock";
import { HttpProgressClient } from "../../src/progress/http";
import { AppStore } from "../../src/appStore";
import { defaultSettings } from "../../src/settings";
import { STREAK_TO_LEVEL_UP } from "../../src/games/quiz";
import { activeProfile, type Profile } from "../../src/profiles";
import { clampLevel, type Topic } from "../../src/curriculum";
import { config } from "./config";

export const store = new AppStore(AsyncStorage, defaultSettings(config.coachUrl));
export const STREAK_NEEDED = STREAK_TO_LEVEL_UP;

const GUEST = "guest";
let sync = new ProgressSync(new MockProgressClient(), GUEST, Date.now, undefined, false);
let syncKey = `${GUEST}|`;
let lastSyncedAt = 0;
let starting = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((f) => f());
export const subscribeSession = (fn: () => void) => { listeners.add(fn); return () => { listeners.delete(fn); }; };
store.subscribe(() => { notify(); void ensureSync(); });

export const getSync = () => sync;
export const getProfile = (): Profile | null => activeProfile(store.profiles);
export const serverUrl = () => store.settings.serverUrl;
export const usingCoach = () => serverUrl().length > 0;
export const lastSynced = () => lastSyncedAt;
export const level = (t: Topic) => clampLevel(t, sync.currentLevel(t));
export const streakOf = (t: Topic) => sync.progress[t]?.streak ?? 0;
export const stats = () => { const p = getProfile(); return p ? store.statsFor(p.id) : store.statsFor(GUEST); };

/** Rebuild the sync instance when the active child or server URL changed. */
async function ensureSync(): Promise<void> {
  const p = getProfile(); const id = p?.childKey ?? GUEST; const url = serverUrl();
  const key = `${id}|${url}`;
  if (key === syncKey) return;
  syncKey = key;
  const api = url ? new HttpProgressClient(url, config.tvToken || undefined) : new MockProgressClient();
  const next = new ProgressSync(api, id, Date.now, AsyncStorage, !!url);
  next.subscribe(notify);
  sync = next; lastSyncedAt = 0; notify();
  await next.restore();
  if (sync === next) await syncNow();
}

/** Push queued events, then pull the coach's authoritative progress (levels are decided by the coach). */
export async function syncNow(): Promise<boolean> {
  const s = sync;
  await s.flush(); await s.load();
  if (s.status === "synced") lastSyncedAt = Date.now();
  notify();
  return s.status === "synced" || s.status === "local";
}
/** Record an answer for the active child (also counts toward the day streak). */
export function record(t: Topic, lvl: number, ok: boolean) {
  const p = getProfile(); if (p) store.noteAnswer(p.id);
  sync.record(t, lvl, ok); void syncNow();
}

/** Startup: load device state, seed a first profile from EXPO_PUBLIC_CHILD if set, sync, then poll so Alexa+ progress appears live. */
export async function startSession(pollMs = 8000): Promise<() => void> {
  if (starting) return () => {};
  starting = true;
  await store.load();
  if (!store.profiles.profiles.length && config.child) store.addProfile(config.child.replace(/^./, (c: string) => c.toUpperCase()), "fox");
  syncKey = "";
  await ensureSync();
  const id = setInterval(() => { if (usingCoach()) void syncNow(); }, pollMs);
  return () => { clearInterval(id); starting = false; };
}
