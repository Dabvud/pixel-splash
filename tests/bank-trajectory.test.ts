import { describe, expect, it } from 'vitest';
import { buildFlight, targetPoint } from '../src/shot/trajectory';
import { buildFinishFlight } from '../src/shot/finish-path';
import type { Flight, Vec3 } from '../src/shot/trajectory';
import type { Outcome } from '../src/shot/resolve';

const outcomes: Outcome[] = ['swish', 'rim_in', 'roll_in', 'bank_in', 'roll_out', 'rim_front',
  'rim_back', 'rim_left', 'rim_right', 'airball', 'board', 'wide_left', 'wide_right'];
const positions: Vec3[] = [{ x: 0, y: 2.45, z: 6.9 }, { x: -4.8, y: 2.45, z: 4.8 },
  { x: 4.8, y: 2.45, z: 4.8 }, { x: -6.6, y: 2.45, z: .5 }, { x: 6.6, y: 2.45, z: .5 },
  { x: -.4, y: 3.2, z: .8 }, { x: .4, y: 3.2, z: .8 }];

function checkBoard(flight: Flight): void {
  // Phasenwechsel explizit prüfen; 512 Stichproben genügen für die übrige Bahn.
  // Assertions pro Bahn statt pro Stichprobe halten auch die Outcome-Matrix schnell.
  const times = Array.from({ length: 512 }, (_, i) => (i + 1) / 512 * flight.duration);
  times.push(flight.arcEnd);
  times.sort((a, b) => a - b);
  let previous = flight.at(0);
  let finite = Number.isFinite(previous.x) && Number.isFinite(previous.y) && Number.isFinite(previous.z);
  let maxStep = 0;
  let boardCrossings = 0;
  for (const time of times) {
    const p = flight.at(time);
    finite = finite && Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z);
    maxStep = Math.max(maxStep, Math.hypot(p.x - previous.x, p.y - previous.y, p.z - previous.z));
    // Schnitt mit der sichtbaren Brettfläche, einschließlich der Kanten.
    if ((previous.z + .375) * (p.z + .375) < 0) {
      const f = (-.375 - previous.z) / (p.z - previous.z);
      const x = previous.x + f * (p.x - previous.x), y = previous.y + f * (p.y - previous.y);
      if (Math.abs(x) <= .9 && y >= 2.895 && y <= 3.945) boardCrossings++;
    }
    previous = p;
  }
  expect(finite).toBe(true);
  expect(maxStep).toBeLessThan(.1);
  expect(boardCrossings).toBe(0);
}

function checkBank(flight: Flight): void {
  const contact = flight.at(flight.arcEnd);
  expect(contact.z).toBeCloseTo(-.375, 10);
  expect(contact.y).toBeCloseTo(3.3, 10);
  expect(Math.abs(contact.x)).toBeLessThan(.9);
  const points = Array.from({ length: 1001 }, (_, i) => flight.at(i / 1000 * flight.duration));
  expect(points.some(p => p.y < 3 && p.y > .5 && Math.hypot(p.x, p.z) < .23)).toBe(true);
  const end = flight.at(flight.duration);
  expect(end.x).toBe(0);
  expect(end.y).toBeCloseTo(.12, 10);
  expect(end.z).toBe(0);
  checkBoard(flight);
}

describe('Bankshot-Bahnen und Brett-Kollision', () => {
  it.each(positions)('berührt als bank_in von %o das Brett und fällt unter den Ring', from => {
    const flight = buildFlight('bank_in', from);
    expect(flight.at(0)).toEqual(from);
    expect(flight.at(flight.arcEnd)).toEqual(targetPoint('bank_in', from));
    expect(flight.at(-1)).toEqual(from);
    expect(flight.at(flight.duration + 1)).toEqual(flight.at(flight.duration));
    checkBank(flight);
  });

  it('spiegelt den seitlichen Brettpunkt mit der Wurfseite', () => {
    const left = targetPoint('bank_in', positions[1]), right = targetPoint('bank_in', positions[2]);
    expect(left.x).toBeLessThan(0);
    expect(right.x).toBeCloseTo(-left.x, 10);
  });

  it.each(outcomes)('durchdringt für %s von keiner Wurfposition die Brettfläche', outcome => {
    for (const from of positions) checkBoard(buildFlight(outcome, from));
  });

  it.each(['swish', 'rim_in', 'roll_in', 'bank_in'] as const)(
    'nutzt für den seitlichen Korbleger-Treffer %s dieselbe Brett-Bahn', outcome => {
      for (const x of [-.4, .4]) {
        const flight = buildFinishFlight('layup', outcome, { x, y: 3.2, z: .8 }, .3);
        expect(flight.arcEnd).toBe(.45);
        checkBank(flight);
      }
    });

  it.each([-20, -19.99, 0, 19.99, 20])('nutzt beim Korbleger ab φ=20° das Brett (φ=%s°)', phi => {
    const from = { x: Math.tan(phi * Math.PI / 180), y: 3.2, z: 1 };
    const flight = buildFinishFlight('layup', 'swish', from, .3);
    expect(flight.at(flight.arcEnd).z).toBeCloseTo(Math.abs(phi) >= 20 ? -.375 : 0, 10);
  });

  it.each([-1, 1])('fängt einen kurzen Brett-Durchtritt am Korbleger-Phasenwechsel ab (Seite %s)', side => {
    const from = { x: side * .6352, y: 3.2, z: 1 };
    const flight = buildFinishFlight('layup', side < 0 ? 'wide_left' : 'wide_right', from, .3);
    // Seit 2026-11-11 nutzen Korbleger-Fehlversuche die Abprallbahn; geprüft bleibt:
    // kein Brett-Durchtritt und eine stetige Bahn am Phasenwechsel.
    const before = flight.at(flight.arcEnd - .00000001);
    const after = flight.at(flight.arcEnd + .00000001);
    expect(Math.hypot(after.x - before.x, after.y - before.y, after.z - before.z)).toBeLessThan(.000001);
    checkBoard(flight);
  });

  it.each(['layup', 'dunk', 'contact_dunk'] as const)('durchdringt bei %s für kein Outcome das Brett', kind => {
    for (const outcome of outcomes) for (const from of positions) {
      checkBoard(buildFinishFlight(kind, outcome, from, .3));
    }
  }, 1000);
});
