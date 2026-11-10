import * as THREE from "three";
import type { Dir } from "../figure/skeleton";
import { MOVES, type MoveId } from "../figure/moves";
import { CELL_H, CELL_W, FEET_ROW, PX_PER_M } from "../figure/raster";
import type { Atlas } from "../figure/atlas";

export interface ActorView { id: string; x: number; y: number; z: number; facing: number; move: MoveId; moveT: number; visible: boolean }

/** Blickrichtung der Figur relativ zur Kamera → eines der 4 Sprite-Bilder. facing/cameraYaw in rad, 0 = Richtung −z. */
export function spriteDir(facing: number, cameraYaw: number): Dir {
  const rel = Math.atan2(Math.sin(facing - cameraYaw), Math.cos(facing - cameraYaw)); // 0 = schaut von der Kamera weg
  const q = Math.round(rel / (Math.PI / 2));
  return q === 0 ? "back" : q === 1 ? "right" : q === -1 ? "left" : "front";
}

export function frameAt(move: MoveId, moveT: number): number {
  const m = MOVES[move];
  const f = Math.floor((Math.max(0, moveT) + 1e-10) * m.fps);
  return m.loop ? f % m.frames : Math.min(f, m.frames - 1);
}

export function createActors(scene: THREE.Scene, atlas: Atlas, ids: string[]): { sync(views: ActorView[], cameraYaw: number): void; dispose(): void } {
  const sprites = new Map<string, { sprite: THREE.Sprite; shadow: THREE.Mesh; tex: THREE.Texture }>();
  for (const id of ids) {
    const tex = atlas.texture.clone();
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, alphaTest: 0.5 }));
    sprite.center.set(0.5, (CELL_H - FEET_ROW) / CELL_H);
    sprite.scale.set(CELL_W / PX_PER_M, CELL_H / PX_PER_M, 1);
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.4, 16),
      new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.35, depthWrite: false }),
    );
    shadow.rotation.x = -Math.PI / 2;
    scene.add(sprite, shadow);
    sprites.set(id, { sprite, shadow, tex });
  }
  return {
    sync(views, cameraYaw) {
      for (const v of views) {
        const s = sprites.get(v.id);
        if (!s) continue;
        s.sprite.visible = s.shadow.visible = v.visible;
        s.sprite.position.set(v.x, v.y, v.z);
        s.shadow.position.set(v.x, 0.01, v.z);
        const [ox, oy, rx, ry] = atlas.uv(v.id, v.move, spriteDir(v.facing, cameraYaw), frameAt(v.move, v.moveT));
        s.tex.offset.set(ox, oy);
        s.tex.repeat.set(rx, ry);
      }
    },
    dispose() {
      for (const { sprite, shadow, tex } of sprites.values()) {
        scene.remove(sprite, shadow);
        sprite.material.dispose();
        shadow.geometry.dispose();
        (shadow.material as THREE.Material).dispose();
        tex.dispose();
      }
    },
  };
}
