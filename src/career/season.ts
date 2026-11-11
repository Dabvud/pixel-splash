import { TEAMS, evolveStrength, teamById } from './league';
import { scheduleSeason } from './keygame';
import type { CareerState, Difficulty } from './state';

const DIFF: Record<Difficulty, number> = { rookie: .05, pro: 0, hof: -.05 };

/** Aktuelle Teamstärke: im Spielstand entwickelt, sonst Startwert der Liga */
export function strengthOf(state: CareerState, id: string): number {
  return state.strengths?.[id] ?? teamById(id).strength;
}

/** Hochrechnung auf 82 Spiele aus Teamstärke, Key-Game-Bilanz und Schwierigkeit */
export function projectWins(teamStrength: number, keyWins: number, keyGames: number, difficulty: Difficulty, rng: () => number): number {
  const p = Math.max(.2, Math.min(.8, .5 + (teamStrength - 60) / 100 + DIFF[difficulty]));
  const wins = Math.round(82 * p + (keyWins - keyGames / 2) * 3 + (rng() * 2 - 1) * 3);
  return Math.max(10, Math.min(72, wins));
}

export function standings(state: CareerState, ownWins: number, rng: () => number): { team: string; wins: number; losses: number }[] {
  const conf = teamById(state.team).conference;
  return TEAMS.filter(t => t.conference === conf).map(t => {
    const wins = t.id === state.team ? ownWins
      : Math.max(15, Math.min(68, Math.round(82 * (.5 + (strengthOf(state, t.id) - 60) / 100) + (rng() * 2 - 1) * 6)));
    return { team: t.id, wins, losses: 82 - wins };
  }).sort((a, b) => b.wins - a.wins || (a.team === state.team ? -1 : b.team === state.team ? 1 : 0));
}

export function playoffStatus(rank: number): 'playoffs' | 'playin' | 'out' {
  return rank <= 6 ? 'playoffs' : rank <= 10 ? 'playin' : 'out';
}

const RETIRE: Record<number, number> = { 36: .2, 37: .35, 38: .55, 39: .75 };

/** Saison abschließen: archivieren, altern, Liga entwickeln, neue Key Games, Verletzung/Karriereende würfeln */
export function finishSeason(state: CareerState, ownWins: number, rng: () => number): CareerState {
  const rank = standings(state, ownWins, rng).findIndex(r => r.team === state.team) + 1;
  const record = { year: state.year, team: state.team, age: state.player.age, wins: ownWins, losses: 82 - ownWins, rank, games: state.season };
  const strengths = Object.fromEntries(TEAMS.map(t => [t.id, evolveStrength({ ...t, strength: strengthOf(state, t.id) }, rng)]));
  const age = state.player.age + 1;
  const retired = age >= 40 || rng() < (RETIRE[age] ?? 0);
  const next: CareerState = {
    ...state, player: { ...state.player, age }, year: state.year + 1, history: [...state.history, record],
    season: [], gameIndex: 0, strengths, injured: rng() < .05, retired, keyGames: [],
  };
  next.keyGames = retired ? [] : scheduleSeason(next, rng);
  return next;
}
