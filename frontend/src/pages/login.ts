import { icon, type IconName } from '../components/Icon.js';
import { logo, logoMark } from '../components/Logo.js';
import type { Role } from '../types.js';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from './demoData.js';

const ROLE_ICON: Record<Role, IconName> = {
  police: 'shield',
  investigator: 'search',
  admin: 'users',
};

export function loginPage(selectedRole: Role): string {
  const roles = (Object.entries(DEMO_ACCOUNTS) as Array<[Role, (typeof DEMO_ACCOUNTS)[Role]]>)
    .map(
      ([key, account]) =>
        `<button type="button" class="role" data-role="${key}" aria-pressed="${key === selectedRole}">${icon(ROLE_ICON[key])}${account.label}</button>`,
    )
    .join('');
  return `<div class="login"><aside class="login-l"><div>${logo(36)}<div class="mt-56">${logoMark(120)}</div>
    <h2>Every Clue Matters. Every Evidence Counts.</h2>
    <p>Sign in to manage cases, verify evidence and review what the AI agents found. You decide what goes in the final report.</p></div>
    <button class="btn btn-ghost btn-on-dark" data-go="home">Back to home</button></aside>
  <div class="login-r"><form class="lcard" id="loginForm" novalidate><h1>Sign in</h1><p class="sub">Choose your role, then sign in.</p>
    <div class="roles" role="group" aria-label="Role">${roles}</div>
    <label class="f" for="em">Email or officer ID</label><input class="inp" id="em" autocomplete="username" placeholder="officer@demo.nextrace">
    <label class="f" for="pw">Password</label><div class="pw"><input class="inp" id="pw" type="password" autocomplete="current-password"><button type="button" data-act="showpw" aria-label="Show password">${icon('eye')}</button></div>
    <div class="row"><label><input type="checkbox"> Remember me</label><button type="button" class="link" data-act="forgot">Forgot password?</button></div>
    <div class="err" id="err" role="alert"></div>
    <button class="btn btn-primary btn-block" type="submit">Sign in</button>
    <button class="btn btn-ghost btn-block mt-10" type="button" data-act="demo">Use demo login for this role</button>
    <p class="note"><span class="badge">DEMO ACCOUNTS</span> These are demo accounts for the hackathon. Password for all: <b>${DEMO_PASSWORD}</b>. Do not enter real police, Aadhaar or PAN details.</p></form></div></div>`;
}
