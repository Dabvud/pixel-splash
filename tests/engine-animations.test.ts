import { describe, expect, it } from 'vitest';
import { command, createPlayState, step, type EngineConfig, type PlayState } from '../src/play/engine';
import type { Play } from '../src/play/types';
import { passTime } from '../src/play/pass';

const cfg: EngineConfig = { slowmo: 1, decisionS: 10, animSpeed: 1, foulMult: 0, zoneFloor: .7, tempoSpread: 0,
  shot: { meterMs: 700, greenZone: .07, aimDeg: 6, influence: .6 },
  finish: { meterMs: 450, greenZone: .1, aimDeg: 8 } };
const safe = () => .99;
function fixture(handler = 'r3', x = 0, z = 4, dx = 6, dz = 6, receiverX = 4): Play {
  return { id: 'fastbreak', name: 'Animation', clockS: 30, deficit: 1, start: 's', actors: [handler, 'r11', 'b1'],
    segments: { s: { id: 's', handler, decisionAt: 0, paths: {
      [handler]: [{ t: 0, x, z, act: 'dribble' }], r11: [{ t: 0, x: receiverX, z, act: 'stand' }],
    }, options: [{ kind: 'shoot' }, { kind: 'drive' }, { kind: 'pass', to: 'r11' }] } },
    variants: [{ id: 'fixed', weight: 1, defPaths: { s: { b1: [{ t: 0, x: dx, z: dz, act: 'defend' }] } } }] };
}
function setup(play = fixture(), rng = safe) {
  const s = createPlayState(play, cfg, rng);
  step(s, .8, cfg, rng); expect(s.phase).toBe('decision'); return s;
}
function until(s: PlayState, phase: PlayState['phase'], rng = safe) {
  for (let i = 0; i < 5000 && s.phase !== phase; i++) step(s, 1 / 240, cfg, rng);
  expect(s.phase).toBe(phase);
}
function release(s: PlayState, rng = safe, made = true) {
  command(s, { kind: 'comboStart' }, cfg, rng);
  command(s, { kind: 'comboRelease', holdMs: made ? s.combo!.meterMs : 0, angleDeg: made ? 0 : 80 }, cfg, rng);
}

describe('Neue Animationen: automatische Auswahl und vollständige Routen', () => {
  it.each([[-1, .1, 'crossover'], [1, .9, 'behind_back'], [0, .1, 'hesitation'], [0, .9, 'spin_move']] as const)(
    'Bahn %s / rng %s wählt %s einmal und kehrt in höchstens 0,5 s zu dribble_run zurück', (lane, roll, expected) => {
      const rng = () => roll, s = setup(fixture(), rng);
      command(s, { kind: 'drive', lane }, cfg, rng);
      expect(s.actors.r3.move).toBe(expected);
      const start = s.actors.r3.pos.x;
      step(s, .2, cfg, rng);
      if (lane) expect(Math.sign(s.actors.r3.pos.x - start)).toBe(lane);
      step(s, .3, cfg, rng); expect(s.actors.r3.move).toBe('dribble_run');
      until(s, 'takeoff', rng); release(s, rng); until(s, 'ended', rng);
    });
  it.each([
    ['Ecke', 5.5, 2, 6, 6, 'reverse_layup'],
    ['Kreuzung', 1.7, 4, 6, 6, 'reverse_layup'],
    ['P unter 0,35', 0, 4, 0, .8, 'layup'],
    ['P = 0,35', 0, 4, 0, .175, 'euro_step'],
    ['P knapp unter 0,7', 0, 4, 0, -.34, 'euro_step'],
    ['P = 0,7', 0, 4, 0, -.35, 'finger_roll'],
    ['offen', 0, 4, 6, 6, 'finger_roll'],
  ] as const)('%s wählt %s/%s/%s/%s → %s und erreicht ended', (label, x, z, dx, dz, expected) => {
    void label;
    const s = setup(fixture('r3', x, z, dx, dz));
    command(s, { kind: 'drive', lane: x === 1.7 ? -1 : 0 }, cfg, safe);
    until(s, 'takeoff'); expect(s.actors.r3.move).toBe(expected);
    release(s); expect(s.actors.r3.move).toBe(expected); until(s, 'ended');
  });
  it('Reverse-Layup trägt den Körper unter den Korb und gibt den Ball rückwärts auf der Gegenseite frei', () => {
    const s = setup(fixture('r3', 5.5, 2));
    command(s, { kind: 'drive', lane: 0 }, cfg, safe); until(s, 'takeoff');
    const from = { ...s.actors.r3.pos };
    release(s); step(s, .7, cfg, safe);
    const a = s.actors.r3;
    expect(a.pos.x * from.x + a.pos.z * from.z).toBeLessThan(0);
    expect(s.ball.y).toBeGreaterThan(2);
    until(s, 'ended');
  });
  it('Bogenpass hat einen höheren Scheitel als der normale Pass', () => {
    const normal = setup(fixture('r3', 0, 4, 6, 6, 9));
    const overhead = setup(fixture('r3', 0, 4, 6, 6, 10));
    command(normal, { kind: 'pass', to: 'r11' }, cfg, safe);
    command(overhead, { kind: 'pass', to: 'r11' }, cfg, safe);
    step(normal, passTime(9) / 2, cfg, safe); step(overhead, passTime(10) / 2, cfg, safe);
    expect(overhead.ball.y).toBeGreaterThan(normal.ball.y + 1);
  });
  it.each([[.1, 'dunk'], [.5, 'tomahawk_dunk'], [.9, 'two_hand_dunk']] as const)(
    'freier Dunk mit rng %s wählt %s und erreicht ended', (roll, expected) => {
      const rng = () => roll, s = setup(fixture('r23'), rng);
      command(s, { kind: 'drive', lane: 0 }, cfg, rng); until(s, 'takeoff', rng);
      expect(s.actors.r23.move).toBe(expected); release(s, rng); expect(s.actors.r23.move).toBe(expected); until(s, 'ended', rng);
    });
  it.each([[0, 5, 0, 4, 'step_back'], [5, 5, 5, 4, 'step_back'], [0, 2, 0, 1, 'fadeaway'],
    [0, 5, 0, 3.5, 'jumpshot']] as const)(
    'Wurf (%s,%s), Verteidiger (%s,%s) → %s und ended', (x, z, dx, dz, expected) => {
      const s = setup(fixture('r3', x, z, dx, dz)); release(s);
      expect(s.actors.r3.move).toBe(expected); until(s, 'ended');
    });
  it('Kontakt-Dunk-Treffer zeigt block_jump_hit, Luftkontakt und Abräumen vor knocked_down', () => {
    const rng = () => .1, s = setup(fixture('r23', 0, 4, 0, .8), rng);
    command(s, { kind: 'drive', lane: 0 }, cfg, rng); until(s, 'takeoff', rng); release(s, rng);
    expect(s.actors.b1.move).toBe('block_jump_hit');
    step(s, .49, cfg, rng); expect(s.actors.b1.y).toBeGreaterThan(0);
    expect(Math.hypot(s.actors.b1.pos.x - s.actors.r23.pos.x, s.actors.b1.pos.z - s.actors.r23.pos.z)).toBeLessThan(.65);
    step(s, .32, cfg, rng); expect(s.actors.b1.move).toBe('knocked_down');
    expect(s.actors.b1.pos.z).toBeLessThan(.8);
    until(s, 'ended', rng); expect(s.actors.b1.move).toBe('knocked_down'); expect(s.points).toBe(2);
  });
  it.each([1, 3])('celebrate nach Treffer bei Rückstand %s, Mitspieler laufen binnen 1 s zum Schützen', deficit => {
    const play = fixture('r3', 0, 7); play.deficit = deficit;
    const s = setup(play); release(s); until(s, 'ended');
    expect(s.verdict).toBe(deficit === 1 ? 'GAMEWINNER' : 'OVERTIME'); expect(s.actors.r3.move).toBe('celebrate');
    const before = Math.hypot(s.actors.r11.pos.x - s.actors.r3.pos.x, s.actors.r11.pos.z - s.actors.r3.pos.z);
    const { clock, gameT, realTime } = s;
    step(s, 1, cfg, safe);
    expect(s.clock).toBe(clock); expect(s.gameT).toBe(gameT); expect(s.realTime).toBeCloseTo(realTime + 1);
    expect(Math.hypot(s.actors.r11.pos.x - s.actors.r3.pos.x, s.actors.r11.pos.z - s.actors.r3.pos.z)).toBeLessThan(Math.min(before, 1.3));
    expect(s.phase).toBe('ended');
  });
  it.each(['step_back', 'fadeaway'] as const)('%s hält den Ball bis zur gestreckten Wurfhand', expected => {
    const near = expected === 'fadeaway', s = setup(fixture('r3', 0, near ? 2 : 5, 0, near ? 1 : 4));
    release(s); step(s, .49, cfg, safe);
    expect(s.actors.r3.move).toBe(expected);
    expect(s.ball.y).toBeGreaterThan(2);
    until(s, 'ended');
  });
  it.each(['Fehlwurf', 'Steal', 'Zeitablauf'])('dejected nach %s und ended', route => {
    const s = setup(fixture('r3', 0, 4, 2, 4));
    if (route === 'Steal') command(s, { kind: 'pass', to: 'r11' }, cfg, () => 0);
    else if (route === 'Fehlwurf') release(s, safe, false);
    else s.clock = .001;
    until(s, 'ended'); expect(s.actors.r3.move).toBe('dejected');
  });
  it.each([[4, 2, 4, 'pass_bounce'], [10, 6, 6, 'pass_overhead'], [6, 3, 4, 'pass'],
    [9, 6, 6, 'pass'], [4, 2, 5.5, 'pass']] as const)(
    'Passdistanz %s / Verteidiger (%s,%s) → %s mit Ballbahn und ended', (dist, dx, dz, expected) => {
      const s = setup(fixture('r3', 0, 4, dx, dz, dist));
      command(s, { kind: 'pass', to: 'r11' }, cfg, safe); expect(s.actors.r3.move).toBe(expected);
      step(s, passTime(dist) / 2, cfg, safe);
      if (expected === 'pass_bounce') expect(s.ball.y).toBeCloseTo(.12, 6);
      if (expected === 'pass_overhead') expect(s.ball.y).toBeGreaterThan(2.5);
      until(s, 'decision');
      if (s.arrowMeter) command(s, { kind: 'tap' }, cfg, safe); else release(s);
      until(s, 'ended');
    });
});
