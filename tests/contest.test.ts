import { describe, expect, it } from 'vitest';
import { CONTESTS, CONTEST_ZONE, blockChance, contestLevel } from '../src/play/contest';
import { command, createPlayState, step, type EngineConfig, type EngineEvent, type PlayState } from '../src/play/engine';
import { PLAYS } from '../src/play/plays';
import { ACTORS } from '../src/play/teams';
import { seededRng } from '../src/career/create';

const cfg: EngineConfig = {
  slowmo: .3, decisionS: 2, animSpeed: 1, foulMult: 0, zoneFloor: .7, tempoSpread: 0, glassChance: 0,
  shot: { meterMs: 700, greenZone: .07, aimDeg: 6, influence: .6 },
  finish: { meterMs: 900, greenZone: .18, aimDeg: 8 },
};
const dist = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z);

/** Iso bis zur Entscheidung laufen lassen */
function toDecision(c: EngineConfig, rng: () => number): PlayState {
  const s = createPlayState(PLAYS.iso, c, rng);
  for (let i = 0; i < 20000 && s.phase !== 'decision' && s.phase !== 'ended'; i++) step(s, 1 / 240, c, rng);
  expect(s.phase).toBe('decision');
  return s;
}
/** Sprungwurf mit perfektem Timing; liefert das Ergebnis-Ereignis */
function perfectShot(c: EngineConfig, rng: () => number): { s: PlayState; result: Extract<EngineEvent, { type: 'result' }> } {
  const s = toDecision(c, rng), events: EngineEvent[] = [];
  events.push(...command(s, { kind: 'comboStart' }, c, rng));
  events.push(...command(s, { kind: 'comboRelease', holdMs: s.combo!.meterMs, angleDeg: 0 }, c, rng));
  for (let i = 0; i < 20000 && !events.some(e => e.type === 'result'); i++) events.push(...step(s, 1 / 240, c, rng));
  return { s, result: events.find(e => e.type === 'result') as Extract<EngineEvent, { type: 'result' }> };
}

describe('Kontest-Stufen', () => {
  it('fünf Stufen, Fenster wird mit jeder Stufe kleiner', () => {
    expect(CONTESTS).toEqual(['WIDE OPEN', 'SEMI OPEN', 'CONTESTED', 'HEAVY CONTEST', 'SMOTHERED']);
    for (let i = 1; i < 5; i++) expect(CONTEST_ZONE[i]).toBeLessThan(CONTEST_ZONE[i - 1]);
  });
  it('Stufe aus dem Abstand; weit weg immer Wide Open', () => {
    const mid = () => .5; // weder härter noch lascher (Verteidigung 0,5)
    expect([5, 3.2, 2.5, 1.8, 1, .4].map(d => contestLevel(d, .5, mid))).toEqual([0, 0, 1, 2, 3, 4]);
    for (let i = 0; i < 50; i++) expect(contestLevel(4.5, 1, seededRng(i))).toBe(0);
  });
  it('gute Verteidiger kontesten im Mittel härter als schwache', () => {
    let good = 0, bad = 0;
    for (let seed = 1; seed <= 500; seed++) { good += contestLevel(1.8, .9, seededRng(seed)); bad += contestLevel(1.8, .2, seededRng(seed)); }
    expect(good / 500).toBeGreaterThan(2.3); expect(bad / 500).toBeLessThan(1.8);
  });
  it('Block-Chance erst ab Contested, steigt mit Stufe und Verteidigung', () => {
    expect(blockChance(0, 1)).toBe(0); expect(blockChance(1, 1)).toBe(0);
    expect(blockChance(2, .5)).toBeGreaterThan(0);
    expect(blockChance(3, .5)).toBeGreaterThan(blockChance(2, .5));
    expect(blockChance(4, .5)).toBeGreaterThan(blockChance(3, .5));
    expect(blockChance(4, .9)).toBeGreaterThan(blockChance(4, .3));
    expect(blockChance(4, 1)).toBeLessThan(.5);
  });
});

describe('Kontest in der Engine', () => {
  it('ohne contests: keine Stufe, gleiches Fenster wie bisher', () => {
    const s = toDecision(cfg, () => .5);
    command(s, { kind: 'comboStart' }, cfg, () => .5);
    expect(s.combo!.contest).toBeUndefined();
  });
  it('Stufe verkleinert das grüne Fenster um den Faktor der Stufe', () => {
    const zone = (level: number) => {
      const c = { ...cfg, contests: true, forceContest: level }, s = toDecision(c, () => .5);
      const ev = command(s, { kind: 'comboStart' }, c, () => .5);
      expect(ev.find(e => e.type === 'combo')).toMatchObject({ contest: level });
      expect(s.combo!.contestBy).toBeDefined();
      return s.combo!.zones.g;
    };
    const open = zone(0);
    for (let l = 1; l <= 4; l++) expect(zone(l) / open).toBeCloseTo(CONTEST_ZONE[l], 5);
  });
  it('Wide Open: perfektes Timing wird nie geblockt; Smothered: manchmal geblockt trotz perfektem Timing', () => {
    let blockedOpen = 0, blockedTight = 0, madeTight = 0;
    for (let seed = 1; seed <= 60; seed++) {
      if (perfectShot({ ...cfg, contests: true, forceContest: 0 }, seededRng(seed)).result.banner === 'GEBLOCKT') blockedOpen++;
      const r = perfectShot({ ...cfg, contests: true, forceContest: 4 }, seededRng(seed)).result;
      if (r.banner === 'GEBLOCKT') { blockedTight++; expect(r.made).toBe(false); } else if (r.made) madeTight++;
    }
    expect(blockedOpen).toBe(0);
    expect(blockedTight).toBeGreaterThan(3); expect(blockedTight).toBeLessThan(35);
    expect(madeTight).toBeGreaterThan(20);
  });
  it('Drive: ein Verteidiger vom Korb rotiert zum Absprungpunkt (helpChance 1), ohne Help bleibt er weg', () => {
    const run = (helpChance: number) => {
      const c = { ...cfg, contests: true, helpChance, forceContest: 0 }, rng = seededRng(3), s = toDecision(c, rng);
      // einen freien Verteidiger an den Korb stellen (nicht den am Ball)
      const h = s.actors[s.handler];
      const defs = Object.values(s.actors).filter(a => ACTORS[a.id].team === 'def').sort((a, b) => dist(a.pos, h.pos) - dist(b.pos, h.pos));
      const big = defs[defs.length - 1];
      command(s, { kind: 'drive', lane: 0 }, c, rng);
      let closest = 99;
      for (let i = 0; i < 20000 && s.phase !== 'ended' && s.phase !== 'ballflight'; i++) {
        step(s, 1 / 240, c, rng);
        if (s.combo && s.phase === 'takeoff') command(s, { kind: 'comboRelease', holdMs: s.combo.meterMs, angleDeg: 0 }, c, rng);
        closest = Math.min(closest, ...defs.slice(1).map(d => dist(s.actors[d.id].pos, s.actors[s.handler].pos)));
      }
      return { closest, big: big.id };
    };
    const withHelp = run(1), without = run(0);
    expect(withHelp.closest).toBeLessThan(1.6);
    expect(withHelp.closest).toBeLessThan(without.closest);
  });
});
