import type { Key } from "../games/abacus.js";
export type RemoteKey = Key | "back";
/** Keyboard -> remote mapping for the web preview. On device, TODO-verify RN TV event names (useTVEventHandler). */
export function mapKey(code: string): RemoteKey | null {
  switch (code) {
    case "ArrowLeft": return "left"; case "ArrowRight": return "right";
    case "ArrowUp": return "up"; case "ArrowDown": return "down";
    case "Enter": case " ": return "select";
    case "Escape": case "Backspace": return "back";
    default: return null;
  }
}
