import { sha256 } from './hash.js';
export const GENESIS = '0'.repeat(64);
const entryHash = (e) => sha256([e.prev, e.n, e.time, e.actor, e.action, e.detail].join('|'));
/** Append a new entry to `ledger` (mutates it) and return the entry. */
export async function ledgerAppend(ledger, actor, action, detail) {
    const draft = {
        n: ledger.length + 1,
        time: new Date().toISOString(),
        actor,
        action,
        detail,
        prev: ledger.length ? ledger[ledger.length - 1].hash : GENESIS,
    };
    const entry = { ...draft, hash: await entryHash(draft) };
    ledger.push(entry);
    return entry;
}
/** Walk the chain and report the first broken entry, if any. */
export async function ledgerVerify(ledger) {
    let prev = GENESIS;
    for (const entry of ledger) {
        if (entry.prev !== prev || (await entryHash(entry)) !== entry.hash) {
            return { ok: false, brokenAt: entry.n };
        }
        prev = entry.hash;
    }
    return { ok: true, brokenAt: null, count: ledger.length };
}
