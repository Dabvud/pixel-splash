import { DOC, MEDIC2 } from '../src/play/teams';
import { describe, expect, it } from 'vitest';
import { CELL_H, CELL_W, FEET_ROW, PX_PER_M, rasterPose } from '../src/figure/raster';
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

it('zeichnet den braunen Mopp nur bei mop:true, auch beim Laufen', () => {
  for (const id of ['idle', 'run', 'mop_sweep'] as const) for (const dir of ['front', 'back', 'left', 'right'] as const) {
    const p = project(moveFrames(id)[0], dir);
    const original = rasterPose(p, look, dir);
    expect(rasterPose(p, { ...look, mop: false }, dir)).toEqual(original);
    const withMop = rasterPose(p, { ...look, mop: true }, dir);
    expect(pixels(withMop, [155, 105, 55, 255]).length).toBeGreaterThan(5);
    expect(pixels(original, [155, 105, 55, 255])).toHaveLength(0);
    expect(pixels(withMop, [155, 160, 165, 255]).length).toBe(6);
  }
});

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
  it.each(['front', 'back'] as const)('zeichnet Nummern vollständig, mittig und innerhalb des Umrisses: %s', dir => {
    const digits: Record<string, string[]> = {
      0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'],
      2: ['111', '001', '111', '100', '111'], 3: ['111', '001', '111', '001', '111'],
      4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'],
      6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'],
      8: ['111', '101', '111', '101', '111'], 9: ['111', '101', '111', '001', '111'],
    };
    for (const num of Array.from({ length: 100 }, (_, i) => i)) {
      // Die Problemnummern zusätzlich bei allen Staturen, Größen und Subpixelpositionen.
      const regression = [0, 1, 11, 44, 50, 88, 99].includes(num);
      for (const build of (regression ? ['slim', 'normal', 'broad'] : ['normal']) as Look['build'][]) {
        for (const heightM of regression ? [1.85, 2.13] : [look.heightM]) {
          for (const offset of regression ? [-0.01, 0, 0.01] : [0]) {
            const p = project(idle, dir);
            for (const point of Object.values(p)) point.u += offset;
            const buf = rasterPose(p, { ...look, num, build, heightM }, dir);
            const scale = PX_PER_M * heightM;
            const shoulder = { u: (p.shL.u + p.shR.u) / 2, v: (p.shL.v + p.shR.v) / 2 };
            const cx = CELL_W / 2 + (shoulder.u * 0.55 + p.pelvis.u * 0.45) * scale;
            const cy = FEET_ROW - (shoulder.v * 0.55 + p.pelvis.v * 0.45) * scale;
            const str = String(num), width = str.length * 4 - 1;
            const x0 = Math.round(cx - (width - 1) / 2), y0 = Math.round(cy - 2);
            const expected: { x: number; y: number }[] = [];
            for (let y = 0; y < 5; y++) for (let i = 0; i < str.length; i++) {
              for (let x = 0; x < 3; x++) if (digits[str[i]][y][x] === '1') expected.push({ x: x0 + i * 4 + x, y: y0 + y });
            }
            expect(pixels(buf, [255, 255, 255, 255]), `${dir}, ${num}, ${build}, ${heightM}, ${offset}`).toEqual(expected);
            for (const { x, y } of expected) {
              expect(x).toBeGreaterThan(0);
              expect(x).toBeLessThan(CELL_W - 1);
              expect(y).toBeGreaterThan(0);
              expect(y).toBeLessThan(CELL_H - 1);
              for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
                const rgba = [...buf.slice(((y + dy) * CELL_W + x + dx) * 4, ((y + dy) * CELL_W + x + dx + 1) * 4)];
                expect(rgba).not.toEqual(outline);
                expect(rgba[3]).toBe(255);
              }
            }
          }
        }
      }
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

describe('Schiri-Trikot', () => {
  const ref: Look = { ...look, jersey: '#d9d9d9', stripes: '#1d1d22', num: -1 };
  it.each(['back', 'front', 'left', 'right'] as Dir[])('zeigt vertikale Streifen im Rumpf: %s', dir => {
    const buf = rasterPose(project(idle, dir), ref, dir);
    const grey = pixels(buf, [217, 217, 217, 255]), black = pixels(buf, [29, 29, 34, 255]);
    expect(grey.length).toBeGreaterThan(5);
    expect(black.length).toBeGreaterThan(5);
    // Streifen sind spaltenweise: jede Spalte trägt im Rumpf nur eine der beiden Farben
    const greyCols = new Set(grey.map(p => p.x)), blackCols = new Set(black.filter(p => p.y < 48).map(p => p.x));
    expect([...blackCols].some(x => greyCols.has(x))).toBe(false);
  });
});


describe('Sanitäter-Kittel', () => {
  it.each([DOC, MEDIC2])('$id zeichnet im weißen Kittel ein rotes Kreuz auch beim Tragen', medic => {
    for (const move of ['idle', 'carry'] as const) for (const pose of moveFrames(move)) {
      const image = rasterPose(project(pose, 'front'), medic, 'front');
      const red = pixels(image, [220, 32, 40, 255]);
      expect(red).toHaveLength(9);
      expect(new Set(red.map(p => p.x)).size).toBe(5);
      expect(new Set(red.map(p => p.y)).size).toBe(5);
      expect(pixels(image, [255, 255, 255, 255]).length).toBeGreaterThan(10);
    }
  });
});
