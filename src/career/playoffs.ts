import { TEAMS, teamById } from './league';
import { strengthOf } from './season';
import type { CareerState, KeyGame } from './state';

export type Round = 'playin' | 'r1' | 'r2' | 'cf' | 'finals';
export type PlayoffResult = 'none' | 'playin' | 'r1' | 'r2' | 'cf' | 'finals' | 'champion';
export interface Postseason {
  rank: number; ownWins: number; round: Round; opponent: string; situation: string; home: boolean;
  done: boolean; result: PlayoffResult;
  /** Conference-Tabelle (Team-ids nach Platz) und bisherige Gegner */
  seeds: string[]; faced: string[];
}

export const SITUATIONS = ['Game 1 auswärts', 'Closing Game (3-2)', 'Elimination Game (2-3)', 'Game 7 (3-3)', 'Play-In'];
export const ROUND_NAME: Record<Round, string> = { playin: 'Play-In', r1: '1. Runde', r2: 'Conference-Halbfinale', cf: 'Conference-Finale', finals: 'NBA Finals' };
const NEXT: Record<Round, Round | null> = { playin: 'r1', r1: 'r2', r2: 'cf', cf: 'finals', finals: null };

function situation(round: Round, rank: number, oppRank: number, rng: () => number): { situation: string; home: boolean } {
  if (round === 'playin') return { situation: 'Play-In', home: rank < oppRank };
  const s = round === 'finals' && rng() < .6 ? 'Game 7 (3-3)' : SITUATIONS[Math.floor(rng() * 4)];
  // Game 1 immer auswärts; Game 7 beim besser Platzierten; sonst Zufall
  return { situation: s, home: s === 'Game 1 auswärts' ? false : s === 'Game 7 (3-3)' ? rank < oppRank : rng() < .5 };
}

function make(base: Omit<Postseason, 'opponent' | 'situation' | 'home'>, opponent: string, rng: () => number): Postseason {
  const oppRank = base.seeds.indexOf(opponent) + 1 || 99;
  return { ...base, opponent, ...situation(base.round, base.rank, oppRank, rng), faced: [...base.faced, opponent] };
}

/** Nach der Hauptrunde: Platz 1–6 Playoffs (1–8, 2–7, 3–6, 4–5), 7–10 Play-In (7–8, 9–10), sonst null */
export function startPostseason(state: CareerState, ownWins: number, table: { team: string }[], rng: () => number): Postseason | null {
  const seeds = table.map(r => r.team), rank = seeds.indexOf(state.team) + 1;
  if (rank < 1 || rank > 10) return null;
  const base = { rank, ownWins, done: false, result: 'none' as const, seeds, faced: [] as string[] };
  if (rank >= 7) return make({ ...base, round: 'playin' }, seeds[rank % 2 ? rank : rank - 2], rng);
  return make({ ...base, round: 'r1' }, seeds[8 - rank], rng);
}

export function postseasonGame(p: Postseason): KeyGame {
  return { opponent: p.opponent, label: `${ROUND_NAME[p.round]} · ${p.situation}`, home: p.home };
}

/** Ergebnis des entscheidenden Spiels: nächste Runde oder Ende der Nachsaison */
export function advance(p: Postseason, won: boolean, state: CareerState, rng: () => number): Postseason {
  if (!won) return { ...p, done: true, result: p.round === 'playin' ? 'playin' : p.round };
  const next = NEXT[p.round];
  if (!next) return { ...p, done: true, result: 'champion' };
  const base = { ...p, round: next };
  if (p.round === 'playin') {
    // Sieger aus 7–8 wird Nr. 7 (gegen 2), aus 9–10 wird Nr. 8 (gegen 1)
    const seed = p.rank <= 8 ? 7 : 8;
    return make({ ...base, rank: seed }, p.seeds[8 - seed], rng);
  }
  if (next === 'finals') {
    const conf = teamById(state.team).conference;
    const pool = TEAMS.filter(t => t.conference !== conf).sort((a, b) => strengthOf(state, b.id) - strengthOf(state, a.id)).slice(0, 3);
    return make(base, pool[Math.floor(rng() * pool.length)].id, rng);
  }
  // Weitere Runden: einer der stärksten noch nicht geschlagenen Gegner der eigenen Conference
  const pool = p.seeds.filter(id => id !== state.team && !p.faced.includes(id)).slice(0, next === 'cf' ? 2 : 3);
  return make(base, pool[Math.floor(rng() * pool.length)], rng);
}
