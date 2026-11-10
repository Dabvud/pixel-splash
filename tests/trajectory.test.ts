import { describe, expect, it } from 'vitest';
import { RIM, buildFlight, targetPoint } from '../src/shot/trajectory';
import type { Vec3 } from '../src/shot/trajectory';
import type { Outcome } from '../src/shot/resolve';

const outcomes: Outcome[] = [
  'swish', 'rim_in', 'roll_in', 'roll_out', 'rim_front', 'rim_back',
  'rim_left', 'rim_right', 'airball', 'board', 'wide_left', 'wide_right',
];
const made: Outcome[] = ['swish', 'rim_in', 'roll_in'];
const top = { x: 0, y: 2.45, z: 6.9 };
const corner = { x: -6.6, y: 2.45, z: 0.5 };

function expectPoint(actual: Vec3, expected: Vec3): void {
  for (const axis of ['x', 'y', 'z'] as const) {
    expect(Math.abs(actual[axis] - expected[axis])).toBeLessThan(0.01);
  }
}

describe('Zielpunkte', () => {
  it('verwendet die vorgegebene Ringmitte', () => {
    expect(RIM).toEqual({ x: 0, y: 3.05, z: 0 });
  });

  it.each<[Outcome, Vec3]>([
    ['swish', { x: 0, y: 3.05, z: 0 }],
    ['rim_in', { x: 0, y: 3.05, z: 0.23 }],
    ['roll_in', { x: 0, y: 3.05, z: 0.23 }],
    ['roll_out', { x: 0, y: 3.05, z: 0.23 }],
    ['rim_front', { x: 0, y: 3.05, z: 0.23 }],
    ['rim_back', { x: 0, y: 3.05, z: -0.23 }],
    ['rim_left', { x: -0.23, y: 3.05, z: 0 }],
    ['rim_right', { x: 0.23, y: 3.05, z: 0 }],
    ['airball', { x: 0, y: 2.4, z: 0.9 }],
    ['board', { x: 0, y: 3.45, z: -0.35 }],
    ['wide_left', { x: -0.7, y: 3.05, z: 0 }],
    ['wide_right', { x: 0.7, y: 3.05, z: 0 }],
  ])('zielt für %s vom Top-Spot auf die richtige Stelle', (outcome, expected) => {
    expectPoint(targetPoint(outcome, top), expected);
  });

  it('ordnet vorne, hinten, links und rechts aus Werfersicht zu', () => {
    expect(targetPoint('rim_left', top).x).toBeLessThan(0);
    expect(targetPoint('rim_right', top).x).toBeGreaterThan(0);
    expect(targetPoint('rim_front', top).z).toBeGreaterThan(0);
    expect(targetPoint('rim_back', top).z).toBeLessThan(0);
    const front = targetPoint('rim_front', corner);
    const left = targetPoint('rim_left', corner);
    expect(front.x).toBeLessThan(0);
    expect(front.z).toBeGreaterThan(0);
    expect(left.x).toBeLessThan(0);
    expect(left.z).toBeLessThan(0);
    expect(Math.hypot(front.x, front.z)).toBeCloseTo(0.23, 8);
    expect(Math.hypot(left.x, left.z)).toBeCloseTo(0.23, 8);
    expect(front.x * left.x + front.z * left.z).toBeCloseTo(0, 8);
  });
});

for (const [label, from] of [['Top', top], ['Ecke', corner]] as const) {
  describe(`Flugbahn von ${label}`, () => {
    it.each(outcomes)('startet an der Hand und erreicht den Zielpunkt für %s', (outcome) => {
      const flight = buildFlight(outcome, from);
      expect(flight.at(0)).toEqual(from);
      expectPoint(flight.at(flight.arcEnd), targetPoint(outcome, from));
    });

    it.each(outcomes)('erreicht einen Scheitel über Ringhöhe für %s', (outcome) => {
      const flight = buildFlight(outcome, from);
      const heights = Array.from({ length: 100 }, (_, i) => flight.at(i / 99 * flight.arcEnd).y);
      expect(Math.max(...heights)).toBeGreaterThan(3.05);
      expect(Math.max(...heights)).toBeCloseTo(3.05 + 1 + 0.15 * Math.hypot(from.x, from.z), 2);
    });

    it.each(outcomes)('endet am Boden und %s auf der richtigen Seite des Korbs', (outcome) => {
      const flight = buildFlight(outcome, from);
      const end = flight.at(flight.duration);
      expect(end.y).toBeCloseTo(0.12, 8);
      if (made.includes(outcome)) expect(Math.hypot(end.x, end.z)).toBeLessThan(0.3);
      else expect(Math.hypot(end.x, end.z)).toBeGreaterThan(0.3);
    });

    it.each(outcomes)('begrenzt die Zeit und bleibt für %s stetig', (outcome) => {
      const flight = buildFlight(outcome, from);
      expect(flight.arcEnd).toBeGreaterThanOrEqual(0.9);
      expect(flight.arcEnd).toBeLessThanOrEqual(1.2);
      expect(flight.duration).toBeGreaterThan(flight.arcEnd);
      expect(flight.at(flight.duration + 100)).toEqual(flight.at(flight.duration));
      expect(flight.at(-1)).toEqual(from);
      let previous = flight.at(0);
      for (let i = 1; i <= 1000; i++) {
        const point = flight.at(i / 1000 * flight.duration);
        expect(point.y).toBeGreaterThanOrEqual(0.12 - 1e-8);
        expect(Math.hypot(point.x - previous.x, point.y - previous.y, point.z - previous.z)).toBeLessThan(0.1);
        previous = point;
      }
    });

    it.each(made)('führt %s nach der Ringberührung durchs Netz', (outcome) => {
      const flight = buildFlight(outcome, from);
      const belowRim = Array.from({ length: 100 }, (_, i) =>
        flight.at(flight.arcEnd + (i + 1) / 100 * (flight.duration - flight.arcEnd)))
        .filter((point) => point.y < 3 && point.y > 0.3);
      expect(belowRim.length).toBeGreaterThan(0);
      for (const point of belowRim) expect(Math.hypot(point.x, point.z)).toBeLessThan(0.23);
    });
  });
}

describe('Flugphasen', () => {
  it('erhöht den Scheitel und die Flugzeit mit der Distanz', () => {
    const near = buildFlight('swish', { x: 0, y: 2.45, z: 4.2 });
    const far = buildFlight('swish', top);
    expect(near.arcEnd).toBeCloseTo(1.11, 8);
    expect(far.arcEnd).toBe(1.2);
    const max = (flight: ReturnType<typeof buildFlight>) => Math.max(...Array.from(
      { length: 100 }, (_, i) => flight.at(i / 99 * flight.arcEnd).y,
    ));
    expect(max(far)).toBeGreaterThan(max(near));
  });

  it.each(['rim_front', 'rim_left', 'rim_right', 'roll_out'] as const)('prallt bei %s vom Ring weg ab', (outcome) => {
    const flight = buildFlight(outcome, top);
    const target = targetPoint(outcome, top);
    const rebound = flight.at(flight.arcEnd + 0.5);
    expect(rebound.x * target.x + rebound.z * target.z).toBeGreaterThan(target.x ** 2 + target.z ** 2);
    expect(rebound.y).toBeGreaterThan(0.12);
  });

  it('prallt bei rim_back vor dem Brett zurück', () => {
    const flight = buildFlight('rim_back', top);
    const contactS = flight.arcEnd + (.375 - .23) / 1.6;
    const contact = flight.at(contactS);
    expect(contact.z).toBeCloseTo(-.375, 10);
    expect(contact.y).toBeGreaterThanOrEqual(2.895);
    expect(contact.y).toBeLessThanOrEqual(3.945);
    expect(flight.at(contactS - .01).z).toBeGreaterThan(contact.z);
    expect(flight.at(contactS + .01).z).toBeGreaterThan(contact.z);
    const rebound = flight.at(flight.arcEnd + .5);
    expect(rebound.z).toBeCloseTo(.28, 10);
    expect(rebound.y).toBeGreaterThan(.12);
  });

  it('prallt vom Brett zum Werfer ab', () => {
    const flight = buildFlight('board', corner);
    const target = targetPoint('board', corner);
    const rebound = flight.at(flight.arcEnd + 0.5);
    expect(rebound.x).toBeLessThan(target.x);
    expect(rebound.z).toBeGreaterThan(target.z);
    expect((rebound.x - target.x) / (rebound.z - target.z))
      .toBeCloseTo((corner.x - target.x) / (corner.z - target.z), 8);
  });

  it.each(['airball', 'wide_left', 'wide_right'] as const)('setzt für %s die waagerechte Geschwindigkeit fort', (outcome) => {
    const flight = buildFlight(outcome, top);
    const before = flight.at(flight.arcEnd - 0.01);
    const target = flight.at(flight.arcEnd);
    const after = flight.at(flight.arcEnd + 0.01);
    expect(after.x - target.x).toBeCloseTo(target.x - before.x, 8);
    expect(after.z - target.z).toBeCloseTo(target.z - before.z, 8);
    expect(after.y).toBeLessThan(target.y);
  });

  it('springt nach dem ersten Bodenkontakt aus und endet wieder am Boden', () => {
    const flight = buildFlight('rim_front', top);
    const points = Array.from({ length: 3001 }, (_, i) => flight.at(i / 3000 * flight.duration));
    const ground = points.findIndex((point, i) => i > 100 && point.y < 0.125);
    expect(ground).toBeGreaterThan(0);
    expect(Math.max(...points.slice(ground + 1).map((point) => point.y))).toBeGreaterThan(0.2);
    expect(points.at(-1)!.y).toBeCloseTo(0.12, 8);
  });
});
