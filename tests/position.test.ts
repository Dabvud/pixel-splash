import { describe, expect, it } from 'vitest';
import { positionValue } from '../src/play/position';

describe('Positionswert', () => {
  const attacker = { x: 0, z: 3 };

  it.each([
    [{ x: 0, z: 2.5 }, 0],
    [{ x: 0.5, z: 3 }, 0.8],
    [{ x: 0, z: 3.5 }, 1],
    [{ x: 0, z: 0.5 }, 1],
    [{ x: 0, z: 1 }, 1],
    [{ x: 0, z: 1.75 }, 0.5],
  ])('liefert für Verteidiger %j den Wert %s', (defender, expected) => {
    expect(positionValue(attacker, [defender])).toBeCloseTo(expected, 10);
  });

  it('nimmt das Minimum über alle Verteidiger unabhängig von der Reihenfolge', () => {
    const defenders = [{ x: 0.5, z: 3 }, { x: 0, z: 2.5 }];
    expect(positionValue(attacker, defenders)).toBe(0);
    expect(positionValue(attacker, defenders.reverse())).toBe(0);
  });

  it('liefert ohne Verteidiger eins und berücksichtigt einen eigenen Ringpunkt', () => {
    expect(positionValue(attacker, [])).toBe(1);
    expect(positionValue(attacker, [{ x: 0.5, z: 3 }], { x: 3, z: 3 })).toBe(0);
  });
});
