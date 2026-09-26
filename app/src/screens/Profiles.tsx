import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { DefaultFocus, SpatialNavigationRoot, SpatialNavigationView } from "react-tv-space-navigation";
import { Focus, FocusButton } from "../components/Focusable";
import { Frame } from "../components/Frame";
import { Avatar } from "../components/Avatar";
import { Keyboard } from "../components/Keyboard";
import { colors, font, px } from "../theme";
import { store, getProfile } from "../session";
import { useNav } from "../navContext";
import { AVATARS, MAX_PROFILES, freeAvatars } from "../../../src/profiles";
import { newEntry, type EntryState } from "../../../src/nameEntry";
import { stats } from "../session";
import { dayStreak } from "../../../src/motivation";

/** "Who's playing?": one card per child (avatar, name, day streak) plus "Add player". Progress is per child. */
export function ProfilePicker() {
  const nav = useNav();
  const { profiles } = store.profiles;
  const active = getProfile();
  const pick = (id: string) => { store.setActive(id); if (nav.depth > 1) nav.back(); };
  const cards = profiles.map((p) => {
    const streak = dayStreak(store.statsFor(p.id), store.today());
    const card = (
      <Focus key={p.id} onSelect={() => pick(p.id)} label={`${p.name}${p.id === active?.id ? ", playing now" : ""}${streak ? `, ${streak} day streak` : ""}`} style={styles.card}>
        {() => (
          <View style={styles.cardInner}>
            <Avatar id={p.avatar} size={150} />
            <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
            <Text style={styles.sub}>{streak ? `🔥 ${streak} day${streak > 1 ? "s" : ""}` : p.id === active?.id ? "Playing now" : " "}</Text>
          </View>
        )}
      </Focus>
    );
    return p.id === (active?.id ?? profiles[0]?.id) ? <DefaultFocus key={p.id}>{card}</DefaultFocus> : card;
  });
  const addTile = profiles.length < MAX_PROFILES && (
    <Focus key="add" onSelect={() => (profiles.length ? nav.gated("profile-add") : nav.go("profile-add"))} label="Add a player" hint={profiles.length ? "Grown-ups only" : undefined} style={{ ...styles.card, backgroundColor: colors.cardDim }}>
      {() => (
        <View style={styles.cardInner}>
          <View style={styles.plus}><Text style={styles.plusText}>+</Text></View>
          <Text style={styles.name}>Add player</Text>
          <Text style={styles.sub}>{profiles.length ? "Grown-ups only" : "Start here"}</Text>
        </View>
      )}
    </Focus>
  );
  return (
    <Frame title={profiles.length ? "Who's playing?" : "Welcome to Learn & Play"} hint={profiles.length ? "Arrows: choose    OK: play    Back: home" : "OK: make the first player"}>
      <SpatialNavigationRoot>
        <SpatialNavigationView direction="vertical">
          <SpatialNavigationView direction="horizontal" style={styles.row}>
            {!profiles.length && addTile ? <DefaultFocus>{addTile}</DefaultFocus> : <>{cards}{addTile}</>}
          </SpatialNavigationView>
          {profiles.length > 0 && <View style={{ alignItems: "center", marginTop: px(40) }}><FocusButton text="Manage players" icon="⚙" onSelect={() => nav.gated("profile-manage")} /></View>}
        </SpatialNavigationView>
      </SpatialNavigationRoot>
    </Frame>
  );
}

/** Add a child: pick an avatar, type a name on the on-screen keyboard. */
export function ProfileAdd() {
  const nav = useNav();
  const order = freeAvatars(store.profiles);
  const [avatar, setAvatar] = useState(order[0]?.id ?? AVATARS[0].id);
  const [entry, setEntry] = useState<EntryState>(() => newEntry("name"));
  const [error, setError] = useState("");
  const done = () => {
    const r = store.addProfile(entry.text, avatar);
    if (r.ok) { if (store.profiles.activeId !== r.profile.id && nav.depth <= 1) store.setActive(r.profile.id); nav.back(); }
    else setError(r.error === "empty" ? "Type a name first" : "Too many players");
  };
  return (
    <Frame title="New player" hint="Arrows: choose    OK: pick    Back: cancel">
      <SpatialNavigationRoot>
        <SpatialNavigationView direction="vertical">
          <SpatialNavigationView direction="horizontal" style={{ ...styles.row, marginBottom: px(20) }}>
            {order.map((a) => (
              <Focus key={a.id} onSelect={() => setAvatar(a.id)} onFocus={() => setAvatar(a.id)} label={`Avatar ${a.label}${a.id === avatar ? ", chosen" : ""}`} style={{ ...styles.avatarCard, ...(a.id === avatar ? { borderColor: colors.text } : {}) }}>
                {() => <Avatar id={a.id} size={110} />}
              </Focus>
            ))}
          </SpatialNavigationView>
          <View style={styles.nameBox} accessibilityLiveRegion="polite" accessibilityLabel={`Name: ${entry.text || "empty"}`}>
            <Text style={[styles.nameText, !entry.text && { color: colors.textDim }]}>{entry.text || "Type a name"}<Text style={{ color: colors.focus }}>|</Text></Text>
          </View>
          {error ? <Text style={styles.err}>{error}</Text> : <View style={{ height: px(34) }} />}
          <Keyboard entry={entry} onChange={(e) => { setError(""); setEntry(e); }} onDone={done} doneLabel="Done" />
        </SpatialNavigationView>
      </SpatialNavigationRoot>
    </Frame>
  );
}

/** Remove players (behind the parent gate). Two presses: the first asks, the second removes. */
export function ProfileManage() {
  const nav = useNav();
  const [confirm, setConfirm] = useState<string | null>(null);
  const { profiles } = store.profiles;
  return (
    <Frame title="Manage players" hint={confirm ? "OK again: remove    Any other button: cancel" : "OK: remove a player    Back: done"}>
      <SpatialNavigationRoot>
        <SpatialNavigationView direction="horizontal" style={styles.row}>
          {profiles.length === 0 && <Text style={styles.sub}>No players yet.</Text>}
          {profiles.map((p, i) => {
            const c = (
              <Focus key={p.id} onFocus={() => confirm && confirm !== p.id && setConfirm(null)}
                onSelect={() => { if (confirm === p.id) { store.removeProfile(p.id); setConfirm(null); if (!store.profiles.profiles.length) nav.back(); } else setConfirm(p.id); }}
                label={confirm === p.id ? `Really remove ${p.name}? Press OK again` : `Remove ${p.name}`} style={{ ...styles.card, ...(confirm === p.id ? { backgroundColor: "#5A2A3A" } : {}) }}>
                {() => (
                  <View style={styles.cardInner}>
                    <Avatar id={p.avatar} size={130} />
                    <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
                    <Text style={[styles.sub, confirm === p.id && { color: colors.wrong }]}>{confirm === p.id ? "Press OK to remove" : "Remove"}</Text>
                  </View>
                )}
              </Focus>
            );
            return i === 0 ? <DefaultFocus key={p.id}>{c}</DefaultFocus> : c;
          })}
        </SpatialNavigationView>
      </SpatialNavigationRoot>
    </Frame>
  );
}

const styles = StyleSheet.create({
  row: { justifyContent: "center", flexWrap: "wrap" },
  card: { width: px(270), height: px(340), marginHorizontal: px(12) },
  cardInner: { flex: 1, alignItems: "center", justifyContent: "center", padding: px(12) },
  name: { color: colors.text, fontSize: px(font.body + 2), fontWeight: "900", marginTop: px(18), maxWidth: px(230), textAlign: "center" },
  sub: { color: colors.textDim, fontSize: px(font.small + 2), marginTop: px(6), textAlign: "center" },
  plus: { width: px(150), height: px(150), borderRadius: px(75), borderWidth: px(6), borderColor: colors.textDim, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  plusText: { color: colors.textDim, fontSize: px(96), fontWeight: "300" },
  avatarCard: { width: px(150), height: px(150), marginHorizontal: px(10), alignItems: "center", justifyContent: "center", borderRadius: px(75), borderWidth: px(6) },
  nameBox: { alignSelf: "center", minWidth: px(560), paddingVertical: px(6), borderBottomWidth: px(4), borderBottomColor: colors.textDim, marginBottom: px(6) },
  nameText: { color: colors.text, fontSize: px(font.title + 8), fontWeight: "900", textAlign: "center" },
  err: { color: colors.wrong, fontSize: px(font.small + 2), textAlign: "center", marginBottom: px(0) },
});
