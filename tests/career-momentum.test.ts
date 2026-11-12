import { describe, expect, it } from 'vitest';
import { advanceScore, crunch, fate, openingScore, scenePeriods, sceneGap } from '../src/career/momentum';
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
  it('Schluss-Szene nur bei Gleichstand oder 1–3 hinten; knapp vorne → Gegner gleicht aus oder führt mit 1; sonst offene Szene', () => {
    const rng = seededRng(1);
    expect(crunch({ own: 96, opp: 99 }, rng)).toEqual({ kind: 'play', deficit: 3 });
    expect(crunch({ own: 99, opp: 99 }, rng)).toEqual({ kind: 'play', deficit: 0 });
    expect(crunch({ own: 95, opp: 99 }, rng)).toEqual({ kind: 'open' });
    expect(crunch({ own: 90, opp: 99 }, rng)).toEqual({ kind: 'open' });
    expect(crunch({ own: 104, opp: 99 }, rng)).toEqual({ kind: 'open' });
    for (let i = 0; i < 50; i++) {
      const c = crunch({ own: 101, opp: 99 }, rng);
      expect(c.kind).toBe('play');
      if (c.kind === 'play') expect([0, 1]).toContain(c.deficit);
    }
  });
  it('Spielverlauf gegen die Leistung: etwa 7 % klar dagegen, 7 % klar dafür, sonst unverändert', () => {
    let against = 0, forUs = 0;
    for (let seed = 1; seed <= 3000; seed++) {
      const s = fate({ own: 22, opp: 22 }, seededRng(seed)), d = s.own - s.opp;
      expect([0, ...Array.from({ length: 7 }, (_, i) => 10 + i)]).toContain(Math.abs(d));
      if (d < 0) against++; else if (d > 0) forUs++;
    }
    expect(against / 3000).toBeGreaterThan(.04); expect(against / 3000).toBeLessThan(.1);
    expect(forUs / 3000).toBeGreaterThan(.04); expect(forUs / 3000).toBeLessThan(.1);
  });
});
