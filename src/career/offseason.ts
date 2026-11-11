import { RATING_KEYS, clamp01, type RatingKey, type Ratings } from '../play/ratings';
import { seededRng } from './create';
import { TEAMS } from './league';
import { scheduleSeason } from './keygame';
import { strengthOf } from './season';
import type { CareerState } from './state';

export interface Contract { team: string; years: number; salary: number; spPerYear: number }
export interface Offseason { step: 'offers' | 'trade' | 'skills'; offers?: Contract[]; tradedTo?: string; points: number }

export const rookieContract = (team: string): Contract => ({ team, years: 4, salary: 1.5, spPerYear: 3 });
const PLAYOFF_BONUS: Record<string, number> = { r2: .05, cf: .1, finals: .15, champion: .2 };
const round1 = (v: number) => Math.round(v * 10) / 10;

/** 0…1 aus Werten (60 %) und letzter Saison (40 %: Key-Siege-Quote + Playoff-Bonus) */
export function marketValue(state: CareerState): number {
  const avg = RATING_KEYS.reduce((s, k) => s + state.player.ratings[k], 0) / RATING_KEYS.length;
  const last = state.history.at(-1);
  const rate = last && last.games.length ? last.games.filter(g => g.won).length / last.games.length : .5;
  const perf = clamp01(rate + (PLAYOFF_BONUS[last?.playoff ?? ''] ?? 0));
  return clamp01(.6 * avg + .4 * perf);
}

/** Eigenes Team + 2 andere; schwache Teams locken manchmal mit mehr Skillpunkten, starke bieten etwas weniger */
export function makeOffers(state: CareerState, rng: () => number): Contract[] {
  const v = marketValue(state), others = TEAMS.filter(t => t.id !== state.team);
  const picks = [state.team];
  while (picks.length < 3) {
    const t = others[Math.floor(rng() * others.length)].id;
    if (!picks.includes(t)) picks.push(t);
  }
  return picks.map(team => {
    const strength = strengthOf(state, team);
    let sp = Math.round(2 + 7 * v) + Math.round(rng() * 2 - 1);
    if (strength < 45 && rng() < .4) sp += 2;
    if (strength > 70) sp -= 1;
    return { team, years: 1 + Math.floor(rng() * 5), salary: round1((1 + 45 * v * v) * (.85 + .3 * rng())), spPerYear: Math.max(1, Math.min(11, sp)) };
  });
}

/** Ab 31: Athletik/Dunk/Korbleger sinken, ab 34 auch der Wurf; nie unter 0,05 */
export function ageRatings(r: Ratings, age: number): Ratings {
  if (age < 31) return r;
  const drop: Partial<Record<RatingKey, number>> = { athleticism: .03, dunk: .03, finish: .015, ...(age >= 34 ? { mid: .01, three: .01 } : {}) };
  return Object.fromEntries(RATING_KEYS.map(k => [k, Math.max(.05, r[k] - (drop[k] ?? 0))])) as Ratings;
}

const reschedule = (s: CareerState): CareerState => ({ ...s, keyGames: scheduleSeason(s, seededRng((s.seed ^ (s.year * 977)) >>> 0)) });

/** Nach finishSeason: Vertragsjahr abziehen, Punkte gutschreiben, altern, Angebote oder seltener Trade */
export function beginOffseason(state: CareerState, rng: () => number): CareerState {
  if (state.retired) return state;
  const old = state.contract ?? rookieContract(state.team);
  const contract = { ...old, years: old.years - 1 };
  const s: CareerState = { ...state, contract, player: { ...state.player, ratings: ageRatings(state.player.ratings, state.player.age) } };
  const points = (state.offseason?.points ?? 0) + old.spPerYear;
  if (contract.years <= 0) return { ...s, offseason: { step: 'offers', offers: makeOffers(s, rng), points } };
  if (rng() < .05) {
    const others = TEAMS.filter(t => t.id !== state.team), to = others[Math.floor(rng() * others.length)].id;
    return reschedule({ ...s, team: to, contract: { ...contract, team: to }, offseason: { step: 'trade', tradedTo: to, points } });
  }
  return { ...s, offseason: { step: 'skills', points } };
}

export function acceptOffer(state: CareerState, offer: Contract): CareerState {
  const s: CareerState = { ...state, team: offer.team, contract: { ...offer }, offseason: { ...state.offseason!, step: 'skills', offers: undefined } };
  return offer.team === state.team ? s : reschedule(s);
}

export function ackTrade(state: CareerState): CareerState {
  return { ...state, offseason: { ...state.offseason!, step: 'skills' } };
}

export function spend(state: CareerState, key: RatingKey): CareerState {
  const o = state.offseason;
  if (!o || o.points <= 0 || state.player.ratings[key] >= 1) return state;
  return { ...state, player: { ...state.player, ratings: { ...state.player.ratings, [key]: Math.min(1, state.player.ratings[key] + .02) } },
    offseason: { ...o, points: o.points - 1 } };
}

export function endOffseason(state: CareerState): CareerState {
  return { ...state, offseason: undefined };
}
