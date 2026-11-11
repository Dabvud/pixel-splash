import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULTS, loadSettings, STORAGE_KEY } from '../src/settings';
import { createMainMenu } from '../src/ui/main-menu';
import { createLabMenu } from '../src/ui/lab-menu';
import { startCareer } from '../src/modes/career';
import { saveCareer } from '../src/career/state';
import { SAMPLE } from './career-state.test';

function memory(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; }, clear: () => m.clear(), key: i => [...m.keys()][i] ?? null,
    getItem: k => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: k => void m.delete(k),
  };
}
const q = <T extends HTMLElement>(s: string) => document.querySelector<T>(s)!;
const buttons = () => [...document.querySelectorAll<HTMLButtonElement>('button')].filter(b => !b.closest('[hidden]'));
const byText = (t: string) => buttons().find(b => b.textContent === t)!;

beforeEach(() => {
  document.body.innerHTML = '';
  localStorage.clear();
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; this.dispatchEvent(new Event('close')); };
});

describe('Hauptmenü', () => {
  it('zeigt Karriere, Wurf-Labor und Spielzug-Labor und meldet die Wahl', () => {
    const pick = vi.fn();
    const menu = createMainMenu(document.body, pick);
    menu.show();
    expect(buttons().map(b => b.textContent)).toEqual(['Karriere', 'Wurf-Labor', 'Spielzug-Labor']);
    byText('Spielzug-Labor').click();
    expect(pick).toHaveBeenCalledWith('play');
    byText('Karriere').click();
    expect(pick).toHaveBeenLastCalledWith('career');
    menu.hide();
    expect(q('.main-menu').hidden).toBe(true);
  });
  it('Einstellungen kennen den Modus „career“, Unbekanntes wird „shot“', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULTS, mode: 'career' }));
    expect(loadSettings().mode).toBe('career');
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULTS, mode: 'quatsch' }));
    expect(loadSettings().mode).toBe('shot');
  });
  it('Pause-Menü hat „Hauptmenü“ und ruft den Rückweg', () => {
    const toMenu = vi.fn();
    createLabMenu(document.body, DEFAULTS, () => {}, () => {}, () => {}, undefined, toMenu);
    q('#lab-open').click();
    q('#pause-menu').click();
    expect(toMenu).toHaveBeenCalledOnce();
    expect(q<HTMLDialogElement>('#pause').open).toBe(false);
  });
  it('Karriere-Einstellungen zeigen nur Modus, Kamera und Pixel-Auflösung', () => {
    createLabMenu(document.body, { ...DEFAULTS, mode: 'career' }, () => {});
    const visible = [...document.querySelectorAll<HTMLElement>('#lab [data-show]')].filter(l => !l.hidden)
      .map(l => l.querySelector('select, input')?.id);
    expect(visible).toEqual(['lab-mode', 'lab-camera', 'lab-pixelHeight']);
  });
});

describe('Karriere-Startbildschirm', () => {
  it('ohne Speicherstand: nur „Neue Karriere“', () => {
    startCareer(document.body, { ...DEFAULTS, mode: 'career' }, { storage: memory() });
    expect(byText('Neue Karriere')).toBeDefined();
    expect(byText('Fortsetzen')).toBeUndefined();
  });
  it('mit Speicherstand: „Fortsetzen“ und „Neue Karriere“ mit Nachfrage vor dem Löschen', () => {
    const st = memory();
    saveCareer(SAMPLE, st);
    startCareer(document.body, { ...DEFAULTS, mode: 'career' }, { storage: st });
    expect(byText('Fortsetzen')).toBeDefined();
    byText('Neue Karriere').click();
    expect(document.body.textContent).toContain('Alte Karriere löschen?');
    expect(st.getItem('pixel-splash.career.v1')).not.toBeNull();
    byText('Abbrechen').click();
    expect(byText('Fortsetzen')).toBeDefined();
    byText('Neue Karriere').click();
    byText('Ja, löschen').click();
    expect(st.getItem('pixel-splash.career.v1')).toBeNull();
  });
  it('stop räumt den Bildschirm ab', () => {
    const mode = startCareer(document.body, { ...DEFAULTS, mode: 'career' }, { storage: memory() });
    mode.stop();
    expect(document.querySelector('.career')).toBeNull();
  });
});
