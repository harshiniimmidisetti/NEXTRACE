/** NEXTRACE logo: shield and fingerprint inside a magnifier lens. */

export const logoMark = (
  size = 34,
): string => `<svg width="${size}" height="${(size * 72) / 64}" viewBox="0 0 64 72" role="img" aria-label="NEXTRACE">
<defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7563C9"/><stop offset="1" stop-color="#C8BDF4"/></linearGradient></defs>
<path d="M32 3l26 9v22c0 18-12 29-26 35C18 63 6 52 6 34V12z" fill="var(--shield)" stroke="url(#lg)" stroke-width="3"/>
<circle cx="30" cy="32" r="13" fill="none" stroke="var(--lens)" stroke-width="3"/>
<path d="M39.5 41.5L50 52" stroke="var(--lens)" stroke-width="4.5" stroke-linecap="round"/>
<g fill="none" stroke="#7563C9" stroke-width="2" stroke-linecap="round">
<path d="M24 38v-4a6 6 0 0112 0v3"/><path d="M20.5 36v-3a9.5 9.5 0 0119 0"/><path d="M30 38v-5"/><path d="M27 41c1 .8 2 1 3 1"/></g>
<g stroke="#C8BDF4" stroke-width="1.4" stroke-linecap="round"><path d="M12 20h6M12 26h4M46 20h6M48 26h4"/></g>
<g fill="#C8BDF4"><circle cx="19" cy="20" r="1.4"/><circle cx="17" cy="26" r="1.4"/><circle cx="45" cy="20" r="1.4"/></g></svg>`;

export const logo = (size: number): string =>
  `<span class="logo">${logoMark(size)}<span>NEXTRACE</span></span>`;
