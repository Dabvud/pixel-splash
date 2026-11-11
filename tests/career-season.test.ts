import { afterEach, describe, expect, it } from 'vitest';
import { LABELS, finalDeficit, gameResult, projectLine, scenePlan, sceneSpec, scheduleSeason } from '../src/career/keygame';
import { finishSeason, playoffStatus, projectWins, standings, strengthOf } from '../src/career/season';
import { HERO_ID, unregisterHero } from '../src/career/hero';
import { seededRng } from '../src/career/create';
import { TEAMS } from '../src/career/league';
import { SAMPLE } from './career-state.test';
import type { CareerState } from '../src/career/state';

afterEach(() => unregisterHero());
const state = (over: Partial<CareerState> = {}): CareerState => structuredClone({ ...SAMPLE, ...over });
const res = (won: boolean, verdict = won ? 'GAMEWINNER' : 'VERLOREN') => ({ won, verdict, pts: 2, ast: 1 });

describe('Key Games', () => {
  it('5 Spiele pro Saison (3 bei Verletzung), nie gegen das eigene Team, Etiketten aus der Liste, deterministisch', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const games = scheduleSeason(state(), seededRng(seed));
      expect(games).toHaveLength(5);
      expect(new Set(games.map(g => g.label)).size).toBe(5);
      for (const g of games) {
        expect(g.opponent).not.toBe(SAMPLE.team);
        expect(TEAMS.some(t => t.id === g.opponent)).toBe(true);
        expect(LABELS).toContain(g.label);
        if (g.label === 'Auswärts in feindlicher Halle') expect(g.home).toBe(false);
      }
      expect(scheduleSeason(state(), seededRng(seed))).toEqual(games);
    }
    expect(scheduleSeason(state({ injured: true }), seededRng(1))).toHaveLength(3);
  });
  it('„Rückkehr zum Ex-Team“ nur mit Ex-Team und dann gegen dieses', () => {
    for (let seed = 1; seed <= 30; seed++) expect(scheduleSeason(state(), seededRng(seed)).map(g => g.label)).not.toContain('Rückkehr zum Ex-Team');
    const withEx = state({ history: [{ year: 1, team: 'bos', age: 19, wins: 30, losses: 52, rank: 12, games: [] }] });
    let seen = false;
    for (let seed = 1; seed <= 60; seed++) for (const g of scheduleSeason(withEx, seededRng(seed))) {
      if (g.label === 'Rückkehr zum Ex-Team') { seen = true; expect(g.opponent).toBe('bos'); }
    }
    expect(seen).toBe(true);
  });
  it('Szenenzahl, Rückstand der Crunchtime und Spielergebnis', () => {
    expect(scenePlan({ opponent: 'bos', label: 'Spitzenspiel', home: true })).toBe(3);
    expect(scenePlan({ opponent: 'bos', label: 'Christmas Game', home: true })).toBe(3);
    expect(scenePlan({ opponent: 'bos', label: 'Rivalen-Duell', home: true })).toBe(2);
    expect(finalDeficit([true, true])).toBe(1);
    expect(finalDeficit([false, false, false])).toBe(6);
    expect(finalDeficit([true])).toBe(2);
    expect(gameResult([res(false), res(true)], () => .9)).toBe(true);
    expect(gameResult([res(true), res(false)], () => 0)).toBe(false);
    expect(gameResult([res(false, 'OVERTIME')], () => .2)).toBe(true);
    expect(gameResult([res(false, 'DOPPEL-OVERTIME')], () => .8)).toBe(false);
  });
  it('Szenen: frühe Viertel mit langer Uhr, letzte Szene Crunchtime mit eigenem Spieler', () => {
    const game = { opponent: 'bos', label: 'Christmas Game', home: false };
    for (let seed = 1; seed <= 20; seed++) {
      const early = sceneSpec(state(), game, 0, 3, 4, seededRng(seed));
      expect(early.title).toMatch(/^[123]\. VIERTEL/);
      expect(early.clockS).toBeGreaterThanOrEqual(8); expect(early.clockS).toBeLessThanOrEqual(24);
      const last = sceneSpec(state(), game, 2, 3, 5, seededRng(seed));
      expect(last.title).toMatch(/^4\. VIERTEL/);
      // Uhr reicht immer bis zur ersten Entscheidung (+3 s); nur „Lob in 0,8 s“ hat seine feste Uhr
      if (last.play.id === 'lob08') expect(last.clockS).toBe(.8);
      else {
        expect(last.clockS).toBeGreaterThanOrEqual((last.play.segments[last.play.start].decisionAt ?? 0) + 3);
        expect(last.clockS).toBeLessThanOrEqual(12);
      }
      expect(early.play.id).not.toBe('lob08');
      expect(last.deficit).toBe(5);
      expect(last.subtitle).toContain('Christmas Game');
      expect(last.subtitle).toContain('Boston Leprechauns');
      expect(last.play.actors).toContain(HERO_ID);
      expect(last.controlled).toBe(HERO_ID);
    }
  });
  it('Statline in sinnvollen Grenzen', () => {
    const rng = seededRng(5);
    for (let i = 0; i < 1000; i++) {
      const l = projectLine(SAMPLE.player.ratings, [res(true), res(false)], rng);
      expect(l.pts).toBeGreaterThanOrEqual(4); expect(l.pts).toBeLessThanOrEqual(40);
      expect(l.ast).toBeGreaterThanOrEqual(2); expect(l.reb).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('Saison', () => {
  it('Siege in Grenzen; mehr Key-Siege → im Mittel mehr Siege', () => {
    const rng = seededRng(9);
    let low = 0, high = 0;
    for (let i = 0; i < 400; i++) {
      const a = projectWins(50, 0, 5, 'pro', rng), b = projectWins(50, 5, 5, 'pro', rng);
      for (const w of [a, b]) { expect(w).toBeGreaterThanOrEqual(10); expect(w).toBeLessThanOrEqual(72); }
      low += a; high += b;
    }
    expect(high).toBeGreaterThan(low);
  });
  it('Tabelle: 15 Teams der eigenen Conference, eigenes Team mit seinen Siegen, sortiert', () => {
    const table = standings(state(), 47, seededRng(2));
    expect(table).toHaveLength(15);
    const own = table.find(r => r.team === SAMPLE.team)!;
    expect(own).toMatchObject({ wins: 47, losses: 35 });
    for (let i = 1; i < table.length; i++) expect(table[i - 1].wins).toBeGreaterThanOrEqual(table[i].wins);
    const conf = TEAMS.find(t => t.id === SAMPLE.team)!.conference;
    for (const r of table) expect(TEAMS.find(t => t.id === r.team)!.conference).toBe(conf);
  });
  it('Playoff-Status nach Platz', () => {
    expect(playoffStatus(1)).toBe('playoffs'); expect(playoffStatus(6)).toBe('playoffs');
    expect(playoffStatus(7)).toBe('playin'); expect(playoffStatus(10)).toBe('playin');
    expect(playoffStatus(11)).toBe('out');
  });
  it('Saisonende: Saison archiviert, Alter/Jahr +1, neue Key Games, Stärken entwickelt', () => {
    const s0 = state({ season: [{ opponent: 'bos', label: 'Rivalen-Duell', home: true, won: true, pts: 20, ast: 5, reb: 4 }] });
    const s1 = finishSeason(s0, 44, seededRng(3));
    expect(s1.player.age).toBe(20); expect(s1.year).toBe(2);
    expect(s1.history).toHaveLength(1);
    expect(s1.history[0]).toMatchObject({ year: 1, team: SAMPLE.team, age: 19, wins: 44, losses: 38 });
    expect(s1.history[0].games).toHaveLength(1);
    expect(s1.season).toEqual([]); expect(s1.gameIndex).toBe(0);
    expect(s1.keyGames.length).toBeGreaterThanOrEqual(3);
    expect(Object.keys(s1.strengths ?? {})).toHaveLength(30);
    expect(strengthOf(s1, 'bos')).toBeGreaterThanOrEqual(25);
  });
  it('Karriereende spätestens mit 40, nie vor 36; Verletzungen ≈ 5 %', () => {
    let injured = 0;
    for (let seed = 1; seed <= 2000; seed++) {
      const s = finishSeason(state({ player: { ...SAMPLE.player, age: 25 } }), 40, seededRng(seed));
      expect(s.retired).toBe(false);
      if (s.injured) injured++;
    }
    expect(injured / 2000).toBeGreaterThan(.03); expect(injured / 2000).toBeLessThan(.07);
    expect(finishSeason(state({ player: { ...SAMPLE.player, age: 39 } }), 40, seededRng(1)).retired).toBe(true);
  });
});

describe('Szenen-Anzeigetafel', () => {
  it('liefert Teamkürzel (eigenes Team zuerst) und das Viertel der Szene', () => {
    const away = sceneSpec(state(), { opponent: 'bos', label: 'Rivalen-Duell', home: false }, 0, 2, 3, seededRng(1));
    expect(away.teams).toEqual([SAMPLE.team.toUpperCase(), 'BOS']);
    expect(away.title.startsWith(away.period!)).toBe(true);
    const last = sceneSpec(state(), { opponent: 'bos', label: 'Rivalen-Duell', home: true }, 1, 2, 3, seededRng(1));
    expect(last.period).toBe('4. VIERTEL');
  });
});

describe('Bilanz hängt vor allem an den Key Games', () => {
  it('0 von 5 → wenige Siege, 5 von 5 → viele Siege (schwaches Team)', () => {
    for (let seed = 1; seed <= 50; seed++) {
      expect(projectWins(40, 0, 5, 'pro', seededRng(seed))).toBeLessThanOrEqual(15);
      expect(projectWins(40, 5, 5, 'pro', seededRng(seed))).toBeGreaterThanOrEqual(55);
    }
  });
});
