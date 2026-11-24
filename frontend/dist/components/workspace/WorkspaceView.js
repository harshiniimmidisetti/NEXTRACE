import { W } from '../../state/store.js';
import { assistantTab, evidenceTab, findingsTab, graphTab, recordsTab, reportTab, timelineTab, workflowTab, } from './tabs.js';
const TABS = [
    ['workflow', 'Agent workflow'],
    ['evidence', 'Evidence'],
    ['findings', 'Findings'],
    ['graph', 'Graph'],
    ['timeline', 'Timeline'],
    ['assistant', 'NEXA assistant'],
    ['records', 'Records (ARCHIVE)'],
    ['report', 'Report'],
];
const TAB_RENDERERS = {
    workflow: workflowTab,
    evidence: evidenceTab,
    findings: findingsTab,
    graph: graphTab,
    timeline: timelineTab,
    assistant: assistantTab,
    records: recordsTab,
    report: reportTab,
};
/** Body of the active tab (also used by the re-render hook). */
export const workspaceBody = () => TAB_RENDERERS[W.tab]();
/** Full case workspace page. */
export const workspaceView = (role) => `<div class="main workspace">
  <div class="bar"><button class="btn btn-ghost" data-go="${role}">Back to dashboard</button><h1>Case NXT-2026-0001</h1><span class="badge">DEMO DATA</span></div>
  <div class="tabs" role="tablist">${TABS.map(([key, label]) => `<button class="tab" role="tab" data-tab="${key}" aria-selected="${W.tab === key}">${label}</button>`).join('')}</div>
  <div id="ws">${workspaceBody()}</div></div>`;
