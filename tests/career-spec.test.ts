import { describe, expect, it } from 'vitest';
import { SPECS, STAGE_COST, buyStage, chooseSpec, perksOf } from '../src/career/spec';
import { newCareer } from '../src/career/create';
import { loadCareer, saveCareer, type CareerState } from '../src/career/state';

const look = { heightM: 1.9, build: 'normal' as const, skin: '#b77b53', hair: 'short' as const, jersey: '#888888', shorts: '#666666', num: 7 };
const career = (spec: 'playmaking' | 'shooting' | 'finishing' = 'shooting', points = 0): CareerState => ({
  ...newCareer({ name: 'R', num: 7, look, position: 'guard', difficulty: 'pro', spec }, 1), offseason: { step: 'skills', points },
});
function memory(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; }, clear: () => m.clear(), key: i => [...m.keys()][i] ?? null,
    getItem: k => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: k => void m.delete(k),
  };
}

describe('Spezialisierungen', () => {
  it('drei Spezialisierungen mit je drei Stufen, gleiche Kosten 4/6/10', () => {
    expect(Object.keys(SPECS)).toEqual(['playmaking', 'shooting', 'finishing']);
    for (const s of Object.values(SPECS)) expect(s.stages).toHaveLength(3);
    expect(STAGE_COST).toEqual([4, 6, 10]);
  });
  it('neue Karriere startet mit Stufe 0 der gewählten Spezialisierung', () => {
    expect(career('finishing').player).toMatchObject({ spec: 'finishing', specLevel: 0 });
  });
  it('Stufe kaufen kostet Punkte, ohne genug Punkte passiert nichts, max. Stufe 3', () => {
    let s = career('shooting', 3);
    expect(buyStage(s)).toBe(s);
    s = career('shooting', 20);
    s = buyStage(s); expect(s.player.specLevel).toBe(1); expect(s.offseason!.points).toBe(16);
    s = buyStage(s); expect(s.player.specLevel).toBe(2); expect(s.offseason!.points).toBe(10);
    s = buyStage(s); expect(s.player.specLevel).toBe(3); expect(s.offseason!.points).toBe(0);
    expect(buyStage({ ...s, offseason: { step: 'skills', points: 50 } }).player.specLevel).toBe(3);
  });
  it('Perks je Stufe', () => {
    const at = (spec: 'playmaking' | 'shooting' | 'finishing', specLevel: number) => perksOf({ ...career(spec).player, specLevel });
    expect(at('shooting', 0)).toEqual({});
    expect(at('playmaking', 1)).toEqual({ passSteal: .6 });
    expect(at('playmaking', 3)).toEqual({ passSteal: .6, coachCall: true, floorGeneral: true });
    expect(at('shooting', 2)).toEqual({ threeGreen: 1.3, deepRange: true });
    expect(at('shooting', 3)).toMatchObject({ greenLight: true });
    expect(at('finishing', 1)).toEqual({ finishMeter: 1.15 });
    expect(at('finishing', 3)).toEqual({ finishMeter: 1.15, contactBoost: 1.5, posterizer: true });
  });
  it('alter Stand ohne Spezialisierung bleibt gültig und kann sie nachwählen', () => {
    const st = memory();
    const s = career();
    const { spec: _s, specLevel: _l, ...player } = s.player;
    saveCareer({ ...s, player: player as CareerState['player'] }, st);
    const loaded = loadCareer(st)!;
    expect(loaded.player.spec).toBeUndefined();
    expect(perksOf(loaded.player)).toEqual({});
    expect(chooseSpec(loaded, 'playmaking').player).toMatchObject({ spec: 'playmaking', specLevel: 0 });
    expect(chooseSpec(career('shooting'), 'playmaking').player.spec).toBe('shooting'); // nur einmal wählbar
  });
});

describe('Green-Light-Serie', () => {
  it('zählt Treffer über Szenen, Fehlwurf setzt zurück, Szenen ohne Wurf zählen nicht', async () => {
    const { updateHot } = await import('../src/career/spec');
    expect(updateHot(0, [{ heroShots: 1, heroMakes: 1 }, { heroShots: 0, heroMakes: 0 }, { heroShots: 1, heroMakes: 1 }])).toBe(2);
    expect(updateHot(3, [{ heroShots: 2, heroMakes: 1 }])).toBe(0);
    expect(updateHot(1, [{}])).toBe(1);
  });
});
