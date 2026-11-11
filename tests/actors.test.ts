import { describe, expect, it } from 'vitest';
import { frameAt, spriteDir } from '../src/render/actors';
import { MOVES } from '../src/figure/moves';
import * as THREE from 'three';
import { createActors } from '../src/render/actors';

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

describe('Bahnseite des Dribbel-Moves', () => {
  it.each([[0, 'back'], [Math.PI / 2, 'left'], [-Math.PI / 2, 'right'], [Math.PI, 'front']] as const)(
    'spiegelt bei Facing %s zur Bahnseite und verwendet Ansicht %s mit passender Tiefe', (facing, expected) => {
      const scene = new THREE.Scene(), texture = new THREE.CanvasTexture(document.createElement('canvas'));
      let direction = '';
      const actors = createActors(scene, { texture, uv: (_id, _move, dir) => { direction = dir; return [.25, .5, .125, .25]; } }, ['r3']);
      actors.sync([{ id: 'r3', x: 0, y: 0, z: 0, facing, move: 'crossover', moveT: .2, visible: true, moveSide: -1 }], 0);
      expect(direction).toBe(expected);
      const sprite = scene.children.find((o): o is THREE.Sprite => o instanceof THREE.Sprite)!;
      expect(sprite.scale.x).toBeGreaterThan(0);
      expect(sprite.material.map!.repeat.x).toBe(-.125);
      expect(sprite.material.map!.offset.x).toBe(.375);
      actors.dispose(); texture.dispose();
    });
});
