/** ARCHIVE: tamper-evident records ledger. Each entry contains the SHA-256 of the previous one. */
import type { LedgerEntry, LedgerResult } from '../types.js';
import { sha256 } from './hash.js';

export const GENESIS = '0'.repeat(64);

type UnsignedEntry = Omit<LedgerEntry, 'hash'>;

const entryHash = (e: UnsignedEntry): Promise<string> =>
  sha256([e.prev, e.n, e.time, e.actor, e.action, e.detail].join('|'));

/** Append a new entry to `ledger` (mutates it) and return the entry. */
export async function ledgerAppend(
  ledger: LedgerEntry[],
  actor: string,
  action: string,
  detail: string,
): Promise<LedgerEntry> {
  const draft: UnsignedEntry = {
    n: ledger.length + 1,
    time: new Date().toISOString(),
    actor,
    action,
    detail,
    prev: ledger.length ? ledger[ledger.length - 1]!.hash : GENESIS,
  };
  const entry: LedgerEntry = { ...draft, hash: await entryHash(draft) };
  ledger.push(entry);
  return entry;
}

/** Walk the chain and report the first broken entry, if any. */
export async function ledgerVerify(ledger: readonly LedgerEntry[]): Promise<LedgerResult> {
  let prev = GENESIS;
  for (const entry of ledger) {
    if (entry.prev !== prev || (await entryHash(entry)) !== entry.hash) {
      return { ok: false, brokenAt: entry.n };
    }
    prev = entry.hash;
  }
  return { ok: true, brokenAt: null, count: ledger.length };
}
