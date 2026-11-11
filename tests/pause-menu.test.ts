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

it('benennt beide Dialoge über ihre sichtbare Überschrift', () => {
  createLabMenu(document.body, DEFAULTS, () => {});
  for (const dialog of document.querySelectorAll('dialog')) {
    const title = document.getElementById(dialog.getAttribute('aria-labelledby') ?? '');
    expect(title).toBe(dialog.querySelector('h2'));
  }
});
it('bietet das Entscheidungsfenster mit Spielsekunden, 1,5–4 und Standard 2,5 an', () => {
  createLabMenu(document.body, DEFAULTS, () => {});
  const input = q<HTMLInputElement>('#lab-decisionS');
  expect(input.min).toBe('1.5'); expect(input.max).toBe('4'); expect(input.value).toBe('2.5');
  expect(input.closest('label')!.textContent).toContain('Entscheidungsfenster');
});
