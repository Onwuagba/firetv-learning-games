import React, { useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { DefaultFocus, SpatialNavigationRoot, SpatialNavigationView } from "react-tv-space-navigation";
import { Focus, FocusButton } from "../components/Focusable";
import { Frame } from "../components/Frame";
import { MapView, targetCountry } from "../components/MapView";
import { colors, px, font } from "../theme";
import { record, STREAK_NEEDED, streakOf, sync } from "../session";
import * as Q from "../../../src/games/quiz";
import curriculum from "../../../src/curriculum.json";

const region = (level: number) => (curriculum.topics.geography.levels[level - 1] as { region: string }).region === "africa" ? "africa" : "world";

export function MapQuiz() {
  const [s, setS] = useState(() => Q.newQuiz("geography", sync.currentLevel("geography")));
  const [, bump] = useState(0);
  const done = s.picked !== null;
  const choose = (i: number) => {
    if (done) return;
    const n = Q.submit({ ...s, focus: i });
    record("geography", s.level, Q.isCorrect(n)); bump((x) => x + 1);
    setS(n);
  };
  const next = () => {
    const n = Q.next(s); const lv = sync.currentLevel("geography");
    setS(lv !== n.level ? Q.newQuiz("geography", lv) : n); // sync is the single source of truth for level
  };
  const ok = Q.isCorrect(s);
  const rows = [s.question.choices.slice(0, 2), s.question.choices.slice(2, 4)];
  const country = targetCountry(s.question.prompt);

  return (
    <Frame title="Map Quiz" level={s.level} streak={streakOf("geography")} need={STREAK_NEEDED}
      hint={done ? "OK: next question" : "Arrows: choose    OK: answer    Back: home"}>
      <View style={styles.row}>
        <View style={styles.map}><MapView target={country} region={region(s.level)} width={px(880)} /></View>
        <View style={styles.right}>
          <Text style={styles.prompt} accessibilityLiveRegion="polite">{s.question.prompt}</Text>
          <SpatialNavigationRoot key={done ? "result" : "play"}>
            <SpatialNavigationView direction="vertical">
              {rows.map((row, r) => (
                <SpatialNavigationView key={r} direction="horizontal" style={styles.choiceRow}>
                  {row.map((c, j) => {
                    const i = r * 2 + j;
                    const state = done ? (c === s.question.answer ? "right" : i === s.picked ? "wrong" : "dim") : "";
                    const node = (
                      <Focus key={c} onSelect={() => choose(i)} style={{ ...styles.choice, ...(state === "right" ? styles.right_ : state === "wrong" ? styles.wrong_ : state === "dim" ? styles.dim : {}) }}>
                        {(f) => <Text style={[styles.choiceText, (f || state === "right" || state === "wrong") && { color: state ? colors.ink : colors.text }]}>{c}</Text>}
                      </Focus>
                    );
                    return i === 0 && !done ? <DefaultFocus key={c}>{node}</DefaultFocus> : node;
                  })}
                </SpatialNavigationView>
              ))}
            </SpatialNavigationView>
            {done && (
              <View style={{ marginTop: px(24), flexDirection: "row", alignItems: "center" }} accessibilityLiveRegion="polite">
                <DefaultFocus><FocusButton text="Next" onSelect={next} /></DefaultFocus>
                <Text style={[styles.verdict, { color: ok ? colors.right : colors.wrong }]}>{ok ? (s.leveledUp ? "Level up!" : "Correct!") : `It's ${s.question.answer}`}</Text>
              </View>
            )}
          </SpatialNavigationRoot>
        </View>
      </View>
    </Frame>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  map: { alignSelf: "center", borderRadius: px(28), overflow: "hidden", borderWidth: px(4), borderColor: colors.card },
  right: { flex: 1, marginLeft: px(48) },
  prompt: { color: colors.text, fontSize: px(font.title), fontWeight: "900", marginBottom: px(28) },
  choiceRow: { marginBottom: px(24) },
  choice: { width: px(400), height: px(150), justifyContent: "center", alignItems: "center", marginRight: px(24) },
  choiceText: { color: colors.text, fontSize: px(font.body + 6), fontWeight: "800", textAlign: "center" },
  right_: { backgroundColor: colors.right }, wrong_: { backgroundColor: colors.wrong }, dim: { opacity: 0.4 },
  verdict: { fontSize: px(font.title - 8), fontWeight: "900", marginLeft: px(32) },
});
