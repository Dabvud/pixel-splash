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
