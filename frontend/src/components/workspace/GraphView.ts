import { esc } from '../../lib/dom.js';
import { W } from '../../state/store.js';
import type { GraphNode } from '../../types.js';

const COLUMN_X: Record<GraphNode['kind'], number> = {
  evidence: 90,
  ip: 380,
  domain: 650,
  url: 650,
  email: 650,
};
const COLOR: Record<GraphNode['kind'], string> = {
  evidence: '#7563C9',
  ip: '#D99B38',
  domain: '#D65C68',
  url: '#D65C68',
  email: '#269B70',
};
const ROW_HEIGHT = 52;
const NODE_HEIGHT = 28;

const columnOf = (kind: GraphNode['kind']) =>
  kind === 'evidence' ? 'evidence' : kind === 'ip' ? 'ip' : 'other';

/** Three-column SVG: evidence on the left, IPs in the middle, other indicators on the right. */
export function graphSvg(): string {
  const { nodes, edges } = W.graph;
  if (!nodes.length) return '<p class="muted">Run CIPHER to build the relationship graph.</p>';

  const rowsUsed: Record<string, number> = {};
  const pos: Record<string, { x: number; y: number }> = {};
  for (const n of nodes) {
    const col = columnOf(n.kind);
    const row = rowsUsed[col] ?? 0;
    rowsUsed[col] = row + 1;
    pos[n.id] = { x: COLUMN_X[n.kind], y: 30 + row * ROW_HEIGHT };
  }
  const height = Math.max(...Object.values(pos).map((p) => p.y)) + 50;

  const lines = edges
    .map((e) => {
      const from = pos[e.from]!;
      const to = pos[e.to]!;
      return `<line x1="${from.x + 60}" y1="${from.y + 14}" x2="${to.x}" y2="${to.y + 14}" stroke="#C8BDF4" stroke-width="1.5"/>`;
    })
    .join('');
  const boxes = nodes
    .map((n) => {
      const p = pos[n.id]!;
      const label = n.label.length > 26 ? `${n.label.slice(0, 25)}…` : n.label;
      return `<g class="nd" data-node="${esc(n.id)}" tabindex="0"><rect x="${p.x}" y="${p.y}" width="${n.kind === 'evidence' ? 60 : 170}" height="${NODE_HEIGHT}" rx="8" fill="${COLOR[n.kind]}22" stroke="${COLOR[n.kind]}" stroke-width="${n.shared ? 3 : 1.5}"/><text x="${p.x + 8}" y="${p.y + 18}">${esc(label)}</text></g>`;
    })
    .join('');
  return `<div class="scroll"><svg class="gsvg" viewBox="0 0 820 ${height}" width="820" height="${height}" role="img" aria-label="Evidence relationship graph">${lines}${boxes}</svg></div>
    <p class="muted-sm">Thick outline = indicator shared by more than one evidence file. Click a node for details.</p>`;
}
