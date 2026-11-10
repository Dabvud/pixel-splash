import { describe, expect, it } from 'vitest';
import { command, createPlayState, step, type EngineConfig, type EngineEvent } from '../src/play/engine';
import { PLAYS } from '../src/play/plays';

const cfg: EngineConfig = {
  finishArrow: true, slowmo: 0.3, decisionS: 2, animSpeed: 1, foulMult: 0, zoneFloor: 0.7, tempoSpread: 0,
  shot: { meterMs: 700, greenZone: 0.07, aimDeg: 6, influence: 0.6 },
  finish: { meterMs: 450, greenZone: 0.1, aimDeg: 8 },
};
const rng = () => 0.5;

function toTakeoff() {
  const s = createPlayState(PLAYS.fastbreak, cfg, rng);
  for (let i = 0; i < 3000 && s.phase !== 'decision'; i++) step(s, 1 / 120, cfg, rng);
  command(s, { kind: 'drive', lane: 0 }, cfg, rng);
  for (let i = 0; i < 3000 && s.phase !== 'takeoff'; i++) step(s, 1 / 120, cfg, rng);
  return s;
}

describe('Abschluss per Pfeil-Meter', () => {
  it('startet am Absprung automatisch ein Pfeil-Meter', () => {
    const s = toTakeoff();
    expect(s.phase).toBe('takeoff');
    expect(s.arrowMeter?.kind).toBe('finish');
    expect(s.arrowMeter?.meterMs).toBe(s.combo!.meterMs);
  });

  it('wertet einen Tipp im Grünen als Treffer ohne Wischen', () => {
    const s = toTakeoff();
    const ms = s.arrowMeter!.meterMs;
    for (let t = 0; t < ms / 1000 - 1 / 240; t += 1 / 240) step(s, 1 / 240, cfg, rng);
    command(s, { kind: 'tap' }, cfg, rng);
    expect(s.phase).toBe('ballflight');
    const events: EngineEvent[] = [];
    for (let i = 0; i < 2000 && s.phase !== 'ended'; i++) events.push(...step(s, 1 / 60, cfg, rng));
    expect(events.some((e) => e.type === 'result' && e.made)).toBe(true);
    expect(s.points).toBe(2);
  });

  it('verlegt ohne Tipp nach Ablauf des Meters', () => {
    const s = toTakeoff();
    const events: EngineEvent[] = [];
    for (let i = 0; i < 2000 && s.phase !== 'ended'; i++) events.push(...step(s, 1 / 60, cfg, rng));
    expect(s.points).toBe(0);
    expect(events.some((e) => e.type === 'result' && !e.made)).toBe(true);
  });
});
