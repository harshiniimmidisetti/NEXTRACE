const IP_RE = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
const URL_RE = /https?:\/\/[^\s"'<>),]+/g;
const EMAIL_RE = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const LOG_RE = /^(\d{4}-\d\d-\d\dT[\d:]+Z)\s+(\w+)\s+(.*)$/;
/** Matches every ISO-8601 UTC timestamp in a text. Use a fresh `match`, never `exec`, with it. */
export const ISO_ALL = /\d{4}-\d\d-\d\dT[\d:]+Z/g;
const isValidIp = (ip) => ip.split('.').every((octet) => Number(octet) <= 255);
const unique = (items) => [...new Set(items)];
/** Pull unique IPv4 addresses, URLs, email addresses and domains out of free text. */
export function extractIndicators(text) {
    const ips = unique((text.match(IP_RE) ?? []).filter(isValidIp));
    const urls = unique(text.match(URL_RE) ?? []);
    const emails = unique(text.match(EMAIL_RE) ?? []);
    const domains = new Set(emails.map((email) => email.split('@')[1].toLowerCase()));
    for (const url of urls) {
        try {
            domains.add(new URL(url).hostname.toLowerCase());
        }
        catch {
            /* malformed URL: it stays in `urls` but contributes no domain */
        }
    }
    return { ips, urls, emails, domains: [...domains] };
}
/** Parse `TIMESTAMP LEVEL message` log lines. Lines that do not match are ignored. */
export function parseLog(text) {
    const events = [];
    for (const line of text.split('\n')) {
        const m = line.match(LOG_RE);
        if (!m)
            continue;
        const msg = m[3];
        events.push({
            time: m[1],
            level: m[2],
            msg,
            ip: msg.match(/ip=([\d.]+)/)?.[1],
            user: msg.match(/user=(\w+)/)?.[1],
        });
    }
    return events;
}
/** Map each IP found in the given evidence to the evidence IDs that contain it. */
export function ipsByEvidence(items) {
    const map = {};
    for (const item of items) {
        for (const ip of extractIndicators(item.content).ips)
            (map[ip] ??= []).push(item.id);
    }
    return map;
}
/** Map each domain found in the given evidence to the evidence IDs that contain it. */
export function domainsByEvidence(items) {
    const map = {};
    for (const item of items) {
        for (const d of extractIndicators(item.content).domains)
            (map[d] ??= []).push(item.id);
    }
    return map;
}
