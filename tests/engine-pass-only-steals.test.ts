import { describe, expect, it } from 'vitest';
import { command, createPlayState, step } from '../src/play/engine';
import type { EngineConfig, EngineEvent, PlayState } from '../src/play/engine';
import { PLAYS } from '../src/play/plays';
import { ACTORS } from '../src/play/teams';
import type { Option, Play } from '../src/play/types';

const cfg: EngineConfig = {
  slowmo: .3, decisionS: .6, decisionLead: .5, animSpeed: 1,
  foulMult: 0, zoneFloor: .7, tempoSpread: .3, passDelayMax: 1, closeoutRandom: 1,
  shot: { meterMs: 700, greenZone: .07, aimDeg: 6, influence: .6 },
  finish: { meterMs: 450, greenZone: .1, aimDeg: 8 },
};
const SEEDS = 16; // 23 Spielzüge × Varianten × Optionen: 16 Seeds reichen, 64 sprengten die CI-Laufzeit
const safe = () => .99;
function seeded(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = (t + Math.imul(t ^ t >>> 7, 61 | t)) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function track(s: PlayState, c: EngineConfig, rng: () => number) {
  const events: EngineEvent[] = [];
  let maxTurnovers = s.turnovers, stealSeen = s.banner === 'STEAL';
  function record(next: EngineEvent[]): void {
    events.push(...next);
    maxTurnovers = Math.max(maxTurnovers, s.turnovers);
    stealSeen ||= s.banner === 'STEAL' || next.some(e => e.type === 'result' && e.banner === 'STEAL');
  }
  function advance(dt: number): void { record(step(s, dt, c, rng)); }
  function until(predicate: () => boolean): void {
    for (let i = 0; i < 600 && !predicate() && s.phase !== 'ended'; i++) advance(.05);
    expect(predicate()).toBe(true);
  }
  function noLoss(context: string, passes = 0): void {
    expect(events.filter(e => e.type === 'pass'), context).toHaveLength(passes);
    expect(events.some(e => e.type === 'pass' && e.steal), context).toBe(false);
    expect(stealSeen, context).toBe(false);
    expect(maxTurnovers, context).toBe(0);
    expect(s.turnovers, context).toBe(0);
  }
  return { events, record, advance, until, noLoss };
}
type Trace = ReturnType<typeof track>;

function release(s: PlayState, c: EngineConfig, rng: () => number, t: Trace, perfect: boolean): void {
  if (s.arrowMeter) {
    if (perfect) t.advance(Math.max(0, s.arrowMeter.startTime + s.arrowMeter.meterMs / 1000 - s.realTime));
    t.record(command(s, { kind: 'tap' }, c, rng));
  } else {
    t.record(command(s, { kind: 'comboStart' }, c, rng));
    expect(s.combo).not.toBeNull();
    t.record(command(s, { kind: 'comboRelease', holdMs: perfect ? s.combo!.meterMs : 0,
      angleDeg: perfect ? 0 : 80 }, c, rng));
  }
  expect(s.phase).toBe('ballflight');
  t.until(() => s.phase === 'ended');
}

// Auch Empfänger-Segmente einzeln prüfen, ohne einen vorbereitenden Pass.
// Die volle Uhr verhindert, dass ein direkt gestartetes Folgesegment vor seiner Entscheidung endet.
const segments = Object.values(PLAYS).flatMap(play => play.variants.flatMap(variant =>
  Object.values(play.segments).flatMap(segment => {
    const options = (segment.options ?? [{ kind: 'shoot' }, { kind: 'drive' }]).filter(o => o.kind !== 'pass');
    if (!options.length) return []; // Einwurf selbst hat ausschließlich Pass-Optionen.
    const isolated: Play = { ...play, start: segment.id, clockS: 30,
      variants: [{ ...variant, weight: 1 }] };
    return [{ title: `${play.id}/${variant.id}/${segment.id}`, play: isolated, segment, options }];
  })));
const actions = segments.flatMap(row => row.options.flatMap(option =>
  (option.kind === 'drive' ? [-1, 0, 1] as const : [0] as const).map(lane =>
    ({ ...row, option, lane, title: `${row.title}/${option.kind}/${lane}` }))));

describe('Steals nur bei abgefangenen Pässen', () => {
  it.each(actions)('kein STEAL und kein Ballverlust ohne Pass: $title (16 Seeds)', ({ play, option, lane, title }) => {
    for (let seed = 0; seed < SEEDS; seed++) {
      const rng = seeded(seed), c = { ...cfg, finishArrow: seed % 2 === 0 };
      const s = createPlayState(play, c, rng), t = track(s, c, rng);
      t.until(() => s.phase === 'decision');
      t.advance(.15); // Dribbling und laufendes Entscheidungsfenster vor der Eingabe.
      if (option.kind === 'drive') {
        t.record(command(s, { kind: 'drive', lane }, c, rng));
        expect(s.phase).toBe('driving');
        t.until(() => s.phase === 'takeoff');
      }
      release(s, c, rng, t, seed % 4 < 2);
      t.noLoss(`${title}, Seed ${seed}`);
    }
  });

  const aiCases = segments.flatMap(row => row.options.map(option => ({ ...row, option,
    title: `${row.title}/KI-${option.kind}` })));
  it.each(aiCases)('kein STEAL und kein Ballverlust bei KI ohne Pass: $title (16 Seeds)', ({ play, segment, option, title }) => {
    // Nur Ballführer und Verteidiger: Die Engine ergänzt sonst automatisch Passziele.
    const noPass: Play = { ...play,
      actors: play.actors.filter(id => id === segment.handler || ACTORS[id].team === 'def'),
      segments: { ...play.segments, [segment.id]: { ...segment, options: [option] } } };
    for (let seed = 0; seed < SEEDS; seed++) {
      const rng = seeded(seed), c = { ...cfg, finishArrow: seed % 2 === 0 };
      const s = createPlayState(noPass, c, rng), t = track(s, c, rng);
      t.until(() => s.phase === 'decision');
      t.events.length = 0;
      t.until(() => t.events.some(e => e.type === 'decision' && e.options.length === 1 && e.options[0].kind === option.kind));
      if (seed % 2 === 0) {
        if (option.kind === 'drive') t.until(() => s.phase === 'takeoff');
        release(s, c, rng, t, seed % 4 === 0);
      } else t.until(() => s.phase === 'ended'); // Auch die zweite Entscheidungsfrist/Abschlussfrist.
      t.noLoss(`${title}, Seed ${seed}`);
    }
  });

  it.each(['shoot', 'drive', 'wait'] as const)(
    'kein nachträglicher STEAL beim Fangen/Closeout und %s nach ungenauem Pass (16 Seeds)', action => {
      for (let seed = 0; seed < SEEDS; seed++) {
        const rng = seeded(seed), s = createPlayState(passFixture(false), cfg, rng), t = track(s, cfg, rng);
        t.until(() => s.phase === 'decision');
        t.record(command(s, { kind: 'pass', to: 'r50', quality: 0 }, cfg, rng));
        t.until(() => s.phase === 'receiving');
        t.until(() => s.phase === 'decision');
        expect(Math.hypot(s.actors.b1.pos.x - s.actors.r50.pos.x, s.actors.b1.pos.z - s.actors.r50.pos.z))
          .toBeLessThan(1.2);
        if (action === 'wait') t.until(() => s.phase === 'ended');
        else {
          if (action === 'drive') {
            t.record(command(s, { kind: 'drive', lane: 0 }, cfg, rng));
            t.until(() => s.phase === 'takeoff');
          }
          release(s, cfg, rng, t, seed % 2 === 0);
        }
        t.noLoss(`${action}, Seed ${seed}`, 1);
      }
    });

  it('erhält Passweg und Genauigkeit als Steal-Regel und zählt nur den abgefangenen Pass (16 Seeds)', () => {
    let interceptions = 0, catches = 0;
    for (let seed = 0; seed < SEEDS; seed++) {
      // Gleicher Zufallswert: ungenauer Pass hat 60 %, perfekter Pass weiterhin 9 %.
      const roll = seeded(seed)();
      for (const quality of [0, 1]) {
        const s = createPlayState(passFixture(true), cfg, safe), t = track(s, cfg, safe);
        t.until(() => s.phase === 'decision');
        const stolen = roll < .6 * (.15 + .85 * (1 - quality));
        t.record(command(s, { kind: 'pass', to: 'r50', quality }, cfg, () => roll));
        expect(t.events).toContainEqual({ type: 'pass', from: 'r3', to: 'r50', steal: stolen });
        expect(s.turnovers).toBe(0); // Beim Abspiel noch kein Ballverlust.
        if (stolen) {
          t.until(() => s.phase === 'ended');
          expect(s.banner).toBe('STEAL');
          expect(s.turnovers).toBe(1);
          expect(t.events.some(e => e.type === 'caught')).toBe(false);
          t.advance(2);
          expect(s.turnovers).toBe(1); // Kein erneutes Zählen nach dem Abfangen.
          if (quality === 0) interceptions++;
        } else {
          t.until(() => s.phase === 'decision');
          expect(t.events).toContainEqual({ type: 'caught', by: 'r50' });
          release(s, cfg, safe, t, false);
          t.noLoss(`q=${quality}, Seed ${seed}`, 1);
          if (quality === 0) catches++;
        }
      }
    }
    expect(interceptions).toBeGreaterThan(0);
    expect(catches).toBeGreaterThan(0);
  });

  it('zählt Zeitablauf ohne Pass nicht als Ballverlust, auch direkt am Verteidiger', () => {
    const s = createPlayState(passFixture(true), cfg, () => 0), t = track(s, cfg, () => 0);
    t.until(() => s.phase === 'decision');
    s.actors.b1.pos = { ...s.actors[s.handler].pos };
    s.clock = .001;
    t.until(() => s.phase === 'ended');
    expect(s.banner).toBe('ZEIT ABGELAUFEN');
    t.noLoss('Zeitablauf');
  });

  it('behält den Block beim Kontakt-Dunk als Fehlwurf ohne Ballverlust bei', () => {
    const play = passFixture(true), segment = play.segments.setup;
    segment.handler = 'r50';
    segment.options = [{ kind: 'drive' }];
    segment.paths.r50 = [{ t: 0, x: 0, z: 3, act: 'dribble' }];
    segment.paths.b1 = [{ t: 0, x: 0, z: .8, act: 'defend' }];
    const c = { ...cfg, blockFoulChance: 0 }, rng = () => 0, s = createPlayState(play, c, rng), t = track(s, c, rng);
    t.until(() => s.phase === 'decision');
    t.record(command(s, { kind: 'drive', lane: 0 }, c, rng));
    t.until(() => s.phase === 'takeoff');
    expect(s.combo!.kind).toBe('contact_dunk');
    release(s, c, rng, t, false);
    expect(s.banner).toBe('GEBLOCKT');
    expect(s.points).toBe(0);
    t.noLoss('Kontakt-Dunk-Block');
  });
});

function passFixture(blocked: boolean): Play {
  const options: Option[] = [{ kind: 'shoot' }, { kind: 'drive' }];
  return {
    id: 'kickout', name: 'Nur Pass-Steals', clockS: 30, deficit: 2,
    actors: ['r3', 'r50', 'b1'], start: 'setup',
    segments: {
      setup: { id: 'setup', handler: 'r3', decisionAt: 0, options: [{ kind: 'pass', to: 'r50', next: 'received' }], paths: {
        r3: [{ t: 0, x: -4, z: 5, act: 'dribble' }],
        r50: [{ t: 0, x: 0, z: 5, act: 'stand' }],
        b1: [{ t: 0, x: blocked ? -2 : 0, z: blocked ? 5 : 3.4, act: 'defend' }],
      } },
      received: { id: 'received', handler: 'r50', decisionAt: 0, options, paths: {} },
    },
    variants: [{ id: 'fixed', weight: 1, defPaths: {} }],
  };
}
