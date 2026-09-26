// Sound effects + optional music, behind the Settings toggles. Uses expo-audio (the SDK 54 audio module; expo-av is deprecated).
// Assets are synthesised by scripts/gen-audio.mjs (no third-party audio). Every call is best-effort: audio must never crash a game.
import { createAudioPlayer, type AudioPlayer } from "expo-audio";

const SOURCES = {
  move: require("../assets/audio/move.wav"),
  select: require("../assets/audio/select.wav"),
  back: require("../assets/audio/back.wav"),
  correct: require("../assets/audio/correct.wav"),
  wrong: require("../assets/audio/wrong.wav"),
  levelup: require("../assets/audio/levelup.wav"),
  star: require("../assets/audio/star.wav"),
} as const;
export type Sfx = keyof typeof SOURCES;
const VOLUME: Record<Sfx, number> = { move: 0.35, select: 0.6, back: 0.5, correct: 0.7, wrong: 0.5, levelup: 0.8, star: 0.6 };

let soundOn = true, musicOn = false;
const players = new Map<Sfx, AudioPlayer>();
let music: AudioPlayer | null = null;

function player(name: Sfx): AudioPlayer | null {
  try {
    let p = players.get(name);
    if (!p) { p = createAudioPlayer(SOURCES[name]); p.volume = VOLUME[name]; players.set(name, p); }
    return p;
  } catch { return null; }
}
let quietUntil = 0;
/** Suppress focus-move ticks briefly after a screen change (initial focus is not a user move). */
export const quietFor = (ms: number) => { quietUntil = Date.now() + ms; };
export function play(name: Sfx) {
  if (!soundOn || (name === "move" && Date.now() < quietUntil)) return;
  try { const p = player(name); if (!p) return; void Promise.resolve(p.seekTo(0)).catch(() => {}); p.play(); } catch { /* ignore */ }
}
function syncMusic() {
  try {
    if (musicOn) {
      if (!music) { music = createAudioPlayer(require("../assets/audio/music.wav")); music.loop = true; music.volume = 0.22; }
      music.play();
    } else music?.pause();
  } catch { /* ignore */ }
}
/** Apply the Settings toggles. Music is separate from effects so a parent can keep effects and mute music (default: music off). */
export function configure(s: { sound: boolean; music: boolean }) {
  const changed = musicOn !== (s.music && s.sound);
  soundOn = s.sound; musicOn = s.music && s.sound; // the mute toggle silences everything
  if (changed || musicOn) syncMusic();
}
export const audio = { play, configure, quietFor };
