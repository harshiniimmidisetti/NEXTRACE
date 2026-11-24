/** ARCHIVE ledger actions used by the Records tab. */
import { ledgerVerify as verifyChain } from '../core/index.js';
import { toast } from '../lib/dom.js';
import { ledgerIdle } from '../state/records.js';
import { refresh, W } from '../state/store.js';
export async function verifyLedger() {
    await ledgerIdle();
    const result = await verifyChain(W.ledger);
    W.ledgerOk = result.ok;
    W.ledgerMsg = result.ok
        ? `Integrity intact: ${result.count} entries chained correctly.`
        : `BROKEN at entry #${result.brokenAt}.`;
    refresh();
}
/** Edit a copy of the ledger to show that tampering is detected. The real ledger is untouched. */
export async function simulateTampering() {
    await ledgerIdle();
    const copy = structuredClone(W.ledger);
    if (copy.length < 2)
        return toast('Run an agent first.');
    copy[1].detail += ' (altered)';
    const result = await verifyChain(copy);
    W.ledgerMsg = `Simulation on a copy: editing entry #2 breaks the chain at entry #${result.brokenAt}. The real ledger was not changed.`;
    refresh();
}
export function exportLedger() {
    const payload = {
        case: 'NXT-2026-0001',
        demo: true,
        ledger: W.ledger,
        evidence: W.evidence.map((e) => ({
            id: e.id,
            name: e.name,
            type: e.type,
            source: e.source,
            status: e.status,
            sha256: e.computedHash,
        })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'NEXTRACE-records-NXT-2026-0001.json';
    link.click();
}
