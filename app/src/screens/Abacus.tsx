import React, { useCallback, useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { DefaultFocus, SpatialNavigationRoot, SpatialNavigationView } from "react-tv-space-navigation";
import { Focus, FocusButton } from "../components/Focusable";
import { Frame } from "../components/Frame";
import { colors, px, font } from "../theme";
import { record, STREAK_NEEDED, streakOf, sync } from "../session";
import { makeQuestion } from "../../../src/curriculum";
import * as A from "../../../src/games/abacus";

const MAX_BY_LEVEL = [10, 10, 20, 20, 100]; // mirrors curriculum.json abacus levels (max per level)
const ROD_COLORS = [colors.abacus, colors.tens, colors.hundreds];
const ROD_NAMES = ["Ones", "Tens", "Hundreds"];

const make = (level: number) => {
  const q = makeQuestion("abacus", level);
  return { level, q, ab: A.newAbacus(A.rodCount(MAX_BY_LEVEL[level - 1] ?? 10)), result: null as null | boolean };
};

/** One rod: 9 beads; the first `value` are slid to the active (top) end. */
function Rod({ value, color, focused }: { value: number; color: string; focused: boolean }) {
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
}

export function Abacus() {
  const [s, setS] = useState(() => make(sync.currentLevel("abacus")));
  const [, bump] = useState(0);

  // Up/Down reach the Root only when focus cannot move vertically -> they slide beads on the focused rod.
  const onEdge = useCallback((d: string) => {
    if (d === "up" || d === "down") setS((p) => (p.result === null ? { ...p, ab: A.press(p.ab, d) } : p));
  }, []);
  const check = () => {
    if (s.result !== null) return;
    const ok = A.isCorrect(s.ab, s.q.answer);
    record("abacus", s.level, ok); bump((n) => n + 1);
    setS({ ...s, result: ok });
  };
  // Level comes from ProgressSync: same "2 correct in a row" rule (STREAK_TO_LEVEL_UP) as every other game.
  const next = () => setS(make(sync.currentLevel("abacus")));
  const total = A.value(s.ab);
  const isSum = /[+−]/.test(s.q.prompt);
  const done = s.result !== null;
  const lvlUp = done && s.result && sync.currentLevel("abacus") > s.level;

  return (
    <Frame title="Abacus" level={s.level} streak={streakOf("abacus")} need={STREAK_NEEDED}
      hint={done ? "OK: next question" : "Left/Right: pick rod    Up/Down: slide beads    OK: check    Back: home"}>
      <Text style={styles.prompt} accessibilityLiveRegion="polite">{s.q.prompt}{isSum ? " = ?" : ""}</Text>
      <SpatialNavigationRoot key={done ? "result" : "play"} onDirectionHandledWithoutMovement={onEdge}>
        <View style={styles.board}>
          <SpatialNavigationView direction="horizontal" style={styles.rods}>
            {[...s.ab.rods.keys()].reverse().map((i) => {
              const rod = (
                <Focus key={i} onSelect={check} onFocus={() => setS((p) => ({ ...p, ab: { ...p.ab, cursor: i } }))} style={styles.rodCard}>
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
            {!done && <FocusButton text="Check" onSelect={check} style={{ alignSelf: "center", marginLeft: px(40) }} />}
          </SpatialNavigationView>
          <View style={styles.side}>
            <Text style={styles.totalLabel}>You made</Text>
            <Text style={styles.total}>{total}</Text>
            {done && (
              <View accessibilityLiveRegion="polite">
                <Text style={[styles.verdict, { color: s.result ? colors.right : colors.wrong }]}>
                  {s.result ? (lvlUp ? "Level up! " : "Correct!") : `Answer: ${s.q.answer}`}
                </Text>
                <DefaultFocus><FocusButton text="Next" onSelect={next} style={{ marginTop: px(24) }} /></DefaultFocus>
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
  prompt: { color: colors.text, fontSize: px(font.prompt), fontWeight: "900", textAlign: "center", marginBottom: px(16) },
  board: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  rods: { alignItems: "stretch" },
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
