import { describe, expect, it } from 'vitest';
import { ACTORS, BLUE, RED } from '../src/play/teams';
import { PLAYS } from '../src/play/plays';
import { positionValue } from '../src/play/position';
import type { Vec2 } from '../src/play/position';
import type { Play, Waypoint } from '../src/play/types';

function at(path: Waypoint[], t: number): Vec2 {
  const b = path.findIndex(p => p.t > t);
  if (b < 0) return path[path.length - 1];
  if (b === 0) return path[0];
  const a = path[b - 1], end = path[b], f = (t - a.t) / (end.t - a.t);
  return { x: a.x + (end.x - a.x) * f, z: a.z + (end.z - a.z) * f };
}

function travelled(path: Waypoint[], start: number, end: number): number {
  const points = [at(path, start), ...path.filter(p => p.t > start && p.t < end), at(path, end)];
  return points.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - points[i].x, p.z - points[i].z), 0);
}

const FREE: Record<string, Record<string, string>> = {
  pnr: { under: 'shoot', hedge: 'r50', switch: 'drive', corner_help: 'r11' },
  fastbreak: { staggered: 'r11', split: 'drive', stop_ball: 'r23' },
  kickout: { help: 'r11', stay: 'drive', fast_closeout: 'r3' },
  inbound: { switch: 'r50', stuck: 'r11', double: 'r23' },
};

describe('Platzhalter-Teams', () => {
  it('enthält die vorgegebenen Nummern, Größen und roten Werte', () => {
    expect(RED.map(a => [a.id, a.num, a.heightM, a.shot, a.athleticism])).toEqual([
      ['r3', 3, 1.88, .7, .6], ['r11', 11, 1.96, .9, .4], ['r23', 23, 2.03, .6, .9],
      ['r32', 32, 2.06, .5, .6], ['r50', 50, 2.13, .2, .8],
    ]);
    expect(BLUE.map(a => [a.num, a.heightM])).toEqual([[1, 1.85], [7, 1.98], [15, 2.01], [21, 2.06], [44, 2.11]]);
    expect(new Set(BLUE.map(a => a.skin)).size).toBeGreaterThan(1);
    expect(new Set(BLUE.map(a => a.hair)).size).toBeGreaterThan(1);
  });
});

describe.each(Object.values(PLAYS))('$name Daten', (play: Play) => {
  it('referenziert gültige Figuren, Segmente und positive Gewichte', () => {
    expect(play.segments[play.start]).toBeDefined();
    expect(play.clockS).toBe(play.id === 'fastbreak' ? 6 : play.id === 'inbound' ? 3 : 8);
    for (const id of play.actors) expect(ACTORS[id]).toBeDefined();
    for (const seg of Object.values(play.segments)) {
      expect(play.actors).toContain(seg.handler);
      expect(seg.decisionAt).toBeTypeOf('number');
      for (const opt of seg.options ?? []) if (opt.kind === 'pass') {
        expect(play.actors).toContain(opt.to);
        expect(opt.next).toBeDefined();
        const next = play.segments[opt.next!];
        expect(next.handler).toBe(opt.to);
        expect(next.options?.map(o => o.kind)).toEqual(expect.arrayContaining(['shoot', 'drive']));
      }
    }
    for (const v of play.variants) expect(v.weight).toBeGreaterThan(0);
  });

  it('hält Feldgrenzen, streng steigende Zeiten und maximal 8 m/s ein', () => {
    const paths = Object.values(play.segments).map(seg => seg.paths)
      .concat(play.variants.flatMap(v => Object.values(v.defPaths)));
    for (const group of paths) for (const [id, path] of Object.entries(group)) {
      expect(play.actors).toContain(id);
      expect(path.length).toBeGreaterThan(0);
      for (const [i, p] of path.entries()) {
        expect(Math.abs(p.x)).toBeLessThanOrEqual(id === play.inboundBy ? 9 : 7.5);
        expect(p.z).toBeGreaterThanOrEqual(-1.575);
        expect(p.z).toBeLessThanOrEqual(12.425);
        if (i) {
          const a = path[i - 1];
          expect(p.t).toBeGreaterThan(a.t);
          expect(Math.hypot(p.x - a.x, p.z - a.z) / (p.t - a.t)).toBeLessThanOrEqual(8);
        }
      }
    }
  });

  it('macht je Variante die vorgesehene Option frei und mindestens eine andere gedeckt', () => {
    const seg = play.segments[play.start], t = seg.decisionAt!;
    for (const v of play.variants) {
      const defenders = Object.values(v.defPaths[seg.id]).map(p => at(p, t));
      const values = (seg.options ?? []).map(o => {
        const pos = o.kind === 'pass' ? at(seg.paths[o.to!], t + 1)
          : o.kind === 'drive' ? { x: 0, z: 1.2 } : at(seg.paths[seg.handler], t);
        return { id: o.to ?? o.kind, P: positionValue(pos, defenders) };
      });
      expect(values.find(o => o.id === FREE[play.id][v.id])!.P).toBeGreaterThanOrEqual(.7);
      expect(values.some(o => o.id !== FREE[play.id][v.id] && o.P <= .5)).toBe(true);
      expect(values.filter(o => o.id !== FREE[play.id][v.id]).every(o => o.P <= .5)).toBe(true);
    }
  });

  it('hält die freie und alle gedeckten Optionen auch zur Fenstermitte unterscheidbar', () => {
    const seg = play.segments[play.start], t = seg.decisionAt! - 1.25;
    for (const v of play.variants) {
      const defenders = Object.values(v.defPaths[seg.id]).map(path => at(path, t));
      for (const o of seg.options!) {
        const pos = o.kind === 'pass' ? at(seg.paths[o.to!], t + 1)
          : o.kind === 'drive' ? { x: 0, z: 1.2 } : at(seg.paths[seg.handler], t);
        const P = positionValue(pos, defenders);
        if ((o.to ?? o.kind) === FREE[play.id][v.id]) expect(P).toBeGreaterThanOrEqual(.7);
        else expect(P).toBeLessThanOrEqual(.5);
      }
    }
  });

  it('bewegt je Variante den Ballführer mindestens 3 m und mindestens drei weitere Akteure über 1 m', () => {
    for (const v of play.variants) for (const seg of Object.values(play.segments)) {
      const end = seg.decisionAt!, start = Math.max(0, end - 2.5);
      expect(end - start).toBeGreaterThanOrEqual(seg.id === play.start ? 2.5 : 1.5);
      const paths = { ...seg.paths, ...v.defPaths[seg.id] };
      expect(travelled(paths[seg.handler], start, end)).toBeGreaterThanOrEqual(3);
      expect(play.actors.filter(id => {
        if (id === seg.handler) return false;
        const a = at(paths[id], start), b = at(paths[id], end);
        return Math.hypot(b.x - a.x, b.z - a.z) > 1;
      }).length).toBeGreaterThanOrEqual(3);
      for (const id of play.actors) {
        const path = paths[id];
        expect(path.at(-1)!.t).toBeGreaterThanOrEqual(end);
        for (let t = start; t < end - .01; t += .1) {
          const speed = travelled(path, t, Math.min(t + .1, end)) / Math.min(.1, end - t);
          expect(speed).toBeGreaterThanOrEqual(id === seg.handler ? 2 - 1e-8 : .1);
        }
      }
    }
  });
});

it('Fast Break nutzt genau drei Angreifer und zwei Verteidiger', () => {
  expect(PLAYS.fastbreak.actors.filter(id => ACTORS[id].team === 'off')).toHaveLength(3);
  expect(PLAYS.fastbreak.actors.filter(id => ACTORS[id].team === 'def')).toHaveLength(2);
});

it('Inbound steht außen, hat einen Lob und einen positiven Rückstandsbereich', () => {
  const p = PLAYS.inbound, seg = p.segments[p.start];
  expect(Math.abs(seg.paths[p.inboundBy!][0].x)).toBeGreaterThan(7.5);
  expect(seg.options).toContainEqual(expect.objectContaining({ to: 'r50', lob: true }));
  expect(p.deficit).toEqual([1, 3]);
});

it('Kick-out stellt an beiden Empfängern einen Closeout dar', () => {
  const p = PLAYS.kickout, v = p.variants.find(v => v.id === 'fast_closeout')!;
  for (const opt of p.segments[p.start].options!.filter(o => o.kind === 'pass')) {
    const next = p.segments[opt.next!], time = next.decisionAt!;
    const defenders = Object.values(v.defPaths[next.id]).map(path => at(path, time));
    expect(positionValue(at(next.paths[next.handler], time), defenders)).toBeLessThanOrEqual(.5);
    expect(positionValue({ x: 0, z: 1.2 }, defenders)).toBeGreaterThanOrEqual(.7);
  }
});

it('stellt beim Switch den Big an den Ballführer und beim Inbound einen Block und eine Doppelung', () => {
  const p = PLAYS.pnr, seg = p.segments[p.start], v = p.variants.find(v => v.id === 'switch')!;
  expect(Math.hypot(at(v.defPaths[seg.id].b44, seg.decisionAt!).x - at(seg.paths.r3, seg.decisionAt!).x,
    at(v.defPaths[seg.id].b44, seg.decisionAt!).z - at(seg.paths.r3, seg.decisionAt!).z)).toBeLessThan(.6);
  const inbound = PLAYS.inbound, start = inbound.segments[inbound.start];
  expect(Object.values(start.paths).some(path => path.some(p => p.act === 'screen'))).toBe(true);
  const receiver = at(start.paths.r11, start.decisionAt!);
  const double = inbound.variants.find(v => v.id === 'double')!.defPaths[start.id];
  expect(Object.values(double).filter(path => {
    const pos = at(path, start.decisionAt!);
    return Math.hypot(pos.x - receiver.x, pos.z - receiver.z) < 1.2;
  })).toHaveLength(2);
});
