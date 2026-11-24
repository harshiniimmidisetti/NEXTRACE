/** One render function per workspace tab. Each returns an HTML string. */
import { AGENT_NAMES, W } from '../../state/store.js';
import { esc } from '../../lib/dom.js';
import { ALLOWED_EXTENSIONS } from '../../services/agents.js';
import { reportLines } from '../../services/report.js';
import { verificationBadge } from '../Badge.js';
import { chatPanel } from '../nexa/Chat.js';
import { agentCard } from './AgentCard.js';
import { evidenceTable } from './EvidenceTable.js';
import { graphSvg } from './GraphView.js';
const ACCEPT = '.pdf,.jpg,.jpeg,.png,.txt,.eml,.csv,.json,.log';
export function workflowTab() {
    const logs = AGENT_NAMES.flatMap((a) => W.agents[a].logs.map((l) => `${a} ${esc(l)}`)).join('<br>') ||
        'No activity yet.';
    return `<div class="agrid">
    ${agentCard('SCOUT', 'Imports the synthetic demo dataset. Live sources stay off unless configured.', '<button class="btn btn-primary" data-w="scout">Run SCOUT</button>')}
    ${agentCard('VERITY', 'SHA-256, duplicates, metadata, timestamps. Shows the reason for each result.', '<button class="btn btn-primary" data-w="verity">Run VERITY</button>')}
    <div class="card"><h3>ARCHIVE <span class="badge ok">Active</span></h3>
      <p class="muted-sm">Keeps the case records and a tamper-evident ledger. Files data from other sources and hands it to SCOUT and VERITY.</p>
      <div class="prog"><i style="width:100%"></i></div><small>${W.ledger.length} ledger entries</small>
      <div class="mt-12"><button class="btn btn-ghost" data-tab="records">Open records</button></div></div>
    <div class="card"><h3>Investigator review ${W.reviewed ? '<span class="badge ok">Done</span>' : ''}</h3>
      <p class="muted-sm">A human confirms the verified evidence before analysis starts.</p>
      <div class="mt-12"><button class="btn btn-ghost" data-w="review">I reviewed the evidence</button></div></div>
    ${agentCard('CIPHER', 'Finds indicators and separates facts, indicators and hypotheses.', '<button class="btn btn-primary" data-w="cipher">Run CIPHER</button>')}
    ${agentCard('CHRONICLE', 'Drafts the report. It stays a draft until the investigator approves it.', '<button class="btn btn-primary" data-w="chronicle">Run CHRONICLE</button>')}
  </div>
  <div class="card"><h3>Activity logs</h3><div class="logbox">${logs}</div></div>`;
}
export function evidenceTab() {
    const details = W.evidence
        .filter((e) => e.reasons)
        .map((e) => `<div class="card mt-14"><h3>${e.id} verification ${verificationBadge(e.status)}</h3>
        <ul>${e.reasons.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
        <p class="mono">computed: ${e.computedHash}<br>recorded: ${e.recordedHash || 'none'}</p></div>`)
        .join('');
    return `<div class="card"><h3>Evidence <label class="btn btn-ghost btn-sm">Upload file<input type="file" id="up" hidden accept="${ACCEPT}"></label></h3>
    ${evidenceTable()}
    <p class="note">Files are only read and hashed in your browser. They are never executed. Limit 5 MB. Types: ${ALLOWED_EXTENSIONS.join(', ')}.</p></div>${details}`;
}
export function findingsTab() {
    if (!W.findings.length)
        return '<div class="card">Run CIPHER to see findings.</div>';
    const items = W.findings
        .map((f) => `<div class="fnd ${f.risk}"><b>${esc(f.title)}</b>
        <span class="badge info">${f.kind}</span>
        <span class="badge ${f.risk === 'High' ? 'bad' : ''}">${f.risk} risk</span>
        ${verificationBadge(f.verification)}
        <p>${esc(f.description)}</p>
        <small>Why: ${esc(f.reason)}<br>Evidence: ${f.evidence.join(', ')} · Confidence ${f.confidence}<br>Next action: ${esc(f.next)}</small></div>`)
        .join('');
    return `<div class="card">${items}<p class="note">Findings are leads for the investigator. NEXTRACE never declares a person guilty.</p></div>`;
}
export function graphTab() {
    const selected = W.selectedNode
        ? `${esc(W.selectedNode.label)}: ${esc(W.selectedNode.detail)}`
        : 'Select a node.';
    return `<div class="card"><h3>Evidence relationship graph</h3>${graphSvg()}<div id="nodeInfo" class="note">${selected}</div></div>`;
}
export function timelineTab() {
    const body = W.timeline.length
        ? `<ul class="tl">${W.timeline
            .map((x) => `<li><b>${x.time}</b> · ${esc(x.text)}<br><small>${x.ev} · ${x.st} · confidence ${x.conf}</small></li>`)
            .join('')}</ul><p class="note">Only timestamps present in the evidence are shown. Nothing is estimated.</p>`
        : 'Run CIPHER to build the timeline.';
    return `<div class="card"><h3>Crime timeline <span class="badge">${W.timeline.length} events</span></h3>${body}</div>`;
}
export const assistantTab = () => `<div class="card nx-full">${chatPanel(true)}</div>`;
export function recordsTab() {
    const rows = W.ledger
        .slice(-60)
        .reverse()
        .map((e) => `<tr><td>${e.n}</td><td class="mono">${e.time.slice(11, 19)}</td><td>${e.actor}</td><td>${esc(e.detail)}</td><td class="mono">${e.hash.slice(0, 10)}</td></tr>`)
        .join('');
    const ok = W.ledgerOk;
    return `<div class="card"><h3>ARCHIVE: records ledger <span class="badge ${ok ? 'ok' : 'bad'}">${ok ? 'Integrity intact' : 'Integrity broken'}</span></h3>
    <p class="muted-sm mb-12">Every action is appended with the hash of the previous entry, so changing any past entry breaks the chain.</p>
    <div class="actions mb-12"><button class="btn btn-primary" data-w="ledgerverify">Verify ledger</button><button class="btn btn-ghost" data-w="ledgertamper">Simulate tampering</button><button class="btn btn-ghost" data-w="ledgerexport">Export JSON</button></div>
    ${W.ledgerMsg ? `<p class="note mt-0 mb-12">${esc(W.ledgerMsg)}</p>` : ''}
    <div class="scroll"><table class="tbl"><thead><tr><th>#</th><th>Time (UTC)</th><th>Actor</th><th>Detail</th><th>Hash</th></tr></thead><tbody>${rows}</tbody></table></div>
    <p class="note">Showing the latest 60 of ${W.ledger.length}. Export gives the full ledger plus the evidence index.</p></div>
    <div class="card mt-14"><h3>Case record index</h3>${evidenceTable()}</div>`;
}
export function reportTab() {
    const badge = W.approved
        ? '<span class="badge ok">Approved</span>'
        : '<span class="badge">Draft</span>';
    const body = W.report
        ? `<pre class="mono report-pre">${esc(reportLines().join('\n'))}</pre>
       <div class="actions mt-12">${W.approved ? '' : '<button class="btn btn-ghost" data-w="approve">Approve report</button>'}<button class="btn btn-primary" data-w="pdf">Download PDF</button></div>`
        : 'Run CHRONICLE to draft the report.';
    return `<div class="card"><h3>Investigation report ${badge}</h3>${body}</div>`;
}
