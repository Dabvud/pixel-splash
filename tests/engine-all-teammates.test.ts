import { describe, expect, it } from 'vitest';
import { aiChoice, command, createPlayState, step } from '../src/play/engine';
import type { EngineConfig, EngineEvent, PlayState } from '../src/play/engine';
import { PLAYS } from '../src/play/plays';
import { ACTORS } from '../src/play/teams';
import type { Option, Play } from '../src/play/types';

const cfg: EngineConfig = {
  slowmo: .3, decisionLead: 2.5, decisionS: 4, animSpeed: 1, foulMult: 0, zoneFloor: .7, tempoSpread: 0,
  passDelayMax: .6, closeoutRandom: 0,
  shot: { meterMs: 700, greenZone: .07, aimDeg: 6, influence: .6 },
  finish: { meterMs: 450, greenZone: .1, aimDeg: 8 },
};
const safe = () => .99;
const teammates = (s: PlayState) => Object.values(s.actors)
  .filter(a => ACTORS[a.id].team === 'off' && a.id !== s.handler).map(a => a.id);
function until(s: PlayState, ready: () => boolean, c = cfg): EngineEvent[] {
  const events: EngineEvent[] = [];
  for (let i = 0; i < 4000 && !ready() && s.phase !== 'ended'; i++) events.push(...step(s, 1 / 120, c, safe));
  expect(ready()).toBe(true);
  return events;
}
function optionsIn(events: EngineEvent[]): Option[] {
  const event = events.filter(e => e.type === 'decision').at(-1);
  expect(event).toBeDefined();
  return event!.options;
}
function expectOptions(s: PlayState, events: EngineEvent[], base: Option[]): void {
  const options = optionsIn(events);
  expect(options).toEqual([...base, ...teammates(s)
    .filter(id => !base.some(o => o.kind === 'pass' && o.to === id)).map(to => ({ kind: 'pass', to }))]);
  expect(options.filter(o => o.kind === 'pass').map(o => o.to).sort()).toEqual(teammates(s).sort());
}
function setup(play: Play, c = cfg): { s: PlayState; events: EngineEvent[] } {
  const s = createPlayState(play, c, safe);
  return { s, events: until(s, () => s.phase === 'decision', c) };
}
function pass(s: PlayState, to: string, quality = 1, c = cfg): EngineEvent[] {
  const from = s.handler;
  const events = command(s, { kind: 'pass', to, quality }, c, safe);
  expect(events).toContainEqual({ type: 'pass', from, to, steal: false });
  events.push(...until(s, () => s.handler === to && s.phase === 'decision', c));
  return events;
}
const variants = Object.values(PLAYS).flatMap(play => play.variants.map(variant => ({
  title: `${play.id}/${variant.id}`, play: { ...play, variants: [{ ...variant, weight: 1 }] },
})));
// Ein Lob führt direkt zum Abschluss und hat selbst keine Folgeentscheidung.
const decisions = variants.flatMap(({ title, play }) => Object.values(play.segments)
  .filter(segment => segment.id === play.start || play.segments[play.start].options!
    .some(o => o.next === segment.id && !o.lob))
  .map(segment => ({ title: `${title}/${segment.id}`, play, segment })));

describe('Alle Mitspieler anspielbar', () => {
  it.each(decisions)('$title: bietet an jedem Entscheidungspunkt alle Mitspieler genau einmal an', ({ play, segment }) => {
    const { s, events } = setup(play);
    if (segment.id !== play.start) {
      const option = play.segments[play.start].options!.find(o => o.next === segment.id)!;
      events.push(...pass(s, option.to!));
    }
    expectOptions(s, events, segment.options!);
    const extra = teammates(s).find(id => !segment.options!.some(o => o.kind === 'pass' && o.to === id));
    if (!extra) return; // Beim Fast Break sind anfangs bereits alle beiden Mitspieler vorgesehen.
    const caught = pass(s, extra);
    expect(s.handler).toBe(extra);
    expectOptions(s, caught, [{ kind: 'shoot' }, { kind: 'drive' }]);
    expect(s.arrowMeter?.kind).toBe('catchshoot');
  });

  it.each(variants)('$title: beendet drei Pässe in Folge per Wurf bei weiterlaufender Uhr', ({ play }) => {
    const { s } = setup({ ...play, clockS: 30 });
    const first = s.handler;
    const extra = teammates(s).find(id => !play.segments[play.start].options!.some(o => o.to === id)) ?? teammates(s)[0];
    pass(s, extra);
    for (const to of [first, extra]) {
      const clock = s.clock, gameT = s.gameT;
      expectOptions(s, pass(s, to), [{ kind: 'shoot' }, { kind: 'drive' }]);
      expect(s.clock).toBeLessThan(clock);
      expect(clock - s.clock).toBeCloseTo(s.gameT - gameT, 9);
    }
    command(s, { kind: 'tap' }, cfg, safe);
    expect(s.phase).toBe('ballflight');
    const events = until(s, () => s.phase === 'ended');
    expect(events.some(e => e.type === 'result')).toBe(true);
    expect(s.banner).not.toBe('ZEIT ABGELAUFEN');
    expect(s.clock).toBeLessThan(30);
  });

  it.each(['passing', 'receiving', 'decision'] as const)('beendet eine Passkette bei Uhrablauf während %s', phase => {
    const { s } = setup(PLAYS.pnr);
    pass(s, 'r23');
    command(s, { kind: 'pass', to: 'r3', quality: phase === 'receiving' ? 0 : 1 }, cfg, safe);
    if (phase !== 'passing') until(s, () => s.phase === phase);
    expect(s.phase).toBe(phase);
    s.clock = .01;
    step(s, .1, cfg, safe);
    expect(s.phase).toBe('ended');
    expect(s.clock).toBe(0);
    expect(s.banner).toBe('ZEIT ABGELAUFEN');
    expect(s.arrowMeter).toBeNull();
  });

  it('bietet beim Einwurf auch den zusätzlichen Empfänger an und startet die Uhr erst beim Fangen', () => {
    const { s, events } = setup(PLAYS.inbound);
    expectOptions(s, events, PLAYS.inbound.segments.setup.options!);
    expect(s.clock).toBe(3);
    command(s, { kind: 'pass', to: 'r32' }, cfg, safe);
    step(s, .1, cfg, safe);
    expect(s.phase).toBe('passing');
    expect(s.clock).toBe(3);
    until(s, () => s.handler === 'r32' && s.phase === 'decision');
    step(s, .1, cfg, safe);
    expect(s.clock).toBeLessThan(3);
  });

  it('berücksichtigt den zusätzlichen Pass bei der KI-Wahl und spielt ihn mit q = 0,5', () => {
    const p = fixture(), { s } = setup(p);
    s.actors.b1.pos = { x: 4, z: 4.5 };
    expect(aiChoice(s)).toEqual({ kind: 'pass', to: 'r11' });
    const events = step(s, cfg.decisionS, cfg, safe);
    expect(events).toContainEqual({ type: 'pass', from: 'r3', to: 'r11', steal: false });
    events.push(...until(s, () => s.handler === 'r11'));
    expect(events).toContainEqual({ type: 'pocket', quality: .5 });
  });

  it.each([[0, true], [.5, false], [1, false]] as const)('nutzt für zusätzliche Pässe bei q=%s dieselbe Steal-Regel', (quality, steal) => {
    const { s } = setup(fixture());
    s.actors.b1.pos = { x: 0, z: 5 };
    expect(command(s, { kind: 'pass', to: 'r11', quality }, cfg, () => .59))
      .toContainEqual({ type: 'pass', from: 'r3', to: 'r11', steal });
  });

  it('verzögert einen ungenauen zusätzlichen Pass, lässt den Verteidiger aufschließen und startet danach den Pfeil', () => {
    const { s } = setup(fixture());
    s.actors.b1.pos = { x: 4, z: 3.4 };
    command(s, { kind: 'pass', to: 'r11', quality: 0 }, cfg, safe);
    until(s, () => s.handler === 'r11');
    expect(s.phase).toBe('receiving');
    expect(s.arrowMeter).toBeNull();
    const z = s.actors.b1.pos.z;
    for (const cmd of [{ kind: 'pass', to: 'r3' }, { kind: 'drive', lane: 0 }, { kind: 'comboStart' }] as const)
      expect(command(s, cmd, cfg, safe)).toEqual([]);
    step(s, .3, cfg, safe);
    expect(s.actors.b1.pos.z).toBeGreaterThan(z);
    expectOptions(s, until(s, () => s.phase === 'decision'), [{ kind: 'shoot' }, { kind: 'drive' }]);
    expect(s.arrowMeter?.kind).toBe('catchshoot');
    expect(command(s, { kind: 'drive', lane: 0 }, cfg, safe)).toContainEqual({ type: 'arrowEnd' });
    expect(s.phase).toBe('driving');
  });

  it('führt begonnene Wege samt Variantenwegen nach zusätzlichen Pässen ohne Zurückspringen zu Ende', () => {
    const p = fixture(), c = { ...cfg, decisionS: 100 };
    p.segments.setup.paths.r50.push({ t: 10, x: 2, z: 5, act: 'run' });
    p.variants[0].defPaths.setup = { b7: [
      { t: 0, x: 7, z: 12, act: 'defend' }, { t: 10, x: 5, z: 10, act: 'defend' },
    ] };
    const { s } = setup(p, c);
    for (const to of ['r11', 'r3', 'r11']) {
      pass(s, to, 1, c);
      step(s, .2, c, safe);
      expect(s.actors.r50.pos.x).toBeCloseTo(s.gameT * .2, 8);
      expect(s.actors.b7.pos.x).toBeCloseTo(7 - s.gameT * .2, 8);
      expect(s.actors.b7.pos.z).toBeCloseTo(12 - s.gameT * .2, 8);
    }
    step(s, 40, c, safe);
    expect(s.phase).toBe('decision');
    expect(s.actors.r50.pos).toEqual({ x: 2, z: 5 });
    expect(s.actors.b7.pos).toEqual({ x: 5, z: 10 });
  });

  it('lässt Akteure ohne Weg nach einem zusätzlichen Pass an ihrer aktuellen Position', () => {
    const p = fixture();
    delete p.segments.setup.paths.r50;
    const { s } = setup(p);
    s.actors.r50.pos = { x: 2, z: 8 };
    pass(s, 'r11');
    step(s, .2, cfg, safe);
    expect(s.actors.r50.pos).toEqual({ x: 2, z: 8 });
  });

  it('berechnet auch nach einem zusätzlichen Pass den nächsten Fangpunkt aus dem weiterlaufenden Weg', () => {
    const p = fixture();
    p.segments.setup.paths.r50.push({ t: 10, x: 2, z: 5, act: 'run' });
    const { s } = setup(p);
    pass(s, 'r11');
    const before = s.actors.r50.pos.x;
    pass(s, 'r50');
    expect(s.actors.r50.pos.x).toBeGreaterThan(before);
    expect(s.actors.r50.pos.x).toBeCloseTo(s.gameT * .2, 8);
  });

  it('behält nach einem vorgesehenen Folge-Segment dessen Positionsversatz beim Weiterpassen bei', () => {
    const p = fixture();
    p.segments.setup.options!.push({ kind: 'pass', to: 'r50', next: 'follow' });
    p.segments.follow = { id: 'follow', handler: 'r50', decisionAt: 0, paths: {
      r3: [{ t: 0, x: 20, z: 5, act: 'run' }, { t: 10, x: 22, z: 5, act: 'run' }],
    }, options: [{ kind: 'shoot' }, { kind: 'drive' }] };
    const { s } = setup(p);
    command(s, { kind: 'pass', to: 'r50', quality: 1 }, cfg, safe);
    // 4 m Passweg: exakt beim Fang prüfen, bevor der Rest eines Frames schon
    // die Fortsetzung bewegt (0,25 + 0,06 × 4 = 0,49 Spielsekunden).
    step(s, .49 / cfg.animSpeed, cfg, safe);
    expect(s.handler).toBe('r50');
    expect(s.phase).toBe('decision');
    expect(s.actors.r3.pos.x).toBe(-4);
    const start = s.gameT;
    pass(s, 'r11');
    step(s, .2, cfg, safe);
    expect(s.actors.r3.pos.x).toBeCloseTo(-4 + (s.gameT - start) * .2, 8);
  });

  it('erlaubt weder Selbstpässe noch Pässe zu Verteidigern oder nicht beteiligten Akteuren', () => {
    const { s } = setup(fixture());
    for (const to of ['r3', 'b1', 'r23']) expect(command(s, { kind: 'pass', to }, cfg, safe)).toEqual([]);
    expect(s.phase).toBe('decision');
  });
});

function fixture(): Play {
  return {
    id: 'pnr', name: 'Zusätzliche Pässe', clockS: 30, deficit: 2,
    actors: ['r3', 'r50', 'r11', 'b1', 'b7'], start: 'setup',
    segments: { setup: { id: 'setup', handler: 'r3', decisionAt: .2, paths: {
      r3: [{ t: 0, x: -4, z: 5, act: 'dribble' }],
      r50: [{ t: 0, x: 0, z: 5, act: 'run' }],
      r11: [{ t: 0, x: 4, z: 5, act: 'stand' }],
      b1: [{ t: 0, x: 7, z: 12, act: 'defend' }],
      b7: [{ t: 0, x: 7, z: 12, act: 'defend' }],
    }, options: [{ kind: 'shoot' }, { kind: 'drive' }] } },
    variants: [{ id: 'fixed', weight: 1, defPaths: {} }],
  };
}
