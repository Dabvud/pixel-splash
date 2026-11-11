import { describe, expect, it } from 'vitest';
import { acceptOffer, ackTrade, ageRatings, beginOffseason, endOffseason, makeOffers, marketValue, spend } from '../src/career/offseason';
import { newCareer, seededRng } from '../src/career/create';
import { TEAMS } from '../src/career/league';
import { RATING_KEYS } from '../src/play/ratings';
import { SAMPLE } from './career-state.test';
import type { CareerState } from '../src/career/state';

const look = { heightM: 1.9, build: 'normal' as const, skin: '#b77b53', hair: 'short' as const, jersey: '#888888', shorts: '#666666', num: 7 };
const base = (): CareerState => newCareer({ name: 'R', num: 7, look, position: 'guard', difficulty: 'pro' }, 3);
const season = (wins: number, playoff: 'none' | 'champion' = 'none') => ({ year: 1, team: 'det', age: 19, wins: 40, losses: 42, rank: 8, playoff,
  games: Array.from({ length: 5 }, (_, i) => ({ opponent: 'bos', label: 'x', home: true, won: i < wins, pts: 20, ast: 5, reb: 4 })) });

describe('Off-Season', () => {
  it('Rookie-Vertrag nach dem Draft: 4 Jahre, 1,5 Mio., 3 SP', () => {
    expect(base().contract).toMatchObject({ years: 4, salary: 1.5, spPerYear: 3 });
    expect(base().contract!.team).toBe(base().team);
  });
  it('Marktwert steigt mit Leistung und Titeln', () => {
    const s = base();
    const low = marketValue({ ...s, history: [season(0)] }), high = marketValue({ ...s, history: [season(5, 'champion')] });
    expect(high).toBeGreaterThan(low);
    expect(low).toBeGreaterThanOrEqual(0); expect(high).toBeLessThanOrEqual(1);
  });
  it('3 Angebote, eigenes Team dabei, keine Doppelten, Werte in Grenzen; schwache Teams manchmal +2 SP', () => {
    let weakBonus = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const s = { ...base(), history: [season(3)] }, offers = makeOffers(s, seededRng(seed));
      expect(offers).toHaveLength(3);
      expect(offers[0].team).toBe(s.team);
      expect(new Set(offers.map(o => o.team)).size).toBe(3);
      for (const o of offers) {
        expect(o.years).toBeGreaterThanOrEqual(1); expect(o.years).toBeLessThanOrEqual(5);
        expect(o.spPerYear).toBeGreaterThanOrEqual(1); expect(o.spPerYear).toBeLessThanOrEqual(11);
        expect(o.salary).toBeGreaterThan(0);
        const strength = TEAMS.find(t => t.id === o.team)!.strength;
        if (strength < 45 && o.spPerYear >= Math.round(2 + 7 * marketValue(s)) + 2) weakBonus++;
      }
    }
    expect(weakBonus).toBeGreaterThan(0);
  });
  it('Alterung erst ab 31, Werte nie unter 0,05', () => {
    const r = SAMPLE.player.ratings;
    expect(ageRatings(r, 30)).toEqual(r);
    const a31 = ageRatings(r, 31);
    expect(a31.athleticism).toBeCloseTo(r.athleticism - .03, 6); expect(a31.three).toBe(r.three);
    const a34 = ageRatings(r, 34);
    expect(a34.three).toBeCloseTo(r.three - .01, 6);
    let x = r;
    for (let i = 0; i < 60; i++) x = ageRatings(x, 38);
    for (const k of RATING_KEYS) expect(x[k]).toBeGreaterThanOrEqual(.05);
  });
  it('Vertrag läuft: SP gutgeschrieben, Jahr runter, direkt Skillpunkte', () => {
    const s = beginOffseason({ ...base(), history: [season(2)] }, seededRng(11));
    expect(s.contract!.years).toBe(3);
    expect(s.offseason).toMatchObject({ points: 3 });
    expect(['skills', 'trade']).toContain(s.offseason!.step);
  });
  it('Vertragsende → Angebote; Annahme wechselt ggf. das Team und plant neue Key Games', () => {
    const s0 = { ...base(), contract: { team: base().team, years: 1, salary: 1.5, spPerYear: 3 }, history: [season(4)] };
    const s1 = beginOffseason(s0, seededRng(2));
    expect(s1.offseason!.step).toBe('offers');
    const other = s1.offseason!.offers![1];
    const s2 = acceptOffer(s1, other);
    expect(s2.team).toBe(other.team);
    expect(s2.contract).toEqual(other);
    expect(s2.offseason!.step).toBe('skills');
    for (const g of s2.keyGames) expect(g.opponent).not.toBe(other.team);
  });
  it('Trade ≈ 5 % mitten im Vertrag, nie im letzten Vertragsjahr', () => {
    let trades = 0;
    for (let seed = 1; seed <= 2000; seed++) {
      const s = beginOffseason({ ...base(), history: [season(2)] }, seededRng(seed));
      if (s.offseason!.step === 'trade') {
        trades++;
        expect(s.team).toBe(s.offseason!.tradedTo);
        expect(s.contract!.team).toBe(s.team);
        expect(ackTrade(s).offseason!.step).toBe('skills');
      }
      const last = beginOffseason({ ...base(), contract: { team: base().team, years: 1, salary: 1.5, spPerYear: 3 }, history: [season(2)] }, seededRng(seed));
      expect(last.offseason!.step).toBe('offers');
    }
    expect(trades / 2000).toBeGreaterThan(.03); expect(trades / 2000).toBeLessThan(.07);
  });
  it('Skillpunkte: +0,02 je Punkt, max. 1, Punkte nie negativ; Ende räumt auf', () => {
    let s: CareerState = { ...base(), offseason: { step: 'skills', points: 2 } };
    const before = s.player.ratings.three;
    s = spend(s, 'three');
    expect(s.player.ratings.three).toBeCloseTo(before + .02, 6);
    s = spend(spend(s, 'three'), 'three');
    expect(s.offseason!.points).toBe(0);
    expect(s.player.ratings.three).toBeCloseTo(before + .04, 6);
    let full: CareerState = { ...base(), offseason: { step: 'skills', points: 5 } };
    full = { ...full, player: { ...full.player, ratings: { ...full.player.ratings, dunk: .995 } } };
    full = spend(full, 'dunk');
    expect(full.player.ratings.dunk).toBe(1);
    expect(endOffseason(full).offseason).toBeUndefined();
  });
  it('alter Stand ohne Vertrag bekommt den Rookie-Vertrag; Karriereende überspringt die Off-Season', () => {
    const { contract: _c, ...old } = base();
    const s = beginOffseason({ ...old, history: [season(2)] } as CareerState, seededRng(1));
    expect(s.contract).toBeDefined();
    const retired = { ...base(), retired: true };
    expect(beginOffseason(retired, seededRng(1))).toBe(retired);
  });
});
