import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { createScene } from '../src/render/scene';

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    fillRect: vi.fn(), strokeRect: vi.fn(), clearRect: vi.fn(), beginPath: vi.fn(),
    moveTo: vi.fn(), lineTo: vi.fn(), arc: vi.fn(), stroke: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
});
afterEach(() => vi.restoreAllMocks());

describe('Arena in createScene', () => {
  it('behält scene/ball/updateNet bei und stellt ein unabhängig steuerbares Publikum bereit', () => {
    const result = createScene();
    expect(result.scene).toBeInstanceOf(THREE.Scene);
    expect(result.ball).toBeInstanceOf(THREE.Mesh);
    expect(() => result.updateNet(0)).not.toThrow();
    expect(result.crowd).toBeDefined();
    const mesh = result.scene.getObjectByName('arena-crowd') as THREE.InstancedMesh;
    result.crowd!.update(0);
    const before = mesh.instanceMatrix.array.slice();
    result.crowd!.cheer(1); result.crowd!.update(300);
    expect(mesh.instanceMatrix.array).not.toEqual(before);
  });

  it('verwendet fünf gemeinsam genutzte sRGB-/Nearest-Texturen und höchstens vier Zuschauer-Draw-Calls', () => {
    const { scene } = createScene();
    const textures = new Set<THREE.Texture>();
    let crowdDraws = 0, instances = 0;
    scene.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      if (object.name === 'arena-crowd') {
        crowdDraws += Math.max(1, object.geometry.groups.length);
        instances += (object as THREE.InstancedMesh).count;
      }
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if ('map' in material && material.map instanceof THREE.Texture) textures.add(material.map);
      }
    });
    expect(crowdDraws).toBeGreaterThan(0);
    expect(crowdDraws).toBeLessThanOrEqual(4);
    expect(instances).toBeLessThan(3000);
    expect(textures.size).toBe(5);
    for (const texture of textures) {
      expect(texture.colorSpace).toBe(THREE.SRGBColorSpace);
      expect(texture.magFilter).toBe(THREE.NearestFilter);
      expect(texture.minFilter).toBe(THREE.NearestFilter);
    }
    expect(scene.getObjectByName('arena-jumbotron')).toBeDefined();
    expect(scene.getObjectByName('arena-light-beams')).toBeDefined();
    expect(scene.getObjectByName('arena-advertising')).toBeDefined();
  });
});
