/** Connects the store to the DOM: re-renders the workspace and the floating NEXA widget. */
import { nexaWidget } from '../components/nexa/NexaWidget.js';
import { workspaceBody } from '../components/workspace/WorkspaceView.js';
import { $ } from '../lib/dom.js';
import { setRenderer, W } from '../state/store.js';

const SIGNED_IN_ROUTES = ['police', 'investigator', 'admin', 'case'];
const CHAT_SELECTORS = ['#chat', '#nexaChat'];

let nexaRoot: HTMLElement | null = null;

/** Redraw the active workspace tab and the NEXA widget, keeping chats scrolled to the latest message. */
function renderWorkspace(): void {
  const body = $('#ws');
  if (body) body.innerHTML = workspaceBody();
  if (nexaRoot) nexaRoot.innerHTML = nexaWidget();
  for (const selector of CHAT_SELECTORS) {
    const chat = $(selector);
    if (chat) chat.scrollTop = chat.scrollHeight;
  }
}

/** Call once at start-up. */
export function mountWorkspace(): void {
  setRenderer(renderWorkspace);
}

/** Tell NEXA which page is showing so the widget appears only where it should. */
export function syncNexa(route: string): void {
  W.route = route;
  W.nexaVisible = SIGNED_IN_ROUTES.includes(route);
  if (!W.nexaVisible) W.panelOpen = false;
  if (!nexaRoot) {
    nexaRoot = document.createElement('div');
    nexaRoot.id = 'nexa-root';
    document.body.append(nexaRoot);
  }
  nexaRoot.innerHTML = nexaWidget();
}
