import { describe, expect, it } from 'vitest';
import { GROWTH, applyGrowth, growth, growthText } from '../src/career/growth';
import { SAMPLE } from './career-state.test';
import type { SceneResult } from '../src/career/scene-types';

const res = (made: SceneResult['made'], ast = 0): SceneResult => ({ won: false, verdict: '', pts: 0, ast, made });

describe('Werte leveln durch eigene Aktionen', () => {
  it('jeder eigene Treffer hebt den passenden Wert, jeder Assist das Passen', () => {
    expect(growth([res(['three']), res(['jump2', 'three'], 2)])).toEqual({ three: 2 * GROWTH, mid: GROWTH, pass: 2 * GROWTH });
    expect(growth([res(['layup']), res(['dunk']), res(['contact_dunk'])])).toEqual({ finish: GROWTH, dunk: 2 * GROWTH });
    expect(growth([res(undefined), res([])])).toEqual({});
  });
  it('wird auf die Werte addiert, nie über 1; andere Werte bleiben', () => {
    const r = SAMPLE.player.ratings, next = applyGrowth({ ...r, pass: .999 }, { three: 2 * GROWTH, pass: 5 * GROWTH });
    expect(next.three).toBeCloseTo(r.three + 2 * GROWTH, 9);
    expect(next.pass).toBe(1);
    expect(next.mid).toBe(r.mid); expect(next.defense).toBe(r.defense);
  });
  it('ein Skillpunkt (+2) entspricht mehreren Aktionen', () => {
    expect(GROWTH).toBeGreaterThan(0); expect(GROWTH * 4).toBeLessThan(.02);
  });
  it('Text für den Ergebnis-Bildschirm', () => {
    expect(growthText({ three: 2 * GROWTH, pass: GROWTH })).toBe('Dreier +0,6 · Passen +0,3');
    expect(growthText({})).toBe('');
  });
});
