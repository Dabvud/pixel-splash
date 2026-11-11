import { describe, expect, it } from 'vitest';
import { buildFinishFlight } from '../src/shot/finish-path';
import type { Outcome } from '../src/shot/resolve';

const MISSES: Outcome[] = ['roll_out', 'rim_front', 'rim_back', 'rim_left', 'rim_right', 'airball', 'board', 'wide_left', 'wide_right'];
const STARTS = [
  { x: 0, y: 2.5, z: 1.2 }, { x: 0.8, y: 2.6, z: 0.9 }, { x: -0.9, y: 2.6, z: 0.8 }, { x: 1.1, y: 2.4, z: 0.3 },
];

// Fällt der Ball näher als 0,5 m am Ringmittelpunkt durch die Ringebene, sieht es aus der Seitenkamera wie ein Korb aus.
function dropsThroughHoop(at: (t: number) => { x: number; y: number; z: number }, duration: number): boolean {
  let prev = at(0);
  for (let i = 1; i <= 600; i++) {
    const p = at((duration * i) / 600);
    if (prev.y >= 3.05 && p.y < 3.05 && Math.hypot(p.x, p.z) < 0.5) return true;
    prev = p;
  }
  return false;
}

describe('Fehlversuche am Korb sehen nicht wie Treffer aus', () => {
  for (const kind of ['layup', 'dunk', 'contact_dunk'] as const)
    for (const outcome of MISSES)
      it.each(STARTS)(`${kind} ${outcome} von %j fällt nicht durch den Ring`, (start) => {
        const f = buildFinishFlight(kind, outcome, start, 0.35);
        expect(dropsThroughHoop((t) => f.at(t), f.duration)).toBe(false);
      });
});
