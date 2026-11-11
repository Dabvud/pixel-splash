import { describe, expect, it } from 'vitest';
import { SITUATIONS, advance, postseasonGame, startPostseason } from '../src/career/playoffs';
import { scenePlan } from '../src/career/keygame';
import { standings } from '../src/career/season';
import { TEAMS } from '../src/career/league';
import { seededRng } from '../src/career/create';
import { loadCareer, saveCareer, type CareerState } from '../src/career/state';
import { SAMPLE } from './career-state.test';

const conf = (id: string) => TEAMS.find(t => t.id === id)!.conference;
const state = (): CareerState => structuredClone(SAMPLE);
/** Tabelle so bauen, dass das eigene Team auf Platz `rank` steht */
function tableAt(rank: number) {
  const t = standings(state(), 40, seededRng(1)).filter(r => r.team !== SAMPLE.team);
  t.splice(rank - 1, 0, { team: SAMPLE.team, wins: 40, losses: 42 });
  return t;
}
function memory(): Storage {
  const m = new Map<string, string>();
  return {
    get length() { return m.size; }, clear: () => m.clear(), key: i => [...m.keys()][i] ?? null,
    getItem: k => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v), removeItem: k => void m.delete(k),
  };
}

describe('Play-In und Playoffs', () => {
  it('Platz 11–15: keine Nachsaison', () => {
    expect(startPostseason(state(), 30, tableAt(11), seededRng(1))).toBeNull();
    expect(startPostseason(state(), 30, tableAt(15), seededRng(1))).toBeNull();
  });
  it('Platz 3 → 1. Runde gegen Platz 6; Platz 1 gegen 8', () => {
    const t3 = tableAt(3), p3 = startPostseason(state(), 50, t3, seededRng(1))!;
    expect(p3).toMatchObject({ round: 'r1', opponent: t3[5].team, rank: 3, done: false });
    const t1 = tableAt(1), p1 = startPostseason(state(), 60, t1, seededRng(1))!;
    expect(p1.opponent).toBe(t1[7].team);
  });
  it('Platz 8 → Play-In gegen 7; Sieg → 1. Runde gegen Platz 1; Niederlage → Saison vorbei', () => {
    const t = tableAt(8), p = startPostseason(state(), 41, t, seededRng(1))!;
    expect(p).toMatchObject({ round: 'playin', opponent: t[6].team });
    expect(postseasonGame(p).label).toMatch(/^Play-In/);
    const won = advance(p, true, state(), seededRng(2));
    expect(won).toMatchObject({ round: 'r1', done: false });
    expect([t[0].team, t[1].team]).toContain(won.opponent);
    expect(advance(p, false, state(), seededRng(2))).toMatchObject({ done: true, result: 'playin' });
  });
  it('vier Siege → Meister; Gegner nie das eigene Team, Finals aus der anderen Conference', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const rng = seededRng(seed), t = tableAt(2);
      let p = startPostseason(state(), 55, t, rng)!;
      const rounds: string[] = [];
      while (!p.done) {
        rounds.push(p.round);
        expect(p.opponent).not.toBe(SAMPLE.team);
        expect(conf(p.opponent) === conf(SAMPLE.team)).toBe(p.round !== 'finals');
        const g = postseasonGame(p);
        expect(SITUATIONS.some(s => g.label.endsWith(s))).toBe(true);
        expect(scenePlan(g)).toBe(3);
        p = advance(p, true, state(), rng);
      }
      expect(rounds).toEqual(['r1', 'r2', 'cf', 'finals']);
      expect(p.result).toBe('champion');
      expect(new Set(p.faced).size).toBe(4);
    }
  });
  it('Ausscheiden in Runde 2 → Ergebnis r2', () => {
    const rng = seededRng(3);
    let p = startPostseason(state(), 50, tableAt(4), rng)!;
    p = advance(p, true, state(), rng);
    expect(advance(p, false, state(), rng)).toMatchObject({ done: true, result: 'r2' });
  });
  it('Speicherstand mit und ohne postseason bleibt gültig', () => {
    const st = memory();
    saveCareer(state(), st);
    expect(loadCareer(st)!.postseason).toBeUndefined();
    const p = startPostseason(state(), 50, tableAt(4), seededRng(1))!;
    saveCareer({ ...state(), postseason: p }, st);
    expect(loadCareer(st)!.postseason).toEqual(p);
  });
});
