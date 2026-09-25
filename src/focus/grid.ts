// Pure spatial focus manager for D-pad UIs. Nodes sit on a row/col grid; moving picks the
// nearest node in the pressed direction (prefers same row/col, then smallest distance).
export type Dir = "left" | "right" | "up" | "down";
export interface FocusNode { id: string; row: number; col: number; disabled?: boolean }

export function moveFocus(nodes: FocusNode[], current: string, dir: Dir): string {
  const cur = nodes.find((n) => n.id === current);
  if (!cur) return firstFocusable(nodes) ?? current;
  const dr = dir === "down" ? 1 : dir === "up" ? -1 : 0;
  const dc = dir === "right" ? 1 : dir === "left" ? -1 : 0;
  let best: FocusNode | undefined; let bestScore = Infinity;
  for (const n of nodes) {
    if (n.id === cur.id || n.disabled) continue;
    const forward = (n.row - cur.row) * dr + (n.col - cur.col) * dc;
    if (forward <= 0) continue;
    const lateral = dr !== 0 ? Math.abs(n.col - cur.col) : Math.abs(n.row - cur.row);
    const score = lateral * 100 + forward;
    if (score < bestScore) { best = n; bestScore = score; }
  }
  return best ? best.id : cur.id; // edge: stay put, never lose focus
}

export const firstFocusable = (nodes: FocusNode[]) => nodes.find((n) => !n.disabled)?.id;
