// Generates the app's sound effects and a music loop as small mono 16-bit WAV files (pure synthesis: no third-party
// audio, so no licence to track). Usage: node scripts/gen-audio.mjs   ->   app/assets/audio/*.wav
import { writeFileSync, mkdirSync } from "node:fs";
const OUT = new URL("../app/assets/audio/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

function wav(samples, rate) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const h = Buffer.alloc(44);
  h.write("RIFF", 0); h.writeUInt32LE(36 + data.length, 4); h.write("WAVEfmt ", 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22); h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write("data", 36); h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}
const midi = (n) => 440 * 2 ** ((n - 69) / 12);
/** Mix notes {t, dur, note, vol, wave} into a buffer; soft attack + exponential decay avoids clicks. */
function render(seconds, rate, notes) {
  const buf = new Float32Array(Math.floor(seconds * rate));
  for (const n of notes) {
    const f = midi(n.note), start = Math.floor(n.t * rate), len = Math.floor(n.dur * rate);
    for (let i = 0; i < len && start + i < buf.length; i++) {
      const t = i / rate, att = Math.min(1, t / 0.008), env = att * Math.exp(-t * (n.decay ?? 6)) * Math.min(1, (len - i) / (0.01 * rate));
      const ph = 2 * Math.PI * f * t;
      const w = n.wave === "tri" ? (2 / Math.PI) * Math.asin(Math.sin(ph)) : Math.sin(ph) + 0.25 * Math.sin(2 * ph);
      buf[start + i] += w * env * (n.vol ?? 0.4);
    }
  }
  return buf;
}
const R = 22050;
const sfx = {
  move: [{ t: 0, dur: 0.05, note: 84, vol: 0.18, decay: 40 }],
  select: [{ t: 0, dur: 0.12, note: 76, vol: 0.4, decay: 18 }, { t: 0.05, dur: 0.14, note: 83, vol: 0.35, decay: 16 }],
  back: [{ t: 0, dur: 0.14, note: 72, vol: 0.35, decay: 16 }, { t: 0.06, dur: 0.14, note: 65, vol: 0.3, decay: 16 }],
  correct: [{ t: 0, dur: 0.2, note: 72, decay: 9 }, { t: 0.11, dur: 0.2, note: 76, decay: 9 }, { t: 0.22, dur: 0.4, note: 79, decay: 6 }],
  wrong: [{ t: 0, dur: 0.22, note: 55, vol: 0.4, wave: "tri", decay: 8 }, { t: 0.14, dur: 0.3, note: 52, vol: 0.4, wave: "tri", decay: 7 }],
  levelup: [72, 76, 79, 84, 88, 91].map((n, i) => ({ t: i * 0.09, dur: 0.35, note: n, vol: 0.32, decay: 5 })).concat([{ t: 0.6, dur: 0.9, note: 96, vol: 0.28, decay: 3 }]),
  star: [{ t: 0, dur: 0.5, note: 88, vol: 0.3, decay: 5 }, { t: 0.02, dur: 0.5, note: 95, vol: 0.18, decay: 6 }],
};
for (const [name, notes] of Object.entries(sfx)) {
  const end = Math.max(...notes.map((n) => n.t + n.dur)) + 0.05;
  writeFileSync(`${OUT}${name}.wav`, wav(render(end, R, notes), R));
}
// Music: 12 s loop, C major pentatonic arpeggio over a soft pad. Fades to silence at the end so the loop point does not click.
{
  const rate = 16000, bars = 6, bar = 2.0, pent = [0, 2, 4, 7, 9];
  const chords = [[48, 55, 64], [53, 60, 69], [55, 62, 71], [45, 52, 60], [48, 55, 64], [55, 62, 67]];
  const notes = [];
  for (let b = 0; b < bars; b++) {
    chords[b].forEach((n) => notes.push({ t: b * bar, dur: bar - 0.05, note: n, vol: 0.07, wave: "tri", decay: 0.6 }));
    for (let s = 0; s < 8; s++) {
      const deg = (b * 3 + s * 2 + (s % 3)) % 10, note = 72 + pent[deg % 5] + (deg >= 5 ? 12 : 0);
      notes.push({ t: b * bar + s * 0.25, dur: 0.45, note, vol: 0.09, decay: 5 });
    }
  }
  const buf = render(bars * bar, rate, notes);
  const fade = Math.floor(rate * 0.15);
  for (let i = 0; i < fade; i++) buf[buf.length - 1 - i] *= i / fade;
  writeFileSync(`${OUT}music.wav`, wav(buf, rate));
}
console.log("wrote audio to", OUT);
