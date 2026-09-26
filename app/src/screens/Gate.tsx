import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { DefaultFocus, SpatialNavigationRoot, SpatialNavigationView } from "react-tv-space-navigation";
import { Focus } from "../components/Focusable";
import { Frame } from "../components/Frame";
import { colors, font, px } from "../theme";
import { useNav } from "../navContext";
import { attempt, GATE_LOCK_MS, isLocked, newGateState, type GateState } from "../../../src/gate";
import { audio } from "../audio";

/** Parent gate: a multiplication the youngest players cannot answer. Wrong answers twice lock it for 15 s. */
export function ParentGate({ target }: { target: string }) {
  const nav = useNav();
  const [g, setG] = useState<GateState>(() => newGateState());
  const [now, setNow] = useState(Date.now());
  const [flash, setFlash] = useState(false);
  const passed = useRef(false);
  const locked = isLocked(g, now);
  useEffect(() => {
    if (!locked) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [locked]);
  useEffect(() => { if (g.open && !passed.current) { passed.current = true; audio.play("correct"); nav.replace(target); } }, [g.open, nav, target]);
  const choose = (c: string) => {
    const t = Date.now(); setNow(t);
    const n = attempt(g, c, t);
    if (!n.open && n !== g) { audio.play("wrong"); setFlash(true); setTimeout(() => setFlash(false), 700); }
    setG(n);
  };
  const secs = Math.max(0, Math.ceil((g.lockedUntil - now) / 1000));
  return (
    <Frame title="Grown-ups only" hint="Answer the sum to continue    Back: cancel">
      <View style={styles.center}>
        <Text style={styles.lead}>Ask a grown-up to solve</Text>
        <Text style={styles.q} accessibilityLiveRegion="polite">{g.gate.prompt} = ?</Text>
        {locked ? (
          <Text style={[styles.msg, { color: colors.wrong }]} accessibilityLiveRegion="polite">Too many tries. Wait {secs}s (of {GATE_LOCK_MS / 1000}s)</Text>
        ) : (
          <SpatialNavigationRoot key={g.gate.prompt}>
            <SpatialNavigationView direction="horizontal" style={{ justifyContent: "center" }}>
              {g.gate.choices.map((c, i) => {
                const node = (
                  <Focus key={c} onSelect={() => choose(c)} label={c} style={{ ...styles.choice, ...(flash ? { backgroundColor: "#5A2A3A" } : {}) }}>{() => <Text style={styles.choiceText}>{c}</Text>}</Focus>
                );
                return i === 0 ? <DefaultFocus key={c}>{node}</DefaultFocus> : node;
              })}
            </SpatialNavigationView>
          </SpatialNavigationRoot>
        )}
        <Text style={[styles.msg, { opacity: flash && !locked ? 1 : 0 }]}>Not quite, try this one</Text>
      </View>
    </Frame>
  );
}
const styles = StyleSheet.create({
  center: { alignItems: "center" },
  lead: { color: colors.textDim, fontSize: px(font.body) },
  q: { color: colors.text, fontSize: px(150), fontWeight: "900", marginVertical: px(24) },
  choice: { width: px(280), height: px(150), marginHorizontal: px(16), alignItems: "center", justifyContent: "center" },
  choiceText: { color: colors.text, fontSize: px(64), fontWeight: "900" },
  msg: { color: colors.textDim, fontSize: px(font.body), marginTop: px(28), minHeight: px(50) },
});
