/** Delegated event handling for the workspace and NEXA (clicks, form submits, file inputs). */
import { toast, $ } from '../lib/dom.js';
import {
  approveReport,
  fileExternalData,
  reviewAndAnalyze,
  review,
  runChronicle,
  runCipher,
  runScout,
  runVerity,
  uploadFile,
} from '../services/agents.js';
import { exportLedger, simulateTampering, verifyLedger } from '../services/ledger.js';
import { ask, reply, startVoiceInput } from '../services/nexa.js';
import { downloadPdf } from '../services/report.js';
import { refresh, W } from '../state/store.js';
import type { WorkspaceTab } from '../types.js';
import { syncNexa } from './mount.js';

const valueOf = (selector: string): string => $<HTMLInputElement>(selector)?.value ?? '';

/** Go to the case page, or just redraw if we are already on it. */
function showCase(tab: WorkspaceTab, redrawWidget: boolean): void {
  W.tab = tab;
  W.panelOpen = false;
  if (location.hash === '#case') {
    if (redrawWidget) syncNexa('case');
    refresh();
  } else {
    location.hash = 'case';
  }
}

async function sendToArchive(): Promise<void> {
  const result = await fileExternalData({
    text: valueOf('#dt'),
    name: valueOf('#dn'),
    source: valueOf('#ds'),
  });
  if (result) reply(result.summary);
}

function reviewThenAnalyze(): void {
  const message = reviewAndAnalyze();
  if (message) reply(message);
}

/** Every `data-w="..."` button maps to one of these. */
const ACTIONS: Record<string, () => unknown> = {
  nexatoggle: () => {
    W.panelOpen = !W.panelOpen;
    refresh();
  },
  nexafull: () => showCase('assistant', true),
  nexaclear: () => {
    W.chat = [];
    refresh();
  },
  openev: () => showCase('evidence', false),
  speak: () => {
    W.speak = !W.speak;
    refresh();
  },
  scout: runScout,
  verity: runVerity,
  review,
  cipher: runCipher,
  chronicle: runChronicle,
  approve: approveReport,
  pdf: downloadPdf,
  mic: startVoiceInput,
  reviewcipher: reviewThenAnalyze,
  sendarchive: sendToArchive,
  ledgerverify: verifyLedger,
  ledgertamper: simulateTampering,
  ledgerexport: exportLedger,
};

function onClick(e: Event): void {
  const target = (e.target as Element).closest<HTMLElement>(
    '[data-tab],[data-w],[data-node],[data-q]',
  );
  if (!target) return;
  const { q, tab, node, w } = target.dataset;

  if (q) {
    void ask(q);
  } else if (tab) {
    W.tab = tab as WorkspaceTab;
    document
      .querySelectorAll<HTMLElement>('.tab')
      .forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === W.tab)));
    refresh();
  } else if (node) {
    W.selectedNode = W.graph.nodes.find((n) => n.id === node) ?? null;
    const info = $('#nodeInfo');
    if (info && W.selectedNode)
      info.textContent = `${W.selectedNode.label}: ${W.selectedNode.detail}`;
  } else if (w) {
    void ACTIONS[w]?.();
  }
}

async function onChange(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement;
  if (input.id === 'nexaCase') {
    W.caseId = input.value ? Number(input.value) : null;
    return refresh();
  }
  const file = input.files?.[0];
  if (!['up', 'up2'].includes(input.id) || !file) return;
  const id = await uploadFile(file);
  const ev = W.evidence.find((x) => x.id === id);
  if (!id || !ev) return;
  if (input.id === 'up2') {
    reply(
      `ARCHIVE filed ${id} (${ev.name}). VERITY result: ${ev.status}. It needs investigator review before CIPHER includes it: press "Review and analyze now".`,
    );
  } else {
    toast(`${id} filed and verified: ${ev.status}`);
  }
}

function onSubmit(e: Event): void {
  const form = e.target as HTMLFormElement;
  if (!['chatForm', 'nexaForm'].includes(form.id)) return;
  e.preventDefault();
  const question = (form.querySelector('input')?.value ?? '').trim();
  W.draft = {};
  if (question) void ask(question);
}

function onInput(e: Event): void {
  const input = e.target as HTMLInputElement;
  if (['q', 'nq'].includes(input.id)) W.draft[input.id] = input.value;
}

/** Call once at start-up. */
export function registerWorkspaceEvents(): void {
  document.addEventListener('click', onClick);
  document.addEventListener('change', (e) => void onChange(e));
  document.addEventListener('submit', onSubmit);
  document.addEventListener('input', onInput);
}
