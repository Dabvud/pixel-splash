import type { PlayoffResult } from './playoffs';
import type { CareerState, GameRecord, Position, SeasonRecord } from './state';

export type AwardId = 'mvp' | 'fmvp' | 'ring' | 'allnba' | 'allstar' | 'roy' | 'scoring' | 'dpoy' | 'clutch';
export const AWARDS: Record<AwardId, { name: string; legacy: number; sp: number; icon: string }> = {
  ring: { name: 'Meisterschaft', legacy: 12, sp: 0, icon: '💍' },
  mvp: { name: 'MVP', legacy: 10, sp: 3, icon: '🏆' },
  fmvp: { name: 'Finals-MVP', legacy: 8, sp: 2, icon: '🥇' },
  allnba: { name: 'All-NBA', legacy: 4, sp: 1, icon: '⭐' },
  allstar: { name: 'All-Star', legacy: 3, sp: 1, icon: '✨' },
  scoring: { name: 'Scoring-Titel', legacy: 3, sp: 1, icon: '🎯' },
  dpoy: { name: 'Defensive Player of the Year', legacy: 3, sp: 1, icon: '🛡️' },
  roy: { name: 'Rookie of the Year', legacy: 2, sp: 1, icon: '🌱' },
  clutch: { name: 'Clutch Player', legacy: 2, sp: 1, icon: '⏱️' },
};

export function seasonStats(games: GameRecord[]): { ppg: number; apg: number; rpg: number; wins: number; games: number } {
  const n = games.length, avg = (f: (g: GameRecord) => number) => n ? games.reduce((s, g) => s + f(g), 0) / n : 0;
  return { ppg: avg(g => g.pts), apg: avg(g => g.ast), rpg: avg(g => g.reb), wins: games.filter(g => g.won).length, games: n };
}

/** Auszeichnungen einer Saison; year: 1 = Rookie-Saison */
export function seasonAwards(state: CareerState, rank: number, playoff: PlayoffResult, year = state.year): AwardId[] {
  const st = seasonStats(state.season), out: AwardId[] = [];
  if (!st.games) return out;
  if (st.ppg >= 26 && st.wins >= 4 && rank <= 3) out.push('mvp');
  if (playoff === 'champion') out.push('ring', 'fmvp');
  if (st.ppg >= 23) out.push('allnba');
  if (st.ppg >= 19 || (st.ppg >= 16 && st.apg >= 7)) out.push('allstar');
  if (year === 1 && st.ppg >= 15) out.push('roy');
  if (st.ppg >= 29) out.push('scoring');
  if (state.player.ratings.defense >= .85 && rank <= 8) out.push('dpoy');
  if (st.games >= 5 && st.wins === st.games) out.push('clutch');
  return out;
}

export const awardPoints = (awards: AwardId[]) => awards.reduce((s, a) => s + AWARDS[a].sp, 0);

export function legacyOf(history: SeasonRecord[]): number {
  return history.reduce((sum, h) => sum + (h.awards ?? []).reduce((s, a) => s + AWARDS[a].legacy, 0)
    + h.wins / 10 + seasonStats(h.games).ppg * .3, 0);
}

export function tierOf(legacy: number): { tier: string; hof: boolean } {
  const tier = legacy >= 130 ? 'GOAT-Debatte' : legacy >= 80 ? 'Hall of Famer' : legacy >= 45 ? 'All-Star' : legacy >= 20 ? 'Starter' : 'Rollenspieler';
  return { tier, hof: legacy >= 80 };
}

export interface RankEntry { id: string; name: string; position: Position; seasons: number; rings: number; mvps: number; legacy: number; tier: string; date: string }
export const RANK_KEY = 'pixel-splash.careers.v1';

export function loadRanking(storage?: Storage): RankEntry[] {
  try {
    const raw = (storage ?? globalThis.localStorage)?.getItem(RANK_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter(e => e && typeof e.legacy === 'number' && typeof e.id === 'string') : [];
  } catch { return []; }
}

/** Jede Karriere genau einmal (über id), absteigend nach Legacy, höchstens 20 */
export function addToRanking(entry: RankEntry, storage?: Storage): RankEntry[] {
  const list = loadRanking(storage);
  if (list.some(e => e.id === entry.id)) return list;
  const next = [...list, entry].sort((a, b) => b.legacy - a.legacy).slice(0, 20);
  try { (storage ?? globalThis.localStorage)?.setItem(RANK_KEY, JSON.stringify(next)); } catch { /* ohne Speicher keine Rangliste */ }
  return next;
}
