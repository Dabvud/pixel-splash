import type { Outcome } from './resolve';

export interface Vec3 { x: number; y: number; z: number }
export const RIM: Vec3 = { x: 0, y: 3.05, z: 0 };
export interface Flight { duration: number; arcEnd: number; at(time: number): Vec3 }

export function targetPoint(outcome: Outcome, from: Vec3): Vec3 {
  const distance = Math.hypot(from.x, from.z);
  const ux = from.x / distance;
  const uz = from.z / distance;
  switch (outcome) {
    case 'swish': return { ...RIM };
    case 'rim_in':
    case 'roll_in':
    case 'roll_out':
    case 'rim_front': return { x: ux * 0.23, y: RIM.y, z: uz * 0.23 };
    case 'rim_back': return { x: -ux * 0.23, y: RIM.y, z: -uz * 0.23 };
    case 'rim_left': return { x: -uz * 0.23, y: RIM.y, z: ux * 0.23 };
    case 'rim_right': return { x: uz * 0.23, y: RIM.y, z: -ux * 0.23 };
    case 'board': return { x: 0, y: 3.45, z: -0.35 };
    case 'airball': return { x: ux * 0.9, y: 2.4, z: uz * 0.9 };
    case 'wide_left': return { x: -uz * 0.7, y: RIM.y, z: ux * 0.7 };
    case 'wide_right': return { x: uz * 0.7, y: RIM.y, z: -ux * 0.7 };
  }
}

function parabola(from: Vec3, to: Vec3, height: number, progress: number): Vec3 {
  if (progress <= 0) return { ...from };
  if (progress >= 1) return { ...to };
  const rise = Math.sqrt(height - from.y);
  const fall = Math.sqrt(height - to.y);
  return {
    x: from.x + (to.x - from.x) * progress,
    y: height - ((1 - progress) * rise - progress * fall) ** 2,
    z: from.z + (to.z - from.z) * progress,
  };
}

export function buildFlight(outcome: Outcome, from: Vec3): Flight {
  const start = { ...from };
  const target = targetPoint(outcome, start);
  const distance = Math.hypot(start.x, start.z);
  const arcEnd = Math.max(0.9, Math.min(1.2, 0.9 + 0.05 * distance));
  const height = Math.max(start.y, RIM.y) + 1 + 0.15 * distance;
  const made = outcome === 'swish' || outcome === 'rim_in' || outcome === 'roll_in';
  const rollDuration = made && outcome !== 'swish' ? 0.18 : 0;
  const ground = 0.12;
  const gravity = 9.81;
  const bounceDuration = 0.3;
  let vx = 0;
  let vz = 0;
  let vy = 0;

  if (!made) {
    if (outcome === 'airball' || outcome === 'wide_left' || outcome === 'wide_right') {
      vx = (target.x - start.x) / arcEnd;
      vz = (target.z - start.z) / arcEnd;
      const rise = Math.sqrt(height - start.y);
      const fall = Math.sqrt(height - target.y);
      vy = -2 * (rise + fall) * fall / arcEnd;
    } else {
      const direction = outcome === 'board'
        ? { x: start.x - target.x, z: start.z - target.z } : target;
      const length = Math.hypot(direction.x, direction.z);
      vx = direction.x / length * 1.6;
      vz = direction.z / length * 1.6;
      // Nach einer halben Sekunde geht der Abpraller in den Fall über.
      vy = gravity * 0.5 / 2;
    }
  }

  const fallDuration = made ? 0.45
    : (vy + Math.sqrt(vy ** 2 + 2 * gravity * (target.y - ground))) / gravity;
  const landingTime = arcEnd + rollDuration + fallDuration;
  const duration = landingTime + bounceDuration;
  const landing = { x: made ? RIM.x : target.x + vx * fallDuration, y: ground,
    z: made ? RIM.z : target.z + vz * fallDuration };

  return {
    duration,
    arcEnd,
    at(time: number): Vec3 {
      const t = Math.max(0, Math.min(duration, time));
      if (t <= arcEnd) return parabola(start, target, height, t / arcEnd);
      const afterArc = t - arcEnd;
      if (afterArc < rollDuration) {
        return parabola(target, RIM, RIM.y + 0.12, afterArc / rollDuration);
      }
      if (t < landingTime) {
        const falling = afterArc - rollDuration;
        if (made) {
          return { x: RIM.x, y: RIM.y + (ground - RIM.y) * (falling / fallDuration) ** 2, z: RIM.z };
        }
        return {
          x: target.x + vx * falling,
          y: Math.max(ground, target.y + vy * falling - gravity * falling ** 2 / 2),
          z: target.z + vz * falling,
        };
      }
      const bouncing = t - landingTime;
      const progress = bouncing / bounceDuration;
      return {
        x: landing.x + vx * bouncing,
        y: ground + 4 * 0.24 * progress * (1 - progress),
        z: landing.z + vz * bouncing,
      };
    },
  };
}
