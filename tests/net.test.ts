import { describe, expect, it } from 'vitest';
import { netHit, netPose } from '../src/render/net';

describe('Netz-Bewegung', () => {
  it('ruht vor dem Treffer und nach 0,4 s', () => {
    expect(netPose(-1, 1.5)).toEqual({ sy: 1, dx: 0 });
    expect(netPose(0.41, 1.5)).toEqual({ sy: 1, dx: 0 });
  });

  it('streckt sich beim Swish bis etwa ×1,5 und beim Ringtreffer bis etwa ×1,25 mit Wackeln', () => {
    const peak = (strength: number) => Math.max(...Array.from({ length: 40 }, (_, i) => netPose(i / 100, strength).sy));
    expect(peak(1.5)).toBeGreaterThan(1.4);
    expect(peak(1.5)).toBeLessThanOrEqual(1.5);
    expect(peak(1.25)).toBeGreaterThan(1.18);
    expect(peak(1.25)).toBeLessThanOrEqual(1.25);
    expect(Math.abs(netPose(0.05, 1.25).dx)).toBeGreaterThan(0);
    expect(netPose(0.05, 1.5).dx).toBe(0);
  });

  it('wackelt beim Ring-Fehlwurf nur seitlich', () => {
    expect(netPose(0.05, 1).sy).toBe(1);
    expect(Math.abs(netPose(0.05, 1).dx)).toBeGreaterThan(0);
  });

  it('erkennt den Durchgang durch den Ring und den Ringkontakt', () => {
    expect(netHit({ x: 0, y: 3.1, z: 0 }, { x: 0.02, y: 2.95, z: 0 })).toBe(1.5);
    expect(netHit({ x: 0.15, y: 3.1, z: 0 }, { x: 0.15, y: 2.95, z: 0 })).toBe(1.25);
    expect(netHit({ x: 0.6, y: 3.3, z: 0 }, { x: 0.3, y: 3.05, z: 0 })).toBe(1);
    expect(netHit({ x: 0.3, y: 3.06, z: 0 }, { x: 0.3, y: 3.04, z: 0 })).toBeNull();
    expect(netHit({ x: 2, y: 3.1, z: 2 }, { x: 2, y: 2.9, z: 2 })).toBeNull();
  });
});
