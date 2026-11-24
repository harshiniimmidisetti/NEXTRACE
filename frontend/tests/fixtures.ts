/** Shared helpers for tests. */
import { SEED_EVIDENCE, sha256, verify } from '../src/core/index.js';
import type { Evidence } from '../src/types.js';

/** The seed evidence after VERITY has run, as the app would hold it. */
export async function verifiedSeed(): Promise<Evidence[]> {
  const evidence: Evidence[] = SEED_EVIDENCE.map((e) => ({
    ...e,
    recordedFrom: e.recordedFrom ?? e.content,
  }));
  for (const e of evidence) e.computedHash = await sha256(e.content);
  for (const e of evidence) Object.assign(e, await verify(e, evidence));
  return evidence;
}
