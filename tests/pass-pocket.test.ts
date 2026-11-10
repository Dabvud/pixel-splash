import { describe, expect, it } from 'vitest';
import { passQuality, pickTargetWithAngle, pickTarget } from '../src/play/pass';

describe('Passgenauigkeit', () => {
  it.each([[0, 1], [5, 1], [25, .5], [45, 0], [60, 0]])(
    'liefert für %s Grad q = %s', (angle, q) => {
      expect(passQuality(angle)).toBe(q);
      expect(passQuality(-angle)).toBe(q);
    });
  it('liefert den Winkel des tatsächlich gewählten nahen Ziels', () => {
    const origin = { x: 0, y: 0 }, swipe = { dx: 100, dy: 0 };
    const targets = [{ id: 'fern', x: 100, y: 0, distM: 8 },
      { id: 'nah', x: 100 * Math.cos(Math.PI / 18), y: 100 * Math.sin(Math.PI / 18), distM: 3 }];
    const picked = pickTargetWithAngle(origin, swipe, targets)!;
    expect(picked.id).toBe('nah');
    expect(picked.angleDeg).toBeCloseTo(-10);
    expect(pickTarget(origin, swipe, targets)).toBe(picked.id);
    expect(pickTargetWithAngle(origin, { dx: 0, dy: 0 }, targets)).toBeNull();
    expect(pickTargetWithAngle(origin, { dx: -100, dy: 0 }, targets)).toBeNull();
  });
});
