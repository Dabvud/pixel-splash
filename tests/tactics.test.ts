import { describe, expect, it } from 'vitest';
import { TACTICS, TACTIC_NAME, findBallScreen, tacticTarget, type Tactic } from '../src/play/tactics';
import { createPlayState, step, type EngineConfig, type PlayState } from '../src/play/engine';
import { PLAYS } from '../src/play/plays';
import { ACTORS } from '../src/play/teams';
import type { PlayId } from '../src/play/types';

const cfg: EngineConfig = {
  slowmo: .3, decisionS: 2, animSpeed: 1, foulMult: 0, zoneFloor: .7, tempoSpread: 0, glassChance: 0,
  shot: { meterMs: 700, greenZone: .07, aimDeg: 6, influence: .6 },
  finish: { meterMs: 900, greenZone: .18, aimDeg: 8 },
};
const SCREEN_PLAYS: PlayId[] = ['pnr', 'pickpop', 'spain', 'doubledrag', 'shortroll'];
const dist = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z);
const rim = { x: 0, z: 0 };

function at(playId: PlayId, tactic: Tactic, afterScreen: number): { s: PlayState; screener: string } {
  const play = PLAYS[playId], screen = findBallScreen(play)!;
  const c = { ...cfg, tactics: true, forceTactic: tactic }, rng = () => .5, s = createPlayState(play, c, rng);
  for (let i = 0; i < 20000 && s.gameT < screen.t + afterScreen && s.phase !== 'ended' && s.phase !== 'decision'; i++) step(s, 1 / 240, c, rng);
  return { s, screener: screen.screener };
}
const defenders = (s: PlayState) => Object.values(s.actors).filter(a => ACTORS[a.id].team === 'def');
const nearest = (s: PlayState, id: string) => defenders(s).sort((a, b) => dist(a.pos, s.actors[id].pos) - dist(b.pos, s.actors[id].pos))[0];

describe('Verteidigungstaktiken beim Block', () => {
  it('fünf Taktiken mit deutschen Namen', () => {
    expect(TACTICS).toEqual(['switch', 'drop', 'hedge', 'blitz', 'under']);
    expect(TACTIC_NAME.blitz).toBe('Doppeln');
    expect(TACTIC_NAME.under).toBe('Unter dem Block');
  });
  it('erkennt Ballblöcke in den Block-Spielzügen, keinen in der Isolation', () => {
    for (const id of SCREEN_PLAYS) expect(findBallScreen(PLAYS[id]), id).not.toBeNull();
    expect(findBallScreen(PLAYS.iso)).toBeNull();
  });
  it('Zielpunkte je Taktik', () => {
    const h = { x: 0, z: 7 }, sc = { x: 1, z: 7.5 };
    expect(dist(tacticTarget('switch', 'hd', h, sc, 1), sc)).toBeLessThan(1.2);
    expect(dist(tacticTarget('switch', 'sd', h, sc, 1), h)).toBeLessThan(1.2);
    expect(dist(tacticTarget('blitz', 'sd', h, sc, 1), h)).toBeLessThan(1.2);
    expect(dist(tacticTarget('blitz', 'hd', h, sc, 1), h)).toBeLessThan(1.2);
    expect(dist(tacticTarget('drop', 'sd', h, sc, 1), rim)).toBeLessThan(3.5);
    expect(dist(tacticTarget('under', 'hd', h, sc, 1), rim)).toBeLessThan(dist(h, rim) - 1);
    expect(dist(tacticTarget('hedge', 'sd', h, sc, .3), h)).toBeLessThan(1.3);
    expect(dist(tacticTarget('hedge', 'sd', h, sc, 1.5), sc)).toBeLessThan(1.3);
  });
  it('Switch: nach dem Block steht ein anderer Verteidiger am Ballführer als vorher', () => {
    for (const id of ['pnr', 'pickpop'] as PlayId[]) {
      const before = at(id, 'switch', -.05), after = at(id, 'switch', 1.2);
      expect(nearest(after.s, after.s.handler).id, id).not.toBe(nearest(before.s, before.s.handler).id);
    }
  });
  it('Doppeln: zwei Verteidiger nahe am Ballführer', () => {
    const { s } = at('pnr', 'blitz', 1.2);
    const close = defenders(s).filter(d => dist(d.pos, s.actors[s.handler].pos) < 2);
    expect(close.length).toBeGreaterThanOrEqual(2);
  });
  it('jede Taktik in jedem Block-Spielzug endet sauber', () => {
    for (const id of SCREEN_PLAYS) for (const t of TACTICS) {
      const c = { ...cfg, tactics: true, forceTactic: t }, rng = () => .3, s = createPlayState(PLAYS[id], c, rng);
      for (let i = 0; i < 60 * 240 && s.phase !== 'ended'; i++) step(s, 1 / 240, c, rng);
      expect(s.phase, `${id}/${t}`).toBe('ended');
      expect(s.tactic).toBe(t);
      for (const a of Object.values(s.actors)) { expect(Math.abs(a.pos.x)).toBeLessThan(10); expect(a.pos.z).toBeGreaterThan(-3); }
    }
  });
  it('ohne tactics bleibt alles wie vorher', () => {
    const a = createPlayState(PLAYS.pnr, cfg, () => .5), b = createPlayState(PLAYS.pnr, { ...cfg, tactics: false }, () => .5);
    for (let i = 0; i < 1200; i++) { step(a, 1 / 240, cfg, () => .5); step(b, 1 / 240, cfg, () => .5); }
    expect(a.actors).toEqual(b.actors);
    expect(a.tactic).toBeNull();
  });
});
