import { describe, expect, it } from 'vitest';
import { command, createPlayState, step, type EngineConfig, type EngineEvent, type PlayState } from '../src/play/engine';
import type { Play } from '../src/play/types';

const cfg: EngineConfig = {
  finishArrow: true, foulScene: true, slowmo: .3, decisionS: 2, animSpeed: 1, foulMult: 0, zoneFloor: .7, tempoSpread: 0,
  shot: { meterMs: 700, greenZone: .07, aimDeg: 6, influence: .6 },
  finish: { meterMs: 900, greenZone: .18, aimDeg: 8 },
};
const rng = () => .1;
type Kind = 'layup' | 'dunk' | 'contact_dunk';

function fixture(kind: Kind, lob: boolean, defenderX = kind === 'contact_dunk' ? 0 : 6): Play {
  const finisher = kind === 'layup' ? 'r3' : 'r23';
  return {
    id: 'fastbreak', name: 'Testszenario', clockS: 30, deficit: 2, start: 'setup', actors: [finisher, 'r11', 'b1'],
    segments: { setup: { id: 'setup', handler: lob ? 'r11' : finisher, decisionAt: 0,
      paths: { [finisher]: [{ t: 0, x: 0, z: lob ? 1.2 : 3, act: 'dribble' }],
        r11: [{ t: 0, x: 4, z: 5, act: 'stand' }] },
      options: lob ? [{ kind: 'pass', to: finisher, lob: true }] : [{ kind: 'drive' }, { kind: 'shoot' }] } },
    variants: [{ id: 'fixed', weight: 1, defPaths: { setup: {
      b1: [{ t: 0, x: defenderX, z: 1.2, act: 'defend' }],
    } } }],
  };
}

function ready(kind: Kind, lob: boolean, c: EngineConfig, defenderX?: number): PlayState {
  const s = createPlayState(fixture(kind, lob, defenderX), c, rng);
  step(s, .8, c, rng);
  expect(s.phase).toBe('decision');
  command(s, lob ? { kind: 'pass', to: kind === 'layup' ? 'r3' : 'r23' } : { kind: 'drive', lane: 0 }, c, rng);
  for (let i = 0; i < 1000 && (!s.combo || (c.finishArrow && !s.arrowMeter)); i++) step(s, 1 / 240, c, rng);
  expect(s.phase).toBe('takeoff');
  expect(s.combo).not.toBeNull();
  return s;
}

function release(s: PlayState, c: EngineConfig): EngineEvent[] {
  if (s.arrowMeter) {
    const m = s.arrowMeter;
    const events = step(s, Math.max(0, m.startTime + m.meterMs / 1000 - s.realTime), c, rng);
    return [...events, ...command(s, { kind: 'tap' }, c, rng)];
  }
  command(s, { kind: 'comboStart' }, c, rng);
  return command(s, { kind: 'comboRelease', holdMs: s.combo!.meterMs, angleDeg: 0 }, c, rng);
}

function end(s: PlayState, c: EngineConfig): EngineEvent[] {
  const events: EngineEvent[] = [];
  for (let i = 0; i < 3000 && s.phase !== 'ended'; i++) {
    if (s.phase === 'freethrows') {
      command(s, { kind: 'comboStart' }, c, rng);
      if (s.combo) {
        expect(s.combo.fouled).toBe(false);
        events.push(...command(s, { kind: 'comboRelease', holdMs: s.combo.meterMs, angleDeg: 0 }, c, rng));
      }
    }
    events.push(...step(s, 1 / 120, c, rng));
  }
  expect(s.phase).toBe('ended');
  return events;
}

describe('Engine: Test-Szenarien', () => {
  describe.each([false, true])('Alley-oop = %s', lob => {
    it.each(['layup', 'dunk', 'contact_dunk'] as const)('%s wird mit Override 1 immer und mit 0 nie gefoult und erreicht ended', kind => {
      for (const finishFoulOverride of [0, 1]) {
        const c = { ...cfg, finishFoulOverride, foulMult: finishFoulOverride ? 0 : 100 };
        const s = ready(kind, lob, c);
        expect(s.combo!.kind).toBe(kind);
        expect(s.combo!.fouled).toBe(finishFoulOverride === 1);
        const events = [...release(s, c), ...end(s, c)];
        expect(events.some(e => e.type === 'foul')).toBe(finishFoulOverride === 1);
      }
    });

    it.each([[0, 'contact_dunk'], [2.5, 'contact_dunk'], [2.51, 'dunk'], [6, 'dunk']] as const)(
      'erzwingt bei Verteidigerabstand x=%s auch ohne hohe Athletik %s und erreicht ended', (x, kind) => {
        const c = { ...cfg, forcePoster: true };
        const s = ready('layup', lob, c, x);
        expect(s.combo!.kind).toBe(kind);
        release(s, c); end(s, c);
      });

    it('liefert mit beiden Testwerten und Treffer ein And-one und erreicht ended', () => {
      const c = { ...cfg, finishFoulOverride: 1, forcePoster: true };
      const s = ready('layup', lob, c, 0);
      expect(s.combo).toMatchObject({ kind: 'contact_dunk', fouled: true });
      const events = [...release(s, c), ...end(s, c)];
      expect(events).toContainEqual({ type: 'foul', andOne: true });
      expect(events.some(e => e.type === 'result' && e.made && e.banner.includes('POSTER!'))).toBe(true);
    });
  });

  it.each([3, 7])('lässt Sprungwürfe bei z=%s samt Foul-Chance unverändert und erreicht ended', z => {
    for (const foulMult of [0, 100]) {
      for (const finishFoulOverride of [0, 1]) {
        const c = { ...cfg, foulMult, finishFoulOverride, forcePoster: true };
        const play = fixture('layup', false);
        play.segments.setup.paths.r3[0].z = z;
        const s = createPlayState(play, c, rng);
        step(s, .8, c, rng);
        command(s, { kind: 'comboStart' }, c, rng);
        expect(s.combo!.kind).toBe(z === 7 ? 'three' : 'jump2');
        expect(s.combo!.fouled).toBe(foulMult > 0);
        release(s, c); end(s, c);
      }
    }
  });

  it('behält mit Override -1 und forcePoster false das normale Verhalten', () => {
    const normal = ready('layup', false, cfg, 0);
    const explicit = ready('layup', false, { ...cfg, finishFoulOverride: -1, forcePoster: false }, 0);
    expect(explicit.combo).toEqual(normal.combo);
    release(normal, cfg); end(normal, cfg);
    release(explicit, cfg); end(explicit, cfg);
  });

  it('unterstützt die Abschluss-Kombi ohne Pfeil und erreicht ended', () => {
    const c = { ...cfg, finishArrow: false, finishFoulOverride: 1, forcePoster: true };
    const s = ready('layup', false, c, 0);
    expect(s.combo).toMatchObject({ kind: 'contact_dunk', fouled: true });
    expect([...release(s, c), ...end(s, c)]).toContainEqual({ type: 'foul', andOne: true });
  });
});
