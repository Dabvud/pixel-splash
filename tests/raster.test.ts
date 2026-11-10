import { describe, expect, it } from 'vitest';
import { CELL_H, CELL_W, rasterPose } from '../src/figure/raster';
import type { Look } from '../src/figure/raster';
import { moveFrames } from '../src/figure/moves';
import { project } from '../src/figure/skeleton';
import type { Dir } from '../src/figure/skeleton';

const look: Look = { heightM: 1.88, build: 'normal', skin: '#b77b53', hair: 'short', jersey: '#c8322b', shorts: '#9e241f', num: 23 };
const idle = moveFrames('idle')[0];
const outline = [24, 16, 20, 255];
function pixels(buf: Uint8ClampedArray, color?: number[]): { x: number; y: number }[] {
  const result: { x: number; y: number }[] = [];
  for (let y = 0; y < CELL_H; y++) for (let x = 0; x < CELL_W; x++) {
    const rgba = [...buf.slice((y * CELL_W + x) * 4, (y * CELL_W + x + 1) * 4)];
    if (color ? rgba.every((v, i) => v === color[i]) : rgba[3] > 0) result.push({ x, y });
  }
  return result;
}

describe('32×64 Figurenraster mit Füßen in Zeile 62', () => {
  it('zeichnet den Kopf oberhalb des Rumpfs und Schuhe in Zeilen 60–63', () => {
    const buf = rasterPose(project(idle, 'back'), look, 'back');
    expect(buf).toHaveLength(32 * 64 * 4);
    const head = pixels(buf, [27, 20, 16, 255]), torso = pixels(buf, [200, 50, 43, 255]);
    expect(head.length).toBeGreaterThan(0);
    expect(torso.length).toBeGreaterThan(0);
    expect(Math.max(...head.map(p => p.y))).toBeLessThan(Math.min(...torso.map(p => p.y)));
    const feet = pixels(buf, [34, 34, 38, 255]);
    expect(feet.some(p => p.y >= 60 && p.y <= 63)).toBe(true);
  });
  it.each(['back', 'front', 'left', 'right'] as Dir[])('zeichnet weiße Nummernpixel am Rumpf nur bei Brust/Rücken: %s', dir => {
    const buf = rasterPose(project(idle, dir), look, dir);
    const whites = pixels(buf, [255, 255, 255, 255]);
    if (dir === 'left' || dir === 'right') expect(whites).toHaveLength(0);
    else {
      expect(whites.length).toBeGreaterThan(5);
      for (const p of whites) { expect(p.y).toBeGreaterThan(37); expect(p.y).toBeLessThan(48); }
    }
  });
  it.each(['back', 'front', 'left', 'right'] as Dir[])('umgibt jede gefüllte Fläche mit Umriss-Pixeln: %s', dir => {
    const buf = rasterPose(project(idle, dir), look, dir);
    const rgba = (x: number, y: number) => [...buf.slice((y * CELL_W + x) * 4, (y * CELL_W + x + 1) * 4)];
    expect(pixels(buf, outline).length).toBeGreaterThan(30);
    for (const p of pixels(buf)) {
      if (rgba(p.x, p.y).every((v, i) => v === outline[i])) continue;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        expect(p.x + dx).toBeGreaterThanOrEqual(0);
        expect(p.x + dx).toBeLessThan(CELL_W);
        expect(p.y + dy).toBeGreaterThanOrEqual(0);
        expect(p.y + dy).toBeLessThan(CELL_H);
        expect(rgba(p.x + dx, p.y + dy)[3]).toBe(255);
      }
    }
  });
  it('füllt bei 2,13 m mehr Zeilen als bei 1,88 m', () => {
    const rows = (heightM: number) => new Set(pixels(rasterPose(project(idle, 'back'), { ...look, heightM }, 'back')).map(p => p.y)).size;
    expect(rows(2.13)).toBeGreaterThan(rows(1.88));
  });
  it.each(['back', 'front', 'left', 'right'] as Dir[])('hält die liegende Pose auch bei 2,13 m vollständig in der Atlas-Zelle: %s', dir => {
    const p = project(moveFrames('knocked_down')[3], dir);
    const size = 2.13 * 16;
    // Einschließlich Kopf/Haaren, Schuhen und Umriss.
    for (const [joint, point] of Object.entries(p)) {
      const padding = joint === 'head' ? 5 : 3;
      const x = CELL_W / 2 + point.u * size;
      expect(x - padding).toBeGreaterThanOrEqual(0);
      expect(x + padding).toBeLessThan(CELL_W);
    }
    const image = rasterPose(p, { ...look, heightM: 2.13 }, dir);
    expect(pixels(image, [27, 20, 16, 255]).length).toBeGreaterThan(0);
  });
  it('zeichnet nach project die größere kameranahe Tiefe zuletzt', () => {
    const p = project(idle, 'right');
    // Überlagerte Arme mit verschiedenen Tiefen machen die Reihenfolge messbar.
    p.shL = { u: -.25, v: .8, depth: -1 }; p.elL = { u: -.25, v: .7, depth: -1 }; p.haL = { u: .3, v: .55, depth: -1 };
    p.shR = { u: .3, v: .8, depth: 1 }; p.elR = { u: .3, v: .7, depth: 1 }; p.haR = { u: -.25, v: .55, depth: 1 };
    const a = rasterPose(p, look, 'right');
    const b = rasterPose({ ...p, shL: { ...p.shL, depth: 1 }, hipL: { ...p.hipL, depth: 1 }, shR: { ...p.shR, depth: -1 }, hipR: { ...p.hipR, depth: -1 } }, look, 'right');
    expect(a).not.toEqual(b);
  });
});
