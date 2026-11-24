import { sha256 } from './hash.js';
import { ISO_ALL } from './indicators.js';
export const HASH_NOTE = 'A matching hash only shows the content equals the recorded hash; it does not prove the evidence is authentic or truthful.';
const STALE_AFTER_DAYS = 180;
const MS_PER_DAY = 864e5;
const REQUIRED_METADATA = ['source', 'uploadedBy', 'uploaded'];
/** True when a log's timestamps are not in chronological order. */
function hasOutOfOrderTimes(ev, times) {
    return ev.type === 'LOG' && times.some((t, i) => i > 0 && t < times[i - 1]);
}
/** Decide the final status once the individual checks have run. */
function decideStatus(flags) {
    if (flags.outOfOrder || flags.future || flags.duplicate)
        return { status: 'Needs Human Review' };
    if (flags.missingMetadata || flags.stale)
        return { status: 'Partially Verified' };
    if (!flags.hasRecordedHash) {
        return {
            status: 'Unverified',
            reason: 'No hash was recorded earlier, so only a new hash exists.',
        };
    }
    return {
        status: 'Verified',
        reason: 'Hash matches the recorded value and metadata is complete.',
    };
}
/** Verify one evidence item against the rest of the case. */
export async function verify(ev, all) {
    const computedHash = await sha256(ev.bytes ?? ev.content);
    const recordedHash = ev.recordedHash ?? (ev.recordedFrom !== undefined ? await sha256(ev.recordedFrom) : null);
    const times = ev.content.match(ISO_ALL) ?? [];
    const outOfOrder = hasOutOfOrderTimes(ev, times);
    const future = times.some((t) => Date.parse(t) > Date.now());
    const duplicates = all
        .filter((o) => o.id !== ev.id && o.computedHash === computedHash)
        .map((o) => o.id);
    const missing = REQUIRED_METADATA.filter((field) => !ev[field]);
    const ageDays = (Date.now() - Date.parse(ev.uploaded || String(Date.now()))) / MS_PER_DAY;
    const stale = ageDays > STALE_AFTER_DAYS;
    const reasons = [];
    let status;
    if (recordedHash && recordedHash !== computedHash) {
        status = 'Failed';
        reasons.push('SHA-256 differs from the hash recorded at intake. The file is preserved untouched for human review.');
    }
    if (outOfOrder)
        reasons.push('Log timestamps are out of chronological order.');
    if (future)
        reasons.push('Contains timestamps in the future.');
    if (duplicates.length) {
        reasons.push(`Same content hash as ${duplicates.join(', ')} (duplicate).`);
    }
    if (missing.length)
        reasons.push(`Missing metadata: ${missing.join(', ')}.`);
    if (stale)
        reasons.push(`Dataset is older than ${STALE_AFTER_DAYS} days (stale).`);
    if (!status) {
        const decision = decideStatus({
            outOfOrder,
            future,
            duplicate: duplicates.length > 0,
            missingMetadata: missing.length > 0,
            stale,
            hasRecordedHash: recordedHash !== null,
        });
        status = decision.status;
        if (decision.reason)
            reasons.push(decision.reason);
    }
    reasons.push(HASH_NOTE);
    return { computedHash, recordedHash, status, reasons };
}
