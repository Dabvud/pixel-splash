import { formatPlayClock } from '../ui/play-hud';
import { PLAYS } from '../play/plays';
import type { Ratings } from '../play/ratings';
import { HERO_ID, castWithHero, playsForHero } from './hero';
import { TEAMS, teamById, teamName } from './league';
import type { SceneResult, SceneSpec } from './scene-types';
import type { CareerState, KeyGame } from './state';
import { scenePeriods, type GameScore } from './momentum';
import { strengthOf } from './season';

export const LABELS = ['Rivalen-Duell', 'Spitzenspiel', 'Christmas Game', 'Auswärts in feindlicher Halle', 'Nationales TV-Spiel', 'Rückkehr zum Ex-Team'];
const pick = <T>(list: T[], rng: () => number): T => list[Math.min(list.length - 1, Math.floor(rng() * list.length))];

/** Die besonderen Spiele einer Saison: 5, bei Verletzung 3 */
export function scheduleSeason(state: CareerState, rng: () => number): KeyGame[] {
  const own = teamById(state.team), others = TEAMS.filter(t => t.id !== own.id);
  const ex = [...state.history].reverse().find(h => h.team !== own.id)?.team;
  const labels = LABELS.filter(l => l !== 'Rückkehr zum Ex-Team' || ex);
  const chosen: string[] = [];
  while (chosen.length < (state.injured ? 3 : 5)) {
    const l = pick(labels.filter(x => !chosen.includes(x)), rng);
    chosen.push(l);
  }
  return chosen.map(label => {
    const pool = label === 'Rivalen-Duell' ? others.filter(t => t.conference === own.conference)
      : label === 'Spitzenspiel' ? [...others].sort((a, b) => strengthOf(state, b.id) - strengthOf(state, a.id)).slice(0, 6) : others;
    const opponent = label === 'Rückkehr zum Ex-Team' ? ex! : pick(pool, rng).id;
    const home = label === 'Auswärts in feindlicher Halle' ? false : label === 'Rückkehr zum Ex-Team' ? false : rng() < .5;
    return { opponent, label, home };
  });
}

export function scenePlan(game: KeyGame): 2 | 3 {
  // Spitzenspiele und alle Nachsaison-Spiele (Play-In/Playoffs) haben drei Szenen
  return game.label === 'Spitzenspiel' || game.label === 'Christmas Game' || / · /.test(game.label) ? 3 : 2;
}

/** Frühere Szenen verschieben den Rückstand der Crunchtime: Start 3, je Sieg −1, je Niederlage +1 */
export function finalDeficit(earlier: boolean[]): number {
  return Math.max(1, Math.min(6, 3 - earlier.filter(Boolean).length + earlier.filter(w => !w).length));
}

/** Die letzte Szene entscheidet; Gleichstand (Overtime) per Münzwurf */
export function gameResult(scenes: SceneResult[], rng: () => number): boolean {
  const last = scenes[scenes.length - 1];
  if (!last) return false;
  if (last.won) return true;
  return /OVERTIME/.test(last.verdict) ? rng() < .5 : false;
}

/** score: echter Spielstand (sonst nur Rückstand im Titel) */
export function sceneSpec(state: CareerState, game: KeyGame, index: number, total: number, deficit: number, rng: () => number,
  score?: GameScore, open = false): SceneSpec {
  // open: letzte Szene ohne Entscheidung – normaler Angriff mitten im 4. Viertel, die Uhr der Szene ist die Wurfuhr
  const last = index === total - 1 && !open;
  const clockOffset = open ? 150 + Math.floor(rng() * 181) : 0;
  const period = scenePeriods(total)[index] ?? '4. VIERTEL';
  // Lob in 0,8 s ist nur eine Crunchtime-Situation
  const id = pick(playsForHero(state.player.position).filter(p => last || p !== 'lob08'), rng);
  const play = castWithHero(PLAYS[id], state.player.position, rng);
  // Uhr nie kürzer als der Weg bis zur ersten Entscheidung + 3 s, sonst ist die Zeit um, bevor man dran ist
  const minClock = Math.ceil((play.segments[play.start].decisionAt ?? 0) + 3);
  const clockS = id === 'lob08' ? play.clockS : Math.max(minClock, last ? 3 + Math.floor(rng() * 10) : 14 + Math.floor(rng() * 11));
  const opp = teamName(teamById(game.opponent));
  return {
    play, deficit, clockS, controlled: HERO_ID, final: last,
    teams: [state.team.toUpperCase(), game.opponent.toUpperCase()], period, ...(score ? { score: [score.own, score.opp] as [number, number] } : {}),
    ...(open ? { clockOffset } : {}),
    title: `${period} · ${formatPlayClock(clockS + clockOffset, false)} · ${score ? `${score.own}:${score.opp}` : `−${deficit}`}`,
    subtitle: `${game.label} · ${game.home ? 'gegen die' : 'bei den'} ${opp}`,
  };
}

/** Statline des Spiels aus den eigenen Key Moments: Punkte je Szene (alle Körbe zählen; ohne eigene Punkte 10–14, ein Dreier in jeder Szene 37–41),
 *  Assists je Szene (3–5 ohne, 13–15 mit einem Assist in jeder Szene); Rebounds haben keine Szenen-Aktion und kommen aus Athletik und Verteidigung */
export function projectLine(r: Ratings, scenes: SceneResult[], rng: () => number): { pts: number; ast: number; reb: number } {
  const noise = (n: number) => (rng() * 2 - 1) * n, n = Math.max(1, scenes.length);
  const scoring = Math.min(1, scenes.reduce((s, x) => s + x.pts, 0) / n / 3);
  const passing = Math.min(1, scenes.reduce((s, x) => s + x.ast, 0) / n);
  const pts = Math.round(12 + 27 * scoring + noise(2));
  const ast = Math.round(4 + 10 * passing + noise(1));
  const reb = Math.round(1 + 9 * (r.athleticism + r.defense) / 2 + noise(2));
  return { pts: Math.max(0, pts), ast: Math.max(0, ast), reb: Math.max(0, reb) };
}
