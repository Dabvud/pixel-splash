import { describe, expect, it } from 'vitest';
import { command, createPlayState, lastHint, step } from '../src/play/engine';
import type { EngineConfig, EngineEvent, PlayState } from '../src/play/engine';
import { PLAYS } from '../src/play/plays';
import type { Play } from '../src/play/types';
import { bankWindow, effectiveZones } from '../src/shot/resolve';

const cfg: EngineConfig = {
  slowmo: .3, decisionS: 2, animSpeed: 1, foulMult: 0, zoneFloor: .7, tempoSpread: 0,
  passDelayMax: .6, closeoutRandom: 0,
  shot: { meterMs: 700, greenZone: .07, aimDeg: 6, influence: .6 },
  finish: { meterMs: 450, greenZone: .1, aimDeg: 8 },
};
const safe = () => .99;
function fixture(lob = false, shoot = true): Play {
  return {
    id: 'inbound', name: 'Pfeil-Test', clockS: 30, deficit: 2, inboundBy: 'r3',
    actors: ['r3', 'r50', 'b1'], start: 'setup',
    segments: {
      setup: { id: 'setup', handler: 'r3', decisionAt: 0, paths: {
        r3: [{ t: 0, x: -8, z: 3, act: 'stand' }],
        r50: [{ t: 0, x: 0, z: .6, act: 'stand' }],
        b1: [{ t: 0, x: 7, z: 12, act: 'defend' }],
      }, options: [{ kind: 'pass', to: 'r50', next: 'received', lob }] },
      received: { id: 'received', handler: 'r50', decisionAt: 0, paths: {},
        options: [...(shoot ? [{ kind: 'shoot' as const }] : []), { kind: 'drive' }, { kind: 'pass', to: 'r3' }] },
    }, variants: [{ id: 'fixed', weight: 1, defPaths: {} }],
  };
}
function until(s: PlayState, done: () => boolean, c = cfg): EngineEvent[] {
  const events: EngineEvent[] = [];
  for (let i = 0; i < 12000 && !done(); i++) events.push(...step(s, 1 / 240, c, safe));
  expect(done()).toBe(true);
  return events;
}
function pass(lob = false, quality = 1, c = cfg, play = fixture(lob)): PlayState {
  const s = createPlayState(play, c, safe);
  until(s, () => s.phase === 'decision', c);
  command(s, { kind: 'pass', to: 'r50', quality }, c, safe);
  return s;
}
function ready(c = cfg): PlayState {
  const s = pass(false, 1, c);
  until(s, () => s.arrowMeter?.kind === 'catchshoot', c);
  return s;
}
function fill(s: PlayState, value: number, c = cfg): void {
  step(s, Math.max(0, s.arrowMeter!.startTime + value * s.arrowMeter!.meterMs / 1000 - s.realTime), c, safe);
}

describe('Pfeil-Timing', () => {
  it.each([[4, 4, true], [6.6, .5, false]] as const)(
    'zeigt und wertet das Brett-Fenster beim Pfeil aus der Position (%s,%s)', (x, z, made) => {
      const play = fixture();
      play.segments.setup.paths.r50[0] = { t: 0, x, z, act: 'stand' };
      const s = pass(false, 1, cfg, play);
      until(s, () => s.arrowMeter?.kind === 'catchshoot');
      expect(s.arrowMeter!.bankWindow).toEqual(bankWindow({ ...cfg.shot, rating: .2, distance: Math.hypot(x, z),
        zoneFactor: 1, bankAngleDeg: Math.atan2(Math.abs(x), z) * 180 / Math.PI }));
      fill(s, 1 + 1.5 * s.arrowMeter!.zones.g);
      command(s, { kind: 'tap' }, cfg, safe);
      until(s, () => s.phase === 'ended');
      expect(s.points).toBe(made ? 2 : 0);
      if (made) expect(s.banner).toBe('ASSIST + BRETT – DRIN');
    });
  it.each([['ideal', 0, true], ['grün', .9, true], ['früh', -1.5, false], ['spät', 1.5, true]] as const)(
    'wertet %s nur mit Timing und denselben effektiven Zonen', (_name, zoneOffset, made) => {
      const s = ready(), g = s.arrowMeter!.zones.g;
      fill(s, 1 + zoneOffset * g);
      const events = command(s, { kind: 'tap' }, cfg, safe);
      expect(events).toContainEqual({ type: 'arrowTap', fill: expect.closeTo(1 + zoneOffset * g, 8) });
      expect(s.phase).toBe('ballflight');
      expect(s.combo!.zones).toEqual(effectiveZones({ ...cfg.shot, rating: .2, distance: .6, zoneFactor: 1 }));
      until(s, () => s.phase === 'ended');
      expect(s.points).toBe(made ? 2 : 0);
    });
  it('ignoriert tap außerhalb eines aktiven Meters', () => {
    const s = createPlayState(fixture(), cfg, safe);
    expect(command(s, { kind: 'tap' }, cfg, safe)).toEqual([]);
    expect(s.arrowMeter).toBeNull();
  });
});

describe.each([false, true])('Loslassen beim Pass-Pfeil (Lob=%s)', lob => {
  it('trifft bei frühem Aufsetzen und Loslassen bei Füllstand 1', () => {
    const s = createPlayState(fixture(lob), cfg, safe);
    until(s, () => s.phase === 'decision');
    command(s, { kind: 'finger', down: true }, cfg, safe);
    command(s, { kind: 'pass', to: 'r50' }, cfg, safe);
    if (!lob) until(s, () => s.arrowMeter !== null);
    fill(s, 1);
    expect(s.arrowMeter!.fill).toBeNull();
    command(s, { kind: 'tap' }, cfg, safe);
    command(s, { kind: 'finger', down: false }, cfg, safe);
    until(s, () => s.phase === 'ended');
    expect(s.points).toBe(2);
  });
  it('verfehlt bei Aufsetzen bei Füllstand 1 und spätem Loslassen', () => {
    const s = lob ? pass(true) : ready();
    fill(s, 1);
    command(s, { kind: 'finger', down: true }, cfg, safe);
    fill(s, 1.4);
    command(s, { kind: 'tap' }, cfg, safe);
    expect(s.arrowMeter!.fill).toBeCloseTo(1.4, 8);
    if (lob) expect(s.arrowMeter!.feedback).toBe('ZU SPÄT');
    until(s, () => s.phase === 'ended');
    expect(s.points).toBe(0);
    expect(lastHint(s)).toContain('zu spät');
  });
});

describe('Alley-oop-Pfeil', () => {
  it.each([.5, 1, 1.5])('trifft bei Animationstempo %s den Idealpunkt beim Fangen, auch bei q = 0', animSpeed => {
    const c = { ...cfg, animSpeed }, s = pass(true, 0, c);
    expect(s.handler).toBe('r3');
    until(s, () => s.handler === 'r50', c);
    expect(s.phase).toBe('takeoff');
    expect((s.realTime - s.arrowMeter!.startTime) * 1000 / s.arrowMeter!.meterMs).toBeCloseTo(1, 1);
    command(s, { kind: 'tap' }, c, safe);
    until(s, () => s.phase === 'ended', c);
    expect(s.points).toBe(2);
  });
  it('wertet einen Tipp vor dem Fangen erst mit dem Empfänger aus', () => {
    const s = pass(true);
    fill(s, .95);
    command(s, { kind: 'tap' }, cfg, safe);
    expect(s.phase).toBe('passing');
    expect(s.handler).toBe('r3');
    until(s, () => s.phase === 'ended');
    expect(s.handler).toBe('r50');
    expect(s.points).toBe(2);
  });
  it('beendet ohne Tipp mit VOM RING statt einer wartenden Abschluss-Kombi', () => {
    const s = pass(true);
    until(s, () => s.phase === 'ended');
    expect(s.banner).toBe('VOM RING');
    expect(s.points).toBe(0);
  });
  it('wendet Positions-, Foul-, Kontakt- und Lobfaktor genau einmal an und endet ohne Tipp mit GEBLOCKT', () => {
    const play = fixture(true), c = { ...cfg, foulMult: 2 };
    play.segments.setup.paths.b1 = [{ t: 0, x: 0, z: .1, act: 'defend' }];
    const s = createPlayState(play, c, safe);
    until(s, () => s.phase === 'decision', c);
    const rolls = [.99, 0, 0, .5]; // kein Steal, Kontakt-Dunk, Foul, Tempo
    command(s, { kind: 'pass', to: 'r50', quality: 0 }, c, () => rolls.shift() ?? .99);
    expect(s.arrowMeter!.zones).toEqual(effectiveZones({ ...c.finish, influence: c.shot.influence,
      rating: .8, distance: 4.6, zoneFactor: .7 * .6 * .75 * .75 }));
    until(s, () => s.phase === 'ended', c);
    expect(s.banner).toBe('GEBLOCKT');
  });
  it('startet bei einem kürzeren Lob frühestens beim Abspiel', () => {
    const play = fixture(true);
    play.segments.setup.paths.r3[0].x = -.2;
    play.segments.setup.paths.r3[0].z = .6;
    const s = pass(true, 1, cfg, play);
    expect(s.arrowMeter!.startTime).toBe(s.realTime);
    until(s, () => s.phase === 'ended');
  });
});

describe('Catch-and-Shoot-Pfeil', () => {
  it('würfelt das Tempo einmal beim Start und aktualisiert die Zonen bis zum Tipp mit dem aktuellen P', () => {
    const play = fixture(), c = { ...cfg, tempoSpread: .3 };
    play.segments.setup.paths.b1[0] = { t: 0, x: 0, z: .1, act: 'defend' };
    const s = pass(false, 1, c, play);
    let draws = 0;
    for (let i = 0; i < 1000 && !s.arrowMeter; i++) step(s, 1 / 240, c, () => { draws++; return .99; });
    expect(draws).toBe(2);
    expect(s.arrowMeter!.meterMs).toBeCloseTo(700 * (1 + .98 * .3), 8);
    const duration = s.arrowMeter!.meterMs, defended = s.arrowMeter!.zones.g;
    s.actors.b1.pos = { x: 7, z: 12 };
    fill(s, 1, c);
    expect(s.arrowMeter!.meterMs).toBe(duration);
    expect(s.arrowMeter!.zones.g).toBeGreaterThan(defended);
    const zones = { ...s.arrowMeter!.zones };
    command(s, { kind: 'tap' }, c, safe);
    expect(s.combo!.P).toBe(1);
    expect(s.combo!.zones).toEqual(zones);
    until(s, () => s.phase === 'ended', c);
    expect(s.points).toBe(2);
  });
  it('startet erst nach der Pass-Verzögerung und nur mit Wurfoption', () => {
    const s = pass(false, 0);
    until(s, () => s.phase === 'receiving');
    expect(s.arrowMeter).toBeNull();
    const caught = s.gameT;
    step(s, .59, cfg, safe);
    expect(s.arrowMeter).toBeNull();
    const events = until(s, () => s.arrowMeter !== null);
    expect(s.gameT - caught).toBeCloseTo(.6, 2);
    expect(events).toContainEqual({ type: 'arrowStart', kind: 'catchshoot' });
    const noShot = pass(false, 1, cfg, fixture(false, false));
    until(noShot, () => noShot.handler === 'r50');
    expect(noShot.arrowMeter).toBeNull();
  });
  it('wertet Füllstand und aktuelles P erst beim Loslassen aus', () => {
    const s = ready();
    command(s, { kind: 'finger', down: true }, cfg, safe);
    expect(s.phase).toBe('decision');
    s.actors.b1.pos = { x: 0, z: .1 };
    fill(s, 1);
    const zones = { ...s.arrowMeter!.zones };
    command(s, { kind: 'tap' }, cfg, safe);
    command(s, { kind: 'finger', down: false }, cfg, safe);
    expect(s.combo!.P).toBeLessThan(1);
    expect(s.combo!.zones).toEqual(zones);
    expect(s.arrowMeter!.fill).toBeCloseTo(1, 8);
    until(s, () => s.phase === 'ended');
    expect(s.points).toBe(2);
  });
  it.each(['drive', 'pass'] as const)('beendet den Pfeil beim Kurzwisch für %s', kind => {
    const s = ready();
    command(s, kind === 'drive' ? { kind, lane: 0 } : { kind, to: 'r3' }, cfg, safe);
    expect(s.arrowMeter).toBeNull();
    expect(s.phase).toBe(kind === 'drive' ? 'driving' : 'passing');
    until(s, () => s.phase === 'ended');
  });
  it('beginnt die normale Entscheidungsfrist erst nach dem Durchlauf', () => {
    const s = ready();
    const events = step(s, s.arrowMeter!.meterMs * 1.6 / 1000 + .01, cfg, safe);
    expect(s.arrowMeter).toBeNull();
    expect(s.phase).toBe('decision');
    expect(events).toContainEqual({ type: 'arrowEnd' });
    expect(events.filter(e => e.type === 'decision')).toHaveLength(1);
    expect(step(s, cfg.decisionS - .02, cfg, safe).some(e => e.type === 'decision')).toBe(false);
    command(s, { kind: 'comboStart' }, cfg, safe);
    expect(s.phase).toBe('combo');
    until(s, () => s.phase === 'ended');
  });
  it.each([.2, .5])('nutzt bei Zeitlupe %s Echtzeit und pausiert bei dt = 0', slowmo => {
    const c = { ...cfg, slowmo, animSpeed: .5 }, s = ready(c), before = s.gameT;
    const snapshot = JSON.stringify(s);
    step(s, 0, c, safe);
    expect(JSON.stringify(s)).toBe(snapshot);
    fill(s, 1, c);
    expect(s.gameT - before).toBeCloseTo(cfg.shot.meterMs / 1000 * slowmo * .5, 2);
    command(s, { kind: 'tap' }, c, safe);
    expect(s.arrowMeter!.fill).toBeCloseTo(1, 8);
  });
  it('wechselt auch mit aufliegendem Finger ohne Zusatzfrist zur normalen Entscheidung', () => {
    const s = ready(), m = s.arrowMeter!;
    command(s, { kind: 'finger', down: true }, cfg, safe);
    const events = step(s, m.startTime + m.meterMs * 1.6 / 1000 - s.realTime + .001, cfg, safe);
    expect(s.arrowMeter).toBeNull();
    expect(s.phase).toBe('decision');
    expect(events).toContainEqual({ type: 'arrowEnd' });
    expect(command(s, { kind: 'tap' }, cfg, safe)).toEqual([]);
    until(s, () => s.phase === 'ended');
  });
  it('wechselt nach einem getroffenen Pfeilwurf mit Foul zu Freiwürfen mit normaler Halte-Kombi', () => {
    const c = { ...cfg, foulMult: 100 }, s = ready(c);
    fill(s, 1, c);
    command(s, { kind: 'tap' }, c, safe);
    until(s, () => s.phase === 'freethrows', c);
    expect(s.points).toBe(2);
    expect(s.arrowMeter).toBeNull();
    expect(s.freeThrows).toEqual({ shooter: 'r50', left: 1 });
    expect(command(s, { kind: 'tap' }, c, safe)).toEqual([]);
    command(s, { kind: 'comboStart' }, c, safe);
    expect(s.phase).toBe('combo');
    command(s, { kind: 'comboRelease', holdMs: s.combo!.meterMs, angleDeg: 0 }, c, safe);
    until(s, () => s.phase === 'ended', c);
    expect(s.points).toBe(3);
  });
  it('verwirft Aufsetzen vor Meterende, wenn erst nach dem Durchlauf losgelassen wird', () => {
    const s = ready();
    fill(s, 1.55);
    command(s, { kind: 'finger', down: true }, cfg, safe);
    step(s, .15, cfg, safe);
    expect(command(s, { kind: 'tap' }, cfg, safe)).toEqual([]);
    expect(s.phase).toBe('decision');
    expect(s.arrowMeter).toBeNull();
  });
  it.each([99, 100, 101])('akzeptiert Loslassen nach %s ms nur strikt vor 0:00', elapsed => {
    const s = ready();
    fill(s, 1 - elapsed / cfg.shot.meterMs);
    command(s, { kind: 'finger', down: true }, cfg, safe);
    s.clock = .1 * cfg.slowmo;
    step(s, elapsed / 1000, cfg, safe);
    command(s, { kind: 'tap' }, cfg, safe);
    if (elapsed < 100) {
      expect(s.phase).toBe('ballflight');
      expect(s.combo!.P).toBe(1);
      until(s, () => s.phase === 'ended');
      expect(s.points).toBe(2);
    } else {
      expect(s.phase).toBe('ended');
      expect(s.banner).toBe('ZEIT ABGELAUFEN');
      expect(s.points).toBe(0);
    }
  });
});

describe.each(Object.values(PLAYS).flatMap(play => play.variants.map(variant => ({
  title: `${play.id}/${variant.id}`, play: { ...play, variants: [{ ...variant, weight: 1 }] },
}))))('Pfeil-Routen $title', ({ play }) => {
  it.each([true, false])('erreicht mit Pfeil-Tipps = %s ended', tap => {
    const s = createPlayState(play, cfg, safe);
    for (let i = 0; i < 12000 && s.phase !== 'ended'; i++) {
      if (tap && s.arrowMeter && s.arrowMeter.fill === null && s.realTime >= s.arrowMeter.startTime + s.arrowMeter.meterMs / 1000)
        command(s, { kind: 'tap' }, cfg, safe);
      step(s, 1 / 240, cfg, safe);
    }
    expect(s.phase).toBe('ended');
  });
});
