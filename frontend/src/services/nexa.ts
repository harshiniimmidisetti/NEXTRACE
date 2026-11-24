/**
 * NEXA: investigation assistant. Chat, agent commands, voice, and optional Claude via the backend.
 * The Claude API key lives on the server only and never reaches the browser.
 */
import { answer as demoAnswer } from '../core/index.js';
import { getConfig } from '../config.js';
import { sleep } from '../lib/dom.js';
import { log } from '../state/records.js';
import { refresh, snapshot, W } from '../state/store.js';
import type { AgentName, CaseSummary, ChatMessage } from '../types.js';
import { runChronicle, runCipher, runScout, runVerity } from './agents.js';
import { listen, speak } from './voice.js';

export const SUGGESTIONS = [
  'Summarize this investigation',
  'What suspicious activities were identified?',
  'Explain the failed verification',
  'Which evidence files are connected?',
  'What happened first?',
  'What additional evidence should I collect?',
  'Run VERITY',
  'Generate the report',
];

const DEMO_MODE = 'Demo assistant (synthetic data)';
/** Short pause so the typing indicator is visible. Tests set this to 0. */
export const timing = { thinkingMs: 450 };

/** Which agent "owns" a question, shown as the "via AGENT" tag on answers. */
const AGENT_BY_TOPIC: Array<[RegExp, AgentName]> = [
  [/run scout|import (the )?demo/, 'SCOUT'],
  [/record|custody|ledger|audit|archive/, 'ARCHIVE'],
  [/verif|hash|tamper|duplicate|fail/, 'VERITY'],
  [/report|chronicle|summar|recommend|additional|collect/, 'CHRONICLE'],
  [
    /suspicious|indicator|finding|\bip\b|domain|connect|relation|timeline|first|explain|why|where|tell me/,
    'CIPHER',
  ],
];
export const agentFor = (question: string): AgentName => {
  const q = question.toLowerCase();
  return AGENT_BY_TOPIC.find(([re]) => re.test(q))?.[1] ?? 'CIPHER';
};

interface Command {
  pattern: RegExp;
  agent: AgentName;
  run: () => unknown;
  done: () => string;
}

const COMMANDS: Command[] = [
  {
    pattern: /\brun scout\b|import (the )?demo/,
    agent: 'SCOUT',
    run: runScout,
    done: () => `${W.evidence.length} evidence files are in the case.`,
  },
  {
    pattern: /\brun verity\b|verify (all|the) evidence/,
    agent: 'VERITY',
    run: runVerity,
    done: () =>
      `${W.evidence.filter((e) => e.status === 'Verified').length} of ${W.evidence.length} verified.`,
  },
  {
    pattern: /\brun cipher\b|analy[sz]e (the )?(case|evidence)/,
    agent: 'CIPHER',
    run: runCipher,
    done: () => `${W.findings.length} findings.`,
  },
  {
    pattern: /generate (the )?(report|draft)|run chronicle/,
    agent: 'CHRONICLE',
    run: runChronicle,
    done: () => 'Draft report ready. The investigator must approve it.',
  },
];

type Reply = Omit<ChatMessage, 'r'>;

/** Run an agent when the user asks for it in chat. Returns null if the text is not a command. */
async function runCommand(question: string): Promise<Reply | null> {
  const q = question.toLowerCase();
  const command = COMMANDS.find((c) => c.pattern.test(q));
  if (!command) return null;
  W.agents[command.agent].error = '';
  await command.run();
  const state = W.agents[command.agent];
  return {
    agent: command.agent,
    mode: 'Agent action',
    t: state.error
      ? `${command.agent} could not run: ${state.error}`
      : `${command.agent} finished (${state.status}). ${command.done()}`,
  };
}

interface BackendReply {
  answer?: string;
}

/** Ask the backend (Claude). Returns null when no backend, token or case is configured. */
async function backendAnswer(question: string): Promise<BackendReply | null> {
  const { apiUrl } = getConfig();
  if (!apiUrl || !W.token || !W.caseId) return null;
  const history = W.chat
    .filter((m) => !m.err)
    .slice(-10)
    .map((m) => ({ role: m.r === 'u' ? 'user' : 'assistant', content: m.t }));
  const res = await fetch(`${apiUrl}/api/nexa/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${W.token}` },
    body: JSON.stringify({ case_id: W.caseId, message: question, history }),
  });
  const data = (await res.json().catch(() => ({}))) as BackendReply & { detail?: string };
  if (!res.ok) throw new Error(data.detail ?? `Server error ${res.status}`);
  return data;
}

async function produceReply(question: string): Promise<Reply> {
  const command = await runCommand(question);
  if (command) return command;
  const remote = await backendAnswer(question);
  if (remote?.answer)
    return { agent: agentFor(question), t: remote.answer, mode: 'Claude (backend)' };
  await sleep(timing.thinkingMs);
  return {
    agent: agentFor(question),
    t: demoAnswer(question, snapshot()),
    mode: remote ? 'Demo (server has no Claude key)' : DEMO_MODE,
  };
}

/** Handle one user question end to end. */
export async function ask(input: string): Promise<void> {
  const question = input.trim();
  if (!question || W.typing) return;
  W.chat.push({ r: 'u', t: question });
  W.typing = true;
  log('ARCHIVE', `NEXA question recorded: ${question.slice(0, 80)}`);
  refresh();
  try {
    W.chat.push({ r: 'a', ...(await produceReply(question)) });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    W.chat.push({ r: 'a', err: true, t: `NEXA could not answer: ${message}`, retry: question });
  }
  W.typing = false;
  refresh();
  const last = W.chat[W.chat.length - 1];
  if (last && !last.err) speak(last.t);
}

/** Post an assistant message without a question (used after uploads and reviews). */
export function reply(text: string, agent: AgentName = 'ARCHIVE'): void {
  W.chat.push({ r: 'a', t: text, agent, mode: DEMO_MODE });
  refresh();
  speak(text);
}

export const startVoiceInput = (): void => listen((text) => void ask(text));

/** Store the sign-in token and load the cases the backend lets this user see. */
export async function setToken(token: string | null): Promise<void> {
  W.token = token;
  W.cases = [];
  W.caseId = null;
  const { apiUrl } = getConfig();
  if (!token || !apiUrl) return;
  try {
    const res = await fetch(`${apiUrl}/api/cases`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      W.cases = (await res.json()) as CaseSummary[];
      W.caseId = W.cases[0]?.id ?? null;
    }
  } catch {
    /* backend unreachable: stay in demo mode */
  }
  refresh();
}
