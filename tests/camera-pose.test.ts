import { describe, expect, it } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { cameraPose } from '../src/render/camera-pose';
import { RIM } from '../src/shot/trajectory';

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

  it.each([{ x: 0, z: 1.2 }, { x: .72, z: .96 }, { x: -1.2, z: 0 }])(
    'hält aim bei 1,2 m auf der Korbachse mit mindestens 7 m Abstand für %j', handler => {
      const pose = playCameraPose('aim', handler);
      onAxis(pose, handler);
      expect(Math.hypot(pose.pos.x - handler.x, pose.pos.z - handler.z)).toBeCloseTo(7.5, 8);
      expect(Math.hypot(pose.pos.x - handler.x, pose.pos.z - handler.z)).toBeGreaterThanOrEqual(7);
      expect(pose.pos.y).toBeCloseTo(4.2, 8);
      expect(pose.look).toEqual({ x: RIM.x, y: 2.6, z: RIM.z });
    },
  );

  it.each([3, 3.25, 3.5, 3.75, 4, 5])('blendet aim bei %s m linear zur bisherigen Pose über', d => {
    const handler = { x: d * .6, z: d * .8 };
    const pose = playCameraPose('aim', handler), t = Math.min(1, d - 3);
    onAxis(pose, handler);
    expect(pose.pos.x).toBeCloseTo(.6 * (d + 7.5 + (5.2 - 7.5) * t), 8);
    expect(pose.pos.z).toBeCloseTo(.8 * (d + 7.5 + (5.2 - 7.5) * t), 8);
    expect(pose.pos.y).toBeCloseTo(4.2 + (3 - 4.2) * t, 8);
    expect(pose.look.y).toBeCloseTo(2.6 + (RIM.y - .75 - 2.6) * t, 8);
    expect(pose.fov).toBe(50);
  });

  it.each([top, wing, corner])('zeigt wide im Hochformat mit Ballführer im unteren Drittel und Korb im Bild für %j', handler => {
    const pose = playCameraPose('wide', handler);
    const camera = new PerspectiveCamera(pose.fov, 390 / 844, .1, 100);
    camera.position.set(pose.pos.x, pose.pos.y, pose.pos.z);
    camera.lookAt(pose.look.x, pose.look.y, pose.look.z);
    camera.updateMatrixWorld(true);
    const feet = new Vector3(handler.x, 0, handler.z).project(camera);
    const center = new Vector3(handler.x, 1, handler.z).project(camera);
    const head = new Vector3(handler.x, 2.2, handler.z).project(camera);
    const rim = new Vector3(RIM.x, RIM.y, RIM.z).project(camera);
    expect(pose.fov).toBe(60);
    for (const point of [feet, center, head, rim]) {
      for (const coordinate of [point.x, point.y, point.z]) {
        expect(coordinate).toBeGreaterThanOrEqual(-1);
        expect(coordinate).toBeLessThanOrEqual(1);
      }
    }
    // NDC-y -1/3 entspricht 2/3 der Bildhöhe von oben.
    expect(center.y).toBeLessThanOrEqual(-1 / 3);
  });
});

import { finishCameraPose } from '../src/render/camera-pose';

describe('Seitenkamera für Korbleger und Dunk', () => {
  it.each([{ x: 0, z: 1.2 }, { x: 1, z: 0.8 }, { x: -1, z: 0.8 }, { x: 0, z: 0.1 }])('zeigt den Abschluss von %j aus im Profil und nie von hinter dem Brett', (h) => {
    const pose = finishCameraPose(h);
    const camAngle = Math.atan2(pose.pos.x, pose.pos.z) * 180 / Math.PI;
    const axis = Math.hypot(h.x, h.z) > 0.5 ? Math.atan2(h.x, h.z) * 180 / Math.PI : 0;
    expect(Math.abs(camAngle - axis)).toBeGreaterThanOrEqual(40);
    expect(Math.abs(camAngle)).toBeLessThanOrEqual(70.001);
    expect(pose.pos.z).toBeGreaterThan(1);
    expect(Math.hypot(pose.pos.x, pose.pos.z)).toBeCloseTo(7.5, 5);
    expect(pose.look).toEqual({ x: 0, y: 2.7, z: 0 });
    expect(pose.fov).toBe(50);
  });
});
