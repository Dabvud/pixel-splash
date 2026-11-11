export interface Vec2 { x: number; z: number }
export interface DefenderPosition extends Vec2 { weight?: number }

export function positionValue(att: Vec2, defenders: DefenderPosition[], rim: Vec2 = { x: 0, z: 0 }): number {
  const rx = rim.x - att.x;
  const rz = rim.z - att.z;
  const rimDistance = Math.hypot(rx, rz);
  let P = 1;
  for (const defender of defenders) {
    const dx = defender.x - att.x;
    const dz = defender.z - att.z;
    const d = Math.hypot(dx, dz);
    const c = Math.max(0, Math.min(1, (2 - d) / 1.5));
    const cos = d === 0 ? 1 : (rx * dx + rz * dz) / (rimDistance * d || 1);
    const w = Math.max(0, Math.min(1, 0.2 + 0.8 * cos));
    P = Math.min(P, 1 - c * w * (defender.weight ?? 1));
  }
  return P;
}
