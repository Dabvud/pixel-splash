import { describe, expect, it } from 'vitest';
import { command, createPlayState, step, type EngineConfig, type PlayState } from '../src/play/engine';
import { PLAYS } from '../src/play/plays';

const cfg: EngineConfig = {
  slowmo: 0.3, decisionS: 2, animSpeed: 1, foulMult: 1, zoneFloor: 0.7, tempoSpread: 0.3,
  shot: { meterMs: 700, greenZone: 0.07, aimDeg: 6, influence: 0.6 },
  finish: { meterMs: 450, greenZone: 0.1, aimDeg: 8 },
};
const rng = () => 0.5;

function toFreeThrows(): PlayState {
  const s = createPlayState(PLAYS.pnr, cfg, rng);
  s.freeThrows = { shooter: s.handler, left: 2 };
  // Über den öffentlichen Weg in die Freiwurf-Phase: ein Schritt genügt, sobald die Serie gesetzt ist
  s.phase = 'freethrows';
  step(s, 0.016, cfg, rng);
  return s;
}

describe('Freiwurf-Aufstellung', () => {
  it('stellt den Schützen an die Freiwurflinie und alle anderen an den Zonenrand', () => {
    const s = toFreeThrows();
    for (let i = 0; i < 120; i++) step(s, 0.016, cfg, rng);
    const shooter = s.actors[s.freeThrows!.shooter];
    expect(shooter.pos.x).toBeCloseTo(0, 5);
    expect(shooter.pos.z).toBeCloseTo(4.2, 5);
    for (const a of Object.values(s.actors)) {
      if (a.id === shooter.id) continue;
      expect(Math.abs(a.pos.x)).toBeCloseTo(2.75, 5);
      expect(a.pos.z).toBeGreaterThanOrEqual(1.2);
      expect(a.pos.z).toBeLessThanOrEqual(3.7);
    }
  });

  it('wartet ohne Zeitlimit auf die Wurf-Kombi des Nutzers', () => {
    const s = toFreeThrows();
    for (let i = 0; i < 60 * 30; i++) step(s, 0.016, cfg, rng);
    expect(s.phase).toBe('freethrows');
    expect(s.freeThrows!.left).toBe(2);
    command(s, { kind: 'comboStart' }, cfg, rng);
    for (let i = 0; i < 60 * 30; i++) step(s, 0.016, cfg, rng);
    expect(s.phase).toBe('combo');
    command(s, { kind: 'comboRelease', holdMs: 700, angleDeg: 0 }, cfg, rng);
    expect(s.phase).toBe('ballflight');
  });
});
