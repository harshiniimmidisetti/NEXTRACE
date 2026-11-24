/**
 * Deterministic demo assistant. It answers only from case data and always cites evidence IDs.
 * Rules are tried in order; the first one that produces an answer wins.
 */
import type { CaseSnapshot, Evidence } from '../types.js';
import { domainsByEvidence, extractIndicators, ipsByEvidence } from './indicators.js';

interface Ask {
  /** Original question. */
  q: string;
  /** Lower-cased question for keyword matching. */
  ql: string;
  s: CaseSnapshot;
}

type Rule = (a: Ask) => string | null;

const refs = (ids: string[]): string => ids.join(', ');
const bullets = (lines: string[]): string => lines.map((l) => `• ${l}`).join('\n');
const idIndex = (map: Record<string, string[]>): string =>
  Object.entries(map)
    .map(([key, ids]) => `${key}: ${refs(ids)}`)
    .join('\n');
const countStatus = (ev: Evidence[], status: string) =>
  ev.filter((e) => e.status === status).length;

const NO_DATA =
  'No case data is loaded yet. Run SCOUT for the demo dataset, or paste/upload data from another source and I will send it to the ARCHIVE agent.';
const FALLBACK =
  "I answer only from this case's data. Try: summary, suspicious activities, what happened first, failed evidence, tell me about EV-0003, where is 203.0.113.45, show domains, or paste new data and I will send it to ARCHIVE.";

const aboutEvidence: Rule = ({ q, s }) => {
  const idNumber = q.toLowerCase().match(/ev-?\s?0*(\d+)/)?.[1];
  if (!idNumber) return null;
  const e = s.evidence.find((x) => Number(x.id.slice(3)) === Number(idNumber));
  if (!e) return `I can't find EV-${idNumber}. Known: ${refs(s.evidence.map((x) => x.id))}.`;
  const ind = extractIndicators(e.content);
  const reason = e.reasons ? ` - ${e.reasons[0]}` : '';
  return (
    `${e.id} ${e.name} (${e.type}, ${e.size} bytes). Source: ${e.source || 'missing'}. ` +
    `Uploaded by ${e.uploadedBy} on ${e.uploaded}. Status: ${e.status ?? 'not verified yet'}${reason}\n` +
    `SHA-256: ${e.computedHash ?? 'not computed yet'}\n` +
    `IPs: ${ind.ips.join(', ') || 'none'}; domains: ${ind.domains.join(', ') || 'none'}.`
  );
};

const aboutIp: Rule = ({ q, s }) => {
  const ip = q.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/)?.[0];
  if (!ip) return null;
  const where = s.evidence.filter((e) => e.content.includes(ip)).map((e) => e.id);
  if (!where.length) return `${ip} does not appear in any evidence in this case.`;
  const hits = s.timeline.filter((t) => t.text.includes(ip));
  const detail = hits.length
    ? '\n' + hits.map((t) => `${t.time}  ${t.text} (${t.ev})`).join('\n')
    : '\n(Run CIPHER to see its timeline events.)';
  return `${ip} appears in ${refs(where)}.${detail}`;
};

const explainFindings: Rule = ({ ql, s }) => {
  const wantsExplanation = /explain|why|indicator|mean/.test(ql) && !/fail|verif|tamper/.test(ql);
  if (!wantsExplanation || !s.findings.length) return null;
  const matches = s.findings.filter((f) => {
    if (ql.includes('lookalike') || ql.includes('domain')) return /Lookalike/.test(f.title);
    if (ql.includes('login')) return /login/i.test(f.title);
    if (/\bip\b/.test(ql)) return /IP /.test(f.title);
    return true;
  });
  return (matches.length ? matches : s.findings)
    .map(
      (f) =>
        `${f.title} [${f.kind}, ${f.risk}, confidence ${f.confidence}] (${refs(f.evidence)})\n` +
        `Why: ${f.reason}\nNext: ${f.next}`,
    )
    .join('\n\n');
};

const aboutLedger: Rule = ({ ql, s }) =>
  /custody|ledger|record|archive|audit/.test(ql)
    ? `ARCHIVE holds ${s.ledgerCount} ledger entries, each linked to the previous by SHA-256. ` +
      `Integrity: ${s.ledgerOk ? 'intact' : 'BROKEN - investigate'}. Open the Records tab to inspect or export them.`
    : null;

const counts: Rule = ({ ql, s }) =>
  /how many|count|total|number of/.test(ql)
    ? `${s.evidence.length} evidence files, ${countStatus(s.evidence, 'Verified')} verified, ` +
      `${countStatus(s.evidence, 'Failed')} failed, ${s.findings.length} findings, ${s.timeline.length} timeline events.`
    : null;

const listIps: Rule = ({ ql, s }) =>
  /\bip\b|ips|address/.test(ql) ? idIndex(ipsByEvidence(s.evidence)) : null;

const listDomains: Rule = ({ ql, s }) =>
  /domain|url|link/.test(ql) && !/connect/.test(ql) ? idIndex(domainsByEvidence(s.evidence)) : null;

const whoUploaded: Rule = ({ ql, s }) =>
  /who|uploaded|submitted|source/.test(ql)
    ? s.evidence
        .map((e) => `${e.id}: ${e.uploadedBy} on ${e.uploaded} (source: ${e.source || 'missing'})`)
        .join('\n')
    : null;

const suspicious: Rule = ({ ql, s }) => {
  if (!/suspicious|activit/.test(ql)) return null;
  if (!s.findings.length) return 'CIPHER has not run yet. Run VERITY, review, then CIPHER.';
  return s.findings
    .map((f) => `• ${f.title} [${f.kind}, ${f.risk}] (${refs(f.evidence)})`)
    .join('\n');
};

const timeline: Rule = ({ ql, s }) => {
  if (!/timeline|events|sequence|chronolog/.test(ql)) return null;
  const t = s.timeline;
  if (!t.length) return 'No timeline yet. Run CIPHER to build it.';
  const shown = t.slice(0, 12).map((x) => `${x.time}  ${x.text} (${x.ev}, ${x.st})`);
  const more = t.length > 12 ? `\n...and ${t.length - 12} more in the Timeline tab.` : '';
  return `Timeline (only timestamps found in the evidence):\n${shown.join('\n')}${more}`;
};

const earliest: Rule = ({ ql, s }) => {
  if (!/first|begin|start/.test(ql)) return null;
  const t = s.timeline[0];
  return t
    ? `Earliest recorded event: ${t.time} - ${t.text} (${t.ev}).`
    : 'No timeline yet. Run CIPHER.';
};

const connections: Rule = ({ ql, s }) => {
  if (!/connect|related|relationship/.test(ql)) return null;
  const shared = s.graph.nodes.filter((n) => n.shared);
  if (!shared.length) return 'No shared indicators found yet (run CIPHER).';
  return shared
    .map(
      (n) =>
        `${n.label} (${n.kind}): ${n.detail}. Linked because the same value appears in more than one evidence file.`,
    )
    .join('\n');
};

const verification: Rule = ({ ql, s }) => {
  if (!/fail|verif|review|tamper|status/.test(ql)) return null;
  const notVerified = s.evidence.filter((e) => e.status && e.status !== 'Verified');
  if (notVerified.length) {
    return notVerified
      .map((e) => `${e.id} ${e.name}: ${e.status}. ${e.reasons?.[0] ?? ''}`)
      .join('\n');
  }
  return s.evidence.some((e) => e.status) ? 'All evidence verified.' : 'Run VERITY first.';
};

const timestampProblems: Rule = ({ ql, s }) => {
  if (!/timestamp|conflict/.test(ql)) return null;
  const bad = s.evidence.filter((e) => (e.reasons ?? []).some((r) => /order|future/.test(r)));
  return bad.length
    ? `Timestamp problems in ${refs(bad.map((e) => e.id))}.`
    : 'No timestamp conflicts found.';
};

const recommendations: Rule = ({ ql, s }) => {
  if (!/more|additional|collect|next|recommend/.test(ql)) return null;
  const out: string[] = [];
  for (const f of s.findings) {
    if (/Lookalike/.test(f.title)) {
      out.push(`Registrar/WHOIS and hosting records for the flagged domain (${refs(f.evidence)}).`);
    }
  }
  for (const f of s.findings) {
    if (/Repeated failed|appears across/.test(f.title)) {
      out.push(
        `ISP subscriber records for the IP in ${f.title} (needs legal process) (${refs(f.evidence)}).`,
      );
    }
  }
  for (const e of s.evidence) {
    if (e.status === 'Failed') {
      out.push(
        `Original copy of ${e.id} from its source system, to compare with the recorded hash.`,
      );
    }
  }
  for (const e of s.evidence) if (!e.source) out.push(`Source information for ${e.id}.`);
  if (!out.length)
    return bullets(['Run VERITY and CIPHER first so recommendations are based on findings.']);
  return `${bullets(out)}\nIf you have any of these, paste or upload them and NEXA will send them to ARCHIVE.`;
};

const summary: Rule = ({ ql, s }) => {
  if (!/summar|overview/.test(ql)) return null;
  const t = s.timeline;
  const needAttention = s.evidence.filter(
    (e) => e.status && !['Verified', 'Failed'].includes(e.status),
  ).length;
  return [
    'Case NXT-2026-0001 summary (from stored case data):',
    `Evidence: ${s.evidence.length} files, ${countStatus(s.evidence, 'Verified')} verified, ` +
      `${countStatus(s.evidence, 'Failed')} failed, ${needAttention} need attention.`,
    ...s.findings
      .slice(0, 3)
      .map((f) => `Finding: ${f.title} [${f.kind}, ${f.risk}] (${refs(f.evidence)})`),
    t.length
      ? `Timeline: ${t[0]!.time} to ${t[t.length - 1]!.time}, ${t.length} events.`
      : 'Timeline: not built yet (run CIPHER).',
    'Limits: findings are leads for investigator review, not conclusions about any person.',
  ].join('\n');
};

/** Order matters: more specific questions are matched before broad keyword rules. */
const RULES: readonly Rule[] = [
  aboutEvidence,
  aboutIp,
  explainFindings,
  aboutLedger,
  counts,
  listIps,
  listDomains,
  whoUploaded,
  suspicious,
  timeline,
  earliest,
  connections,
  verification,
  timestampProblems,
  recommendations,
  summary,
];

export function answer(question: string, snapshot: CaseSnapshot): string {
  if (!snapshot.evidence.length) return NO_DATA;
  const ask: Ask = { q: question, ql: question.toLowerCase(), s: snapshot };
  for (const rule of RULES) {
    const result = rule(ask);
    if (result !== null) return result;
  }
  return FALLBACK;
}
