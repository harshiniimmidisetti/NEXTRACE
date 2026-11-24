/** Timeline: only timestamps that really appear in the evidence. Nothing is estimated. */
import type { Evidence, TimelineRow } from '../types.js';
import { parseLog } from './indicators.js';

type RowBuilder = (ev: Evidence, status: string) => TimelineRow[];

const emlRows: RowBuilder = (ev, st) => {
  const date = ev.content.match(/^Date:\s*(.+)$/m)?.[1];
  if (!date || Number.isNaN(Date.parse(date))) return [];
  const subject = ev.content.match(/^Subject:\s*(.+)$/m)?.[1] ?? '';
  return [
    {
      time: new Date(date).toISOString().replace('.000', ''),
      text: `Phishing email sent: ${subject}`,
      ev: ev.id,
      st,
      conf: 'Medium (header date can be forged)',
    },
  ];
};

const logRows: RowBuilder = (ev, st) =>
  parseLog(ev.content)
    .filter((e) => e.level !== 'INFO' || /ok/.test(e.msg))
    .map((e) => ({ time: e.time, text: e.msg, ev: ev.id, st, conf: 'High' }));

interface NetworkEvent {
  time?: string;
  src: string;
  dst: string;
  port: number;
  note?: string;
}

const jsonRows: RowBuilder = (ev, st) => {
  try {
    const events = JSON.parse(ev.content) as NetworkEvent[];
    return events
      .filter((e) => e.time)
      .map((e) => ({
        time: e.time!,
        text: `${e.src} → ${e.dst}:${e.port} ${e.note ?? ''}`,
        ev: ev.id,
        st,
        conf: 'Medium',
      }));
  } catch {
    return []; // not an event array: the file simply contributes nothing
  }
};

const csvRows: RowBuilder = (ev, st) =>
  ev.content
    .split('\n')
    .slice(1)
    .map((line) => line.split(','))
    .filter((cols) => /^\d{4}-/.test(cols[1] ?? ''))
    .map((cols) => ({
      time: cols[1]!,
      text: `URL reported: ${cols[0]}`,
      ev: ev.id,
      st,
      conf: 'Medium',
    }));

const BUILDERS: Record<string, RowBuilder> = {
  EML: emlRows,
  LOG: logRows,
  JSON: jsonRows,
  CSV: csvRows,
};

export function buildTimeline(evidence: readonly Evidence[]): TimelineRow[] {
  const rows = evidence.flatMap((ev) => BUILDERS[ev.type]?.(ev, ev.status ?? 'Unverified') ?? []);
  return rows.sort((a, b) => a.time.localeCompare(b.time));
}
