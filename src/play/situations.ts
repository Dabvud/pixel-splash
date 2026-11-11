import { ACTORS, BLUE, RED } from './teams';
import type { Play, PlayId, PlayerRole, Segment, Waypoint } from './types';

export const PLAY_ROLES: Record<PlayId, Record<string, PlayerRole>> = {
  pnr: { r3: 'guard', r11: 'guard', r23: 'wing', r32: 'wing', r50: 'big' },
  fastbreak: { r3: 'guard', r11: 'guard', r23: 'wing' },
  kickout: { r23: 'wing', r11: 'guard', r3: 'guard', r32: 'wing', r50: 'big' },
  inbound: { r3: 'guard', r11: 'guard', r50: 'big', r23: 'wing', r32: 'wing' },
  iso: { r3: 'guard', r11: 'guard', r23: 'wing', r32: 'wing', r50: 'big' },
  handoff: { r3: 'guard', r11: 'guard', r23: 'wing', r32: 'wing', r50: 'big' },
  backdoor: { r3: 'guard', r11: 'guard', r23: 'wing', r32: 'wing', r50: 'big' },
  giveandgo: { r3: 'guard', r11: 'guard', r23: 'wing', r32: 'wing', r50: 'big' },
  twoonone: { r3: 'guard', r23: 'wing' },
  threeontwo: { r3: 'guard', r11: 'guard', r23: 'wing' },
  pickpop: { r3: 'guard', r11: 'guard', r23: 'wing', r32: 'wing', r50: 'big' },
  floppy: { r3: 'guard', r11: 'guard', r23: 'wing', r32: 'wing', r50: 'big' },
  pindown: { r3: 'guard', r11: 'guard', r23: 'wing', r32: 'wing', r50: 'big' },
  horns: { r3: 'guard', r11: 'guard', r23: 'wing', r32: 'wing', r50: 'big' },
  spain: { r3: 'guard', r11: 'guard', r23: 'wing', r32: 'wing', r50: 'big' },
  doubledrag: { r3: 'guard', r11: 'guard', r23: 'wing', r32: 'wing', r50: 'big' },
  stagger: { r3: 'guard', r11: 'guard', r23: 'wing', r32: 'wing', r50: 'big' },
  elevator: { r3: 'guard', r11: 'guard', r23: 'wing', r32: 'wing', r50: 'big' },
  flare: { r3: 'guard', r11: 'guard', r23: 'wing', r32: 'wing', r50: 'big' },
  slob: { r3: 'guard', r11: 'guard', r23: 'wing', r32: 'wing', r50: 'big' },
  lob08: { r3: 'guard', r11: 'guard', r23: 'wing', r32: 'wing', r50: 'big' },
  shortroll: { r3: 'guard', r11: 'guard', r23: 'wing', r32: 'wing', r50: 'big' },
  hammer: { r3: 'guard', r11: 'guard', r23: 'wing', r32: 'wing', r50: 'big' },
};

export function castPlay(play: Play, rng: () => number): Play {
  const ids: Record<string, string> = {};
  for (const team of [RED, BLUE]) for (const role of ['guard', 'wing', 'big'] as const) {
    const slots = play.actors.filter(id => ACTORS[id].team === team[0].team
      && (PLAY_ROLES[play.id][id] ?? ACTORS[id].role) === role);
    const pool = team.filter(a => a.role === role).map(a => a.id);
    for (const id of slots) {
      const index = pool.length > 1 ? Math.min(pool.length - 1, Math.floor(rng() * pool.length)) : 0;
      ids[id] = pool.splice(index, 1)[0];
    }
  }
  const actor = (id: string) => ids[id] ?? id;
  const paths = (group: Record<string, Waypoint[]>) => Object.fromEntries(
    Object.entries(group).map(([id, path]) => [actor(id), path.map(p => ({ ...p }))]));
  // Segment-IDs sind Verweise auf Abläufe und bleiben auch bei getauschten Spielern stabil.
  return { ...play, actors: play.actors.map(actor), inboundBy: play.inboundBy && actor(play.inboundBy),
    segments: Object.fromEntries(Object.entries(play.segments).map(([id, s]) => [id, {
      ...s, handler: actor(s.handler), paths: paths(s.paths),
      options: s.options?.map(o => ({ ...o, ...(o.to ? { to: actor(o.to) } : {}) })),
    }])),
    variants: play.variants.map(v => ({ ...v, defPaths: Object.fromEntries(
      Object.entries(v.defPaths).map(([id, group]) => [id, paths(group)])) })),
  };
}

export function varyHelpTiming(play: Play, rng: () => number): Play {
  const shift = (group: Record<string, Waypoint[]>, segment: Segment) => {
    const targets = [segment.handler, ...(segment.options ?? []).flatMap(o => o.to ? [o.to] : [])];
    const destinations = targets.flatMap(id => segment.paths[id]?.slice(-1) ?? []);
    const near = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z) <= 2.5;
    return Object.fromEntries(Object.entries(group).map(([id, path]) => {
      const first = path[0], last = path.at(-1);
      // Hilfe umfasst auch das Schließen des Wegs zum Korb; reine Rückzugswege bleiben gleich.
      if (ACTORS[id].team !== 'def' || !first || !last || !path.some(p => p.x !== first.x || p.z !== first.z)
        || ![...destinations, { x: 0, z: 0 }].some(target => near(last, target))) return [id, path];
      const offset = -.25 + .7 * rng();
      let previous = first.t;
      return [id, path.map((p, i) => {
        const t = i === 0 ? p.t : Math.max(previous + .001, p.t + offset);
        previous = t;
        return { ...p, t };
      })];
    }));
  };
  return { ...play,
    segments: Object.fromEntries(Object.entries(play.segments).map(([id, s]) => [id, { ...s, paths: shift(s.paths, s) }])),
    variants: play.variants.map(v => ({ ...v, defPaths: Object.fromEntries(Object.entries(v.defPaths)
      .map(([id, group]) => [id, shift(group, play.segments[id])])) })),
  };
}
