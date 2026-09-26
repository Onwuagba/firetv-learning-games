import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { DefaultFocus, SpatialNavigationView } from "react-tv-space-navigation";
import { Focus } from "./Focusable";
import { KEY_ROWS, backspace, space, typeChar, type EntryState } from "../../../src/nameEntry";
import { colors, font, px } from "../theme";

/** D-pad on-screen keyboard (no system keyboard on a TV remote). Must be rendered inside a SpatialNavigationRoot. */
export function Keyboard({ entry, onChange, onDone, doneLabel = "Done" }: { entry: EntryState; onChange: (e: EntryState) => void; onDone: () => void; doneLabel?: string }) {
  const rows = KEY_ROWS[entry.charset];
  const kw = entry.charset === "url" ? 132 : 150;
  return (
    <SpatialNavigationView direction="vertical">
      {rows.map((row, r) => (
        <SpatialNavigationView key={r} direction="horizontal" style={styles.row}>
          {row.map((ch, i) => {
            const k = (
              <Focus key={ch} onSelect={() => onChange(typeChar(entry, ch))} label={ch === "." ? "dot" : ch === ":" ? "colon" : ch === "/" ? "slash" : ch === "-" ? "dash" : ch} style={{ ...styles.key, width: px(kw) }}>
                {() => <Text style={styles.keyText}>{entry.charset === "name" ? ch : ch}</Text>}
              </Focus>
            );
            return r === 0 && i === 0 ? <DefaultFocus key={ch}>{k}</DefaultFocus> : k;
          })}
        </SpatialNavigationView>
      ))}
      <SpatialNavigationView direction="horizontal" style={styles.row}>
        {entry.charset === "name" && <Focus onSelect={() => onChange(space(entry))} label="Space" style={{ ...styles.key, width: px(kw * 2 + 12) }}>{() => <Text style={styles.keyText}>space</Text>}</Focus>}
        <Focus onSelect={() => onChange(backspace(entry))} label="Delete last letter" style={{ ...styles.key, width: px(kw * 2 + 12) }}>{() => <Text style={styles.keyText}>⌫ delete</Text>}</Focus>
        <Focus onSelect={onDone} label={doneLabel} style={{ ...styles.key, width: px(kw * 2 + 12), backgroundColor: colors.right }}>{() => <Text style={[styles.keyText, { color: colors.ink }]}>{doneLabel}</Text>}</Focus>
      </SpatialNavigationView>
    </SpatialNavigationView>
  );
}
const styles = StyleSheet.create({
  row: { marginBottom: px(12), justifyContent: "center" },
  key: { height: px(92), marginRight: px(12), alignItems: "center", justifyContent: "center", paddingHorizontal: 0 },
  keyText: { color: colors.text, fontSize: px(font.body), fontWeight: "800" },
});
