// Map camera: pure viewBox maths for the quiz map. Three zoom stops, centred on the target country and clamped to the map.
export type Zoom = "world" | "region" | "close";
export const ZOOMS: Zoom[] = ["world", "region", "close"];
export const CARD_ASPECT = 1.6; // map card width : height
const WIDTHS: Record<Zoom, number> = { world: 1440, region: 640, close: 280 };

export function nextZoom(z: Zoom): Zoom { return ZOOMS[(ZOOMS.indexOf(z) + 1) % ZOOMS.length]; }

/** [x, y, w, h] for the SVG viewBox. World shows the whole map; other stops centre on (cx, cy). */
export function mapViewBox(cx: number, cy: number, zoom: Zoom, mapW = 1440, mapH = 568): [number, number, number, number] {
  const w = WIDTHS[zoom], h = w / CARD_ASPECT;
  if (zoom === "world") return [0, (mapH - h) / 2, w, h];
  const x = Math.min(Math.max(cx - w / 2, 0), mapW - w);
  const y = Math.min(Math.max(cy - h / 2, 0), mapH - h);
  return [x, y, w, h];
}
/** Sensible starting zoom: Africa-region levels open on the region, world levels on the whole world. */
export const defaultZoom = (region: string): Zoom => (region === "world" ? "world" : "region");
