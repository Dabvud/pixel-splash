import { describe, expect, it } from 'vitest';
import { playCameraPose } from '../src/render/camera-pose';

describe('Korb-Achse nahe dem Ring', () => {
  it('bleibt bei wide auch unter 0,5 m Abstand auf der Ballführerachse', () => {
    const h = { x: -.2, z: .3 }, pose = playCameraPose('wide', h);
    expect(pose.pos.x * h.z - pose.pos.z * h.x).toBeCloseTo(0, 10);
    expect(pose.look.x * h.z - pose.look.z * h.x).toBeCloseTo(0, 10);
    expect(Math.hypot(pose.pos.x - h.x, pose.pos.z - h.z)).toBeCloseTo(7);
  });
  it.each([{ x: -.2, z: .3 }, { x: .49, z: 0 }, { x: 0, z: 0 }])(
    'nimmt bei aim unter 0,5 m die Mittelachse für %j', h => {
      const pose = playCameraPose('aim', h);
      expect(pose.pos.x).toBe(0);
      expect(pose.pos.z).toBeCloseTo(Math.hypot(h.x, h.z) + 7.5, 8);
      expect(pose.pos.y).toBeCloseTo(4.2, 8);
      expect(pose.look).toEqual({ x: 0, y: 2.6, z: 0 });
    },
  );
  it('verwendet bei aim ab 0,5 m die Ballführerachse', () => {
    const h = { x: -.3, z: .4 }, pose = playCameraPose('aim', h);
    expect(pose.pos.x * h.z - pose.pos.z * h.x).toBeCloseTo(0, 10);
    expect(Math.hypot(pose.pos.x - h.x, pose.pos.z - h.z)).toBeCloseTo(7.5, 8);
  });
});
