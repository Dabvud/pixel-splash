import { describe, expect, it } from 'vitest';
import { applyMoves, createLeague, evolveLeague, heroBonus, pickMoves, ratings } from '../src/career/world';
import { seededRng } from '../src/career/create';
import { TEAMS } from '../src/career/league';
import { standings } from '../src/career/season';
import { SAMPLE } from './career-state.test';

const ids = TEAMS.map(t => t.id);
const mean = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;

describe('Liga: Teamwerte, Verläufe, Stars', () => {
  it('Start: 60 Stars bei gültigen Teams, eindeutige Namen; Werte gelost, Schnitt 60, breite aber normale Verteilung', () => {
    const a = createLeague(seededRng(1)), b = createLeague(seededRng(2));
    expect(a.stars).toHaveLength(60);
    expect(new Set(a.stars.map(s => s.name)).size).toBe(60);
    for (const s of a.stars) { expect(ids).toContain(s.team); expect(s.value).toBeGreaterThanOrEqual(4); expect(s.value).toBeLessThanOrEqual(10); }
    expect(ratings(a)).not.toEqual(ratings(b));
    for (let seed = 1; seed <= 40; seed++) {
      const v = Object.values(ratings(createLeague(seededRng(seed))));
      expect(v).toHaveLength(30);
      expect(Math.abs(mean(v) - 60)).toBeLessThan(1.5);
      expect(Math.max(...v)).toBeGreaterThanOrEqual(72); expect(Math.max(...v)).toBeLessThanOrEqual(99);
      expect(Math.min(...v)).toBeLessThanOrEqual(50); expect(Math.min(...v)).toBeGreaterThanOrEqual(25);
    }
  });
  it('Verläufe statt Neuauslosung: von Jahr zu Jahr meist kleine Schritte, über 20 Jahre trotzdem Auf- und Abstiege', () => {
    let small = 0, steps = 0, swings = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const rng = seededRng(seed);
      let l = createLeague(rng);
      const lo: Record<string, number> = {}, hi: Record<string, number> = {};
      for (let y = 0; y < 20; y++) {
        const before = ratings(l);
        l = evolveLeague(l, rng);
        l = applyMoves(l, pickMoves(l, rng));
        const after = ratings(l);
        expect(Math.abs(mean(Object.values(after)) - 60)).toBeLessThan(3);
        for (const id of ids) {
          expect(after[id]).toBeGreaterThanOrEqual(25); expect(after[id]).toBeLessThanOrEqual(99);
          steps++; if (Math.abs(after[id] - before[id]) <= 8) small++;
          lo[id] = Math.min(lo[id] ?? 99, after[id]); hi[id] = Math.max(hi[id] ?? 0, after[id]);
        }
        expect(l.stars.length).toBeGreaterThanOrEqual(35); expect(l.stars.length).toBeLessThanOrEqual(70);
        for (const s of l.stars) { expect(s.age).toBeLessThan(40); expect(s.value).toBeGreaterThanOrEqual(4); }
      }
      swings += ids.filter(id => hi[id] - lo[id] >= 15).length;
    }
    expect(small / steps).toBeGreaterThan(.8); // Teams bleiben meist in ihrer Region
    expect(swings / 20).toBeGreaterThan(12); // aber über die Jahre bewegt sich mehr als ein Drittel deutlich
  });
  it('Wechsel: 1–3 Stars ab Wert 6 zu einem anderen Team', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const l = createLeague(seededRng(seed)), moves = pickMoves(l, seededRng(seed + 500));
      expect(moves.length).toBeGreaterThanOrEqual(1); expect(moves.length).toBeLessThanOrEqual(3);
      expect(new Set(moves.map(m => m.name)).size).toBe(moves.length);
      for (const m of moves) { expect(m.value).toBeGreaterThanOrEqual(6); expect(m.to).not.toBe(m.from); }
    }
  });
  it('eigener Spieler: Rookie hebt den Teamwert kaum, ein Superstar um 8', () => {
    const all = (v: number) => Object.fromEntries(Object.keys(SAMPLE.player.ratings).map(k => [k, v])) as typeof SAMPLE.player.ratings;
    expect(heroBonus(all(.5))).toBe(0); expect(heroBonus(all(.55))).toBe(1); expect(heroBonus(all(.95))).toBe(8);
  });
  it('Tabelle: der höhere Teamwert steht meistens, aber nicht immer vorne', () => {
    let upsets = 0, pairs = 0;
    const strengths = Object.fromEntries(TEAMS.map((t, i) => [t.id, 45 + i % 15 * 2]));
    for (let seed = 1; seed <= 200; seed++) {
      const table = standings({ ...SAMPLE, strengths }, 41, seededRng(seed)).filter(r => r.team !== SAMPLE.team);
      for (let i = 1; i < table.length; i++) { pairs++; if (strengths[table[i].team] > strengths[table[i - 1].team]) upsets++; }
    }
    expect(upsets / pairs).toBeGreaterThan(.1); expect(upsets / pairs).toBeLessThan(.45);
  });
});
