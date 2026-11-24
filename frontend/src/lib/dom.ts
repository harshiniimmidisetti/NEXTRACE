/** Small DOM helpers shared by every layer. */

/** Query a single element. Returns null when it is not on the page. */
export const $ = <T extends Element = HTMLElement>(selector: string): T | null =>
  document.querySelector<T>(selector);

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

/** Escape text so it is safe inside HTML content or a double-quoted attribute. */
export const esc = (value: unknown): string =>
  String(value).replace(/[&<>"]/g, (c) => ESCAPES[c] ?? c);

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Show a short message at the bottom of the screen. */
export function toast(message: string, durationMs = 3200): void {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  document.body.append(el);
  setTimeout(() => el.remove(), durationMs);
}
