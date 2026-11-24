import { icon, type IconName } from '../components/Icon.js';
import { logo, logoMark } from '../components/Logo.js';
import { AGENTS } from './demoData.js';

const WORKFLOW: ReadonlyArray<[string, string]> = [
  ['Create case', 'Title, type, priority'],
  ['Upload evidence', 'Validated, never executed'],
  ['SCOUT collects', 'Imports and indexes'],
  ['VERITY verifies', 'SHA-256 and checks'],
  ['Investigator reviews', 'Human decision'],
  ['CIPHER analyses', 'Findings with reasons'],
  ['Correlation', 'Only matching evidence'],
  ['Timeline', 'Real timestamps only'],
  ['CHRONICLE reports', 'Draft report'],
  ['Investigator approves', 'Final sign-off'],
];

const CAPABILITIES: ReadonlyArray<[string, string, IconName]> = [
  ['Evidence vault', 'Original files preserved; analysis runs on working copies.', 'lock'],
  ['Relationship graph', 'Link emails, URLs, IPs and logs when evidence supports it.', 'grid'],
  ['Crime timeline', 'Chronological events with confidence and verification status.', 'clock'],
  ['Case assistant', 'Ask questions about one case and get evidence references.', 'brain'],
  ['Chain of custody', 'Every access and change recorded for audit.', 'users'],
  ['PDF reports', 'Inventory, hashes, findings and limitations in one document.', 'file'],
];

const header = (): string => `<header class="topnav"><div class="wrap">${logo(30)}
  <nav aria-label="Main"><a data-jump="platform">Platform</a><a data-jump="agents">AI agents</a><a data-jump="workflow">Workflow</a><a data-jump="security">Security</a></nav>
  <span class="spacer"></span><button class="icon-btn" data-act="theme" aria-label="Toggle dark mode">${icon('moon')}</button>
  <button class="btn btn-primary" data-go="login">Sign in</button></div></header>`;

const hero = (): string => `<section class="hero"><div class="wrap"><div>
  <span class="badge info">Hackathon demo platform</span>
  <h1 class="mt-16">Intelligence Behind Every Investigation.</h1>
  <p class="lead">NEXTRACE brings evidence collection, verification, forensic analysis and reporting into one case workspace, with five AI agents and an investigator approving every result.</p>
  <div class="cta"><button class="btn btn-primary" data-go="login">Get started</button><button class="btn btn-ghost" data-jump="platform">Explore platform</button></div>
  <p class="tagline">Every Clue Matters. Every Evidence Counts.</p></div>
  <div class="hero-art" aria-hidden="true"><div class="ring"></div>${logoMark(220)}
    <div class="chip" style="left:6%;top:12%">${icon('file')}phishing.eml</div>
    <div class="chip" style="right:5%;top:24%">${icon('check')}SHA-256 matched</div>
    <div class="chip" style="left:8%;bottom:16%">${icon('pulse')}Login burst found</div>
    <div class="chip" style="right:8%;bottom:9%">${icon('clock')}Timeline built</div></div></div></section>`;

const agentsSection = (): string => `<section class="block" id="agents"><div class="wrap">
  <div class="sec-head"><h2>Five agents, five clear jobs</h2><p>Each agent has its own status, logs and output, and none of them declares anyone guilty.</p></div>
  <div class="grid4">${AGENTS.map(
    (a) =>
      `<article class="card agent"><div class="ico">${icon(a.icon)}</div><h3>${a.key}</h3><div class="tag">${a.title}</div><p class="mt-8">${a.description}</p></article>`,
  ).join('')}</div></div></section>`;

const workflowSection =
  (): string => `<section class="block surface" id="workflow"><div class="wrap">
  <div class="sec-head"><h2>From complaint to approved report</h2><p>Ten steps, with a human review before analysis and again before the report is final.</p></div>
  <ol class="flow">${WORKFLOW.map(([title, note]) => `<li>${title}<small>${note}</small></li>`).join('')}</ol></div></section>`;

const platformSection = (): string => `<section class="block" id="platform"><div class="wrap">
  <div class="sec-head"><h2>Platform capabilities</h2></div>
  <div class="grid4">${CAPABILITIES.map(
    ([title, text, ic]) =>
      `<article class="card"><div class="agent"><div class="ico">${icon(ic)}</div></div><h3 class="cap-title">${title}</h3><p class="cap-text">${text}</p></article>`,
  ).join('')}</div></div></section>`;

const securitySection =
  (): string => `<section class="block" id="security"><div class="wrap"><div class="secure"><div>
  <h2>Evidence integrity, stated honestly</h2>
  <p class="mt-12">A matching SHA-256 hash shows that content matches the recorded hash. It does not prove the original evidence is authentic or truthful, so suspicious and failed items are kept for human review.</p></div>
  <ul><li>${icon('lock')}Uploaded files are never executed</li><li>${icon('check')}Verification shows the reason for every result</li><li>${icon('users')}Role-based access for officers, investigators and admins</li><li>${icon('clock')}Chain of custody and audit trail on every action</li></ul></div></div></section>`;

const footer = (): string =>
  `<footer><div class="wrap">${logo(24)}<span>Demo platform with synthetic data. Do not enter real credentials or case information.</span></div></footer>`;

export const landingPage = (): string =>
  `${header()}<main>${hero()}${agentsSection()}${workflowSection()}${platformSection()}${securitySection()}</main>${footer()}`;
