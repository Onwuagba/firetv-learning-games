import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { DefaultFocus, SpatialNavigationRoot } from "react-tv-space-navigation";
import Svg, { G, Line, Path, Rect, Text as SText } from "react-native-svg";
import { Focus, FocusButton } from "../components/Focusable";
import { Frame } from "../components/Frame";
import { Confetti, Pop, useReduced } from "../motion";
import { colors, font, px, radius } from "../theme";
import { level as levelOf, record, STREAK_NEEDED, streakOf } from "../session";
import { useNav } from "../navContext";
import { audio } from "../audio";
import { debugQuestion } from "../debug";
import * as B from "../../../src/games/balance";
import { ROUND_LENGTH, answer as roundAnswer, isComplete, newRound, resultOf } from "../../../src/games/round";
import { topicTitle, type Topic } from "../../../src/curriculum";

const TOPIC = "algebra" as Topic;
type Block = { label: string; color: string; w: number };
/** x-blocks: up to 3 drawn separately, more collapse into one "a x guess" block so a pan never overflows. */
function xBlocks(count: number, guess: number, color: string): Block[] {
  if (count <= 0) return [];
  return count <= 3 ? Array.from({ length: count }, () => ({ label: `${guess}`, color, w: 56 })) : [{ label: `${count}×${guess}`, color, w: 120 }];
}
const unitBlock = (n: number, color: string): Block[] => (n ? [{ label: `${n}`, color, w: 56 }] : []);

/** Scales drawing: the beam rotates by tiltDegrees (positive = left pan down) and eases between guesses. */
const Scales = React.memo(function Scales({ eq, guess, balanced }: { eq: B.Equation; guess: number; balanced: boolean }) {
  const target = B.tiltDegrees(eq, guess);
  const reduced = useReduced();
  const [deg, setDeg] = useState(target);
  const anim = useRef(new Animated.Value(target)).current;
  useEffect(() => { // ease the beam toward the new angle (JS-driven: SVG geometry is recomputed from the animated value)
    if (reduced) { anim.setValue(target); setDeg(target); return; }
    const id = anim.addListener(({ value }) => setDeg(value));
    Animated.timing(anim, { toValue: target, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => anim.removeListener(id);
  }, [target, reduced, anim]);
  const half = 150, rad = (-deg * Math.PI) / 180;
  const lx = 250 - half * Math.cos(rad), ly = 90 - half * Math.sin(rad);
  const rx = 250 + half * Math.cos(rad), ry = 90 + half * Math.sin(rad);
  const pan = (cx: number, cy: number, blocks: Block[]) => {
    const total = blocks.reduce((n, b) => n + b.w + 6, 0); let x0 = cx - total / 2 + 3;
    return (
      <G>
        <Line x1={cx} y1={cy} x2={cx - 100} y2={cy + 90} stroke={colors.textDim} strokeWidth={3} />
        <Line x1={cx} y1={cy} x2={cx + 100} y2={cy + 90} stroke={colors.textDim} strokeWidth={3} />
        <Path d={`M${cx - 130} ${cy + 90} H${cx + 130} Q${cx + 118} ${cy + 125} ${cx} ${cy + 125} Q${cx - 118} ${cy + 125} ${cx - 130} ${cy + 90} Z`} fill={colors.textDim} />
        {blocks.map((b, i) => {
          const x = x0; x0 += b.w + 6;
          return (
            <G key={i}>
              <Rect x={x} y={cy + 90 - 56} width={b.w} height={56} rx={8} fill={b.color} />
              <SText x={x + b.w / 2} y={cy + 90 - 18} fontSize={b.label.length > 3 ? 24 : 30} fontWeight="bold" fill={colors.ink} textAnchor="middle" fontFamily="sans-serif">{b.label}</SText>
            </G>
          );
        })}
      </G>
    );
  };
  const left = [...xBlocks(eq.a, guess, colors.abacus), ...unitBlock(eq.b, colors.tens)];
  const right = [...xBlocks(eq.r ?? 0, guess, colors.abacus), ...unitBlock(eq.c, colors.hundreds)];
  return (
    <Svg width={px(930)} height={px(470)} viewBox="-40 0 580 280" accessibilityLabel={balanced ? "Scales are balanced" : deg > 0 ? "Left side is heavier" : "Right side is heavier"}>
      <Rect x={244} y={90} width={12} height={150} fill={colors.textDim} />
      <Rect x={190} y={236} width={120} height={14} rx={6} fill={colors.textDim} />
      <Line x1={lx} y1={ly} x2={rx} y2={ry} stroke={balanced ? colors.right : colors.text} strokeWidth={10} strokeLinecap="round" />
      {pan(lx, ly, left)}
      {pan(rx, ry, right)}
    </Svg>
  );
});

const make = (index: number) => {
  const l = levelOf(TOPIC);
  return B.newBalance(l, Math.random, B.levelIsTop(l) && index % 2 === 1); // top level alternates in "x on both sides" puzzles
};

export function Balance() {
  const nav = useNav();
  const [round, setRound] = useState(() => newRound("algebra", 1));
  const [s, setS] = useState(() => make(0));
  const [lvlUp, setLvlUp] = useState(false);
  const [level0, setLevel0] = useState(() => levelOf(TOPIC));
  // The dial is the only focusable element while playing; every arrow reaches the Root as "handled without movement".
  const onEdge = useCallback((d: string) => {
    if (d === "up" || d === "down" || d === "left" || d === "right") setS((p) => B.adjust(p, d));
  }, []);
  useEffect(() => debugQuestion({ answer: s.question.answer, prompt: s.question.prompt }), [s.question]);
  const check = () => { // OK = Check. Only a balanced scale solves it; a miss breaks the in-a-row count.
    if (s.solved) return;
    const n = B.check(s);
    setS(n);
    if (n.solved) {
      const before = levelOf(TOPIC);
      record(TOPIC, level0, true);
      const up = levelOf(TOPIC) > before;
      setLvlUp(up); setRound((r) => roundAnswer(r, n.attempts === 1, up));
      audio.play(up ? "levelup" : "correct");
    } else { record(TOPIC, level0, false); audio.play("wrong"); }
  };
  const last = isComplete(round);
  const next = () => { if (last) { nav.showResult(resultOf(round, topicTitle(TOPIC))); return; } setLvlUp(false); setLevel0(levelOf(TOPIC)); setS(make(round.answered)); };
  const d = B.imbalance(s.eq, s.guess);
  const big = s.max > 20;
  return (
    <Frame title={topicTitle(TOPIC)} level={level0} streak={streakOf(TOPIC)} need={STREAK_NEEDED}
      right={<Text style={styles.count}>{Math.min(round.answered + (s.solved ? 0 : 1), round.total)} / {ROUND_LENGTH}</Text>}
      hint={s.solved ? "OK: continue" : `Up/Down: x ± 1${big ? "    Left/Right: x ± 5" : "    Left/Right: x ± 1"}    OK: check    Back: home`}>
      {lvlUp && <Confetti />}
      <View style={styles.row}>
        <Scales eq={s.eq} guess={s.guess} balanced={d === 0} />
        <View style={styles.side}>
          <Text style={styles.eq} accessibilityLiveRegion="polite" accessibilityLabel={`Equation ${s.question.prompt}`}>{s.question.prompt}</Text>
          {s.hard && <Text style={styles.tag}>Challenge: x on both sides</Text>}
          <SpatialNavigationRoot key={s.solved ? "r" : "p"} onDirectionHandledWithoutMovement={onEdge}>
            {s.solved ? (
              <View>
                <Pop><Text style={[styles.verdict, { color: colors.right }]}>{lvlUp ? "Balanced! Level up! 🎉" : `Balanced! x = ${s.guess}`}</Text></Pop>
                <DefaultFocus><FocusButton text={last ? "See results" : "Next"} primary onSelect={next} style={{ marginTop: px(20) }} /></DefaultFocus>
              </View>
            ) : (
              <DefaultFocus>
                <Focus onSelect={check} label={`x equals ${s.guess}. Arrows change x. Press OK to check`} style={styles.dial}>
                  {() => (
                    <View style={{ alignItems: "center" }}>
                      <Text style={styles.dialLabel}>x =</Text>
                      <Text style={styles.dialValue}>{s.guess}</Text>
                      <Text style={styles.arrows}>▲ ▼</Text>
                      <View style={styles.checkPill}><Text style={styles.checkText}>OK: Check ✓</Text></View>
                    </View>
                  )}
                </Focus>
              </DefaultFocus>
            )}
          </SpatialNavigationRoot>
          {!s.solved && (
            <Text style={[styles.hintLine, s.missed && { color: colors.wrong }]} accessibilityLiveRegion="polite">
              {s.missed ? (d > 0 ? "Not balanced yet: left is still heavier" : "Not balanced yet: right is still heavier") : d === 0 ? "Looks level. Press OK to check!" : d > 0 ? "Left side is heavier" : "Right side is heavier"}
            </Text>
          )}
        </View>
      </View>
    </Frame>
  );
}
const styles = StyleSheet.create({
  count: { color: colors.textDim, fontSize: px(font.body), fontWeight: "800" },
  row: { flexDirection: "row", alignItems: "center" },
  side: { flex: 1, marginLeft: px(24) },
  eq: { color: colors.text, fontSize: px(font.title), fontWeight: "900", marginBottom: px(30) },
  tag: { color: colors.accent, fontSize: px(font.small + 2), fontWeight: "800", marginBottom: px(10) },
  dial: { width: px(400), paddingVertical: px(18), alignItems: "center" },
  dialLabel: { color: colors.textDim, fontSize: px(font.body) },
  dialValue: { color: colors.text, fontSize: px(140), fontWeight: "900", lineHeight: px(150) },
  arrows: { color: colors.focus, fontSize: px(font.body), letterSpacing: 8 },
  checkPill: { marginTop: px(12), backgroundColor: colors.focus, borderRadius: px(radius.pill), paddingHorizontal: px(28), paddingVertical: px(6) },
  checkText: { color: colors.ink, fontSize: px(font.small + 2), fontWeight: "900" },
  verdict: { fontSize: px(font.title - 8), fontWeight: "900", marginTop: px(16) },
  hintLine: { color: colors.textDim, fontSize: px(font.body - 4), marginTop: px(20), fontWeight: "700" },
});
