/** Agent actions: SCOUT imports, VERITY verifies, CIPHER analyses, CHRONICLE reports. */
import {
  analyze,
  buildGraph,
  buildTimeline,
  byteLength,
  classifyText,
  extractIndicators,
  SEED_EVIDENCE,
  sha256,
  verify,
} from '../core/index.js';
import { toast } from '../lib/dom.js';
import { invalidateReport, log, nextEvidenceId, setAgent, today } from '../state/records.js';
import { refresh, W } from '../state/store.js';
import type { AgentName, Evidence } from '../types.js';

export const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'txt', 'eml', 'csv', 'json', 'log'];
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const BINARY_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];

/** Mark an agent as failed, log why, and redraw. */
export function fail(agent: AgentName, message: string): void {
  W.agents[agent].error = message;
  setAgent(agent, 'Failed', 0);
  log(agent, `ERROR: ${message}`);
  refresh();
}

export async function runScout(): Promise<void> {
  const agent = 'SCOUT';
  setAgent(agent, 'Running', 30);
  log(agent, 'Importing DEMO DATA evidence set (synthetic)');
  const have = new Set(W.evidence.map((e) => e.id));
  for (const seed of SEED_EVIDENCE) {
    if (have.has(seed.id)) continue;
    const ev: Evidence = { ...seed, size: byteLength(seed.content), demo: true };
    ev.recordedFrom ??= ev.content; // the hash was recorded at intake
    W.evidence.push(ev);
    log(agent, `Imported ${ev.id} ${ev.name}`);
  }
  log(
    agent,
    'Live sources (PhishTank, OpenPhish, CIC-IDS2017) not connected: skipped, nothing fabricated',
  );
  setAgent(agent, 'Completed', 100);
  refresh();
}

export async function runVerity(): Promise<void> {
  const agent = 'VERITY';
  if (!W.evidence.length) return fail(agent, 'No evidence yet. Run SCOUT or upload a file first.');
  setAgent(agent, 'Running', 40);
  for (const ev of W.evidence) ev.computedHash = await sha256(ev.bytes ?? ev.content);
  for (const ev of W.evidence) {
    Object.assign(ev, await verify(ev, W.evidence));
    log(agent, `${ev.id}: ${ev.status}`);
  }
  W.reviewed = false;
  setAgent(agent, 'Completed', 100);
  refresh();
}

/** The human investigator confirms the verified evidence before analysis. */
export function review(): void {
  if (!W.evidence.some((e) => e.status)) {
    return fail('VERITY', 'Run VERITY before the investigator review.');
  }
  W.reviewed = true;
  refresh();
}

export function runCipher(): void {
  const agent = 'CIPHER';
  if (!W.reviewed)
    return fail(agent, 'Investigator review of verified evidence is required first.');
  setAgent(agent, 'Running', 50);
  W.findings = analyze(W.evidence);
  W.graph = buildGraph(W.evidence);
  W.timeline = buildTimeline(W.evidence);
  log(
    agent,
    `${W.findings.length} findings, ${W.graph.edges.length} relationships, ${W.timeline.length} timeline events`,
  );
  setAgent(agent, 'Completed', 100);
  refresh();
}

export function runChronicle(): void {
  const agent = 'CHRONICLE';
  if (!W.findings.length) return fail(agent, 'No CIPHER findings yet.');
  W.report = true;
  W.approved = false;
  log(agent, 'Draft report ready. Investigator approval required.');
  setAgent(agent, 'Awaiting approval', 90);
  refresh();
}

export function approveReport(): void {
  W.approved = true;
  setAgent('CHRONICLE', 'Completed', 100);
  log('CHRONICLE', 'Report approved by investigator');
  refresh();
}

/** File a new item: ARCHIVE stores it, SCOUT imports it, then the caller runs VERITY. */
function fileEvidence(ev: Evidence, description: string): void {
  W.evidence.push(ev);
  log('ARCHIVE', `${description} ${ev.id}, SHA-256 ${ev.computedHash!.slice(0, 12)}...`);
  log('SCOUT', `Imported ${ev.id}`);
  invalidateReport();
}

/** Read and hash an uploaded file (never executed). Returns the new evidence ID, or undefined. */
export async function uploadFile(file: File): Promise<string | undefined> {
  const ext = (file.name.split('.').pop() ?? '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    toast(`File type not allowed. Use: ${ALLOWED_EXTENSIONS.join(', ')}`);
    return undefined;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    toast('File is over the 5 MB limit.');
    return undefined;
  }
  const bytes = new Uint8Array(await file.arrayBuffer());
  const binary = BINARY_EXTENSIONS.includes(ext);
  const hash = await sha256(bytes);
  const id = nextEvidenceId();
  fileEvidence(
    {
      id,
      name: file.name,
      type: ext.toUpperCase(),
      size: file.size,
      source: 'Uploaded in session',
      uploadedBy: 'You',
      uploaded: today(),
      content: binary ? '' : new TextDecoder().decode(bytes),
      bytes: binary ? bytes : null,
      computedHash: hash,
      recordedHash: hash,
    },
    'Filed upload',
  );
  await runVerity();
  return id;
}

export interface ExternalData {
  text: string;
  name: string;
  source: string;
}

/** Data pasted from another source: ARCHIVE files it, SCOUT imports it, VERITY verifies it. */
export async function fileExternalData(
  data: ExternalData,
): Promise<{ id: string; summary: string } | null> {
  if (data.text.trim().length < 10) {
    toast('Paste some data first.');
    return null;
  }
  const name = data.name.trim() || 'pasted_data.txt';
  const source = data.source.trim() || 'Provided by user (external source)';
  const type = classifyText(data.text);
  const hash = await sha256(data.text);
  const id = nextEvidenceId();
  fileEvidence(
    {
      id,
      name,
      type,
      size: byteLength(data.text),
      source,
      uploadedBy: 'You',
      uploaded: today(),
      content: data.text,
      computedHash: hash,
      recordedHash: hash,
      external: true,
    },
    `Filed external data (${type}) from "${source}"`,
  );
  await runVerity();
  const status = W.evidence.find((e) => e.id === id)?.status;
  const found = extractIndicators(data.text);
  return {
    id,
    summary:
      `ARCHIVE filed ${id} (${type}) from "${source}". SHA-256 ${hash.slice(0, 16)}... VERITY result: ${status}.\n` +
      `Indicators found (facts only): IPs ${found.ips.join(', ') || 'none'}; domains ${found.domains.join(', ') || 'none'}.\n` +
      'It needs investigator review before CIPHER includes it: press "Review and analyze now".',
  };
}

/** Investigator review followed by an immediate CIPHER re-run. Returns a chat message or null. */
export function reviewAndAnalyze(): string | null {
  review();
  if (!W.reviewed) return null;
  runCipher();
  return `Review recorded. CIPHER re-ran on all ${W.evidence.length} evidence files: ${W.findings.length} findings, ${W.timeline.length} timeline events.`;
}
