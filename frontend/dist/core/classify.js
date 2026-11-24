/** Guess the evidence type of text pasted from another source. */
import { parseLog } from './indicators.js';
export function classifyText(text) {
    try {
        JSON.parse(text);
        return 'JSON';
    }
    catch {
        /* not JSON: keep checking */
    }
    if (/^From:.+/m.test(text) && /^Subject:/m.test(text))
        return 'EML';
    if (parseLog(text).length >= 2)
        return 'LOG';
    const lines = text.split('\n');
    if (/^[^\n,]+,[^\n,]+/.test(text) && lines.length > 1 && lines[0].includes(','))
        return 'CSV';
    return 'TXT';
}
