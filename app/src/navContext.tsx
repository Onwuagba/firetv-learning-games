import React, { useContext } from "react";
import type { Badge } from "../../src/motivation";
import type { RoundResult } from "../../src/games/round";

export interface AppNav {
  go(screen: string): void;
  replace(screen: string): void;
  back(): void;
  /** Open `screen` after the parent passes the math gate. */
  gated(screen: string): void;
  /** Finish a round: awards stars/badges, then shows the results screen. */
  showResult(r: RoundResult): void;
  depth: number;
}
export const NavCtx = React.createContext<AppNav>({ go() {}, replace() {}, back() {}, gated() {}, showResult() {}, depth: 1 });
export const useNav = () => useContext(NavCtx);
export type { Badge, RoundResult };
