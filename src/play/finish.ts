import type { Vec2 } from './position';

export type ShotKind = 'jump2' | 'three' | 'layup' | 'dunk' | 'contact_dunk';

export function finishKind(athleticism: number, P: number, rng: () => number): 'layup' | 'dunk' | 'contact_dunk' {
  if (athleticism < 0.7) return 'layup';
  if (P >= 0.6) return 'dunk';
  const chance = Math.max(0, Math.min(1, 1.5 * (athleticism - 0.57)));
  return rng() < chance ? 'contact_dunk' : 'layup';
}

export function foulChance(kind: ShotKind, P: number, foulMult: number): number {
  const chance = kind === 'contact_dunk' ? 0.4
    : kind === 'three' ? 0.005 + 0.045 * (1 - P)
      : kind === 'jump2' ? 0.01 + 0.09 * (1 - P) : 0.03 + 0.27 * (1 - P);
  return chance * foulMult;
}

export function zoneFactor(P: number, floor: number, fouled: boolean, contact: boolean): number {
  return (floor + (1 - floor) * P) * (fouled ? 0.6 : 1) * (contact ? 0.75 : 1);
}

export function meterDuration(baseMs: number, P: number, spread: number, rng: () => number): number {
  return Math.max(250, baseMs * (1 + (2 * rng() - 1) * spread * (1 - P)));
}

export function isThree(pos: Vec2): boolean {
  return pos.z < 1.415 ? Math.abs(pos.x) > 6.6 : Math.hypot(pos.x, pos.z) > 6.75;
}

export function shotKindAt(pos: Vec2): 'jump2' | 'three' {
  return isThree(pos) ? 'three' : 'jump2';
}

export function freeThrowCount(kind: ShotKind, made: boolean, fouled: boolean): number {
  return !fouled ? 0 : made ? 1 : kind === 'three' ? 3 : 2;
}

const MADE: Record<ShotKind, string> = {
  jump2: 'TREFFER', three: 'DREIER', layup: 'KORBLEGER', dunk: 'DUNK', contact_dunk: 'POSTER!',
};
const MISSED: Record<ShotKind, string> = {
  jump2: 'DANEBEN', three: 'DANEBEN', layup: 'VERLEGT', dunk: 'VOM RING', contact_dunk: 'GEBLOCKT',
};

export function finishBanner(kind: ShotKind, made: boolean, fouled: boolean, assisted: boolean): string {
  if (!made) return fouled ? `FOUL – ${freeThrowCount(kind, false, true)} FREIWÜRFE` : MISSED[kind];
  return `${assisted ? 'ASSIST + ' : ''}${MADE[kind]}${fouled ? ' + AND-ONE' : ''}`;
}

export function verdict(points: number, deficit: number, overtime = false): 'GAMEWINNER' | 'OVERTIME' | 'DOPPEL-OVERTIME' | 'VERLOREN' {
  return points > deficit ? 'GAMEWINNER' : points === deficit ? overtime ? 'DOPPEL-OVERTIME' : 'OVERTIME' : 'VERLOREN';
}
