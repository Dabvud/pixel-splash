import { describe, expect, it } from 'vitest';
import { projectLine } from '../src/career/keygame';
import { seededRng } from '../src/career/create';
import { SAMPLE } from './career-state.test';
import type { SceneResult } from '../src/career/scene-types';

const r = SAMPLE.player.ratings;
const scene = (pts: number, ast = 0): SceneResult => ({ won: pts > 0, verdict: '', pts, ast });
const lines = (scenes: SceneResult[], ratings = r) => Array.from({ length: 300 }, (_, i) => projectLine(ratings, scenes, seededRng(i + 1)));
const avg = (v: number[]) => v.reduce((s, x) => s + x, 0) / v.length;

describe('Statline hängt an den eigenen Key Moments', () => {
  it('in jeder Szene einen Dreier getroffen → 37–41 Punkte', () => {
    for (const n of [2, 3]) for (const l of lines(Array.from({ length: n }, () => scene(3)))) {
      expect(l.pts).toBeGreaterThanOrEqual(37); expect(l.pts).toBeLessThanOrEqual(41);
    }
  });
  it('gestaffelt nach unten: Zweier in jeder Szene < Dreier in jeder Szene; halb getroffen darunter; ohne Punkte am wenigsten', () => {
    const three = avg(lines([scene(3), scene(3)]).map(l => l.pts)), two = avg(lines([scene(2), scene(2)]).map(l => l.pts));
    const half = avg(lines([scene(3), scene(0)]).map(l => l.pts)), none = lines([scene(0), scene(0)]).map(l => l.pts);
    expect(two).toBeGreaterThan(26); expect(two).toBeLessThan(32);
    expect(half).toBeGreaterThan(21); expect(half).toBeLessThan(two);
    expect(avg(none)).toBeLessThan(half - 8);
    for (const p of none) { expect(p).toBeGreaterThanOrEqual(10); expect(p).toBeLessThanOrEqual(14); }
    expect(three).toBeGreaterThan(two);
  });
  it('Assists: Spanne 3–15 – ohne Assist 3–5, in jeder Szene ein Assist 13–15', () => {
    const all = lines([scene(0, 1), scene(0, 1)]).map(l => l.ast), none = lines([scene(3), scene(3)]).map(l => l.ast);
    expect(Math.min(...all)).toBeGreaterThanOrEqual(13); expect(Math.max(...all)).toBeLessThanOrEqual(15);
    expect(Math.min(...none)).toBeGreaterThanOrEqual(3); expect(Math.max(...none)).toBeLessThanOrEqual(5);
    const one = avg(lines([scene(0, 1), scene(3)]).map(l => l.ast));
    expect(one).toBeGreaterThan(avg(none)); expect(one).toBeLessThan(avg(all));
  });
  it('Rebounds kommen aus Athletik und Verteidigung (keine Szenen-Aktion), nie negativ', () => {
    const big = avg(lines([scene(0)], { ...r, athleticism: .9, defense: .9 }).map(l => l.reb));
    const small = avg(lines([scene(0)], { ...r, athleticism: .2, defense: .2 }).map(l => l.reb));
    expect(big).toBeGreaterThan(small + 3);
    for (const l of lines([])) { expect(l.pts).toBeGreaterThanOrEqual(0); expect(l.ast).toBeGreaterThanOrEqual(0); expect(l.reb).toBeGreaterThanOrEqual(0); }
  });
});

describe('Statline: alle Körbe zählen', () => {
  it('Korbleger/Dunk (2 Punkte) in jeder Szene zählt wie jeder andere Zweier; mit And-One mehr', () => {
    const two = avg(lines([scene(2), scene(2), scene(2)]).map(l => l.pts)), andOne = avg(lines([scene(3), scene(2), scene(2)]).map(l => l.pts));
    expect(two).toBeGreaterThan(28); expect(two).toBeLessThan(32);
    expect(andOne).toBeGreaterThan(two);
  });
});
