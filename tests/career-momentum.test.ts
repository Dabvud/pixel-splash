import { describe, expect, it } from 'vitest';
import { advanceScore, crunch, openingScore, scenePeriods, sceneGap } from '../src/career/momentum';
import { seededRng } from '../src/career/create';

const res = (teamPts: number) => ({ won: teamPts > 0, verdict: '', pts: teamPts, ast: 0, teamPts });

describe('Momentum in den Key Games', () => {
  it('Viertel der Szenen', () => {
    expect(scenePeriods(3)).toEqual(['1. VIERTEL', '3. VIERTEL', '4. VIERTEL']);
    expect(scenePeriods(2)).toEqual(['2. VIERTEL', '4. VIERTEL']);
    expect(sceneGap(3, 1)).toBe(1.5); expect(sceneGap(2, 1)).toBe(2.5);
  });
  it('realistische Spielstände: 1. Viertel um die 20, 2. Viertel um die 45', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const q1 = openingScore(3, 60, 60, 'pro', seededRng(seed));
      expect(q1.own).toBeGreaterThanOrEqual(14); expect(q1.own).toBeLessThanOrEqual(30);
      expect(Math.abs(q1.opp - q1.own)).toBeLessThanOrEqual(12);
      const q2 = openingScore(2, 60, 60, 'pro', seededRng(seed));
      expect(q2.own).toBeGreaterThanOrEqual(36); expect(q2.own).toBeLessThanOrEqual(56);
    }
  });
  it('Treffer in der Szene zählen und geben Momentum – im Mittel besser als ein Fehlwurf', () => {
    let hit = 0, miss = 0;
    for (let seed = 1; seed <= 400; seed++) {
      const start = { own: 22, opp: 30 };
      const a = advanceScore(start, res(3), 1.5, 60, 60, 'pro', seededRng(seed));
      const b = advanceScore(start, res(0), 1.5, 60, 60, 'pro', seededRng(seed));
      expect(a.own).toBeGreaterThan(40); expect(a.own).toBeLessThan(75);
      hit += a.own - a.opp; miss += b.own - b.opp;
    }
    expect(hit / 400 - miss / 400).toBeGreaterThan(8); // 3 Punkte + Momentum-Schwung
  });
  it('Schwierigkeit Hall of Fame macht den Gegner stärker, Rookie schwächer', () => {
    let hof = 0, rookie = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const s = { own: 50, opp: 50 };
      const h = advanceScore(s, res(0), 1.5, 60, 60, 'hof', seededRng(seed)), r = advanceScore(s, res(0), 1.5, 60, 60, 'rookie', seededRng(seed));
      hof += h.opp - h.own; rookie += r.opp - r.own;
    }
    expect(hof).toBeGreaterThan(rookie);
  });
  it('Crunchtime: 1–6 hinten → spielen, mehr → schon verloren, knapp vorne → Gegner gleicht fast aus, klar vorne → gewonnen', () => {
    expect(crunch({ own: 95, opp: 99 })).toEqual({ kind: 'play', deficit: 4 });
    expect(crunch({ own: 90, opp: 99 })).toEqual({ kind: 'lost' });
    expect(crunch({ own: 99, opp: 98 })).toEqual({ kind: 'play', deficit: 1 });
    expect(crunch({ own: 99, opp: 99 })).toEqual({ kind: 'play', deficit: 1 });
    expect(crunch({ own: 104, opp: 99 })).toEqual({ kind: 'won' });
  });
});
