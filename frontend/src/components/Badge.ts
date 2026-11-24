/** Status badges. */
import { esc } from '../lib/dom.js';

/** Badge for an evidence verification status. */
export function verificationBadge(status: string | undefined): string {
  const tone =
    status === 'Verified'
      ? 'ok'
      : status === 'Failed'
        ? 'bad'
        : status === 'Needs Human Review'
          ? ''
          : 'info';
  return `<span class="badge ${tone}">${esc(status || 'Not verified')}</span>`;
}

/** Badge for a case status on the dashboards. */
export function caseStatusBadge(status: string): string {
  const tone = status === 'Completed' ? 'ok' : status === 'Active' ? 'info' : '';
  return `<span class="badge ${tone}">${status}</span>`;
}
