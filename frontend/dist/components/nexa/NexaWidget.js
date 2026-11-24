/** Floating NEXA button and panel, shown on signed-in pages. */
import { W } from '../../state/store.js';
import { botAvatar, chatPanel } from './Chat.js';
export function nexaWidget() {
    if (!W.nexaVisible || (W.route === 'case' && W.tab === 'assistant'))
        return '';
    const panel = W.panelOpen
        ? `<section class="nx-panel" role="dialog" aria-label="NEXA investigation assistant">${chatPanel(false)}</section>`
        : '';
    return `<button class="nx-fab" data-w="nexatoggle" aria-label="Open NEXA assistant" aria-expanded="${W.panelOpen}">${botAvatar(26)}<span>NEXA</span></button>${panel}`;
}
