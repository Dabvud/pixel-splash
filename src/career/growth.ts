import type { RatingKey, Ratings } from '../play/ratings';
import type { ShotKind } from '../play/finish';
import type { SceneResult } from './scene-types';

/** Wertzuwachs je eigener Aktion (ein Skillpunkt = 0,02) */
export const GROWTH = .003;
const BY_KIND: Record<ShotKind, RatingKey> = { three: 'three', jump2: 'mid', layup: 'finish', dunk: 'dunk', contact_dunk: 'dunk' };
const LABEL: Partial<Record<RatingKey, string>> = { three: 'Dreier', mid: 'Mitteldistanz', finish: 'Korbleger', dunk: 'Dunk', pass: 'Passen' };
export type Growth = Partial<Record<RatingKey, number>>;

/** Eigene Treffer heben den passenden Wurf-/Abschlusswert, Assists das Passen */
export function growth(results: SceneResult[]): Growth {
  const g: Growth = {};
  const add = (k: RatingKey, n = 1) => { if (n > 0) g[k] = (g[k] ?? 0) + n * GROWTH; };
  for (const r of results) {
    for (const kind of r.made ?? []) add(BY_KIND[kind]);
    add('pass', r.ast);
  }
  return g;
}

export function applyGrowth(r: Ratings, g: Growth): Ratings {
  const next = { ...r };
  for (const [k, v] of Object.entries(g) as [RatingKey, number][]) next[k] = Math.min(1, next[k] + v);
  return next;
}

/** z. B. „Dreier +0,6 · Passen +0,3“ (in Wertpunkten 0–100) */
export function growthText(g: Growth): string {
  return (Object.entries(g) as [RatingKey, number][])
    .map(([k, v]) => `${LABEL[k] ?? k} +${(v * 100).toFixed(1).replace('.', ',')}`).join(' · ');
}
