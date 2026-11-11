import { afterEach, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { createGrave } from '../src/render/grave';

afterEach(() => vi.restoreAllMocks());

it('zeigt einen abgeschrägten Pixel-Grabstein zur Feldmitte und entsorgt seine Ressourcen', () => {
  const fillText = vi.fn();
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ fillRect: vi.fn(), fillText } as unknown as CanvasRenderingContext2D);
  const scene = new THREE.Scene(), grave = createGrave(scene);
  grave.sync(null);
  const group = scene.getObjectByName('poster-grave')!;
  expect(group.visible).toBe(false);
  grave.sync({ x: 1, z: 2, since: 3 }, 2);
  expect(group.visible).toBe(false);
  grave.sync({ x: 1, z: 2, since: 3 }, 3);
  expect(group.visible).toBe(true);
  expect(group.position.toArray()).toEqual([1, 0, 2]);
  expect(group.rotation.y).toBeCloseTo(Math.atan2(-1, 5.4 - 2));
  expect(fillText).toHaveBeenCalledWith('R.I.P.', 32, 32);
  const front = group.getObjectByName('grave-inscription') as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  expect(front.material.map!.magFilter).toBe(THREE.NearestFilter);
  expect(front.material.map!.minFilter).toBe(THREE.NearestFilter);
  const dispose = vi.spyOn(front.material.map!, 'dispose');
  grave.dispose();
  expect(scene.getObjectByName('poster-grave')).toBeUndefined();
  expect(dispose).toHaveBeenCalledOnce();
});
