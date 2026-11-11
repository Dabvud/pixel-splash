import { describe, expect, it } from 'vitest';
import { command, step, type PosterVariant } from '../src/play/engine';
import { ACTORS } from '../src/play/teams';
import { stadiumLayout } from '../src/render/stadium';
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

  it.each([[0, 'classic'], [.2999, 'classic'], [.3, 'flyout'], [.3999, 'flyout'], [.4, 'grave'], [.4999, 'grave'],
    [.5, 'crowd'], [.5999, 'crowd'], [.6, 'net'], [.6999, 'net'], [.7, 'ghost'], [.7999, 'ghost'],
    [.8, 'stuck'], [.8999, 'stuck'], [.9, 'jumbotron'], [.9999, 'jumbotron']] as [number, PosterVariant][])(
    'random mit rng=%s wählt %s (30/10/10/10/10/10/10/10)', (roll, variant) => {
      for (const posterVariant of [undefined, 'random'] as const) {
        const c = { ...posterConfig, posterVariant }, s = posterShot(c);
        step(s, 1, c, () => roll);
        expect(s.poster?.variant).toBe(variant);
      }
    });

  it('würfelt die Variante erst beim tatsächlich gelungenen Poster', () => {
    const c = { ...posterConfig, posterVariant: 'random' as const, glassChance: 0 }, s = posterShot(c);
    let calls = 0;
    const rng = () => { calls++; return .1; };
    step(s, .49, c, rng); expect(calls).toBe(0);
    step(s, .1, c, rng); expect(calls).toBe(1);
    step(s, 2, c, rng); expect(calls).toBe(1);
  });

  it.each(['crowd', 'net', 'ghost', 'stuck', 'jumbotron'] as const)('%s erreicht sein Ziel und bleibt bei Freiwürfen', posterVariant => {
    const c = { ...posterConfig, posterVariant, finishFoulOverride: 1, glassChance: 0 }, s = posterShot(c), d = s.actors.b1;
    let peak = 0;
    for (let i = 0; i < 840; i++) { step(s, 1 / 240, c, () => .1); peak = Math.max(peak, d.y); }
    expect(s.poster).toMatchObject({ kind: 'poster', variant: posterVariant });
    const expectedMove = posterVariant === 'net' ? 'hang_upside' : posterVariant === 'stuck' ? 'legs_up' : 'knocked_down';
    expect(d.move).toBe(expectedMove);
    if (posterVariant === 'crowd') {
      expect(peak).toBeGreaterThanOrEqual(3);
      expect(Math.abs(d.pos.x)).toBeCloseTo(15.775);
      expect(d.pos.z).toBeCloseTo(2.4); expect(d.y).toBeCloseTo(.7);
    } else if (posterVariant === 'net') {
      expect(Math.abs(d.pos.x)).toBeLessThanOrEqual(.08); expect(d.pos.z).toBe(0);
      expect(d.y + ACTORS[d.id].heightM * 1.15).toBeCloseTo(2.8);
    } else if (posterVariant === 'ghost') {
      expect(d.y).toBe(-ACTORS[d.id].heightM);
      expect(s.grave).toMatchObject({ x: d.pos.x, z: d.pos.z });
      expect(s.ghost).toMatchObject({ x: d.pos.x, z: d.pos.z });
    } else if (posterVariant === 'stuck') {
      expect(d.y).toBeCloseTo(-.65 * ACTORS[d.id].heightM);
      expect(s.splinters).toMatchObject({ x: d.pos.x, z: d.pos.z });
    } else {
      expect(peak).toBeGreaterThanOrEqual(13.1);
      expect(Math.abs(d.pos.x)).toBeCloseTo(.8); expect(d.pos.z).toBe(-2.4); expect(d.y).toBe(0);
      expect(s.ouch).not.toBeNull();
    }
    const landed = { ...d.pos }, y = d.y;
    const check = () => {
      expect(d.move).toBe(expectedMove); expect(d.y).toBe(y);
      if (posterVariant === 'net') { expect(Math.abs(d.pos.x)).toBeLessThanOrEqual(.08); expect(d.pos.z).toBe(0); }
      else expect(d.pos).toEqual(landed);
    };
    expect(s.freeThrows).toEqual({ shooter: 'r23', left: 1 });
    step(s, 3, c, () => .1); check();
    if (posterVariant === 'net') expect(d.pos.x).not.toBe(landed.x);
    command(s, { kind: 'comboStart' }, c, () => .1);
    command(s, { kind: 'comboRelease', holdMs: s.combo!.meterMs, angleDeg: 0 }, c, () => .1);
    step(s, 4, c, () => .1); expect(s.phase).toBe('ended'); check();
  });

  it.each(['crowd', 'net', 'ghost', 'stuck', 'jumbotron'] as const)('%s bleibt auch bei Brettbruch am Poster-Ort', posterVariant => {
    const c = { ...posterConfig, posterVariant, forceGlass: true, finishFoulOverride: 1 }, s = posterShot(c), d = s.actors.b1;
    step(s, 4, c, () => .1);
    const pos = { ...d.pos }, y = d.y, move = d.move;
    step(s, 6, c, () => .1);
    expect(d.move).toBe(move); expect(d.y).toBe(y); expect(d.pos.z).toBe(pos.z);
    if (posterVariant === 'net') expect(Math.abs(d.pos.x)).toBeLessThanOrEqual(.08);
    else expect(d.pos.x).toBe(pos.x);
  });

  it.each(['crowd', 'net', 'ghost', 'stuck', 'jumbotron'] as const)('verwendet %s nur beim Treffer', posterVariant => {
    const c = { ...posterConfig, posterVariant, glassChance: 0 }, s = posterShot(c, false);
    step(s, 4, c, () => .9);
    expect(s.poster).toMatchObject({ kind: 'block', variant: 'classic' });
    expect(s.ghost).toBeNull(); expect(s.splinters).toBeNull(); expect(s.ouch).toBeNull();
  });

  it('startet die Seele erst nach dem vollständigen Versinken', () => {
    const c = { ...posterConfig, posterVariant: 'ghost' as const, glassChance: 0 }, s = posterShot(c);
    step(s, .6, c, () => .1);
    expect(s.grave).not.toBeNull(); expect(s.ghost).toBeNull();
    step(s, .6, c, () => .1);
    expect(s.ghost).not.toBeNull(); expect(s.actors.b1.y).toBe(-ACTORS.b1.heightM);
  });

  it('lässt den gefoulten Block-Schützen beim Freiwurf wieder normal springen', () => {
    const c = { ...posterConfig, blockFoulChance: 1, glassChance: 0, finishFoulOverride: 0, foulScene: false }, s = posterShot(c, false);
    step(s, 4, c, () => .1);
    command(s, { kind: 'comboStart' }, c, () => .1);
    command(s, { kind: 'comboRelease', holdMs: s.combo!.meterMs, angleDeg: 0 }, c, () => .1);
    step(s, .2, c, () => .1);
    expect(s.actors.r23.move).toBe('jumpshot'); expect(s.actors.r23.y).toBeGreaterThan(0);
  });

  it.each([-Math.PI / 2, Math.PI / 2])('crowd landet auf seiner Kontaktseite in der ersten Zuschauerreihe (%s)', facing => {
    const c = { ...posterConfig, posterVariant: 'crowd' as const, glassChance: 0 }, s = posterShot(c);
    s.actors.r23.facing = facing;
    while (!s.poster) step(s, 1 / 240, c, () => .1);
    const d = s.actors.b1, side = Math.sign(d.pos.x);
    step(s, 2, c, () => .1);
    expect(Math.sign(d.pos.x)).toBe(side);
    const tier = stadiumLayout().boxes.find(b => b.kind === 'tier' && b.size[1] === .7
      && Math.abs(d.pos.x - b.center[0]) < b.size[0] / 2 && Math.abs(d.pos.z - b.center[2]) < b.size[2] / 2);
    expect(tier).toBeDefined(); expect(d.y).toBe(tier!.size[1]);
  });

  it.each(['crowd', 'net', 'ghost', 'stuck', 'jumbotron'] as const)('%s benötigt im erzwungenen Ablauf keinen zusätzlichen Zufall', posterVariant => {
    const c = { ...posterConfig, posterVariant, glassChance: 0 }, s = posterShot(c);
    let calls = 0;
    step(s, 5, c, () => { calls++; return .1; });
    expect(calls).toBe(0);
  });

  it('jumbotron erreicht nach 1,3 Sekunden die Unterseite und fällt danach', () => {
    const c = { ...posterConfig, posterVariant: 'jumbotron' as const }, s = posterShot(c);
    while (!s.poster) step(s, 1 / 240, c, () => .1);
    step(s, 1.3, c, () => .1);
    expect(s.actors.b1.pos.z).toBeCloseTo(10.65, 1);
    expect(s.actors.b1.y).toBeCloseTo(13.1, 1); expect(s.ouch).not.toBeNull();
    step(s, 1.1, c, () => .1);
    expect(s.actors.b1.y).toBe(0); expect(s.actors.b1.pos.z).toBe(-2.4);
  });
});
