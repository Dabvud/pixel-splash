import { describe, expect, it } from 'vitest';
import { AWARDS, RANK_KEY, addToRanking, awardPoints, legacyOf, loadRanking, seasonAwards, seasonStats, tierOf } from '../src/career/legacy';
import { finishSeason } from '../src/career/season';
import { beginOffseason } from '../src/career/offseason';
import { seededRng } from '../src/career/create';
import { SAMPLE } from './career-state.test';
import type { CareerState, GameRecord, SeasonRecord } from '../src/career/state';

const g = (pts: number, won = true, ast = 3, reb = 4): GameRecord => ({ opponent: 'bos', label: 'x', home: true, won, pts, ast, reb });
const state = (games: GameRecord[], over: Partial<CareerState> = {}): CareerState => ({ ...structuredClone(SAMPLE), season: games, ...over });
function memory(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; }, clear: () => m.clear(), key: i => [...m.keys()][i] ?? null,
    getItem: k => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: k => void m.delete(k),
  };
}

describe('Auszeichnungen', () => {
  it('Saisonwerte aus den Key Games; leere Saison ohne Division durch 0', () => {
    expect(seasonStats([g(20, true, 5, 6), g(30, false, 7, 2)])).toEqual({ ppg: 25, apg: 6, rpg: 4, wins: 1, games: 2 });
    expect(seasonStats([])).toEqual({ ppg: 0, apg: 0, rpg: 0, wins: 0, games: 0 });
    expect(seasonAwards(state([]), 1, 'none')).toEqual([]);
  });
  it('Schwellen laut Plan', () => {
    const five = (pts: number, won = true) => Array.from({ length: 5 }, () => g(pts, won));
    expect(seasonAwards(state(five(32)), 2, 'none', 2)).toEqual(expect.arrayContaining(['mvp', 'allnba', 'allstar', 'scoring', 'clutch']));
    expect(seasonAwards(state(five(29)), 5, 'none', 2)).not.toContain('mvp'); // Platz zu schlecht
    // Spieltest: mittelmäßiger Scorer im Tabellenkeller ist kein All-Star
    expect(seasonAwards(state(five(20, false)), 15, 'none', 2)).toEqual([]);
    expect(seasonAwards(state(five(22, true)), 9, 'none', 2)).toEqual(['allstar', 'clutch']); // gewinnt und punktet
    expect(seasonAwards(state(five(25, false)), 14, 'none', 2)).toEqual(['allstar']); // sehr viele Punkte reichen allein
    expect(seasonAwards(state(five(18, false)), 9, 'none', 1)).toEqual(['roy']); // 1. Saison
    expect(seasonAwards(state(five(10, false)), 9, 'champion', 2)).toEqual(['ring', 'fmvp']);
    const d = state(five(10, false), { player: { ...SAMPLE.player, ratings: { ...SAMPLE.player.ratings, defense: .9 } } });
    expect(seasonAwards(d, 6, 'none', 2)).toEqual(['dpoy']);
    expect(seasonAwards(d, 8, 'none', 2)).toEqual([]);
    expect(seasonAwards(state([g(18, true, 8), g(18, true, 8)]), 12, 'none', 2)).toEqual(['allstar']);
  });
  it('Award-Skillpunkte: MVP 3, Finals-MVP 2, Ring 0, sonst 1', () => {
    expect(awardPoints(['mvp', 'fmvp', 'ring', 'allstar'])).toBe(6);
    expect(AWARDS.ring.sp).toBe(0);
  });
});

describe('Legacy und Einstufung', () => {
  const season = (wins: number, awards: SeasonRecord['awards'], ppg = 20): SeasonRecord =>
    ({ year: 1, team: 'det', age: 20, wins, losses: 82 - wins, rank: 5, games: [g(ppg)], awards });
  it('Legacy = Awards + Siege/10 + PPG×0,3 je Saison; alte Saisons ohne awards zählen mit 0', () => {
    expect(legacyOf([season(50, ['mvp', 'ring'], 20)])).toBeCloseTo(10 + 12 + 5 + 6, 6);
    expect(legacyOf([{ ...season(40, undefined, 10) }])).toBeCloseTo(4 + 3, 6);
  });
  it('Stufen', () => {
    expect(tierOf(24)).toEqual({ tier: 'Rollenspieler', hof: false });
    expect(tierOf(54)).toEqual({ tier: 'Starter', hof: false });
    expect(tierOf(99)).toEqual({ tier: 'All-Star', hof: false });
    expect(tierOf(100)).toEqual({ tier: 'Hall of Famer', hof: true });
    expect(tierOf(170)).toEqual({ tier: 'GOAT-Debatte', hof: true });
  });
  it('Saisonende speichert Awards, Off-Season schreibt die Award-Punkte gut', () => {
    const s = state(Array.from({ length: 5 }, () => g(32)));
    const next = finishSeason(s, 60, seededRng(1));
    expect(next.history[0].awards).toEqual(expect.arrayContaining(['allnba', 'allstar', 'scoring', 'clutch']));
    const o = beginOffseason(next, seededRng(2));
    expect(o.offseason!.points).toBe(3 + awardPoints(next.history[0].awards!));
  });
});

describe('Rangliste', () => {
  const entry = (id: string, legacy: number) => ({ id, name: id, position: 'guard' as const, seasons: 15, rings: 1, mvps: 0, legacy, tier: tierOf(legacy).tier, date: '2026-11-12' });
  it('sortiert nach Legacy, max. 20, jede Karriere nur einmal', () => {
    const st = memory();
    for (let i = 0; i < 25; i++) addToRanking(entry(`k${i}`, i * 5), st);
    addToRanking(entry('k24', 999), st);
    const list = loadRanking(st);
    expect(list).toHaveLength(20);
    expect(list[0].legacy).toBe(120);
    expect(list.filter(e => e.id === 'k24')).toHaveLength(1);
  });
  it('kaputter Speicher → leere Liste', () => {
    const st = memory();
    st.setItem(RANK_KEY, '{kaputt');
    expect(loadRanking(st)).toEqual([]);
  });
});
