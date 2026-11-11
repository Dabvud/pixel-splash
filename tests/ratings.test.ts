import { describe, expect, it } from 'vitest';
import { RATING_KEYS, finishMeter, ratingsOf } from '../src/play/ratings';
import { ACTORS, RED, BLUE } from '../src/play/teams';
import { createPlayState, playPositionValue, step, command } from '../src/play/engine';
import type { EngineConfig } from '../src/play/engine';
import { PLAYS } from '../src/play/plays';

const cfg: EngineConfig = {
  slowmo: .3, decisionS: 2, animSpeed: 1, foulMult: 0, zoneFloor: .7, tempoSpread: 0, glassChance: 0,
  shot: { meterMs: 700, greenZone: .07, aimDeg: 6, influence: .6 },
  finish: { meterMs: 900, greenZone: .18, aimDeg: 8 },
};

describe('Spielerwerte', () => {
  it('leitet Werte ohne eigene ratings aus shot/athleticism ab', () => {
    const r = ratingsOf(ACTORS.r23);
    expect(r.dunk).toBe(.9); expect(r.finish).toBe(.9); expect(r.athleticism).toBe(.9);
    expect(r.three).toBe(.6); expect(r.mid).toBe(.6);
    expect(r.pass).toBe(.5); expect(r.dribble).toBe(.5); expect(r.defense).toBe(.5); expect(r.leadership).toBe(.5);
  });
  it('liefert für alle Spieler 9 Werte in 0…1 und klemmt eigene ratings', () => {
    for (const a of [...RED, ...BLUE]) {
      const r = ratingsOf(a);
      expect(Object.keys(r).sort()).toEqual([...RATING_KEYS].sort());
      for (const v of Object.values(r)) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1); }
    }
    const r = ratingsOf({ ...ACTORS.r3, ratings: { ...ratingsOf(ACTORS.r3), three: 4, dunk: -2 } });
    expect(r.three).toBe(1); expect(r.dunk).toBe(0);
  });
  it('Abschluss-Meter: Wert 0 schnell und eng, Wert 1 langsam und weit, linear dazwischen', () => {
    const base = { meterMs: 900, greenZone: .18 };
    expect(finishMeter(base, 0)).toEqual({ meterMs: 630, greenZone: expect.closeTo(.108, 6) });
    expect(finishMeter(base, 1)).toEqual({ meterMs: 1035, greenZone: expect.closeTo(.225, 6) });
    expect(finishMeter(base, .5).meterMs).toBeCloseTo(832.5, 6);
    expect(finishMeter(base, 7)).toEqual(finishMeter(base, 1));
    expect(finishMeter(base, -3)).toEqual(finishMeter(base, 0));
  });
  it('Dribbling gegen Verteidigung verändert den Positionswert nur mit ratingMeters', () => {
    const play = PLAYS.pnr, rng = () => .3;
    const plain = createPlayState(play, cfg, rng), rated = createPlayState(play, { ...cfg, ratingMeters: true }, rng);
    const h = plain.actors[plain.handler], d = Object.values(plain.actors).find(a => ACTORS[a.id].team === 'def')!;
    const pos = { x: d.pos.x, z: d.pos.z + 1.2 };
    // gleiche (abgeleitete) Werte → keine Änderung
    expect(playPositionValue(rated, pos)).toBeCloseTo(playPositionValue(plain, pos), 9);
    const saved = ACTORS[h.id];
    try {
      ACTORS[h.id] = { ...saved, ratings: { ...ratingsOf(saved), dribble: 1 } };
      expect(playPositionValue(rated, pos)).toBeGreaterThan(playPositionValue(plain, pos));
      expect(playPositionValue(plain, pos)).toBeCloseTo(playPositionValue(createPlayState(play, cfg, rng), pos), 9);
    } finally { ACTORS[h.id] = saved; }
  });
  it('ohne ratingMeters bleibt ein Spielzug exakt wie vorher (gleiche Meter-Werte)', () => {
    const run = (c: EngineConfig) => {
      const rng = () => .42, s = createPlayState(PLAYS.pnr, c, rng);
      for (let i = 0; i < 4000 && s.phase !== 'decision'; i++) step(s, 1 / 240, c, rng);
      command(s, { kind: 'drive', lane: 0 }, c, rng);
      for (let i = 0; i < 4000 && !s.combo && s.phase !== 'ended'; i++) step(s, 1 / 240, c, rng);
      return s.combo && { meterMs: s.combo.meterMs, zones: s.combo.zones };
    };
    const before = run(cfg);
    expect(before).not.toBeNull();
    expect(run({ ...cfg, ratingMeters: false })).toEqual(before);
  });
});
