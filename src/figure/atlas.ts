import * as THREE from "three";
import { project, type Dir } from "./skeleton";
import { MOVES, moveFrames, type MoveId } from "./moves";
import { CELL_H, CELL_W, rasterPose, type Look } from "./raster";

export const DIRS: readonly Dir[] = ["front", "back", "left", "right"];
const COLS = 128; // 128 × 32 = 4096; maximal 64 Reihen à 64 Pixel
interface AtlasOptions { lazy: boolean; moves?: Record<string, readonly MoveId[]> }

export interface Atlas {
  texture: THREE.CanvasTexture;
  textures?: THREE.CanvasTexture[];
  textureFor?(id: string): THREE.CanvasTexture;
  /** [offsetX, offsetY, repeatX, repeatY] für texture.offset/repeat */
  uv(id: string, move: MoveId, dir: Dir, frame: number): [number, number, number, number];
}

// Alle Bilder aller Figuren einmal vorab rastern; im Spiel wird nur der Ausschnitt gewechselt
export function buildAtlas(looks: Record<string, Look>, options?: AtlasOptions): Atlas {
  if (options?.lazy) return lazyAtlas(looks, options);
  const cols = options?.moves ? 16 : COLS, maxCells = cols * Math.floor(4096 / CELL_H);
  const movesFor = (id: string) => options?.moves?.[id] ?? Object.keys(MOVES) as MoveId[];
  const ids = Object.keys(looks), pageOf = new Map<string, number>(), groups: string[][] = [[]];
  let used = 0;
  for (const id of ids) {
    const cells = movesFor(id).reduce((sum, m) => sum + MOVES[m].frames * DIRS.length, 0);
    if (cells > maxCells) throw new Error('Eine Figur überschreitet die Atlas-Grenze');
    if (used + cells > maxCells) { groups.push([]); used = 0; }
    pageOf.set(id, groups.length - 1); groups[groups.length - 1].push(id); used += cells;
  }
  const textures: THREE.CanvasTexture[] = [], pages: Atlas[] = [];
  if (groups.length > 1) {
    for (const group of groups) {
      const page = buildAtlas(Object.fromEntries(group.map(id => [id, looks[id]])), options);
      pages.push(page); textures.push(page.texture);
    }
    return { texture: textures[0], textures,
      textureFor: id => textures[pageOf.get(id) ?? 0],
      uv: (id, move, dir, frame) => pages[pageOf.get(id) ?? 0].uv(id, move, dir, frame) };
  }
  const index = new Map<string, number>();
  let n = 0;
  for (const id of ids) for (const m of movesFor(id)) for (const d of DIRS) for (let f = 0; f < MOVES[m].frames; f++) index.set(`${id}|${m}|${d}|${f}`, n++);
  const rows = Math.max(1, Math.ceil(n / cols));
  const canvas = document.createElement("canvas");
  canvas.width = cols * CELL_W;
  canvas.height = rows * CELL_H;
  const g = canvas.getContext("2d")!;
  const img = g.createImageData(CELL_W, CELL_H);
  for (const [id, look] of Object.entries(looks))
    for (const m of movesFor(id)) {
      const poses = moveFrames(m);
      for (const d of DIRS)
        poses.forEach((pose, f) => {
          const i = index.get(`${id}|${m}|${d}|${f}`)!;
          img.data.set(rasterPose(project(pose, d), look, d));
          g.putImageData(img, (i % cols) * CELL_W, Math.floor(i / cols) * CELL_H);
        });
    }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return {
    texture,
    textures: [texture], textureFor: () => texture,
    uv(id, move, dir, frame) {
      if (!movesFor(id).includes(move)) throw new Error(`Move ${move} fehlt für ${id}`);
      const i = index.get(`${id}|${move}|${dir}|${frame}`) ?? 0;
      // Textur-v läuft von unten, die Leinwand von oben
      return [(i % cols) / cols, 1 - (Math.floor(i / cols) + 1) / rows, 1 / cols, 1 / rows];
    },
  };
}

/** 256 gecachte Zellen pro Akteur = 512 × 1024 × RGBA, höchstens 20 MiB bei zehn Figuren.
 * Beim Einstieg werden nur leere Leinwände angelegt; pro Frame wird höchstens ein
 * tatsächlich benötigtes Bild je Figur gerastert. Alte Bilder werden zyklisch ersetzt.
 */
function lazyAtlas(looks: Record<string, Look>, options: AtlasOptions): Atlas {
  const cols = 16;
  const poses = new Map<MoveId, ReturnType<typeof moveFrames>>();
  const pages = new Map(Object.entries(looks).map(([id, look]) => {
    // Zusatzakteure brauchen wenige Bewegungen: halbe Seiten sparen Speicher am Handy.
    const allowed = options.moves?.[id];
    const rows = allowed ? Math.max(1, Math.ceil(allowed.reduce((n, m) => n + MOVES[m].frames * DIRS.length, 0) / cols))
      : ['ref', 'crew'].includes((look as { team?: string }).team ?? '') ? 8 : 16;
    if (rows * CELL_H > 4096) throw new Error('Eine Figur überschreitet die Atlas-Grenze');
    const capacity = cols * rows;
    const canvas = document.createElement('canvas');
    canvas.width = cols * CELL_W; canvas.height = rows * CELL_H;
    const context = canvas.getContext('2d')!;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    const page = { look, rows, capacity, context, texture, image: context.createImageData(CELL_W, CELL_H), next: 0,
      keys: [] as string[], cells: new Map<string, [number, number, number, number]>() };
    return [id, page] as const;
  }));
  const textures = [...pages.values()].map(p => p.texture);
  return { texture: textures[0], textures, textureFor: id => pages.get(id)!.texture,
    uv(id, move, dir, frame) {
      if (options.moves?.[id] && !options.moves[id].includes(move)) throw new Error(`Move ${move} fehlt für ${id}`);
      const page = pages.get(id)!, key = `${move}|${dir}|${frame}`;
      const cached = page.cells.get(key);
      if (cached) return cached;
      const { rows, capacity } = page, index = page.next++ % capacity;
      page.cells.delete(page.keys[index]); page.keys[index] = key;
      let frames = poses.get(move);
      if (!frames) { frames = moveFrames(move); poses.set(move, frames); }
      page.image.data.set(rasterPose(project(frames[frame], dir), page.look, dir));
      page.context.putImageData(page.image, index % cols * CELL_W, Math.floor(index / cols) * CELL_H);
      page.texture.needsUpdate = true;
      const uv: [number, number, number, number] = [index % cols / cols, 1 - (Math.floor(index / cols) + 1) / rows, 1 / cols, 1 / rows];
      page.cells.set(key, uv);
      return uv;
    } };
}
