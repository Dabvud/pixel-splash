import { formatPlayClock } from '../ui/play-hud';
import { PLAYS } from '../play/plays';
import type { Ratings } from '../play/ratings';
import { HERO_ID, castWithHero, playsForHero } from './hero';
import { TEAMS, teamById, teamName } from './league';
import type { SceneResult, SceneSpec } from './scene-types';
import type { CareerState, KeyGame } from './state';

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
      : label === 'Spitzenspiel' ? [...others].sort((a, b) => b.strength - a.strength).slice(0, 6) : others;
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

export function sceneSpec(state: CareerState, game: KeyGame, index: number, total: number, deficit: number, rng: () => number): SceneSpec {
  const last = index === total - 1;
  const clockS = last ? 3 + Math.floor(rng() * 10) : 8 + Math.floor(rng() * 17);
  const period = last ? '4. VIERTEL' : `${1 + Math.min(2, Math.floor(index * 3 / Math.max(1, total - 1)))}. VIERTEL`;
  const id = pick(playsForHero(state.player.position), rng);
  const opp = teamName(teamById(game.opponent));
  return {
    play: castWithHero(PLAYS[id], state.player.position, rng), deficit, clockS, controlled: HERO_ID,
    teams: [state.team.toUpperCase(), game.opponent.toUpperCase()], period,
    title: `${period} · ${formatPlayClock(clockS, false)} · −${deficit}`,
    subtitle: `${game.label} · ${game.home ? 'gegen die' : 'bei den'} ${opp}`,
  };
}

export function projectLine(r: Ratings, scenes: SceneResult[], rng: () => number): { pts: number; ast: number; reb: number } {
  const noise = (n: number) => (rng() * 2 - 1) * n;
  const pts = scenes.reduce((s, x) => s + x.pts, 0) + Math.round(6 + 18 * (r.mid + r.three + r.finish) / 3 + noise(4));
  const ast = scenes.reduce((s, x) => s + x.ast, 0) + Math.round(1 + 8 * r.pass + noise(2));
  const reb = Math.round(1 + 9 * (r.athleticism + r.defense) / 2 + noise(2));
  return { pts: Math.max(0, pts), ast: Math.max(0, ast), reb: Math.max(0, reb) };
}
