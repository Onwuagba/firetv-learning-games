import React, { useEffect, useRef, useState } from "react";
import { makeQuestion, maxLevel, type Question } from "../curriculum.js";
import * as A from "../games/abacus.js";
import * as Q from "../games/quiz.js";
import * as B from "../games/balance.js";
import type { RemoteKey } from "./keys.js";

interface Props { register: (f: (k: RemoteKey) => void) => void; level: number; onResult: (level: number, ok: boolean) => void }

/** Keep latest state in a ref so the single window key handler never sees stale closures. */
function useKeys<S>(init: () => S, register: Props["register"], handler: (s: S, k: RemoteKey) => S) {
  const [s, setS] = useState(init); const ref = useRef(s); ref.current = s;
  useEffect(() => { register((k) => { const n = handler(ref.current, k); ref.current = n; setS(n); }); });
  return s;
}

function Top({ title, level, hint }: { title: string; level: number; hint: string }) {
  return <header className="gtop"><h2>{title}</h2><span className="pill">Level {level}</span><span className="hint">{hint}</span></header>;
}

export function QuizScreen({ register, level, onResult }: Props) {
  const s = useKeys(() => Q.newQuiz("geography", level), register, (s, k) => {
    if (k === "select") { if (s.picked === null) { const n = Q.submit(s); onResult(s.level, Q.isCorrect(n)); return n; } return Q.next(s); }
    if (k === "back") return s;
    return Q.moveChoice(s, k);
  });
  const done = s.picked !== null;
  return (
    <main className="game">
      <Top title="Map Quiz" level={s.level} hint={done ? "Press OK for next" : "Choose with arrows, OK to answer"} />
      <div className="prompt">{s.question.prompt}</div>
      <div className="choices">
        {s.question.choices.map((c, i) => {
          const state = done ? (c === s.question.answer ? "right" : i === s.picked ? "wrong" : "dim") : "";
          return <div key={c} className={`choice ${i === s.focus ? "focused" : ""} ${state}`}>{c}</div>;
        })}
      </div>
      <div className="status" aria-live="polite">{done ? (Q.isCorrect(s) ? (s.leveledUp ? "Level up! 🎉" : "Correct!") : `It's ${s.question.answer}`) : `Streak ${s.streak}/${Q.STREAK_TO_LEVEL_UP}`}</div>
    </main>
  );
}

export function AbacusScreen({ register, level, onResult }: Props) {
  const mk = (lv: number) => { const q = makeQuestion("abacus", lv); const max = [10, 10, 20, 20, 100][lv - 1] ?? 10; return { q, lv, ab: A.newAbacus(A.rodCount(max)), result: null as null | boolean }; };
  const s = useKeys(() => mk(level), register, (s, k) => {
    if (k === "back") return s;
    if (k === "select") {
      if (s.result !== null) return mk(s.result && s.lv < maxLevel("abacus") && Math.random() < 0.34 ? s.lv + 1 : s.lv);
      const ok = A.isCorrect(s.ab, s.q.answer); onResult(s.lv, ok); return { ...s, result: ok };
    }
    return s.result === null ? { ...s, ab: A.press(s.ab, k) } : s;
  });
  const names = ["Ones", "Tens", "Hundreds"];
  return (
    <main className="game">
      <Top title="Abacus" level={s.lv} hint="Left/Right: rod · Up/Down: beads · OK: check" />
      <div className="prompt">{s.q.prompt}{s.q.prompt.includes("+") || s.q.prompt.includes("−") ? " = ?" : ""}</div>
      <div className="abacus">
        {[...s.ab.rods.keys()].reverse().map((i) => (
          <div key={i} className={`rod ${s.ab.cursor === i ? "focused" : ""}`}>
            <div className="beads">{Array.from({ length: 9 }, (_, b) => <span key={b} className={`bead ${b < s.ab.rods[i] ? "on" : ""}`} />)}</div>
            <div className="rlabel">{names[i]}</div><div className="rval">{s.ab.rods[i]}</div>
          </div>))}
        <div className="total"><span>Total</span><strong>{A.value(s.ab)}</strong></div>
      </div>
      <div className={`status ${s.result === null ? "" : s.result ? "ok" : "bad"}`} aria-live="polite">{s.result === null ? "" : s.result ? "Correct! Press OK for next" : `Not quite. It's ${s.q.answer}. Press OK`}</div>
    </main>
  );
}

export function BalanceScreen({ register, level, onResult }: Props) {
  const s = useKeys(() => B.newBalance(Math.min(level, maxLevel("algebra"))), register, (s, k) => {
    if (k === "back") return s;
    if (k === "select") { if (s.solved) return B.newBalance(s.question.level); const n = B.check(s); onResult(s.question.level, n.solved); return n; }
    return B.adjust(s, k);
  });
  const deg = B.tiltDegrees(s.eq, s.guess);
  const { a, b, c } = s.eq;
  return (
    <main className="game">
      <Top title="Balance Scales" level={s.question.level} hint="Up/Down: change x · OK: check" />
      <div className="prompt">{s.question.prompt}</div>
      <div className="scale">
        <div className="beam" style={{ transform: `rotate(${-deg}deg)` }}>
          <div className="pan left"><div className="blocks">{Array.from({ length: a }, (_, i) => <span key={i} className="xblock">{s.guess}</span>)}</div>{b > 0 && <span className="unit">+{b}</span>}</div>
          <div className="pan right"><span className="unit big">{c}</span></div>
        </div>
        <div className="stand" />
      </div>
      <div className="xpick focused">x = {s.guess}</div>
      <div className={`status ${s.solved ? "ok" : ""}`} aria-live="polite">{s.solved ? "Balanced! x = " + s.guess : B.imbalance(s.eq, s.guess) > 0 ? "Left side is heavier" : "Right side is heavier"}</div>
    </main>
  );
}
export type { Question };
