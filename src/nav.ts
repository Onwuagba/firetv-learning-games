// Screen navigation. BACK always pops toward home; on home it is a no-op (system handles exit).
export type Screen = string; // "home", "profiles", "settings", ... or "game:<topic>" (topics come from the curriculum)
export const gameScreen = (topic: string): Screen => `game:${topic}`;
export const topicOf = (s: Screen): string | null => (s.startsWith("game:") ? s.slice(5) : null);
export interface Nav { stack: Screen[] }
export const initialNav = (): Nav => ({ stack: ["home"] });
export const current = (n: Nav): Screen => n.stack[n.stack.length - 1];
export const go = (n: Nav, s: Screen): Nav => (current(n) === s ? n : { stack: [...n.stack, s] });
export const back = (n: Nav): Nav => (n.stack.length > 1 ? { stack: n.stack.slice(0, -1) } : n);
export const atHome = (n: Nav) => n.stack.length === 1;
/** Swap the top screen (e.g. game -> results) so BACK from results goes home, not back into the finished game. */
export const replace = (n: Nav, s: Screen): Nav => ({ stack: [...n.stack.slice(0, -1), s] });
