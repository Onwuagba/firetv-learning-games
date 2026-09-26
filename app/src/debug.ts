// Web-only test hook: with ?debug in the URL the current question is exposed as globalThis.__lp so scripts/screenshots.mjs
// can answer correctly and wrongly without OCR. Does nothing on device.
export function debugQuestion(info: { answer: string; prompt: string; choices?: string[] }) {
  const g = globalThis as { __lp?: unknown; location?: { search?: string } };
  if (g.location?.search?.includes("debug")) g.__lp = info;
}
