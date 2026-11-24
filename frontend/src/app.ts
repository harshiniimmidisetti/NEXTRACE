/** NEXTRACE entry point: hash router, sign-in and page-level events. */
import { workspaceView } from './components/workspace/WorkspaceView.js';
import { getConfig } from './config.js';
import { $, toast } from './lib/dom.js';
import { icon } from './components/Icon.js';
import { dashboardPage } from './pages/dashboard.js';
import { CASES, DEMO_ACCOUNTS, DEMO_PASSWORD, type CaseRow } from './pages/demoData.js';
import { landingPage } from './pages/landing.js';
import { loginPage } from './pages/login.js';
import { setToken } from './services/nexa.js';
import type { Role } from './types.js';
import { mountWorkspace, syncNexa } from './ui/mount.js';
import { registerWorkspaceEvents } from './ui/workspaceEvents.js';

const ROLES: readonly Role[] = ['police', 'investigator', 'admin'];
const isRole = (value: string): value is Role => (ROLES as readonly string[]).includes(value);

interface AppState {
  /** Role highlighted on the sign-in page. */
  role: Role;
  user: { role: Role } | null;
  cases: CaseRow[];
}
const app: AppState = { role: 'police', user: null, cases: [...CASES] };

const go = (hash: string): void => {
  location.hash = hash;
};

/** Toggle between light and dark, starting from the system preference. */
function toggleTheme(): void {
  const root = document.documentElement;
  const dark = root.dataset.theme
    ? root.dataset.theme === 'dark'
    : matchMedia('(prefers-color-scheme:dark)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
}

/* ---------- Router ---------- */

function render(): void {
  const route = location.hash.slice(1) || 'home';
  const root = $('#app')!;
  if (route === 'login') {
    root.innerHTML = loginPage(app.role);
  } else if (isRole(route)) {
    if (app.user?.role !== route) return go('login');
    root.innerHTML = dashboardPage(route, app.cases);
  } else if (route === 'case') {
    if (!app.user) return go('login');
    root.innerHTML = workspaceView(app.user.role);
  } else {
    root.innerHTML = landingPage();
  }
  window.scrollTo(0, 0);
  syncNexa(route);
}

/* ---------- Sign in ---------- */

const showError = (message: string): void => {
  $('#err')!.textContent = message;
};

/** Used only when config.js sets apiUrl; otherwise the demo login runs. */
async function backendLogin(): Promise<void> {
  const email = $<HTMLInputElement>('#em')!.value.trim();
  const password = $<HTMLInputElement>('#pw')!.value;
  if (!email || !password) return showError('Enter your email and password.');
  try {
    const res = await fetch(`${getConfig().apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      detail?: string;
      role?: Role;
      access_token?: string;
    };
    if (!res.ok || !data.role || !data.access_token)
      return showError(data.detail ?? 'Sign in failed.');
    app.user = { role: data.role };
    await setToken(data.access_token);
    go(data.role);
  } catch {
    showError('Backend unreachable. Clear apiUrl in config.js to use demo mode.');
  }
}

function demoLogin(): void {
  const account = DEMO_ACCOUNTS[app.role];
  const email = $<HTMLInputElement>('#em')!.value.trim().toLowerCase();
  const password = $<HTMLInputElement>('#pw')!.value;
  if (!email || !password) return showError('Enter your email or officer ID and password.');
  if (email !== account.email || password !== DEMO_PASSWORD) {
    return showError(
      `These details don't match the ${account.label} demo account. Try the demo login button.`,
    );
  }
  app.user = { role: app.role };
  go(app.role);
}

function registerComplaint(): void {
  const title = $<HTMLInputElement>('#ct')!.value.trim();
  if (!title) return;
  const id = `NXT-2026-${String(app.cases.length + 1).padStart(4, '0')}`;
  app.cases.unshift([id, title, $<HTMLSelectElement>('#cy')!.value, 'Submitted', 'Unassigned']);
  setTimeout(() => {
    render();
    toast(`Complaint ${id} registered (demo, not saved to a database)`, 2600);
  }, 0);
}

/* ---------- Events ---------- */

const ACTIONS: Record<string, (button: HTMLElement) => unknown> = {
  theme: toggleTheme,
  forgot: () => toast('Password reset is disabled in this demo.', 2600),
  newcase: () => $<HTMLDialogElement>('#caseDlg')!.showModal(),
  closedlg: () => $<HTMLDialogElement>('#caseDlg')!.close(),
  logout: () => {
    app.user = null;
    void setToken(null);
    go('home');
  },
  demo: () => {
    $<HTMLInputElement>('#em')!.value = DEMO_ACCOUNTS[app.role].email;
    $<HTMLInputElement>('#pw')!.value = DEMO_PASSWORD;
    $<HTMLFormElement>('#loginForm')!.requestSubmit();
  },
  showpw: (button) => {
    const input = $<HTMLInputElement>('#pw')!;
    const reveal = input.type === 'password';
    input.type = reveal ? 'text' : 'password';
    button.innerHTML = icon(reveal ? 'eyeoff' : 'eye');
  },
};

function onClick(e: Event): void {
  const target = (e.target as Element).closest<HTMLElement>(
    '[data-go],[data-jump],[data-act],[data-role]',
  );
  if (!target) return;
  const { go: goTo, jump, role, act } = target.dataset;
  if (goTo) return go(goTo);
  if (jump) return document.getElementById(jump)?.scrollIntoView();
  if (role && isRole(role)) {
    app.role = role;
    document
      .querySelectorAll<HTMLElement>('.role')
      .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.role === role)));
    showError('');
    return;
  }
  if (act) void ACTIONS[act]?.(target);
}

function onSubmit(e: Event): void {
  const form = e.target as HTMLFormElement;
  if (form.id === 'loginForm') {
    e.preventDefault();
    if (getConfig().apiUrl) void backendLogin();
    else demoLogin();
  } else if (form.id === 'caseForm') {
    registerComplaint();
  }
}

function start(): void {
  mountWorkspace();
  registerWorkspaceEvents();
  addEventListener('hashchange', render);
  document.addEventListener('click', onClick);
  document.addEventListener('submit', onSubmit);
  render();
}

start();
