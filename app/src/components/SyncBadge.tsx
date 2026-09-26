import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { SyncStatus } from "../../../src/progress/types";
import { colors, font, px } from "../theme";

export const SYNC_LABEL: Record<SyncStatus, string> = { local: "Saved on this TV", synced: "Synced with coach", pending: "Syncing...", offline: "Offline: will sync later" };
/** Corner indicator (bottom right, clear of the title-safe header) so a parent can tell whether progress has reached the coach. */
export function SyncBadge({ status, queued }: { status: SyncStatus; queued: number }) {
  const dot = status === "synced" ? "#3fbf6f" : status === "offline" ? "#e5a02f" : status === "pending" ? "#5aa9e6" : colors.textDim;
  return (
    <View style={styles.wrap} pointerEvents="none" accessibilityLabel={`Sync status: ${SYNC_LABEL[status]}${queued ? `, ${queued} answers waiting` : ""}`} testID="sync-badge">
      <View style={[styles.dot, { backgroundColor: dot }]} />
      <Text style={styles.text}>{SYNC_LABEL[status]}{queued ? ` (${queued})` : ""}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { position: "absolute", bottom: px(22), right: px(40), flexDirection: "row", alignItems: "center", opacity: 0.95 },
  dot: { width: px(16), height: px(16), borderRadius: px(8), marginRight: px(10) },
  text: { color: colors.textDim, fontSize: px(font.small) },
});
