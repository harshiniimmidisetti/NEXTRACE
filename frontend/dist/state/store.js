export const AGENT_NAMES = [
    'SCOUT',
    'VERITY',
    'ARCHIVE',
    'CIPHER',
    'CHRONICLE',
];
const newAgent = () => ({
    status: 'Not started',
    progress: 0,
    last: '-',
    logs: [],
    error: '',
});
function createWorkspace() {
    const agents = Object.fromEntries(AGENT_NAMES.map((n) => [n, newAgent()]));
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
export const W = createWorkspace();
/** The slice of state the deterministic assistant reads from. */
export const snapshot = () => ({
    findings: W.findings,
    evidence: W.evidence,
    timeline: W.timeline,
    graph: W.graph,
    ledgerCount: W.ledger.length,
    ledgerOk: W.ledgerOk,
});
/* ---------- Re-render hook (registered by the UI layer) ---------- */
let renderer = () => { };
export const setRenderer = (fn) => {
    renderer = fn;
};
export const refresh = () => renderer();
