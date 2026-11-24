/** An empty `apiUrl` means DEMO MODE: no backend, no API key. */
export const getConfig = () => ({ apiUrl: '', ...window.NEXTRACE_CONFIG });
