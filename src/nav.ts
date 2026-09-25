// Screen navigation. BACK always pops toward home; on home it is a no-op (system handles exit).
export type Screen = "home" | "abacus" | "geography" | "algebra";
export interface Nav { stack: Screen[] }
export const initialNav = (): Nav => ({ stack: ["home"] });
export const current = (n: Nav): Screen => n.stack[n.stack.length - 1];
export const go = (n: Nav, s: Screen): Nav => (current(n) === s ? n : { stack: [...n.stack, s] });
export const back = (n: Nav): Nav => (n.stack.length > 1 ? { stack: n.stack.slice(0, -1) } : n);
export const atHome = (n: Nav) => n.stack.length === 1;
