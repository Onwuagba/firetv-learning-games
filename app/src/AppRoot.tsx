import React, { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { BackHandler, Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import RemoteControlManager from "../tv/RemoteControlManager";
import { SupportedKeys } from "../tv/SupportedKeys";
import { back, current, go, initialNav, type Nav } from "../../src/nav";
import { Home } from "./screens/Home";
import { Abacus } from "./screens/Abacus";
import { MapQuiz } from "./screens/MapQuiz";
import { Balance } from "./screens/Balance";
import { sync } from "./session";
import { colors } from "./theme";

export default function AppRoot() {
  const [nav, setNav] = useState<Nav>(initialNav());
  const [lastTile, setLastTile] = useState<"abacus" | "geography" | "algebra">("abacus");
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const navRef = useRef(nav); navRef.current = nav;

  useEffect(() => { void sync.load().then(bump); }, []);

  // BACK pops toward home; on home it returns false so the system handles it (exit to Fire TV launcher).
  const lastBack = useRef(0);
  const onBack = useCallback(() => {
    if (current(navRef.current) === "home") return false;
    const t = Date.now(); if (t - lastBack.current < 250) return true; lastBack.current = t; // dedupe key event + BackHandler
    void sync.flush(); setNav((n) => back(n)); bump();
    return true;
  }, []);
  useEffect(() => {
    // Web: Esc / Backspace. Android/Fire TV: BACK arrives both as a key event (KEYCODE_BACK=4, see tv/RemoteControlManager.android.ts)
    // and as BackHandler's hardwareBackPress depending on the activity; listen to both, onBack dedupes.
    const l = (k: SupportedKeys) => { if (k === SupportedKeys.Back) onBack(); };
    RemoteControlManager.addKeydownListener(l);
    const sub = Platform.OS === "web" ? null : BackHandler.addEventListener("hardwareBackPress", onBack);
    return () => { RemoteControlManager.removeKeydownListener(l); sub?.remove(); };
  }, [onBack]);

  const scr = current(nav);
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <StatusBar hidden />
        {scr === "home" && <Home initial={lastTile} onOpen={(s) => { setLastTile(s); setNav((n) => go(n, s)); }} />}
        {scr === "abacus" && <Abacus />}
        {scr === "geography" && <MapQuiz />}
        {scr === "algebra" && <Balance />}
      </View>
    </SafeAreaProvider>
  );
}
