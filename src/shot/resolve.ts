export type Outcome = 'swish' | 'rim_in' | 'roll_in' | 'roll_out' | 'rim_front' | 'rim_back'
  | 'rim_left' | 'rim_right' | 'airball' | 'board' | 'wide_left' | 'wide_right' | 'bank_in';
export interface ShotInput { holdMs: number; angleDeg: number }
export interface ShotParams {
  meterMs: number; greenZone: number; aimDeg: number;
  rating: number; influence: number; distance: number;
  zoneFactor?: number;
  bankAngleDeg?: number;
}
export interface Zones { g: number; a: number }
export interface BankWindow { lo: number; hi: number }
export interface ShotResult {
  outcome: Outcome; made: boolean; fill: number; t: number; r: number; F: number;
  banner: string; hint: string;
}
export const MAX_FILL = 1.6;

const BANNERS: Record<Outcome, string> = {
  swish: 'SWISH', rim_in: 'TREFFER', roll_in: 'RINGTANZ – DRIN', roll_out: 'RINGTANZ – RAUS',
  rim_front: 'RING VORNE', rim_back: 'RING HINTEN', rim_left: 'RING LINKS', rim_right: 'RING RECHTS',
  airball: 'AIRBALL', board: 'BRETT', wide_left: 'LINKS VORBEI', wide_right: 'RECHTS VORBEI',
  bank_in: 'BRETT – DRIN',
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

export function bankWidth(phiDeg: number): number {
  const phi = Math.abs(phiDeg);
  if (phi <= 10) return .5;
  if (phi < 20) return .5 + (phi - 10) / 20;
  if (phi <= 60) return 1;
  return Math.max(0, (75 - phi) / 15);
}

// Füllstand-Einheiten: dieselben Grenzen für HUD und Auswertung.
export function bankWindow(p: ShotParams): BankWindow | null {
  const w = p.bankAngleDeg === undefined ? 0 : bankWidth(p.bankAngleDeg);
  if (w <= 0) return null;
  const { g } = effectiveZones(p);
  return { lo: 1 + (1.5 - .3 * w) * g, hi: 1 + (1.5 + .3 * w) * g };
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
  const window = bankWindow(p);
  const epsilon = 4 * Number.EPSILON;
  let outcome: Outcome;
  if (window && fill >= window.lo - epsilon && fill <= window.hi + epsilon && Math.abs(r) <= .6) outcome = 'bank_in';
  else if (F <= 0.5) outcome = 'swish';
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
    outcome, made: outcome === 'swish' || outcome === 'rim_in' || outcome === 'roll_in' || outcome === 'bank_in',
    fill, t, r, F, banner: BANNERS[outcome], hint: feedback(t, r),
  };
}
