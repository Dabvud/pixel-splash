import type { Outcome } from './resolve';
import { RIM, buildFlight, targetPoint, withBoardCollision } from './trajectory';
import type { Flight, Vec3 } from './trajectory';

export function buildFinishFlight(kind: 'layup' | 'dunk' | 'contact_dunk', outcome: Outcome,
  release: Vec3, rimContactS: number, context?: { from?: Vec3; block?: Vec3 }): Flight {
  const start = { ...release };
  const made = outcome === 'swish' || outcome === 'rim_in' || outcome === 'roll_in' || outcome === 'bank_in';
  if (!made && (kind !== 'layup' || ['airball', 'board', 'rim_back'].includes(outcome))) {
    return reboundFlight(start, outcome, kind === 'layup' ? .45 : rimContactS, context, kind === 'layup');
  }
  if (kind === 'layup') {
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
  const ground = 0.12;
  const bounceDuration = 0.3;
  const fallDuration = .45;
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
          x: contact.x,
          y: contact.y + (ground - contact.y) * (falling / fallDuration) ** 2,
          z: contact.z,
        };
      }
      const bouncing = t - landingTime;
      const progress = bouncing / bounceDuration;
      return {
        x: contact.x,
        y: ground + 4 * 0.24 * progress * (1 - progress),
        z: contact.z,
      };
    },
  });
}

function reboundFlight(start: Vec3, outcome: Outcome, arcEnd: number,
  context?: { from?: Vec3; block?: Vec3 }, layup = false): Flight {
  const from = context?.from ?? start, len = Math.hypot(from.x, from.z);
  const ux = from.x / (len || 1), uz = len ? from.z / len : 1;
  const block = context?.block;
  const late = outcome === 'rim_back' || outcome === 'board';
  const contact = block ? { ...block } : outcome === 'board' ? targetPoint('board', from)
    : targetPoint(outcome === 'airball' ? 'rim_front' : outcome, from);
  // Späte Versuche bleiben hinter dem Ring bzw. direkt am Brett. Blockbälle
  // fallen ohne Aufwärtsimpuls von der Hand auf die Seite des Angreifers.
  const speed = block ? 1.8 : late ? (outcome === 'board' ? 0 : .15) : 1.6;
  const vx = (late && !block ? -1 : 1) * ux * speed;
  const vz = (late && !block ? -1 : 1) * uz * speed;
  const vy = block ? 0 : 2.45, gravity = 9.81, ground = .12, bounceS = .3;
  const fallS = (vy + Math.sqrt(vy ** 2 + 2 * gravity * (contact.y - ground))) / gravity;
  const landing = arcEnd + fallS, duration = landing + bounceS;
  const height = Math.max(start.y, contact.y) + .4;
  return withBoardCollision({ arcEnd, duration, at(time) {
    const t = Math.max(0, Math.min(duration, time));
    if (t === 0) return { ...start };
    if (t === arcEnd) return { ...contact };
    if (t <= arcEnd) {
      const p = t / arcEnd;
      return { x: start.x + (contact.x - start.x) * p,
        y: layup ? height - ((1 - p) * Math.sqrt(height - start.y) - p * Math.sqrt(height - contact.y)) ** 2
          : start.y + (contact.y - start.y) * p, z: start.z + (contact.z - start.z) * p };
    }
    const falling = Math.min(t - arcEnd, fallS), bouncing = Math.max(0, t - landing);
    return { x: contact.x + vx * (falling + bouncing), z: contact.z + vz * (falling + bouncing),
      y: t < landing ? Math.max(ground, contact.y + vy * falling - gravity * falling ** 2 / 2)
        : ground + 4 * .24 * (bouncing / bounceS) * (1 - bouncing / bounceS) };
  } });
}
