import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Pop } from "../motion";
import { colors, px } from "../theme";

/** Row of `of` stars, `count` lit. With `animate`, lit stars pop in one after another. */
export function Stars({ count, of = 3, size = 120, animate = false, onStar }: { count: number; of?: number; size?: number; animate?: boolean; onStar?: (i: number) => void }) {
  return (
    <View style={styles.row} accessibilityLabel={`${count} of ${of} stars`}>
      {Array.from({ length: of }, (_, i) => {
        const lit = i < count;
        const star = <Text style={{ fontSize: px(size), color: lit ? colors.star : "#33487F" }}>{lit ? "★" : "☆"}</Text>;
        return <View key={i} style={{ marginHorizontal: px(10) }}>{animate && lit ? <Pop delay={350 + i * 380}>{star}</Pop> : star}</View>;
      })}
    </View>
  );
}
const styles = StyleSheet.create({ row: { flexDirection: "row", justifyContent: "center" } });
