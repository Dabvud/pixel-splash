import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { CELL_W, FEET_ROW, PX_PER_M, rasterPose, type Look, type Projected } from '../src/figure/raster';
import { MOVES, moveFrames, type MoveId } from '../src/figure/moves';
import { project, type Dir } from '../src/figure/skeleton';
import { ACTORS, RED, BLUE } from '../src/play/teams';
// Die zehn Teamspieler (ohne Schiri)
const PLAYERS = [...RED, ...BLUE];
import legacy from './fixtures/legacy-raster.json';

const dirs: Dir[] = ['front', 'back', 'left', 'right'];
const look: Look = { heightM: 1.88, build: 'normal', skin: '#b77b53', hair: 'bald', jersey: '#c8322b', shorts: '#9e241f', num: 23 };
const idle = moveFrames('idle')[0];
const hairColor = [27, 20, 16, 255];
const rgba = (buf: Uint8ClampedArray, x: number, y: number) => {
  const i = (Math.round(y) * CELL_W + Math.round(x)) * 4;
  return [...buf.slice(i, i + 4)];
};
const xy = (point: { u: number; v: number }) => ({ x: CELL_W / 2 + point.u * PX_PER_M * look.heightM, y: FEET_ROW - point.v * PX_PER_M * look.heightM });
const image = (dir: Dir, features: Partial<Look> = {}, pose = project(idle, dir)) => rasterPose(pose, { ...look, ...features }, dir);

describe('Figuren-Baukasten: bisherige Pixel', () => {
  // Vor der Implementierung aus dem unveränderten Raster berechnet; Reihenfolge:
  // Alle bisherigen Moves bleiben im Hash; neue Mopp-/Bank-Moves haben eigene Tests.
  it.each(legacy)('bewahrt alle alten Bewegungsbilder für Nummer $look.num mit $look.hair pixelgleich', reference => {
    const original = reference.look as Look;
    const hash = createHash('sha256');
    let frames = 0;
    for (const move of (Object.keys(MOVES) as MoveId[]).filter(id => !['mop_sweep', 'sit', 'bench_cheer'].includes(id))) for (const pose of moveFrames(move)) for (const dir of dirs) {
      hash.update(rasterPose(project(pose, dir), original, dir));
      frames++;
    }
    expect(frames).toBe(reference.frames);
    expect(hash.digest('hex')).toBe(reference.sha256);
  });

  it.each(dirs)('zeichnet explizite Standardmerkmale wie fehlende Merkmale: %s', dir => {
    expect(image(dir, { beard: 'none', headband: null, armSleeve: 'none', shoes: '#222226', socks: 'low' })).toEqual(image(dir));
  });
});

describe('Bank und Arzt: Pixel und Posen', () => {
  it.each(dirs)('behält alle bisherigen Pixel bei deaktiviertem towel/cross: %s', dir => {
    for (const move of Object.keys(MOVES) as MoveId[]) for (const pose of moveFrames(move)) {
      const p = project(pose, dir);
      expect(rasterPose(p, { ...look, towel: false, cross: false }, dir)).toEqual(rasterPose(p, look, dir));
    }
  });
  it.each(dirs)('zeichnet genau ein weißes 3×4-Handtuch an der oberen Hand: %s', dir => {
    const p = project(moveFrames('bench_cheer')[0], dir), buf = image(dir, { towel: true }, p);
    const hand = xy(p.haL.v > p.haR.v ? p.haL : p.haR);
    for (let y = 0; y < 4; y++) for (let x = -1; x <= 1; x++) {
      expect(rgba(buf, Math.round(hand.x) + x, Math.round(hand.y) - 3 + y)).toEqual([255, 255, 255, 255]);
    }
    expect(buf).not.toEqual(image(dir, {}, p));
  });
  it('ersetzt die Brustnummer durch ein rotes Kreuz in einem 5×5-Feld', () => {
    const p = project(idle, 'front');
    const c = xy({ u: (p.shL.u + p.shR.u) / 2 * .55 + p.pelvis.u * .45,
      v: (p.shL.v + p.shR.v) / 2 * .55 + p.pelvis.v * .45 });
    const buf = image('front', { jersey: '#ffffff', num: -1, cross: true }, p);
    expect(buf).toEqual(image('front', { jersey: '#ffffff', num: 23, cross: true }, p));
    for (let y = -2; y <= 2; y++) for (let x = -2; x <= 2; x++) {
      if (x === 0 || y === 0) expect(rgba(buf, Math.round(c.x) + x, Math.round(c.y) + y)).toEqual([220, 32, 40, 255]);
    }
    expect(image('back', { cross: true, num: -1 })).toEqual(image('back', { num: -1 }));
  });
  it('sit hält Hände auf Kniehöhe und bench_cheer schwingt einen Arm über den Kopf; beide loopen', () => {
    for (const p of moveFrames('sit')) {
      expect(p.pelvis.y).toBeLessThan(.3);
      expect(Math.abs(p.haL.y - p.knL.y)).toBeLessThan(.07);
      expect(Math.abs(p.haR.y - p.knR.y)).toBeLessThan(.07);
    }
    expect(MOVES.sit.loop).toBe(true); expect(MOVES.bench_cheer.loop).toBe(true);
    for (const p of moveFrames('bench_cheer')) expect(p.haR.y).toBeGreaterThan(p.head.y);
    expect(moveFrames('bench_cheer')[0].haR).not.toEqual(moveFrames('bench_cheer')[3].haR);
  });
});

describe.each(dirs)('Figuren-Baukasten: Pixelproben %s', dir => {
  const p = project(idle, dir);
  const head = xy(p.head);
  const headPixel = (buf: Uint8ClampedArray, dx: number, dy: number) => rgba(buf, head.x + dx, head.y + dy);

  it.each(['stubble', 'full', 'goatee'] as const)('zeigt Bart %s nur vorne und seitlich am Kinn', beard => {
    const buf = image(dir, { beard });
    if (dir === 'back') expect(buf).toEqual(image(dir));
    else if (beard === 'stubble') expect(headPixel(buf, 0, 2)).toEqual([67, 47, 36, 255]);
    else {
      const facing = dir === 'right' ? 1 : dir === 'left' ? -1 : 0;
      expect(headPixel(buf, facing, 4)).toEqual(hairColor);
      expect(headPixel(image(dir), facing, 4)).not.toEqual(hairColor);
    }
  });

  it('unterscheidet Stoppeln, Vollbart und Kinnbart durch ihre Kinnpixel', () => {
    if (dir === 'back') {
      for (const beard of ['stubble', 'full', 'goatee'] as const) expect(image(dir, { beard })).toEqual(image(dir));
      return;
    }
    const dx = dir === 'left' ? -2 : 2;
    expect(headPixel(image(dir, { beard: 'full' }), dx, 2)).toEqual(hairColor);
    expect(headPixel(image(dir, { beard: 'goatee' }), dx, 2)).not.toEqual(hairColor);
    expect(image(dir, { beard: 'stubble' })).not.toEqual(image(dir, { beard: 'goatee' }));
  });

  it.each(['short', 'bald', 'afro', 'cornrows', 'dreads', 'flattop', 'buzz'] as const)('zeichnet das Stirnband bei Frisur %s rundum in Kopfhöhe', hair => {
    const buf = image(dir, { hair, headband: '#17e4c2' });
    for (const dx of [-2, 0, 2]) expect(headPixel(buf, dx, -1)).toEqual([23, 228, 194, 255]);
    expect(headPixel(buf, 0, 2)).not.toEqual([23, 228, 194, 255]);
  });

  it.each(['left', 'right'] as const)('zeichnet den Ärmel am anatomisch %s Arm und lässt Hand und anderen Arm frei', armSleeve => {
    // Getrennte Arme in jeder Projektion prüfen auch den sonst verdeckten Fernarm.
    const pose: Projected = { ...p };
    for (const [arm, u, depth] of [['L', -.32, -1], ['R', .32, 1]] as const) {
      pose[`sh${arm}`] = { u, v: .78, depth };
      pose[`el${arm}`] = { u, v: .65, depth };
      pose[`ha${arm}`] = { u, v: .45, depth };
    }
    const buf = image(dir, { armSleeve }, pose);
    const selected = armSleeve === 'left' ? 'L' : 'R';
    for (const arm of ['L', 'R'] as const) {
      const point = xy(pose[`el${arm}`]);
      const far = (dir === 'left' || dir === 'right') && arm === 'L';
      const base = arm === selected ? [200, 50, 43] : [183, 123, 83];
      expect(rgba(buf, point.x, point.y)).toEqual([...base.map(v => Math.round(v * (far ? .8 : 1))), 255]);
      const hand = xy(pose[`ha${arm}`]);
      expect(rgba(buf, hand.x, hand.y)).toEqual([...(far ? [146, 98, 66] : [183, 123, 83]), 255]);
    }
  });

  it('zeichnet die Schuhfarbe in den Fußzeilen mit Tiefenschattierung', () => {
    // Auch seitlich beide Füße sichtbar halten, damit die Fernfarbe messbar ist.
    const pose = { ...p, ftL: { ...p.ftL, u: -.22 }, ftR: { ...p.ftR, u: .22 } };
    const buf = image(dir, { shoes: '#f040c0' }, pose);
    const near = p.shL.depth + p.hipL.depth < p.shR.depth + p.hipR.depth ? 'R' : 'L';
    for (const leg of ['L', 'R'] as const) {
      const foot = xy(pose[`ft${leg}`]);
      const far = leg !== near && (dir === 'left' || dir === 'right');
      expect(foot.y).toBeGreaterThanOrEqual(60);
      expect(rgba(buf, foot.x + (dir === 'right' ? 1 : dir === 'left' ? -1 : 0), foot.y))
        .toEqual(far ? [192, 51, 154, 255] : [240, 64, 192, 255]);
    }
  });

  it('zeichnet hohe Socken höher am Unterschenkel als niedrige Socken', () => {
    const near = p.shL.depth + p.hipL.depth < p.shR.depth + p.hipR.depth ? 'R' : 'L';
    const kn = p[`kn${near}`], ft = p[`ft${near}`];
    const probe = xy({ u: (kn.u + ft.u) / 2, v: (kn.v + ft.v) / 2 });
    expect(rgba(image(dir, { socks: 'high' }), probe.x, probe.y)).toEqual([238, 238, 238, 255]);
    expect(rgba(image(dir, { socks: 'low' }), probe.x, probe.y)).toEqual([183, 123, 83, 255]);
  });

  it.each([
    ['cornrows', -1, -2, [86, 59, 43, 255]],
    ['dreads', dir === 'right' ? -3 : 3, 4, hairColor],
    ['flattop', 0, -4, hairColor],
    ['buzz', 0, -2, [63, 49, 40, 255]],
  ] as const)('zeichnet charakteristische Pixel der Frisur %s', (hair, dx, dy, color) => {
    expect(headPixel(image(dir, { hair }), dx, dy)).toEqual(color);
    expect(image(dir, { hair })).not.toEqual(image(dir, { hair: 'short' }));
  });
});

describe('Figuren-Baukasten: Platzhalter-Teams', () => {
  it('gibt allen zehn Spielern paarweise verschiedene Baukasten-Kombinationen', () => {
    const actors = PLAYERS;
    expect(actors).toHaveLength(10);
    const keys = actors.map(a => JSON.stringify([a.hair, a.beard ?? 'none', a.headband ?? null, a.armSleeve ?? 'none', a.shoes ?? '#222226', a.socks ?? 'low']));
    expect(new Set(keys).size).toBe(10);
    expect(ACTORS.r23.headband).toBeTruthy();
    expect(ACTORS.r50.beard).toBe('full');
    expect(ACTORS.r11.armSleeve).not.toBe('none');
    expect(actors.some(a => a.hair === 'cornrows')).toBe(true);
    expect(actors.some(a => a.hair === 'dreads')).toBe(true);
    expect(new Set(actors.map(a => a.hair))).toEqual(new Set(['short', 'bald', 'afro', 'cornrows', 'dreads', 'flattop', 'buzz']));
  });

  it.each(['front', 'back'] as Dir[])('liefert für alle zehn Spieler unterschiedliche idle-Pixelbilder: %s', dir => {
    const hashes = PLAYERS.map(a => createHash('sha256').update(rasterPose(project(idle, dir), a, dir)).digest('hex'));
    expect(new Set(hashes).size).toBe(10);
  });
});
