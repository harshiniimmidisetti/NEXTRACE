/** Delegated event handling for the workspace and NEXA (clicks, form submits, file inputs). */
import { toast, $ } from '../lib/dom.js';
import { approveReport, fileExternalData, reviewAndAnalyze, review, runChronicle, runCipher, runScout, runVerity, uploadFile, } from '../services/agents.js';
import { exportLedger, simulateTampering, verifyLedger } from '../services/ledger.js';
import { ask, reply, startVoiceInput } from '../services/nexa.js';
import { downloadPdf } from '../services/report.js';
import { refresh, W } from '../state/store.js';
import { syncNexa } from './mount.js';
const valueOf = (selector) => $(selector)?.value ?? '';
/** Go to the case page, or just redraw if we are already on it. */
function showCase(tab, redrawWidget) {
    W.tab = tab;
    W.panelOpen = false;
    if (location.hash === '#case') {
        if (redrawWidget)
            syncNexa('case');
        refresh();
    }
    else {
        location.hash = 'case';
    }
}
async function sendToArchive() {
    const result = await fileExternalData({
        text: valueOf('#dt'),
        name: valueOf('#dn'),
        source: valueOf('#ds'),
    });
    if (result)
        reply(result.summary);
}
function reviewThenAnalyze() {
    const message = reviewAndAnalyze();
    if (message)
        reply(message);
}
/** Every `data-w="..."` button maps to one of these. */
const ACTIONS = {
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
function onClick(e) {
    const target = e.target.closest('[data-tab],[data-w],[data-node],[data-q]');
    if (!target)
        return;
    const { q, tab, node, w } = target.dataset;
    if (q) {
        void ask(q);
    }
    else if (tab) {
        W.tab = tab;
        document
            .querySelectorAll('.tab')
            .forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === W.tab)));
        refresh();
    }
    else if (node) {
        W.selectedNode = W.graph.nodes.find((n) => n.id === node) ?? null;
        const info = $('#nodeInfo');
        if (info && W.selectedNode)
            info.textContent = `${W.selectedNode.label}: ${W.selectedNode.detail}`;
    }
    else if (w) {
        void ACTIONS[w]?.();
    }
}
async function onChange(e) {
    const input = e.target;
    if (input.id === 'nexaCase') {
        W.caseId = input.value ? Number(input.value) : null;
        return refresh();
    }
    const file = input.files?.[0];
    if (!['up', 'up2'].includes(input.id) || !file)
        return;
    const id = await uploadFile(file);
    const ev = W.evidence.find((x) => x.id === id);
    if (!id || !ev)
        return;
    if (input.id === 'up2') {
        reply(`ARCHIVE filed ${id} (${ev.name}). VERITY result: ${ev.status}. It needs investigator review before CIPHER includes it: press "Review and analyze now".`);
    }
    else {
        toast(`${id} filed and verified: ${ev.status}`);
    }
}
function onSubmit(e) {
    const form = e.target;
    if (!['chatForm', 'nexaForm'].includes(form.id))
        return;
    e.preventDefault();
    const question = (form.querySelector('input')?.value ?? '').trim();
    W.draft = {};
    if (question)
        void ask(question);
}
function onInput(e) {
    const input = e.target;
    if (['q', 'nq'].includes(input.id))
        W.draft[input.id] = input.value;
}
/** Call once at start-up. */
export function registerWorkspaceEvents() {
    document.addEventListener('click', onClick);
    document.addEventListener('change', (e) => void onChange(e));
    document.addEventListener('submit', onSubmit);
    document.addEventListener('input', onInput);
}
