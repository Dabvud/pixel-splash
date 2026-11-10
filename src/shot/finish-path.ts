import type { Outcome } from './resolve';
import { RIM, buildFlight, targetPoint, withBoardCollision } from './trajectory';
import type { Flight, Vec3 } from './trajectory';

export function buildFinishFlight(kind: 'layup' | 'dunk' | 'contact_dunk', outcome: Outcome,
  release: Vec3, rimContactS: number): Flight {
  const start = { ...release };
  if (kind === 'layup') {
    const made = outcome === 'swish' || outcome === 'rim_in' || outcome === 'roll_in';
    const phi = Math.atan2(Math.abs(start.x), start.z) * 180 / Math.PI;
    if (made && phi >= 20) outcome = 'bank_in';
    const target = targetPoint(outcome, start);
    // Erst die vollständige kurze Bahn aufbauen, dann ihre Brett-Kollision lösen.
    // Eine bereits gespiegelte lange Bahn kann am Phasenwechsel einen Durchtritt verdecken.
    return buildFlight(outcome, start, {
      duration: .45,
      height: Math.max(start.y, target.y) + .4,
    });
  }

  const arcEnd = rimContactS;
  const contact = { ...RIM, y: RIM.y + 0.1 };
  const made = outcome === 'swish' || outcome === 'rim_in' || outcome === 'roll_in' || outcome === 'bank_in';
  const ground = 0.12;
  const gravity = 9.81;
  const bounceDuration = 0.3;
  const distance = Math.hypot(start.x - RIM.x, start.z - RIM.z);
  const vx = made ? 0 : (start.x - RIM.x) / (distance || 1) * 1.6;
  const vz = made ? 0 : (distance === 0 ? 1.6 : (start.z - RIM.z) / distance * 1.6);
  const vy = made ? 0 : gravity * 0.5 / 2;
  const fallDuration = made ? 0.45
    : (vy + Math.sqrt(vy ** 2 + 2 * gravity * (contact.y - ground))) / gravity;
  const landingTime = arcEnd + fallDuration;
  const duration = landingTime + bounceDuration;

  return withBoardCollision({
    arcEnd, duration,
    at(time: number): Vec3 {
      const t = Math.max(0, Math.min(duration, time));
      if (t === 0) return { ...start };
      if (t <= arcEnd) {
        const progress = t / arcEnd;
        return {
          x: start.x + (contact.x - start.x) * progress,
          y: start.y + (contact.y - start.y) * progress,
          z: start.z + (contact.z - start.z) * progress,
        };
      }
      const falling = Math.min(t - arcEnd, fallDuration);
      if (t < landingTime) {
        return {
          x: contact.x + vx * falling,
          y: made ? contact.y + (ground - contact.y) * (falling / fallDuration) ** 2
            : Math.max(ground, contact.y + vy * falling - gravity * falling ** 2 / 2),
          z: contact.z + vz * falling,
        };
      }
      const bouncing = t - landingTime;
      const progress = bouncing / bounceDuration;
      return {
        x: contact.x + vx * (fallDuration + bouncing),
        y: ground + 4 * 0.24 * progress * (1 - progress),
        z: contact.z + vz * (fallDuration + bouncing),
      };
    },
  });
}
