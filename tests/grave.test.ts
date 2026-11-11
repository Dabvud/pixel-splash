import { afterEach, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { createGrave } from '../src/render/grave';

afterEach(() => vi.restoreAllMocks());

it('zeigt flache Pixelerde vor der Inschrift synchron zum Stein und entsorgt alle Erdressourcen', () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ fillRect: vi.fn(), fillText: vi.fn() } as unknown as CanvasRenderingContext2D);
  const scene = new THREE.Scene(), grave = createGrave(scene), data = { x: -2, z: 1, since: 3 };
  const group = scene.getObjectByName('poster-grave')!;
  grave.sync(data, 3);
  const earth = group.getObjectByName('grave-earth')!;
  expect(earth).toBeDefined();
  expect(earth.visible && group.visible).toBe(true);
  const bounds = new THREE.Box3();
  const resources: ReturnType<typeof vi.spyOn>[] = [], seen = new Set<object>();
  earth.traverse(o => {
    if (!(o instanceof THREE.Mesh)) return;
    o.geometry.computeBoundingBox();
    bounds.union(o.geometry.boundingBox!.clone().translate(o.position));
    // Materialien sind geteilt: jede Ressource nur einmal beobachten
    for (const r of [o.geometry, o.material as THREE.Material]) if (!seen.has(r)) { seen.add(r); resources.push(vi.spyOn(r, 'dispose')); }
  });
  expect(bounds.min.z).toBeGreaterThan(.06);
  expect(bounds.min.y).toBeCloseTo(0, 6);
  expect(bounds.max.y).toBeLessThanOrEqual(.15);
  expect(bounds.getSize(new THREE.Vector3()).z).toBeGreaterThanOrEqual(.95);
  grave.sync(data, 2);
  expect(group.visible).toBe(false);
  grave.sync(data, 3);
  expect(group.visible).toBe(true);
  grave.sync(null);
  expect(group.visible).toBe(false);
  grave.dispose();
  resources.forEach(spy => expect(spy).toHaveBeenCalledOnce());
});

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
