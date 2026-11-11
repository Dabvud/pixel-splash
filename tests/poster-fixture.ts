import { expect } from 'vitest';
import { command, createPlayState, step, type EngineConfig, type PlayState } from '../src/play/engine';
import type { Play } from '../src/play/types';

export const posterConfig: EngineConfig = {
  forcePoster: true, foulScene: true, slowmo: .3, decisionS: 2, animSpeed: 1,
  foulMult: 0, zoneFloor: .7, tempoSpread: 0,
  shot: { meterMs: 700, greenZone: .07, aimDeg: 6, influence: .6 },
  finish: { meterMs: 900, greenZone: .18, aimDeg: 8 },
};
const play: Play = {
  id: 'fastbreak', name: 'Poster', clockS: 30, deficit: 2, start: 'setup', actors: ['r23', 'r11', 'b1'],
  segments: { setup: { id: 'setup', handler: 'r23', decisionAt: 0,
    paths: { r23: [{ t: 0, x: 0, z: 3, act: 'dribble' }], r11: [{ t: 0, x: 4, z: 5, act: 'stand' }] },
    options: [{ kind: 'drive' }] } },
  variants: [{ id: 'fixed', weight: 1, defPaths: { setup: { b1: [{ t: 0, x: 0, z: 1.2, act: 'defend' }] } } }],
};
export function posterShot(c: EngineConfig, made = true): PlayState {
  const rng = () => .1, s = createPlayState(play, c, rng);
  step(s, .8, c, rng);
  command(s, { kind: 'drive', lane: 0 }, c, rng);
  for (let i = 0; i < 1000 && !s.combo; i++) step(s, 1 / 240, c, rng);
  expect(s.combo!.kind).toBe('contact_dunk');
  command(s, { kind: 'comboRelease', holdMs: made ? s.combo!.meterMs : 0, angleDeg: 0 }, c, rng);
  return s;
}
