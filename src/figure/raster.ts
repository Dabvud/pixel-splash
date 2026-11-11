import type { Dir, Joint } from "./skeleton";

export interface Look {
  heightM: number;
  build: "slim" | "normal" | "broad";
  skin: string;
  hair: "short" | "bald" | "afro" | "cornrows" | "dreads" | "flattop" | "buzz";
  beard?: "none" | "stubble" | "full" | "goatee";
  headband?: string | null;
  armSleeve?: "none" | "left" | "right";
  shoes?: string;
  socks?: "low" | "high";
  jersey: string;
  shorts: string;
  num: number;
  /** Farbe senkrechter Trikotstreifen (Schiri), jede zweite Pixelspalte */
  stripes?: string;
}
export type Projected = Record<Joint, { u: number; v: number; depth: number }>;

export const CELL_W = 32;
export const CELL_H = 64; // 4 m Bildhöhe: Platz für Sprünge und gestreckte Arme beim Dunk
export const PX_PER_M = 16;
export const FEET_ROW = CELL_H - 2;

const OUTLINE = [24, 16, 20];
const DIGITS: Record<string, string[]> = {
  0: ["111", "101", "101", "101", "111"], 1: ["010", "110", "010", "010", "111"],
  2: ["111", "001", "111", "100", "111"], 3: ["111", "001", "111", "001", "111"],
  4: ["101", "101", "111", "001", "001"], 5: ["111", "100", "111", "001", "111"],
  6: ["111", "100", "111", "101", "111"], 7: ["111", "001", "010", "010", "010"],
  8: ["111", "101", "111", "101", "111"], 9: ["111", "101", "111", "001", "111"],
};
const BUILD = { slim: 0.85, normal: 1, broad: 1.18 };

function rgb(hex: string): number[] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const shade = (c: number[], f: number) => c.map((v) => Math.round(v * f));

// Pose (in Körpergrößen, v nach oben) → RGBA-Pixelbild mit 1-px-Umriss
export function rasterPose(p: Projected, look: Look, dir: Dir, w = CELL_W, h = CELL_H): Uint8ClampedArray {
  const buf = new Uint8ClampedArray(w * h * 4);
  const s = PX_PER_M * look.heightM; // Pixel pro Körpergröße
  const X = (u: number) => w / 2 + u * s;
  const Y = (v: number) => FEET_ROW - v * s;
  const set = (x: number, y: number, c: number[]) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 1 || y < 1 || x >= w - 1 || y >= h - 1) return;
    buf.set([c[0], c[1], c[2], 255], (y * w + x) * 4);
  };
  const stamp = (x: number, y: number, t: number, c: number[]) => {
    const o = (t - 1) / 2;
    for (let dy = 0; dy < t; dy++) for (let dx = 0; dx < t; dx++) set(x - o + dx, y - o + dy, c);
  };
  const line = (a: { u: number; v: number }, b: { u: number; v: number }, t: number, c: number[]) => {
    const x0 = X(a.u), y0 = Y(a.v), x1 = X(b.u), y1 = Y(b.v);
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    for (let i = 0; i <= n; i++) stamp(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, t, c);
  };
  // Waagerechtes Band entlang einer Linie: Rumpf ohne Überstand nach oben/unten (sonst verschwinden Hals und Beine)
  const band = (a: { u: number; v: number }, b: { u: number; v: number }, width: number, c: number[], alt?: number[]) => {
    const x0 = X(a.u), y0 = Y(a.v), x1 = X(b.u), y1 = Y(b.v);
    const n = Math.max(1, Math.ceil(Math.abs(y1 - y0)));
    for (let i = 0; i <= n; i++) {
      const cx = x0 + ((x1 - x0) * i) / n, cy = y0 + ((y1 - y0) * i) / n;
      for (let dx = 0; dx < width; dx++) {
        const x = cx - (width - 1) / 2 + dx;
        set(x, cy, alt && Math.round(x) % 2 ? alt : c);
      }
    }
  };
  const mid = (a: { u: number; v: number }, b: { u: number; v: number }, f = 0.5) => ({ u: a.u + (b.u - a.u) * f, v: a.v + (b.v - a.v) * f });

  const skin = rgb(look.skin), jersey = rgb(look.jersey), shorts = rgb(look.shorts);
  const shoes = rgb(look.shoes ?? "#222226");
  const side = dir === "left" || dir === "right";
  const bw = BUILD[look.build];
  const limb = look.heightM * bw > 2.2 ? 3 : 2;

  const leg = (L: "L" | "R", far: boolean) => {
    const hip = p[`hip${L}`], kn = p[`kn${L}`], ft = p[`ft${L}`];
    const f = far ? 0.8 : 1;
    line(hip, kn, limb + 1, shade(skin, f));
    line(kn, ft, limb, shade(skin, f));
    line(hip, mid(hip, kn, 0.55), limb + 2, shade(shorts, f)); // Hosenbein
    line(mid(kn, ft, look.socks === "high" ? 0.25 : 0.75), ft, limb, shade([238, 238, 238], f)); // Socke
    const fx = X(ft.u), fy = Y(ft.v);
    const toe = side ? (dir === "right" ? 1 : -1) : 0;
    for (let dx = -1; dx <= 1; dx++) for (let dy = 0; dy < 2; dy++) set(fx + dx + toe, fy + dy, shade(shoes, f));
  };
  const arm = (L: "L" | "R", far: boolean) => {
    const f = far ? 0.8 : 1;
    line(p[`sh${L}`], p[`el${L}`], limb, shade(skin, f));
    line(p[`el${L}`], p[`ha${L}`], limb, shade(skin, f));
    if (look.armSleeve === (L === "L" ? "left" : "right")) {
      line(p[`sh${L}`], p[`el${L}`], limb, shade(jersey, f));
      line(p[`el${L}`], mid(p[`el${L}`], p[`ha${L}`], 0.8), limb, shade(jersey, f));
      stamp(X(p[`ha${L}`].u), Y(p[`ha${L}`].v), limb, shade(skin, f));
    }
  };

  // project liefert größere Tiefe zur Kamera hin; entfernte Gliedmaßen zuerst.
  const farL = p.shL.depth + p.hipL.depth < p.shR.depth + p.hipR.depth;
  const [far, near]: ("L" | "R")[] = farL ? ["L", "R"] : ["R", "L"];
  leg(far, side);
  if (side) arm(far, true);

  // Rumpf: dicke Linie Schultermitte → Becken, Breite aus Schulterabstand bzw. Statur
  const shMid = mid(p.shL, p.shR);
  const span = Math.abs(p.shL.u - p.shR.u) * s;
  const number = side || look.num < 0 ? '' : String(look.num);
  const numberWidth = number.length * 4 - 1; // 3 px je Ziffer, 1 px Zwischenraum
  // Die Nummer braucht beidseitig einen Trikotpixel Abstand zum Umriss.
  const tw = Math.max(Math.round(span - 1), Math.round((side ? 0.13 : 0.17) * s * bw), side ? 0 : numberWidth + 2);
  line(p.neck, shMid, limb, skin);
  band(shMid, p.pelvis, tw, jersey, look.stripes ? rgb(look.stripes) : undefined);
  band(p.pelvis, mid(mid(p.hipL, p.hipR), mid(p.knL, p.knR), 0.25), tw, shorts);

  // Kopf
  const hr = Math.max(3, 0.078 * s);
  const hx = X(p.head.u), hy = Y(p.head.v);
  const hair = [27, 20, 16];
  const R = look.hair === "afro" ? hr + 1.2 : hr;
  const facing = dir === "right" ? 1 : dir === "left" ? -1 : 0;
  if (look.hair === "dreads") {
    // Einzelne Strähnen hinter dem Gesicht, bis neben den Hals.
    for (const sign of [-1, 1]) {
      if (side && sign === facing) continue;
      for (let dy = -1; dy <= Math.ceil(hr) + 1; dy++) set(hx + sign * Math.round(hr), hy + dy, hair);
      for (let dy = -Math.ceil(hr); dy <= -1; dy++) set(hx + sign * 2, hy + dy, hair);
    }
  } else if (look.hair === "flattop") {
    for (let dy = -Math.ceil(hr) - 1; dy < -hr * 0.35; dy++)
      for (let dx = -Math.floor(hr * 0.8); dx <= Math.floor(hr * 0.8); dx++) set(hx + dx, hy + dy, hair);
  }
  for (let dy = -Math.ceil(R); dy <= Math.ceil(R); dy++)
    for (let dx = -Math.ceil(R); dx <= Math.ceil(R); dx++) {
      const d = Math.hypot(dx, dy);
      if (d > R) continue;
      let isHair = false;
      if (look.hair !== "bald") {
        if (d > hr) isHair = true;
        else if (dir === "back") isHair = dy < hr * 0.45;
        else if (dir === "front") isHair = dy < -hr * 0.35;
        else isHair = dy < -hr * 0.35 || (dir === "right" ? dx < -hr * 0.3 : dx > hr * 0.3) && dy < hr * 0.4;
      }
      if (look.hair === "buzz") {
        isHair = dir === "back" ? dy < hr * 0.3
          : dy < -hr * 0.65 || side && dx * facing < -hr * 0.5 && dy < hr * 0.15;
      }
      const hairShade = look.hair === "buzz" ? [63, 49, 40]
        : look.hair === "cornrows" && Math.abs(dx) % 2 === 1 ? [86, 59, 43] : hair;
      let color = isHair ? hairShade : skin;
      if (dir !== "back" && dy >= hr * 0.35 && (!side || dx * facing >= 0)) {
        if (look.beard === "full" || look.beard === "goatee" && Math.abs(dx - facing) < 0.75) color = hair;
        else if (look.beard === "stubble" && (dx + dy) % 2 === 0) color = [67, 47, 36];
      }
      set(hx + dx, hy + dy, color);
    }
  if (dir !== "back" && (look.beard === "full" || look.beard === "goatee")) {
    const halfWidth = look.beard === "full" ? 1 : 0;
    for (let dx = -halfWidth; dx <= halfWidth; dx++) set(hx + facing + dx, hy + Math.ceil(hr) + 1, hair);
  }
  if (look.headband) {
    const color = rgb(look.headband);
    for (let dx = -Math.floor(R); dx <= Math.floor(R); dx++)
      if (Math.hypot(dx, -1) <= R) set(hx + dx, hy - 1, color);
  }
  if (dir === "front") {
    set(hx - 1, hy, [17, 17, 17]);
    set(hx + 1, hy, [17, 17, 17]);
  } else if (side) set(hx + (dir === "right" ? 1 : -1) * Math.round(hr * 0.6), hy, [17, 17, 17]);

  leg(near, false);
  // Von vorne/hinten liegen beide Arme vor bzw. neben dem Rumpf
  if (!side) arm(far, false);
  arm(near, false);

  // Nummer auf Rücken bzw. Brust: Armstempel am Rumpfrand dürfen keine Spalte löschen.
  if (!side) {
    const c = mid(shMid, p.pelvis, 0.45);
    const x0 = Math.round(X(c.u) - (numberWidth - 1) / 2), y0 = Math.round(Y(c.v) - 2);
    [...number].forEach((d, i) => DIGITS[d].forEach((row, y) => [...row].forEach((b, x) => b === "1" && set(x0 + i * 4 + x, y0 + y, [255, 255, 255]))));
  }

  // 1-px-Umriss
  const src = new Uint8ClampedArray(buf);
  const op = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (op(x, y)) continue;
      if (op(x + 1, y) || op(x - 1, y) || op(x, y + 1) || op(x, y - 1)) buf.set([OUTLINE[0], OUTLINE[1], OUTLINE[2], 255], (y * w + x) * 4);
    }
  return buf;
}
