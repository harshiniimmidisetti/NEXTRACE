/** Investigation report text and PDF download (jsPDF from cdnjs, print dialog as fallback). */
import { esc, toast } from '../lib/dom.js';
import { W } from '../state/store.js';

interface JsPdfDoc {
  setFontSize(size: number): void;
  splitTextToSize(text: string, width: number): string[];
  addPage(): void;
  text(text: string, x: number, y: number): void;
  save(filename: string): void;
}
declare global {
  interface Window {
    jspdf?: { jsPDF: new () => JsPdfDoc };
  }
}

export function reportLines(): string[] {
  const lines = [
    'NEXTRACE Investigation Report',
    'Case NXT-2026-0001: Bank phishing email campaign',
    'DEMO DATA (synthetic)',
    W.approved ? 'Status: APPROVED by investigator' : 'Status: DRAFT (not approved)',
    '',
    `RECORDS: ${W.ledger.length} ledger entries (ARCHIVE), integrity ${W.ledgerOk ? 'intact' : 'BROKEN'}`,
    '',
    'EVIDENCE INVENTORY',
  ];
  for (const e of W.evidence)
    lines.push(`${e.id} ${e.name} [${e.status}]`, `  SHA-256: ${e.computedHash}`);
  lines.push('', 'FINDINGS (indicators for review, not conclusions about any person)');
  for (const f of W.findings) {
    lines.push(
      `- ${f.title} [${f.kind}, ${f.risk}, confidence ${f.confidence}]`,
      `  ${f.description}`,
      `  Evidence: ${f.evidence.join(', ')}`,
      `  Next: ${f.next}`,
    );
  }
  lines.push('', 'TIMELINE');
  for (const t of W.timeline) lines.push(`${t.time}  ${t.text} (${t.ev})`);
  lines.push(
    '',
    'LIMITATIONS',
    '- Synthetic demo data. Hash matches do not prove authenticity.',
    '- Header dates and IP addresses can be forged; findings need corroboration.',
  );
  return lines;
}

function printFallback(): void {
  toast('PDF library unavailable offline. Using print dialog: choose Save as PDF.');
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(
    `<pre style="font:13px monospace;white-space:pre-wrap">${esc(reportLines().join('\n'))}</pre>`,
  );
  win.print();
}

export function downloadPdf(): void {
  if (!window.jspdf) return printFallback();
  const doc = new window.jspdf.jsPDF();
  let y = 16;
  doc.setFontSize(10);
  for (const line of reportLines()) {
    for (const part of doc.splitTextToSize(line || ' ', 180)) {
      if (y > 280) {
        doc.addPage();
        y = 16;
      }
      doc.text(part, 14, y);
      y += 5.5;
    }
  }
  doc.save('NEXTRACE-report-NXT-2026-0001.pdf');
}
