/** Small DOM helpers shared by every layer. */
/** Query a single element. Returns null when it is not on the page. */
export const $ = (selector) => document.querySelector(selector);
const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
/** Escape text so it is safe inside HTML content or a double-quoted attribute. */
export const esc = (value) => String(value).replace(/[&<>"]/g, (c) => ESCAPES[c] ?? c);
export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
/** Show a short message at the bottom of the screen. */
export function toast(message, durationMs = 3200) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    document.body.append(el);
    setTimeout(() => el.remove(), durationMs);
}
