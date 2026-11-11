import { afterEach, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { createPosterEffects } from '../src/render/poster-effects';
import { createActors } from '../src/render/actors';

afterEach(() => vi.restoreAllMocks());

it('zeigt die Pixel-Seele ab dem Versinken, steigt schlängelnd bis fünf Meter und verblasst', () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ fillRect: vi.fn() } as unknown as CanvasRenderingContext2D);
  const scene = new THREE.Scene(), effects = createPosterEffects(scene);
  const ghost = scene.getObjectByName('poster-ghost') as THREE.Sprite;
  const data = { ghost: { x: 1, z: 2, since: 3 }, splinters: null, ouch: null };
  expect(ghost.visible).toBe(false);
  effects.sync(data, 2.9); expect(ghost.visible).toBe(false);
  effects.sync(data, 3); expect(ghost.visible).toBe(true); expect(ghost.material.opacity).toBeCloseTo(.45);
  const start = ghost.position.clone();
  effects.sync(data, 4.25);
  expect(ghost.position.y).toBeGreaterThan(start.y); expect(ghost.position.x).not.toBe(start.x);
  expect(ghost.material.opacity).toBeCloseTo(.225);
  effects.sync(data, 5.499); expect(ghost.position.y).toBeCloseTo(5, 2);
  effects.sync(data, 5.5); expect(ghost.visible).toBe(false);
  const dispose = vi.spyOn(ghost.material.map!, 'dispose');
  effects.dispose(); expect(dispose).toHaveBeenCalledOnce();
});

it('blinkt OUCH zwei Sekunden vor der feldzugewandten Würfelseite und entsorgt alle Ressourcen', () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ fillRect: vi.fn() } as unknown as CanvasRenderingContext2D);
  const scene = new THREE.Scene(), effects = createPosterEffects(scene);
  const plane = scene.getObjectByName('poster-ouch') as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  const data = { ghost: null, splinters: null, ouch: { since: 3 } };
  effects.sync(data, 2); expect(plane.visible).toBe(false);
  effects.sync(data, 3); expect(plane.visible).toBe(true);
  expect(plane.position.toArray()).toEqual([0, 14.5, 10.7]);
  expect(plane.rotation.y).toBe(Math.PI);
  expect(plane.material.map!.magFilter).toBe(THREE.NearestFilter);
  effects.sync(data, 3.15); expect(plane.visible).toBe(false);
  effects.sync(data, 3.3); expect(plane.visible).toBe(true);
  effects.sync(data, 5); expect(plane.visible).toBe(false);
  const resources: ReturnType<typeof vi.spyOn>[] = [];
  const seen = new Set<object>();
  scene.traverse(o => {
    if (!(o instanceof THREE.Mesh || o instanceof THREE.Sprite)) return;
    const material = o.material as THREE.MeshBasicMaterial;
    for (const r of [o instanceof THREE.Mesh ? o.geometry : null, material, material.map]) {
      if (r && !seen.has(r)) { seen.add(r); resources.push(vi.spyOn(r, 'dispose')); }
    }
  });
  effects.dispose(); resources.forEach(spy => expect(spy).toHaveBeenCalledOnce());
  expect(scene.children).toHaveLength(0);
});

it('zeigt helle Parkettsplitter erst ab Einschlag und verbirgt sämtliche Effekte beim Reset', () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ fillRect: vi.fn() } as unknown as CanvasRenderingContext2D);
  const scene = new THREE.Scene(), effects = createPosterEffects(scene);
  const wood = scene.getObjectByName('poster-splinters')!;
  const data = { ghost: null, ouch: null, splinters: { x: -1, z: 2, since: 3 } };
  effects.sync(data, 2); expect(wood.visible).toBe(false);
  effects.sync(data, 3); expect(wood.visible).toBe(true); expect(wood.position.toArray()).toEqual([-1, 0, 2]);
  expect(wood.children.length).toBeGreaterThanOrEqual(6);
  for (const child of wood.children) expect(child).toBeInstanceOf(THREE.Mesh);
  effects.sync(null, 3);
  for (const child of scene.children) expect(child.visible).toBe(false);
  effects.dispose();
});

it('clippt legs_up am Boden und entfernt das Clipping beim nächsten Move', () => {
  const scene = new THREE.Scene(), texture = new THREE.CanvasTexture(document.createElement('canvas'));
  const actors = createActors(scene, { texture, uv: () => [0, 0, 1, 1] }, ['b1']);
  const view = { id: 'b1', x: 0, y: -1.2, z: 0, facing: 0, move: 'legs_up' as const, moveT: 0, visible: true };
  actors.sync([view], 0);
  const sprite = scene.children.find((o): o is THREE.Sprite => o instanceof THREE.Sprite)!;
  const plane = sprite.material.clippingPlanes![0];
  expect(plane.distanceToPoint(new THREE.Vector3(0, -.1, 0))).toBeLessThan(0);
  expect(plane.distanceToPoint(new THREE.Vector3(0, .1, 0))).toBeGreaterThan(0);
  actors.sync([{ ...view, move: 'idle', y: 0 }], 0);
  expect(sprite.material.clippingPlanes ?? []).toHaveLength(0);
  actors.dispose(); texture.dispose();
});
