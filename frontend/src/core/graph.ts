/** Relationship graph: evidence files linked to the indicators found inside them. */
import type { Evidence, Graph, GraphEdge, GraphNode, IndicatorKind } from '../types.js';
import { extractIndicators } from './indicators.js';

export function buildGraph(evidence: readonly Evidence[]): Graph {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  for (const ev of evidence) {
    nodes.set(ev.id, {
      id: ev.id,
      label: ev.id,
      kind: 'evidence',
      detail: `${ev.name} (${ev.status ?? 'unverified'})`,
    });
    const found = extractIndicators(ev.content);
    const groups: Array<[IndicatorKind, string[]]> = [
      ['ip', found.ips],
      ['domain', found.domains],
      ['url', found.urls],
      ['email', found.emails],
    ];
    for (const [kind, values] of groups) {
      for (const value of values) {
        const id = `${kind}:${value}`;
        if (!nodes.has(id)) nodes.set(id, { id, label: value, kind, detail: '' });
        edges.push({ from: ev.id, to: id, why: `${value} appears in ${ev.name} (${ev.id}).` });
      }
    }
  }

  for (const node of nodes.values()) {
    if (node.kind === 'evidence') continue;
    const sources = edges.filter((e) => e.to === node.id).map((e) => e.from);
    node.detail = `Found in: ${sources.join(', ')}`;
    node.shared = sources.length > 1;
  }
  return { nodes: [...nodes.values()], edges };
}
