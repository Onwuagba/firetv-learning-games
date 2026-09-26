// Design tokens. Layout is authored at 1920x1080 and scaled (react-native-pixel-perfect, as in the Amazon sample).
// Identity: a friendly night-sky "learning adventure": deep indigo canvas, one warm yellow focus colour, a bright colour per topic.
import { create } from "react-native-pixel-perfect";
export const px = create({ width: 1920, height: 1080 });
export const colors = {
  bg: "#0B1533", bgAlt: "#132247", card: "#1B2D5C", cardHi: "#243B7A", cardDim: "#16244A",
  text: "#FFFFFF", textDim: "#B8C4E6", ink: "#0B1533",
  focus: "#FFD23F", focusGlow: "rgba(255,210,63,0.45)",
  right: "#2ECC71", wrong: "#FF6B6B", ocean: "#0E2A4A", land: "#3A5F8F",
  abacus: "#4DA3FF", tens: "#FF9F43", hundreds: "#2ECC71", accent: "#A78BFA", star: "#FFD23F",
};
/** Known topics get a signature colour; any new topic in the curriculum cycles through the palette. */
export const topicColors: Record<string, string> = { abacus: "#4DA3FF", geography: "#2ECC71", algebra: "#FF9F43" };
const PALETTE = ["#FF6B9D", "#A78BFA", "#22D3EE", "#F59E0B", "#84CC16", "#F472B6"];
export const topicColor = (topic: string, index = 0) => topicColors[topic] ?? PALETTE[index % PALETTE.length];
// TV title-safe margins (5% of 1920x1080), from the sample's safeZones.
export const safe = { h: 96, v: 54 };
/** 10-foot type scale (px at 1080p): nothing the child must read is below 28. */
export const font = { hero: 88, title: 64, prompt: 76, body: 40, hint: 30, small: 28 };
export const radius = { card: 28, pill: 40 };
