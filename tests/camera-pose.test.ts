import { describe, expect, it } from 'vitest';
import { cameraPose } from '../src/render/camera-pose';

const top = { x: 0, y: 0, z: 6.9 };
const corner = { x: -6.6, y: 0, z: 0.5 };

describe('Kamera-Pose', () => {
  it('steht tief hinter dem Top-Spot', () => {
    const pose = cameraPose('low', top, null);
    expect(pose.pos.z).toBeGreaterThan(top.z);
    // 5,2 m hinter dem Werfer auf der Achse Korb→Werfer
    expect(pose.pos.x).toBeCloseTo(0, 8);
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
    const off = { x: pose.pos.x - corner.x, z: pose.pos.z - corner.z };
    expect(Math.hypot(off.x, off.z)).toBeCloseTo(5.2, 8);
    expect(pose.pos.x / pose.pos.z).toBeCloseTo(corner.x / corner.z, 8);
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

import { playCameraPose } from '../src/render/camera-pose';

describe('Spielzug-Kamera', () => {
  const wing = { x: 4, z: 5 };
  const onAxis = (pose: { pos: { x: number; z: number } }, h: { x: number; z: number }) =>
    expect(pose.pos.x * h.z - pose.pos.z * h.x).toBeCloseTo(0, 6);

  it.each(['wide', 'aim'] as const)('steht bei %s auf der Achse Korb → Ballführer, hinter ihm', (view) => {
    const pose = playCameraPose(view, wing);
    onAxis(pose, wing);
    expect(Math.hypot(pose.pos.x, pose.pos.z)).toBeGreaterThan(Math.hypot(wing.x, wing.z));
  });

  it('ist bei wide erhöht mit 60° Sichtfeld, bei aim tief mit 50°', () => {
    const wide = playCameraPose('wide', wing);
    const aim = playCameraPose('aim', wing);
    expect(wide.fov).toBe(60);
    expect(aim.fov).toBe(50);
    expect(wide.pos.y).toBeGreaterThan(aim.pos.y + 2);
    expect(aim.pos.y).toBe(3);
  });

  it('nimmt direkt unter dem Korb die Mittelachse', () => {
    const pose = playCameraPose('aim', { x: 0, z: 0 });
    expect(pose.pos.x).toBeCloseTo(0, 6);
    expect(pose.pos.z).toBeGreaterThan(0);
    expect(Number.isFinite(pose.pos.z)).toBe(true);
  });
});
