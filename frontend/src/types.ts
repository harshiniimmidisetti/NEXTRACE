/** Shared domain types for NEXTRACE. All data in the demo is synthetic. */

export type AgentName = 'SCOUT' | 'VERITY' | 'ARCHIVE' | 'CIPHER' | 'CHRONICLE';

export type VerificationStatus =
  | 'Verified'
  | 'Partially Verified'
  | 'Needs Human Review'
  | 'Unverified'
  | 'Failed';

export type Role = 'police' | 'investigator' | 'admin';
export type FindingKind = 'Fact' | 'Indicator' | 'Hypothesis';
export type RiskLevel = 'High' | 'Medium' | 'Low';
export type IndicatorKind = 'ip' | 'domain' | 'url' | 'email';
export type WorkspaceTab =
  | 'workflow'
  | 'evidence'
  | 'findings'
  | 'graph'
  | 'timeline'
  | 'assistant'
  | 'records'
  | 'report';

/** One evidence file held in the case. */
export interface Evidence {
  id: string;
  name: string;
  type: string;
  source: string;
  uploadedBy: string;
  uploaded: string;
  content: string;
  size?: number;
  /** Raw bytes for binary uploads (PDF, images). */
  bytes?: Uint8Array | null;
  /** Content the recorded hash was taken from, when it differs from `content`. */
  recordedFrom?: string;
  recordedHash?: string | null;
  computedHash?: string;
  status?: VerificationStatus;
  reasons?: string[];
  demo?: boolean;
  external?: boolean;
}

export interface VerifyResult {
  computedHash: string;
  recordedHash: string | null;
  status: VerificationStatus;
  reasons: string[];
}

export interface Indicators {
  ips: string[];
  urls: string[];
  emails: string[];
  domains: string[];
}

export interface LogEvent {
  time: string;
  level: string;
  msg: string;
  ip?: string;
  user?: string;
}

export interface Finding {
  title: string;
  kind: FindingKind;
  evidence: string[];
  risk: RiskLevel;
  confidence: number;
  description: string;
  reason: string;
  verification: VerificationStatus | string;
  next: string;
}

export interface GraphNode {
  id: string;
  label: string;
  kind: 'evidence' | IndicatorKind;
  detail: string;
  shared?: boolean;
}

export interface GraphEdge {
  from: string;
  to: string;
  why: string;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface TimelineRow {
  time: string;
  text: string;
  ev: string;
  st: string;
  conf: string;
}

export interface LedgerEntry {
  n: number;
  time: string;
  actor: string;
  action: string;
  detail: string;
  prev: string;
  hash: string;
}

export type LedgerResult =
  | { ok: true; brokenAt: null; count: number }
  | { ok: false; brokenAt: number };

/** Read-only view of the case that the deterministic assistant answers from. */
export interface CaseSnapshot {
  findings: Finding[];
  evidence: Evidence[];
  timeline: TimelineRow[];
  graph: Graph;
  ledgerCount: number;
  ledgerOk: boolean;
}

export interface AgentState {
  status: string;
  progress: number;
  last: string;
  logs: string[];
  error: string;
}

export interface ChatMessage {
  r: 'u' | 'a';
  t: string;
  agent?: AgentName;
  mode?: string;
  err?: boolean;
  retry?: string;
}

export interface CaseSummary {
  id: number;
  case_code: string;
  title: string;
}

export interface NextraceConfig {
  apiUrl: string;
}
