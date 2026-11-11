import { afterEach, describe, expect, it } from 'vitest';
import { command, createPlayState, isControlled, step, type EngineConfig, type EngineEvent, type Perks, type PlayState } from '../src/play/engine';
import { PLAYS } from '../src/play/plays';
import { HERO_ID, castWithHero, registerHero, unregisterHero } from '../src/career/hero';
import { TEAMS } from '../src/career/league';
import { seededRng } from '../src/career/create';
import { SAMPLE } from './career-state.test';
import type { Position } from '../src/career/state';
import type { PlayId } from '../src/play/types';

const base: EngineConfig = {
  slowmo: .3, decisionS: 2, animSpeed: 1, foulMult: 1, zoneFloor: .7, tempoSpread: 0, glassChance: 0, blockFoulChance: 0,
  decisionLead: 1, finishArrow: true, controlled: HERO_ID, ratingMeters: true,
  shot: { meterMs: 700, greenZone: .07, aimDeg: 6, influence: .6 },
  finish: { meterMs: 900, greenZone: .18, aimDeg: 8 },
};
afterEach(() => unregisterHero());

function scene(perks: Perks & { onFire?: boolean }, seed: number, playId: PlayId = 'pnr', position: Position = 'guard', dunk = .5) {
  registerHero({ ...SAMPLE.player, position, ratings: { ...SAMPLE.player.ratings, dunk, athleticism: Math.max(dunk, .5) } }, TEAMS[0]);
  const cfg = { ...base, perks }, rng = seededRng(seed);
  const s = createPlayState(castWithHero(PLAYS[playId], position, rng), cfg, rng);
  for (let i = 0; i < 4000 && !(s.phase === 'decision' && s.handler === HERO_ID); i++) step(s, 1 / 240, cfg, rng);
  return { s, cfg, rng };
}
function run(s: PlayState, cfg: EngineConfig, rng: () => number, until: () => boolean, max = 30): EngineEvent[] {
  const ev: EngineEvent[] = [];
  for (let i = 0; i < max * 240 && !until(); i++) ev.push(...step(s, 1 / 240, cfg, rng));
  return ev;
}

describe('Spezialisierungs-Perks (nur eigener Spieler)', () => {
  it('Playmaking 1: weniger Steals bei eigenen Pässen', () => {
    let plain = 0, safe = 0;
    for (let seed = 1; seed <= 150; seed++) for (const [perks, add] of [[{}, (n: number) => { plain += n; }], [{ passSteal: .6 }, (n: number) => { safe += n; }]] as const) {
      const { s, cfg, rng } = scene(perks, seed);
      if (s.handler !== HERO_ID) continue;
      const pass = (s.play.segments[s.play.start].options ?? []).find(o => o.kind === 'pass');
      if (!pass) continue;
      const ev = command(s, { kind: 'pass', to: pass.to!, quality: .2 }, cfg, rng);
      add(ev.filter(e => e.type === 'pass' && e.steal).length);
    }
    expect(plain).toBeGreaterThan(0);
    expect(safe).toBeLessThan(plain);
  });
  it('Werfen 1+2: größere grüne Zone beim Dreier, Deep Range ohne Entfernungsabzug', () => {
    const zone = (perks: Perks) => {
      const { s, cfg, rng } = scene(perks, 3, 'iso');
      s.actors[HERO_ID].pos = { x: 0, z: 9 }; // weiter Dreier
      command(s, { kind: 'comboStart' }, cfg, rng);
      return s.combo?.kind === 'three' ? s.combo.zones.g : NaN;
    };
    const plain = zone({}), wide = zone({ threeGreen: 1.3 }), deep = zone({ threeGreen: 1.3, deepRange: true });
    expect(wide).toBeCloseTo(plain * 1.3, 6);
    expect(deep).toBeGreaterThan(wide);
  });
  it('Korbabschluss 1: Abschluss-Meter 15 % länger', () => {
    const meter = (perks: Perks) => {
      const { s, cfg, rng } = scene(perks, 5, 'iso');
      command(s, { kind: 'drive', lane: 0 }, cfg, rng);
      run(s, cfg, rng, () => s.arrowMeter !== null);
      return s.arrowMeter?.meterMs ?? NaN;
    };
    expect(meter({ finishMeter: 1.15 })).toBeCloseTo(meter({}) * 1.15, 6);
  });
  it('Korbabschluss 2: mehr Kontakt-Dunks und mehr Fouls beim Abschluss', () => {
    const count = (perks: Perks) => {
      let contact = 0, fouled = 0;
      for (let seed = 1; seed <= 150; seed++) {
        const { s, cfg, rng } = scene(perks, seed, 'iso', 'guard', .75);
        const ev = command(s, { kind: 'drive', lane: 0 }, cfg, rng);
        ev.push(...run(s, cfg, rng, () => s.combo !== null || s.phase === 'ended'));
        if (ev.some(e => e.type === 'takeoff' && e.kind === 'contact_dunk')) contact++;
        if (s.combo?.fouled) fouled++;
      }
      return { contact, fouled };
    };
    const plain = count({}), boost = count({ contactBoost: 1.5 });
    expect(boost.contact).toBeGreaterThan(plain.contact);
    expect(boost.fouled).toBeGreaterThan(plain.fouled);
  });
  it('Korbabschluss 3: Ankle Breaker beim Ziehen (manchmal), verfehlter Kontakt-Dunk ohne Block', () => {
    let ankles = 0;
    for (let seed = 1; seed <= 80; seed++) {
      const { s, cfg, rng } = scene({ posterizer: true }, seed, 'iso', 'guard', .95);
      const ev = command(s, { kind: 'drive', lane: 0 }, cfg, rng);
      if (ev.some(e => e.type === 'ankle')) {
        ankles++;
        expect(s.poster).toMatchObject({ kind: 'ankle' });
        expect(s.actors[s.poster!.victim].move).toBe('knocked_down');
      }
      // ohne Eingabe läuft das Meter aus → Fehlversuch; bei Kontakt-Dunk darf es keinen Block geben
      run(s, cfg, rng, () => s.phase === 'ended');
      if (s.poster?.kind === 'block') throw new Error('Posterizer darf nicht geblockt werden');
    }
    expect(ankles).toBeGreaterThan(3);
    expect(ankles).toBeLessThan(35);
  });
  it('Werfen 3: Green Light – brennend geht ein grüner, aber verzogener Wurf rein', () => {
    const shoot = (perks: Perks & { onFire?: boolean }) => {
      const { s, cfg, rng } = scene(perks, 7, 'iso');
      command(s, { kind: 'comboStart' }, cfg, rng);
      command(s, { kind: 'comboRelease', holdMs: s.combo!.meterMs, angleDeg: 40 }, cfg, rng);
      run(s, cfg, rng, () => s.phase === 'ended' || s.phase === 'freethrows');
      return s.points > 0;
    };
    expect(shoot({})).toBe(false);
    expect(shoot({ greenLight: true })).toBe(false); // ohne Feuer kein Effekt
    expect(shoot({ greenLight: true, onFire: true })).toBe(true);
  });
  it('Playmaking 3: Floor General – nach eigenem Pass steuerst du den Fänger', () => {
    for (const fg of [false, true]) {
      const { s, cfg, rng } = scene(fg ? { floorGeneral: true } : {}, 2, 'pickpop');
      const pass = (s.play.segments[s.play.start].options ?? []).find(o => o.kind === 'pass')!;
      command(s, { kind: 'pass', to: pass.to!, quality: 1 }, cfg, rng);
      run(s, cfg, rng, () => s.phase !== 'passing');
      if (s.phase === 'ended') continue;
      expect(isControlled(s)).toBe(fg);
    }
  });
  it('ohne perks bleibt der Spielzug identisch', () => {
    const a = scene({}, 9).s, b = scene({}, 9).s;
    expect(a.actors).toEqual(b.actors);
  });
});
