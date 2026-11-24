/** CIPHER: forensic analysis. Separates facts, indicators and hypotheses, each with reasons. */
import type { Evidence, Finding, LogEvent } from '../types.js';
import { extractIndicators, ipsByEvidence, parseLog } from './indicators.js';

interface Brand {
  brand: string;
  official: string;
}

const BRANDS: readonly Brand[] = [{ brand: 'securebank', official: 'securebank.example' }];

const BURST_MIN_FAILURES = 5;
const BURST_WINDOW_MS = 10 * 60_000;
const SHARED_IP_MIN_FILES = 3;

type VerificationOf = (id: string) => string;

/** Domains that contain a protected brand name but are not the official domain. */
function lookalikeFindings(ev: Evidence, verificationOf: VerificationOf): Finding[] {
  const findings: Finding[] = [];
  for (const domain of extractIndicators(ev.content).domains) {
    for (const { brand, official } of BRANDS) {
      const isOfficial = domain === official || domain.endsWith(`.${official}`);
      if (!domain.includes(brand) || isOfficial) continue;
      findings.push({
        title: `Lookalike domain: ${domain}`,
        kind: 'Indicator',
        evidence: [ev.id],
        risk: 'High',
        confidence: 0.82,
        description: `Domain "${domain}" imitates "${official}" but is not the official domain.`,
        reason: 'Brand name inside a different registered domain.',
        verification: verificationOf(ev.id),
        next: 'Check domain registration records and request a takedown review.',
      });
    }
  }
  return findings;
}

/** Group failed-login events by IP address. */
function failuresByIp(events: LogEvent[]): Map<string, LogEvent[]> {
  const byIp = new Map<string, LogEvent[]>();
  for (const e of events) {
    if (!/failed/.test(e.msg) || !e.ip) continue;
    byIp.set(e.ip, [...(byIp.get(e.ip) ?? []), e]);
  }
  return byIp;
}

/** Burst of failed logins from one IP, optionally followed by a success and a data export. */
function loginBurstFindings(ev: Evidence, verificationOf: VerificationOf): Finding[] {
  const events = parseLog(ev.content);
  const findings: Finding[] = [];
  for (const [ip, failures] of failuresByIp(events)) {
    const times = failures.map((f) => Date.parse(f.time)).sort((a, b) => a - b);
    const first = times[0]!;
    const last = times[times.length - 1]!;
    if (times.length < BURST_MIN_FAILURES || last - first > BURST_WINDOW_MS) continue;

    const success = events.find(
      (e) => e.ip === ip && /login ok/.test(e.msg) && Date.parse(e.time) > last,
    );
    const exportEvent = events.find((e) => e.ip === ip && /export/.test(e.msg));
    const minutes = Math.round((last - first) / 6e4);
    findings.push({
      title: `Repeated failed logins from ${ip}`,
      kind: 'Fact',
      evidence: [ev.id],
      risk: success ? 'High' : 'Medium',
      confidence: success ? 0.88 : 0.7,
      description:
        `${times.length} failed logins within ${minutes} minutes` +
        (success ? `, followed by a successful login at ${success.time}` : '') +
        (exportEvent ? ` and a data export at ${exportEvent.time}.` : '.'),
      reason:
        'Burst of failures from one IP, then success (possible credential guessing). This is an indicator, not proof of who did it.',
      verification: verificationOf(ev.id),
      next: 'Review the account owner, reset credentials and confirm the export was not authorised.',
    });
  }
  return findings;
}

/** The same IP showing up in several independent evidence files. */
function sharedIpFindings(evidence: readonly Evidence[]): Finding[] {
  return Object.entries(ipsByEvidence(evidence))
    .filter(([, ids]) => ids.length >= SHARED_IP_MIN_FILES)
    .map(([ip, ids]) => ({
      title: `IP ${ip} appears across ${ids.length} evidence files`,
      kind: 'Hypothesis' as const,
      evidence: ids,
      risk: 'High' as const,
      confidence: 0.65,
      description:
        'The same address is in the phishing email header, the server log and network events.',
      reason:
        'Shared indicator across independent sources. Possible link between the email and the intrusion; needs corroboration.',
      verification: 'Needs Human Review',
      next: 'Obtain ISP records through legal process before drawing conclusions.',
    }));
}

/** Run every CIPHER check over the case evidence. */
export function analyze(evidence: readonly Evidence[]): Finding[] {
  const verificationOf: VerificationOf = (id) =>
    evidence.find((e) => e.id === id)?.status ?? 'Unverified';
  const findings: Finding[] = [];
  for (const ev of evidence) {
    findings.push(...lookalikeFindings(ev, verificationOf));
    if (ev.type === 'LOG') findings.push(...loginBurstFindings(ev, verificationOf));
  }
  findings.push(...sharedIpFindings(evidence));
  return findings;
}
