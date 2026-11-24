import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  analyze,
  buildGraph,
  buildTimeline,
  classifyText,
  extractIndicators,
  ledgerAppend,
  ledgerVerify,
  parseLog,
  sha256,
} from '../src/core/index.js';
import type { LedgerEntry } from '../src/types.js';
import { verifiedSeed } from './fixtures.js';

describe('hashing', () => {
  it('matches the SHA-256 test vector', async () => {
    assert.equal(
      await sha256('abc'),
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});

describe('VERITY', () => {
  it('gives the expected status for each seed file', async () => {
    const status = Object.fromEntries((await verifiedSeed()).map((e) => [e.id, e.status]));
    assert.deepEqual(status, {
      'EV-0001': 'Verified',
      'EV-0002': 'Verified',
      'EV-0003': 'Verified',
      'EV-0004': 'Partially Verified',
      'EV-0005': 'Failed',
    });
  });

  it('always explains the result and states the hash limitation', async () => {
    for (const e of await verifiedSeed()) {
      assert.ok(e.reasons && e.reasons.length >= 2, e.id);
      assert.match(e.reasons.at(-1)!, /does not prove/);
    }
  });

  it('flags out-of-order timestamps and duplicates for human review', async () => {
    const evidence = await verifiedSeed();
    const ordered = evidence.find((e) => e.id === 'EV-0005')!;
    assert.ok(ordered.reasons!.some((r) => /out of chronological order/.test(r)));
  });
});

describe('CIPHER', () => {
  it('finds a lookalike domain, a login burst and a shared IP', async () => {
    const findings = analyze(await verifiedSeed());
    assert.ok(findings.some((f) => /Lookalike/.test(f.title)));
    assert.ok(findings.some((f) => /Repeated failed/.test(f.title)));
    assert.ok(findings.some((f) => /appears across/.test(f.title)));
  });

  it('never marks the shared-IP link as a fact', async () => {
    const shared = analyze(await verifiedSeed()).find((f) => /appears across/.test(f.title))!;
    assert.equal(shared.kind, 'Hypothesis');
  });

  it('ignores the official domain', () => {
    const findings = analyze([
      {
        id: 'EV-0001',
        name: 'a.txt',
        type: 'TXT',
        source: 's',
        uploadedBy: 'u',
        uploaded: '2026-11-16',
        content: 'see https://www.securebank.example/help',
      },
    ]);
    assert.equal(findings.length, 0);
  });
});

describe('graph and timeline', () => {
  it('marks indicators shared by several files', async () => {
    assert.ok(buildGraph(await verifiedSeed()).nodes.some((n) => n.shared));
  });

  it('builds a chronological timeline', async () => {
    const rows = buildTimeline(await verifiedSeed());
    assert.ok(rows.length > 8);
    assert.ok(rows.every((r, i) => i === 0 || rows[i - 1]!.time <= r.time));
  });
});

describe('ARCHIVE ledger', () => {
  const build = async () => {
    const ledger: LedgerEntry[] = [];
    await ledgerAppend(ledger, 'ARCHIVE', 'a', 'one');
    await ledgerAppend(ledger, 'VERITY', 'b', 'two');
    await ledgerAppend(ledger, 'CIPHER', 'c', 'three');
    return ledger;
  };

  it('verifies an untouched chain', async () => {
    assert.equal((await ledgerVerify(await build())).ok, true);
  });

  it('detects an edited entry and reports where', async () => {
    const tampered = structuredClone(await build());
    tampered[1]!.detail = 'changed';
    assert.deepEqual(await ledgerVerify(tampered), { ok: false, brokenAt: 2 });
  });

  it('detects a removed entry', async () => {
    const ledger = await build();
    ledger.splice(1, 1);
    assert.equal((await ledgerVerify(ledger)).ok, false);
  });
});

describe('indicators and classification', () => {
  it('extracts and de-duplicates indicators, rejecting invalid IPs', () => {
    const found = extractIndicators(
      'a@b.example 203.0.113.45 203.0.113.45 999.1.1.1 http://x.example/p',
    );
    assert.deepEqual(found.ips, ['203.0.113.45']);
    assert.deepEqual(found.domains.sort(), ['b.example', 'x.example']);
  });

  it('parses log lines and skips junk', () => {
    const events = parseLog(
      '2026-11-16T09:41:02Z WARN auth failed user=admin ip=203.0.113.45\nnoise',
    );
    assert.equal(events.length, 1);
    assert.equal(events[0]!.ip, '203.0.113.45');
    assert.equal(events[0]!.user, 'admin');
  });

  it('classifies pasted text', () => {
    assert.equal(classifyText('{"a":1}'), 'JSON');
    assert.equal(classifyText('From: a@b.example\nSubject: hi\n\nx'), 'EML');
    assert.equal(
      classifyText('2026-11-16T09:40:00Z INFO a ip=1.2.3.4\n2026-11-16T09:41:00Z INFO b'),
      'LOG',
    );
    assert.equal(classifyText('a,b\n1,2'), 'CSV');
    assert.equal(classifyText('just some notes'), 'TXT');
  });
});
