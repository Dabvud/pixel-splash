import { describe, expect, it } from 'vitest';
import { command, step, type PosterVariant } from '../src/play/engine';
import { ACTORS } from '../src/play/teams';
import { posterConfig, posterShot } from './poster-fixture';

describe('Poster-Varianten', () => {
  it.each(['classic', 'flyout', 'grave'] as const)('%s bleibt auch während Freiwürfen erhalten', posterVariant => {
    const c = { ...posterConfig, posterVariant, finishFoulOverride: 1 }, s = posterShot(c), d = s.actors.b1;
    let peak = 0;
    for (let i = 0; i < 480; i++) { step(s, 1 / 240, c, () => .1); peak = Math.max(peak, d.y); }
    expect(s.poster).toMatchObject({ kind: 'poster', victim: d.id, variant: posterVariant });
    expect(d.move).toBe('knocked_down');
    if (posterVariant === 'flyout') {
      expect(peak).toBeGreaterThanOrEqual(2.5);
      expect(Math.abs(d.pos.x)).toBeCloseTo(.8);
      expect(d.pos.z).toBeCloseTo(-2.4);
      expect(d.y).toBe(0);
    } else if (posterVariant === 'grave') {
      expect(d.y).toBeLessThanOrEqual(-ACTORS[d.id].heightM + .01);
      expect(s.grave).toMatchObject({ x: d.pos.x, z: d.pos.z });
    } else {
      expect(d.y).toBe(0);
      expect(s.grave).toBeNull();
    }
    const landed = { ...d.pos }, y = d.y, grave = s.grave && { ...s.grave };
    expect(s.freeThrows).toEqual({ shooter: 'r23', left: 1 });
    step(s, 3, c, () => .1);
    expect(d.pos).toEqual(landed); expect(d.y).toBe(y); expect(s.grave).toEqual(grave);
    command(s, { kind: 'comboStart' }, c, () => .1);
    command(s, { kind: 'comboRelease', holdMs: s.combo!.meterMs, angleDeg: 0 }, c, () => .1);
    step(s, 4, c, () => .1);
    expect(s.phase).toBe('ended'); expect(d.move).toBe('knocked_down');
    expect(d.pos).toEqual(landed); expect(d.y).toBe(y); expect(s.grave).toEqual(grave);
  });

  it.each([[0, 'classic'], [.4999, 'classic'], [.5, 'flyout'], [.7499, 'flyout'], [.75, 'grave'], [.999, 'grave']] as [number, PosterVariant][])(
    'random mit rng=%s wählt %s (50/25/25)', (roll, variant) => {
      for (const posterVariant of [undefined, 'random'] as const) {
        const c = { ...posterConfig, posterVariant }, s = posterShot(c);
        step(s, 1, c, () => roll);
        expect(s.poster?.variant).toBe(variant);
      }
    });

  it('würfelt die Variante erst beim tatsächlich gelungenen Poster', () => {
    const c = { ...posterConfig, posterVariant: 'random' as const }, s = posterShot(c);
    let calls = 0;
    const rng = () => { calls++; return .1; };
    step(s, .49, c, rng); expect(calls).toBe(0);
    step(s, .1, c, rng); expect(calls).toBe(1);
    step(s, 2, c, rng); expect(calls).toBe(1);
  });
});
