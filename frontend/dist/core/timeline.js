import { parseLog } from './indicators.js';
const emlRows = (ev, st) => {
    const date = ev.content.match(/^Date:\s*(.+)$/m)?.[1];
    if (!date || Number.isNaN(Date.parse(date)))
        return [];
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
const logRows = (ev, st) => parseLog(ev.content)
    .filter((e) => e.level !== 'INFO' || /ok/.test(e.msg))
    .map((e) => ({ time: e.time, text: e.msg, ev: ev.id, st, conf: 'High' }));
const jsonRows = (ev, st) => {
    try {
        const events = JSON.parse(ev.content);
        return events
            .filter((e) => e.time)
            .map((e) => ({
            time: e.time,
            text: `${e.src} → ${e.dst}:${e.port} ${e.note ?? ''}`,
            ev: ev.id,
            st,
            conf: 'Medium',
        }));
    }
    catch {
        return []; // not an event array: the file simply contributes nothing
    }
};
const csvRows = (ev, st) => ev.content
    .split('\n')
    .slice(1)
    .map((line) => line.split(','))
    .filter((cols) => /^\d{4}-/.test(cols[1] ?? ''))
    .map((cols) => ({
    time: cols[1],
    text: `URL reported: ${cols[0]}`,
    ev: ev.id,
    st,
    conf: 'Medium',
}));
const BUILDERS = {
    EML: emlRows,
    LOG: logRows,
    JSON: jsonRows,
    CSV: csvRows,
};
export function buildTimeline(evidence) {
    const rows = evidence.flatMap((ev) => BUILDERS[ev.type]?.(ev, ev.status ?? 'Unverified') ?? []);
    return rows.sort((a, b) => a.time.localeCompare(b.time));
}
