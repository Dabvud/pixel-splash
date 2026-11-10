export interface P3 { x: number; y: number; z: number }

const DURATION = 0.4;
const RIM_Y = 3.05;
const RIM_R = 0.23;

/** Streckung (sy, am oberen Rand verankert) und seitlicher Versatz des Netzes nach einem Treffer. strength: 1,5 Swish, 1,25 Treffer mit Ring, 1 nur Wackeln. */
export function netPose(ageS: number, strength: number): { sy: number; dx: number } {
  if (ageS < 0 || ageS > DURATION) return { sy: 1, dx: 0 };
  const p = ageS / DURATION;
  const sy = 1 + (strength - 1) * Math.sin(Math.PI * p);
  const dx = strength >= 1.5 ? 0 : 0.04 * Math.sin(p * 4 * Math.PI + 0.6) * (1 - p);
  return { sy, dx };
}

const horiz = (p: P3) => Math.hypot(p.x, p.z);
const atRim = (p: P3) => horiz(p) < 0.42 && horiz(p) >= RIM_R && Math.abs(p.y - RIM_Y) < 0.12;

/** Erkennt aus zwei aufeinanderfolgenden Ballpositionen, ob der Ball durchs Netz fällt oder den Ring berührt. */
export function netHit(prev: P3, cur: P3): number | null {
  if (prev.y >= RIM_Y - 0.05 && cur.y < RIM_Y - 0.05 && horiz(cur) < RIM_R) return horiz(cur) < 0.08 ? 1.5 : 1.25;
  if (atRim(cur) && !atRim(prev)) return 1;
  return null;
}
