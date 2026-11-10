import { describe, expect, it } from 'vitest';
import { finishBanner, finishKind, foulChance, freeThrowCount, isThree, meterDuration,
  shotKindAt, verdict, zoneFactor } from '../src/play/finish';
import type { ShotKind } from '../src/play/finish';

describe('Abschlussart', () => {
  it.each([
    [0.9, 0.8, 0.9, 'dunk'], [0.7, 0.6, 0.9, 'dunk'],
    [0.9, 0.3, 0.4, 'contact_dunk'], [0.9, 0.3, 0.6, 'layup'],
    [0.6, 1, 0, 'layup'], [0.6, 0, 0, 'layup'],
  ] as const)('wählt bei Athletik %s, P %s und Zufall %s den Abschluss %s', (ath, P, random, kind) => {
    expect(finishKind(ath, P, () => random)).toBe(kind);
  });
});

describe('Fouls, Zonen und Tempo', () => {
  it.each<[ShotKind, number, number, number]>([
    ['layup', 0, 1, 0.3], ['layup', 0.5, 1, 0.165], ['layup', 1, 1, 0.03],
    ['dunk', 0, 1, 0.3], ['dunk', 0.5, 1, 0.165], ['dunk', 1, 1, 0.03],
    ['jump2', 0, 1, 0.1], ['jump2', 0.5, 1, 0.055], ['jump2', 1, 1, 0.01],
    ['three', 0, 1, 0.05], ['three', 0.5, 1, 0.0275], ['three', 1, 1, 0.005],
    ['three', 0, 2, 0.1], ['contact_dunk', 0, 1, 0.4],
    ['contact_dunk', 0.5, 1, 0.4], ['contact_dunk', 1, 0.5, 0.2],
    ['contact_dunk', 0, 0, 0],
  ])('berechnet die Foulchance für %s, P %s, Multiplikator %s', (kind, P, mult, chance) => {
    expect(foulChance(kind, P, mult)).toBeCloseTo(chance, 10);
  });

  it('multipliziert Positions-, Foul- und Kontaktfaktor jeweils einmal', () => {
    expect(zoneFactor(0, 0.7, true, true)).toBeCloseTo(0.7 * 0.6 * 0.75, 10);
    expect(zoneFactor(0.5, 0.7, false, false)).toBeCloseTo(0.85, 10);
    expect(zoneFactor(1, 0.7, false, false)).toBe(1);
    expect(zoneFactor(1, 0.7, true, false)).toBe(0.6);
    expect(zoneFactor(1, 0.7, false, true)).toBe(0.75);
  });

  it.each([
    [450, 0, 0.3, 0, 315], [450, 0, 0.3, 1, 585],
    [450, 1, 0.3, 0, 450], [450, 1, 0.3, 1, 450],
    [450, 0.5, 0.3, 0.5, 450], [300, 0, 0.5, 0, 250],
  ])('berechnet die Anzeigedauer aus %s, P %s, Spanne %s und Zufall %s', (base, P, spread, random, ms) => {
    expect(meterDuration(base, P, spread, () => random)).toBeCloseTo(ms, 10);
  });
});

describe('Punkte und Freiwürfe', () => {
  it.each([
    [{ x: 0, z: 7 }, true], [{ x: 7, z: 0.5 }, true], [{ x: -7, z: 0.5 }, true],
    [{ x: 6.5, z: 1 }, false], [{ x: 0, z: 6.75 }, false],
    [{ x: 6.6, z: 0.5 }, false], [{ x: 6.59, z: -1.5 }, false],
  ])('ordnet den Wurf an %j als Dreier: %s ein', (pos, three) => {
    expect(isThree(pos)).toBe(three);
    expect(shotKindAt(pos)).toBe(three ? 'three' : 'jump2');
  });

  it.each<ShotKind>(['jump2', 'three', 'layup', 'dunk', 'contact_dunk'])(
    'vergibt Freiwürfe für %s nur bei Foul', (kind) => {
      expect(freeThrowCount(kind, true, false)).toBe(0);
      expect(freeThrowCount(kind, false, false)).toBe(0);
      expect(freeThrowCount(kind, true, true)).toBe(1);
      expect(freeThrowCount(kind, false, true)).toBe(kind === 'three' ? 3 : 2);
    });

  it.each([[3, 2, 'GAMEWINNER'], [2, 2, 'OVERTIME'], [0, 2, 'VERLOREN']] as const)(
    'bewertet %s Punkte gegen Rückstand %s als %s', (points, deficit, expected) => {
      expect(verdict(points, deficit)).toBe(expected);
    });
});

describe('Abschluss-Banner', () => {
  it.each<[ShotKind, string, string]>([
    ['jump2', 'TREFFER', 'DANEBEN'], ['three', 'DREIER', 'DANEBEN'],
    ['layup', 'KORBLEGER', 'VERLEGT'], ['dunk', 'DUNK', 'VOM RING'],
    ['contact_dunk', 'POSTER!', 'GEBLOCKT'],
  ])('liefert alle Banner-Kombinationen für %s', (kind, made, missed) => {
    expect(finishBanner(kind, true, false, false)).toBe(made);
    expect(finishBanner(kind, false, false, false)).toBe(missed);
    expect(finishBanner(kind, true, false, true)).toBe(`ASSIST + ${made}`);
    expect(finishBanner(kind, true, true, false)).toBe(`${made} + AND-ONE`);
    expect(finishBanner(kind, true, true, true)).toBe(`ASSIST + ${made} + AND-ONE`);
    expect(finishBanner(kind, false, false, true)).toBe(missed);
    for (const assisted of [false, true]) {
      expect(finishBanner(kind, false, true, assisted))
        .toBe(`FOUL – ${kind === 'three' ? 3 : 2} FREIWÜRFE`);
    }
  });
});
