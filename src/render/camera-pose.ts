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
  // Über die rechte Schulter, damit der Spieler im Hochformat den Korb nicht verdeckt
  return {
    pos: { x: shooter.x + ux * 5.2 + uz * 0.7, y: 3 + 1.5 * progress, z: shooter.z + uz * 5.2 - ux * 0.7 },
    look: { x: RIM.x, y: RIM.y - 0.75 + 0.75 * progress, z: RIM.z },
  };
}
