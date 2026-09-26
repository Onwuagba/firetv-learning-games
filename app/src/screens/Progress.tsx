import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { DefaultFocus, SpatialNavigationRoot, SpatialNavigationView } from "react-tv-space-navigation";
import { Focus, FocusButton } from "../components/Focusable";
import { Frame } from "../components/Frame";
import { Avatar } from "../components/Avatar";
import { TopicArt } from "../components/TopicArt";
import { colors, font, px, radius, topicColor } from "../theme";
import { getProfile, getSync, stats, store } from "../session";
import { useNav } from "../navContext";
import { allBadges, bestStreak, dayStreak, topicRows } from "../../../src/motivation";
import { gameScreen } from "../../../src/nav";
import { STREAK_TO_LEVEL_UP } from "../../../src/games/quiz";

const Stat = ({ big, label }: { big: string; label: string }) => (
  <View style={styles.stat} accessible accessibilityLabel={`${label}: ${big}`}><Text style={styles.statBig}>{big}</Text><Text style={styles.statLabel}>{label}</Text></View>
);

/** Progress dashboard: totals, per-topic levels and accuracy (from the coach-synced progress), badges. Driven by the curriculum. */
export function Dashboard() {
  const nav = useNav();
  const p = getProfile(); const st = stats(); const today = store.today();
  const rows = topicRows(getSync().progress);
  const badges = allBadges(); const got = new Set(st.badges);
  const sorted = [...badges.filter((b) => got.has(b.id)), ...badges.filter((b) => !got.has(b.id))];
  const MAXB = 12; const shown = sorted.slice(0, MAXB);
  const dense = rows.length > 4;
  return (
    <Frame title="My progress" hint="OK: open    Back: home">
      <View style={styles.top}>
        <Avatar id={p?.avatar ?? "fox"} size={110} />
        <Text style={styles.name}>{p?.name ?? "Player"}</Text>
        <View style={{ flex: 1 }} />
        <Stat big={`🔥 ${dayStreak(st, today)}`} label={`day streak (best ${bestStreak(st)})`} />
        <Stat big={`⭐ ${st.stars}`} label="stars" />
        <Stat big={`${st.rounds}`} label="rounds played" />
      </View>
      <SpatialNavigationRoot>
        <SpatialNavigationView direction="vertical">
          {rows.length === 0 && <Text style={styles.empty}>No games yet.</Text>}
          {rows.map((r, i) => {
            const color = topicColor(r.topic, i);
            const row = (
              <Focus key={r.topic} onSelect={() => nav.go(gameScreen(r.topic))} label={`${r.title}: level ${r.level} of ${r.maxLevel}, ${r.accuracy === null ? "not played yet" : `${r.accuracy} percent right, ${r.correct} of ${r.attempts}`}. Press OK to play`}
                style={{ ...styles.topic, paddingVertical: px(dense ? 6 : 12) }}>
                {() => (
                  <View style={styles.topicRow}>
                    <TopicArt topic={r.topic} color={color} size={dense ? 52 : 72} />
                    <Text style={styles.topicName} numberOfLines={1}>{r.title}</Text>
                    <View style={styles.bar}>
                      {Array.from({ length: r.maxLevel }, (_, k) => <View key={k} style={[styles.seg, { backgroundColor: k < r.level ? color : "#2E416F" }]} />)}
                    </View>
                    <Text style={styles.lv}>Level {r.level}/{r.maxLevel}</Text>
                    <Text style={styles.acc}>{r.attempts ? `${r.accuracy}% right (${r.correct}/${r.attempts})` : "Not played yet"}</Text>
                  </View>
                )}
              </Focus>
            );
            return i === 0 ? <DefaultFocus key={r.topic}>{row}</DefaultFocus> : row;
          })}
        </SpatialNavigationView>
        <Text style={styles.sec}>Badges  {got.size}/{badges.length}   <Text style={styles.secSub}>Level up = {STREAK_TO_LEVEL_UP} right in a row</Text></Text>
        <View style={styles.badges}>
          {shown.map((b) => {
            const on = got.has(b.id);
            return (
              <View key={b.id} style={[styles.badge, !on && { opacity: 0.35 }]} accessible accessibilityLabel={`${b.title}. ${b.blurb}. ${on ? "Earned" : "Not earned yet"}`}>
                <Text style={styles.badgeEmoji}>{on ? b.emoji : "🔒"}</Text>
                <Text style={styles.badgeTitle}>{b.title}</Text>
              </View>
            );
          })}
          {sorted.length > MAXB && <Text style={styles.more}>+{sorted.length - MAXB} more</Text>}
        </View>
        <SpatialNavigationView direction="horizontal" style={{ justifyContent: "center", marginTop: px(10) }}>
          <FocusButton text="Home" onSelect={() => nav.back()} style={{ paddingVertical: px(12) }} />
        </SpatialNavigationView>
      </SpatialNavigationRoot>
    </Frame>
  );
}
const styles = StyleSheet.create({
  top: { flexDirection: "row", alignItems: "center", marginBottom: px(30) },
  name: { color: colors.text, fontSize: px(font.title), fontWeight: "900", marginLeft: px(24) },
  stat: { alignItems: "center", marginLeft: px(48) },
  statBig: { color: colors.text, fontSize: px(font.title - 6), fontWeight: "900" },
  statLabel: { color: colors.textDim, fontSize: px(font.small) },
  empty: { color: colors.textDim, fontSize: px(font.body) },
  topic: { marginBottom: px(10), paddingHorizontal: px(28) },
  topicRow: { flexDirection: "row", alignItems: "center" },
  topicName: { color: colors.text, fontSize: px(font.body), fontWeight: "800", width: px(470), marginLeft: px(20) },
  bar: { flexDirection: "row", width: px(330) },
  seg: { flex: 1, height: px(20), borderRadius: px(10), marginRight: px(6) },
  lv: { color: colors.text, fontSize: px(font.small + 2), fontWeight: "800", width: px(190), marginLeft: px(16) },
  acc: { color: colors.textDim, fontSize: px(font.small + 2), flex: 1 },
  sec: { color: colors.text, fontSize: px(font.body), fontWeight: "900", marginTop: px(8), marginBottom: px(8) },
  secSub: { color: colors.textDim, fontSize: px(font.small), fontWeight: "600" },
  badges: { flexDirection: "row", flexWrap: "wrap", alignItems: "center" },
  badge: { flexDirection: "row", alignItems: "center", backgroundColor: colors.card, borderRadius: px(radius.pill), paddingVertical: px(6), paddingHorizontal: px(20), marginRight: px(12), marginBottom: px(10) },
  badgeEmoji: { fontSize: px(font.body) },
  badgeTitle: { color: colors.text, fontSize: px(font.small - 2 + 2), fontWeight: "700", marginLeft: px(10) },
  more: { color: colors.textDim, fontSize: px(font.small) },
});
