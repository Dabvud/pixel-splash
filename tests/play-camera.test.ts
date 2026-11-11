import { describe, expect, it } from 'vitest';
import { playCameraPose } from '../src/render/camera-pose';
import { overviewPose } from '../src/render/camera-pose';
import { PerspectiveCamera, Vector3 } from 'three';
import { command, createPlayState, step, type EngineConfig, type EngineEvent } from '../src/play/engine';
import { PLAYS } from '../src/play/plays';
import { ACTORS } from '../src/play/teams';
import { routeTo } from './play-routes';

const aspect = 390 / 844;
function expectFramed(pose: ReturnType<typeof overviewPose>, handler: { x: number; z: number }, targets: { x: number; z: number }[]): void {
  const camera = new PerspectiveCamera(pose.fov, aspect, .1, 100);
  camera.position.set(pose.pos.x, pose.pos.y, pose.pos.z);
  camera.lookAt(pose.look.x, pose.look.y, pose.look.z);
  camera.updateMatrixWorld(true);
  const points = [handler, ...targets].flatMap(p => [0, 1, 2.2].map(y => new Vector3(p.x, y, p.z)));
  points.push(new Vector3(0, 3.05, 0));
  for (const point of points) {
    point.project(camera);
    // 8 % je Bildrand entsprechen NDC ±0,84.
    expect(Math.abs(point.x)).toBeLessThanOrEqual(.84 + 1e-10);
    expect(Math.abs(point.y)).toBeLessThanOrEqual(.84 + 1e-10);
    expect(Math.abs(point.z)).toBeLessThan(1);
  }
}

describe('Übersicht aller Entscheidungspunkte im Hochformat', () => {
  const cfg: EngineConfig = {
    slowmo: .3, decisionS: 4, animSpeed: 1, foulMult: 0, zoneFloor: .7, tempoSpread: 0,
    passDelayMax: 0, closeoutRandom: 0,
    shot: { meterMs: 700, greenZone: .07, aimDeg: 6, influence: .6 },
    finish: { meterMs: 450, greenZone: .1, aimDeg: 8 },
  };
  const cases = Object.values(PLAYS).flatMap(play => play.variants.flatMap(variant =>
    Object.values(play.segments).map(segment => ({ title: `${play.id}/${variant.id}/${segment.id}`, play, variant, segment }))));
  it.each(cases)('$title: zeigt Ballführer, alle Passziele und Ring mit 8 % Rand', ({ play, variant, segment }) => {
    const s = createPlayState({ ...play, variants: [{ ...variant, weight: 1 }] }, cfg, () => .99);
    const events: EngineEvent[] = [];
    const wait = (ready: () => boolean) => {
      for (let i = 0; i < 1200 && !ready() && s.phase !== 'ended'; i++) events.push(...step(s, 1 / 120, cfg, () => .99));
      expect(ready()).toBe(true);
    };
    wait(() => s.phase === 'decision');
    for (const pass of routeTo(play, segment.id)!) {
      command(s, { kind: 'pass', to: pass.to!, quality: 1 }, cfg, () => .99);
      wait(() => s.handler === pass.to && (s.phase === 'decision' || s.phase === 'takeoff'));
    }
    const handler = s.actors[s.handler].pos;
    const teammates = Object.values(s.actors).filter(a => ACTORS[a.id].team === 'off' && a.id !== s.handler);
    if (s.phase === 'decision') {
      const options = events.filter(e => e.type === 'decision').at(-1)!.options;
      expect(options.filter(o => o.kind === 'pass').map(o => o.to).sort()).toEqual(teammates.map(a => a.id).sort());
    }
    const targets = teammates.map(a => a.pos);
    const pose = overviewPose(handler, targets, aspect);
    expect(pose.fov).toBe(60);
    expectFramed(pose, handler, targets);
    const extra = teammates.find(a => !segment.options!.some(o => o.kind === 'pass' && o.to === a.id));
    if (s.phase === 'decision' && extra) {
      command(s, { kind: 'pass', to: extra.id }, cfg, () => .99);
      wait(() => s.handler === extra.id && s.phase === 'decision');
      const options = events.filter(e => e.type === 'decision').at(-1)!.options;
      const all = Object.values(s.actors).filter(a => ACTORS[a.id].team === 'off' && a.id !== s.handler);
      expect(options.filter(o => o.kind === 'pass').map(o => o.to).sort()).toEqual(all.map(a => a.id).sort());
      const h = s.actors[s.handler].pos, goals = all.map(a => a.pos);
      expectFramed(overviewPose(h, goals, aspect), h, goals);
    }
  });
  it('zeigt beim Kick-out ausdrücklich beide weit auseinanderliegenden Passziele', () => {
    const handler = { x: 0, z: 2.6 }, targets = [{ x: 6.9, z: .5 }, { x: -4.8, z: 4.8 }];
    const snapshot = JSON.stringify({ handler, targets });
    const pose = overviewPose(handler, targets, aspect);
    expectFramed(pose, handler, targets);
    expect(pose.pos.y).toBeGreaterThan(8);
    expect(JSON.stringify({ handler, targets })).toBe(snapshot);
  });
  it('behält die Ballführerachse bei ausreichendem Abstand bei', () => {
    const handler = { x: 3, z: 6 };
    const pose = overviewPose(handler, [{ x: -2, z: 2 }], aspect);
    expect(pose.pos.x * handler.z - pose.pos.z * handler.x).toBeCloseTo(0, 8);
  });
  it('nutzt für ein Ziel hinter der bisherigen Kamera die Schwerpunktachse', () => {
    const handler = { x: 0, z: 5 }, targets = [{ x: 4, z: 20 }];
    const pose = overviewPose(handler, targets, aspect);
    expect(pose.pos.x).toBeGreaterThan(0);
    expectFramed(pose, handler, targets);
  });
  it('liefert auch direkt unter dem Ring ohne Passziele eine endliche Pose', () => {
    const pose = overviewPose({ x: 0, z: 0 }, [], aspect);
    expect(pose.pos.y).toBeGreaterThanOrEqual(8);
    expectFramed(pose, { x: 0, z: 0 }, []);
  });
});

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
