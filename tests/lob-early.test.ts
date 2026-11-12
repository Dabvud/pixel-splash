import { afterEach, describe, expect, it } from 'vitest';
import { command, createPlayState, step, type EngineConfig, type EngineEvent } from '../src/play/engine';
import { PLAYS } from '../src/play/plays';
import { HERO_ID, castWithHero, registerHero, unregisterHero } from '../src/career/hero';
import { TEAMS } from '../src/career/league';
import { seededRng } from '../src/career/create';
import { SAMPLE } from './career-state.test';

const base: EngineConfig = {
  slowmo: .3, decisionS: 2, animSpeed: 1, foulMult: 0, zoneFloor: .7, tempoSpread: 0, glassChance: 0, decisionLead: 2, finishArrow: true,
  shot: { meterMs: 700, greenZone: .07, aimDeg: 6, influence: .6 },
  finish: { meterMs: 900, greenZone: .18, aimDeg: 8 },
};
afterEach(() => unregisterHero());

describe('Alley-oop nicht zu früh (Entscheiden im Laufen)', () => {
  it('KI-Aufbau wartet im Konter mit dem Lob, bis der Fänger am Korb ist', () => {
    let lobs = 0;
    for (const pos of ['guard', 'wing'] as const) {
      registerHero({ ...SAMPLE.player, position: pos }, TEAMS[0]);
      for (let seed = 1; seed <= 30; seed++) {
        const rng = seededRng(seed * 7 + 1), cfg = { ...base, controlled: HERO_ID, ratingMeters: true };
        const s = createPlayState({ ...castWithHero(PLAYS.threeontwo, pos, rng), clockS: 14 }, cfg, rng);
        let lob = false;
        for (let i = 0; i < 60 * 240 && s.phase !== 'ended'; i++) for (const e of step(s, 1 / 240, cfg, rng)) {
          if (e.type === 'arrowStart' && e.kind === 'alleyoop') lob = true;
          if (e.type === 'takeoff' && lob) {
            lobs++; lob = false;
            const h = s.actors[s.handler].pos;
            expect(Math.hypot(h.x, h.z), `${pos}/${seed}`).toBeLessThanOrEqual(3);
          }
        }
      }
      unregisterHero();
    }
    expect(lobs).toBeGreaterThan(5);
  });
  it('eigener früher Lob-Pass auf einen weit entfernten Fänger wird ein normaler Pass (kein Dunk von der Dreierlinie)', () => {
    const rng = seededRng(4), s = createPlayState(PLAYS.threeontwo, base, rng), events: EngineEvent[] = [];
    for (let i = 0; i < 20000 && s.phase !== 'decision'; i++) step(s, 1 / 240, base, rng);
    expect(Math.hypot(s.actors.r23.pos.x, s.actors.r23.pos.z)).toBeGreaterThan(4); // Entscheidung beginnt im Laufen
    events.push(...command(s, { kind: 'pass', to: 'r23', quality: 1 }, base, rng));
    for (let i = 0; i < 2000 && s.handler !== 'r23'; i++) events.push(...step(s, 1 / 240, base, rng));
    expect(events.some(e => e.type === 'arrowStart' && e.kind === 'alleyoop')).toBe(false);
    expect(events.some(e => e.type === 'takeoff')).toBe(false);
    expect(s.handler).toBe('r23');
  });
  it('Lob auf einen Fänger am Korb bleibt ein Alley-oop', () => {
    const cfg = { ...base, decisionLead: undefined }, rng = seededRng(4), s = createPlayState(PLAYS.threeontwo, cfg, rng), events: EngineEvent[] = [];
    for (let i = 0; i < 20000 && s.phase !== 'decision'; i++) step(s, 1 / 240, cfg, rng);
    events.push(...command(s, { kind: 'pass', to: 'r23', quality: 1 }, cfg, rng));
    expect(events.some(e => e.type === 'arrowStart' && e.kind === 'alleyoop')).toBe(true);
  });
});
