import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { buildAtlas } from '../src/figure/atlas';
import { createActors } from '../src/render/actors';
import { createScene } from '../src/render/scene';
import { createPlayer } from '../src/render/player';

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    getImageData: (_x: number, _y: number, w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
    putImageData: vi.fn(), drawImage: vi.fn(), clearRect: vi.fn(),
    fillRect: vi.fn(), strokeRect: vi.fn(), beginPath: vi.fn(),
    moveTo: vi.fn(), lineTo: vi.fn(), arc: vi.fn(), stroke: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
});
afterEach(() => vi.restoreAllMocks());

describe('Canvas-Texturfarben', () => {
  it('kennzeichnet den Figurenatlas als sRGB', () => {
    const atlas = buildAtlas({});
    expect(atlas.texture.colorSpace).toBe(THREE.SRGBColorSpace);
    atlas.texture.dispose();
  });

  it('kennzeichnet auch den Texturklon jeder Figur als sRGB', () => {
    const scene = new THREE.Scene();
    const texture = new THREE.CanvasTexture(document.createElement('canvas'));
    const actors = createActors(scene, { texture, uv: () => [0, 0, 1, 1] }, ['r3', 'b1']);
    const sprites = scene.children.filter((object): object is THREE.Sprite => object instanceof THREE.Sprite);
    expect(sprites).toHaveLength(2);
    for (const sprite of sprites) {
      expect(sprite.material.map).not.toBe(texture);
      expect(sprite.material.map!.colorSpace).toBe(THREE.SRGBColorSpace);
    }
    actors.dispose();
    texture.dispose();
  });

  it('kennzeichnet Feld, Publikum und Brett als sRGB', () => {
    const { scene } = createScene();
    const textures = new Set<THREE.CanvasTexture>();
    scene.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) {
        if ('map' in material && material.map instanceof THREE.CanvasTexture) textures.add(material.map);
        material.dispose();
      }
      object.geometry.dispose();
    });
    expect(textures.size).toBe(5);
    for (const texture of textures) {
      expect(texture.colorSpace).toBe(THREE.SRGBColorSpace);
      texture.dispose();
    }
  });

  it('kennzeichnet beide Posen des Platzhalter-Werfers als sRGB', () => {
    const scene = new THREE.Scene(), player = createPlayer(scene);
    const sprite = scene.children.find((object): object is THREE.Sprite => object instanceof THREE.Sprite)!;
    for (const pose of ['ready', 'shoot'] as const) {
      player.setPose(pose);
      expect(sprite.material.map!.colorSpace).toBe(THREE.SRGBColorSpace);
      sprite.material.map!.dispose();
    }
    sprite.material.dispose();
  });
});
