import React, { useEffect, useReducer, useRef, useState } from "react";
import { back, current, go, initialNav, type Nav, type Screen } from "../nav.js";
import { moveFocus, type FocusNode } from "../focus/grid.js";
import { mapKey, type RemoteKey } from "./keys.js";
import { AbacusScreen, BalanceScreen, QuizScreen } from "./games.js";
import { ProgressSync } from "../progress/sync.js";
import { MockProgressClient } from "../progress/mock.js";

const TILES: (FocusNode & { screen: Screen; title: string; sub: string; icon: string })[] = [
  { id: "abacus", row: 0, col: 0, screen: "abacus", title: "Abacus", sub: "Slide the beads", icon: "🧮" },
  { id: "geography", row: 0, col: 1, screen: "geography", title: "Map Quiz", sub: "Countries and capitals", icon: "🌍" },
  { id: "algebra", row: 0, col: 2, screen: "algebra", title: "Balance Scales", sub: "Find x", icon: "⚖️" },
];

export const sync = new ProgressSync(new MockProgressClient(), "demo-learner");

export function App() {
  const [nav, setNav] = useState<Nav>(initialNav());
  const [focus, setFocus] = useState("abacus");
  const [, bump] = useReducer((x: number) => x + 1, 0);
  const gameKey = useRef<((k: RemoteKey) => void) | null>(null);
  const navRef = useRef(nav); navRef.current = nav;
  const focusRef = useRef(focus); focusRef.current = focus;

  useEffect(() => { void sync.load().then(bump); }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = mapKey(e.code); if (!k) return; e.preventDefault();
      const scr = current(navRef.current);
      if (k === "back") { void sync.flush(); setNav((n) => back(n)); return; }
      if (scr === "home") {
        if (k === "select") setNav((n) => go(n, TILES.find((t) => t.id === focusRef.current)!.screen));
        else setFocus(moveFocus(TILES, focusRef.current, k));
      } else gameKey.current?.(k);
    };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, []);

  const scr = current(nav);
  const onResult = (t: "abacus" | "geography" | "algebra", level: number, ok: boolean) => { sync.record(t, level, ok); bump(); void sync.flush(); };
  return (
    <div className="stage"><div className="safe">
      {scr === "home" && (
        <main>
          <header><h1>Learn &amp; Play</h1><p className="hint">Use the arrows to choose, OK to start</p></header>
          <div className="tiles">
            {TILES.map((t) => {
              const p = sync.progress[t.screen as "abacus"];
              return (
                <button key={t.id} className={`tile t-${t.id} ${focus === t.id ? "focused" : ""}`} tabIndex={-1} onMouseEnter={() => setFocus(t.id)} onClick={() => setNav((n) => go(n, t.screen))}>
                  <span className="icon" aria-hidden>{t.icon}</span><span className="title">{t.title}</span><span className="sub">{t.sub}</span>
                  <span className="lvl">Level {sync.currentLevel(t.screen as "abacus")}{p ? ` · ${p.correct}/${p.attempts} right` : ""}</span>
                </button>);
            })}
          </div>
          <footer>Back: Esc / Backspace</footer>
        </main>)}
      {scr === "abacus" && <AbacusScreen key="a" register={(f) => (gameKey.current = f)} level={sync.currentLevel("abacus")} onResult={(l, ok) => onResult("abacus", l, ok)} />}
      {scr === "geography" && <QuizScreen key="g" register={(f) => (gameKey.current = f)} level={sync.currentLevel("geography")} onResult={(l, ok) => onResult("geography", l, ok)} />}
      {scr === "algebra" && <BalanceScreen key="x" register={(f) => (gameKey.current = f)} level={sync.currentLevel("algebra")} onResult={(l, ok) => onResult("algebra", l, ok)} />}
    </div></div>
  );
}
