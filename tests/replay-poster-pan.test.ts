import { expect, it } from 'vitest';
import { replayCameraPose } from '../src/render/camera-pose';
import type { PosterVariant } from '../src/play/engine';

it.each(['crowd', 'jumbotron'] as PosterVariant[])('%s: Replay-Kamera bleibt stehen und schwenkt nur zum Fliegenden', variant => {
  const normal = replayCameraPose('classic', 0, .46);
  const a = replayCameraPose(variant, 0, .46, { x: 0, y: 2, z: 0 });
  const b = replayCameraPose(variant, 3, .46, { x: 15.8, y: 1, z: 2.4 });
  // gleiche Stelle wie das normale Replay zu Beginn, keine Fahrt, kein Weitwinkel aus 30 m
  expect(a.pos).toEqual(normal.pos);
  expect(b.pos).toEqual(normal.pos);
  expect(b.look).toEqual({ x: 15.8, y: 1, z: 2.4 });
  // ohne Ziel: Blick auf den Korb wie gewohnt
  expect(replayCameraPose(variant, 1, .46).look).toEqual(normal.look);
});
