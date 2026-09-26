import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { DefaultFocus, SpatialNavigationRoot, SpatialNavigationView } from "react-tv-space-navigation";
import { Focus, FocusButton } from "../components/Focusable";
import { Frame } from "../components/Frame";
import { MapView, defaultZoom, nextZoom } from "../components/MapView";
import { Confetti, Pop } from "../motion";
import { colors, font, px, radius } from "../theme";
import { level as levelOf, record, streakOf, STREAK_NEEDED } from "../session";
import { useNav } from "../navContext";
import { audio } from "../audio";
import { debugQuestion } from "../debug";
import { type Question, type Topic } from "../../../src/curriculum";
import type { GeoQuestion } from "../../../src/games/geo";
import { ROUND_LENGTH, answer as roundAnswer, isComplete, newRound, resultOf, type Round } from "../../../src/games/round";
import type { Zoom } from "../../../src/mapview";

export interface QuizItem { topic: Topic; level: number; q: Question | GeoQuestion }
const isGeo = (q: Question | GeoQuestion): q is GeoQuestion => "mode" in q;
const ZOOM_LABEL: Record<Zoom, string> = { world: "World", region: "Region", close: "Close-up" };

/** Shared multiple-choice round used by Map Quiz, any topic without a custom game, and the Daily Challenge.
 *  `getItem(index)` supplies each question (from the child's current level, or a fixed daily list). */
export function QuizRound({ title, topic, total = ROUND_LENGTH, getItem, daily = false, showLevel = true }: {
  title: string; topic: string; total?: number; getItem: (index: number) => QuizItem; daily?: boolean; showLevel?: boolean;
}) {
  const nav = useNav();
  const [round, setRound] = useState<Round>(() => newRound(topic, 1, total));
  const [item, setItem] = useState<QuizItem>(() => getItem(0));
  const [picked, setPicked] = useState<number | null>(null);
  const [lvlUp, setLvlUp] = useState(false);
  const [zoom, setZoom] = useState<Zoom>(() => (isGeo(item.q) ? defaultZoom(item.q.region) : "world"));
  const done = picked !== null;
  const q = item.q;
  const ok = done && q.choices[picked!] === q.answer;
  useEffect(() => debugQuestion({ answer: q.answer, prompt: q.prompt, choices: q.choices }), [q]);

  const choose = useCallback((i: number) => {
    if (picked !== null) return;
    const good = q.choices[i] === q.answer;
    const before = levelOf(item.topic);
    record(item.topic, item.level, good);
    const up = good && levelOf(item.topic) > before;
    setPicked(i); setLvlUp(up);
    setRound((r) => roundAnswer(r, good, up));
    audio.play(up ? "levelup" : good ? "correct" : "wrong");
    if (!good && isGeo(q) && q.mode !== "flag") setZoom("close"); // wrong: zoom in on the answer
  }, [picked, q, item]);

  const next = () => {
    if (isComplete(round)) { nav.showResult(resultOf(round, title, daily)); return; }
    const it = getItem(round.answered);
    setItem(it); setPicked(null); setLvlUp(false);
    setZoom(isGeo(it.q) ? defaultZoom(it.q.region) : "world");
  };
  const last = isComplete(round);
  const rows = [q.choices.slice(0, 2), q.choices.slice(2, 4)];
  const geo = isGeo(q) ? q : null;
  const showMap = geo && geo.mode !== "flag";
  return (
    <Frame title={title} level={showLevel ? item.level : undefined} streak={showLevel ? streakOf(item.topic) : undefined} need={showLevel ? STREAK_NEEDED : undefined}
      right={<Text style={styles.count} accessibilityLabel={`Question ${Math.min(round.answered + (done ? 0 : 1), total)} of ${total}`}>{Math.min(round.answered + (done ? 0 : 1), total)} / {total}</Text>}
      hint={done ? "OK: continue" : showMap ? "Arrows: choose    OK: answer    Down: zoom the map    Back: home" : "Arrows: choose    OK: answer    Back: home"}>
      {lvlUp && <Confetti />}
      <View style={styles.row}>
        <View style={styles.left}>
          {showMap && geo && (
            <View style={styles.map}>
              <MapView target={geo.country} zoom={zoom} width={px(860)} />
              <View style={styles.zoomTag}><Text style={styles.zoomText}>🔍 {ZOOM_LABEL[zoom]}</Text></View>
            </View>
          )}
          {geo && geo.mode === "flag" && (
            <View style={[styles.map, styles.flagBox]} accessibilityLabel="A country flag"><Text style={styles.flag}>{geo.flag}</Text></View>
          )}
          {!geo && (
            <View style={[styles.map, styles.flagBox]}><Text style={styles.big} accessibilityLiveRegion="polite">{q.prompt.replace(/ = \?$/, "")}{/[+−×x=]/.test(q.prompt) && !q.prompt.includes("=") ? " = ?" : ""}</Text></View>
          )}
        </View>
        <View style={styles.right}>
          {geo && <Text style={styles.prompt} accessibilityLiveRegion="polite">{q.prompt}</Text>}
          {!geo && <Text style={styles.prompt}>{/x/.test(q.prompt) && q.prompt.includes("=") ? "What is x?" : "What is the answer?"}</Text>}
          <SpatialNavigationRoot key={`${round.answered}-${done}`}>
            <SpatialNavigationView direction="vertical">
              {rows.map((row, r) => (
                <SpatialNavigationView key={r} direction="horizontal" style={styles.choiceRow}>
                  {row.map((c, j) => {
                    const i = r * 2 + j;
                    const state = done ? (c === q.answer ? "right" : i === picked ? "wrong" : "dim") : "";
                    const node = (
                      <Focus key={c} onSelect={() => choose(i)} label={`${c}${state === "right" ? ", correct" : state === "wrong" ? ", wrong" : ""}`}
                        style={{ ...styles.choice, ...(state === "right" ? styles.rightBg : state === "wrong" ? styles.wrongBg : state === "dim" ? styles.dim : {}) }}>
                        {() => <Text style={[styles.choiceText, !!state && state !== "dim" && { color: colors.ink }]} numberOfLines={2}>{state === "right" ? "✓ " : state === "wrong" ? "✗ " : ""}{c}</Text>}
                      </Focus>
                    );
                    return i === 0 && !done ? <DefaultFocus key={c}>{node}</DefaultFocus> : node;
                  })}
                </SpatialNavigationView>
              ))}
              {showMap && !done && (
                <FocusButton text={`Zoom: ${ZOOM_LABEL[zoom]}`} icon="🔍" onSelect={() => setZoom(nextZoom(zoom))} style={{ alignSelf: "flex-start", minWidth: px(360), paddingVertical: px(14) }} />
              )}
            </SpatialNavigationView>
            {done && (
              <View style={styles.verdictRow} accessibilityLiveRegion="polite">
                <DefaultFocus><FocusButton text={last ? "See results" : "Next"} primary onSelect={next} /></DefaultFocus>
                <Pop key={`${round.answered}`}><Text style={[styles.verdict, { color: ok ? colors.right : colors.wrong }]}>{ok ? (lvlUp ? "Level up! 🎉" : "Correct!") : `It's ${q.answer}`}</Text></Pop>
              </View>
            )}
          </SpatialNavigationRoot>
        </View>
      </View>
    </Frame>
  );
}

const styles = StyleSheet.create({
  count: { color: colors.textDim, fontSize: px(font.body), fontWeight: "800" },
  row: { flexDirection: "row", alignItems: "center" },
  left: { width: px(880) },
  map: { alignSelf: "center", borderRadius: px(radius.card), overflow: "hidden", borderWidth: px(4), borderColor: colors.card },
  zoomTag: { position: "absolute", left: px(16), bottom: px(16), backgroundColor: "rgba(11,21,51,0.8)", paddingHorizontal: px(20), paddingVertical: px(6), borderRadius: px(30) },
  zoomText: { color: colors.text, fontSize: px(font.small), fontWeight: "800" },
  flagBox: { width: px(860), height: px(538), alignItems: "center", justifyContent: "center", backgroundColor: colors.card },
  flag: { fontSize: px(340) },
  big: { color: colors.text, fontSize: px(150), fontWeight: "900" },
  right: { flex: 1, marginLeft: px(48) },
  prompt: { color: colors.text, fontSize: px(font.title - 6), fontWeight: "900", marginBottom: px(24) },
  choiceRow: { marginBottom: px(22) },
  choice: { width: px(400), height: px(140), justifyContent: "center", alignItems: "center", marginRight: px(24) },
  choiceText: { color: colors.text, fontSize: px(font.body + 6), fontWeight: "800", textAlign: "center" },
  rightBg: { backgroundColor: colors.right }, wrongBg: { backgroundColor: colors.wrong }, dim: { opacity: 0.4 },
  verdictRow: { marginTop: px(20), flexDirection: "row", alignItems: "center" },
  verdict: { fontSize: px(font.title - 8), fontWeight: "900", marginLeft: px(32) },
});
