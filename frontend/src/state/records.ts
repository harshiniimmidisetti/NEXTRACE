/** Activity logging and the ARCHIVE ledger chain. */
import { ledgerAppend } from '../core/index.js';
import type { AgentName } from '../types.js';
import { refresh, W } from './store.js';

export const now = (): string => new Date().toLocaleTimeString();
export const today = (): string => new Date().toISOString().slice(0, 10);

/** ARCHIVE appends entries one at a time so the hash chain stays ordered. */
let chain: Promise<unknown> = Promise.resolve();

/** Resolves once every queued ledger write has finished. */
export const ledgerIdle = (): Promise<unknown> => chain;

/** Queue an entry for the ledger. */
export function record(actor: string, action: string, detail: string): void {
  chain = chain
    .then(() => ledgerAppend(W.ledger, actor, action, detail))
    .then(() => {
      if (W.tab === 'records') refresh();
    });
}

/** Write to an agent's visible log and to the ledger. */
export function log(agent: AgentName, message: string): void {
  W.agents[agent].logs.push(`[${now()}] ${message}`);
  record(agent, 'activity', message);
}

export function setAgent(agent: AgentName, status: string, progress: number): void {
  Object.assign(W.agents[agent], { status, progress, last: now() });
}

export const nextEvidenceId = (): string => `EV-${String(W.evidence.length + 1).padStart(4, '0')}`;

/** New evidence makes an existing report stale, so it goes back to draft. */
export function invalidateReport(): void {
  if (!W.report) return;
  W.report = false;
  W.approved = false;
  log('CHRONICLE', 'Report invalidated: new evidence was added. Regenerate after review.');
}

record('ARCHIVE', 'ledger_created', 'Case NXT-2026-0001 records ledger started');
