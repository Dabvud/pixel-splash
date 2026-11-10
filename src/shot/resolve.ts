export type Outcome = 'swish' | 'rim_in' | 'roll_in' | 'roll_out' | 'rim_front' | 'rim_back'
  | 'rim_left' | 'rim_right' | 'airball' | 'board' | 'wide_left' | 'wide_right';
export interface ShotInput { holdMs: number; angleDeg: number }
export interface ShotParams {
  meterMs: number; greenZone: number; aimDeg: number;
  rating: number; influence: number; distance: number;
  zoneFactor?: number;
}
export interface Zones { g: number; a: number }
export interface ShotResult {
  outcome: Outcome; made: boolean; fill: number; t: number; r: number; F: number;
  banner: string; hint: string;
}
export const MAX_FILL = 1.6;

const BANNERS: Record<Outcome, string> = {
  swish: 'SWISH', rim_in: 'TREFFER', roll_in: 'RINGTANZ – DRIN', roll_out: 'RINGTANZ – RAUS',
  rim_front: 'RING VORNE', rim_back: 'RING HINTEN', rim_left: 'RING LINKS', rim_right: 'RING RECHTS',
  airball: 'AIRBALL', board: 'BRETT', wide_left: 'LINKS VORBEI', wide_right: 'RECHTS VORBEI',
};

export function statFactor(rating: number, influence: number): number {
  return 1 + influence * (rating - 0.5) * 1.6;
}

export function distanceFactor(distance: number): number {
  return Math.max(0.8, Math.min(1, 1 - 0.04 * (distance - 4.6)));
}

export function effectiveZones(p: ShotParams): Zones {
  const factor = statFactor(p.rating, p.influence) * distanceFactor(p.distance) * (p.zoneFactor ?? 1);
  return { g: p.greenZone * factor, a: p.aimDeg * factor };
}

export function feedback(t: number, r: number): string {
  const timing = Math.abs(t) <= 1 ? 'perfekt'
    : `${Math.abs(t) <= 2 ? 'etwas' : 'viel'} zu ${t < 0 ? 'früh' : 'spät'}`;
  if (Math.abs(r) <= 1) return timing;
  return `${timing} · ${Math.abs(r) <= 2 ? 'leicht' : 'weit'} ${r < 0 ? 'links' : 'rechts'}`;
}

export function resolveShot(input: ShotInput, p: ShotParams, rng: () => number = Math.random): ShotResult {
  const { g, a } = effectiveZones(p);
  const fill = Math.min(input.holdMs / p.meterMs, MAX_FILL);
  // Algebraisch gleich, ohne Rundungsfehler durch Subtraktion nahe Füllstand eins.
  const t = (Math.min(input.holdMs, p.meterMs * MAX_FILL) - p.meterMs) / (p.meterMs * g);
  const r = input.angleDeg / a;
  const F = Math.hypot(t, r);
  let outcome: Outcome;
  if (F <= 0.5) outcome = 'swish';
  else if (F <= 1) outcome = 'rim_in';
  else if (F <= 1.3) outcome = rng() < 0.5 ? 'roll_in' : 'roll_out';
  else if (F <= 2) {
    outcome = Math.abs(t) >= Math.abs(r)
      ? (t < 0 ? 'rim_front' : 'rim_back') : (r < 0 ? 'rim_left' : 'rim_right');
  } else {
    outcome = Math.abs(t) >= Math.abs(r)
      ? (t < 0 ? 'airball' : 'board') : (r < 0 ? 'wide_left' : 'wide_right');
  }
  return {
    outcome, made: outcome === 'swish' || outcome === 'rim_in' || outcome === 'roll_in',
    fill, t, r, F, banner: BANNERS[outcome], hint: feedback(t, r),
  };
}
