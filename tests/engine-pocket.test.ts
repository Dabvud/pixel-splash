import { describe, expect, it } from 'vitest';
import { command, createPlayState, step } from '../src/play/engine';
import type { EngineConfig, EngineEvent, PlayState } from '../src/play/engine';
import type { Option, Play } from '../src/play/types';
import { PLAYS } from '../src/play/plays';
import { positionValue } from '../src/play/position';

const cfg: EngineConfig = {
  slowmo: .3, decisionS: 2, animSpeed: 1, foulMult: 0, zoneFloor: .7, tempoSpread: 0,
  passDelayMax: .6, closeoutRandom: 0,
  shot: { meterMs: 700, greenZone: .07, aimDeg: 6, influence: .6 },
  finish: { meterMs: 450, greenZone: .1, aimDeg: 8 },
};
const safe = () => .99;
const fixture = (lob = false): Play => ({
  id: 'kickout', name: 'Pocket-Test', clockS: 20, deficit: 2, actors: ['r3', 'r50', 'b1', 'b7'], start: 'setup',
  segments: { setup: { id: 'setup', handler: 'r3', decisionAt: 0, paths: {
    r3: [{ t: 0, x: -4, z: 5, act: 'stand' }],
    r50: [{ t: 0, x: 0, z: 5, act: 'stand' }],
    b1: [{ t: 0, x: 0, z: 3.4, act: 'defend' }],
    b7: [{ t: 0, x: 6, z: 10, act: 'defend' }],
  }, options: [{ kind: 'pass', to: 'r50', lob }] } },
  variants: [{ id: 'fixed', weight: 1, defPaths: {} }],
});
function until(s: PlayState, predicate: () => boolean, c = cfg, rng = safe): EngineEvent[] {
  const events: EngineEvent[] = [];
  for (let i = 0; i < 4000 && !predicate(); i++) events.push(...step(s, 1 / 120, c, rng));
  expect(predicate()).toBe(true);
  return events;
}
function setup(play = fixture(), c = cfg): PlayState {
  const s = createPlayState(play, c, safe);
  until(s, () => s.phase === 'decision', c);
  return s;
}
function receive(q: number, c = cfg, rng = safe, play = fixture()): PlayState {
  const s = setup(play, c);
  command(s, { kind: 'pass', to: 'r50', quality: q }, c, rng);
  until(s, () => s.handler === 'r50', c);
  return s;
}
function shootP(q: number, random = 0, rng = safe): number {
  const c = { ...cfg, closeoutRandom: random }, s = receive(q, c, rng);
  until(s, () => s.phase === 'decision', c);
  command(s, { kind: 'tap' }, c, safe);
  return s.combo!.P;
}
function rolls(start: number, end: number): () => number {
  const values = [.99, start, end];
  return () => values.shift() ?? .99;
}
function seeded(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

describe('Shooting Pocket und Closeout', () => {
  it('lässt den Empfänger beim perfekten Pass sofort werfen, auch ohne quality-Feld', () => {
    for (const quality of [undefined, 1]) {
      const s = setup();
      command(s, { kind: 'pass', to: 'r50', quality }, cfg, safe);
      const events = until(s, () => s.handler === 'r50');
      expect(events).toContainEqual({ type: 'pocket', quality: 1 });
      expect(s.phase).toBe('decision');
      expect(s.arrowMeter?.kind).toBe('catchshoot');
      command(s, { kind: 'tap' }, cfg, safe);
      expect(s.phase).toBe('ballflight');
    }
  });
  it('sperrt bei q = 0 alle Aktionen für exakt 0,6 Spielsekunden und senkt P', () => {
    const c = { ...cfg, animSpeed: .5 }, s = receive(0, c), start = s.gameT;
    for (const dt of [.59, .009]) {
      step(s, dt / c.animSpeed, c, safe);
      for (const cmd of [{ kind: 'comboStart' }, { kind: 'drive', lane: 0 },
        { kind: 'pass', to: 'r3' }] as const) expect(command(s, cmd, c, safe)).toEqual([]);
      expect(s.phase).toBe('receiving');
      expect(s.combo).toBeNull();
    }
    step(s, .001 / c.animSpeed, c, safe);
    expect(s.gameT - start).toBeCloseTo(.6, 9);
    expect(s.phase).toBe('decision');
    command(s, { kind: 'tap' }, c, safe);
    expect(s.combo!.P).toBeLessThan(shootP(1));
  });
  it('nutzt passDelayMax = 0 und verändert bei fehlendem Closeout-Regler den alten RNG-Ablauf nicht', () => {
    const { closeoutRandom: _unused, ...c } = { ...cfg, passDelayMax: 0 };
    const s = receive(0, c, () => .99);
    expect(s.phase).toBe('decision');
    const old = setup();
    command(old, { kind: 'pass', to: 'r50' }, c, safe);
    let draws = 0;
    until(old, () => old.handler === 'r50', c, () => { draws++; return .99; });
    expect(draws).toBe(2); // Foul und Tempo des neuen Catch-and-Shoot-Meters.
  });
  it('ordnet den beim Fangen nächsten Verteidiger zu und lässt nur ihn aufschließen', () => {
    const p = fixture();
    p.segments.setup.paths.b1 = [{ t: 0, x: 0, z: 3.4, act: 'defend' }, { t: .4, x: 5, z: 10, act: 'defend' }];
    p.segments.setup.paths.b7 = [{ t: 0, x: 6, z: 10, act: 'defend' }, { t: .4, x: 0, z: 3.4, act: 'defend' }];
    const s = receive(0, cfg, safe, p), before = structuredClone(s.actors);
    step(s, .3, cfg, safe);
    expect(s.actors.b7.pos.z).toBeGreaterThan(before.b7.pos.z);
    expect(s.actors.b1.pos).toEqual(before.b1.pos);
  });
  it('versetzt den ungenauen Ball-Fangpunkt um höchstens 0,5 m und führt ihn zurück', () => {
    const good = receive(1), bad = receive(0);
    const d = Math.hypot(good.ball.x - bad.ball.x, good.ball.y - bad.ball.y, good.ball.z - bad.ball.z);
    expect(d).toBeCloseTo(.5);
    const start = { ...bad.ball };
    step(bad, .3, cfg, safe);
    expect(bad.ball).not.toEqual(start);
    until(bad, () => bad.phase === 'decision');
    expect(Object.values(bad.ball).every(Number.isFinite)).toBe(true);
  });
  it('kann bei festem RNG einen mittelguten Pass freier lassen als einen perfekten', () => {
    expect(shootP(.5, 1, rolls(1, 1))).toBeGreaterThan(shootP(1, 1, rolls(0, 0)));
  });
  it('verwendet Startversatz und Endabstand unabhängig voneinander', () => {
    expect(shootP(1, 1, rolls(0, .5))).toBeLessThan(shootP(1, 1, rolls(1, .5)));
    expect(shootP(0, 1, rolls(0, 0))).toBeLessThan(shootP(0, 1, rolls(0, 1)));
  });
  it('liefert im Mittel über 200 RNG-Seeds höheres P für q = 1 als q = 0,3', () => {
    let good = 0, bad = 0;
    for (let seed = 1; seed <= 200; seed++) {
      good += shootP(1, 1, seeded(seed));
      bad += shootP(.3, 1, seeded(seed));
    }
    expect(good / 200).toBeGreaterThan(bad / 200 + .1);
  });
  it.each([0, .5, 1])('multipliziert beim Lob die Zonen zusätzlich mit 0,75 + 0,25 × %s', q => {
    const c = { ...cfg, passDelayMax: 0 }, good = receive(1, c, safe, fixture(true));
    const s = receive(q, c, safe, fixture(true));
    expect(s.phase).toBe('takeoff');
    expect(s.combo!.P).toBe(good.combo!.P);
    expect(s.combo!.zones.g).toBeCloseTo(good.combo!.zones.g * (.75 + .25 * q));
    expect(s.combo!.zones.a).toBeCloseTo(good.combo!.zones.a * (.75 + .25 * q));
  });
  it('fängt auch den ungenauen Lob direkt am Idealpunkt und beendet ohne Tipp', () => {
    const s = receive(0, cfg, safe, fixture(true));
    expect(s.phase).toBe('takeoff');
    expect(s.arrowMeter?.kind).toBe('alleyoop');
    expect(s.combo).not.toBeNull();
    s.clock = .1;
    until(s, () => s.phase === 'ended');
    expect(s.phase).toBe('ended');
    expect(s.banner).toBe('VOM RING');
  });
  it('spielt den KI-Pass mit q = 0,5', () => {
    const s = setup();
    step(s, cfg.decisionS, cfg, safe);
    const events = until(s, () => s.handler === 'r50');
    expect(events).toContainEqual({ type: 'pocket', quality: .5 });
    expect(s.phase).toBe('receiving');
  });
  it('lässt Steal-Chancen unabhängig von q unverändert', () => {
    for (const quality of [0, .5, 1]) {
      const s = setup();
      s.actors.b1.pos = { x: -2, z: 5 };
      expect(command(s, { kind: 'pass', to: 'r50', quality }, cfg, () => .59))
        .toContainEqual({ type: 'pass', from: 'r3', to: 'r50', steal: true });
    }
  });
  it('verändert bei q = 1 und Closeout-Zufall 0 die Fangposition des Verteidigers nicht', () => {
    const s = receive(1);
    expect(s.actors.b1.pos).toEqual({ x: 0, z: 3.4 });
    command(s, { kind: 'tap' }, cfg, safe);
    expect(s.combo!.P).toBe(positionValue({ x: 0, z: 5 }, [{ x: 0, z: 3.4 }, { x: 6, z: 10 }]));
  });
});

const routes = Object.values(PLAYS).flatMap(play => play.variants.flatMap(variant =>
  play.segments[play.start].options!.flatMap(first => {
    const follow = first.kind === 'pass' && !first.lob ? play.segments[first.next!].options! : [undefined];
    return follow.flatMap(next => [0, .3, 1].map(q => ({
      title: `${play.id}/${variant.id}/${first.to ?? first.kind}/${next?.kind ?? 'Ende'}/q=${q}`,
      play: { ...play, variants: [{ ...variant, weight: 1 }] }, route: next ? [first, next] : [first], q,
    })));
  })));
describe.each(routes)('Pocket-Route $title', ({ play, route, q }) => {
  it('erreicht weiterhin ended', () => {
    const c = { ...cfg, closeoutRandom: 1 }, s = setup(play, c);
    let index = 0;
    for (let i = 0; i < 3600 && s.phase !== 'ended'; i++) {
      if (s.phase === 'decision') {
        const o: Option = route[index++] ?? { kind: 'shoot' };
        if (s.arrowMeter && o.kind === 'shoot') {
          step(s, Math.max(0, s.arrowMeter.startTime + s.arrowMeter.meterMs / 1000 - s.realTime), c, safe);
          command(s, { kind: 'tap' }, c, safe);
        } else command(s, o.kind === 'pass' ? { kind: 'pass', to: o.to!, quality: q }
          : o.kind === 'drive' ? { kind: 'drive', lane: 0 } : { kind: 'comboStart' }, c, safe);
      }
      if (s.phase === 'takeoff' && s.arrowMeter) command(s, { kind: 'tap' }, c, safe);
      else if (s.phase === 'takeoff' || s.phase === 'freethrows') command(s, { kind: 'comboStart' }, c, safe);
      if (s.phase === 'combo') command(s, { kind: 'comboRelease', holdMs: s.combo!.meterMs, angleDeg: 0 }, c, safe);
      step(s, 1 / 120, c, safe);
    }
    expect(s.phase).toBe('ended');
    expect(index).toBe(route.length);
  });
});
