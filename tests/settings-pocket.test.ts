import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULTS, loadSettings, saveSettings, STORAGE_KEY } from '../src/settings';
import { createLabMenu } from '../src/ui/lab-menu';

afterEach(() => { localStorage.clear(); document.body.innerHTML = ''; });
describe('Pocket-Einstellungen', () => {
  it('lädt alte Spielzug-Daten ohne die beiden neuen Felder', () => {
    const { passDelayMax: _delay, closeoutRandom: _random, ...old } = { ...DEFAULTS, mode: 'play' as const, decisionS: 3 };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(old));
    expect(loadSettings()).toEqual({ ...old, passDelayMax: .6, closeoutRandom: 1 });
  });
  it.each(['passDelayMax', 'closeoutRandom'] as const)('begrenzt und speichert %s', field => {
    for (const [input, expected] of [[-1, 0], [2, 1], [.4, .4], ['x', DEFAULTS[field]], [null, DEFAULTS[field]]]) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ [field]: input }));
      expect(loadSettings()[field]).toBe(expected);
    }
    saveSettings({ ...DEFAULTS, [field]: .2 });
    expect(loadSettings()[field]).toBe(.2);
  });
  it('zeigt beide Regler nur im Spielzug-Labor mit Sekunden und Prozent an', () => {
    const change = vi.fn();
    createLabMenu(document.body, DEFAULTS, change);
    const delay = document.querySelector<HTMLInputElement>('#lab-passDelayMax')!;
    const random = document.querySelector<HTMLInputElement>('#lab-closeoutRandom')!;
    expect(delay.closest('label')!.hidden).toBe(true);
    expect(random.closest('label')!.hidden).toBe(true);
    const mode = document.querySelector<HTMLSelectElement>('#lab-mode')!;
    mode.value = 'play'; mode.dispatchEvent(new Event('input', { bubbles: true }));
    expect(delay.closest('label')!.hidden).toBe(false);
    expect(delay.closest('label')!.textContent).toContain('Pass-Verzögerung max.');
    expect(random.closest('label')!.textContent).toContain('Closeout-Zufall');
    expect(document.querySelector('#lab-passDelayMax-out')!.textContent).toBe('0.6 s');
    expect(document.querySelector('#lab-closeoutRandom-out')!.textContent).toBe('100 %');
    delay.value = '.3'; random.value = '25'; delay.dispatchEvent(new Event('input', { bubbles: true }));
    expect(change).toHaveBeenLastCalledWith(expect.objectContaining({ passDelayMax: .3, closeoutRandom: .25 }));
  });
});
