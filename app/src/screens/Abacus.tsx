import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { DefaultFocus, SpatialNavigationRoot, SpatialNavigationView } from "react-tv-space-navigation";
import { Focus, FocusButton } from "../components/Focusable";
import { Frame } from "../components/Frame";
import { Confetti, Pop } from "../motion";
import { colors, font, px } from "../theme";
import { level as levelOf, record, STREAK_NEEDED, streakOf } from "../session";
import { useNav } from "../navContext";
import { audio } from "../audio";
import { debugQuestion } from "../debug";
import * as A from "../../../src/games/abacus";
import { ROUND_LENGTH, answer as roundAnswer, isComplete, newRound, resultOf } from "../../../src/games/round";
import { topicTitle, type Topic } from "../../../src/curriculum";

const ROD_COLORS = [colors.abacus, colors.tens, colors.hundreds];
const ROD_NAMES = ["Ones", "Tens", "Hundreds"];
const TOPIC = "abacus" as Topic;
// Rods, max value and prompts come from the curriculum level (A.abacusQuestion); odd rounds from level 2 use target mode ("Make 47").
const make = (level: number, index: number) => {
  const aq = A.abacusQuestion(level, index);
  return { level, aq, ab: A.newAbacus(aq.rods), result: null as null | boolean };
};

/** One rod: 9 beads; the first `value` are slid to the active (top) end. */
const Rod = React.memo(function Rod({ value, color, focused }: { value: number; color: string; focused: boolean }) {
  return (
    <View style={styles.rodWrap}>
      <View style={[styles.wire, focused && { backgroundColor: colors.focus }]} />
      <View style={styles.beads}>
        <View>{Array.from({ length: value }, (_, i) => <View key={i} style={[styles.bead, { backgroundColor: color }]} />)}</View>
        <View style={{ flex: 1 }} />
        <View>{Array.from({ length: 9 - value }, (_, i) => <View key={i} style={[styles.bead, styles.beadOff]} />)}</View>
      </View>
    </View>
  );
});

export function Abacus() {
  const nav = useNav();
  const [round, setRound] = useState(() => newRound("abacus", 1));
  const [s, setS] = useState(() => make(levelOf(TOPIC), 0));
  const [lvlUp, setLvlUp] = useState(false);
  // Up/Down reach the Root only when focus cannot move vertically -> they slide beads on the focused rod.
  const onEdge = useCallback((d: string) => {
    if (d === "up" || d === "down") setS((p) => (p.result === null ? { ...p, ab: A.press(p.ab, d) } : p));
  }, []);
  useEffect(() => debugQuestion({ answer: s.aq.answer, prompt: s.aq.prompt }), [s.aq]);
  const check = () => {
    if (s.result !== null) return;
    const ok = A.isCorrect(s.ab, s.aq.answer);
    const before = levelOf(TOPIC);
    record(TOPIC, s.level, ok);
    const up = ok && levelOf(TOPIC) > before;
    setLvlUp(up); setRound((r) => roundAnswer(r, ok, up)); setS({ ...s, result: ok });
    audio.play(up ? "levelup" : ok ? "correct" : "wrong");
  };
  const last = isComplete(round);
  const next = () => { if (last) { nav.showResult(resultOf(round, topicTitle(TOPIC))); return; } setLvlUp(false); setS(make(levelOf(TOPIC), round.answered)); };
  const total = A.value(s.ab);
  const done = s.result !== null;
  const isSum = s.aq.mode === "sum" && /[+−]/.test(s.aq.prompt);
  return (
    <Frame title={topicTitle(TOPIC)} level={s.level} streak={streakOf(TOPIC)} need={STREAK_NEEDED}
      right={<Text style={styles.count}>{Math.min(round.answered + (done ? 0 : 1), round.total)} / {ROUND_LENGTH}</Text>}
      hint={done ? "OK: continue" : "Left/Right: pick rod    Up/Down: slide beads    OK: check    Back: home"}>
      {lvlUp && <Confetti />}
      <Text style={styles.prompt} accessibilityLiveRegion="polite">{s.aq.prompt}{isSum ? " = ?" : ""}</Text>
      <SpatialNavigationRoot key={done ? "result" : `play-${round.answered}`} onDirectionHandledWithoutMovement={onEdge}>
        <View style={styles.board}>
          <SpatialNavigationView direction="horizontal" style={styles.rods}>
            {[...s.ab.rods.keys()].reverse().map((i) => {
              const rod = (
                <Focus key={i} onSelect={check} onFocus={() => setS((p) => ({ ...p, ab: { ...p.ab, cursor: i } }))} label={`${ROD_NAMES[i]} rod, ${s.ab.rods[i]} beads. Up and down slide beads`} style={styles.rodCard}>
                  {(f) => (
                    <View style={{ alignItems: "center" }}>
                      <Text style={[styles.rodName, f && { color: colors.focus }]}>{ROD_NAMES[i]}</Text>
                      <Rod value={s.ab.rods[i]} color={ROD_COLORS[i]} focused={f} />
                      <Text style={[styles.digit, { color: ROD_COLORS[i] }]}>{s.ab.rods[i]}</Text>
                    </View>
                  )}
                </Focus>
              );
              return i === 0 && !done ? <DefaultFocus key={i}>{rod}</DefaultFocus> : rod;
            })}
            {!done && <FocusButton text="Check" primary onSelect={check} style={{ alignSelf: "center", marginLeft: px(40) }} />}
          </SpatialNavigationView>
          <View style={styles.side}>
            <Text style={styles.totalLabel}>You made</Text>
            <Text style={styles.total} accessibilityLabel={`You made ${total}`}>{total}</Text>
            {done && (
              <View accessibilityLiveRegion="polite">
                <Pop key={round.answered}><Text style={[styles.verdict, { color: s.result ? colors.right : colors.wrong }]}>{s.result ? (lvlUp ? "Level up! 🎉" : "Correct!") : `Answer: ${s.aq.answer}`}</Text></Pop>
                <DefaultFocus><FocusButton text={last ? "See results" : "Next"} primary onSelect={next} style={{ marginTop: px(24) }} /></DefaultFocus>
              </View>
            )}
          </View>
        </View>
      </SpatialNavigationRoot>
    </Frame>
  );
}
const BEAD = 34;
const styles = StyleSheet.create({
  count: { color: colors.textDim, fontSize: px(font.body), fontWeight: "800" },
  prompt: { color: colors.text, fontSize: px(font.prompt), fontWeight: "900", textAlign: "center", marginBottom: px(44) },
  board: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  rods: { alignItems: "center" },
  rodCard: { width: px(260), paddingVertical: px(16), marginRight: px(28) },
  rodName: { color: colors.textDim, fontSize: px(font.small + 4), fontWeight: "800", marginBottom: px(8) },
  rodWrap: { width: px(200), height: px(9 * BEAD + 130), alignItems: "center" },
  wire: { position: "absolute", top: 0, bottom: 0, width: px(8), backgroundColor: colors.textDim, borderRadius: px(4) },
  beads: { flex: 1, alignSelf: "stretch", alignItems: "center", justifyContent: "space-between" },
  bead: { width: px(150), height: px(BEAD - 4), borderRadius: px(BEAD / 2), marginVertical: px(2) },
  beadOff: { backgroundColor: "#2E416F", opacity: 0.85 },
  digit: { fontSize: px(font.title), fontWeight: "900", marginTop: px(4) },
  side: { width: px(420), marginLeft: px(24) },
  totalLabel: { color: colors.textDim, fontSize: px(font.body) },
  total: { color: colors.text, fontSize: px(140), fontWeight: "900" },
  verdict: { fontSize: px(font.title), fontWeight: "900", marginTop: px(8) },
});
