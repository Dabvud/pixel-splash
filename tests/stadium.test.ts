import { describe, expect, it } from 'vitest';
import { Box3, Matrix4, Vector3 } from 'three';
import { cameraPose, finishCameraPose, overviewPose, playCameraPose } from '../src/render/camera-pose';
import { buildStadiumSolids, stadiumLayout } from '../src/render/stadium';

const bounds = (center: readonly number[], size: readonly number[]) => new Box3().setFromCenterAndSize(
  new Vector3(...center), new Vector3(...size),
);

describe('Arena-Tribünen und Kamerafreiraum', () => {
  it('baut gestufte Unter-/Oberränge auf drei Seiten mit freien Treppen und einem Umlauf', () => {
    const { boxes, seats } = stadiumLayout();
    for (const side of ['baseline', 'left', 'right']) {
      const tiers = boxes.filter(b => b.kind === 'tier' && b.side === side);
      expect(new Set(tiers.map(b => b.center[1] + b.size[1] / 2)).size).toBe(12);
      expect(boxes.some(b => b.kind === 'stair' && b.side === side)).toBe(true);
      expect(boxes.some(b => b.kind === 'rail' && b.side === side)).toBe(true);
      expect(boxes.some(b => b.kind === 'concourse' && b.side === side)).toBe(true);
      const stairs = boxes.filter(b => b.kind === 'stair' && b.side === side);
      const along = (b: typeof stairs[number]) => b.center[side === 'baseline' ? 0 : 2];
      for (const aisle of new Set(stairs.map(along))) {
        const treads = stairs.filter(b => along(b) === aisle)
          .sort((a, b) => Math.abs(a.center[side === 'baseline' ? 2 : 0]) - Math.abs(b.center[side === 'baseline' ? 2 : 0]));
        for (let i = 1; i < treads.length; i++) {
          const rise = treads[i].size[1] - treads[i - 1].size[1];
          expect(rise).toBeGreaterThanOrEqual(-1e-9);
          expect(rise).toBeLessThanOrEqual(.3 + 1e-9);
        }
      }
    }
    const aisles = boxes.filter(b => b.kind === 'stair' || b.kind === 'concourse');
    for (const seat of seats) {
      const body = new Box3().setFromCenterAndSize(new Vector3(seat.x, seat.y + .5, seat.z), new Vector3(.45, .8, .45));
      expect(aisles.some(b => body.intersectsBox(bounds(b.center, b.size)))).toBe(false);
    }
  });

  it('hält Tribünen vollständig außerhalb des Felds samt 2 m Rand und den Würfel über dem Kamera-Luftraum', () => {
    const { boxes } = stadiumLayout();
    const floorAndCameraSpace = new Box3(new Vector3(-9.5, -.1, -3.575), new Vector3(9.5, 8.5, 14.425));
    for (const box of boxes) {
      expect(bounds(box.center, box.size).intersectsBox(floorAndCameraSpace), box.kind).toBe(false);
      if (['tier', 'stair', 'concourse', 'rail', 'shell'].includes(box.kind)) {
        const footprint = bounds(box.center, box.size);
        footprint.min.y = -.1; footprint.max.y = 100;
        expect(footprint.intersectsBox(floorAndCameraSpace), box.kind).toBe(false);
      }
    }
    const cube = boxes.find(b => b.kind === 'jumbotron')!;
    expect(cube.center[2]).toBe(12.425);
    expect(cube.center[1] - cube.size[1] / 2).toBeGreaterThan(8.5);
  });

  it('prüft die tatsächlichen instanzierten Boxen gegen Kameraposen und die 12-m-Kamerahülle', () => {
    const { boxes } = stadiumLayout();
    const solids = buildStadiumSolids(boxes);
    const positions = [];
    for (const x of [-6.9, -4, 0, 4, 6.9]) for (const z of [.1, 2.6, 5, 6.9]) {
      const p = { x, y: 0, z };
      positions.push(cameraPose('low', p, null).pos, cameraPose('high', p, null).pos,
        playCameraPose('aim', p).pos, playCameraPose('wide', p).pos, finishCameraPose(p).pos,
        overviewPose(p, [{ x: -6.9, z: .5 }, { x: 6.9, z: .5 }], 390 / 844).pos);
    }
    for (let angle = -90; angle <= 90; angle += 5) for (const y of [3, 4.5, 7, 8]) {
      positions.push({ x: 12 * Math.sin(angle * Math.PI / 180), y, z: 12 * Math.cos(angle * Math.PI / 180) });
    }
    const matrix = new Matrix4();
    for (let i = 0; i < solids.count; i++) {
      solids.getMatrixAt(i, matrix);
      const actual = new Box3(new Vector3(-.5, -.5, -.5), new Vector3(.5, .5, .5)).applyMatrix4(matrix);
      for (const p of positions) {
        const camera = new Box3().setFromCenterAndSize(new Vector3(p.x, p.y, p.z), new Vector3(.5, .5, .5));
        expect(actual.intersectsBox(camera), `${boxes[i].kind} at camera ${JSON.stringify(p)}`).toBe(false);
      }
    }
    solids.geometry.dispose(); solids.material.dispose();
  });
});
