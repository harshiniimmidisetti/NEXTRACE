/** NEXA chat UI: messages, suggestions, input form, tools. */
import { esc } from '../../lib/dom.js';
import { SUGGESTIONS } from '../../services/nexa.js';
import { AGENT_NAMES, W } from '../../state/store.js';
import type { ChatMessage } from '../../types.js';
import { icon } from '../Icon.js';

const ACCEPT = '.pdf,.jpg,.jpeg,.png,.txt,.eml,.csv,.json,.log';

export const botAvatar = (size = 28): string =>
  `<span class="nx-av" style="width:${size}px;height:${size}px">${icon('bot')}</span>`;

const GREETING = `Hi, I'm NEXA. I answer only from this case's stored evidence and agent results, and I cite evidence IDs. I can explain findings and verification results, show the timeline, draft a summary, suggest more evidence to collect, or run an agent for you (try "Run VERITY").`;

/** Clickable chips for every evidence ID mentioned in a message. */
const referenceChips = (text: string): string =>
  [...new Set(text.match(/EV-\d{4}/g) ?? [])]
    .map((id) => `<button class="src" data-w="openev">${id}</button>`)
    .join('');

function messageHtml(m: ChatMessage): string {
  if (m.r === 'u') return `<div class="msg u">${esc(m.t)}</div>`;
  const agent = m.agent ? `<span class="badge info">via ${m.agent}</span>` : '';
  const mode = m.mode ? `<span>${esc(m.mode)}</span>` : '';
  const retry = m.retry ? `<button class="src" data-q="${esc(m.retry)}">Retry</button>` : '';
  return `<div class="nx-row">${botAvatar(26)}<div>
    <div class="msg a${m.err ? ' bad' : ''}">${esc(m.t)}</div>
    <div class="nx-meta">${agent}${mode}${referenceChips(m.t)}${retry}</div></div></div>`;
}

const typingBubble = (): string =>
  `<div class="nx-row">${botAvatar(26)}<div class="msg a typing" role="status" aria-label="NEXA is typing"><i></i><i></i><i></i></div></div>`;

function caseSelector(): string {
  if (!W.cases.length) return '';
  const options = W.cases
    .map(
      (c) =>
        `<option value="${c.id}" ${c.id === W.caseId ? 'selected' : ''}>${esc(c.case_code)} ${esc(c.title)}</option>`,
    )
    .join('');
  return `<select class="inp nx-case" id="nexaCase" aria-label="Case"><option value="">Demo case (synthetic)</option>${options}</select>`;
}

const agentDots = (): string =>
  AGENT_NAMES.map((a) => {
    const on = a === 'ARCHIVE' || W.agents[a].status === 'Completed';
    return `<span class="nx-ag"><i class="${on ? 'on' : ''}"></i>${a}</span>`;
  }).join('');

const externalDataForm =
  (): string => `<details class="mt-14"><summary class="summary-btn">Send data from another source to ARCHIVE</summary>
  <label class="f" for="dn">File name</label><input class="inp" id="dn" placeholder="mail_headers.txt">
  <label class="f" for="ds">Where it came from</label><input class="inp" id="ds" placeholder="e.g. ISP response, bank email">
  <label class="f" for="dt">Paste the data</label><textarea class="inp" id="dt" rows="5"></textarea>
  <div class="mt-10"><button class="btn btn-primary" data-w="sendarchive">Send to ARCHIVE</button></div></details>`;

/** The chat panel. `full` is the full-page version; otherwise the floating panel. */
export function chatPanel(full: boolean): string {
  const live = Boolean(W.caseId && W.token);
  const inputId = full ? 'q' : 'nq';
  const messages =
    W.chat.map(messageHtml).join('') ||
    `<div class="nx-row">${botAvatar(26)}<div class="msg a">${GREETING}</div></div>`;
  const panelButtons = full
    ? ''
    : '<button class="icon-btn" data-w="nexafull" aria-label="Open full page">Full page</button><button class="icon-btn" data-w="nexatoggle" aria-label="Close">Close</button>';
  const fullTools = full
    ? `<label class="btn btn-ghost pointer">Attach file<input type="file" id="up2" hidden accept="${ACCEPT}"></label><button class="btn btn-ghost" data-w="reviewcipher">Review and analyze now</button>`
    : '';
  return `<div class="nx-head">${botAvatar(40)}<div class="grow"><b>NEXA</b><div class="nx-sub">NEXTRACE AI Investigation Assistant</div></div>
    <span class="badge ${live ? 'ok' : ''}">${live ? 'Claude via backend' : 'Demo assistant'}</span>${panelButtons}</div>
  <div class="nx-ctx">${caseSelector() || 'Case: NXT-2026-0001 <span class="badge">DEMO DATA</span>'}<span class="nx-agents">${agentDots()}</span></div>
  <div class="chat" id="${full ? 'chat' : 'nexaChat'}" aria-live="polite">${messages}${W.typing ? typingBubble() : ''}</div>
  <div class="nx-sug">${SUGGESTIONS.map((s) => `<button class="tab" data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div>
  <form id="${full ? 'chatForm' : 'nexaForm'}" class="nx-form"><input class="inp" id="${inputId}" value="${esc(W.draft[inputId] ?? '')}" placeholder="Ask NEXA about this case" autocomplete="off">
    <button class="btn btn-ghost" type="button" data-w="mic">${W.listening ? 'Listening...' : 'Mic'}</button>
    <button class="btn btn-primary" type="submit" ${W.typing ? 'disabled' : ''}>Send</button></form>
  <div class="nx-tools"><button class="btn btn-ghost" data-w="speak">Voice replies: ${W.speak ? 'On' : 'Off'}</button><button class="btn btn-ghost" data-w="nexaclear">Clear chat</button>${fullTools}</div>
  ${full ? externalDataForm() : ''}
  <p class="note mt-10">NEXA uses only this case's data, never invents evidence, timestamps or findings, and findings are leads for the investigator.</p>`;
}
