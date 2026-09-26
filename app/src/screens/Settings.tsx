import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { DefaultFocus, SpatialNavigationRoot, SpatialNavigationView } from "react-tv-space-navigation";
import { Focus, FocusButton } from "../components/Focusable";
import { Frame } from "../components/Frame";
import { Keyboard } from "../components/Keyboard";
import { SYNC_LABEL } from "../components/SyncBadge";
import { colors, font, px } from "../theme";
import { getSync, lastSynced, store, syncNow, usingCoach } from "../session";
import { useNav } from "../navContext";
import { cycleReduced, normalizeServerUrl } from "../../../src/settings";
import { newEntry, type EntryState } from "../../../src/nameEntry";

const ago = (t: number) => { if (!t) return "never"; const s = Math.round((Date.now() - t) / 1000); return s < 10 ? "just now" : s < 90 ? `${s}s ago` : `${Math.round(s / 60)} min ago`; };

function Row({ label, value, onSelect, first, hint }: { label: string; value: string; onSelect: () => void; first?: boolean; hint?: string }) {
  const r = (
    <Focus onSelect={onSelect} label={`${label}: ${value}`} hint={hint} style={styles.row}>
      {() => <View style={styles.rowInner}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue} numberOfLines={1}>{value}</Text></View>}
    </Focus>
  );
  return first ? <DefaultFocus>{r}</DefaultFocus> : r;
}

/** Parent settings (reached through the parent gate): sound, music, reduced motion, coach server, sync, players. */
export function Settings() {
  const nav = useNav();
  const s = store.settings; const sy = getSync();
  const [busy, setBusy] = useState(false);
  const [, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick((n) => n + 1), 5000); return () => clearInterval(id); }, []);
  const doSync = async () => { setBusy(true); await syncNow(); setBusy(false); };
  const on = (b: boolean) => (b ? "On" : "Off");
  return (
    <Frame title="Settings" hint="Arrows: choose    OK: change    Back: home">
      <SpatialNavigationRoot>
        <SpatialNavigationView direction="vertical">
          <Row first label="Sound effects" value={on(s.sound)} onSelect={() => store.updateSettings({ sound: !s.sound })} />
          <Row label="Music" value={on(s.music && s.sound)} onSelect={() => store.updateSettings({ music: !s.music, sound: s.sound || !s.music })} />
          <Row label="Reduced motion" value={s.reducedMotion === "auto" ? "Auto (follow system)" : on(s.reducedMotion === "on")} onSelect={() => store.updateSettings({ reducedMotion: cycleReduced(s.reducedMotion) })} hint="Turns off springs, confetti and slides" />
          <Row label="Coach server" value={s.serverUrl || "Not set (progress stays on this TV)"} onSelect={() => nav.go("settings-url")} />
          <Row label="Sync" value={busy ? "Syncing..." : usingCoach() ? `${SYNC_LABEL[sy.status]}${sy.queue.length ? ` (${sy.queue.length} waiting)` : ""}, last ${ago(lastSynced())}` : "Sync now (no server set)"} onSelect={() => void doSync()} />
          <Row label="Players" value={`${store.profiles.profiles.length} on this TV`} onSelect={() => nav.go("profile-manage")} />
        </SpatialNavigationView>
      </SpatialNavigationRoot>
      <Text style={styles.note}>Progress is saved on this TV first and sent to the coach when it is reachable.</Text>
    </Frame>
  );
}

/** Server address entry with the on-screen keyboard. */
export function ServerUrl() {
  const nav = useNav();
  const [entry, setEntry] = useState<EntryState>(() => newEntry("url", store.settings.serverUrl.replace(/^http:\/\//, "")));
  const [error, setError] = useState("");
  const save = (text = entry.text) => {
    const r = normalizeServerUrl(text);
    if (!r.ok) { setError(r.error); return; }
    store.updateSettings({ serverUrl: r.url }); nav.back();
  };
  return (
    <Frame title="Coach server" hint="Arrows: choose    OK: type    Back: cancel">
      <SpatialNavigationRoot>
        <SpatialNavigationView direction="vertical">
          <View style={styles.urlBox} accessibilityLabel={`Address: ${entry.text || "empty"}`}>
            <Text style={[styles.urlText, !entry.text && { color: colors.textDim }]} numberOfLines={1}>{entry.text || "e.g. 192.168.1.20:8000"}<Text style={{ color: colors.focus }}>|</Text></Text>
          </View>
          <Text style={[styles.err, { opacity: error ? 1 : 0 }]}>{error || "-"}</Text>
          <Keyboard entry={entry} onChange={(e) => { setError(""); setEntry(e); }} onDone={() => save()} doneLabel="Save" />
          <SpatialNavigationView direction="horizontal" style={{ justifyContent: "center", marginTop: px(4) }}>
            <FocusButton text="Clear (local only)" onSelect={() => save("")} style={{ marginRight: px(24), minWidth: px(380) }} />
            <FocusButton text="Cancel" onSelect={() => nav.back()} style={{ minWidth: px(260) }} />
          </SpatialNavigationView>
        </SpatialNavigationView>
      </SpatialNavigationRoot>
    </Frame>
  );
}
const styles = StyleSheet.create({
  row: { width: px(1500), alignSelf: "center", marginBottom: px(16), paddingHorizontal: px(36), paddingVertical: px(22) },
  rowInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowLabel: { color: colors.text, fontSize: px(font.body + 2), fontWeight: "800" },
  rowValue: { color: colors.focus, fontSize: px(font.body - 4), fontWeight: "700", marginLeft: px(40), flexShrink: 1 },
  note: { color: colors.textDim, fontSize: px(font.small), textAlign: "center", marginTop: px(12) },
  urlBox: { alignSelf: "center", width: px(1300), paddingVertical: px(8), borderBottomWidth: px(4), borderBottomColor: colors.textDim },
  urlText: { color: colors.text, fontSize: px(font.title - 6), fontWeight: "800", textAlign: "center" },
  err: { color: colors.wrong, fontSize: px(font.small + 2), textAlign: "center", marginVertical: px(6) },
});
