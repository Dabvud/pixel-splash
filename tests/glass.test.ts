import { describe, expect, it, vi } from 'vitest';
import { Mesh, MeshBasicMaterial, Scene } from 'three';
import { createGlassShards } from '../src/render/glass';

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
