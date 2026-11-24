import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { analyze, answer, buildGraph, buildTimeline } from '../src/core/index.js';
import type { CaseSnapshot } from '../src/types.js';
import { verifiedSeed } from './fixtures.js';

async function snapshot(analysed = true): Promise<CaseSnapshot> {
  const evidence = await verifiedSeed();
  return {
    evidence,
    findings: analysed ? analyze(evidence) : [],
    timeline: analysed ? buildTimeline(evidence) : [],
    graph: analysed ? buildGraph(evidence) : { nodes: [], edges: [] },
    ledgerCount: 4,
    ledgerOk: true,
  };
}

describe('deterministic assistant', () => {
  it('declines to invent anything when no case data exists', () => {
    const empty: CaseSnapshot = {
      evidence: [],
      findings: [],
      timeline: [],
      graph: { nodes: [], edges: [] },
      ledgerCount: 0,
      ledgerOk: true,
    };
    assert.match(answer('summary', empty), /No case data is loaded yet/);
  });

  it('cites evidence for a failed verification', async () => {
    const text = answer('Explain the failed verification', await snapshot());
    assert.match(text, /EV-0005/);
  });

  it('answers questions about one evidence file', async () => {
    assert.match(answer('tell me about EV-0003', await snapshot()), /server_auth\.log/);
    assert.match(answer('tell me about EV-0099', await snapshot()), /can't find EV-99/);
  });

  it('finds an IP in the evidence and says so when it is absent', async () => {
    const s = await snapshot();
    assert.match(answer('where is 203.0.113.45', s), /appears in EV-0001/);
    assert.match(answer('where is 192.0.2.99', s), /does not appear/);
  });

  it('only reports the timeline after CIPHER has built it', async () => {
    assert.match(answer('what happened first?', await snapshot(false)), /Run CIPHER/);
    assert.match(answer('what happened first?', await snapshot()), /Earliest recorded event/);
  });

  it('recommends further evidence tied to findings', async () => {
    const text = answer('what additional evidence should I collect?', await snapshot());
    assert.match(text, /Registrar\/WHOIS/);
    assert.match(text, /Original copy of EV-0005/);
  });

  it('falls back to a scoped reply for unrelated questions', async () => {
    assert.match(answer('tell me a joke', await snapshot()), /answer only from this case/i);
  });
});
