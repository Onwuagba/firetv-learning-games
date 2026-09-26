import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { DefaultFocus, SpatialNavigationRoot, SpatialNavigationView } from "react-tv-space-navigation";
import { Focus } from "../components/Focusable";
import { Frame } from "../components/Frame";
import { TopicArt } from "../components/TopicArt";
import { colors, font, px, topicColor } from "../theme";
import { getSync } from "../session";
import { useNav } from "../navContext";
import { topicRows } from "../../../src/motivation";
import { gameScreen } from "../../../src/nav";

/** Level map: a path of stops per topic (done / you are here / locked). Levels come from the curriculum, so it grows with it. */
export function LevelMap() {
  const nav = useNav();
  const rows = topicRows(getSync().progress);
  const dense = rows.length > 4;
  return (
    <Frame title="Level map" hint="OK: play this topic    Back: home">
      <SpatialNavigationRoot>
        <SpatialNavigationView direction="vertical">
          {rows.map((r, i) => {
            const color = topicColor(r.topic, i);
            const row = (
              <Focus key={r.topic} onSelect={() => nav.go(gameScreen(r.topic))} label={`${r.title}. You are on level ${r.level} of ${r.maxLevel}. Press OK to play`} style={{ ...styles.row, paddingVertical: px(dense ? 8 : 18) }}>
                {() => (
                  <View style={styles.inner}>
                    <View style={styles.head}><TopicArt topic={r.topic} color={color} size={dense ? 60 : 84} /><Text style={styles.title} numberOfLines={2}>{r.title}</Text></View>
                    <View style={styles.path}>
                      <View style={[styles.line, { backgroundColor: "#2E416F" }]} />
                      {Array.from({ length: r.maxLevel }, (_, k) => {
                        const lv = k + 1; const state = lv < r.level ? "done" : lv === r.level ? "here" : "locked";
                        return (
                          <View key={lv} style={styles.stopWrap} accessibilityLabel={`Level ${lv}, ${state === "done" ? "finished" : state === "here" ? "you are here" : "locked"}`}>
                            <View style={[styles.stop, state === "done" && { backgroundColor: color, borderColor: color }, state === "here" && { backgroundColor: colors.focus, borderColor: "#FFF", transform: [{ scale: 1.25 }] }, state === "locked" && { backgroundColor: colors.cardDim, borderColor: "#3A4E85" }]}>
                              <Text style={[styles.stopText, state === "locked" && { color: "#6E7FB0" }]}>{state === "done" ? "✓" : state === "locked" ? "🔒" : lv}</Text>
                            </View>
                            <Text style={[styles.here, state !== "here" && { opacity: 0 }]}>You are here</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </Focus>
            );
            return i === 0 ? <DefaultFocus key={r.topic}>{row}</DefaultFocus> : row;
          })}
        </SpatialNavigationView>
      </SpatialNavigationRoot>
    </Frame>
  );
}
const styles = StyleSheet.create({
  row: { marginBottom: px(16), paddingHorizontal: px(32) },
  inner: { flexDirection: "row", alignItems: "center" },
  head: { flexDirection: "row", alignItems: "center", width: px(520) },
  title: { color: colors.text, fontSize: px(font.body + 2), fontWeight: "900", marginLeft: px(24), flex: 1 },
  path: { flex: 1, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: px(20) },
  line: { position: "absolute", left: px(50), right: px(50), height: px(8), borderRadius: px(4), top: px(34) },
  stopWrap: { alignItems: "center", width: px(110) },
  stop: { width: px(72), height: px(72), borderRadius: px(36), borderWidth: px(5), alignItems: "center", justifyContent: "center" },
  stopText: { color: colors.ink, fontSize: px(font.body - 6), fontWeight: "900" },
  here: { color: colors.focus, fontSize: px(font.small - 4), fontWeight: "800", marginTop: px(8), width: px(150), textAlign: "center" },
});
