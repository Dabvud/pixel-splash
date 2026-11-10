import { describe, expect, it, vi } from 'vitest';
import {
  MAX_FILL, bankWidth, bankWindow, distanceFactor, effectiveZones, feedback, resolveShot, statFactor,
} from '../src/shot/resolve';
import type { Outcome, ShotParams } from '../src/shot/resolve';

const P: ShotParams = {
  meterMs: 1000, greenZone: 0.1, aimDeg: 10, rating: 0.5, influence: 0.6, distance: 4.6,
};

describe('Brett-Fenster', () => {
  it.each([[0, .5], [10, .5], [15, .75], [20, 1], [60, 1], [67.5, .5], [75, 0], [86, 0]])(
    'berechnet bankWidth bei φ=%s° als %s', (phi, width) => {
      expect(bankWidth(phi)).toBeCloseTo(width, 12);
    });

  it.each([[45, 0, 'bank_in'], [45, .8, 'rim_back'], [86, 0, 'rim_back']] as const)(
    'wertet t=1,5 bei φ=%s° und r=%s als %s', (bankAngleDeg, r, outcome) => {
      const rng = vi.fn(() => .99);
      const result = resolveShot({ holdMs: 1150, angleDeg: r * 10 }, { ...P, bankAngleDeg }, rng);
      expect(result).toMatchObject({ outcome, made: outcome === 'bank_in' });
      if (outcome === 'bank_in') expect(result.banner).toBe('BRETT – DRIN');
      expect(rng).not.toHaveBeenCalled();
    });

  it('bewahrt ohne bankAngleDeg das bisherige Verhalten und zeigt kein Fenster', () => {
    expect(bankWindow(P)).toBeNull();
    expect(bankWindow({ ...P, bankAngleDeg: 86 })).toBeNull();
    expect(resolveShot({ holdMs: 1150, angleDeg: 0 }, P).outcome).toBe('rim_back');
    expect(resolveShot({ holdMs: 1120, angleDeg: 0 }, P, () => .99).outcome).toBe('roll_out');
  });

  it('gibt dem Brett-Fenster auch vor dem Ringtanz Vorrang und schließt |r|=0,6 ein', () => {
    const rng = vi.fn(() => .99), p = { ...P, bankAngleDeg: 45 };
    expect(resolveShot({ holdMs: 1120, angleDeg: 0 }, p, rng).outcome).toBe('bank_in');
    for (const angleDeg of [-6, 6]) {
      expect(resolveShot({ holdMs: 1150, angleDeg }, p, rng).outcome).toBe('bank_in');
    }
    expect(resolveShot({ holdMs: 1150, angleDeg: 6.001 }, p, rng).outcome).toBe('rim_back');
    expect(rng).not.toHaveBeenCalled();
  });

  it.each([0, 15, 45, 67.5, 74.9])('verwendet bei φ=%s° dieselben Fenstergrenzen für Anzeige und Auswertung', bankAngleDeg => {
    for (const factor of [1, .6]) {
      const p = { ...P, bankAngleDeg, rating: .9, distance: 6.75, zoneFactor: factor };
      const g = effectiveZones(p).g, w = bankWidth(bankAngleDeg), window = bankWindow(p)!;
      expect(window.lo).toBeCloseTo(1 + (1.5 - .3 * w) * g, 12);
      expect(window.hi).toBeCloseTo(1 + (1.5 + .3 * w) * g, 12);
      for (const [fill, inside] of [[window.lo - 1e-6, false], [window.lo, true],
        [(window.lo + window.hi) / 2, true], [window.hi, true], [window.hi + 1e-6, false]] as const) {
        expect(resolveShot({ holdMs: fill * p.meterMs, angleDeg: 0 }, p, () => .99).outcome === 'bank_in').toBe(inside);
      }
    }
  });
});

describe('Wurfzonen', () => {
  it('multipliziert beide Zonen genau einmal mit zoneFactor und verwendet sonst eins', () => {
    const params = { ...P, rating: 0.9, distance: 6.75 };
    const original = effectiveZones(params);
    expect(effectiveZones({ ...params, zoneFactor: 1 })).toEqual(original);
    const half = effectiveZones({ ...params, zoneFactor: 0.5 });
    expect(half.g).toBeCloseTo(original.g * 0.5, 10);
    expect(half.a).toBeCloseTo(original.a * 0.5, 10);
  });

  it('wertet 1080 ms mit halben Zonen als rim_back statt rim_in aus', () => {
    const input = { holdMs: 1080, angleDeg: 0 };
    expect(resolveShot(input, P).outcome).toBe('rim_in');
    const result = resolveShot(input, { ...P, zoneFactor: 0.5 });
    expect(result.t).toBeCloseTo(1.6, 10);
    expect(result.outcome).toBe('rim_back');
  });
  it('berechnet den Stat-Faktor', () => {
    expect(statFactor(0.9, 0.6)).toBeCloseTo(1.384, 6);
    expect(statFactor(0.1, 1)).toBeCloseTo(0.36, 6);
    for (const rating of [0.1, 0.5, 0.9]) expect(statFactor(rating, 0)).toBe(1);
  });

  it('berechnet und begrenzt den Distanzfaktor', () => {
    expect(distanceFactor(4.2)).toBe(1);
    expect(distanceFactor(6.75)).toBeCloseTo(0.914, 6);
    expect(distanceFactor(20)).toBe(0.8);
  });

  it('wendet beide Faktoren auf beide Halbbreiten an', () => {
    expect(effectiveZones(P)).toEqual({ g: 0.1, a: 10 });
    const zones = effectiveZones({ ...P, rating: 0.9, distance: 6.75 });
    expect(zones.g).toBeCloseTo(0.1 * 1.384 * 0.914, 8);
    expect(zones.a).toBeCloseTo(10 * 1.384 * 0.914, 8);
  });
});

describe('Wurfauswertung', () => {
  const cases: [number, number, number, Outcome, boolean, string, string][] = [
    [1000, 0, 0.2, 'swish', true, 'SWISH', 'perfekt'],
    [1080, 0, 0.2, 'rim_in', true, 'TREFFER', 'perfekt'],
    [1120, 0, 0.2, 'roll_in', true, 'RINGTANZ – DRIN', 'etwas zu spät'],
    [1120, 0, 0.8, 'roll_out', false, 'RINGTANZ – RAUS', 'etwas zu spät'],
    [850, 0, 0.2, 'rim_front', false, 'RING VORNE', 'etwas zu früh'],
    [1150, 5, 0.2, 'rim_back', false, 'RING HINTEN', 'etwas zu spät'],
    [1000, -17, 0.2, 'rim_left', false, 'RING LINKS', 'perfekt · leicht links'],
    [1000, 17, 0.2, 'rim_right', false, 'RING RECHTS', 'perfekt · leicht rechts'],
    [600, 0, 0.2, 'airball', false, 'AIRBALL', 'viel zu früh'],
    [1300, 0, 0.2, 'board', false, 'BRETT', 'viel zu spät'],
    [1000, -30, 0.2, 'wide_left', false, 'LINKS VORBEI', 'perfekt · weit links'],
    [1000, 30, 0.2, 'wide_right', false, 'RECHTS VORBEI', 'perfekt · weit rechts'],
  ];
  it.each(cases)('wertet Halten %s, Winkel %s, Zufall %s als %s aus', (holdMs, angleDeg, random, outcome, made, banner, hint) => {
    const result = resolveShot({ holdMs, angleDeg }, P, () => random);
    expect(result).toMatchObject({ outcome, made, banner, hint });
    expect(result.fill).toBeCloseTo(holdMs / P.meterMs, 10);
    expect(result.t).toBeCloseTo((holdMs / P.meterMs - 1) / 0.1, 10);
    expect(result.r).toBeCloseTo(angleDeg / 10, 10);
    expect(result.F).toBeCloseTo(Math.hypot(result.t, result.r), 10);
  });

  it.each([
    [1050, 'swish'], [1100, 'rim_in'], [1130, 'roll_in'], [1200, 'rim_back'],
    [950, 'swish'], [900, 'rim_in'], [870, 'roll_in'], [800, 'rim_front'],
  ] as const)('schließt die Timing-Grenze bei %s ein', (holdMs, outcome) => {
    expect(resolveShot({ holdMs, angleDeg: 0 }, P, () => 0.2).outcome).toBe(outcome);
  });

  it.each([
    [5, 'swish'], [5.001, 'rim_in'], [10, 'rim_in'], [10.001, 'roll_in'],
    [13, 'roll_in'], [13.001, 'rim_right'], [20, 'rim_right'], [20.001, 'wide_right'],
    [-5, 'swish'], [-5.001, 'rim_in'], [-10, 'rim_in'], [-10.001, 'roll_in'],
    [-13, 'roll_in'], [-13.001, 'rim_left'], [-20, 'rim_left'], [-20.001, 'wide_left'],
  ] as const)('beachtet die Richtungsgrenze bei %s', (angleDeg, outcome) => {
    expect(resolveShot({ holdMs: 1000, angleDeg }, P, () => 0.2).outcome).toBe(outcome);
  });

  it('nutzt den Gesamtfehler aus beiden Komponenten', () => {
    const result = resolveShot({ holdMs: 1080, angleDeg: 8 }, P, () => 0.2);
    expect(result.F).toBeCloseTo(Math.hypot(0.8, 0.8), 8);
    expect(result.outcome).toBe('roll_in');
  });

  it('begrenzt sehr langes Halten auf 1,6', () => {
    expect(MAX_FILL).toBe(1.6);
    expect(resolveShot({ holdMs: 99999, angleDeg: 0 }, P)).toMatchObject({
      fill: 1.6, outcome: 'board', made: false,
    });
  });

  it('liefert ohne Stat-Einfluss für alle Profile dasselbe Ergebnis', () => {
    const input = { holdMs: 1150, angleDeg: 0 };
    const results = [0.1, 0.5, 0.9].map((rating) =>
      resolveShot(input, { ...P, rating, influence: 0 }, () => 0.2));
    expect(results[0]).toEqual(results[1]);
    expect(results[1]).toEqual(results[2]);
  });

  it('unterscheidet Elite und Center bei starkem Stat-Einfluss', () => {
    const input = { holdMs: 1150, angleDeg: 0 };
    expect(resolveShot(input, { ...P, rating: 0.9, influence: 1 }, () => 0.2).outcome).toBe('rim_in');
    expect(resolveShot(input, { ...P, rating: 0.1, influence: 1 }, () => 0.2).outcome).toBe('board');
  });

  it.each([
    [1250, 15, 15, 'rim_back'], [750, -15, 15, 'rim_front'],
    [1500, 30, 15, 'board'], [500, -30, 15, 'airball'],
  ] as const)('lässt bei gleich großen Fehlern die Timing-Komponente entscheiden (%s)', (holdMs, angleDeg, aimDeg, outcome) => {
    const result = resolveShot({ holdMs, angleDeg }, { ...P, greenZone: 0.25, aimDeg });
    expect(Math.abs(result.t)).toBe(Math.abs(result.r));
    expect(result.outcome).toBe(outcome);
  });

  it('teilt den Ringtanz exakt bei Zufallswert 0,5', () => {
    expect(resolveShot({ holdMs: 1120, angleDeg: 0 }, P, () => 0.499).outcome).toBe('roll_in');
    expect(resolveShot({ holdMs: 1120, angleDeg: 0 }, P, () => 0.5).outcome).toBe('roll_out');
  });

  it('zieht Zufall nur beim Ringtanz und verwendet standardmäßig Math.random', () => {
    const rng = vi.fn(() => 0.2);
    resolveShot({ holdMs: 1000, angleDeg: 0 }, P, rng);
    expect(rng).not.toHaveBeenCalled();
    resolveShot({ holdMs: 1120, angleDeg: 0 }, P, rng);
    expect(rng).toHaveBeenCalledTimes(1);
    const random = vi.spyOn(Math, 'random').mockReturnValue(0.8);
    try {
      expect(resolveShot({ holdMs: 1120, angleDeg: 0 }, P).outcome).toBe('roll_out');
    } finally {
      random.mockRestore();
    }
  });
});

describe('grobe Rückmeldung', () => {
  it.each([
    [0, 0, 'perfekt'], [-1, -1, 'perfekt'], [1, 1, 'perfekt'],
    [-1.001, 0, 'etwas zu früh'], [1.001, 0, 'etwas zu spät'],
    [-2, 0, 'etwas zu früh'], [2, 0, 'etwas zu spät'],
    [-2.001, 0, 'viel zu früh'], [2.001, 0, 'viel zu spät'],
    [0, -1.001, 'perfekt · leicht links'], [0, 1.001, 'perfekt · leicht rechts'],
    [0, -2, 'perfekt · leicht links'], [0, 2, 'perfekt · leicht rechts'],
    [0, -2.001, 'perfekt · weit links'], [0, 2.001, 'perfekt · weit rechts'],
    [-3, 3, 'viel zu früh · weit rechts'],
  ])('beschreibt t=%s, r=%s als %s', (t, r, expected) => {
    expect(feedback(t, r)).toBe(expected);
  });
});
