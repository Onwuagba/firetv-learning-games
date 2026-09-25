import React, { useCallback, useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { DefaultFocus, SpatialNavigationRoot } from "react-tv-space-navigation";
import Svg, { G, Line, Path, Rect, Text as SText } from "react-native-svg";
import { Focus, FocusButton } from "../components/Focusable";
import { Frame } from "../components/Frame";
import { colors, px, font } from "../theme";
import { record, STREAK_NEEDED, streakOf, sync } from "../session";
import * as B from "../../../src/games/balance";

/** Scales drawing: beam rotates by tiltDegrees (positive = left pan down). Blocks are labelled with their weight. */
function Scales({ s }: { s: B.BalanceState }) {
  const deg = B.tiltDegrees(s.eq, s.guess);
  const half = 150, rad = (-deg * Math.PI) / 180; // svg rotates clockwise; left-down = counter-clockwise
  const lx = 250 - half * Math.cos(rad), ly = 90 - half * Math.sin(rad);
  const rx = 250 + half * Math.cos(rad), ry = 90 + half * Math.sin(rad);
  const balanced = deg === 0;
  const pan = (cx: number, cy: number, blocks: { label: string; color: string }[]) => (
    <G>
      <Line x1={cx} y1={cy} x2={cx - 70} y2={cy + 90} stroke={colors.textDim} strokeWidth={3} />
      <Line x1={cx} y1={cy} x2={cx + 70} y2={cy + 90} stroke={colors.textDim} strokeWidth={3} />
      <Path d={`M${cx - 100} ${cy + 90} H${cx + 100} Q${cx + 90} ${cy + 125} ${cx} ${cy + 125} Q${cx - 90} ${cy + 125} ${cx - 100} ${cy + 90} Z`} fill={colors.textDim} />
      {blocks.map((b, i) => {
        const w = 62, x0 = cx - (blocks.length * (w + 6)) / 2 + 3 + i * (w + 6);
        return (
          <G key={i}>
            <Rect x={x0} y={cy + 90 - 56} width={w} height={56} rx={8} fill={b.color} />
            <SText x={x0 + w / 2} y={cy + 90 - 18} fontSize={30} fontWeight="bold" fill={colors.ink} textAnchor="middle" fontFamily="sans-serif">{b.label}</SText>
          </G>
        );
      })}
    </G>
  );
  const left = [...Array(s.eq.a)].map(() => ({ label: `${s.guess}`, color: colors.abacus }))
    .concat(s.eq.b ? [{ label: `${s.eq.b}`, color: colors.tens }] : []);
  return (
    <Svg width={px(960)} height={px(500)} viewBox="-10 0 520 270">
      <Rect x={244} y={90} width={12} height={150} fill={colors.textDim} />
      <Rect x={190} y={236} width={120} height={14} rx={6} fill={colors.textDim} />
      <Line x1={lx} y1={ly} x2={rx} y2={ry} stroke={balanced ? colors.right : colors.text} strokeWidth={10} strokeLinecap="round" />
      {pan(lx, ly, left)}
      {pan(rx, ry, [{ label: `${s.eq.c}`, color: colors.hundreds }])}
    </Svg>
  );
}

export function Balance() {
  const [s, setS] = useState(() => B.newBalance(sync.currentLevel("algebra")));
  const [, bump] = useState(0);
  const [miss, setMiss] = useState(false);

  // The dial is the only focusable element in play; every arrow reaches the Root as "handled without movement".
  const onEdge = useCallback((d: string) => {
    if (d === "up" || d === "down" || d === "left" || d === "right") {
      setMiss(false);
      setS((p) => {
        const n = B.adjust(p, d);
        if (n.solved && !p.solved) { record("algebra", p.question.level, true); bump((x) => x + 1); }
        return n;
      });
    }
  }, []);
  const weigh = () => { // OK on an unbalanced scale is a wrong attempt (breaks the streak)
    if (s.solved) return;
    setMiss(true); record("algebra", s.question.level, false); bump((x) => x + 1);
  };
  const next = () => { setMiss(false); setS(B.newBalance(sync.currentLevel("algebra"))); };
  const lvlUp = s.solved && sync.currentLevel("algebra") > s.question.level;
  const d = B.imbalance(s.eq, s.guess);

  return (
    <Frame title="Balance Scales" level={s.question.level} streak={streakOf("algebra")} need={STREAK_NEEDED}
      hint={s.solved ? "OK: next question" : "Up/Right: x + 1    Down/Left: x - 1    OK: weigh it    Back: home"}>
      <View style={styles.row}>
        <Scales s={s} />
        <View style={styles.side}>
          <Text style={styles.eq} accessibilityLiveRegion="polite">{s.question.prompt}</Text>
          <SpatialNavigationRoot key={s.solved ? "r" : "p"} onDirectionHandledWithoutMovement={onEdge}>
            {s.solved ? (
              <View>
                <Text style={[styles.verdict, { color: colors.right }]}>{lvlUp ? "Balanced! Level up!" : "Balanced!"}</Text>
                <DefaultFocus><FocusButton text="Next" onSelect={next} style={{ marginTop: px(20) }} /></DefaultFocus>
              </View>
            ) : (
              <DefaultFocus>
                <Focus onSelect={weigh} style={styles.dial}>
                  {() => <View style={{ alignItems: "center" }}><Text style={styles.dialLabel}>x =</Text><Text style={styles.dialValue}>{s.guess}</Text><Text style={styles.arrows}>▲ ▼</Text></View>}
                </Focus>
              </DefaultFocus>
            )}
          </SpatialNavigationRoot>
          {!s.solved && <Text style={[styles.verdict, { color: miss ? colors.wrong : colors.textDim, fontSize: px(font.body) }]} accessibilityLiveRegion="polite">
            {miss ? "Not balanced yet" : d === 0 ? "" : d > 0 ? "Left side is heavier" : "Right side is heavier"}</Text>}
        </View>
      </View>
    </Frame>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  side: { flex: 1, marginLeft: px(40) },
  eq: { color: colors.text, fontSize: px(font.title + 8), fontWeight: "900", marginBottom: px(24) },
  dial: { width: px(340), paddingVertical: px(20), alignItems: "center" },
  dialLabel: { color: colors.textDim, fontSize: px(font.body) },
  dialValue: { color: colors.text, fontSize: px(150), fontWeight: "900" },
  arrows: { color: colors.focus, fontSize: px(font.body), letterSpacing: 8 },
  verdict: { fontSize: px(font.title - 4), fontWeight: "900", marginTop: px(16) },
});
