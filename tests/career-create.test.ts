import { beforeEach, describe, expect, it, vi } from 'vitest';
import { newCareer, type CareerInput } from '../src/career/create';
import { createCareerScreen } from '../src/ui/career-create';
import { TEAMS } from '../src/career/league';
import { CAREER_KEY, loadCareer, saveCareer } from '../src/career/state';
import { RATING_KEYS } from '../src/play/ratings';

const look = { heightM: 1.9, build: 'normal' as const, skin: '#b77b53', hair: 'short' as const, jersey: '#888888', shorts: '#666666', num: 7 };
const input = (over: Partial<CareerInput> = {}): CareerInput => ({ name: 'Test', num: 7, look, position: 'guard', difficulty: 'pro', ...over });
const sum = (r: Record<string, number>) => Object.values(r).reduce((a, b) => a + b, 0);
function memory(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; }, clear: () => m.clear(), key: i => [...m.keys()][i] ?? null,
    getItem: k => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: k => void m.delete(k),
  };
}

describe('Neue Karriere', () => {
  it('liefert einen gültigen, speicherbaren Stand', () => {
    const st = memory();
    saveCareer(newCareer(input(), 1), st);
    const loaded = loadCareer(st);
    expect(loaded).not.toBeNull();
    expect(loaded!.player).toMatchObject({ name: 'Test', num: 7, age: 19, position: 'guard' });
    expect(loaded!.year).toBe(1);
    expect(st.getItem(CAREER_KEY)).not.toBeNull();
  });
  it.each([['rookie', 5.4], ['pro', 4.9], ['hof', 4.4]] as const)('Wertesumme bei %s = %s', (difficulty, total) => {
    for (const position of ['guard', 'wing', 'big'] as const) {
      const r = newCareer(input({ difficulty, position }), 3).player.ratings;
      expect(Object.keys(r).sort()).toEqual([...RATING_KEYS].sort());
      expect(sum(r)).toBeCloseTo(total, 2);
      for (const v of Object.values(r)) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1); }
    }
  });
  it('Position bestimmt die Schwerpunkte', () => {
    const g = newCareer(input({ position: 'guard' }), 1).player.ratings;
    const b = newCareer(input({ position: 'big' }), 1).player.ratings;
    expect(g.three).toBeGreaterThan(g.dunk);
    expect(b.dunk).toBeGreaterThan(b.three);
    expect(g.pass).toBeGreaterThan(b.pass);
  });
  it('wird von einem der 5 schwächsten Teams gedraftet, deterministisch je Seed, Trikot in Teamfarben', () => {
    const weakest = [...TEAMS].sort((a, b) => a.strength - b.strength).slice(0, 5).map(t => t.id);
    const seen = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const c = newCareer(input(), seed);
      expect(weakest).toContain(c.team);
      expect(newCareer(input(), seed).team).toBe(c.team);
      const team = TEAMS.find(t => t.id === c.team)!;
      expect(c.player.look.jersey).toBe(team.jersey);
      expect(c.player.look.num).toBe(7);
      seen.add(c.team);
    }
    expect(seen.size).toBeGreaterThan(2);
  });
});

describe('Bildschirm „Spieler erstellen“', () => {
  beforeEach(() => { document.body.innerHTML = ''; });
  const field = (id: string) => document.querySelector<HTMLInputElement | HTMLSelectElement>(`#cc-${id}`)!;
  it('hat alle Felder und liefert die Eingaben', () => {
    const done = vi.fn();
    createCareerScreen(document.body, done);
    for (const id of ['name', 'num', 'position', 'height', 'skin', 'hair', 'beard', 'headband', 'sleeve', 'shoes', 'socks', 'build', 'difficulty']) {
      expect(field(id), id).not.toBeNull();
    }
    (field('name') as HTMLInputElement).value = 'Lebron';
    (field('num') as HTMLInputElement).value = '23';
    (field('position') as HTMLSelectElement).value = 'wing';
    field('position').dispatchEvent(new Event('input', { bubbles: true }));
    (field('difficulty') as HTMLSelectElement).value = 'hof';
    document.querySelector<HTMLButtonElement>('#cc-go')!.click();
    const got = done.mock.calls[0][0] as CareerInput;
    expect(got).toMatchObject({ name: 'Lebron', num: 23, position: 'wing', difficulty: 'hof' });
    expect(got.look.heightM).toBeGreaterThanOrEqual(1.96);
    expect(got.look.heightM).toBeLessThanOrEqual(2.03);
  });
  it('leerer Name → „Rookie“, Nummer wird auf 0–99 begrenzt', () => {
    const done = vi.fn();
    createCareerScreen(document.body, done);
    (field('name') as HTMLInputElement).value = '   ';
    (field('num') as HTMLInputElement).value = '150';
    document.querySelector<HTMLButtonElement>('#cc-go')!.click();
    expect(done.mock.calls[0][0]).toMatchObject({ name: 'Rookie', num: 99 });
  });
  it('Größe passt sich der Position an', () => {
    createCareerScreen(document.body, () => {});
    (field('position') as HTMLSelectElement).value = 'big';
    field('position').dispatchEvent(new Event('input', { bubbles: true }));
    const h = field('height') as HTMLInputElement;
    expect(Number(h.min)).toBe(2.05); expect(Number(h.max)).toBe(2.13);
    expect(Number(h.value)).toBeGreaterThanOrEqual(2.05);
  });
});
