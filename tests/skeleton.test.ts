import { describe, expect, it } from 'vitest';
import { JOINTS, framesFromKeys, lerpPose, project } from '../src/figure/skeleton';
import type { Dir, Pose } from '../src/figure/skeleton';

function pose(offset: number): Pose {
  return Object.fromEntries(JOINTS.map((joint, i) => [joint, {
    x: i + offset, y: i * 2 + offset, z: i * 3 + offset,
  }])) as Pose;
}

describe('Skelett', () => {
  it('enthält genau die 15 benannten Gelenke', () => {
    expect(JOINTS).toEqual([
      'head', 'neck', 'shL', 'shR', 'elL', 'elR', 'haL', 'haR',
      'pelvis', 'hipL', 'hipR', 'knL', 'knR', 'ftL', 'ftR',
    ]);
  });

  it('interpoliert alle Gelenke linear und trifft beide Endposen exakt', () => {
    const a = pose(0);
    const b = pose(8);
    expect(lerpPose(a, b, 0)).toEqual(a);
    expect(lerpPose(a, b, 1)).toEqual(b);
    expect(lerpPose(a, b, 0.25)).toEqual(pose(2));
    expect(a).toEqual(pose(0));
    expect(b).toEqual(pose(8));
    expect(lerpPose(pose(0.7), pose(0.1), 0)).toEqual(pose(0.7));
    expect(lerpPose(pose(0.7), pose(0.1), 1)).toEqual(pose(0.1));
  });

  it('trifft gleichmäßig verteilte Schlüsselposen ohne Schleife exakt', () => {
    const keys = [pose(0), pose(4), pose(8)];
    const frames = framesFromKeys(keys, 5, false);
    expect(frames).toEqual([keys[0], pose(2), keys[1], pose(6), keys[2]]);
  });

  it('trifft Schlüsselposen in der Schleife und interpoliert zurück zum Anfang', () => {
    const keys = [pose(0), pose(4), pose(8), pose(12)];
    expect(framesFromKeys(keys, 8, true)).toEqual([
      keys[0], pose(2), keys[1], pose(6), keys[2], pose(10), keys[3], pose(6),
    ]);
  });

  it('beginnt auch bei nicht teilbarer Bildzahl mit der ersten Schlüsselpose', () => {
    const keys = [pose(0), pose(4), pose(8), pose(12)];
    expect(framesFromKeys(keys, 6, false)[0]).toEqual(keys[0]);
    expect(framesFromKeys(keys, 6, false)[5]).toEqual(keys[3]);
    expect(framesFromKeys([keys[0]], 2, true)).toEqual([keys[0], keys[0]]);
  });

  it.each<[Dir, number, number]>([
    ['front', -1, 3], ['back', 1, -3], ['left', -3, -1], ['right', 3, 1],
  ])('projiziert %s parallel mit v nach oben und korrekter Tiefe', (dir, u, depth) => {
    const p = pose(0);
    const projected = project(p, dir);
    expect(Object.keys(projected)).toEqual(JOINTS);
    for (const joint of JOINTS) {
      const i = JOINTS.indexOf(joint);
      expect(projected[joint].u).toBeCloseTo(i * u, 12);
      expect(projected[joint].v).toBe(p[joint].y);
      expect(projected[joint].depth).toBeCloseTo(i * depth, 12);
    }
  });
});
