import type { Vec2 } from './position';
import type { Play } from './types';

/** Verteidigungstaktik gegen den Ballblock – pro Angriff gewürfelt (Spielszenarien B1) */
export type Tactic = 'switch' | 'drop' | 'hedge' | 'blitz' | 'under';
export const TACTICS: Tactic[] = ['switch', 'drop', 'hedge', 'blitz', 'under'];
export const TACTIC_NAME: Record<Tactic, string> = { switch: 'Switch', drop: 'Drop', hedge: 'Hedge', blitz: 'Doppeln', under: 'Unter dem Block' };

const RIM: Vec2 = { x: 0, z: 0 };

function at(path: { t: number; x: number; z: number }[], t: number): Vec2 {
  if (t <= path[0].t) return path[0];
  for (let i = 1; i < path.length; i++) if (t <= path[i].t) {
    const a = path[i - 1], b = path[i], f = (t - a.t) / Math.max(1e-6, b.t - a.t);
    return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f };
  }
  return path[path.length - 1];
}

/** Ballblock im Startsegment: Blocksteller mit „screen“, an dessen Blockpunkt der Ballführer auf ≤ 2,5 m vorbeikommt */
export function findBallScreen(play: Play): { screener: string; t: number } | null {
  const seg = play.segments[play.start], hp = seg.paths[seg.handler];
  if (!hp?.length) return null;
  const end = seg.decisionAt ?? hp[hp.length - 1].t;
  let best: { screener: string; t: number; d: number } | null = null;
  for (const [id, path] of Object.entries(seg.paths)) {
    if (id === seg.handler) continue;
    for (const w of path) {
      if (w.act !== 'screen') continue;
      for (let t = 0; t <= end + 1e-9; t += .1) {
        const d = Math.hypot(at(hp, t).x - w.x, at(hp, t).z - w.z);
        // Die Abwehr reagiert schon etwa 1 s bevor der Ballführer den Block erreicht
        if (d <= 2.5 && (!best || d < best.d)) best = { screener: id, t: Math.max(w.t, t - 1), d };
      }
    }
  }
  return best && { screener: best.screener, t: best.t };
}

const toward = (from: Vec2, to: Vec2, m: number): Vec2 => {
  const d = Math.hypot(to.x - from.x, to.z - from.z) || 1;
  return { x: from.x + (to.x - from.x) / d * m, z: from.z + (to.z - from.z) / d * m };
};

/** Zielpunkt eines Verteidigers: hd = Verteidiger des Ballführers, sd = Verteidiger des Blockstellers; elapsed = Sekunden seit dem Block */
export function tacticTarget(t: Tactic, role: 'hd' | 'sd', handler: Vec2, screener: Vec2, elapsed: number): Vec2 {
  const side = (p: Vec2, s: number) => { const d = Math.hypot(p.x, p.z) || 1; return { x: p.x + (-p.z / d) * s, z: p.z + (p.x / d) * s }; };
  switch (t) {
    case 'switch': return role === 'hd' ? toward(screener, RIM, .8) : toward(handler, RIM, .9);
    case 'blitz': return side(toward(handler, RIM, .6), role === 'hd' ? -.6 : .6);
    case 'drop': return role === 'sd' ? toward(RIM, handler, 2.4) : toward(handler, RIM, -.6); // hd läuft hinterher
    case 'under': return role === 'hd' ? toward(handler, RIM, 1.9) : toward(screener, RIM, .8);
    case 'hedge': return role === 'sd' ? elapsed < .8 ? toward(handler, RIM, .7) : toward(screener, RIM, .8) : toward(handler, RIM, .9);
  }
}
