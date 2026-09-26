import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { DefaultFocus, SpatialNavigationRoot, SpatialNavigationView } from "react-tv-space-navigation";
import { FocusButton } from "../components/Focusable";
import { Frame } from "../components/Frame";
import { Stars } from "../components/Stars";
import { Confetti, FadeIn, Pop } from "../motion";
import { colors, font, px, radius } from "../theme";
import { useNav } from "../navContext";
import { audio } from "../audio";
import { getProfile, stats, store } from "../session";
import { gameScreen } from "../../../src/nav";
import { dayStreak, type Badge } from "../../../src/motivation";
import type { RoundResult } from "../../../src/games/round";

const MESSAGE = ["Good try! Practice makes progress.", "Nice work!", "Great job!", "Perfect round! Superstar!"];

/** End-of-round summary: stars, score, level-up, new badges, day streak. */
export function Results({ result, fresh }: { result: RoundResult; fresh: Badge[] }) {
  const nav = useNav();
  const streak = dayStreak(stats(), store.today());
  const name = getProfile()?.name;
  useEffect(() => {
    audio.play(result.leveledUp || result.stars === 3 ? "levelup" : result.stars ? "correct" : "back");
    const ts = Array.from({ length: result.stars }, (_, i) => setTimeout(() => audio.play("star"), 350 + i * 380));
    return () => ts.forEach(clearTimeout);
  }, [result]);
  const again = result.daily ? "daily" : gameScreen(result.topic);
  return (
    <Frame title={result.daily ? "Daily challenge" : result.title} hint="Arrows: choose    OK: select    Back: home">
      {(result.stars === 3 || result.leveledUp) && <Confetti count={32} />}
      <View style={styles.center}>
        <Stars count={result.stars} size={150} animate />
        <FadeIn delay={200}>
          <Text style={styles.score} accessibilityLiveRegion="polite">{result.correct} of {result.total} right</Text>
          <Text style={styles.msg}>{MESSAGE[result.stars]}{name && result.stars ? ` ${name}!` : ""}</Text>
        </FadeIn>
        <View style={styles.chips}>
          {result.leveledUp && <Pop delay={900}><View style={[styles.chip, { backgroundColor: colors.accent }]}><Text style={styles.chipText}>🚀 Level up!</Text></View></Pop>}
          {streak > 0 && <Pop delay={1000}><View style={[styles.chip, { backgroundColor: colors.tens }]}><Text style={styles.chipText}>🔥 {streak} day streak</Text></View></Pop>}
          {fresh.map((b, i) => <Pop key={b.id} delay={1100 + i * 250}><View style={[styles.chip, { backgroundColor: colors.focus }]} accessibilityLabel={`New badge: ${b.title}`}><Text style={styles.chipText}>{b.emoji} {b.title}</Text></View></Pop>)}
        </View>
        <SpatialNavigationRoot>
          <SpatialNavigationView direction="horizontal" style={{ marginTop: px(30) }}>
            <DefaultFocus><FocusButton text="Play again" primary onSelect={() => nav.replace(again)} style={{ marginRight: px(28) }} /></DefaultFocus>
            <FocusButton text="Home" onSelect={() => nav.back()} style={{ marginRight: px(28) }} />
            <FocusButton text="My progress" onSelect={() => nav.replace("dashboard")} />
          </SpatialNavigationView>
        </SpatialNavigationRoot>
      </View>
    </Frame>
  );
}
const styles = StyleSheet.create({
  center: { alignItems: "center" },
  score: { color: colors.text, fontSize: px(font.title + 8), fontWeight: "900", textAlign: "center", marginTop: px(8) },
  msg: { color: colors.textDim, fontSize: px(font.body), textAlign: "center", marginTop: px(6) },
  chips: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginTop: px(24), minHeight: px(70) },
  chip: { borderRadius: px(radius.pill), paddingHorizontal: px(30), paddingVertical: px(10), marginHorizontal: px(10), marginBottom: px(10) },
  chipText: { color: colors.ink, fontSize: px(font.body - 2), fontWeight: "900" },
});
