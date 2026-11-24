import { esc } from '../../lib/dom.js';
import { W } from '../../state/store.js';
import type { AgentName } from '../../types.js';

/** Card showing one agent's status, progress and actions. */
export function agentCard(agent: AgentName, info: string, actions: string): string {
  const s = W.agents[agent];
  const tone = s.status === 'Completed' ? 'ok' : s.status === 'Failed' ? 'bad' : 'info';
  return `<div class="card"><h3>${agent} <span class="badge ${tone}">${s.status}</span></h3>
    <p class="muted-sm">${info}</p>
    <div class="prog"><i style="width:${s.progress}%"></i></div><small>Last run: ${s.last}</small>
    ${s.error ? `<p class="err mt-8">${esc(s.error)}</p>` : ''}
    <div class="actions mt-12">${actions}</div></div>`;
}
