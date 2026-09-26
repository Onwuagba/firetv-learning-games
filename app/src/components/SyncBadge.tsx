import React from "react";
import { Text, View, StyleSheet } from "react-native";
import type { SyncStatus } from "../../../src/progress/types";
import { colors, px, font } from "../theme";

const LABEL: Record<SyncStatus, string> = { local: "Local only", synced: "Synced with coach", pending: "Syncing...", offline: "Offline - will sync" };

/** Small corner indicator so a parent can tell whether progress has reached the coach. */
export function SyncBadge({ status, queued }: { status: SyncStatus; queued: number }) {
  const dot = status === "synced" ? "#3fbf6f" : status === "offline" ? "#e5a02f" : status === "pending" ? "#5aa9e6" : colors.textDim;
  return (
    <View style={styles.wrap} pointerEvents="none" accessibilityLabel={`Sync status: ${LABEL[status]}`} testID="sync-badge">
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={styles.text}>{LABEL[status]}{queued ? ` (${queued})` : ""}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { position: "absolute", top: px(14), right: px(24), flexDirection: "row", alignItems: "center", opacity: 0.9 },
  dot: { width: px(14), height: px(14), borderRadius: px(7), marginRight: px(8) },
  text: { color: colors.textDim, fontSize: px(font.hint) },
});
