import React from "react";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";
import { MAP_COUNTRIES, MAP_H, MAP_W } from "../mapData";
import { CARD_ASPECT, mapViewBox, type Zoom } from "../../../src/mapview";
import { colors } from "../theme";

export { defaultZoom, nextZoom } from "../../../src/mapview";
// Names in the curriculum that differ from the Natural Earth spelling.
const ALIAS: Record<string, string> = { "United States": "United States of America", "DR Congo": "Dem. Rep. Congo", "Ivory Coast": "Côte d'Ivoire", Czechia: "Czechia" };
export const findCountry = (name: string) => MAP_COUNTRIES.find((c) => c.name === (ALIAS[name] ?? name));

// Natural Earth 110m keeps polygons that cross the antimeridian (Fiji, Russia) as one path, which draws a line across the whole map.
// Drop any sub-path wider than half the map.
function stripWrapped(d: string): string {
  return d.split("M").filter(Boolean).filter((sp) => {
    const xs = (sp.match(/-?\d+(?:\.\d+)?/g) ?? []).filter((_, i) => i % 2 === 0).map(Number);
    return xs.length === 0 || Math.max(...xs) - Math.min(...xs) < MAP_W / 2;
  }).map((sp) => `M${sp}`).join("");
}
const PATHS = MAP_COUNTRIES.map((c) => ({ name: c.name, d: stripWrapped(c.d) }));
// The land paths never change, so draw them once (memo) and only redraw the highlight + viewBox per question/zoom.
const Land = React.memo(function Land() {
  return <G>{PATHS.map((c) => <Path key={c.name} d={c.d} fill={colors.land} stroke={colors.ocean} strokeWidth={1.2} />)}</G>;
});

/** Offline vector map (Natural Earth 110m, see scripts/gen-map.mjs). Highlights one country plus rings so small ones still read.
 *  `zoom` re-frames the camera on the target (world / region / close). A country missing from the 110m data shows the world un-highlighted. */
export function MapView({ target, zoom, width, highlight = true }: { target: string; zoom: Zoom; width: number; highlight?: boolean }) {
  const hit = findCountry(target);
  const [vx, vy, vw, vh] = mapViewBox(hit?.cx ?? MAP_W / 2, hit?.cy ?? MAP_H / 2, hit ? zoom : "world", MAP_W, MAP_H);
  const height = width / CARD_ASPECT;
  const r = (vw / 1440) * 22 + 6;
  return (
    <Svg width={width} height={height} viewBox={`${vx} ${vy} ${vw} ${vh}`} accessibilityLabel={highlight ? `World map with one country highlighted` : "World map"}>
      <Rect x={vx - 5} y={vy - 5} width={vw + 10} height={vh + 10} fill={colors.ocean} />
      <Land />
      {hit && highlight && (
        <>
          <Path d={PATHS.find((p) => p.name === hit.name)?.d ?? hit.d} fill={colors.focus} stroke="#FFFFFF" strokeWidth={vw / 300 + 1.5} />
          <Circle cx={hit.cx} cy={hit.cy} r={r} fill="none" stroke="#FFFFFF" strokeWidth={r / 5} />
          <Circle cx={hit.cx} cy={hit.cy} r={r * 1.9} fill="none" stroke={colors.focus} strokeWidth={r / 6} opacity={0.7} />
        </>
      )}
    </Svg>
  );
}
