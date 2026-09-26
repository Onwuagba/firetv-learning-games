import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { avatarOf } from "../../../src/profiles";
import { px } from "../theme";

export function Avatar({ id, size = 120 }: { id: string; size?: number }) {
  const a = avatarOf(id);
  return (
    <View style={[styles.c, { width: px(size), height: px(size), borderRadius: px(size / 2), backgroundColor: a.color }]} accessibilityLabel={a.label}>
      <Text style={{ fontSize: px(size * 0.55) }}>{a.emoji}</Text>
    </View>
  );
}
const styles = StyleSheet.create({ c: { alignItems: "center", justifyContent: "center" } });
