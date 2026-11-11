import type { CareerPlayer, CareerState } from './state';
import type { Perks } from '../play/engine';
export type { Perks };

export type SpecId = 'playmaking' | 'shooting' | 'finishing';
export const SPECS: Record<SpecId, { name: string; stages: [string, string, string] }> = {
  playmaking: { name: 'Playmaking', stages: ['Sichere Pässe: Steal-Chance ×0,6', 'Coach-Call: Spielzug aus 2 wählen', 'Floor General: nach deinem Pass steuerst du den Mitspieler'] },
  shooting: { name: 'Werfen', stages: ['Grüne Zone beim Dreier ×1,3', 'Deep Range: weite Dreier ohne Abzug', 'Green Light: nach 2 Treffern brennt der Ball, grün = sicher drin'] },
  finishing: { name: 'Korbabschluss', stages: ['Abschluss-Meter 15 % langsamer', 'Kontakt-Dunks und And-ones ×1,5', 'Posterizer: Poster garantiert, kein Block, Ankle Breaker'] },
};
/** gleiche Kosten für alle Spezialisierungen – Stärke wird über Spieltests abgestimmt */
export const STAGE_COST = [4, 6, 10];

/** Wirkungen für den eigenen Spieler in den Szenen (nur Karriere), Typ aus der Engine */
export function perksOf(p: CareerPlayer): Perks {
  const lv = p.spec ? p.specLevel ?? 0 : 0;
  if (p.spec === 'playmaking') return { ...(lv >= 1 ? { passSteal: .6 } : {}), ...(lv >= 2 ? { coachCall: true } : {}), ...(lv >= 3 ? { floorGeneral: true } : {}) };
  if (p.spec === 'shooting') return { ...(lv >= 1 ? { threeGreen: 1.3 } : {}), ...(lv >= 2 ? { deepRange: true } : {}), ...(lv >= 3 ? { greenLight: true } : {}) };
  if (p.spec === 'finishing') return { ...(lv >= 1 ? { finishMeter: 1.15 } : {}), ...(lv >= 2 ? { contactBoost: 1.5 } : {}), ...(lv >= 3 ? { posterizer: true } : {}) };
  return {};
}

/** Nächste Stufe gegen Skillpunkte der Off-Season */
export function buyStage(state: CareerState): CareerState {
  const p = state.player, lv = p.specLevel ?? 0, o = state.offseason;
  if (!p.spec || lv >= 3 || !o || o.points < STAGE_COST[lv]) return state;
  return { ...state, player: { ...p, specLevel: lv + 1 }, offseason: { ...o, points: o.points - STAGE_COST[lv] } };
}

/** Für alte Stände ohne Spezialisierung: einmalig wählen */
export function chooseSpec(state: CareerState, spec: SpecId): CareerState {
  if (state.player.spec) return state;
  return { ...state, player: { ...state.player, spec, specLevel: 0 } };
}

/** Green Light: Treffer in Folge über Szenen hinweg; ein Fehlwurf setzt zurück */
export function updateHot(hot: number, results: { heroShots?: number; heroMakes?: number }[]): number {
  for (const r of results) {
    const shots = r.heroShots ?? 0, makes = r.heroMakes ?? 0;
    if (!shots) continue;
    hot = makes < shots ? 0 : hot + makes;
  }
  return hot;
}
