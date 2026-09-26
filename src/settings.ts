// App settings (per TV, not per child). Server URL is where the Learning Coach's TV REST API lives.
export interface Settings { serverUrl: string; sound: boolean; music: boolean; reducedMotion: "auto" | "on" | "off" }
export const defaultSettings = (serverUrl = ""): Settings => ({ serverUrl, sound: true, music: false, reducedMotion: "auto" });

/** Normalise user input to a base URL, or return an error. Empty is valid (= local only). */
export function normalizeServerUrl(input: string): { ok: true; url: string } | { ok: false; error: string } {
  const t = input.trim();
  if (!t) return { ok: true, url: "" };
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `http://${t}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") return { ok: false, error: "Use http or https" };
    if (!u.hostname) return { ok: false, error: "Missing host" };
    return { ok: true, url: `${u.protocol}//${u.host}${u.pathname.replace(/\/+$/, "")}` };
  } catch { return { ok: false, error: "Not a valid address" }; }
}
export const cycleReduced = (m: Settings["reducedMotion"]): Settings["reducedMotion"] => (m === "auto" ? "on" : m === "on" ? "off" : "auto");
/** Effective reduced-motion flag given the system preference. */
export const reducedMotionOn = (m: Settings["reducedMotion"], system: boolean) => (m === "auto" ? system : m === "on");
export function mergeSettings(saved: unknown, defaults: Settings): Settings {
  const s = (saved && typeof saved === "object" ? saved : {}) as Partial<Settings>;
  return {
    serverUrl: typeof s.serverUrl === "string" ? s.serverUrl : defaults.serverUrl,
    sound: typeof s.sound === "boolean" ? s.sound : defaults.sound,
    music: typeof s.music === "boolean" ? s.music : defaults.music,
    reducedMotion: s.reducedMotion === "on" || s.reducedMotion === "off" || s.reducedMotion === "auto" ? s.reducedMotion : defaults.reducedMotion,
  };
}
