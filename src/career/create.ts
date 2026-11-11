import type { Look } from '../figure/raster';
import { RATING_KEYS, type Ratings } from '../play/ratings';
import { TEAMS } from './league';
import type { CareerState, Difficulty, Position } from './state';
import type { SpecId } from './spec';
import { rookieContract } from './offseason';

export interface CareerInput { name: string; num: number; look: Look; position: Position; difficulty: Difficulty; spec?: SpecId }

// Schwerpunkte je Position; werden auf die Summe der Schwierigkeit skaliert
const PROFILE: Record<Position, Ratings> = {
  guard: { mid: .55, three: .7, finish: .5, dunk: .3, dribble: .7, pass: .7, athleticism: .55, defense: .45, leadership: .45 },
  wing: { mid: .65, three: .6, finish: .55, dunk: .5, dribble: .5, pass: .45, athleticism: .65, defense: .5, leadership: .4 },
  big: { mid: .4, three: .25, finish: .65, dunk: .75, dribble: .3, pass: .4, athleticism: .6, defense: .7, leadership: .45 },
};
const TOTAL: Record<Difficulty, number> = { rookie: 5.4, pro: 4.9, hof: 4.4 };

/** Kleiner deterministischer Zufall (mulberry32) für alles, was am Seed hängt */
export function seededRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function startRatings(position: Position, difficulty: Difficulty): Ratings {
  const p = PROFILE[position], sum = RATING_KEYS.reduce((s, k) => s + p[k], 0), f = TOTAL[difficulty] / sum;
  return Object.fromEntries(RATING_KEYS.map(k => [k, p[k] * f])) as Ratings;
}

/** Ohne Combine: Draft zu einem der 5 schwächsten Teams */
export function newCareer(input: CareerInput, seed: number): CareerState {
  const rng = seededRng(seed);
  const weakest = [...TEAMS].sort((a, b) => a.strength - b.strength).slice(0, 5);
  const team = weakest[Math.floor(rng() * weakest.length)];
  return {
    version: 1, seed: seed >>> 0, difficulty: input.difficulty,
    player: {
      name: input.name, num: input.num, position: input.position, age: 19,
      look: { ...input.look, jersey: team.jersey, shorts: team.shorts, num: input.num },
      ratings: startRatings(input.position, input.difficulty),
      ...(input.spec ? { spec: input.spec, specLevel: 0 } : {}),
    },
    team: team.id, year: 1, keyGames: [], gameIndex: 0, season: [], history: [], injured: false, retired: false,
    contract: rookieContract(team.id),
  };
}
