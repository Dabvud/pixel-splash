import { describe, expect, it } from 'vitest';
import { createPlayState, step, type EngineConfig } from '../src/play/engine';
import { PLAYS } from '../src/play/plays';

const base: EngineConfig = {
  slowmo: 0.3, decisionS: 2, animSpeed: 1, foulMult: 0, zoneFloor: 0.7, tempoSpread: 0,
  shot: { meterMs: 700, greenZone: 0.07, aimDeg: 6, influence: 0.6 },
  finish: { meterMs: 450, greenZone: 0.1, aimDeg: 8 },
};
const rng = () => 0.5;

function untilDecision(cfg: EngineConfig) {
  const s = createPlayState(PLAYS.pnr, cfg, rng);
  for (let i = 0; i < 2000 && s.phase !== 'decision'; i++) step(s, 1 / 120, cfg, rng);
  return s;
}

describe('Entscheiden im Laufen', () => {
  it('öffnet das Entscheidungsfenster eine Spielsekunde vor dem Wegende, während alle noch laufen', () => {
    const late = untilDecision(base);
    const early = untilDecision({ ...base, decisionLead: 1 });
    expect(late.gameT - early.gameT).toBeCloseTo(1, 1);
    const before = { ...early.actors[early.handler].pos };
    for (let i = 0; i < 60; i++) step(early, 1 / 60, { ...base, decisionLead: 1 }, rng);
    expect(early.phase).toBe('decision');
    const after = early.actors[early.handler].pos;
    expect(Math.hypot(after.x - before.x, after.z - before.z)).toBeGreaterThan(0.05);
  });

  it('trifft die KI-Wahl erst am Wegende, nicht mitten im Lauf', () => {
    const cfg = { ...base, decisionLead: 1, decisionS: 0.5 };
    const s = untilDecision(cfg);
    for (let i = 0; i < 90; i++) step(s, 1 / 60, cfg, rng); // 1,5 s Echtzeit = 0,45 Spielsekunden
    expect(s.phase).toBe('decision');
  });
});
