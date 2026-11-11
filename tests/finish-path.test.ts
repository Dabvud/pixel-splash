import { describe, expect, it } from 'vitest';
import { buildFinishFlight } from '../src/shot/finish-path';
import { RIM, buildFlight, targetPoint } from '../src/shot/trajectory';
import type { Outcome } from '../src/shot/resolve';
import type { Vec3 } from '../src/shot/trajectory';

const outcomes: Outcome[] = ['swish', 'rim_in', 'roll_in', 'roll_out', 'rim_front', 'rim_back',
  'rim_left', 'rim_right', 'airball', 'board', 'wide_left', 'wide_right'];
const made: Outcome[] = ['swish', 'rim_in', 'roll_in'];
const release = { x: -0.4, y: 3.2, z: 0.8 };
const rimContactS = 0.3;

function expectPoint(actual: Vec3, expected: Vec3): void {
  for (const axis of ['x', 'y', 'z'] as const) expect(actual[axis]).toBeCloseTo(expected[axis], 8);
}

describe('Seitlicher Korbleger-Bogen (φ ≈ 26,6°)', () => {
  it.each(outcomes)('erreicht für %s nach 0,4–0,5 Sekunden den spezifizierten Zielpunkt', (outcome) => {
    const expectedOutcome = made.includes(outcome) ? 'bank_in' : outcome === 'airball' ? 'rim_front' : outcome;
    const target = targetPoint(expectedOutcome, release);
    // Fehlversuche treffen höchstens einen Ballradius vor dem Brett (nie dahinter)
    if (!made.includes(outcome) && target.z < -0.375 + 0.12) target.z = -0.375 + 0.12;
    const flight = buildFinishFlight('layup', outcome, release, rimContactS);
    expect(flight.arcEnd).toBeGreaterThanOrEqual(0.4);
    expect(flight.arcEnd).toBeLessThanOrEqual(0.5);
    expectPoint(flight.at(flight.arcEnd), target);
    const heights = Array.from({ length: 101 }, (_, i) => flight.at(i / 100 * flight.arcEnd).y);
    expect(Math.max(...heights)).toBeGreaterThan(Math.max(release.y, target.y));
  });

  // Fehlversuche nutzen seit 2026-11-11 die Abprallbahn (sichtbar vom Ring weg), nur Treffer folgen buildFlight.
  it.each(outcomes.filter(o => made.includes(o)))('führt Fallen, Abpraller und Aufspringen für %s mit der passenden buildFlight-Bahn fort', (outcome) => {
    const flight = buildFinishFlight('layup', outcome, release, rimContactS);
    const original = buildFlight(made.includes(outcome) ? 'bank_in' : outcome, release);
    const remaining = original.duration - original.arcEnd;
    expect(flight.duration - flight.arcEnd).toBeCloseTo(remaining, 10);
    for (const progress of [0.1, 0.3, 0.5, 0.8, 1]) {
      expectPoint(flight.at(flight.arcEnd + progress * remaining),
        original.at(original.arcEnd + progress * remaining));
    }
  });
});

describe('Frontaler Korbleger-Bogen (φ < 20°)', () => {
  it.each(made)('behält für %s den direkten Zielpunkt und die bisherige Fortsetzung bei', outcome => {
    for (const phi of [-19.99, -10, 0, 10, 19.99]) {
      const from = { x: Math.tan(phi * Math.PI / 180), y: 3.2, z: 1 };
      const flight = buildFinishFlight('layup', outcome, from, rimContactS);
      const original = buildFlight(outcome, from);
      expectPoint(flight.at(flight.arcEnd), targetPoint(outcome, from));
      const remaining = original.duration - original.arcEnd;
      expect(flight.duration - flight.arcEnd).toBeCloseTo(remaining, 10);
      for (const progress of [0.1, 0.3, 0.5, 0.8, 1]) {
        expectPoint(flight.at(flight.arcEnd + progress * remaining),
          original.at(original.arcEnd + progress * remaining));
      }
    }
  });
});

for (const kind of ['layup', 'dunk', 'contact_dunk'] as const) {
  describe(`Abschlussbahn ${kind}`, () => {
    it.each(outcomes)('startet für %s am Release und endet am richtigen Bodenpunkt', (outcome) => {
      const flight = buildFinishFlight(kind, outcome, release, rimContactS);
      expect(flight.at(0)).toEqual(release);
      expect(flight.at(-1)).toEqual(release);
      const end = flight.at(flight.duration);
      expect(end.y).toBeCloseTo(0.12, 8);
      if (made.includes(outcome)) {
        expect(end.x).toBe(RIM.x);
        expect(end.z).toBe(RIM.z);
      } else expect(Math.hypot(end.x - RIM.x, end.z - RIM.z)).toBeGreaterThan(0.3);
      expect(flight.at(flight.duration + 10)).toEqual(end);
    });

    it.each(outcomes)('bleibt für %s an allen Phasenübergängen stetig', (outcome) => {
      const flight = buildFinishFlight(kind, outcome, release, rimContactS);
      let previous = flight.at(0);
      for (let i = 1; i <= 1000; i++) {
        const point = flight.at(i / 1000 * flight.duration);
        expect(Math.hypot(point.x - previous.x, point.y - previous.y, point.z - previous.z)).toBeLessThan(0.1);
        expect(point.y).toBeGreaterThanOrEqual(0.12 - 1e-8);
        previous = point;
      }
    });
  });
}

describe('Abschlussbahn zeigt den Timingfehler', () => {
  for (const kind of ['layup', 'dunk', 'contact_dunk'] as const) {
    it.each(['rim_front', 'airball'] as const)(`${kind}: %s prallt am vorderen Ring zum Werfer zurück`, outcome => {
      for (const from of [{ x: 0, y: 3.1, z: 1.2 }, { x: -1, y: 3.1, z: 1 }]) {
        const flight = buildFinishFlight(kind, outcome, from, .3);
        const contact = flight.at(flight.arcEnd), end = flight.at(flight.duration);
        expect(contact.y).toBeCloseTo(RIM.y, 8);
        expect(contact.x * from.x + contact.z * from.z).toBeGreaterThan(0);
        expect(end.x * from.x + end.z * from.z).toBeGreaterThan(.3);
      }
    });
    // Zu spät: Kontakt hinten (Ring bzw. Brett), dann nach oben und deutlich nach vorn heraus –
    // ein Ball, der direkt hinter dem Ring herunterfällt, sähe aus der Seitenkamera wie ein Korb aus.
    it.each(['rim_back', 'board'] as const)(`${kind}: %s trifft hinten, prallt nach oben ab und springt nach vorn heraus`, outcome => {
      const from = { x: 0, y: 3.1, z: 1.2 }, flight = buildFinishFlight(kind, outcome, from, .3);
      const contact = flight.at(flight.arcEnd);
      expect(contact.z).toBeLessThan(0);
      expect(flight.at(flight.arcEnd + .1).y).toBeGreaterThan(contact.y);
      expect(flight.at(flight.duration).z).toBeGreaterThan(0.5);
    });
  }

  it('stoppt den Kontakt-Dunk an der Blockhand und fällt zur Werferseite weg', () => {
    const from = { x: 0, y: 2.8, z: 1.2 }, block = { x: .1, y: 2.9, z: .7 };
    const flight = buildFinishFlight('contact_dunk', 'rim_front', from, .2, { block, from });
    expectPoint(flight.at(flight.arcEnd), block);
    for (let i = 0; i <= 500; i++) {
      const p = flight.at(flight.duration * i / 500);
      expect(p.y).toBeLessThanOrEqual(block.y);
      expect(p.z).toBeGreaterThanOrEqual(block.z);
    }
    expect(flight.at(flight.duration).z).toBeGreaterThan(from.z);
  });
});

for (const kind of ['dunk', 'contact_dunk'] as const) {
  describe(`Ringkontakt ${kind}`, () => {
    it.each([0.2, 0.5])('folgt bis zum Ringkontakt bei %s Sekunden der Hand linear', (contactS) => {
      const flight = buildFinishFlight(kind, 'swish', release, contactS);
      expect(flight.arcEnd).toBe(contactS);
      const contact = { ...RIM, y: RIM.y + 0.1 };
      expectPoint(flight.at(contactS), contact);
      expectPoint(flight.at(contactS / 2), {
        x: (release.x + contact.x) / 2, y: (release.y + contact.y) / 2, z: (release.z + contact.z) / 2,
      });
      const below = flight.at(contactS + 0.25);
      expect(below.y).toBeLessThan(RIM.y);
      expect(below.x).toBe(RIM.x);
      expect(below.z).toBe(RIM.z);
    });

    it('prallt beim Fehlversuch vom Ring nach außen ab', () => {
      const flight = buildFinishFlight(kind, 'rim_front', release, rimContactS);
      const afterContact = flight.at(rimContactS + 0.2);
      expect(Math.hypot(afterContact.x, afterContact.z)).toBeGreaterThan(0.3);
    });
  });
}
