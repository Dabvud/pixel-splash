import * as THREE from "three";
import { project, type Dir } from "./skeleton";
import { MOVES, moveFrames, type MoveId } from "./moves";
import { CELL_H, CELL_W, rasterPose, type Look } from "./raster";

export const DIRS: readonly Dir[] = ["front", "back", "left", "right"];
const COLS = 64;

export interface Atlas {
  texture: THREE.CanvasTexture;
  /** [offsetX, offsetY, repeatX, repeatY] für texture.offset/repeat */
  uv(id: string, move: MoveId, dir: Dir, frame: number): [number, number, number, number];
}

// Alle Bilder aller Figuren einmal vorab rastern; im Spiel wird nur der Ausschnitt gewechselt
export function buildAtlas(looks: Record<string, Look>): Atlas {
  const moves = Object.keys(MOVES) as MoveId[];
  const index = new Map<string, number>();
  let n = 0;
  for (const id of Object.keys(looks)) for (const m of moves) for (const d of DIRS) for (let f = 0; f < MOVES[m].frames; f++) index.set(`${id}|${m}|${d}|${f}`, n++);
  const rows = Math.ceil(n / COLS);
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
    uv(id, move, dir, frame) {
      const i = index.get(`${id}|${move}|${dir}|${frame}`) ?? 0;
      // Textur-v läuft von unten, die Leinwand von oben
      return [(i % COLS) / COLS, 1 - (Math.floor(i / COLS) + 1) / rows, 1 / COLS, 1 / rows];
    },
  };
}
