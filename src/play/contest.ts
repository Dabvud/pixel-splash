/** Kontest-Stufen eines Wurfs: 0 Wide Open … 4 Smothered */
export const CONTESTS = ['WIDE OPEN', 'SEMI OPEN', 'CONTESTED', 'HEAVY CONTEST', 'SMOTHERED'] as const;
/** Faktor auf das grüne Fenster je Stufe */
export const CONTEST_ZONE = [1, .95, .88, .8, .72];
const BLOCK = [0, 0, .06, .15, .28];

/** Stufe aus dem Abstand des nächsten Verteidigers; gute Verteidiger kontesten oft eine Stufe härter, schwache eine Stufe lascher */
export function contestLevel(distM: number, defense: number, rng: () => number): number {
  if (distM >= 4) return 0;
  const base = distM >= 3 ? 0 : distM >= 2.2 ? 1 : distM >= 1.4 ? 2 : distM >= .8 ? 3 : 4;
  const r = rng(), shift = r < .6 * defense ? 1 : r > 1 - .6 * (1 - defense) ? -1 : 0;
  return Math.max(0, Math.min(4, base + shift));
}

/** Block-Chance ab „Contested“, steigt mit der Stufe und der Verteidigung – auch bei perfektem Timing */
export function blockChance(level: number, defense: number): number {
  return (BLOCK[level] ?? 0) * (.6 + .8 * defense);
}
