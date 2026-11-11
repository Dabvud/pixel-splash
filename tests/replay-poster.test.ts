import { expect, it } from 'vitest';
import * as THREE from 'three';
import { replayCameraPose } from '../src/render/camera-pose';
import { posterReplayReady } from '../src/render/replay';
import type { PosterVariant } from '../src/play/engine';

it.each(['crowd', 'jumbotron'] as PosterVariant[])('rahmt %s im Replay auch im Hochformat vollständig ein', variant => {
  for (const aspect of [.45, 1, 1.8]) for (const elapsed of [0, 3, 7, 12]) {
    const pose = replayCameraPose(variant, elapsed, aspect), camera = new THREE.PerspectiveCamera(60, aspect, .1, 200);
    camera.position.set(pose.pos.x, pose.pos.y, pose.pos.z); camera.lookAt(pose.look.x, pose.look.y, pose.look.z); camera.updateMatrixWorld();
    const points = variant === 'crowd' ? [[-15.775, .7, 2.4], [15.775, 2.5, 2.4], [0, 3.05, 0]]
      : [[-2.3, 15.8, 10.7], [2.3, 13.2, 10.7], [0, 0, -2.4]];
    for (const p of points) {
      const v = new THREE.Vector3(...p).project(camera);
      expect(Math.abs(v.x)).toBeLessThan(1); expect(Math.abs(v.y)).toBeLessThan(1); expect(v.z).toBeLessThan(1);
    }
    if (variant === 'jumbotron') expect(camera.position.z).toBeLessThan(10.7);
  }
});

it('wartet mit dem Replay bis nach Seelenaufstieg, Würfelblinken und Landung', () => {
  const base = { realTime: 2, grave: null, poster: { victim: 'b1', kind: 'poster' as const, variant: 'ghost' as PosterVariant, startedAt: 1 } };
  expect(posterReplayReady(base)).toBe(false);
  expect(posterReplayReady({ ...base, ghost: { x: 0, z: 0, since: 1.5 }, realTime: 4 })).toBe(true);
  base.poster.variant = 'jumbotron';
  expect(posterReplayReady(base)).toBe(false);
  expect(posterReplayReady({ ...base, ouch: { since: 2 }, realTime: 4 })).toBe(true);
  base.poster.variant = 'crowd'; base.poster.startedAt = Infinity;
  expect(posterReplayReady(base)).toBe(false);
  base.poster.startedAt = 1.5;
  expect(posterReplayReady(base)).toBe(true);
});
