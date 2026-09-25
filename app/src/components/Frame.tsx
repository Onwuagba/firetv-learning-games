import React from "react";
import { Text, View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, px, safe, font } from "../theme";

/** Title-safe frame (5% margins) with header, level pill, streak dots and a persistent remote-hint footer. */
export function Frame({ title, level, streak, need, hint, children }: {
  title: string; level?: number; streak?: number; need?: number; hint: string; children: React.ReactNode;
}) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">{title}</Text>
          {level !== undefined && <View style={styles.pill}><Text style={styles.pillText}>Level {level}</Text></View>}
          {streak !== undefined && need !== undefined && (
            <View style={styles.dots} accessibilityLabel={`Streak ${streak} of ${need}`}>
              {Array.from({ length: need }, (_, i) => <View key={i} style={[styles.dot, i < streak && styles.dotOn]} />)}
            </View>
          )}
        </View>
        <View style={styles.body}>{children}</View>
        <Text style={styles.hint}>{hint}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  inner: { flex: 1, paddingHorizontal: px(safe.h), paddingVertical: px(safe.v) },
  header: { flexDirection: "row", alignItems: "center" },
  title: { color: colors.text, fontSize: px(font.title), fontWeight: "900" },
  pill: { marginLeft: px(32), backgroundColor: colors.accent, borderRadius: px(40), paddingHorizontal: px(28), paddingVertical: px(8) },
  pillText: { color: colors.ink, fontSize: px(font.body), fontWeight: "800" },
  dots: { flexDirection: "row", marginLeft: px(32) },
  dot: { width: px(28), height: px(28), borderRadius: px(14), marginRight: px(10), backgroundColor: colors.cardDim, borderWidth: px(3), borderColor: colors.textDim },
  dotOn: { backgroundColor: colors.right, borderColor: colors.right },
  body: { flex: 1, justifyContent: "center" },
  hint: { color: colors.textDim, fontSize: px(font.hint), textAlign: "center" },
});
