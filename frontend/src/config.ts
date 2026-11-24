/** Runtime configuration, read from `config.js` (which sets `window.NEXTRACE_CONFIG`). */
import type { NextraceConfig } from './types.js';

declare global {
  interface Window {
    NEXTRACE_CONFIG?: Partial<NextraceConfig>;
  }
}

/** An empty `apiUrl` means DEMO MODE: no backend, no API key. */
export const getConfig = (): NextraceConfig => ({ apiUrl: '', ...window.NEXTRACE_CONFIG });
