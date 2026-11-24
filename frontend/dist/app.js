/** NEXTRACE entry point: hash router, sign-in and page-level events. */
import { workspaceView } from './components/workspace/WorkspaceView.js';
import { getConfig } from './config.js';
import { $, toast } from './lib/dom.js';
import { icon } from './components/Icon.js';
import { dashboardPage } from './pages/dashboard.js';
import { CASES, DEMO_ACCOUNTS, DEMO_PASSWORD } from './pages/demoData.js';
import { landingPage } from './pages/landing.js';
import { loginPage } from './pages/login.js';
import { setToken } from './services/nexa.js';
import { mountWorkspace, syncNexa } from './ui/mount.js';
import { registerWorkspaceEvents } from './ui/workspaceEvents.js';
const ROLES = ['police', 'investigator', 'admin'];
const isRole = (value) => ROLES.includes(value);
const app = { role: 'police', user: null, cases: [...CASES] };
const go = (hash) => {
    location.hash = hash;
};
/** Toggle between light and dark, starting from the system preference. */
function toggleTheme() {
    const root = document.documentElement;
    const dark = root.dataset.theme
        ? root.dataset.theme === 'dark'
        : matchMedia('(prefers-color-scheme:dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
}
/* ---------- Router ---------- */
function render() {
    const route = location.hash.slice(1) || 'home';
    const root = $('#app');
    if (route === 'login') {
        root.innerHTML = loginPage(app.role);
    }
    else if (isRole(route)) {
        if (app.user?.role !== route)
            return go('login');
        root.innerHTML = dashboardPage(route, app.cases);
    }
    else if (route === 'case') {
        if (!app.user)
            return go('login');
        root.innerHTML = workspaceView(app.user.role);
    }
    else {
        root.innerHTML = landingPage();
    }
    window.scrollTo(0, 0);
    syncNexa(route);
}
/* ---------- Sign in ---------- */
const showError = (message) => {
    $('#err').textContent = message;
};
/** Used only when config.js sets apiUrl; otherwise the demo login runs. */
async function backendLogin() {
    const email = $('#em').value.trim();
    const password = $('#pw').value;
    if (!email || !password)
        return showError('Enter your email and password.');
    try {
        const res = await fetch(`${getConfig().apiUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = (await res.json().catch(() => ({})));
        if (!res.ok || !data.role || !data.access_token)
            return showError(data.detail ?? 'Sign in failed.');
        app.user = { role: data.role };
        await setToken(data.access_token);
        go(data.role);
    }
    catch {
        showError('Backend unreachable. Clear apiUrl in config.js to use demo mode.');
    }
}
function demoLogin() {
    const account = DEMO_ACCOUNTS[app.role];
    const email = $('#em').value.trim().toLowerCase();
    const password = $('#pw').value;
    if (!email || !password)
        return showError('Enter your email or officer ID and password.');
    if (email !== account.email || password !== DEMO_PASSWORD) {
        return showError(`These details don't match the ${account.label} demo account. Try the demo login button.`);
    }
    app.user = { role: app.role };
    go(app.role);
}
function registerComplaint() {
    const title = $('#ct').value.trim();
    if (!title)
        return;
    const id = `NXT-2026-${String(app.cases.length + 1).padStart(4, '0')}`;
    app.cases.unshift([id, title, $('#cy').value, 'Submitted', 'Unassigned']);
    setTimeout(() => {
        render();
        toast(`Complaint ${id} registered (demo, not saved to a database)`, 2600);
    }, 0);
}
/* ---------- Events ---------- */
const ACTIONS = {
    theme: toggleTheme,
    forgot: () => toast('Password reset is disabled in this demo.', 2600),
    newcase: () => $('#caseDlg').showModal(),
    closedlg: () => $('#caseDlg').close(),
    logout: () => {
        app.user = null;
        void setToken(null);
        go('home');
    },
    demo: () => {
        $('#em').value = DEMO_ACCOUNTS[app.role].email;
        $('#pw').value = DEMO_PASSWORD;
        $('#loginForm').requestSubmit();
    },
    showpw: (button) => {
        const input = $('#pw');
        const reveal = input.type === 'password';
        input.type = reveal ? 'text' : 'password';
        button.innerHTML = icon(reveal ? 'eyeoff' : 'eye');
    },
};
function onClick(e) {
    const target = e.target.closest('[data-go],[data-jump],[data-act],[data-role]');
    if (!target)
        return;
    const { go: goTo, jump, role, act } = target.dataset;
    if (goTo)
        return go(goTo);
    if (jump)
        return document.getElementById(jump)?.scrollIntoView();
    if (role && isRole(role)) {
        app.role = role;
        document
            .querySelectorAll('.role')
            .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.role === role)));
        showError('');
        return;
    }
    if (act)
        void ACTIONS[act]?.(target);
}
function onSubmit(e) {
    const form = e.target;
    if (form.id === 'loginForm') {
        e.preventDefault();
        if (getConfig().apiUrl)
            void backendLogin();
        else
            demoLogin();
    }
    else if (form.id === 'caseForm') {
        registerComplaint();
    }
}
function start() {
    mountWorkspace();
    registerWorkspaceEvents();
    addEventListener('hashchange', render);
    document.addEventListener('click', onClick);
    document.addEventListener('submit', onSubmit);
    render();
}
start();
