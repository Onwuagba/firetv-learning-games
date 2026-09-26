// Motion helpers. Every animation honours `reduced` (Settings > Reduced motion, or the system preference when set to Auto).
import React, { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Platform, StyleSheet, View, ViewStyle } from "react-native";
import { px } from "./theme";

export const ND = Platform.OS !== "web"; // native driver is only available off-web
const MotionCtx = createContext(false);
export const MotionProvider = ({ reduced, children }: { reduced: boolean; children: React.ReactNode }) => <MotionCtx.Provider value={reduced}>{children}</MotionCtx.Provider>;
export const useReduced = () => useContext(MotionCtx);

/** Drives an Animated.Value 0..1 toward `on` (spring). Reduced motion jumps instantly. */
export function useToggleAnim(on: boolean, reduced: boolean): Animated.Value {
  const v = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) { v.setValue(on ? 1 : 0); return; }
    const a = Animated.spring(v, { toValue: on ? 1 : 0, useNativeDriver: ND, friction: 7, tension: 140 });
    a.start();
    return () => a.stop();
  }, [on, reduced, v]);
  return v;
}

/** Screen transition: gentle fade + rise when mounted (remount with a new `key` per screen). */
export function FadeIn({ children, delay = 0, style, distance = 24 }: { children: React.ReactNode; delay?: number; style?: ViewStyle; distance?: number }) {
  const reduced = useReduced();
  const v = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) { v.setValue(1); return; }
    const a = Animated.timing(v, { toValue: 1, duration: 320, delay, easing: Easing.out(Easing.cubic), useNativeDriver: ND });
    a.start(); return () => a.stop();
  }, [reduced, delay, v]);
  return <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [px(distance), 0] }) }] }]}>{children}</Animated.View>;
}

/** Springy scale-in for verdicts, stars and level-up banners. */
export function Pop({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: ViewStyle }) {
  const reduced = useReduced();
  const v = useRef(new Animated.Value(reduced ? 1 : 0)).current;
  useEffect(() => {
    if (reduced) { v.setValue(1); return; }
    const a = Animated.sequence([Animated.delay(delay), Animated.spring(v, { toValue: 1, friction: 5, tension: 120, useNativeDriver: ND })]);
    a.start(); return () => a.stop();
  }, [reduced, delay, v]);
  return <Animated.View style={[style, { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }]}>{children}</Animated.View>;
}

const CONFETTI = ["#FFD23F", "#FF6B6B", "#2ECC71", "#4DA3FF", "#A78BFA", "#FF9F43"];
/** Level-up / perfect-round celebration. Cheap: 24 native-driven views, one 1.8 s animation, unmounts itself visually. Skipped when reduced. */
export function Confetti({ count = 24 }: { count?: number }) {
  const reduced = useReduced();
  const t = useRef(new Animated.Value(0)).current;
  const parts = useMemo(() => Array.from({ length: count }, (_, i) => ({ x: ((i * 137) % 100) / 100, drift: ((i * 53) % 60) - 30, size: 14 + ((i * 7) % 14), color: CONFETTI[i % CONFETTI.length], delay: (i % 6) * 0.05, spin: 1 + (i % 3) })), [count]);
  useEffect(() => {
    if (reduced) return;
    const a = Animated.timing(t, { toValue: 1, duration: 1900, easing: Easing.out(Easing.quad), useNativeDriver: ND });
    a.start(); return () => a.stop();
  }, [reduced, t]);
  if (reduced) return null;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {parts.map((p, i) => (
        <Animated.View key={i} style={{
          position: "absolute", left: `${p.x * 100}%`, top: 0, width: px(p.size), height: px(p.size * 0.6), backgroundColor: p.color, borderRadius: px(3),
          opacity: t.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [-px(60), px(900 + p.delay * 200)] }) },
            { translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, px(p.drift * 4)] }) },
            { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${p.spin * 360}deg`] }) },
          ],
        }} />
      ))}
    </View>
  );
}
