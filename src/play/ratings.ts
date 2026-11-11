export const RATING_KEYS = ['mid', 'three', 'finish', 'dunk', 'dribble', 'pass', 'athleticism', 'defense', 'leadership'] as const;
export type RatingKey = typeof RATING_KEYS[number];
export type Ratings = Record<RatingKey, number>;

export const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

/** Eigene Werte oder – für die Baukasten-Spieler – abgeleitet aus shot/athleticism (Labore bleiben dadurch unverändert) */
export function ratingsOf(a: { ratings?: Ratings; shot: number; athleticism: number }): Ratings {
  const base: Ratings = { mid: a.shot, three: a.shot, finish: a.athleticism, dunk: a.athleticism, dribble: .5, pass: .5,
    athleticism: a.athleticism, defense: .5, leadership: .5 };
  const r = { ...base, ...a.ratings };
  for (const k of RATING_KEYS) r[k] = clamp01(r[k]);
  return r;
}

/** Abschluss-Meter nach Spielerwert: 0 → 70 % Dauer, 60 % Zone; 1 → 115 % Dauer, 125 % Zone */
export function finishMeter(base: { meterMs: number; greenZone: number }, finish: number): { meterMs: number; greenZone: number } {
  const f = clamp01(finish);
  return { meterMs: base.meterMs * (.7 + .45 * f), greenZone: base.greenZone * (.6 + .65 * f) };
}
