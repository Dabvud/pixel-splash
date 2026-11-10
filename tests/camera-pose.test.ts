import { describe, expect, it } from 'vitest';
import { cameraPose } from '../src/render/camera-pose';

const top = { x: 0, y: 0, z: 6.9 };
const corner = { x: -6.6, y: 0, z: 0.5 };

describe('Kamera-Pose', () => {
  it('steht tief hinter dem Top-Spot', () => {
    const pose = cameraPose('low', top, null);
    expect(pose.pos.z).toBeGreaterThan(top.z);
    // 5,2 m hinter dem Werfer, 0,7 m nach rechts versetzt (über die Schulter)
    expect(pose.pos.x).toBeCloseTo(0.7, 8);
    expect(pose.pos.z).toBeCloseTo(12.1, 8);
    expect(pose.pos.y).toBe(3);
    expect(pose.look.x).toBe(0);
    expect(pose.look.y).toBeCloseTo(2.3, 8);
    expect(pose.look.z).toBe(0);
  });

  it('steht hinter der linken Ecke auf der Verlängerung zum Korb', () => {
    const pose = cameraPose('low', corner, null);
    expect(pose.pos.x).toBeLessThan(corner.x);
    expect(pose.pos.z).toBeGreaterThan(corner.z);
    const d = Math.hypot(corner.x, corner.z);
    const u = { x: corner.x / d, z: corner.z / d };
    const off = { x: pose.pos.x - corner.x, z: pose.pos.z - corner.z };
    expect(off.x * u.x + off.z * u.z).toBeCloseTo(5.2, 8);
    expect(off.x * u.z - off.z * u.x).toBeCloseTo(0.7, 8);
  });

  it.each([top, corner])('verwendet die erhöhte Position für %j', (shooter) => {
    const pose = cameraPose('high', shooter, null);
    expect(pose.pos.y).toBe(7);
    expect(Math.hypot(pose.pos.x - shooter.x, pose.pos.z - shooter.z)).toBeCloseTo(6.5, 8);
    expect(pose.look.y).toBe(1.2);
    expect(Math.hypot(pose.look.x, pose.look.z)).toBeCloseTo(1.5, 8);
    expect(pose.look.x / pose.look.z).toBeCloseTo(shooter.x / shooter.z, 8);
  });

  it.each([top, corner])('verwendet bei auto ohne Flug die tiefe Pose für %j', (shooter) => {
    expect(cameraPose('auto', shooter, null)).toEqual(cameraPose('low', shooter, null));
    expect(cameraPose('auto', shooter, 0)).toEqual(cameraPose('low', shooter, null));
  });

  it('hebt auto während des Flugs an und richtet sie auf den Ring', () => {
    const low = cameraPose('low', top, null);
    const middle = cameraPose('auto', top, 0.5);
    const end = cameraPose('auto', top, 1);
    expect(end.pos.y).toBeGreaterThan(low.pos.y);
    expect(end.pos).toEqual({ ...low.pos, y: 4.5 });
    expect(end.look).toEqual({ x: 0, y: 3.05, z: 0 });
    expect(middle.pos.y).toBeCloseTo(3.75, 8);
    expect(middle.look.y).toBeCloseTo((low.look.y + 3.05) / 2, 8);
    expect(cameraPose('auto', top, -1)).toEqual(low);
    expect(cameraPose('auto', top, 2)).toEqual(end);
  });

  it.each(['low', 'high'] as const)('ändert die feste Kamera %s während des Flugs nicht', (mode) => {
    expect(cameraPose(mode, top, 1)).toEqual(cameraPose(mode, top, null));
  });
});
