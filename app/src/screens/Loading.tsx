import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Pop } from "../motion";
import { HeroScene } from "../components/HeroScene";
import { colors, font, px } from "../theme";

/** Shown while local data loads (usually well under a second). */
export function Loading() {
  return (
    <View style={styles.root} accessibilityLabel="Loading" accessibilityLiveRegion="polite">
      <View style={styles.scene}><HeroScene width={1728} height={230} /></View>
      <Pop><Text style={styles.title}>Learn & Play</Text></Pop>
      <Text style={styles.sub}>Getting ready...</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  scene: { marginBottom: px(40), borderRadius: px(28), overflow: "hidden" },
  title: { color: colors.text, fontSize: px(font.hero), fontWeight: "900" },
  sub: { color: colors.textDim, fontSize: px(font.body), marginTop: px(12) },
});
