import type { SceneResult } from './scene-types';
import type { Difficulty } from './state';

export interface GameScore { own: number; opp: number }

/** Szenen liegen im Spiel verteilt: 3 Szenen = Ende 1. Viertel, Mitte 3. Viertel, Crunchtime; 2 Szenen = Ende 2. Viertel, Crunchtime */
export function scenePeriods(total: number): string[] {
  return total >= 3 ? ['1. VIERTEL', '3. VIERTEL', '4. VIERTEL'] : ['2. VIERTEL', '4. VIERTEL'];
}
/** gespielte Viertel zwischen Szene index-1 und index */
export function sceneGap(total: number, index: number): number {
  return total >= 3 ? 1.5 : index > 0 ? 2.5 : 0;
}

const DIFF: Record<Difficulty, number> = { rookie: -1.5, pro: 0, hof: 1.5 };
const noise = (rng: () => number, n: number) => Math.round((rng() * 2 - 1) * n);

/** Stand zur ersten Szene; Gegnerstärke und Schwierigkeit verschieben den Abstand */
export function openingScore(total: number, ownStr: number, oppStr: number, difficulty: Difficulty, rng: () => number): GameScore {
  const quarters = total >= 3 ? 1 : 2;
  const own = Math.round(22 * quarters + (rng() * 2 - 1) * 4 * quarters);
  const lean = (oppStr - ownStr) / 20 * quarters + DIFF[difficulty] * quarters;
  return { own, opp: Math.max(0, own + Math.round(lean + (rng() * 2 - 1) * 6)) };
}

/** Zwischen zwei Szenen: Punkte der Szene + Momentum (Treffer +3 für uns, −3 für den Gegner) + Spielfluss mit Zufall */
export function advanceScore(score: GameScore, last: SceneResult | undefined, quarters: number, ownStr: number, oppStr: number,
  difficulty: Difficulty, rng: () => number): GameScore {
  const scored = (last?.teamPts ?? 0) > 0, m = last ? (scored ? 3 : -3) : 0;
  const base = 24 * quarters, lean = (ownStr - oppStr) / 20 * quarters;
  return {
    own: score.own + (last?.teamPts ?? 0) + Math.round(base + lean + m) + noise(rng, 4 * quarters),
    opp: score.opp + Math.round(base - lean - m + DIFF[difficulty] * quarters) + noise(rng, 4 * quarters),
  };
}

/** Lage vor der Crunchtime: knapp hinten → spielen; zu weit hinten → schon verloren (Pech); klar vorne → schon gewonnen */
export function crunch(score: GameScore): { kind: 'play'; deficit: number } | { kind: 'won' } | { kind: 'lost' } {
  const d = score.opp - score.own;
  if (d > 6) return { kind: 'lost' };
  if (d >= 1) return { kind: 'play', deficit: d };
  // knapp vorne: der Gegner trifft spät, du musst das Spiel selbst zumachen
  return d >= -3 ? { kind: 'play', deficit: 1 } : { kind: 'won' };
}
