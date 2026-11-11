import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { buildAtlas } from '../src/figure/atlas';
import { createActors } from '../src/render/actors';
import { createScene } from '../src/render/scene';
import { createPlayer } from '../src/render/player';
import { ACTORS, RED, BLUE, BENCH_RED, BENCH_BLUE, DOC } from '../src/play/teams';
import { BENCH_MOVES, DOC_MOVES } from '../src/render/bench';
import { MOVES } from '../src/figure/moves';
import { createBenchSeats } from '../src/render/bench-view';
// Die zehn Teamspieler (ohne Schiri)
const PLAYERS = [...RED, ...BLUE];
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
  it.each([false, true])('baut Bank und Arzt nur mit benötigten Moves und kleinen Atlas-Seiten (lazy=%s)', lazy => {
    const bench = [...BENCH_RED, ...BENCH_BLUE], all = [...bench, DOC];
    const moves = Object.fromEntries(all.map(a => [a.id, a === DOC ? DOC_MOVES : BENCH_MOVES]));
    const atlas = buildAtlas(Object.fromEntries(all.map(a => [a.id, a])), { lazy, moves });
    if (!lazy) {
      const calls = vi.mocked(HTMLCanvasElement.prototype.getContext).mock.results
        .reduce((n, r) => n + vi.mocked((r.value as CanvasRenderingContext2D).putImageData).mock.calls.length, 0);
      expect(calls).toBe(all.reduce((sum, a) => sum + moves[a.id].reduce((n, m) => n + MOVES[m].frames * 4, 0), 0));
    }
    for (const a of all) for (const move of moves[a.id]) for (const dir of ['front', 'back', 'left', 'right'] as const) {
      const [u, v, w, h] = atlas.uv(a.id, move, dir, MOVES[move].frames - 1);
      expect(u).toBeGreaterThanOrEqual(0); expect(v).toBeGreaterThanOrEqual(0);
      expect(u + w).toBeLessThanOrEqual(1); expect(v + h).toBeLessThanOrEqual(1);
    }
    const bytes = atlas.textures!.reduce((n, t) => n + t.image.width * t.image.height * 4, 0);
    expect(bytes).toBeLessThanOrEqual(8 * 1024 * 1024);
    for (const t of atlas.textures!) {
      expect(t.image.width).toBeLessThanOrEqual(4096); expect(t.image.height).toBeLessThanOrEqual(4096); t.dispose();
    }
    expect(() => atlas.uv(bench[0].id, 'idle', 'front', 0)).toThrow();
  });
  it('stellt zwei dunkelgraue Bankboxen bei x ±8,4 zwischen Feld und Banden auf', () => {
    const scene = new THREE.Scene(), seats = createBenchSeats(scene);
    const boxes = scene.children.filter((o): o is THREE.Mesh<THREE.BoxGeometry, THREE.MeshLambertMaterial> => o instanceof THREE.Mesh);
    expect(boxes).toHaveLength(2);
    for (const b of boxes) {
      expect(Math.abs(b.position.x)).toBe(8.4);
      expect(b.position.y + b.geometry.parameters.height / 2).toBe(.45);
      expect(b.position.z - b.geometry.parameters.depth / 2).toBe(2.5);
      expect(b.position.z + b.geometry.parameters.depth / 2).toBe(5.5);
      expect(b.material.color.getHex()).toBe(0x333338);
    }
    seats.dispose(); expect(scene.children).toHaveLength(0);
  });
  it('blendet nur das Brettglas aus und wieder ein', () => {
    const { scene, hoop } = createScene();
    const before = scene.children.map(o => o.visible);
    hoop.setGlassBroken(true);
    expect(scene.children.filter((o, i) => o.visible !== before[i])).toHaveLength(1);
    hoop.setGlassBroken(false);
    expect(scene.children.map(o => o.visible)).toEqual(before);
  });
  it('rastert im Lazy-Atlas nur angeforderte Bilder, cached sie und bleibt unter 20 MiB RGBA für zehn Akteure', () => {
    const atlas = buildAtlas(Object.fromEntries(PLAYERS.map(a => [a.id, a])), { lazy: true });
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
    for (const id of PLAYERS.map(a => a.id)) for (const dir of ['front', 'back', 'left', 'right'] as const) {
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
    const scene = new THREE.Scene(), actors = createActors(scene, atlas, PLAYERS.map(a => a.id));
    const sprites = scene.children.filter((o): o is THREE.Sprite => o instanceof THREE.Sprite);
    PLAYERS.map(a => a.id).forEach((id, i) => expect(sprites[i].material.map!.image).toBe(atlas.textureFor!(id).image));
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
