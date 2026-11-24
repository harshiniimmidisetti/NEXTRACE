import { esc } from '../../lib/dom.js';
import { W } from '../../state/store.js';
import { verificationBadge } from '../Badge.js';

export function evidenceTable(): string {
  if (!W.evidence.length) {
    return '<p class="muted">No evidence yet. Run SCOUT to import the demo dataset, or upload a file.</p>';
  }
  const rows = W.evidence
    .map(
      (e) => `<tr><td><b>${e.id}</b></td>
        <td>${esc(e.name)} ${e.demo ? '<span class="badge">DEMO</span>' : ''}</td>
        <td>${e.size} B</td><td>${esc(e.source || 'Missing')}</td>
        <td>${verificationBadge(e.status)}</td>
        <td class="mono">${e.computedHash ? `${e.computedHash.slice(0, 16)}…` : '-'}</td></tr>`,
    )
    .join('');
  return `<div class="scroll"><table class="tbl"><thead><tr><th>ID</th><th>File</th><th>Size</th><th>Source</th><th>Status</th><th>SHA-256</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
