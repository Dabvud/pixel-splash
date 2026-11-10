import { RIM } from '../shot/trajectory';
import type { Vec3 } from '../shot/trajectory';

export interface Pose { pos: Vec3; look: Vec3 }

export function cameraPose(mode: 'low' | 'high' | 'auto', shooter: Vec3, flightProgress: number | null): Pose {
  const distance = Math.hypot(shooter.x, shooter.z);
  const ux = shooter.x / distance;
  const uz = shooter.z / distance;
  if (mode === 'high') {
    return {
      pos: { x: shooter.x + ux * 6.5, y: 7, z: shooter.z + uz * 6.5 },
      look: { x: RIM.x + ux * 1.5, y: 1.2, z: RIM.z + uz * 1.5 },
    };
  }
  const progress = mode === 'auto' && flightProgress !== null
    ? Math.max(0, Math.min(1, flightProgress)) : 0;
  // Auf der Achse Korb→Werfer, damit „gerade nach oben wischen“ auf dem Bildschirm genau auf den Korb zeigt.
  return {
    pos: { x: shooter.x + ux * 5.2, y: 3 + 1.5 * progress, z: shooter.z + uz * 5.2 },
    look: { x: RIM.x, y: RIM.y - 0.75 + 0.75 * progress, z: RIM.z },
  };
}

// Spielzug-Labor: 'wide' = erhöht für Entscheidungen, 'aim' = tief für Wurf/Abschluss.
// Beide stehen auf der Achse Korb→Ballführer, damit „gerade nach oben wischen“ immer zum Korb zeigt.
export function playCameraPose(view: 'wide' | 'aim', handler: { x: number; z: number }): Pose & { fov: number } {
  const distance = Math.hypot(handler.x, handler.z);
  const ux = distance > 0 ? handler.x / distance : 0;
  const uz = distance > 0 ? handler.z / distance : 1;
  if (view === 'aim') {
    const t = Math.max(0, Math.min(1, distance - 3));
    const radius = distance + 7.5 + (5.2 - 7.5) * t;
    const ax = distance < .5 ? 0 : ux, az = distance < .5 ? 1 : uz;
    return {
      pos: { x: RIM.x + ax * radius, y: 4.2 + (3 - 4.2) * t, z: RIM.z + az * radius },
      look: { x: RIM.x, y: 2.6 + (RIM.y - .75 - 2.6) * t, z: RIM.z },
      fov: 50,
    };
  }
  return {
    pos: { x: handler.x + ux * 7, y: 8, z: handler.z + uz * 7 },
    look: { x: handler.x * 0.45, y: 1, z: handler.z * 0.45 },
    fov: 60,
  };
}

/** Übersicht mit 8 % Rand, einschließlich Füßen/Kopf der Spieler und Ring. */
export function overviewPose(handler: { x: number; z: number }, targets: { x: number; z: number }[], aspect: number): Pose & { fov: number } {
  const distance = Math.hypot(handler.x, handler.z);
  let ux = distance > 0 ? handler.x / distance : 0;
  let uz = distance > 0 ? handler.z / distance : 1;
  const wide = playCameraPose('wide', handler);
  const behind = targets.some(p =>
    (p.x - wide.pos.x) * (wide.pos.x - wide.look.x)
    + (1 - wide.pos.y) * (wide.pos.y - wide.look.y)
    + (p.z - wide.pos.z) * (wide.pos.z - wide.look.z) >= 0);
  if (distance < 4 || behind) {
    const group = targets.length ? targets : [handler];
    const x = group.reduce((sum, p) => sum + p.x, 0) / group.length;
    const z = group.reduce((sum, p) => sum + p.z, 0) / group.length;
    const length = Math.hypot(x, z);
    ux = length > 1e-8 ? x / length : 0;
    uz = length > 1e-8 ? z / length : 1;
  }
  const look = { x: 0, y: 1, z: 0 };
  // Feste Neigung: beim Zurückfahren wächst gleichzeitig die Höhe.
  const cos = 1 / Math.hypot(1, .65), sin = .65 * cos;
  const tan = Math.tan(Math.PI / 6), margin = .84;
  let depth = Math.max((distance + 7) / cos, 7 / sin);
  const points = [handler, ...targets].flatMap(p => [0, 2.2].map(y => ({ ...p, y })));
  points.push(RIM);
  for (const p of points) {
    const y = p.y - look.y;
    const along = p.x * ux + p.z * uz;
    const right = p.x * uz - p.z * ux;
    const up = y * cos - along * sin;
    const back = along * cos + y * sin;
    // Perspective: |x| / (Tiefe * tan(fov/2) * aspect) ≤ 0,84.
    depth = Math.max(depth, back + Math.max(Math.abs(right) / (tan * aspect * margin), Math.abs(up) / (tan * margin), .1) + .01);
  }
  return {
    pos: { x: ux * cos * depth, y: look.y + sin * depth, z: uz * cos * depth },
    look,
    fov: 60,
  };
}

// Korbleger/Dunk sind nur im Profil erkennbar: Kamera 55° neben der Zuglinie, nie hinter dem Brett.
// (Beim Abschluss wird nur getippt, die Wischrichtung muss deshalb nicht zum Korb zeigen.)
export function finishCameraPose(handler: { x: number; z: number }): Pose & { fov: number } {
  const axis = Math.hypot(handler.x, handler.z) > 0.5 ? Math.atan2(handler.x, handler.z) : 0;
  const side = axis <= 0 ? 1 : -1;
  const angle = Math.max(-70, Math.min(70, (axis * 180) / Math.PI + side * 55)) * (Math.PI / 180);
  return {
    pos: { x: Math.sin(angle) * 7.5, y: 3.2, z: Math.cos(angle) * 7.5 },
    look: { x: 0, y: 2.7, z: 0 },
    fov: 50,
  };
}
