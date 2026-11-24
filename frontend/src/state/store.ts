/**
 * Single source of truth for the case workspace (DEMO MODE: held in memory).
 * Mutations happen in services; the UI re-renders through `refresh()`.
 */
import type {
  AgentName,
  AgentState,
  CaseSnapshot,
  CaseSummary,
  ChatMessage,
  Evidence,
  Finding,
  Graph,
  GraphNode,
  LedgerEntry,
  TimelineRow,
  WorkspaceTab,
} from '../types.js';

export const AGENT_NAMES: readonly AgentName[] = [
  'SCOUT',
  'VERITY',
  'ARCHIVE',
  'CIPHER',
  'CHRONICLE',
];

export interface Workspace {
  tab: WorkspaceTab;
  evidence: Evidence[];
  findings: Finding[];
  timeline: TimelineRow[];
  graph: Graph;
  reviewed: boolean;
  approved: boolean;
  /** True once CHRONICLE has produced a draft report. */
  report: boolean;
  agents: Record<AgentName, AgentState>;
  chat: ChatMessage[];
  selectedNode: GraphNode | null;
  ledger: LedgerEntry[];
  ledgerOk: boolean;
  ledgerMsg: string;
  speak: boolean;
  listening: boolean;
  typing: boolean;
  token: string | null;
  caseId: number | null;
  cases: CaseSummary[];
  panelOpen: boolean;
  nexaVisible: boolean;
  route: string;
  /** Unsent text in the chat inputs, kept across re-renders. */
  draft: Record<string, string>;
}

const newAgent = (): AgentState => ({
  status: 'Not started',
  progress: 0,
  last: '-',
  logs: [],
  error: '',
});

function createWorkspace(): Workspace {
  const agents = Object.fromEntries(AGENT_NAMES.map((n) => [n, newAgent()])) as Record<
    AgentName,
    AgentState
  >;
  Object.assign(agents.ARCHIVE, { status: 'Active', progress: 100, last: 'Ledger started' });
  return {
    tab: 'workflow',
    evidence: [],
    findings: [],
    timeline: [],
    graph: { nodes: [], edges: [] },
    reviewed: false,
    approved: false,
    report: false,
    agents,
    chat: [],
    selectedNode: null,
    ledger: [],
    ledgerOk: true,
    ledgerMsg: '',
    speak: false,
    listening: false,
    typing: false,
    token: null,
    caseId: null,
    cases: [],
    panelOpen: false,
    nexaVisible: false,
    route: '',
    draft: {},
  };
}

export const W: Workspace = createWorkspace();

/** The slice of state the deterministic assistant reads from. */
export const snapshot = (): CaseSnapshot => ({
  findings: W.findings,
  evidence: W.evidence,
  timeline: W.timeline,
  graph: W.graph,
  ledgerCount: W.ledger.length,
  ledgerOk: W.ledgerOk,
});

/* ---------- Re-render hook (registered by the UI layer) ---------- */

let renderer: () => void = () => {};
export const setRenderer = (fn: () => void): void => {
  renderer = fn;
};
export const refresh = (): void => renderer();
