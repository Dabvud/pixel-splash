import { afterEach, describe, expect, it } from 'vitest';
import { command, createPlayState, inputOwner, step, type EngineConfig, type EngineEvent } from '../src/play/engine';
import { PLAYS } from '../src/play/plays';
import { HERO_ID, castWithHero, registerHero, unregisterHero } from '../src/career/hero';
import { TEAMS } from '../src/career/league';
import { seededRng } from '../src/career/create';
import { SAMPLE } from './career-state.test';
import type { Position } from '../src/career/state';

const base: EngineConfig = {
  slowmo: .3, decisionS: 2, animSpeed: 1, foulMult: 0, zoneFloor: .7, tempoSpread: 0, glassChance: 0,
  decisionLead: 1, finishArrow: true,
  shot: { meterMs: 700, greenZone: .07, aimDeg: 6, influence: .6 },
  finish: { meterMs: 900, greenZone: .18, aimDeg: 8 },
};
const cfg: EngineConfig = { ...base, controlled: HERO_ID, ratingMeters: true };
const team = TEAMS[0];
afterEach(() => unregisterHero());

function scene(position: Position, playId: keyof typeof PLAYS, seed: number) {
  registerHero({ ...SAMPLE.player, position }, team);
  const rng = seededRng(seed), play = castWithHero(PLAYS[playId], position, rng);
  return { s: createPlayState(play, cfg, rng), rng };
}
function run(s: ReturnType<typeof scene>['s'], rng: () => number, until: () => boolean, max = 60): EngineEvent[] {
  const events: EngineEvent[] = [];
  for (let i = 0; i < max * 240 && !until(); i++) events.push(...step(s, 1 / 240, cfg, rng));
  return events;
}

describe('Nur der eigene Spieler wird gesteuert', () => {
  it('Eingaben für Mitspieler werden ignoriert, für den Helden angenommen', () => {
    const { s, rng } = scene('guard', 'pnr', 1);
    run(s, rng, () => s.phase === 'decision');
    expect(inputOwner(s)).toBe(HERO_ID);
    const pass = s.play.segments[s.play.start].options!.find(o => o.kind === 'pass')!;
    const ev = command(s, { kind: 'pass', to: pass.to!, quality: 1 }, cfg, rng);
    expect(ev.some(e => e.type === 'pass')).toBe(true);
    expect(s.phase).toBe('passing');
    // Mitspieler hat den Ball → Befehle laufen ins Leere
    run(s, rng, () => s.phase !== 'passing');
    if (inputOwner(s) !== HERO_ID && s.phase !== 'ended') {
      expect(command(s, { kind: 'drive', lane: 0 }, cfg, rng)).toEqual([]);
    }
  });
  it('Mitspieler entscheiden und werfen ohne Eingabe; Szene endet immer', () => {
    for (const playId of ['pnr', 'kickout', 'iso', 'horns', 'pickpop', 'floppy'] as const) for (let seed = 1; seed <= 12; seed++) {
      const { s, rng } = scene('guard', playId, seed);
      run(s, rng, () => s.phase === 'decision');
      // Held passt sofort weiter, danach keine Eingaben mehr
      const pass = (s.play.segments[s.play.start].options ?? []).find(o => o.kind === 'pass');
      if (inputOwner(s) === HERO_ID && pass) command(s, { kind: 'pass', to: pass.to!, quality: 1 }, cfg, rng);
      run(s, rng, () => s.phase === 'ended' || (inputOwner(s) === HERO_ID && s.phase === 'decision'));
      if (s.phase !== 'ended') run(s, rng, () => s.phase === 'ended'); // Held wartet: Zeit/KI-Timeout beendet
      expect(s.phase, `${playId}/${seed}`).toBe('ended');
    }
  });
  it('KI-Mitspieler treffen manchmal, aber nicht immer; Assist für den Helden', () => {
    let made = 0, assists = 0, tries = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const { s, rng } = scene('guard', 'pickpop', seed);
      run(s, rng, () => s.phase === 'decision');
      const pass = (s.play.segments[s.play.start].options ?? []).find(o => o.kind === 'pass');
      if (inputOwner(s) !== HERO_ID || !pass) continue;
      command(s, { kind: 'pass', to: pass.to!, quality: 1 }, cfg, rng);
      run(s, rng, () => s.phase === 'ended' || (inputOwner(s) === HERO_ID && s.phase === 'decision'));
      if (s.phase !== 'ended') continue;
      tries++;
      if (s.points > 0) made++;
      assists += s.box[HERO_ID]?.ast ?? 0;
    }
    expect(tries).toBeGreaterThan(20);
    expect(made).toBeGreaterThan(0);
    expect(made).toBeLessThan(tries);
    expect(assists).toBe(made);
  });
  it('ohne controlled bleibt alles wie vorher (keine KI-Würfe, Befehle für jeden Ballführer)', () => {
    const s = createPlayState(PLAYS.pnr, base, () => .5);
    for (let i = 0; i < 4000 && s.phase !== 'decision'; i++) step(s, 1 / 240, base, () => .5);
    expect(inputOwner(s)).toBe(s.handler);
    expect(command(s, { kind: 'drive', lane: 0 }, base, () => .5).length).toBeGreaterThanOrEqual(0);
    expect(s.phase).toBe('driving');
  });
});

describe('Karriere: Pull-up und Zug zum Korb immer möglich', () => {
  it('auch in Spielzügen ohne Wurf-/Zieh-Option im ersten Segment (außer beim Einwurf)', () => {
    let tried = 0;
    for (const playId of ['handoff', 'floppy', 'horns', 'pickpop'] as const) for (let seed = 1; seed <= 4; seed++) {
      const { s, rng } = scene('guard', playId, seed);
      run(s, rng, () => s.phase === 'decision' && inputOwner(s) === HERO_ID, 30);
      // Nach einem Fang läuft das Catch-and-Shoot-Pfeil-Meter (Tippen statt Halten)
      if (s.phase !== 'decision' || s.arrowMeter) continue;
      command(s, { kind: 'comboStart' }, cfg, rng);
      expect(s.phase, playId).toBe('combo');
      tried++;
    }
    expect(tried).toBeGreaterThan(3);
    const { s, rng } = scene('guard', 'floppy', 4);
    run(s, rng, () => s.phase === 'decision' && inputOwner(s) === HERO_ID, 30);
    if (s.phase === 'decision' && !s.arrowMeter) { command(s, { kind: 'drive', lane: 0 }, cfg, rng); expect(s.phase).toBe('driving'); }
  });
});

describe('Trefferquote der KI-Mitspieler (abgestimmte Wertetabelle)', () => {
  it('Basiswerte, Verteidigung, Spielerwert, Schwierigkeit, Grenzen', async () => {
    const { aiHitChance } = await import('../src/play/engine');
    const pct = (v: number) => Math.round(v * 100);
    // Pro, Wert 60: offen / leicht / eng / sehr eng
    expect([.9, .7, .5, .3].map(P => pct(aiHitChance('layup', P, .6, 1)))).toEqual([70, 60, 49, 39]);
    expect([.9, .7, .5, .3].map(P => pct(aiHitChance('jump2', P, .6, 5)))).toEqual([50, 43, 35, 28]);
    expect([.9, .7, .5, .3].map(P => pct(aiHitChance('three', P, .6, 7)))).toEqual([40, 34, 28, 22]);
    expect([.9, .7, .5, .3].map(P => pct(aiHitChance('three', P, .6, 8)))).toEqual([30, 26, 21, 17]);
    expect(pct(aiHitChance('three', .9, .3, 7))).toBe(25);
    expect(pct(aiHitChance('three', .9, .9, 7))).toBe(55);
    expect(pct(aiHitChance('layup', .9, .6, 1, 1.1))).toBe(77);
    expect(pct(aiHitChance('layup', .9, .6, 1, .85))).toBe(60);
    expect(aiHitChance('layup', .9, 1, 1, 1.1)).toBe(.9);
    expect(aiHitChance('three', .1, 0, 9, .85)).toBe(.05);
  });
});
