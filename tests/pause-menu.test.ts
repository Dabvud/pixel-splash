import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULTS } from '../src/settings';
import { createLabMenu } from '../src/ui/lab-menu';

// jsdom kennt showModal/close nicht
beforeEach(() => {
  document.body.innerHTML = '';
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event('close')); };
});

const q = <T extends HTMLElement>(s: string) => document.querySelector<T>(s)!;

describe('Pause-Menü', () => {
  it('pausiert beim Öffnen und setzt mit „Weiter“ fort', () => {
    const toggle = vi.fn();
    createLabMenu(document.body, DEFAULTS, () => {}, toggle, () => {});
    q('#lab-open').click();
    expect(q<HTMLDialogElement>('#pause').open).toBe(true);
    expect(toggle).toHaveBeenLastCalledWith(true);
    q('#pause-resume').click();
    expect(q<HTMLDialogElement>('#pause').open).toBe(false);
    expect(toggle).toHaveBeenLastCalledWith(false);
  });

  it('startet neu und setzt fort', () => {
    const toggle = vi.fn(), restart = vi.fn();
    createLabMenu(document.body, DEFAULTS, () => {}, toggle, restart);
    q('#lab-open').click();
    q('#pause-restart').click();
    expect(restart).toHaveBeenCalledTimes(1);
    expect(toggle).toHaveBeenLastCalledWith(false);
  });

  it('bleibt pausiert, solange die Einstellungen offen sind', () => {
    const toggle = vi.fn();
    createLabMenu(document.body, DEFAULTS, () => {}, toggle, () => {});
    q('#lab-open').click();
    q('#pause-settings').click();
    expect(q<HTMLDialogElement>('#pause').open).toBe(false);
    expect(q<HTMLDialogElement>('#lab').open).toBe(true);
    expect(toggle).toHaveBeenLastCalledWith(true);
    q<HTMLDialogElement>('#lab').close();
    expect(toggle).toHaveBeenLastCalledWith(false);
  });
});
