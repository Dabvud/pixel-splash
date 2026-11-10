import type { Vec2 } from './position';

export interface ScreenTarget { id: string; x: number; y: number; distM: number }

export function swipeAngleTo(origin: { x: number; y: number }, target: { x: number; y: number },
  swipe: { dx: number; dy: number }): number {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  return Math.atan2(dx * swipe.dy - dy * swipe.dx, dx * swipe.dx + dy * swipe.dy) * 180 / Math.PI;
}

export function pickTarget(origin: { x: number; y: number }, swipe: { dx: number; dy: number },
  targets: ScreenTarget[]): string | null {
  if (Math.hypot(swipe.dx, swipe.dy) === 0) return null;
  const candidates = targets.filter((target) => target.x !== origin.x || target.y !== origin.y)
    .map((target) => ({ target, angle: swipeAngleTo(origin, target, swipe) }))
    .filter(({ angle }) => Math.abs(angle) <= 45)
    .sort((a, b) => Math.abs(a.angle) - Math.abs(b.angle));
  const best = candidates[0];
  if (!best) return null;
  // Eng benachbarte Richtungen müssen auch im Hochformat unterscheidbar bleiben.
  return candidates.filter(({ angle }) => Math.abs(angle - best.angle) < 15)
    .sort((a, b) => a.target.distM - b.target.distM)[0].target.id;
}

export function laneFromAngle(deg: number): -1 | 0 | 1 {
  return deg < -8 ? -1 : deg > 8 ? 1 : 0;
}

export function stealChance(from: Vec2, to: Vec2, defenders: Vec2[]): number {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const lengthSquared = dx * dx + dz * dz;
  let distance = Infinity;
  for (const defender of defenders) {
    const projection = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1,
      ((defender.x - from.x) * dx + (defender.z - from.z) * dz) / lengthSquared));
    distance = Math.min(distance,
      Math.hypot(defender.x - from.x - projection * dx, defender.z - from.z - projection * dz));
  }
  return distance < 0.5 ? 0.6 : distance < 1 ? 0.2 : 0;
}

export function passTime(distM: number): number {
  return 0.25 + 0.06 * distM;
}
