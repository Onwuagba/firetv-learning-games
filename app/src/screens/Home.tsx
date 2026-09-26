import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { DefaultFocus, SpatialNavigationRoot, SpatialNavigationView } from "react-tv-space-navigation";
import { Focus } from "../components/Focusable";
import { Avatar } from "../components/Avatar";
import { HeroScene } from "../components/HeroScene";
import { TopicArt } from "../components/TopicArt";
import { FadeIn } from "../motion";
import { colors, font, px, radius, safe, topicColor } from "../theme";
import { getProfile, level, stats, store } from "../session";
import { useNav } from "../navContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { playableTopics, topicTitle, maxLevel, type Topic } from "../../../src/curriculum";
import { DAILY_LENGTH } from "../../../src/daily";
import { dayStreak } from "../../../src/motivation";
import { gameScreen } from "../../../src/nav";
import { curriculum } from "../../../src/curriculum";

const SUBTITLES: Record<string, string> = { abacus: "Slide the beads", geography: "Maps and flags", algebra: "Find x" };
const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };
const W = 1920 - 2 * safe.h; // content width at 1080p

/** Home is generated from the curriculum: one tile per playable topic (rows wrap when there are many). */
export function Home({ initial }: { initial: string }) {
  const nav = useNav();
  const p = getProfile();
  const st = stats();
  const today = store.today();
  const streak = dayStreak(st, today);
  const dailyDone = st.dailyDone.includes(today);
  const topics = playableTopics();
  const perRow = topics.length <= 4 ? Math.max(topics.length, 1) : topics.length <= 8 ? Math.ceil(topics.length / 2) : 5;
  const rows: Topic[][] = []; for (let i = 0; i < topics.length; i += perRow) rows.push(topics.slice(i, i + perRow));
  const gap = 24, tileW = Math.floor((W - gap * (perRow - 1)) / perRow), compact = rows.length > 1;
  const tileH = compact ? (rows.length > 2 ? 150 : 200) : 400;
  const defaultTopic = topics.includes(initial as Topic) ? initial : topics[0];
  const sound = store.settings.sound;
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.inner}>
        <SpatialNavigationRoot>
          <SpatialNavigationView direction="vertical">
            <View style={styles.header}>
              <SpatialNavigationView direction="horizontal" style={{ flex: 1, alignItems: "center" }}>
                <Focus onSelect={() => nav.go("profiles")} label={`${p?.name ?? "Player"}. Change player`} style={styles.chip}>
                  {() => <View style={styles.chipInner}><Avatar id={p?.avatar ?? "fox"} size={64} /><Text style={styles.chipName} numberOfLines={1}>{p?.name ?? "Player"}</Text></View>}
                </Focus>
                <View style={styles.stat} accessibilityLabel={`${streak} day streak`}><Text style={styles.statText}>🔥 {streak}</Text><Text style={styles.statSub}>day{streak === 1 ? "" : "s"}</Text></View>
                <View style={styles.stat} accessibilityLabel={`${st.stars} stars`}><Text style={styles.statText}>⭐ {st.stars}</Text><Text style={styles.statSub}>stars</Text></View>
                <View style={{ flex: 1 }} />
                <Focus onSelect={() => store.updateSettings({ sound: !sound })} silent label={sound ? "Sound on. Press OK to mute" : "Sound off. Press OK to unmute"} style={styles.mute}>
                  {() => <Text style={styles.muteText}>{sound ? "🔊" : "🔇"}</Text>}
                </Focus>
              </SpatialNavigationView>
            </View>
            <View style={styles.heroWrap}>
              <View style={styles.hero}><HeroScene width={W} height={250} /></View>
              <View style={styles.heroContent}>
                <FadeIn>
                  <Text style={styles.hello} accessibilityRole="header">{greeting()}{p ? `, ${p.name}` : ""}!</Text>
                  <Text style={styles.helloSub}>{dailyDone ? "Daily challenge done. Play more to earn stars." : "Ready for today's challenge?"}</Text>
                </FadeIn>
                <Focus onSelect={() => nav.go("daily")} label={`Daily challenge. ${DAILY_LENGTH} questions${dailyDone ? ", completed today" : ""}`} style={styles.daily}>
                  {() => (
                    <View style={{ alignItems: "center" }}>
                      <Text style={styles.dailyTitle}>{dailyDone ? "✓ " : "📅 "}Daily challenge</Text>
                      <Text style={styles.dailySub}>{DAILY_LENGTH} mixed questions</Text>
                    </View>
                  )}
                </Focus>
              </View>
            </View>
            <SpatialNavigationView direction="vertical" style={{ marginTop: px(24) }}>
              {rows.map((row, r) => (
                <SpatialNavigationView key={r} direction="horizontal" style={{ marginBottom: px(gap) }}>
                  {row.map((t, i) => {
                    const idx = r * perRow + i; const color = topicColor(t, idx); const lv = level(t);
                    const tile = (
                      <Focus key={t} onSelect={() => nav.go(gameScreen(t))} label={`${topicTitle(t)}. ${SUBTITLES[t] ?? ""}. Level ${lv} of ${maxLevel(t)}`}
                        style={{ width: px(tileW), height: px(tileH), marginRight: i < row.length - 1 ? px(gap) : 0 }}>
                        {() => (
                          <View style={compact ? styles.tileRow : styles.tileCol}>
                            <TopicArt topic={t} color={color} size={compact ? tileH * 0.55 : 150} />
                            <View style={compact ? { marginLeft: px(20), flex: 1 } : { alignItems: "center" }}>
                              <Text style={[styles.tileTitle, compact && { fontSize: px(font.body + 2), textAlign: "left" }]} numberOfLines={2}>{topicTitle(t)}</Text>
                              {!compact && <Text style={styles.tileSub}>{SUBTITLES[t] ?? `Ages ${curriculum.topics[t].min_age ?? 5}+`}</Text>}
                              <View style={[styles.badge, { backgroundColor: color, alignSelf: compact ? "flex-start" : "center" }]}><Text style={styles.badgeText}>Level {lv}/{maxLevel(t)}</Text></View>
                            </View>
                          </View>
                        )}
                      </Focus>
                    );
                    return t === defaultTopic ? <DefaultFocus key={t}>{tile}</DefaultFocus> : tile;
                  })}
                </SpatialNavigationView>
              ))}
              {topics.length === 0 && <Text style={styles.helloSub}>No games available yet. Check the curriculum.</Text>}
            </SpatialNavigationView>
            <SpatialNavigationView direction="horizontal" style={{ justifyContent: "center" }}>
              {[["dashboard", "📊", "My progress"], ["levelmap", "🗺️", "Level map"], ["settings", "⚙️", "Settings"]].map(([s, icon, text]) => (
                <Focus key={s} onSelect={() => (s === "settings" ? nav.gated("settings") : nav.go(s))} label={s === "settings" ? "Settings, grown-ups only" : text} style={styles.action}>
                  {() => <Text style={styles.actionText}>{icon}  {text}</Text>}
                </Focus>
              ))}
            </SpatialNavigationView>
          </SpatialNavigationView>
        </SpatialNavigationRoot>
        <Text style={styles.hint}>Arrows: choose    OK: start    Back: exit</Text>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, paddingHorizontal: px(safe.h), paddingTop: px(safe.v - 20), paddingBottom: px(safe.v - 20) },
  header: { marginBottom: px(14) },
  chip: { paddingVertical: px(8), paddingHorizontal: px(20), borderRadius: px(60) },
  chipInner: { flexDirection: "row", alignItems: "center" },
  chipName: { color: colors.text, fontSize: px(font.body), fontWeight: "800", marginLeft: px(16), maxWidth: px(300) },
  stat: { flexDirection: "row", alignItems: "baseline", marginLeft: px(40) },
  statText: { color: colors.text, fontSize: px(font.body + 4), fontWeight: "900" },
  statSub: { color: colors.textDim, fontSize: px(font.small), marginLeft: px(8) },
  mute: { paddingVertical: px(8), paddingHorizontal: px(24), borderRadius: px(60) },
  muteText: { fontSize: px(font.body + 6) },
  heroWrap: { height: px(250), borderRadius: px(radius.card), overflow: "hidden" },
  hero: { ...StyleSheet.absoluteFillObject },
  heroContent: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: px(48) },
  hello: { color: colors.text, fontSize: px(font.title + 4), fontWeight: "900" },
  helloSub: { color: "#E3E8FF", fontSize: px(font.body - 2), marginTop: px(6) },
  daily: { width: px(520), paddingVertical: px(26), backgroundColor: colors.focus, borderColor: "#FFF3B0" },
  dailyTitle: { color: colors.ink, fontSize: px(font.body + 6), fontWeight: "900" },
  dailySub: { color: colors.ink, fontSize: px(font.small + 2), fontWeight: "700", marginTop: px(4) },
  tileCol: { flex: 1, alignItems: "center", justifyContent: "center", padding: px(16) },
  tileRow: { flex: 1, flexDirection: "row", alignItems: "center", paddingHorizontal: px(24) },
  tileTitle: { color: colors.text, fontSize: px(font.title - 14), fontWeight: "900", marginTop: px(8), textAlign: "center" },
  tileSub: { color: colors.textDim, fontSize: px(font.body - 6), marginTop: px(4), textAlign: "center" },
  badge: { marginTop: px(16), borderRadius: px(radius.pill), paddingHorizontal: px(26), paddingVertical: px(8), },
  badgeText: { color: colors.ink, fontSize: px(font.small + 2), fontWeight: "800" },
  action: { paddingVertical: px(18), paddingHorizontal: px(40), marginHorizontal: px(14), minWidth: px(420), alignItems: "center" },
  actionText: { color: colors.text, fontSize: px(font.body), fontWeight: "800" },
  hint: { color: colors.textDim, fontSize: px(font.hint), textAlign: "center", marginTop: px(10), paddingRight: px(360) },
});
