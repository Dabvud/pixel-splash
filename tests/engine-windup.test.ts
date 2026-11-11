import { describe, expect, it } from 'vitest';
import { command, createPlayState, step, type EngineConfig } from '../src/play/engine';
import { PLAYS } from '../src/play/plays';
import { MOVES } from '../src/figure/moves';

const cfg: EngineConfig = {
  finishArrow: true, slowmo: 0.3, decisionS: 2, animSpeed: 1, foulMult: 0, zoneFloor: 0.7, tempoSpread: 0,
  shot: { meterMs: 700, greenZone: 0.07, aimDeg: 6, influence: 0.6 },
  finish: { meterMs: 900, greenZone: 0.18, aimDeg: 8 },
};
const rng = () => 0.5;

function takeoff() {
  const s = createPlayState(PLAYS.fastbreak, cfg, rng);
  for (let i = 0; i < 4000 && s.phase !== 'decision'; i++) step(s, 1 / 240, cfg, rng);
  command(s, { kind: 'drive', lane: 0 }, cfg, rng);
  for (let i = 0; i < 4000 && !s.arrowMeter; i++) step(s, 1 / 240, cfg, rng);
  return s;
}

describe('Absprung läuft während des Abschluss-Meters langsam an', () => {
  it('bewegt den Werfer synchron zum Pfeil, aber nie bis zum Ringkontakt', () => {
    const s = takeoff(), a = s.actors[s.handler], m = s.arrowMeter!, rim = MOVES[a.move].rimFrame!;
    expect(a.moveT).toBe(0);
    for (let t = 0; t < (m.meterMs * 0.5) / 1000; t += 1 / 240) step(s, 1 / 240, cfg, rng);
    const half = a.moveT;
    expect(half).toBeGreaterThan(0);
    for (let t = 0; t < (m.meterMs * 0.5) / 1000; t += 1 / 240) step(s, 1 / 240, cfg, rng);
    expect(a.moveT).toBeGreaterThan(half);
    expect(a.moveT).toBeLessThan(rim / MOVES[a.move].fps);
  });

  it('setzt die Animation nach dem Auslösen fort statt sie neu zu starten', () => {
    const s = takeoff(), a = s.actors[s.handler], m = s.arrowMeter!;
    for (let t = 0; t < m.meterMs / 1000; t += 1 / 240) step(s, 1 / 240, cfg, rng);
    const before = a.moveT, id = a.move;
    command(s, { kind: 'tap' }, cfg, rng);
    expect(a.move).toBe(id);
    expect(a.moveT).toBeGreaterThanOrEqual(before);
  });
});
