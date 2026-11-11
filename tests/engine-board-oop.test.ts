import { describe, expect, it } from 'vitest';
import { command, createPlayState, step } from '../src/play/engine';
import type { EngineConfig, EngineEvent, PlayState } from '../src/play/engine';
import type { Play } from '../src/play/types';

const cfg: EngineConfig = {
  slowmo: .3, decisionS: 2, animSpeed: 1, foulMult: 0, zoneFloor: .7, tempoSpread: 0,
  passDelayMax: .6, closeoutRandom: 0, glassChance: 0,
  shot: { meterMs: 700, greenZone: .07, aimDeg: 6, influence: .6 },
  finish: { meterMs: 450, greenZone: .1, aimDeg: 8 },
};
const safe = () => .99;
function fixture(catcher = 'r50'): Play {
  return {
    id: 'inbound', name: 'Brett-Oop', clockS: 30, deficit: 2, inboundBy: 'r3',
    actors: ['r3', catcher, 'b1'], start: 'setup',
    segments: {
      setup: { id: 'setup', handler: 'r3', decisionAt: 0, paths: {
        r3: [{ t: 0, x: -6, z: 5, act: 'stand' }],
        [catcher]: [{ t: 0, x: 0, z: .8, act: 'stand' }],
        b1: [{ t: 0, x: 7, z: 12, act: 'defend' }],
      }, options: [{ kind: 'pass', to: catcher, next: 'received', lob: true }] },
      received: { id: 'received', handler: catcher, decisionAt: 0, paths: {}, options: [{ kind: 'shoot' }] },
    }, variants: [{ id: 'fixed', weight: 1, defPaths: {} }],
  };
}
function lob(c: EngineConfig, rng: () => number, catcher = 'r50'): { s: PlayState; events: EngineEvent[]; maxBoard: number } {
  const s = createPlayState(fixture(catcher), c, rng);
  for (let i = 0; i < 4000 && s.phase !== 'decision'; i++) step(s, 1 / 240, c, rng);
  const events: EngineEvent[] = [];
  events.push(...(command(s, { kind: 'pass', to: catcher, quality: 1 }, c, rng) ?? []));
  let maxBoard = 0; // wie nah der Ball dem Brett (z = −0,4) über Ringhöhe kommt
  for (let i = 0; i < 4000 && s.phase === 'passing'; i++) {
    events.push(...step(s, 1 / 240, c, rng));
    if (s.ball.y > 3.1) maxBoard = Math.max(maxBoard, -s.ball.z);
  }
  return { s, events, maxBoard };
}

describe('Alley-oop vom Brett', () => {
  it('spielt den Lob bei freier Bahn und hohem Dunk-Wert erzwungen ans Brett und der Mitspieler fängt ihn', () => {
    const { s, events, maxBoard } = lob({ ...cfg, forceBoardOop: true }, safe);
    expect(events.some(e => e.type === 'boardOop')).toBe(true);
    expect(maxBoard).toBeGreaterThan(.3);
    expect(s.handler).toBe('r50');
    expect(s.phase).toBe('takeoff');
  });
  it('würfelt 10 %: rng unter 0,1 → vom Brett, darüber → normaler Lob', () => {
    expect(lob(cfg, () => .05).events.some(e => e.type === 'boardOop')).toBe(true);
    const normal = lob(cfg, () => .2);
    expect(normal.events.some(e => e.type === 'boardOop')).toBe(false);
    expect(normal.maxBoard).toBeLessThan(.1);
  });
  it('nicht bei niedrigem Dunk-Wert (Athletik < 0,8)', () => {
    expect(lob({ ...cfg, forceBoardOop: true }, safe, 'r32').events.some(e => e.type === 'boardOop')).toBe(false);
  });
});
