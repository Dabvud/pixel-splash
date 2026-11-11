import { describe, expect, it } from 'vitest';
import { command, createPlayState, step, type EngineConfig } from '../src/play/engine';
import { PLAYS } from '../src/play/plays';
import { effectiveZones } from '../src/shot/resolve';
import { ACTORS } from '../src/play/teams';

const cfg: EngineConfig = { decisionLead: 2.5, decisionS: 2.5, slowmo: .3, animSpeed: 1, foulMult: 0,
  zoneFloor: .7, tempoSpread: 0, closeoutRandom: 0,
  shot: { meterMs: 700, greenZone: .07, aimDeg: 6, influence: .6 },
  finish: { meterMs: 450, greenZone: .1, aimDeg: 8 } };
const safe = () => .99;
describe('Review: Engine-Übergänge', () => {
  it('führt Verteidigerwege nach frühem Pass ohne Sprung im Folgesegment fort', () => {
    const s = createPlayState(PLAYS.pnr, cfg, safe);
    for (let i = 0; i < 2000 && s.phase !== 'decision'; i++) step(s, 1 / 240, cfg, safe);
    command(s, { kind: 'pass', to: 'r50' }, cfg, safe);
    let max = 0;
    for (let i = 0; i < 400; i++) {
      const before = Object.values(s.actors).filter(a => a.id.startsWith('b')).map(a => ({ id: a.id, ...a.pos }));
      step(s, 1 / 240, cfg, safe);
      for (const a of before) max = Math.max(max, Math.hypot(s.actors[a.id].pos.x - a.x, s.actors[a.id].pos.z - a.z));
    }
    expect(max).toBeLessThan(.05);
  });
  it.each([1.5, 2.5, 4])('öffnet das erste Entscheidungsfenster für %s Spielsekunden ohne zusätzliche Echtzeitfrist', decisionS => {
    const c = { ...cfg, decisionS, decisionLead: decisionS, slowmo: .5 };
    const s = createPlayState(PLAYS.pnr, c, safe);
    for (let i = 0; i < 10000 && s.phase !== 'decision'; i++) step(s, 1 / 1000, c, safe);
    const start = s.gameT;
    let selected = false;
    for (let i = 0; i < 10000 && !selected; i++) selected = step(s, .001, c, safe)
      .some(e => e.type === 'decision' && e.options.length === 1);
    expect(selected).toBe(true);
    expect(s.gameT - start).toBeCloseTo(decisionS, 2);
  });
  it.each([1.5, 4])('hält auch nach dem Catch-and-Shoot-Pfeil das Fenster von %s Spielsekunden ein', decisionS => {
    const c = { ...cfg, decisionS, decisionLead: decisionS };
    const s = createPlayState({ ...PLAYS.pnr, clockS: 30 }, c, safe);
    for (let i = 0; i < 10000 && s.phase !== 'decision'; i++) step(s, .001, c, safe);
    command(s, { kind: 'pass', to: 'r11' }, c, safe);
    for (let i = 0; i < 10000 && !s.arrowMeter; i++) step(s, .001, c, safe);
    expect(s.arrowMeter?.kind).toBe('catchshoot');
    for (let i = 0; i < 10000 && s.arrowMeter; i++) step(s, .001, c, safe);
    const start = s.gameT, before = { ...s.actors[s.handler].pos };
    let selected = false;
    for (let i = 0; i < 20000 && !selected; i++) selected = step(s, .001, c, safe)
      .some(e => e.type === 'decision' && e.options.length === 1);
    expect(selected).toBe(true);
    expect(s.gameT - start).toBeCloseTo(decisionS, 2);
    expect(Math.hypot(s.actors[s.handler].pos.x - before.x, s.actors[s.handler].pos.z - before.z)).toBeGreaterThan(.5);
  });
  it('lässt den tatsächlich gefoulten Schützen an die Linie laufen und berechnet Freiwurfzonen aus 4,2 m', () => {
    const c = { ...cfg, foulMult: 2 }, foul = () => 0;
    const s = createPlayState(PLAYS.pnr, c, foul);
    for (let i = 0; i < 2000 && s.phase !== 'decision'; i++) step(s, .01, c, foul);
    command(s, { kind: 'drive', lane: 0 }, c, foul);
    for (let i = 0; i < 2000 && s.phase !== 'takeoff'; i++) step(s, .01, c, foul);
    command(s, { kind: 'comboStart' }, c, foul);
    expect(s.combo!.fouled).toBe(true);
    command(s, { kind: 'comboRelease', holdMs: 0, angleDeg: 0 }, c, foul);
    let before = { ...s.actors[s.handler].pos };
    for (let i = 0; i < 10000 && s.phase !== 'freethrows'; i++) {
      before = { ...s.actors[s.handler].pos }; step(s, .001, c, foul);
    }
    const h = s.actors[s.handler];
    expect(s.phase).toBe('freethrows');
    expect(Math.hypot(h.pos.x - before.x, h.pos.z - before.z)).toBeLessThan(.05);
    expect(Math.hypot(h.pos.x, h.pos.z - 4.2)).toBeGreaterThan(1);
    const clock = s.clock;
    command(s, { kind: 'comboStart' }, c, foul);
    expect(s.phase).toBe('freethrows');
    step(s, .2, c, foul); expect(h.move).toBe('run');
    step(s, .8, c, foul);
    expect(h.pos).toEqual({ x: 0, z: 4.2 }); expect(s.clock).toBe(clock);
    command(s, { kind: 'comboStart' }, c, foul);
    expect(s.combo!.zones).toEqual(effectiveZones({ ...c.shot, distance: 4.2, rating: ACTORS[h.id].shot, zoneFactor: 1 }));
    command(s, { kind: 'comboRelease', holdMs: 0, angleDeg: 0 }, c, foul);
    for (let i = 0; i < 10000 && s.phase !== 'freethrows'; i++) step(s, .001, c, foul);
    expect(s.freeThrows!.left).toBe(1);
    command(s, { kind: 'comboStart' }, c, foul); step(s, .01, c, foul);
    expect(h.move).toBe('jumpshot');
  });
});
