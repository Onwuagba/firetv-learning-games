// Who's watching: several children share one TV, each with an avatar and their own progress (keyed by `childKey`,
// which is also the child id sent to the Learning Coach so Alexa+ practice lands on the same profile).
export interface Avatar { id: string; emoji: string; color: string; label: string }
export const AVATARS: Avatar[] = [
  { id: "fox", emoji: "🦊", color: "#FF9F43", label: "Fox" },
  { id: "owl", emoji: "🦉", color: "#A78BFA", label: "Owl" },
  { id: "lion", emoji: "🦁", color: "#FFD23F", label: "Lion" },
  { id: "frog", emoji: "🐸", color: "#2ECC71", label: "Frog" },
  { id: "robot", emoji: "🤖", color: "#4DA3FF", label: "Robot" },
  { id: "rocket", emoji: "🚀", color: "#FF6B6B", label: "Rocket" },
];
export const avatarOf = (id: string): Avatar => AVATARS.find((a) => a.id === id) ?? AVATARS[0];

export interface Profile { id: string; name: string; avatar: string; childKey: string; createdAt: number }
export interface ProfilesState { profiles: Profile[]; activeId: string | null }
export const MAX_PROFILES = 6;
export const MAX_NAME = 12;
export const emptyProfiles = (): ProfilesState => ({ profiles: [], activeId: null });

export const cleanName = (n: string) => n.replace(/\s+/g, " ").trim().slice(0, MAX_NAME);
/** Coach child id: lowercase letters/digits/dashes. Must be unique among profiles. */
export function childKeyFor(name: string, taken: string[] = []): string {
  const base = cleanName(name).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "player";
  let key = base, i = 2;
  while (taken.includes(key)) key = `${base}-${i++}`;
  return key;
}

export type AddResult = { ok: true; state: ProfilesState; profile: Profile } | { ok: false; error: "full" | "empty" };
export function addProfile(st: ProfilesState, name: string, avatar: string, now = Date.now()): AddResult {
  const nm = cleanName(name);
  if (!nm) return { ok: false, error: "empty" };
  if (st.profiles.length >= MAX_PROFILES) return { ok: false, error: "full" };
  const childKey = childKeyFor(nm, st.profiles.map((p) => p.childKey));
  const profile: Profile = { id: childKey, name: nm, avatar: avatarOf(avatar).id, childKey, createdAt: now };
  return { ok: true, profile, state: { profiles: [...st.profiles, profile], activeId: st.activeId ?? profile.id } };
}
export function removeProfile(st: ProfilesState, id: string): ProfilesState {
  const profiles = st.profiles.filter((p) => p.id !== id);
  return { profiles, activeId: st.activeId === id ? (profiles[0]?.id ?? null) : st.activeId };
}
export const setActive = (st: ProfilesState, id: string): ProfilesState => (st.profiles.some((p) => p.id === id) ? { ...st, activeId: id } : st);
export const activeProfile = (st: ProfilesState): Profile | null => st.profiles.find((p) => p.id === st.activeId) ?? null;
/** Avatars not yet used come first so siblings get different faces by default. */
export const freeAvatars = (st: ProfilesState): Avatar[] => {
  const used = new Set(st.profiles.map((p) => p.avatar));
  return [...AVATARS.filter((a) => !used.has(a.id)), ...AVATARS.filter((a) => used.has(a.id))];
};
