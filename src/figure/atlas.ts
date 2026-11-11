import * as THREE from "three";
import { project, type Dir } from "./skeleton";
import { MOVES, moveFrames, type MoveId } from "./moves";
import { CELL_H, CELL_W, rasterPose, type Look } from "./raster";

export const DIRS: readonly Dir[] = ["front", "back", "left", "right"];
const COLS = 128; // 128 × 32 = 4096; maximal 64 Reihen à 64 Pixel
const MAX_CELLS = COLS * Math.floor(4096 / CELL_H);

export interface Atlas {
  texture: THREE.CanvasTexture;
  textures?: THREE.CanvasTexture[];
  textureFor?(id: string): THREE.CanvasTexture;
  /** [offsetX, offsetY, repeatX, repeatY] für texture.offset/repeat */
  uv(id: string, move: MoveId, dir: Dir, frame: number): [number, number, number, number];
}

// Alle Bilder aller Figuren einmal vorab rastern; im Spiel wird nur der Ausschnitt gewechselt
export function buildAtlas(looks: Record<string, Look>): Atlas {
  const moves = Object.keys(MOVES) as MoveId[];
  const cellsPerActor = moves.reduce((sum, m) => sum + MOVES[m].frames * DIRS.length, 0);
  const actorsPerPage = Math.floor(MAX_CELLS / cellsPerActor);
  if (actorsPerPage < 1) throw new Error('Eine Figur überschreitet die Atlas-Grenze');
  const ids = Object.keys(looks), pageOf = new Map(ids.map((id, i) => [id, Math.floor(i / actorsPerPage)]));
  const textures: THREE.CanvasTexture[] = [], pages: Atlas[] = [];
  if (ids.length > actorsPerPage) {
    for (let i = 0; i < ids.length; i += actorsPerPage) {
      const page = buildAtlas(Object.fromEntries(ids.slice(i, i + actorsPerPage).map(id => [id, looks[id]])));
      pages.push(page); textures.push(page.texture);
    }
    return { texture: textures[0], textures,
      textureFor: id => textures[pageOf.get(id) ?? 0],
      uv: (id, move, dir, frame) => pages[pageOf.get(id) ?? 0].uv(id, move, dir, frame) };
  }
  const index = new Map<string, number>();
  let n = 0;
  for (const id of Object.keys(looks)) for (const m of moves) for (const d of DIRS) for (let f = 0; f < MOVES[m].frames; f++) index.set(`${id}|${m}|${d}|${f}`, n++);
  const rows = Math.max(1, Math.ceil(n / COLS));
  const canvas = document.createElement("canvas");
  canvas.width = COLS * CELL_W;
  canvas.height = rows * CELL_H;
  const g = canvas.getContext("2d")!;
  const img = g.createImageData(CELL_W, CELL_H);
  for (const [id, look] of Object.entries(looks))
    for (const m of moves) {
      const poses = moveFrames(m);
      for (const d of DIRS)
        poses.forEach((pose, f) => {
          const i = index.get(`${id}|${m}|${d}|${f}`)!;
          img.data.set(rasterPose(project(pose, d), look, d));
          g.putImageData(img, (i % COLS) * CELL_W, Math.floor(i / COLS) * CELL_H);
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
      const i = index.get(`${id}|${move}|${dir}|${frame}`) ?? 0;
      // Textur-v läuft von unten, die Leinwand von oben
      return [(i % COLS) / COLS, 1 - (Math.floor(i / COLS) + 1) / rows, 1 / COLS, 1 / rows];
    },
  };
}
