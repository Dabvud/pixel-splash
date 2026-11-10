import * as THREE from "three";
import type { Vec3 } from "../shot/trajectory";

const SKIN = "#8d5a3b";
const DIGITS: Record<string, string[]> = {
  2: ["111", "001", "111", "100", "111"],
  3: ["111", "001", "111", "001", "111"],
};

// Platzhalter-Werfer (rot, Nr. 23) als Pixel-Sprite von hinten, Posen „bereit“ und „Wurf“.
export function createPlayer(scene: THREE.Scene): {
  setSpot(x: number, z: number): void;
  setPose(p: "ready" | "shoot"): void;
  handPos(): Vec3;
} {
  const tex = { ready: figure(false), shoot: figure(true) };
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex.ready, alphaTest: 0.5 }));
  sprite.center.set(0.5, 0);
  sprite.scale.set((2.2 * 22) / 38, 2.2, 1);
  scene.add(sprite);
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.4, 16),
    new THREE.MeshBasicMaterial({ color: 0, transparent: true, opacity: 0.35, depthWrite: false }),
  );
  shadow.rotation.x = -Math.PI / 2;
  scene.add(shadow);

  let pose: "ready" | "shoot" = "ready";
  return {
    setSpot(x, z) {
      sprite.position.set(x, 0, z);
      shadow.position.set(x, 0.01, z);
    },
    setPose(p) {
      pose = p;
      sprite.material.map = tex[p];
    },
    handPos() {
      const { x, z } = sprite.position;
      const len = Math.hypot(x, z) || 1;
      const u = { x: x / len, z: z / len }; // Ring → Werfer
      const right = { x: u.z, z: -u.x }; // rechts aus Werfersicht
      return pose === "shoot"
        ? { x: x + right.x * 0.05 - u.x * 0.05, y: 2.45, z: z + right.z * 0.05 - u.z * 0.05 }
        : { x: x + right.x * 0.36 - u.x * 0.1, y: 1.0, z: z + right.z * 0.36 - u.z * 0.1 };
    },
  };
}

function figure(armsUp: boolean): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 20;
  c.height = 36;
  const g = c.getContext("2d")!;
  const r = (x: number, y: number, w: number, h: number, col: string) => {
    g.fillStyle = col;
    g.fillRect(x, y, w, h);
  };
  const jersey = "#c8322b";
  r(7, 1, 6, 7, SKIN);
  r(7, 0, 6, 6, "#1b1410");
  r(8, 8, 4, 1, SKIN);
  r(5, 9, 10, 11, jersey);
  r(5, 9, 1, 2, SKIN);
  r(14, 9, 1, 2, SKIN);
  [..."23"].forEach((d, i) =>
    DIGITS[d].forEach((row, y) => [...row].forEach((b, x) => b === "1" && r(6 + i * 4 + x, 11 + y, 1, 1, "#fff"))),
  );
  if (armsUp) {
    r(3, 0, 2, 10, SKIN);
    r(15, 0, 2, 10, SKIN);
  } else {
    r(3, 10, 2, 10, SKIN);
    r(15, 10, 2, 10, SKIN);
  }
  r(5, 20, 10, 7, "#9e241f");
  g.clearRect(9, 25, 2, 2);
  r(6, 27, 3, 4, SKIN);
  r(11, 27, 3, 4, SKIN);
  r(6, 31, 3, 2, "#eee");
  r(11, 31, 3, 2, "#eee");
  r(5, 33, 4, 3, "#222");
  r(11, 33, 4, 3, "#222");

  // 1-Pixel-Umriss wie bei klassischen Sprites
  const o = document.createElement("canvas");
  o.width = 22;
  o.height = 38;
  const q = o.getContext("2d")!;
  q.drawImage(c, 1, 1);
  const d = q.getImageData(0, 0, 22, 38);
  const src = new Uint8ClampedArray(d.data);
  const opaque = (x: number, y: number) => x >= 0 && y >= 0 && x < 22 && y < 38 && src[(y * 22 + x) * 4 + 3] > 0;
  for (let y = 0; y < 38; y++)
    for (let x = 0; x < 22; x++) {
      const i = (y * 22 + x) * 4;
      if (src[i + 3]) continue;
      if (opaque(x + 1, y) || opaque(x - 1, y) || opaque(x, y + 1) || opaque(x, y - 1)) d.data.set([24, 16, 20, 255], i);
    }
  q.putImageData(d, 0, 0);
  const t = new THREE.CanvasTexture(o);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  return t;
}
