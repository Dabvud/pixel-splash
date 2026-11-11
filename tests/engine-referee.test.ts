import { describe, expect, it } from 'vitest';
import { command, createPlayState, step, type EngineConfig, type EngineEvent, type PlayState } from '../src/play/engine';
import { PLAYS } from '../src/play/plays';
import { MOVES } from '../src/figure/moves';
import { ACTORS } from '../src/play/teams';

const cfg: EngineConfig = {
  foulScene: true, finishArrow: true, slowmo: 0.3, decisionS: 2, animSpeed: 1, foulMult: 100, zoneFloor: 0.7, tempoSpread: 0,
  shot: { meterMs: 700, greenZone: 0.07, aimDeg: 6, influence: 0.6 },
  finish: { meterMs: 450, greenZone: 0.1, aimDeg: 8 },
};

function fouledFinish(made: boolean): { s: PlayState; events: EngineEvent[]; rng: () => number } {
  const rng = () => 0.5;
  const s = createPlayState(PLAYS.fastbreak, cfg, rng);
  for (let i = 0; i < 4000 && s.phase !== 'decision'; i++) step(s, 1 / 240, cfg, rng);
  command(s, { kind: 'drive', lane: 0 }, cfg, rng);
  for (let i = 0; i < 4000 && !s.arrowMeter; i++) step(s, 1 / 240, cfg, rng);
  const m = s.arrowMeter!;
  const target = made ? 1 : 1.3;
  for (let t = 0; t < (m.meterMs * target) / 1000 - 1e-6; t += 1 / 480) step(s, 1 / 480, cfg, rng);
  command(s, { kind: 'tap' }, cfg, rng);
  const events: EngineEvent[] = [];
  for (let i = 0; i < 4000 && s.phase !== 'freethrows'; i++) events.push(...step(s, 1 / 240, cfg, rng));
  return { s, events, rng };
}

describe('Schiri und And-one', () => {
  it('hat Schiri-Figur und neue Bewegungen', () => {
    expect(ACTORS.ref.team).toBe('ref');
    for (const id of ['ref_whistle', 'flex', 'high_five'] as const) expect(MOVES[id].frames).toBeGreaterThan(1);
  });

  it('meldet ein Foul, holt den Schiri ins Bild und lässt ihn pfeifen', () => {
    const { s, events, rng } = fouledFinish(false);
    expect(events.some((e) => e.type === 'foul' && e.andOne === false)).toBe(true);
    expect(s.actors.ref).toBeDefined();
    const start = { ...s.actors.ref.pos };
    for (let i = 0; i < 240; i++) step(s, 1 / 240, cfg, rng);
    expect(Math.hypot(s.actors.ref.pos.x - start.x, s.actors.ref.pos.z - start.z)).toBeGreaterThan(1);
    for (let i = 0; i < 480; i++) step(s, 1 / 240, cfg, rng);
    expect(s.actors.ref.move).toBe('ref_whistle');
    // Der Schiri steht nicht in der Freiwurf-Aufstellung am Zonenrand und nicht zwischen Linie und Korb
    expect(Math.abs(s.actors.ref.pos.x)).toBeGreaterThan(3);
  });

  it('lässt beim And-one den Schützen jubeln, einen Mitspieler abklatschen und die Freiwürfe warten', () => {
    const { s, events, rng } = fouledFinish(true);
    expect(events.some((e) => e.type === 'foul' && e.andOne === true)).toBe(true);
    const shooter = s.freeThrows!.shooter;
    expect(s.actors[shooter].move).toBe('flex');
    // Während der Feier keine Kombi möglich
    command(s, { kind: 'comboStart' }, cfg, rng);
    expect(s.phase).toBe('freethrows');
    const mates = Object.values(s.actors).filter((a) => ACTORS[a.id].team === 'off' && a.id !== shooter);
    let fived = false;
    for (let i = 0; i < 240 * 2.5; i++) {
      step(s, 1 / 240, cfg, rng);
      if (mates.some((a) => a.move === 'high_five')) fived = true;
    }
    expect(fived).toBe(true);
    for (let i = 0; i < 240 * 2; i++) step(s, 1 / 240, cfg, rng);
    expect(s.actors[shooter].pos).toEqual({ x: 0, z: 4.2 });
    command(s, { kind: 'comboStart' }, cfg, rng);
    expect(s.phase).toBe('combo');
  });
});
