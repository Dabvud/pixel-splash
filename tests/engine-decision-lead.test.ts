import { describe, expect, it } from 'vitest';
import { command, createPlayState, step, type EngineConfig } from '../src/play/engine';
import { PLAYS } from '../src/play/plays';
import type { Option } from '../src/play/types';
import { playRoutes } from './play-routes';

const base: EngineConfig = {
  slowmo: 0.3, decisionS: 2, animSpeed: 1, foulMult: 0, zoneFloor: 0.7, tempoSpread: 0,
  shot: { meterMs: 700, greenZone: 0.07, aimDeg: 6, influence: 0.6 },
  finish: { meterMs: 450, greenZone: 0.1, aimDeg: 8 },
};
const rng = () => 0.5;

function untilDecision(cfg: EngineConfig) {
  const s = createPlayState(PLAYS.pnr, cfg, rng);
  for (let i = 0; i < 2000 && s.phase !== 'decision'; i++) step(s, 1 / 120, cfg, rng);
  return s;
}

describe('Entscheiden im Laufen', () => {
  it('öffnet das Entscheidungsfenster 2,5 Spielsekunden vor dem Wegende, während alle noch laufen', () => {
    const late = untilDecision(base);
    const early = untilDecision({ ...base, decisionLead: 2.5 });
    expect(late.gameT - early.gameT).toBeCloseTo(2.5, 1);
    const before = { ...early.actors[early.handler].pos };
    for (let i = 0; i < 60; i++) step(early, 1 / 60, { ...base, decisionLead: 2.5 }, rng);
    expect(early.phase).toBe('decision');
    const after = early.actors[early.handler].pos;
    expect(Math.hypot(after.x - before.x, after.z - before.z)).toBeGreaterThanOrEqual(.59);
  });

  it('trifft die KI-Wahl erst am Wegende, nicht mitten im Lauf', () => {
    const cfg = { ...base, decisionLead: 2.5, decisionS: 2.5 };
    const s = untilDecision(cfg);
    for (let i = 0; i < 90; i++) step(s, 1 / 60, cfg, rng); // 1,5 s Echtzeit = 0,45 Spielsekunden
    expect(s.phase).toBe('decision');
    const end = s.play.segments[s.play.start].decisionAt!;
    step(s, (end - s.gameT - .02) / cfg.slowmo, cfg, rng);
    expect(s.phase).toBe('decision');
    const events = step(s, .04 / cfg.slowmo, cfg, rng);
    expect(events.some(e => e.type === 'decision' && e.options.length === 1)).toBe(true);
  });
});

const routes = Object.values(PLAYS).flatMap(play => play.variants.flatMap(variant =>
  playRoutes(play).map(route => ({ title: `${play.id}/${variant.id}/${route.map(o => o.to ?? o.kind).join('/')}`,
    play: { ...play, variants: [{ ...variant, weight: 1 }] }, route }))));

describe.each(routes)('Bewegte Engine-Route $title', ({ play, route }) => {
  it.each([0, 1])('läuft nach dem Catch-and-Shoot-Pfeil bei Passgenauigkeit %s mindestens 1,5 Spielsekunden weiter und erreicht ended', quality => {
    const cfg = { ...base, decisionLead: 2.5, finishArrow: true }, safe = () => .99;
    const s = createPlayState(play, cfg, safe);
    let index = 0, afterArrow: number | undefined;
    for (let i = 0; i < 7200 && s.phase !== 'ended'; i++) {
      if (s.phase === 'decision' && !s.arrowMeter) {
        const option: Option = route[index] ?? { kind: 'shoot' };
        if (index === 1 && route[0].kind === 'pass' && !route[0].lob) {
          afterArrow ??= s.gameT;
          if (s.gameT - afterArrow < 1.5 - 1e-8) {
            const before = { ...s.actors[s.handler].pos };
            step(s, 1 / 120, cfg, safe);
            const after = s.actors[s.handler].pos;
            expect(Math.hypot(after.x - before.x, after.z - before.z)).toBeGreaterThan(.004);
            expect(s.phase).toBe('decision');
            continue;
          }
        }
        index++;
        command(s, option.kind === 'pass' ? { kind: 'pass', to: option.to!, quality }
          : option.kind === 'drive' ? { kind: 'drive', lane: 0 } : { kind: 'comboStart' }, cfg, safe);
      }
      if (s.phase === 'takeoff' && s.arrowMeter) command(s, { kind: 'tap' }, cfg, safe);
      else if (s.phase === 'takeoff' || s.phase === 'freethrows') command(s, { kind: 'comboStart' }, cfg, safe);
      if (s.phase === 'combo') command(s, { kind: 'comboRelease', holdMs: s.combo!.meterMs, angleDeg: 0 }, cfg, safe);
      step(s, 1 / 120, cfg, safe);
    }
    expect(index).toBe(route.length);
    expect(s.phase).toBe('ended');
  });
});
