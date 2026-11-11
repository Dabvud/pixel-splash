import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startCareer } from '../src/modes/career';
import { DEFAULTS } from '../src/settings';
import { loadCareer, saveCareer } from '../src/career/state';
import { newCareer } from '../src/career/create';
import { scheduleSeason } from '../src/career/keygame';
import { seededRng } from '../src/career/create';
import { HERO_ID } from '../src/career/hero';
import type { PlayScene, SceneResult, SceneSpec } from '../src/career/scene-types';
import type { CareerState } from '../src/career/state';

function memory(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; }, clear: () => m.clear(), key: i => [...m.keys()][i] ?? null,
    getItem: k => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: k => void m.delete(k),
  };
}
const look = { heightM: 1.9, build: 'normal' as const, skin: '#b77b53', hair: 'short' as const, jersey: '#888888', shorts: '#666666', num: 7 };
const visible = () => [...document.querySelectorAll<HTMLButtonElement>('button')].filter(b => !b.closest('[hidden]'));
const press = (t: string) => { const b = visible().find(x => x.textContent === t); if (!b) throw new Error(`Knopf fehlt: ${t} – ${document.body.textContent}`); b.click(); };
const text = () => document.body.textContent ?? '';

let specs: SceneSpec[];
let outcome: (i: number) => SceneResult;
const scene: PlayScene = (_app, _s, spec, onEnd) => {
  specs.push(spec);
  const i = specs.length - 1;
  const t = setTimeout(() => onEnd(outcome(i)), 10);
  return { apply() {}, stop: vi.fn(() => clearTimeout(t)) };
};
function fresh(storage: Storage, seed = 4): CareerState {
  const c = newCareer({ name: 'Rookie', num: 7, look, position: 'guard', difficulty: 'pro' }, seed);
  c.keyGames = scheduleSeason(c, seededRng(1));
  saveCareer(c, storage);
  return c;
}
/** Ein Key Game durchspielen: Ticker überspringen, Szene endet nach 10 ms */
function playGame(): void {
  press('Spielen');
  for (let i = 0; i < 3 && /VIERTEL/.test(text()) && !/Sieg|Niederlage/.test(text()); i++) {
    vi.advanceTimersByTime(3000); // Ticker läuft automatisch weiter
    vi.advanceTimersByTime(20); // Szene endet
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '<div id="app"></div>';
  specs = [];
  outcome = () => ({ won: true, verdict: 'GAMEWINNER', pts: 3, ast: 1 });
});
afterEach(() => vi.useRealTimers());

describe('Karriere-Ablauf', () => {
  it('spielt eine ganze Saison: 5 Key Games, Speicherstand nach jedem Spiel, Saisonende mit Tabelle', () => {
    const st = memory();
    fresh(st);
    startCareer(document.querySelector('#app')!, { ...DEFAULTS, mode: 'career' }, { storage: st, playScene: scene, seed: 1 });
    press('Fortsetzen');
    for (let g = 0; g < 5; g++) {
      expect(text()).toContain(`Key Game ${g + 1} / 5`);
      playGame();
      expect(text()).toMatch(/Sieg/);
      expect(text()).toMatch(/PTS \d+ · AST \d+ · REB \d+/);
      expect(loadCareer(st)!.season).toHaveLength(g + 1);
      press('Weiter');
    }
    expect(text()).toContain('Saisonende');
    expect(text()).toMatch(/Platz \d+/);
    expect(document.querySelectorAll('.career-table tbody tr')).toHaveLength(15);
    press('Nächste Saison');
    const next = loadCareer(st)!;
    expect(next.year).toBe(2); expect(next.player.age).toBe(20); expect(next.history).toHaveLength(1);
    expect(text()).toContain('Saison 2');
  });
  it('jede Szene steuert den eigenen Spieler; letzte Szene ist die Crunchtime', () => {
    const st = memory();
    fresh(st);
    startCareer(document.querySelector('#app')!, { ...DEFAULTS, mode: 'career' }, { storage: st, playScene: scene, seed: 1 });
    press('Fortsetzen');
    playGame();
    expect(specs.length).toBeGreaterThanOrEqual(2);
    for (const s of specs) expect(s.controlled).toBe(HERO_ID);
    expect(specs.at(-1)!.title).toMatch(/^4\. VIERTEL/);
  });
  it('Niederlage in der Crunchtime → Spiel verloren', () => {
    const st = memory();
    fresh(st);
    outcome = () => ({ won: false, verdict: 'VERLOREN', pts: 0, ast: 0 });
    startCareer(document.querySelector('#app')!, { ...DEFAULTS, mode: 'career' }, { storage: st, playScene: scene, seed: 1 });
    press('Fortsetzen');
    playGame();
    expect(text()).toContain('Niederlage');
    expect(loadCareer(st)!.season[0].won).toBe(false);
  });
  it('Abbruch mitten im Key Game → Fortsetzen startet dasselbe Spiel neu, Bilanz unverändert', () => {
    const st = memory();
    fresh(st);
    let mode = startCareer(document.querySelector('#app')!, { ...DEFAULTS, mode: 'career' }, { storage: st, playScene: scene, seed: 1 });
    press('Fortsetzen');
    playGame(); press('Weiter');
    playGame(); press('Weiter');
    press('Spielen');
    vi.advanceTimersByTime(3000); // erste Szene von Spiel 3 läuft
    mode.stop();
    expect(loadCareer(st)!.season).toHaveLength(2);
    document.body.innerHTML = '<div id="app"></div>';
    mode = startCareer(document.querySelector('#app')!, { ...DEFAULTS, mode: 'career' }, { storage: st, playScene: scene, seed: 1 });
    press('Fortsetzen');
    expect(text()).toContain('Key Game 3 / 5');
    mode.stop();
  });
  it('Ticker lässt sich per Tippen überspringen', () => {
    const st = memory();
    fresh(st);
    startCareer(document.querySelector('#app')!, { ...DEFAULTS, mode: 'career' }, { storage: st, playScene: scene, seed: 1 });
    press('Fortsetzen');
    press('Spielen');
    expect(specs).toHaveLength(0);
    document.querySelector<HTMLElement>('.career-ticker')!.click();
    expect(specs).toHaveLength(1);
  });
  it('Karriereende zeigt die Saison-Tabelle', () => {
    const st = memory();
    const c = fresh(st);
    saveCareer({ ...c, retired: true, history: [{ year: 1, team: c.team, age: 19, wins: 30, losses: 52, rank: 12, games: [] }] }, st);
    startCareer(document.querySelector('#app')!, { ...DEFAULTS, mode: 'career' }, { storage: st, playScene: scene, seed: 1 });
    press('Fortsetzen');
    expect(text()).toContain('Karriere beendet');
    expect(document.querySelectorAll('.career-table tbody tr')).toHaveLength(1);
  });
});
