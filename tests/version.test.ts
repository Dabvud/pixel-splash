import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatVersion } from '../src/version';
import { DEFAULTS } from '../src/settings';
import { createLabMenu } from '../src/ui/lab-menu';

beforeEach(() => {
  vi.stubGlobal('__APP_VERSION__', '0.3.0');
  vi.stubGlobal('__COMMIT_HASH__', 'd7bede2');
  vi.stubGlobal('__BUILD_DATE__', '2026-11-11T07:55:00Z');
});
afterEach(() => {
  document.body.replaceChildren();
  vi.unstubAllGlobals();
});

describe('Versionszeile', () => {
  it('formatiert Version, Commit und Build-Zeit in Europe/Berlin', () => {
    expect(formatVersion('0.3.0', 'd7bede2', new Date('2026-11-11T07:55:00Z')))
      .toBe('v0.3.0 · d7bede2 · 11.11. 08:55');
  });

  it('berücksichtigt Sommerzeit und den Datumswechsel', () => {
    expect(formatVersion('0.3.0', 'abc1234', new Date('2026-06-30T22:05:00Z')))
      .toBe('v0.3.0 · abc1234 · 01.07. 00:05');
  });

  it.each([undefined, '', '  '])('verwendet dev bei fehlendem Hash %s', hash => {
    expect(formatVersion('0.3.0', hash, new Date('2026-11-11T07:55:00Z')))
      .toBe('v0.3.0 · dev · 11.11. 08:55');
  });

  it.each(['shot', 'play'] as const)('erzeugt die dauerhafte Zeile und dieselbe Zeile unter Pause im Modus %s', mode => {
    createLabMenu(document.body, { ...DEFAULTS, mode }, () => {});
    const corner = document.querySelector<HTMLElement>('.app-version');
    const pauseVersion = document.querySelector('#pause-title + .build-version');
    expect(corner).not.toBeNull();
    expect(corner!.hidden).toBe(false);
    expect(corner!.closest('dialog')).toBeNull();
    expect(corner!.textContent).toMatch(/^v0\.3\.0 · \S+ · \d{2}\.\d{2}\. \d{2}:\d{2}$/);
    expect(pauseVersion?.textContent).toBe(corner!.textContent);
  });
});
