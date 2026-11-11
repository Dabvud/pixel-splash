import { afterEach, describe, expect, it, vi } from 'vitest';
import { HERO_ID, castWithHero, dressTeams, playsForHero, registerHero, unregisterHero } from '../src/career/hero';
import { TEAMS } from '../src/career/league';
import { SAMPLE } from './career-state.test';
import { PLAYS } from '../src/play/plays';
import { ACTORS, BLUE, RED } from '../src/play/teams';
import { command, createPlayState, step, type EngineConfig } from '../src/play/engine';
import { seededRng } from '../src/career/create';
import { buildAtlas } from '../src/figure/atlas';
import type { Position } from '../src/career/state';
import type { Play } from '../src/play/types';

const cfg: EngineConfig = {
  slowmo: .3, decisionS: 1, animSpeed: 1, foulMult: 0, zoneFloor: .7, tempoSpread: 0, glassChance: 0,
  shot: { meterMs: 700, greenZone: .07, aimDeg: 6, influence: .6 },
  finish: { meterMs: 900, greenZone: .18, aimDeg: 8 },
};
const team = TEAMS.find(t => t.id === 'por')!, opp = TEAMS.find(t => t.id === 'bos')!;
const player = (position: Position) => ({ ...SAMPLE.player, position });

function ids(play: Play): string[] {
  const out = [...play.actors, play.inboundBy ?? play.actors[0]];
  for (const s of Object.values(play.segments)) {
    out.push(s.handler, ...Object.keys(s.paths), ...(s.options ?? []).flatMap(o => o.to ? [o.to] : []));
  }
  for (const v of play.variants) for (const g of Object.values(v.defPaths)) out.push(...Object.keys(g));
  return out;
}

afterEach(() => { unregisterHero(); vi.restoreAllMocks(); });

describe('Eigener Spieler in den Spielzügen', () => {
  it.each(['guard', 'wing', 'big'] as Position[])('%s: passende Spielzüge, Held genau einmal, Ablauf endet', position => {
    registerHero(player(position), team);
    const list = playsForHero(position);
    expect(list.length).toBeGreaterThan(3);
    for (const id of list) for (let seed = 1; seed <= 6; seed++) {
      const play = castWithHero(PLAYS[id], position, seededRng(seed));
      expect(play.actors.filter(a => a === HERO_ID)).toHaveLength(1);
      for (const a of ids(play)) expect(ACTORS[a], `${id}: ${a}`).toBeDefined();
      expect(new Set(play.actors).size).toBe(play.actors.length);
      const rng = seededRng(seed + 99), s = createPlayState(play, cfg, rng);
      for (let i = 0; i < 60 * 240 && s.phase !== 'ended'; i++) {
        if (s.phase === 'decision' && s.handler === HERO_ID && i % 97 === 0) command(s, { kind: 'comboStart' }, cfg, rng);
        step(s, 1 / 240, cfg, rng);
      }
      expect(s.phase, id).toBe('ended');
    }
  });
  it('Big landet nie in Spielzügen ohne Big-Rolle (z. B. Fast Break)', () => {
    expect(playsForHero('big')).not.toContain('fastbreak');
    expect(playsForHero('big')).not.toContain('twoonone');
    expect(playsForHero('guard')).toContain('fastbreak');
  });
  it('Held bevorzugt den Ballführer zu Beginn, wenn die Rolle passt', () => {
    registerHero(player('guard'), team);
    const play = castWithHero(PLAYS.pnr, 'guard', seededRng(1));
    expect(play.segments[play.start].handler).toBe(HERO_ID);
  });
  it('registerHero trägt Werte, Rolle und Teamfarben ein; unregister räumt auf', () => {
    const def = registerHero(player('wing'), team);
    expect(ACTORS[HERO_ID]).toBe(def);
    expect(def).toMatchObject({ team: 'off', role: 'wing', jersey: team.jersey, shorts: team.shorts, num: SAMPLE.player.num });
    expect(def.ratings).toEqual(SAMPLE.player.ratings);
    unregisterHero();
    expect(ACTORS[HERO_ID]).toBeUndefined();
  });
  it('dressTeams färbt Mitspieler/Gegner ein und stellt die Labor-Farben wieder her', () => {
    const before = [...RED, ...BLUE].map(a => [a.jersey, a.shorts]);
    const undo = dressTeams(team, opp);
    for (const a of RED) expect(ACTORS[a.id].jersey).toBe(team.jersey);
    for (const a of BLUE) expect(ACTORS[a.id].jersey).toBe(opp.jersey);
    undo();
    expect([...RED, ...BLUE].map(a => [ACTORS[a.id].jersey, ACTORS[a.id].shorts])).toEqual(before);
  });
  it('Atlas für einen extremen Helden-Look bleibt in den Grenzen', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
      getImageData: (_x: number, _y: number, w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
      putImageData: vi.fn(), drawImage: vi.fn(), clearRect: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    registerHero({ ...player('big'), look: { ...SAMPLE.player.look, heightM: 2.13, build: 'broad', hair: 'afro', headband: '#c8322b', armSleeve: 'left', socks: 'high' } }, team);
    const atlas = buildAtlas({ [HERO_ID]: ACTORS[HERO_ID] }, { lazy: true });
    for (const t of atlas.textures ?? [atlas.texture]) {
      const img = t.image as { width: number; height: number };
      expect(img.width).toBeLessThanOrEqual(4096); expect(img.height).toBeLessThanOrEqual(4096);
    }
  });
});
