import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import { MAP_COUNTRIES, MAP_H, MAP_W } from "../mapData";
import { colors } from "../theme";

export type MapRegion = "world" | "africa";
const VIEW: Record<MapRegion, [number, number, number, number]> = {
  world: [0, 0, MAP_W, MAP_H],
  africa: [532, 152, 512, 360], // lon -47..81, lat -42..46: Africa centred, 1.42:1 like the map card
};
// Names in the curriculum that differ from the Natural Earth spelling.
const ALIAS: Record<string, string> = {};

/** Offline vector map (Natural Earth 110m, see scripts/gen-map.mjs). Highlights one country plus a marker so small ones still read. */
export function MapView({ target, region, width }: { target: string; region: MapRegion; width: number }) {
  const name = ALIAS[target] ?? target;
  const hit = MAP_COUNTRIES.find((c) => c.name === name);
  const [vx, vy, vw, vh] = VIEW[region];
  const height = (width * vh) / vw;
  const r = region === "world" ? 22 : 12;
  return (
    <Svg width={width} height={height} viewBox={`${vx} ${vy} ${vw} ${vh}`} accessibilityLabel={`Map highlighting ${target}`}>
      <Rect x={vx} y={vy} width={vw} height={vh} fill={colors.ocean} />
      {MAP_COUNTRIES.filter((c) => c.name !== name).map((c) => (
        <Path key={c.name} d={c.d} fill={colors.land} stroke={colors.ocean} strokeWidth={1.5} />
      ))}
      {hit && (
        <>
          <Path d={hit.d} fill={colors.focus} stroke="#FFFFFF" strokeWidth={3} />
          <Circle cx={hit.cx} cy={hit.cy} r={r} fill="none" stroke="#FFFFFF" strokeWidth={5} />
          <Circle cx={hit.cx} cy={hit.cy} r={r * 1.9} fill="none" stroke={colors.focus} strokeWidth={4} opacity={0.7} />
        </>
      )}
    </Svg>
  );
}

/** "Which continent is X in?" / "Capital of X?" -> X. The curriculum question carries no separate country field. */
export function targetCountry(prompt: string): string {
  return (/^Which continent is (.+) in\?$/.exec(prompt) ?? /^Capital of (.+)\?$/.exec(prompt))?.[1] ?? "";
}
