import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { DefaultFocus, SpatialNavigationRoot, SpatialNavigationView } from "react-tv-space-navigation";
import Svg, { Circle, Line, Rect, Path } from "react-native-svg";
import { Focus } from "../components/Focusable";
import { Frame } from "../components/Frame";
import { colors, px, font, tileColors } from "../theme";
import { sync } from "../session";
import type { Screen } from "../../../src/nav";

export const TILES: { screen: Exclude<Screen, "home">; title: string; sub: string }[] = [
  { screen: "abacus", title: "Abacus", sub: "Slide the beads" },
  { screen: "geography", title: "Map Quiz", sub: "Find the country" },
  { screen: "algebra", title: "Balance Scales", sub: "Find x" },
];

function Art({ kind }: { kind: Screen }) {
  const c = tileColors[kind as keyof typeof tileColors]; const s = px(200);
  return (
    <Svg width={s} height={s} viewBox="0 0 100 100">
      {kind === "abacus" && <>
        <Rect x="8" y="10" width="84" height="80" rx="8" fill="none" stroke={c} strokeWidth="5" />
        {[30, 50, 70].map((y, i) => <Line key={y} x1="8" x2="92" y1={y} y2={y} stroke={c} strokeWidth="2" />)}
        {[[20, 32, 44], [24, 36], [16, 28, 40, 52]].map((row, i) => row.map((x) => <Circle key={`${i}-${x}`} cx={x + 4} cy={30 + i * 20} r="7" fill={c} />))}
      </>}
      {kind === "geography" && <>
        <Circle cx="50" cy="50" r="40" fill="none" stroke={c} strokeWidth="5" />
        <Path d="M50 10 C30 30 30 70 50 90 M50 10 C70 30 70 70 50 90 M10 50 H90 M16 30 H84 M16 70 H84" fill="none" stroke={c} strokeWidth="3" />
      </>}
      {kind === "algebra" && <>
        <Line x1="50" y1="20" x2="50" y2="86" stroke={c} strokeWidth="5" />
        <Line x1="14" y1="34" x2="86" y2="26" stroke={c} strokeWidth="6" strokeLinecap="round" />
        <Path d="M4 60 Q18 76 32 60 Z M68 54 Q82 70 96 54 Z" fill={c} />
        <Line x1="34" y1="88" x2="66" y2="88" stroke={c} strokeWidth="6" strokeLinecap="round" />
      </>}
    </Svg>
  );
}

export function Home({ onOpen, initial }: { onOpen: (s: Exclude<Screen, "home">) => void; initial: Screen }) {
  return (
    <Frame title="Learn & Play" hint="Arrows: choose    OK: start    Back: exit">
      <SpatialNavigationRoot>
        <SpatialNavigationView direction="horizontal" style={styles.row}>
          {TILES.map((t) => {
            const p = sync.progress[t.screen];
            const tile = (
              <Focus key={t.screen} onSelect={() => onOpen(t.screen)} style={styles.tile}>
                {() => (
                  <View style={styles.tileInner} accessible accessibilityLabel={`${t.title}. ${t.sub}. Level ${sync.currentLevel(t.screen)}`}>
                    <Art kind={t.screen} />
                    <Text style={styles.tileTitle}>{t.title}</Text>
                    <Text style={styles.tileSub}>{t.sub}</Text>
                    <View style={[styles.badge, { backgroundColor: tileColors[t.screen] }]}>
                      <Text style={styles.badgeText}>Level {sync.currentLevel(t.screen)}{p ? `  ·  ${p.correct}/${p.attempts} right` : ""}</Text>
                    </View>
                  </View>
                )}
              </Focus>
            );
            return t.screen === (initial === "home" ? "abacus" : initial) ? <DefaultFocus key={t.screen}>{tile}</DefaultFocus> : tile;
          })}
        </SpatialNavigationView>
      </SpatialNavigationRoot>
    </Frame>
  );
}

const styles = StyleSheet.create({
  row: { justifyContent: "space-between", paddingHorizontal: px(24) },
  tile: { width: px(520), height: px(640), backgroundColor: colors.card },
  tileInner: { flex: 1, alignItems: "center", justifyContent: "center", padding: px(24) },
  tileTitle: { color: colors.text, fontSize: px(font.title), fontWeight: "900", marginTop: px(16), textAlign: "center" },
  tileSub: { color: colors.textDim, fontSize: px(font.body), marginTop: px(8), textAlign: "center" },
  badge: { marginTop: px(28), borderRadius: px(40), paddingHorizontal: px(28), paddingVertical: px(10) },
  badgeText: { color: colors.ink, fontSize: px(font.small + 2), fontWeight: "800" },
});
