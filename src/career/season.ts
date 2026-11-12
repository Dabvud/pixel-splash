import { TEAMS, teamById } from './league';
import { seededRng } from './create';
import { createLeague, evolveLeague, heroBonus, ratings, type League } from './world';
import { scheduleSeason } from './keygame';
import type { CareerState, Difficulty } from './state';
import { seasonAwards } from './legacy';

const DIFF: Record<Difficulty, number> = { rookie: .05, pro: 0, hof: -.05 };

export const leagueOf = (state: CareerState): League => state.league ?? createLeague(seededRng(state.seed));

/** Aktueller Teamwert; das eigene Team wird durch den eigenen Spieler besser */
export function strengthOf(state: CareerState, id: string): number {
  const v = state.strengths?.[id] ?? teamById(id).strength;
  return id === state.team ? Math.min(99, v + heroBonus(state.player.ratings)) : v;
}
/** Angriff und Verteidigung als sichtbare Teilwerte des Teamwerts */
export function offDef(state: CareerState, id: string): { off: number; def: number } {
  const v = strengthOf(state, id), split = state.league?.teams[id]?.split ?? 0;
  return { off: Math.min(99, v + split), def: Math.min(99, v - split) };
}

/** Bilanz: Basis-Siegquote aus dem Teamwert; die Key Games verschieben sie um bis zu ±10–20 % (Höhe gelost) */
export function projectWins(teamStrength: number, keyWins: number, keyGames: number, difficulty: Difficulty, rng: () => number): number {
  const team = Math.max(.2, Math.min(.8, .5 + (teamStrength - 60) / 100 + DIFF[difficulty]));
  const key = keyGames ? keyWins / keyGames : .5;
  const bonus = (key - .5) * 2 * (.1 + .1 * rng());
  const wins = Math.round(82 * (team + bonus) + (rng() * 2 - 1) * 2);
  return Math.max(8, Math.min(74, wins));
}

/** Tabelle: Teamwert ist nur die Basis – Verteidigung zählt etwas mehr, dazu Form/Chemie, Verletzungspech und Glück */
export function standings(state: CareerState, ownWins: number, rng: () => number, conf = teamById(state.team).conference): { team: string; wins: number; losses: number; note?: string }[] {
  return TEAMS.filter(t => t.conference === conf).map(t => {
    if (t.id === state.team) return { team: t.id, wins: ownWins, losses: 82 - ownWins };
    const ts = state.league?.teams[t.id];
    // neue Stars müssen sich erst einspielen
    const form = (rng() * 2 - 1) * 6 - (ts?.fresh ? 3 : 0), luck = (rng() * 2 - 1) * 4;
    const hurt = rng() < .15 ? 3 + rng() * 9 : 0;
    const eff = strengthOf(state, t.id) - .2 * (ts?.split ?? 0);
    const wins = Math.max(12, Math.min(70, Math.round(82 * (.5 + (eff - 60) / 100) + form + luck - hurt)));
    return { team: t.id, wins, losses: 82 - wins, ...(hurt ? { note: 'Verletzungspech' } : form <= -5 ? { note: 'Formkrise' } : form >= 5 ? { note: 'Überflieger' } : {}) };
  }).sort((a, b) => b.wins - a.wins || (a.team === state.team ? -1 : b.team === state.team ? 1 : 0));
}

/** Seeds der Saisontabellen: eigene Conference seasonSeed + 1 (wie finishSeason), andere Conference seasonSeed + 3 */
export const seasonSeed = (state: CareerState) => (state.seed ^ (state.year * 31337)) >>> 0;
export const otherSeed = (state: CareerState) => seasonSeed(state) + 3;

export function playoffStatus(rank: number): 'playoffs' | 'playin' | 'out' {
  return rank <= 6 ? 'playoffs' : rank <= 10 ? 'playin' : 'out';
}

const RETIRE: Record<number, number> = { 36: .2, 37: .35, 38: .55, 39: .75 };

/** Saison abschließen: archivieren, altern, Liga entwickeln, neue Key Games, Verletzung/Karriereende würfeln */
export function finishSeason(state: CareerState, ownWins: number, rng: () => number): CareerState {
  const table = standings(state, ownWins, rng), rank = table.findIndex(r => r.team === state.team) + 1;
  // andere Conference mit eigenem Zufall (gleicher Seed-Versatz wie die Anzeige), damit die eigene Tabelle unverändert bleibt
  const other = standings(state, ownWins, seededRng(otherSeed(state)), teamById(state.team).conference === 'east' ? 'west' : 'east');
  const record = { year: state.year, team: state.team, age: state.player.age, wins: ownWins, losses: 82 - ownWins, rank, games: state.season,
    playoff: state.postseason?.result ?? 'none' as const,
    awards: seasonAwards(state, rank, state.postseason?.result ?? 'none'), table: [...table, ...other].map(({ team, wins }) => ({ team, wins })) };
  const league = evolveLeague(leagueOf(state), rng), strengths = ratings(league);
  const age = state.player.age + 1;
  const retired = age >= 40 || rng() < (RETIRE[age] ?? 0);
  const next: CareerState = {
    ...state, player: { ...state.player, age }, year: state.year + 1, history: [...state.history, record],
    season: [], gameIndex: 0, strengths, league, injured: rng() < .05, retired, keyGames: [], postseason: undefined,
  };
  next.keyGames = retired ? [] : scheduleSeason(next, rng);
  return next;
}
