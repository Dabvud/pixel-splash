import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULTS, loadSettings, saveSettings, STORAGE_KEY } from '../src/settings';
import { createLabMenu } from '../src/ui/lab-menu';

afterEach(() => { localStorage.clear(); document.body.innerHTML = ''; });

describe('Test-Szenarien: Einstellungen', () => {
  it('verwendet random als Poster-Standard und ersetzt ungültige Werte', () => {
    expect(DEFAULTS.posterVariant).toBe('random');
    for (const value of [undefined, 'invalid', null, 1]) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ posterVariant: value }));
      expect(loadSettings().posterVariant).toBe('random');
    }
  });

  it('bietet und speichert alle Poster-Varianten im Abschnitt Test-Szenarien', () => {
    const change = vi.fn();
    createLabMenu(document.body, { ...DEFAULTS, mode: 'play' }, change);
    const select = document.querySelector<HTMLSelectElement>('#lab-test-scenarios #lab-posterVariant')!;
    expect(select.closest('label')!.textContent).toContain('Poster-Variante');
    expect([...select.options].map(o => o.text)).toEqual(['Zufall', 'Klassisch', 'Abflug', 'Grabstein']);
    expect(select.value).toBe('random');
    for (const value of ['classic', 'flyout', 'grave', 'random']) {
      select.value = value; select.dispatchEvent(new Event('input', { bubbles: true }));
      expect(loadSettings().posterVariant).toBe(value);
      expect(change).toHaveBeenLastCalledWith(expect.objectContaining({ posterVariant: value }));
    }
  });
  it('verwendet Normal und keinen erzwungenen Poster als Standard, auch bei alten Daten', () => {
    expect(DEFAULTS).toMatchObject({ finishFoulChance: -1, forcePoster: false });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode: 'play', fouls: 'off' }));
    expect(loadSettings()).toMatchObject({ mode: 'play', fouls: 'off', finishFoulChance: -1, forcePoster: false });
  });

  it.each([[-5, -1], [-.5, -1], [-1, -1], [0, 0], [.4, .4], [1, 1], [5, 1], ['1', -1], [null, -1]])(
    'begrenzt finishFoulChance %s auf %s', (input, expected) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ finishFoulChance: input, forcePoster: 'true' }));
      expect(loadSettings()).toMatchObject({ finishFoulChance: expected, forcePoster: false });
    });

  it('ersetzt nicht endliche Foul-Chancen durch Normal', () => {
    localStorage.setItem(STORAGE_KEY, '{"finishFoulChance":1e400}');
    expect(loadSettings().finishFoulChance).toBe(-1);
  });

  it.each([-1, 0, .25, .5, .75, 1])('speichert und lädt Testwerte mit Foul-Chance %s', finishFoulChance => {
    const settings = { ...DEFAULTS, finishFoulChance, forcePoster: true };
    saveSettings(settings);
    expect(loadSettings()).toEqual(settings);
  });

  it('zeigt Test-Szenarien nur im Spielzug-Labor mit sechs sichtbaren Stufen und speichert Änderungen', () => {
    const change = vi.fn();
    createLabMenu(document.body, DEFAULTS, change);
    const section = document.querySelector<HTMLElement>('#lab-test-scenarios')!;
    expect(section.hidden).toBe(true);
    const mode = document.querySelector<HTMLSelectElement>('#lab-mode')!;
    mode.value = 'play'; mode.dispatchEvent(new Event('input', { bubbles: true }));
    expect(section.hidden).toBe(false);
    expect(section.querySelector('h3')!.textContent).toBe('Test-Szenarien');
    expect(section.textContent).toContain('Foul am Korb');
    expect(section.textContent).toContain('Normal / 0 % / 25 % / 50 % / 75 % / 100 %');
    const slider = section.querySelector<HTMLInputElement>('#lab-finishFoulChance')!;
    const poster = section.querySelector<HTMLInputElement>('#lab-forcePoster')!;
    expect([slider.min, slider.max, slider.step, slider.value]).toEqual(['0', '5', '1', '0']);
    expect(poster.type).toBe('checkbox');
    expect(poster.checked).toBe(false);
    expect(poster.closest('label')!.textContent).toContain('Poster erzwingen');
    for (const [index, value] of [-1, 0, .25, .5, .75, 1].entries()) {
      slider.value = String(index); poster.checked = true;
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      expect(change).toHaveBeenLastCalledWith(expect.objectContaining({ finishFoulChance: value, forcePoster: true }));
      expect(loadSettings()).toMatchObject({ finishFoulChance: value, forcePoster: true });
      expect(section.querySelector('output')!.textContent).toBe(value < 0 ? 'Normal' : `${value * 100} %`);
    }
    poster.checked = false; poster.dispatchEvent(new Event('input', { bubbles: true }));
    expect(loadSettings().forcePoster).toBe(false);
    mode.value = 'shot'; mode.dispatchEvent(new Event('input', { bubbles: true }));
    expect(section.hidden).toBe(true);
  });
});
