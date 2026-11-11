import { describe, expect, it } from 'vitest';
import { spriteJointWorld, spriteDir, frameAt } from '../src/render/actors';
import { project } from '../src/figure/skeleton';
import { moveFrames } from '../src/figure/moves';

describe('Gelenkposition im Sprite-Bild', () => {
  const base = { id: 'b1', x: 1, y: 0, z: 2, facing: 0.4, move: 'knocked_down' as const, moveT: 10, visible: true };

  it('liegt auf der Ebene des Sprites: Kopf aus der Bildprojektion, seitlich entlang der Kamera-Rechten', () => {
    const yaw = 0.3, h = 2;
    const p = spriteJointWorld(base, 'head', h, yaw);
    const dir = spriteDir(base.facing, yaw);
    const head = project(moveFrames('knocked_down')[frameAt('knocked_down', 10)], dir).head;
    expect(p.y).toBeCloseTo(head.v * h, 6);
    // Abstand vom Fußpunkt zeigt genau entlang der Kamera-Rechten (cos yaw, sin yaw)
    expect(p.x - base.x).toBeCloseTo(Math.cos(yaw) * head.u * h, 6);
    expect(p.z - base.z).toBeCloseTo(Math.sin(yaw) * head.u * h, 6);
  });

  it('liegender Kopf ist tief (unter 0,6 m)', () => {
    expect(spriteJointWorld(base, 'head', 2, 0.3).y).toBeLessThan(0.6);
  });

  it('folgt bei moveSide −1 in Seitenansicht dem Renderer: gespiegelte Gegenansicht', () => {
    const yaw = base.facing - Math.PI / 2; // Seitenansicht 'right'
    const v = { ...base, move: 'crossover' as const, moveT: 0.2, moveSide: -1 };
    const p = spriteJointWorld(v, 'haR', 2, yaw);
    const hand = project(moveFrames('crossover')[frameAt('crossover', 0.2)], 'left').haR;
    expect(p.x - v.x).toBeCloseTo(Math.cos(yaw) * -hand.u * 2, 6);
  });
});
