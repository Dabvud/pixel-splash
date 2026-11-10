import { describe, expect, it } from 'vitest';
import { frameAt, spriteDir } from '../src/render/actors';
import { MOVES } from '../src/figure/moves';

describe('spriteDir', () => {
  it.each([0, .7, -1.2, Math.PI, 7])('bestimmt alle Bildrichtungen bei Kamera-Yaw %s', yaw => {
    expect(spriteDir(yaw, yaw)).toBe('back');
    expect(spriteDir(yaw + Math.PI, yaw)).toBe('front');
    expect(spriteDir(yaw + Math.PI / 2, yaw)).toBe('right');
    expect(spriteDir(yaw - Math.PI / 2, yaw)).toBe('left');
    expect(spriteDir(yaw + 2 * Math.PI, yaw)).toBe('back');
  });
});

describe('frameAt', () => {
  it('wickelt Loop-Bewegungen nach der Bildanzahl um', () => {
    expect(frameAt('run', 0)).toBe(0);
    expect(frameAt('run', 7 / 12)).toBe(7);
    expect(frameAt('run', 8 / 12)).toBe(0);
    expect(frameAt('run', 10 / 12)).toBe(2);
  });
  it('hält nicht-loopende Bewegungen im letzten Bild und begrenzt negative Zeit', () => {
    expect(frameAt('dunk', 100)).toBe(MOVES.dunk.frames - 1);
    expect(frameAt('catch', -.5)).toBe(0);
    expect(frameAt('catch', .2)).toBe(2);
  });
});
