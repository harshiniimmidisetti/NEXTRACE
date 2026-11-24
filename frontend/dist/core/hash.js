/** SHA-256 helpers built on the Web Crypto API (browser and Node 20+). */
const encoder = new TextEncoder();
const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
/** Hash a string (UTF-8) or raw bytes and return the lowercase hex digest. */
export async function sha256(data) {
    const bytes = typeof data === 'string' ? encoder.encode(data) : data;
    return toHex(await crypto.subtle.digest('SHA-256', bytes));
}
/** Size of a string in UTF-8 bytes. */
export const byteLength = (text) => encoder.encode(text).length;
