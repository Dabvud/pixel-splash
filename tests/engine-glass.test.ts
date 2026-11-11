import { describe, expect, it, vi } from 'vitest';
import { command, createPlayState, step, type EngineConfig, type EngineEvent } from '../src/play/engine';
import { MOVES } from '../src/figure/moves';
import type { Play } from '../src/play/types';

const base: EngineConfig = {
  finishArrow: true, slowmo: .3, decisionS: 2, animSpeed: 1, foulMult: 0, zoneFloor: .7, tempoSpread: 0,
  shot: { meterMs: 700, greenZone: .07, aimDeg: 6, influence: .6 },
  finish: { meterMs: 900, greenZone: .18, aimDeg: 8 },
};
function shot(c: EngineConfig, options: { layup?: boolean; jump?: boolean; lob?: boolean; contact?: boolean; timing?: number; roll?: number } = {}) {
  const rng = vi.fn(() => options.roll ?? .1), id = options.layup ? 'r3' : 'r23';
  const play: Play = {
    id: 'fastbreak', name: 'Glas-Test', clockS: 30, deficit: 2, start: 'setup', actors: [id, 'r11', 'b1'],
    segments: { setup: { id: 'setup', handler: options.lob ? 'r11' : id, decisionAt: 0,
      paths: { [id]: [{ t: 0, x: 0, z: options.lob ? 1.2 : 3, act: 'dribble' }], r11: [{ t: 0, x: 4, z: 5, act: 'stand' }] },
      options: options.lob ? [{ kind: 'pass', to: id, lob: true }] : [{ kind: 'drive' }, { kind: 'shoot' }] } },
    variants: [{ id: 'fixed', weight: 1, defPaths: { setup: { b1: [{ t: 0, x: options.contact ? 0 : 6, z: 1.2, act: 'defend' }] } } }],
  };
  const s = createPlayState(play, c, rng);
  step(s, .8, c, rng);
  command(s, options.lob ? { kind: 'pass', to: id } : options.jump ? { kind: 'comboStart' } : { kind: 'drive', lane: 0 }, c, rng);
  for (let i = 0; i < 2000 && !s.combo; i++) step(s, 1 / 240, c, rng);
  const kind = s.combo!.kind, timing = options.timing ?? 0;
  if (s.arrowMeter) {
    const m = s.arrowMeter;
    step(s, Math.max(0, m.startTime + m.meterMs * (1 + timing * m.zones.g) / 1000 - s.realTime), c, rng);
    command(s, { kind: 'tap' }, c, rng);
  } else {
    if (!options.jump) command(s, { kind: 'comboStart' }, c, rng);
    command(s, { kind: 'comboRelease', holdMs: s.combo!.meterMs * (1 + timing * s.combo!.zones.g), angleDeg: 0 }, c, rng);
  }
  return { s, rng, kind, c };
}
function settle(f: ReturnType<typeof shot>) {
  const events: EngineEvent[] = [];
  for (let i = 0; i < 2400 && f.s.phase !== 'ended' && f.s.phase !== 'freethrows'; i++) events.push(...step(f.s, 1 / 240, f.c, f.rng));
  return events;
}

describe('Brett zerbrechen und Mop-Boy', () => {
  it.each([false, true])('erzwingt Glas beim Ringbild, zählt Punkte und räumt in unter sieben Sekunden auf (And-one %s)', andOne => {
    const f = shot({ ...base, forceGlass: true, finishFoulOverride: andOne ? 1 : 0, foulScene: true }, { timing: 1.1 });
    const { s, c, rng } = f, a = s.actors[s.handler], rimT = MOVES[a.move].rimFrame! / MOVES[a.move].fps;
    const events: EngineEvent[] = [];
    while (!s.glass && s.phase === 'ballflight') {
      expect(a.moveT).toBeLessThan(rimT + 1e-8);
      events.push(...step(s, 1 / 240, c, rng));
    }
    expect(s.glass).toEqual({ since: s.realTime });
    expect(a.moveT).toBeCloseTo(rimT, 2);
    expect(events.filter(e => e.type === 'glass')).toHaveLength(1);
    expect(s.points).toBe(0);
    while (!events.some(e => e.type === 'result')) events.push(...step(s, 1 / 240, c, rng));
    expect(s.points).toBe(2);
    expect(s.box[s.handler].pts).toBe(2);
    expect(s.freeThrows).toBeNull();
    const at = s.realTime, clock = s.clock, gameT = s.gameT;
    let appeared = false, swept = false, previous = 0;
    while (s.glass && s.realTime - at < 7) {
      events.push(...step(s, 1 / 240, c, rng));
      const mop = s.actors.mop;
      if (mop && !appeared) { expect(mop.pos).toEqual({ x: 7.2, z: 1 }); appeared = true; }
      if (mop?.move === 'mop_sweep') {
        swept = true;
        expect(Math.abs(mop.pos.x)).toBeLessThanOrEqual(.6);
        expect(mop.pos.z).toBe(.6);
      }
      expect(s.glassSweep).toBeGreaterThanOrEqual(previous);
      previous = s.glassSweep;
      command(s, { kind: 'comboStart' }, c, rng);
    }
    expect(appeared && swept).toBe(true);
    expect(s.realTime - at).toBeLessThan(7);
    expect(s.gameT).toBe(gameT);
    expect(s.clock).toBe(clock);
    expect(s.glassSweep).toBe(1);
    expect(s.glass).toBeNull();
    expect(s.actors.mop).toBeUndefined();
    expect(events.filter(e => e.type === 'glassFixed')).toHaveLength(1);
    expect(s.phase).toBe(andOne ? 'freethrows' : 'ended');
    if (andOne) { expect(s.freeThrows!.left).toBe(1); expect(s.actors.ref).toBeDefined(); }
  });

  it.each([false, true])('trifft die Glas-Chance bei perfektem Dunk mit/ohne Pfeil (%s)', finishArrow => {
    for (const glassChance of [0, 1]) {
      const f = shot({ ...base, finishArrow, glassChance });
      expect(f.kind).toBe('dunk');
      expect(settle(f).some(e => e.type === 'glass')).toBe(glassChance === 1);
      expect(f.s.points).toBe(2);
    }
  });
  it.each([false, true])('zerbricht auch Alley-oop- und Poster-Dunks (%s)', contact => {
    const f = shot({ ...base, forceGlass: true, forcePoster: true, posterVariant: 'classic' }, { lob: true, contact });
    expect(f.kind).toBe(contact ? 'contact_dunk' : 'dunk');
    expect(settle(f).some(e => e.type === 'glass')).toBe(true);
  });
  it.each([[.1, 'dunk'], [.5, 'tomahawk_dunk'], [.9, 'two_hand_dunk']] as const)('zerbricht bei Dunk-Würfel %s am Ringbild von %s', (roll, animation) => {
    const f = shot({ ...base, forceGlass: true }, { roll });
    expect(f.s.actors[f.s.handler].move).toBe(animation);
    expect(settle(f).filter(e => e.type === 'glass')).toHaveLength(1);
  });
  it('verwendet standardmäßig acht Prozent Glas-Chance und würfelt genau einmal', () => {
    for (const roll of [.0799, .08]) {
      const f = shot(base), before = f.rng.mock.calls.length;
      f.rng.mockReturnValue(roll);
      expect(settle(f).some(e => e.type === 'glass')).toBe(roll < .08);
      expect(f.rng.mock.calls.length - before).toBe(1);
    }
  });
  it('würfelt bei perfektem Poster Glas und Variante getrennt jeweils einmal', () => {
    const f = shot({ ...base, forcePoster: true }, { contact: true }), before = f.rng.mock.calls.length;
    settle(f);
    expect(f.rng.mock.calls.length - before).toBe(2);
    expect(f.s.poster!.variant).toBe('classic');
  });
  it('lässt beim Aufräumen den bereits gestarteten Poster-Abflug zu Ende landen', () => {
    const f = shot({ ...base, forceGlass: true, forcePoster: true, posterVariant: 'flyout' }, { contact: true });
    const events: EngineEvent[] = [];
    for (let i = 0; i < 2000 && !events.some(e => e.type === 'result'); i++) events.push(...step(f.s, 1 / 240, f.c, f.rng));
    expect(f.s.glass).not.toBeNull();
    const gameT = f.s.gameT;
    step(f.s, 1, f.c, f.rng);
    expect(f.s.gameT).toBe(gameT);
    expect(f.s.actors.b1.y).toBe(0);
    expect(Number.isFinite(f.s.poster!.startedAt)).toBe(true);
  });
  it.each([{ timing: 1.1 }, { timing: 2 }, { layup: true }, { jump: true }])('würfelt ohne perfekten getroffenen Dunk nicht zusätzlich: %j', options => {
    const zero = shot({ ...base, glassChance: 0 }, options), one = shot({ ...base, glassChance: 1 }, options);
    const beforeZero = zero.rng.mock.calls.length, beforeOne = one.rng.mock.calls.length;
    const a = settle(zero), b = settle(one);
    expect(a.some(e => e.type === 'glass')).toBe(false);
    expect(b.some(e => e.type === 'glass')).toBe(false);
    expect(one.rng.mock.calls.length).toBe(zero.rng.mock.calls.length);
    expect(zero.rng.mock.calls.length).toBe(beforeZero);
    expect(one.rng.mock.calls.length).toBe(beforeOne);
  });
  it.each([{ layup: true }, { jump: true }, { timing: 2 }])('erzwingt bei Korblegern, Sprungwürfen und Fehlwürfen kein Glas: %j', options => {
    expect(settle(shot({ ...base, forceGlass: true }, options)).some(e => e.type === 'glass')).toBe(false);
  });
});
