// On-screen keyboard model (no system keyboard on a TV remote). Used for child names and the server URL.
export type Charset = "name" | "url";
export const KEY_ROWS: Record<Charset, string[][]> = {
  name: ["ABCDEFGHI", "JKLMNOPQR", "STUVWXYZ"].map((r) => [...r]),
  url: ["1234567890", "abcdefghij", "klmnopqrst", "uvwxyz.:/-"].map((r) => [...r]),
};
export interface EntryState { text: string; max: number; charset: Charset }
export const newEntry = (charset: Charset, text = "", max = charset === "name" ? 12 : 80): EntryState => ({ text, max, charset });
export function typeChar(s: EntryState, ch: string): EntryState {
  if (s.text.length >= s.max) return s;
  // Names: capitalise the first letter, lowercase the rest, so "ADA" typed on a caps keyboard reads "Ada".
  const c = s.charset === "name" ? (s.text.length === 0 || s.text.endsWith(" ") ? ch.toUpperCase() : ch.toLowerCase()) : ch;
  return { ...s, text: s.text + c };
}
export const backspace = (s: EntryState): EntryState => ({ ...s, text: s.text.slice(0, -1) });
export const space = (s: EntryState): EntryState => (s.charset === "name" && s.text && !s.text.endsWith(" ") ? typeChar(s, " ") : s);
