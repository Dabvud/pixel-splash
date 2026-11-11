import { afterEach, describe, expect, it, vi } from 'vitest';
import { Mesh, MeshBasicMaterial, Scene, Vector3 } from 'three';
import { createGlassShards } from '../src/render/glass';
import { createScene } from '../src/render/scene';

afterEach(() => vi.restoreAllMocks());

it('behält Rahmen, Halterung und Glasreste und hängt Ring und Netz gemeinsam am Brett ab', () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    fillRect: vi.fn(), strokeRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(),
    moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  const { scene, hoop, updateNet } = createScene();
  const glass = scene.getObjectByName('backboard-glass')!;
  const frame = scene.getObjectByName('backboard-frame')!;
  const support = scene.getObjectByName('rim-support')!;
  const pivot = scene.getObjectByName('rim-pivot')!;
  const rim = scene.getObjectByName('rim')!, net = scene.getObjectByName('net')!;
  const remnants = scene.getObjectByName('glass-remnants')!;
  updateNet(0);
  scene.updateMatrixWorld(true);
  const initial = [rim, net].map(o => ({ pos: o.position.clone(), rot: o.rotation.clone(), world: o.getWorldPosition(new Vector3()) }));
  expect(initial[0].world.toArray()).toEqual([0, 3.05, 0]);
  expect(initial[1].world.toArray()).toEqual([0, 2.84, 0]);
  expect(remnants.visible).toBe(false);
  hoop.setGlassBroken(true);
  updateNet(0);
  scene.updateMatrixWorld(true);
  expect(glass.visible).toBe(false);
  expect(frame.visible).toBe(true);
  expect(frame.children).toHaveLength(4);
  expect(support.visible).toBe(true);
  expect(remnants.visible).toBe(true);
  expect(remnants.children.length).toBeGreaterThanOrEqual(4);
  expect(Math.abs(pivot.rotation.x)).toBeGreaterThanOrEqual(.4);
  expect(Math.abs(pivot.rotation.x)).toBeLessThanOrEqual(.55);
  expect(rim.parent).toBe(pivot);
  expect(net.parent).toBe(pivot);
  expect(rim.getWorldPosition(new Vector3()).y).toBeLessThan(initial[0].world.y);
  expect(net.getWorldPosition(new Vector3()).distanceTo(initial[1].world)).toBeGreaterThan(.05);
  const expectedNet = initial[1].world.clone().sub(pivot.position)
    .applyAxisAngle(new Vector3(1, 0, 0), .48).add(pivot.position);
  expect(net.getWorldPosition(new Vector3()).distanceTo(expectedNet)).toBeLessThan(1e-10);
  expect(net.getWorldPosition(new Vector3()).distanceTo(pivot.localToWorld(net.position.clone()))).toBeLessThan(1e-10);
  expect(pivot.getWorldPosition(new Vector3()).toArray()).toEqual([0, 3.05, -.375]);
  hoop.setGlassBroken(false);
  updateNet(0);
  expect(pivot.rotation.x).toBe(0);
  expect(glass.visible).toBe(true);
  expect(remnants.visible).toBe(false);
  [rim, net].forEach((o, i) => {
    expect(o.position).toEqual(initial[i].pos);
    expect(o.rotation.toArray()).toEqual(initial[i].rot.toArray());
    expect(o.getWorldPosition(new Vector3()).toArray()).toEqual(initial[i].world.toArray());
  });
});

describe('Pixel-Scherben', () => {
  it('startet am Brett, fällt auf den Boden, wischt die Hälfte weg und setzt zurück', () => {
    const random = vi.spyOn(Math, 'random'), scene = new Scene(), shards = createGlassShards(scene);
    const pieces = scene.children.filter((o): o is Mesh => o instanceof Mesh);
    const visible = () => pieces.filter(p => p.visible);
    expect(visible()).toHaveLength(0);
    shards.burst(100);
    expect(visible().length).toBeGreaterThanOrEqual(28);
    expect(visible().length).toBeLessThanOrEqual(32);
    for (const p of visible()) {
      expect(p.material).toBeInstanceOf(MeshBasicMaterial);
      expect(p.position.y).toBeGreaterThan(2.8);
      expect(p.position.z).toBeCloseTo(-.4);
    }
    shards.update(1700);
    for (const p of visible()) expect(p.position.y).toBeCloseTo(.01, 2);
    const landed = pieces.map(p => p.position.toArray());
    shards.update(3000);
    expect(pieces.map(p => p.position.toArray())).toEqual(landed);
    shards.sweep(.5);
    expect(visible()).toHaveLength(Math.floor(pieces.length / 2));
    shards.reset(); expect(visible()).toHaveLength(0);
    shards.burst(100); shards.update(1700);
    expect(pieces.map(p => p.position.toArray())).toEqual(landed);
    // Three vergibt beim Anlegen UUIDs; die Flugbahn selbst nutzt keinen Zufall.
    random.mockClear(); shards.update(1800); shards.sweep(1);
    expect(random).not.toHaveBeenCalled(); random.mockRestore();
  });
});

it('zeichnet das Brett als halbtransparentes Glas mit deckenden weißen Linien', () => {
  const fills: string[] = [];
  const ctx = { fillRect: vi.fn(), strokeRect: vi.fn(), clearRect: vi.fn(), beginPath: vi.fn(), arc: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn() } as Record<string, unknown>;
  Object.defineProperty(ctx, 'fillStyle', { set: (v: string) => fills.push(v), get: () => '' });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx as unknown as CanvasRenderingContext2D);
  const { scene } = createScene();
  const glass = scene.getObjectByName('backboard-glass') as Mesh;
  const material = glass.material as MeshBasicMaterial;
  expect(material.transparent).toBe(true);
  expect(material.depthWrite).toBe(false);
  expect(fills).toContain('rgba(190, 225, 245, 0.28)');
});
