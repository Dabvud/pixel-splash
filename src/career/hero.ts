import { ACTORS, BLUE, RED } from '../play/teams';
import { PLAY_ROLES, castPlay } from '../play/situations';
import { PLAYS } from '../play/plays';
import type { ActorDef, Play, PlayId } from '../play/types';
import type { Team } from './league';
import type { CareerPlayer, Position } from './state';

export const HERO_ID = 'hero';

/** Trägt den eigenen Spieler ins Akteur-Register ein (Atlas und Engine lesen von dort) */
export function registerHero(p: CareerPlayer, team: Team): ActorDef {
  const r = p.ratings;
  const def: ActorDef = {
    ...p.look, id: HERO_ID, team: 'off', role: p.position, num: p.num, jersey: team.jersey, shorts: team.shorts,
    shot: (r.mid + r.three) / 2, athleticism: r.athleticism, ratings: { ...r },
  };
  ACTORS[HERO_ID] = def;
  return def;
}

export function unregisterHero(): void {
  delete ACTORS[HERO_ID];
}

/** Mitspieler in eigenen, Gegner in deren Farben; Rückgabe stellt die Labor-Farben wieder her */
export function dressTeams(own: Team, opp: Team): () => void {
  const saved = [...RED, ...BLUE].map(a => [a.id, ACTORS[a.id]] as const);
  for (const a of RED) ACTORS[a.id] = { ...ACTORS[a.id], jersey: own.jersey, shorts: own.shorts };
  for (const a of BLUE) ACTORS[a.id] = { ...ACTORS[a.id], jersey: opp.jersey, shorts: opp.shorts };
  return () => { for (const [id, def] of saved) ACTORS[id] = def; };
}

/** Slots der Rolle, die im Spielzug den Ball haben oder bekommen können – Ballführer zuerst */
function heroSlots(play: Play, position: Position): string[] {
  const roles = PLAY_ROLES[play.id];
  const ballIds = [play.segments[play.start].handler, ...Object.values(play.segments).flatMap(s =>
    [s.handler, ...(s.options ?? []).flatMap(o => o.to ? [o.to] : [])])];
  return [...new Set(ballIds)].filter(id => ACTORS[id]?.team === 'off' && roles[id] === position);
}

export function playsForHero(position: Position): PlayId[] {
  return (Object.keys(PLAYS) as PlayId[]).filter(id => heroSlots(PLAYS[id], position).length > 0);
}

/** Besetzt einen passenden Slot fest mit dem eigenen Spieler, den Rest wie castPlay */
export function castWithHero(play: Play, position: Position, rng: () => number): Play {
  const slot = heroSlots(play, position)[0];
  if (!slot) throw new Error(`${play.id} hat keinen Platz für ${position}`);
  return castPlay(play, rng, { [slot]: HERO_ID });
}
