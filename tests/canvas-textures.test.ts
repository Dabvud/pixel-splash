import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { buildAtlas } from '../src/figure/atlas';
import { createActors } from '../src/render/actors';
import { createScene } from '../src/render/scene';
import { createPlayer } from '../src/render/player';
import { ACTORS } from '../src/play/teams';
import { PLAYS } from '../src/play/plays';

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
  it('rastert im Lazy-Atlas nur angeforderte Bilder, cached sie und bleibt unter 20 MiB RGBA für zehn Akteure', () => {
    const atlas = buildAtlas(ACTORS, { lazy: true });
    const context = vi.mocked(HTMLCanvasElement.prototype.getContext).mock.results.at(-1)!.value as CanvasRenderingContext2D;
    expect(context.putImageData).not.toHaveBeenCalled();
    const bytes = atlas.textures!.reduce((sum, t) => sum + t.image.width * t.image.height * 4, 0);
    expect(bytes).toBeLessThanOrEqual(20 * 1024 * 1024);
    for (const t of atlas.textures!) {
      expect(t.image.width).toBeLessThanOrEqual(4096); expect(t.image.height).toBeLessThanOrEqual(4096);
    }
    const uv = atlas.uv('r3', 'idle', 'back', 0);
    expect(context.putImageData).toHaveBeenCalledTimes(1);
    expect(atlas.uv('r3', 'idle', 'back', 0)).toEqual(uv);
    expect(context.putImageData).toHaveBeenCalledTimes(1);
    atlas.textures!.forEach(t => t.dispose());
  });
  it('hält alle zehn Baukasten-Spieler auf Atlas-Seiten bis 4096 × 4096 mit gültigen idle-Ausschnitten', () => {
    const atlas = buildAtlas(ACTORS);
    for (const texture of atlas.textures!) {
      expect(texture.image.width).toBeLessThanOrEqual(4096);
      expect(texture.image.height).toBeLessThanOrEqual(4096);
    }
    for (const id of Object.keys(ACTORS)) for (const dir of ['front', 'back', 'left', 'right'] as const) {
      const [u, v, w, h] = atlas.uv(id, 'idle', dir, 0);
      expect(u).toBeGreaterThanOrEqual(0); expect(v).toBeGreaterThanOrEqual(0);
      expect(u + w).toBeLessThanOrEqual(1); expect(v + h).toBeLessThanOrEqual(1);
      const texture = atlas.textureFor!(id);
      expect(w * texture.image.width).toBe(32);
      expect(h * texture.image.height).toBe(64);
    }
    atlas.textures!.forEach(t => t.dispose());
  });
  it.each(Object.values(PLAYS))('$id hält alle Atlas-Seiten für seine Akteure innerhalb 4096 × 4096', play => {
    const atlas = buildAtlas(Object.fromEntries(play.actors.map(id => [id, ACTORS[id]])));
    for (const texture of atlas.textures!) {
      expect(texture.image.width).toBeLessThanOrEqual(4096);
      expect(texture.image.height).toBeLessThanOrEqual(4096);
      texture.dispose();
    }
  });
  it('ordnet jedem Akteur seine Atlas-Seite auch im Sprite-Texturklon zu', () => {
    const atlas = buildAtlas(ACTORS);
    expect(atlas.textures!.length).toBeGreaterThan(1);
    const scene = new THREE.Scene(), actors = createActors(scene, atlas, Object.keys(ACTORS));
    const sprites = scene.children.filter((o): o is THREE.Sprite => o instanceof THREE.Sprite);
    Object.keys(ACTORS).forEach((id, i) => expect(sprites[i].material.map!.image).toBe(atlas.textureFor!(id).image));
    actors.dispose(); atlas.textures!.forEach(t => t.dispose());
  });
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
