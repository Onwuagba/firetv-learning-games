// Device-level state that is not coach progress: profiles, settings, per-child stats (streak days, stars, badges).
// Offline-first: everything is saved to local storage on every change; corrupt or missing data falls back to defaults.
import type { KeyValueStorage, Progress } from "./progress/types.js";
import { addProfile, emptyProfiles, removeProfile, setActive, type AddResult, type ProfilesState } from "./profiles.js";
import { defaultSettings, mergeSettings, type Settings } from "./settings.js";
import { awardBadges, dateKey, emptyStats, recordAnswers, recordRound, type Badge, type Stats } from "./motivation.js";
import type { RoundResult } from "./games/round.js";

const KEY = "learncoach:app:v1";
interface Persisted { profiles: ProfilesState; settings: Settings; stats: Record<string, Stats> }

export class AppStore {
  profiles: ProfilesState = emptyProfiles();
  settings: Settings;
  stats: Record<string, Stats> = {};
  loaded = false;
  loadError = false;
  private listeners = new Set<() => void>();
  constructor(private storage?: KeyValueStorage & { removeItem?(k: string): Promise<void> }, private defaults: Settings = defaultSettings(), private now: () => number = Date.now) {
    this.settings = defaults;
  }
  subscribe(fn: () => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; }
  private emit() { this.listeners.forEach((f) => f()); }
  private async save() {
    const data: Persisted = { profiles: this.profiles, settings: this.settings, stats: this.stats };
    try { await this.storage?.setItem(KEY, JSON.stringify(data)); } catch { /* best effort */ }
  }
  async load(): Promise<void> {
    try {
      const raw = await this.storage?.getItem(KEY);
      if (raw) {
        const j = JSON.parse(raw) as Partial<Persisted>;
        const ps = j.profiles;
        if (ps && Array.isArray(ps.profiles)) {
          const profiles = ps.profiles.filter((p) => p && typeof p.id === "string" && typeof p.name === "string" && typeof p.childKey === "string");
          this.profiles = { profiles, activeId: profiles.some((p) => p.id === ps.activeId) ? ps.activeId : (profiles[0]?.id ?? null) };
        }
        this.settings = mergeSettings(j.settings, this.defaults);
        if (j.stats && typeof j.stats === "object") for (const [k, v] of Object.entries(j.stats)) this.stats[k] = { ...emptyStats(), ...(v as Partial<Stats>) };
      }
    } catch { this.loadError = true; /* corrupt: start fresh, never crash */ }
    this.loaded = true; this.emit();
  }
  addProfile(name: string, avatar: string): AddResult {
    const r = addProfile(this.profiles, name, avatar, this.now());
    if (r.ok) { this.profiles = r.state; this.stats[r.profile.id] = emptyStats(); void this.save(); this.emit(); }
    return r;
  }
  removeProfile(id: string) { this.profiles = removeProfile(this.profiles, id); delete this.stats[id]; void this.save(); this.emit(); }
  setActive(id: string) { this.profiles = setActive(this.profiles, id); void this.save(); this.emit(); }
  updateSettings(patch: Partial<Settings>) { this.settings = { ...this.settings, ...patch }; void this.save(); this.emit(); }
  statsFor(id: string): Stats { return this.stats[id] ?? emptyStats(); }
  today() { return dateKey(this.now()); }
  /** Call for every answered question so the day counts toward the streak even if the round is not finished. */
  noteAnswer(id: string) { this.stats[id] = recordAnswers(this.statsFor(id), 1, this.today()); void this.save(); this.emit(); }
  /** Call when a round ends: adds stars, marks daily completion, awards new badges (returned so the UI can celebrate). */
  finishRound(id: string, r: RoundResult, progress: Progress): { stats: Stats; fresh: Badge[] } {
    const today = this.today();
    const updated = recordRound(this.statsFor(id), r, today);
    const { stats, fresh } = awardBadges({ stats: updated, progress, today });
    this.stats[id] = stats; void this.save(); this.emit();
    return { stats, fresh };
  }
}
