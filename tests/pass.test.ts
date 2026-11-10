import { describe, expect, it } from 'vitest';
import { laneFromAngle, passTime, pickTarget, stealChance, swipeAngleTo } from '../src/play/pass';
import type { ScreenTarget } from '../src/play/pass';

describe('Pass-Zielwahl', () => {
  const origin = { x: 100, y: 200 };
  const target = (id: string, deg: number, distM: number): ScreenTarget => ({
    id, x: origin.x + 100 * Math.cos(deg * Math.PI / 180),
    y: origin.y + 100 * Math.sin(deg * Math.PI / 180), distM,
  });

  it('wählt bei Wisch nach rechts das Ziel rechts mit dem kleinsten Winkel', () => {
    expect(pickTarget(origin, { dx: 80, dy: 0 }, [target('oben', -90, 2),
      target('rim', 20, 2), target('rechts', 0, 5)])).toBe('rechts');
  });

  it('liefert ohne Ziel innerhalb 45 Grad keine Aktion', () => {
    expect(pickTarget(origin, { dx: 80, dy: 0 }, [target('oben', -90, 2)])).toBeNull();
    expect(pickTarget(origin, { dx: 80, dy: 0 }, [])).toBeNull();
  });

  it('lässt bei zwei Zielen mit 10 Grad Abstand die geringere Meterdistanz entscheiden', () => {
    const targets = [target('fern', 0, 8), target('nah', 10, 3)];
    expect(pickTarget(origin, { dx: 80, dy: 0 }, targets)).toBe('nah');
    expect(pickTarget(origin, { dx: 80, dy: 0 }, targets.reverse())).toBe('nah');
  });

  it('wählt ein Ziel außerhalb des Bildes per Wisch nach links', () => {
    expect(pickTarget(origin, { dx: -80, dy: 0 }, [
      { id: 'ecke', x: -200, y: 200, distM: 6 },
    ])).toBe('ecke');
  });

  it('ignoriert einen Nullvektor und ein Ziel direkt am Ursprung', () => {
    expect(pickTarget(origin, { dx: 0, dy: 0 }, [target('rim', 0, 2)])).toBeNull();
    expect(pickTarget(origin, { dx: 80, dy: 0 }, [{ id: 'selbst', ...origin, distM: 0 }])).toBeNull();
  });

  it('misst links negativ und rechts positiv relativ zur Zielrichtung', () => {
    const rim = { x: 100, y: 100 };
    expect(swipeAngleTo(origin, rim, { dx: -60, dy: -60 })).toBeCloseTo(-45, 10);
    expect(swipeAngleTo(origin, rim, { dx: 60, dy: -60 })).toBeCloseTo(45, 10);
    expect(swipeAngleTo(origin, rim, { dx: 0, dy: -60 })).toBe(0);
  });

  it.each([[-10, -1], [-8, 0], [5, 0], [8, 0], [10, 1]] as const)(
    'ordnet Winkel %s der Bahn %s zu', (deg, lane) => {
      expect(laneFromAngle(deg)).toBe(lane);
    });
});

describe('Passweg und Flugzeit', () => {
  const from = { x: 0, z: 0 };
  const to = { x: 10, z: 0 };

  it.each([[0.4, 0.6], [0.5, 0.2], [0.8, 0.2], [1, 0], [1.2, 0]])(
    'berechnet bei %s m Abstand die Steal-Chance %s', (z, expected) => {
      expect(stealChance(from, to, [{ x: 5, z }], 0)).toBe(expected);
    });

  it('verwendet außerhalb der Strecke den Abstand zum nächsten Endpunkt', () => {
    expect(stealChance(from, to, [{ x: -0.4, z: 0 }], 0)).toBe(0.6);
    expect(stealChance(from, to, [{ x: -1.2, z: 0 }], 0)).toBe(0);
    expect(stealChance(from, to, [{ x: 10.8, z: 0 }], 0)).toBe(0.2);
  });

  it('nimmt den kleinsten Verteidigerabstand und liefert ohne Verteidiger null', () => {
    expect(stealChance(from, to, [], 0)).toBe(0);
    expect(stealChance(from, to, [{ x: 5, z: 0.8 }, { x: 3, z: 0.4 }], 0)).toBe(0.6);
    expect(stealChance(from, from, [{ x: 0.8, z: 0 }], 0)).toBe(0.2);
  });

  it.each([
    [.4, 1, .09], [.4, .5, .345], [.4, 0, .6],
    [.8, 1, .03], [.8, .5, .115], [.8, 0, .2],
    [1.2, 1, 0], [1.2, .5, 0], [1.2, 0, 0],
  ])('gewichtet bei %s m die Steal-Chance mit q=%s zu %s', (z, quality, expected) => {
    expect(stealChance(from, to, [{ x: 5, z }], quality)).toBeCloseTo(expected, 10);
  });

  it('berechnet für zehn Meter 0,85 Sekunden Flugzeit', () => {
    expect(passTime(10)).toBeCloseTo(0.85, 10);
  });
});
