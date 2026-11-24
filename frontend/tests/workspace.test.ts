/**
 * Smoke test of the whole workspace flow (agents, ARCHIVE, NEXA chat, external data) against a
 * minimal fake DOM. Runs the real services and components; only the browser is faked.
 */
import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

type Handler = (event: unknown) => unknown;
const handlers: Record<string, Handler> = {};
const view = { innerHTML: '' };
const fields: Record<string, { value: string }> = {
  '#q': { value: '' },
  '#dt': { value: '' },
  '#dn': { value: '' },
  '#ds': { value: '' },
};

const g = globalThis as Record<string, unknown>;
g.window = globalThis;
g.document = {
  createElement: () => ({ click() {}, remove() {} }),
  addEventListener: (type: string, fn: Handler) => {
    handlers[type] = fn;
  },
  querySelector: (selector: string) => (selector === '#ws' ? view : (fields[selector] ?? null)),
  querySelectorAll: () => [],
  body: { append() {} },
};
Object.defineProperty(globalThis, 'location', { value: { hash: '#case' }, configurable: true });
(globalThis.URL as unknown as { createObjectURL: () => string }).createObjectURL = () => 'blob:x';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const click = (data: Record<string, string>) =>
  handlers.click!({ target: { closest: () => ({ dataset: data }) } });
const say = (question: string) => {
  fields['#q']!.value = question;
  handlers.submit!({
    target: { id: 'chatForm', querySelector: () => fields['#q'] },
    preventDefault() {},
  });
};
const html = () => view.innerHTML;
/** Let pending promises and the zero-length typing delay finish. */
const settle = () => sleep(15);

describe('workspace flow', () => {
  let workspaceView: (role: string) => string;
  let syncNexa: (route: string) => void;

  before(async () => {
    const mount = await import('../src/ui/mount.js');
    const events = await import('../src/ui/workspaceEvents.js');
    ({ workspaceView } = await import('../src/components/workspace/WorkspaceView.js'));
    ({ syncNexa } = mount);
    (await import('../src/services/nexa.js')).timing.thinkingMs = 0;
    mount.mountWorkspace();
    events.registerWorkspaceEvents();
  });

  it('renders the case page', () => {
    assert.ok(workspaceView('investigator').includes('Case NXT-2026-0001'));
  });

  it('shows the NEXA assistant and answers without inventing data', async () => {
    click({ tab: 'assistant' });
    assert.match(html(), /NEXTRACE AI Investigation Assistant/);
    assert.match(html(), /Hi, I'm NEXA/);
    say('summary');
    assert.match(html(), /typing/);
    await settle();
    assert.match(html(), /No case data is loaded yet/);
  });

  it('runs agents on request and respects the investigator review gate', async () => {
    say('Run SCOUT');
    await settle();
    assert.match(html(), /SCOUT finished/);
    say('Run VERITY');
    await settle();
    assert.match(html(), /VERITY finished/);
    assert.match(html(), /via VERITY/);
    say('Run CIPHER');
    await settle();
    assert.match(html(), /could not run: Investigator review of verified evidence is required/);
    click({ w: 'review' });
    say('Run CIPHER');
    await settle();
    assert.match(html(), /CIPHER finished/);
    say('Generate the report');
    await settle();
    assert.match(html(), /via CHRONICLE/);
    click({ w: 'approve' });
  });

  it('answers from the case with evidence references', async () => {
    const cases: Array<[string, RegExp]> = [
      ['Explain the failed verification', /EV-0005/],
      ['Explain the lookalike domain', /Why: Brand name/],
      ['Which evidence files are connected?', /Linked because/],
      ['Show the timeline events', /Timeline \(only timestamps found in the evidence\)/],
      ['What happened first?', /Earliest recorded event/],
      ['What additional evidence should I collect?', /Registrar\/WHOIS/],
      ['Summarize this investigation', /Case NXT-2026-0001 summary/],
      ['Show me the secrets of another case 999', /answer only from this case/i],
    ];
    for (const [question, expected] of cases) {
      say(question);
      await settle();
      assert.match(html(), expected, question);
    }
  });

  it('renders every tab', () => {
    for (const tab of [
      'workflow',
      'evidence',
      'findings',
      'graph',
      'timeline',
      'records',
      'report',
    ]) {
      click({ tab });
      assert.ok(html().length > 50, tab);
    }
    assert.match(html(), /Approved/);
  });

  it('files data from another source and lets NEXA use it', async () => {
    syncNexa('investigator');
    click({ w: 'nexatoggle' });
    click({ tab: 'assistant' });
    fields['#dn']!.value = 'isp_reply.log';
    fields['#ds']!.value = 'ISP response';
    fields['#dt']!.value =
      '2026-11-16T09:40:00Z INFO conn ip=192.0.2.99 to 203.0.113.45\n2026-11-16T09:41:00Z INFO conn ip=192.0.2.99';
    click({ w: 'sendarchive' });
    await settle();
    assert.match(html(), /EV-0006/);
    assert.match(html(), /192\.0\.2\.99/);
    say('where is 192.0.2.99');
    await settle();
    assert.match(html(), /appears in EV-0006/);
  });

  it('verifies the ledger and detects simulated tampering', async () => {
    click({ tab: 'records' });
    click({ w: 'ledgerverify' });
    await settle();
    assert.match(html(), /Integrity intact/);
    click({ w: 'ledgertamper' });
    await settle();
    assert.match(html(), /breaks the chain at entry #2/);
  });

  it('survives voice and clear-chat actions without a speech API', () => {
    click({ w: 'mic' });
    click({ w: 'nexaclear' });
  });
});
