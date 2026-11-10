import { describe, expect, it } from 'vitest';
import { actorHead, command, createPlayState, step, type EngineConfig, type EngineEvent } from '../src/play/engine';
import type { Play } from '../src/play/types';
import { MOVES, moveFrames } from '../src/figure/moves';
import { ACTORS } from '../src/play/teams';
import { RIM } from '../src/shot/trajectory';
import { frameAt } from '../src/render/actors';

const cfg: EngineConfig = {
  finishArrow: true, slowmo: .3, decisionS: 2, animSpeed: 1, foulMult: 0, zoneFloor: .7, tempoSpread: 0,
  shot: { meterMs: 700, greenZone: .07, aimDeg: 6, influence: .6 },
  finish: { meterMs: 450, greenZone: .1, aimDeg: 8 },
};
const rng = () => .1;

function finishFixture(kind: 'layup' | 'dunk' | 'contact_dunk', lob = false): Play {
  const handler = kind === 'layup' ? 'r3' : 'r23';
  return {
    id: 'fastbreak', name: 'Abschluss', clockS: 30, deficit: 2, start: 'setup', actors: [handler, 'r11', 'b1'],
    segments: { setup: { id: 'setup', handler: lob ? 'r11' : handler, decisionAt: 0,
      paths: { [handler]: [{ t: 0, x: 0, z: lob ? 1.2 : 3, act: 'dribble' }],
        r11: [{ t: 0, x: 4, z: 5, act: 'stand' }] },
      options: lob ? [{ kind: 'pass', to: handler, lob: true }] : [{ kind: 'drive' }] } },
    variants: [{ id: 'fixed', weight: 1, defPaths: { setup: {
      b1: [{ t: 0, x: kind === 'contact_dunk' ? 0 : 6, z: .8, act: 'defend' }],
    } } }],
  };
}

function takeoff(kind: 'layup' | 'dunk' | 'contact_dunk', lob = false, c = cfg) {
  const s = createPlayState(finishFixture(kind, lob), c, rng);
  // Das Intro läuft in Spielzeit: bei animSpeed=.5 reichen .8 Echtsekunden nicht.
  for (let i = 0; i < 1000 && s.phase !== 'decision'; i++) step(s, 1 / 240, c, rng);
  expect(s.phase).toBe('decision');
  command(s, lob ? { kind: 'pass', to: kind === 'layup' ? 'r3' : 'r23' } : { kind: 'drive', lane: 0 }, c, rng);
  for (let i = 0; i < 1000 && (!s.arrowMeter || s.realTime < s.arrowMeter.startTime); i++) step(s, 1 / 240, c, rng);
  expect(s.arrowMeter).not.toBeNull();
  return s;
}

describe('Abschluss-Feedback und Poster', () => {
  it.each(['layup', 'dunk', 'contact_dunk', 'alleyoop'] as const)(
    '%s friert beim Loslassen Pfeil, Markierung und Zonen bis zum result-Ereignis ein und erreicht ended', route => {
      const s = takeoff(route === 'alleyoop' ? 'dunk' : route, route === 'alleyoop');
      const m = s.arrowMeter!;
      step(s, Math.max(0, m.startTime + m.meterMs / 1000 - s.realTime), cfg, rng);
      expect(command(s, { kind: 'finger', down: true }, cfg, rng)).toEqual([]);
      expect(m.fill).toBeNull();
      const events = command(s, { kind: 'tap' }, cfg, rng);
      command(s, { kind: 'finger', down: false }, cfg, rng);
      expect(events.some(e => e.type === 'arrowTap')).toBe(true);
      expect(m.fill).toBeCloseTo(1, 5);
      const frozen = structuredClone(m);
      let result = false;
      for (let i = 0; i < 2000 && s.phase !== 'ended'; i++) {
        const es = step(s, 1 / 120, cfg, rng);
        result ||= es.some(e => e.type === 'result');
        if (!result) expect(s.arrowMeter).toEqual(frozen);
        else expect(s.arrowMeter).toBeNull();
      }
      expect(result).toBe(true);
      expect(s.phase).toBe('ended');
    });

  it.each(['layup', 'dunk', 'contact_dunk'] as const)(
    '%s trifft mit frühem Aufsetzen und Loslassen bei Füllstand 1', kind => {
      const s = takeoff(kind), m = s.arrowMeter!;
      command(s, { kind: 'finger', down: true }, cfg, rng);
      step(s, m.startTime + m.meterMs / 1000 - s.realTime, cfg, rng);
      expect(m.fill).toBeNull();
      command(s, { kind: 'tap' }, cfg, rng);
      command(s, { kind: 'finger', down: false }, cfg, rng);
      step(s, 10, cfg, rng);
      expect(s.points).toBe(2);
    });
  it('verfehlt bei Aufsetzen bei Füllstand 1 und spätem Loslassen mit ZU SPÄT', () => {
    const s = takeoff('layup'), m = s.arrowMeter!;
    step(s, m.startTime + m.meterMs / 1000 - s.realTime, cfg, rng);
    command(s, { kind: 'finger', down: true }, cfg, rng);
    step(s, m.meterMs * .4 / 1000, cfg, rng);
    command(s, { kind: 'tap' }, cfg, rng);
    expect(m.fill).toBeCloseTo(1.4, 8);
    expect(m.feedback).toBe('ZU SPÄT');
    step(s, 10, cfg, rng);
    expect(s.points).toBe(0);
  });
  it.each(['layup', 'dunk', 'contact_dunk'] as const)(
    '%s läuft bei gehaltenem Finger ohne zusätzliche Wartezeit als Fehlversuch ab', kind => {
      const s = takeoff(kind), m = s.arrowMeter!;
      command(s, { kind: 'finger', down: true }, cfg, rng);
      step(s, m.startTime + m.meterMs * 1.6 / 1000 - s.realTime + .001, cfg, rng);
      expect(s.phase).toBe('ballflight');
      expect(m.feedback).toBe('ZU LANGSAM');
      step(s, 10, cfg, rng);
      expect(s.points).toBe(0);
      expect(s.phase).toBe('ended');
    });
  it.each(['layup', 'dunk', 'contact_dunk'] as const)(
    '%s zeigt nach kurzem tap alle Bilder 0…rimFrame in normaler Spielzeit vor result', kind => {
      for (const [animSpeed, fill] of [[.5, 0], [.5, 1], [1.5, 1], [1.5, 1.4]]) {
        const c = { ...cfg, animSpeed, slowmo: .1 }, s = takeoff(kind, false, c), m = s.arrowMeter!;
        step(s, m.startTime + m.meterMs * fill / 1000 - s.realTime, c, rng);
        command(s, { kind: 'finger', down: true }, c, rng);
        command(s, { kind: 'tap' }, c, rng);
        command(s, { kind: 'finger', down: false }, c, rng);
        const a = s.actors[s.handler], started = s.gameT, indices = [frameAt(a.move, a.moveT)];
        expect(a.move).toBe(kind);
        expect(a.moveT).toBe(0);
        let result = false, contactY = 0, previousY = 0, fell = false;
        for (let i = 0; i < 2000 && !result; i++) {
          const events = step(s, 1 / 240, c, rng);
          result = events.some(e => e.type === 'result');
          if (a.move === kind) {
            expect(a.moveT).toBeCloseTo(s.gameT - started, 8);
            const index = frameAt(a.move, a.moveT);
            if (index !== indices.at(-1)) indices.push(index);
            if (kind !== 'layup' && fill === 1) {
              const contactT = MOVES[kind].rimFrame! / MOVES[kind].fps;
              if (a.moveT <= contactT + 1e-9) {
                expect(a.y + 1e-9).toBeGreaterThanOrEqual(previousY);
                previousY = a.y;
                if (Math.abs(a.moveT - contactT) < 1e-8) {
                  contactY = a.y;
                  expect(s.ball.y).toBeCloseTo(RIM.y, 6);
                }
              } else fell ||= a.y < contactY - .01;
            }
          }
          if (!result && s.gameT - started < .6) expect(s.phase).toBe('ballflight');
        }
        expect(result).toBe(true);
        expect(s.gameT - started).toBeGreaterThanOrEqual(.6);
        expect(indices).toEqual(Array.from({ length: MOVES[kind].frames }, (_, i) => i));
        expect(indices.slice(0, MOVES[kind].rimFrame! + 1)).toEqual(
          Array.from({ length: MOVES[kind].rimFrame! + 1 }, (_, i) => i));
        if (kind !== 'layup' && fill === 1) { expect(contactY).toBeGreaterThan(0); expect(fell).toBe(true); }
      }
    });

  it.each([[-2, 'ZU FRÜH'], [-1, 'PERFEKT'], [0, 'PERFEKT'], [1, 'PERFEKT'], [2, 'ZU SPÄT']] as const)(
    'zeigt beim Tipp für Timingfehler %s sofort %s', (t, word) => {
      const s = takeoff('layup'), m = s.arrowMeter!;
      step(s, Math.max(0, m.startTime + m.meterMs * (1 + t * m.zones.g) / 1000 - s.realTime), cfg, rng);
      command(s, { kind: 'tap' }, cfg, rng);
      expect(m.feedback).toBe(word);
    });

  it.each(['layup', 'dunk', 'contact_dunk', 'alleyoop'] as const)(
    '%s zeigt ohne Tipp ZU LANGSAM während der Fehlversuchsanimation und erreicht ended', route => {
      const s = takeoff(route === 'alleyoop' ? 'contact_dunk' : route, route === 'alleyoop');
      const m = s.arrowMeter!;
      step(s, m.startTime + m.meterMs * 1.6 / 1000 - s.realTime + .01, cfg, rng);
      expect(s.arrowMeter?.feedback).toBe('ZU LANGSAM');
      expect(s.arrowMeter?.fill).toBe(1.6);
      expect(s.phase).toBe('ballflight');
      step(s, 10, cfg, rng);
      expect(s.phase).toBe('ended');
      expect(s.points).toBe(0);
    });

  it.each([0, 2])('blockt den Kontakt-Dunk-Fehlversuch auch bei Foulmultiplikator %s vor dem Verteidiger', foulMult => {
    const c = { ...cfg, foulMult }, s = takeoff('contact_dunk', false, c);
    command(s, { kind: 'tap' }, c, rng);
    expect(s.actors.b1.move).toBe('block_jump');
    let handContact = false;
    for (let i = 0; i < 700 && s.phase === 'ballflight'; i++) {
      step(s, 1 / 240, c, rng);
      const d = s.actors.b1;
      // Hinter dem Verteidiger darf kein Ball über Ringhöhe vorbeifliegen.
      if (s.ball.z < d.pos.z) expect(s.ball.y).toBeLessThanOrEqual(RIM.y);
      const f = Math.min(MOVES.block_jump.frames - 1, Math.floor((d.moveT + 1e-10) * MOVES.block_jump.fps));
      const h = moveFrames('block_jump')[f].haR, size = ACTORS.b1.heightM;
      const co = Math.cos(d.facing), si = Math.sin(d.facing);
      handContact ||= Math.hypot(s.ball.x - d.pos.x - size * (h.x * co + h.z * si),
        s.ball.y - d.y - size * h.y, s.ball.z - d.pos.z - size * (h.x * si - h.z * co)) < .03;
    }
    expect(handContact).toBe(true);
    expect(s.poster).toBeNull();
    // Bei Foul anschließend die Freiwürfe ausführen.
    for (let i = 0; i < 2000 && s.phase !== 'ended'; i++) {
      if (s.phase === 'freethrows') {
        command(s, { kind: 'comboStart' }, c, rng);
        command(s, { kind: 'comboRelease', holdMs: s.combo!.meterMs, angleDeg: 0 }, c, rng);
      }
      step(s, 1 / 120, c, rng);
    }
    expect(s.phase).toBe('ended');
  });

  it.each([-2, 2])('führt den Dunk bei Timingfehler %s schon mit der Hand zur richtigen Ringseite', t => {
    const s = takeoff('dunk'), m = s.arrowMeter!;
    step(s, m.startTime + m.meterMs * (1 + t * m.zones.g) / 1000 - s.realTime, cfg, rng);
    command(s, { kind: 'tap' }, cfg, rng);
    step(s, MOVES.dunk.rimFrame! / MOVES.dunk.fps, cfg, rng);
    expect(s.ball.z * Math.sign(-t)).toBeGreaterThan(.2);
  });

  it('endet ohne Tipp auch bei angekündigtem Foul weiterhin ohne Freiwürfe', () => {
    const c = { ...cfg, foulMult: 2 }, s = takeoff('contact_dunk', false, c);
    expect(s.combo!.fouled).toBe(true);
    const events = step(s, 10, c, rng);
    expect(events.some(e => e.type === 'freethrow')).toBe(false);
    expect(s.phase).toBe('ended');
    expect(s.banner).toBe('GEBLOCKT');
  });

  it.each(['layup', 'dunk', 'contact_dunk', 'alleyoop'] as const)(
    '%s erreicht auch mit frühem und spätem Tipp ended', route => {
      for (const t of [-2, 2]) {
        const s = takeoff(route === 'alleyoop' ? 'contact_dunk' : route, route === 'alleyoop'), m = s.arrowMeter!;
        step(s, Math.max(0, m.startTime + m.meterMs * (1 + t * m.zones.g) / 1000 - s.realTime), cfg, rng);
        command(s, { kind: 'tap' }, cfg, rng);
        step(s, 10, cfg, rng);
        expect(s.phase).toBe('ended');
        expect(s.points).toBe(0);
      }
    });

  it.each([0, 2])('legt den geposteten Verteidiger bis ended hin, auch mit Foulmultiplikator %s', foulMult => {
    const c = { ...cfg, foulMult }, s = takeoff('contact_dunk', false, c), m = s.arrowMeter!;
    step(s, m.startTime + m.meterMs / 1000 - s.realTime, c, rng);
    command(s, { kind: 'tap' }, c, rng);
    let down = false;
    const events: EngineEvent[] = [];
    for (let i = 0; i < 3000 && s.phase !== 'ended'; i++) {
      if (s.phase === 'freethrows') {
        command(s, { kind: 'comboStart' }, c, rng);
        command(s, { kind: 'comboRelease', holdMs: s.combo!.meterMs, angleDeg: 0 }, c, rng);
      }
      events.push(...step(s, 1 / 120, c, rng));
      down ||= s.actors.b1.move === 'knocked_down';
      if (down) expect(s.actors.b1.move).toBe('knocked_down');
    }
    expect(down).toBe(true);
    expect(s.poster?.defender).toBe('b1');
    expect(actorHead(s.actors.b1).y).toBeLessThan(ACTORS.b1.heightM * .25);
    expect(events.some(e => e.type === 'result' && e.made && e.banner.includes('POSTER!'))).toBe(true);
    expect(s.phase).toBe('ended');
  });
});
