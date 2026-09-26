import React, { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { AccessibilityInfo, BackHandler, Platform, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import RemoteControlManager from "../tv/RemoteControlManager";
import { SupportedKeys } from "../tv/SupportedKeys";
import { back, current, go, initialNav, replace, topicOf, type Nav } from "../../src/nav";
import { gameFor, playableTopics, type Topic } from "../../src/curriculum";
import { reducedMotionOn } from "../../src/settings";
import type { RoundResult } from "../../src/games/round";
import type { Badge } from "../../src/motivation";
import { Home } from "./screens/Home";
import { Abacus } from "./screens/Abacus";
import { Balance } from "./screens/Balance";
import { Daily, GenericQuiz, MapQuiz } from "./screens/Quizzes";
import { ProfileAdd, ProfileManage, ProfilePicker } from "./screens/Profiles";
import { ParentGate } from "./screens/Gate";
import { ServerUrl, Settings } from "./screens/Settings";
import { Dashboard } from "./screens/Progress";
import { LevelMap } from "./screens/LevelMap";
import { Results } from "./screens/Results";
import { Loading } from "./screens/Loading";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { SyncBadge } from "./components/SyncBadge";
import { NavCtx, type AppNav } from "./navContext";
import { MotionProvider } from "./motion";
import { audio } from "./audio";
import { getProfile, getSync, startSession, store, subscribeSession, syncNow, usingCoach } from "./session";
import { colors } from "./theme";

/** System "reduce motion" preference (web media query, Android/iOS accessibility setting). */
function useSystemReducedMotion(): boolean {
  const [r, setR] = useState(false);
  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined" && window.matchMedia) {
      const m = window.matchMedia("(prefers-reduced-motion: reduce)");
      setR(m.matches); const f = () => setR(m.matches); m.addEventListener?.("change", f);
      return () => m.removeEventListener?.("change", f);
    }
    let live = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => live && setR(v)).catch(() => {});
    const sub = AccessibilityInfo.addEventListener("reduceMotionChanged", (v) => setR(v));
    return () => { live = false; sub.remove(); };
  }, []);
  return r;
}

const GATED_ONLY = new Set(["settings", "profile-manage"]);

export default function AppRoot() {
  const [nav, setNav] = useState<Nav>(initialNav());
  const [lastTopic, setLastTopic] = useState("");
  const [gateTarget, setGateTarget] = useState("settings");
  const [result, setResult] = useState<{ r: RoundResult; fresh: Badge[] } | null>(null);
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const navRef = useRef(nav); navRef.current = nav;
  const systemReduced = useSystemReducedMotion();

  useEffect(() => {
    const unsub = subscribeSession(bump);
    let stop = () => {}; let dead = false;
    void startSession().then((s) => { if (dead) s(); else stop = s; bump(); });
    return () => { dead = true; stop(); unsub(); };
  }, []);
  const { settings } = store;
  useEffect(() => { audio.configure({ sound: settings.sound, music: settings.music }); }, [settings.sound, settings.music]);

  const appNav: AppNav = React.useMemo(() => ({
    go: (s) => setNav((n) => { if (topicOf(s)) setLastTopic(topicOf(s)!); return go(n, s); }),
    replace: (s) => setNav((n) => { if (topicOf(s)) setLastTopic(topicOf(s)!); return replace(n, s); }),
    back: () => setNav((n) => back(n)),
    gated: (s) => { setGateTarget(s); setNav((n) => go(n, "gate")); },
    showResult: (r) => {
      const p = getProfile();
      const { fresh } = p ? store.finishRound(p.id, r, getSync().progress) : { fresh: [] as Badge[] };
      setResult({ r, fresh }); setNav((n) => replace(n, "results"));
    },
    depth: nav.stack.length,
  }), [nav.stack.length]);

  // BACK pops toward home; on home it returns false so the system handles it (exit to Fire TV launcher).
  const lastBack = useRef(0);
  const onBack = useCallback(() => {
    if (current(navRef.current) === "home") return false;
    const t = Date.now(); if (t - lastBack.current < 250) return true; lastBack.current = t; // dedupe key event + BackHandler
    void syncNow(); audio.play("back"); setNav((n) => back(n));
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

  const profile = getProfile();
  let scr = current(nav);
  // No player yet: the only ways forward are the picker and "new player".
  if (store.loaded && !profile && scr !== "profile-add") scr = "profiles";
  useEffect(() => { audio.quietFor(600); }, [scr]);

  const renderScreen = () => {
    if (!store.loaded) return <Loading />;
    const t = topicOf(scr);
    if (t) {
      const topic = t as Topic;
      if (!playableTopics().includes(topic)) return <Home initial="" />;
      const g = gameFor(topic);
      return g === "abacus" ? <Abacus /> : g === "balance" ? <Balance /> : g === "geo" ? <MapQuiz topic={topic} /> : <GenericQuiz topic={topic} />;
    }
    switch (scr) {
      case "profiles": return <ProfilePicker />;
      case "profile-add": return <ProfileAdd />;
      case "profile-manage": return <ProfileManage />;
      case "gate": return <ParentGate target={GATED_ONLY.has(gateTarget) || gateTarget.startsWith("profile") ? gateTarget : "settings"} />;
      case "settings": return <Settings />;
      case "settings-url": return <ServerUrl />;
      case "dashboard": return <Dashboard />;
      case "levelmap": return <LevelMap />;
      case "daily": return <Daily />;
      case "results": return result ? <Results result={result.r} fresh={result.fresh} /> : <Home initial="" />;
      default: return <Home initial={lastTopic} />;
    }
  };
  const sy = getSync();
  return (
    <SafeAreaProvider>
      <MotionProvider reduced={reducedMotionOn(settings.reducedMotion, systemReduced)}>
        <NavCtx.Provider value={appNav}>
          <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <StatusBar hidden />
            <ErrorBoundary key={scr} onReset={() => setNav(initialNav())}>{renderScreen()}</ErrorBoundary>
            {store.loaded && scr !== "gate" && <SyncBadge status={sy.status} queued={sy.queue.length} />}
          </View>
        </NavCtx.Provider>
      </MotionProvider>
    </SafeAreaProvider>
  );
}
void usingCoach;
