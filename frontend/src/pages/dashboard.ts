import { caseStatusBadge } from '../components/Badge.js';
import { icon } from '../components/Icon.js';
import { logo } from '../components/Logo.js';
import { esc } from '../lib/dom.js';
import type { Role } from '../types.js';
import {
  AGENTS,
  DEMO_ACCOUNTS,
  INCIDENT_TYPES,
  SOURCES,
  VIEWS,
  type CaseRow,
  type DashboardView,
} from './demoData.js';

const sidebar = (role: Role, view: DashboardView): string => {
  const user = DEMO_ACCOUNTS[role];
  return `<aside class="side">${logo(28)}
    <a class="on" data-jump="overview">${icon('grid')}Overview</a><a data-jump="cases">${icon('case')}Cases</a><a data-go="case">${icon('search')}Case workspace</a>
    ${view.showAgents ? `<a data-jump="agentstatus">${icon('brain')}AI agents</a>` : ''}<a data-jump="feed">${icon('pulse')}${view.feedTitle}</a>
    <div class="who"><b>${user.name}</b><br>${user.label}<br><button class="nav btn-who" data-act="logout">${icon('out')}Sign out</button></div></aside>`;
};

const trendChart = (view: DashboardView): string => {
  const max = Math.max(...view.trend.map(([, value]) => value));
  const bars = view.trend
    .map(
      ([label, value]) =>
        `<div><span>${value}</span><i style="height:${Math.round((value / max) * 100)}%"></i><span>${label}</span></div>`,
    )
    .join('');
  return `<div class="chart" role="img" aria-label="${view.trendTitle}">${bars}</div>`;
};

const casesTable = (cases: readonly CaseRow[]): string => {
  const rows = cases
    .map(
      ([id, title, type, status, owner]) =>
        `<tr><td><b>${esc(id)}</b></td><td>${esc(title)}</td><td>${esc(type)}</td><td>${caseStatusBadge(status)}</td><td>${esc(owner)}</td></tr>`,
    )
    .join('');
  return `<div class="card mb-20" id="cases"><h3>Cases <span class="badge">${cases.length} in this demo</span></h3><div class="scroll"><table class="tbl"><thead><tr><th>Case ID</th><th>Title</th><th>Type</th><th>Status</th><th>Investigator</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
};

const agentStatusCard = (): string =>
  `<div class="card"><h3>AI agents status</h3>${AGENTS.map(
    (a) =>
      `<div class="ag"><div class="top"><span>${a.key} <small>${a.title}</small></span><span class="badge ${a.progress === 100 ? 'ok' : a.progress ? '' : 'info'}">${a.status}</span></div><div class="prog"><i style="width:${a.progress}%"></i></div><small>${a.last}</small></div>`,
  ).join('')}</div>`;

const sourcesCard = (): string =>
  `<div class="card"><h3>Data source status</h3>${SOURCES.map(
    ([name, text, tone]) =>
      `<div class="ag"><div class="top"><span>${name}</span><span class="badge ${tone}">${text.split(' (')[0]}</span></div><small>${text}</small></div>`,
  ).join(
    '',
  )}<p class="note">External sources are never shown as connected unless a live connection exists.</p></div>`;

const quickAccessCard = (): string =>
  `<div class="card"><h3>Quick access</h3><p class="muted mb-12">Run the four agents, upload evidence, and view the graph, timeline and report.</p><button class="btn btn-primary" data-go="case">Open case workspace</button></div>`;

const newComplaintDialog =
  (): string => `<dialog id="caseDlg"><form method="dialog" id="caseForm"><h3 class="mb-14">New complaint</h3>
  <label class="f" for="ct">Case title</label><input class="inp" id="ct" required>
  <label class="f" for="cy">Incident type</label><select class="inp" id="cy">${INCIDENT_TYPES.map((t) => `<option>${t}</option>`).join('')}</select>
  <div class="row dialog-actions"><button class="btn btn-ghost" type="button" data-act="closedlg">Cancel</button><button class="btn btn-primary" type="submit">Register complaint</button></div></form></dialog>`;

export function dashboardPage(role: Role, cases: readonly CaseRow[]): string {
  const view = VIEWS[role];
  const agentRow = view.showAgents
    ? `<div class="cols" id="agentstatus">${agentStatusCard()}${view.showSources ? sourcesCard() : quickAccessCard()}</div>`
    : '';
  return `<div class="app">${sidebar(role, view)}
  <main class="main" id="overview"><div class="bar"><h1>${view.title}</h1><span class="badge">DEMO DATA</span>
    <button class="icon-btn" data-act="theme" aria-label="Toggle dark mode">${icon('moon')}</button>
    <button class="btn btn-ghost" data-go="case">Case workspace</button>
    ${role === 'police' ? `<button class="btn btn-primary" data-act="newcase">${icon('plus')}New complaint</button>` : ''}</div>
    <div class="stats">${view.stats.map(([label, value]) => `<div class="card stat"><span>${label}</span><b>${value}</b></div>`).join('')}</div>
    <div class="cols"><div class="card"><h3>${view.trendTitle}</h3>${trendChart(view)}</div>
      <div class="card" id="feed"><h3>${view.feedTitle}</h3><ul class="feed">${view.feed.map(([title, note]) => `<li>${title}<small>${note}</small></li>`).join('')}</ul></div></div>
    ${casesTable(cases)}${agentRow}</main></div>${newComplaintDialog()}`;
}
