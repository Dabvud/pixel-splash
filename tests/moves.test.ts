import { describe, expect, it } from 'vitest';
import { MOVES, ballHandAt, moveFrames } from '../src/figure/moves';
import type { MoveId } from '../src/figure/moves';
import { JOINTS, framesFromKeys } from '../src/figure/skeleton';
import type { Joint, Pose } from '../src/figure/skeleton';

const counts: Record<MoveId, number> = {
  idle: 2, run: 8, dribble: 6, dribble_run: 8, pass: 6, catch: 4,
  jumpshot: 6, layup: 8, dunk: 8, contact_dunk: 8, defend: 6,
  block_jump: 6, contact: 4,
};
const ids = Object.keys(counts) as MoveId[];
const bones: [Joint, Joint][] = [
  ['shL', 'elL'], ['shR', 'elR'], ['elL', 'haL'], ['elR', 'haR'],
  ['hipL', 'knL'], ['hipR', 'knR'], ['knL', 'ftL'], ['knR', 'ftR'],
];
const distance = (p: Pose, a: Joint, b: Joint) => Math.hypot(
  p[a].x - p[b].x, p[a].y - p[b].y, p[a].z - p[b].z,
);

describe('Bewegungen', () => {
  it('enthält genau die Bewegungen der Spec', () => {
    expect(Object.keys(MOVES).sort()).toEqual([...ids].sort());
  });

  it.each(ids)('%s hat die vorgegebene Bildzahl, Bildrate und 2–4 Schlüsselposen', (id) => {
    const move = MOVES[id];
    expect(move.frames).toBe(counts[id]);
    expect(move.fps).toBe(id === 'run' || id === 'dribble_run' ? 12 : 10);
    expect(move.keys.length).toBeGreaterThanOrEqual(2);
    expect(move.keys.length).toBeLessThanOrEqual(4);
    expect(move.loop).toBe(['idle', 'run', 'dribble', 'dribble_run', 'defend'].includes(id));
    expect(moveFrames(id)).toEqual(framesFromKeys(move.keys, move.frames, move.loop));
    expect(moveFrames(id)).toHaveLength(counts[id]);
    expect(moveFrames(id)[0]).toEqual(move.keys[0]);
  });

  it.each(ids)('%s hält alle acht Gliedmaßenlängen in jedem Bild innerhalb ±5 % der Ruhepose', (id) => {
    const rest = moveFrames('idle')[0];
    for (const p of moveFrames(id)) {
      for (const [a, b] of bones) {
        const ratio = distance(p, a, b) / distance(rest, a, b);
        expect(ratio, `${id}: ${a}–${b}`).toBeGreaterThanOrEqual(0.95 - 1e-10);
        expect(ratio, `${id}: ${a}–${b}`).toBeLessThanOrEqual(1.05 + 1e-10);
      }
    }
  });

  it.each(ids)('%s hat den Kopf oben, mit Ausnahme der angehobenen Hände beim Abschluss oder Block', (id) => {
    // Korbleger und Kontakt-Dunk verlangen laut Spec ebenfalls Arme über dem Kopf.
    const overhead = ['jumpshot', 'layup', 'dunk', 'contact_dunk', 'block_jump'].includes(id);
    const hands: Joint[] = ['haL', 'haR'];
    for (const p of moveFrames(id)) {
      for (const joint of JOINTS) {
        if (overhead && hands.includes(joint)) continue;
        expect(p[joint].y, `${id}: ${joint}`).toBeLessThanOrEqual(p.head.y + 1e-10);
      }
    }
  });

  it.each(ids)('%s beugt Ellbogen nach vorne und Knie nach hinten und hält die Füße über dem Boden', (id) => {
    const bend = (p: Pose, a: Joint, b: Joint, c: Joint) =>
      (p[b].z - p[a].z) * (p[c].y - p[b].y) - (p[b].y - p[a].y) * (p[c].z - p[b].z);
    for (const p of moveFrames(id)) {
      expect(bend(p, 'shL', 'elL', 'haL')).toBeGreaterThanOrEqual(-1e-10);
      expect(bend(p, 'shR', 'elR', 'haR')).toBeGreaterThanOrEqual(-1e-10);
      expect(bend(p, 'hipL', 'knL', 'ftL')).toBeLessThanOrEqual(1e-10);
      expect(bend(p, 'hipR', 'knR', 'ftR')).toBeLessThanOrEqual(1e-10);
      expect(p.ftL.y).toBeGreaterThanOrEqual(-1e-10);
      expect(p.ftR.y).toBeGreaterThanOrEqual(-1e-10);
    }
  });

  it.each(ids)('%s liefert für jedes Bild genau das Gelenk der Ballhand oder null', (id) => {
    moveFrames(id).forEach((p, frame) => {
      const hand = MOVES[id].ballHand;
      expect(ballHandAt(id, frame)).toEqual(hand === null ? null : p[hand]);
    });
  });

  it.each(['layup', 'dunk', 'contact_dunk'] as const)('%s benennt das Ring- bzw. Loslassbild mit hochgestreckter Ballhand', (id) => {
    const { rimFrame } = MOVES[id];
    expect(rimFrame).toBeDefined();
    expect(Number.isInteger(rimFrame)).toBe(true);
    expect(rimFrame!).toBeGreaterThanOrEqual(0);
    expect(rimFrame!).toBeLessThan(counts[id]);
    expect(ballHandAt(id, rimFrame!)!.y).toBeGreaterThan(1.2);
  });

  it.each(['dribble', 'dribble_run'] as const)('%s führt die Ballhand tief und bewegt sie im Dribbeltakt', (id) => {
    const heights = moveFrames(id).map((_, i) => ballHandAt(id, i)!.y);
    expect(Math.max(...heights)).toBeLessThan(0.65);
    expect(Math.max(...heights) - Math.min(...heights)).toBeGreaterThan(0.04);
  });

  it.each(['run', 'dribble_run'] as const)('%s setzt abwechselnd beide Füße auf', (id) => {
    const frames = moveFrames(id);
    expect(frames[0].ftL.y).toBeCloseTo(0, 8);
    expect(frames[4].ftR.y).toBeCloseTo(0, 8);
    expect(frames[0].ftR.y).toBeGreaterThan(0.05);
    expect(frames[4].ftL.y).toBeGreaterThan(0.05);
  });

  it('zeigt beim Korbleger zwei Schritte, Absprung vom linken Bein und rechten Kniehub', () => {
    const frames = moveFrames('layup');
    expect(frames[0].ftR.z).toBeGreaterThan(frames[0].ftL.z);
    expect(frames[2].ftL.z).toBeGreaterThan(frames[2].ftR.z);
    const release = frames[MOVES.layup.rimFrame!];
    expect(Math.min(release.ftL.y, release.ftR.y)).toBeGreaterThan(0.05);
    expect(release.knR.y).toBeGreaterThan(release.knL.y + 0.04);
    expect(release.haR.y).toBeGreaterThan(release.head.y);
  });

  it.each(['dunk', 'contact_dunk'] as const)('%s zeigt Absprung und Hängen am Ring', (id) => {
    const frames = moveFrames(id);
    const rim = MOVES[id].rimFrame!;
    const contact = frames[rim];
    const hang = frames[frames.length - 1];
    expect(contact.pelvis.y).toBeGreaterThan(frames[0].pelvis.y + 0.2);
    expect(hang.pelvis.y).toBeLessThan(contact.pelvis.y);
    expect(Math.min(hang.ftL.y, hang.ftR.y)).toBeGreaterThan(0.05);
    expect(hang.haR.y).toBeCloseTo(contact.haR.y, 2);
    expect(hang.haR.z).toBeCloseTo(contact.haR.z, 2);
    expect(hang.haR.x).toBeCloseTo(contact.haR.x, 2);
  });

  it('verteidigt breit und tief mit seitlicher Gewichtsverlagerung', () => {
    const frames = moveFrames('defend');
    for (const p of frames) {
      expect(p.pelvis.y).toBeLessThan(0.4);
      expect(p.ftR.x - p.ftL.x).toBeGreaterThan(0.5);
    }
    expect(Math.max(...frames.map(p => p.pelvis.x)) - Math.min(...frames.map(p => p.pelvis.x)))
      .toBeGreaterThan(0.05);
  });
});
