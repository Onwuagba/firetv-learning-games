import React from "react";
import { Animated, StyleSheet, Text, View, ViewStyle } from "react-native";
import { SpatialNavigationFocusableView } from "react-tv-space-navigation";
import { colors, font, px, radius } from "../theme";
import { useReduced, useToggleAnim } from "../motion";
import { audio } from "../audio";

interface FocusProps {
  onSelect?: () => void;
  onFocus?: () => void;
  style?: ViewStyle;
  /** Spoken label for screen readers (TalkBack / VoiceView). Defaults to the visible text of simple buttons. */
  label?: string;
  hint?: string;
  silent?: boolean;
  children: (focused: boolean) => React.ReactElement;
}
const LAYOUT_KEYS = ["margin", "marginTop", "marginBottom", "marginLeft", "marginRight", "marginHorizontal", "marginVertical", "alignSelf", "flex", "flexGrow", "position", "top", "left", "right", "bottom"] as const;
function splitStyle(style?: ViewStyle): [ViewStyle, ViewStyle] {
  const flat = (StyleSheet.flatten(style) ?? {}) as Record<string, unknown>;
  const outer: Record<string, unknown> = {}, inner: Record<string, unknown> = { ...flat };
  for (const k of LAYOUT_KEYS) if (k in flat) { outer[k] = flat[k]; delete inner[k]; }
  if (inner.width !== undefined && outer.alignSelf === undefined && outer.flex === undefined) outer.alignSelf = "flex-start"; // fixed-size cards must not be stretched by a parent column (the halo follows the outer box)
  return [outer as ViewStyle, inner as ViewStyle];
}

/** One focus treatment for every interactive element: springy scale-up, glow halo, bright ring. Reduced motion = no spring. */
function FocusFrame({ focused, style, label, hint, children }: { focused: boolean; style?: ViewStyle; label?: string; hint?: string; children: React.ReactNode }) {
  const reduced = useReduced();
  const a = useToggleAnim(focused, reduced);
  const [outer, inner] = splitStyle(style);
  return (
    <Animated.View style={[outer, { transform: [{ scale: a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }] }]}>
      <Animated.View pointerEvents="none" style={[styles.halo, { opacity: a }, inner.borderRadius !== undefined ? { borderRadius: Number(inner.borderRadius) + px(14) } : null]} />
      <View
        style={[styles.base, inner, focused && styles.focused]}
        accessible accessibilityRole="button" accessibilityLabel={label} accessibilityHint={hint} accessibilityState={{ selected: focused }} testID={focused ? "focused" : undefined}
      >
        {children}
      </View>
    </Animated.View>
  );
}

/** Every interactive element uses it, so focus looks (and sounds) identical everywhere. */
export function Focus({ onSelect, onFocus, style, label, hint, silent, children }: FocusProps) {
  return (
    <SpatialNavigationFocusableView
      onSelect={() => { if (!silent) audio.play("select"); onSelect?.(); }}
      onFocus={() => { audio.play("move"); onFocus?.(); }}
    >
      {({ isFocused }) => <FocusFrame focused={isFocused} style={style} label={label} hint={hint}>{children(isFocused)}</FocusFrame>}
    </SpatialNavigationFocusableView>
  );
}

export function FocusButton({ text, onSelect, style, icon, label, primary }: { text: string; onSelect: () => void; style?: ViewStyle; icon?: string; label?: string; primary?: boolean }) {
  return (
    <Focus onSelect={onSelect} label={label ?? text} style={{ ...styles.button, ...(primary ? styles.primary : {}), ...style }}>
      {(f) => (
        <View style={styles.buttonRow}>
          {icon ? <Text style={styles.buttonIcon}>{icon}</Text> : null}
          <Text style={[styles.buttonText, primary && !f && { color: colors.ink }]}>{text}</Text>
        </View>
      )}
    </Focus>
  );
}

const styles = StyleSheet.create({
  halo: { position: "absolute", top: -px(14), left: -px(14), right: -px(14), bottom: -px(14), borderRadius: px(radius.card + 14), backgroundColor: colors.focusGlow },
  base: { borderWidth: px(6), borderColor: "transparent", borderRadius: px(radius.card), backgroundColor: colors.card },
  focused: { borderColor: colors.focus, backgroundColor: colors.cardHi },
  button: { paddingVertical: px(22), paddingHorizontal: px(48), minWidth: px(300), alignItems: "center" },
  primary: { backgroundColor: colors.focus },
  buttonRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  buttonIcon: { fontSize: px(font.body), marginRight: px(14) },
  buttonText: { color: colors.text, fontSize: px(font.body + 2), fontWeight: "800" },
});
