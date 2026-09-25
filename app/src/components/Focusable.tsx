import React from "react";
import { Text, View, ViewStyle, StyleSheet } from "react-native";
import { SpatialNavigationFocusableView } from "react-tv-space-navigation";
import { colors, px, font } from "../theme";

interface FocusProps {
  onSelect?: () => void;
  onFocus?: () => void;
  style?: ViewStyle;
  children: (focused: boolean) => React.ReactElement;
}

/** Focus ring + lift + glow. Every interactive element uses it, so focus looks identical everywhere. */
export function Focus({ onSelect, onFocus, style, children }: FocusProps) {
  return (
    <SpatialNavigationFocusableView onSelect={onSelect} onFocus={onFocus}>
      {({ isFocused }) => (
        <View style={[styles.base, style, isFocused && styles.focused]}>{children(isFocused)}</View>
      )}
    </SpatialNavigationFocusableView>
  );
}

export function FocusButton({ text, onSelect, style }: { text: string; onSelect: () => void; style?: ViewStyle }) {
  return (
    <Focus onSelect={onSelect} style={{ ...styles.button, ...style }}>
      {() => <Text style={styles.buttonText}>{text}</Text>}
    </Focus>
  );
}

const styles = StyleSheet.create({
  base: { borderWidth: px(6), borderColor: "transparent", borderRadius: px(28), backgroundColor: colors.card },
  focused: {
    borderColor: colors.focus, backgroundColor: "#243B7A", transform: [{ scale: 1.06 }],
    shadowColor: colors.focus, shadowOpacity: 0.9, shadowRadius: px(28), shadowOffset: { width: 0, height: 0 }, elevation: 16,
  },
  button: { paddingVertical: px(24), paddingHorizontal: px(56), minWidth: px(320), alignItems: "center" },
  buttonText: { color: colors.text, fontSize: px(font.body + 4), fontWeight: "800" },
});
