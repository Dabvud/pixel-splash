import { afterEach, describe, expect, it, vi } from 'vitest';
import { command, createPlayState, step, type EngineConfig } from '../src/play/engine';
import { PLAYS } from '../src/play/plays';
import { castPlay, PLAY_ROLES } from '../src/play/situations';
import { ACTORS } from '../src/play/teams';
import type { Play, PlayId, Waypoint } from '../src/play/types';
import { DEFAULTS, loadSettings } from '../src/settings';
import { createLabMenu } from '../src/ui/lab-menu';
import { playRoutes } from './play-routes';

const expected = {
  floppy: 'Floppy', pindown: 'Pin-down Ecke', horns: 'Horns', spain: 'Spain Pick & Roll',
  doubledrag: 'Double Drag', stagger: 'Stagger für den Dreier', elevator: 'Elevator Doors',
  flare: 'Flare-Screen', slob: 'Seiteneinwurf (SLOB)', lob08: 'Lob vom Einwurf', shortroll: 'Short Roll',
};
const ids = Object.keys(expected) as PlayId[];
const plays = ids.map(id => PLAYS[id]).filter((p): p is Play => !!p);
const cfg: EngineConfig = {
  slowmo: .3, decisionS: 2, animSpeed: 1, foulMult: 0, zoneFloor: .7, tempoSpread: .3,
  passDelayMax: 0, closeoutRandom: 0, glassChance: 0, boardOopChance: 0,
  shot: { meterMs: 700, greenZone: .07, aimDeg: 6, influence: .6 },
  finish: { meterMs: 450, greenZone: .1, aimDeg: 8 },
};
const safe = () => .99;
afterEach(() => { document.body.innerHTML = ''; localStorage.clear(); vi.restoreAllMocks(); });

function checkPath(path: Waypoint[]): void {
  expect(path.length).toBeGreaterThan(0);
  expect(path[0].t).toBe(0);
  for (const [i, p] of path.entries()) {
    expect([p.t, p.x, p.z].every(Number.isFinite)).toBe(true);
    expect(Math.abs(p.x)).toBeLessThanOrEqual(7.3);
    expect(p.z).toBeGreaterThanOrEqual(-1.4);
    expect(p.z).toBeLessThanOrEqual(12);
    if (i) {
      const before = path[i - 1];
      expect(p.t).toBeGreaterThan(before.t);
      expect(Math.hypot(p.x - before.x, p.z - before.z) / (p.t - before.t)).toBeLessThanOrEqual(8);
    }
  }
}

describe('Spielzüge Paket A4–A23 – Registrierung und Daten', () => {
  it('registriert die elf IDs mit den Namen aus der Spec', () => {
    for (const [id, name] of Object.entries(expected)) expect(PLAYS[id as PlayId]).toMatchObject({ id, name });
  });
  it.each(plays)('$id: enthält vollständige Wege, gültige Folgepässe und gewichtete Varianten', play => {
    expect(play.segments[play.start]).toBeDefined();
    expect(new Set(play.actors).size).toBe(play.actors.length);
    for (const id of play.actors) expect(ACTORS[id]).toBeDefined();
    const off = play.actors.filter(id => ACTORS[id].team === 'off');
    const def = play.actors.filter(id => ACTORS[id].team === 'def');
    for (const [id, s] of Object.entries(play.segments)) {
      expect(s.id).toBe(id);
      expect(off).toContain(s.handler);
      expect(s.decisionAt).toBeGreaterThan(0);
      expect(Object.keys(s.paths).sort()).toEqual([...off].sort());
      for (const path of Object.values(s.paths)) { checkPath(path); expect(path.at(-1)!.t).toBeGreaterThanOrEqual(s.decisionAt!); }
      expect(s.options!.length).toBeGreaterThan(0);
      const passes = s.options!.filter(o => o.kind === 'pass');
      expect(new Set(passes.map(o => o.to)).size).toBe(passes.length);
      for (const o of passes) {
        expect(off).toContain(o.to);
        expect(o.to).not.toBe(s.handler);
        const next = play.segments[o.next!];
        expect(next).toBeDefined();
        expect(next.handler).toBe(o.to);
        expect(next.options!.length).toBeGreaterThan(0);
        if (o.lob) {
          const end = s.paths[o.to!].at(-1)!;
          expect(Math.hypot(end.x, end.z)).toBeLessThan(2.5);
        }
      }
      for (const v of play.variants) {
        expect(Object.keys(v.defPaths[id]).sort()).toEqual([...def].sort());
        for (const path of Object.values(v.defPaths[id])) { checkPath(path); expect(path.at(-1)!.t).toBeGreaterThanOrEqual(s.decisionAt!); }
      }
    }
    expect(play.variants.length).toBeGreaterThanOrEqual(2);
    expect(play.variants.length).toBeLessThanOrEqual(4);
    expect(new Set(play.variants.map(v => v.id)).size).toBe(play.variants.length);
    expect(new Set(play.variants.map(v => JSON.stringify(v.defPaths))).size).toBe(play.variants.length);
    const first = play.segments[play.start].options!;
    expect(new Set(first.map(o => `${o.kind}/${o.to ?? ''}/${!!o.lob}`)).size).toBeGreaterThanOrEqual(2);
    const total = play.variants.reduce((sum, v) => sum + v.weight, 0);
    let before = 0;
    for (const variant of play.variants) {
      expect(variant.weight).toBeGreaterThan(0);
      expect(createPlayState(play, cfg, () => (before + variant.weight / 2) / total).variant).toBe(variant.id);
      before += variant.weight;
    }
    const cast = castPlay(play, () => .1);
    for (const [i, actor] of play.actors.entries()) {
      expect(cast.actors[i]).toBeDefined();
      expect(ACTORS[cast.actors[i]].role).toBe(ACTORS[actor].role);
      if (ACTORS[actor].team === 'off') expect(PLAY_ROLES[play.id][actor]).toBe(ACTORS[actor].role);
    }
  });
  it('bietet alle neuen Spielzüge im Lab-Menü an und speichert sie', () => {
    createLabMenu(document.body, { ...DEFAULTS, mode: 'play' }, () => {});
    const select = document.querySelector<HTMLSelectElement>('#lab-play')!;
    expect([...select.options].map(o => o.value)).toEqual(['random', ...Object.keys(PLAYS)]);
    for (const id of ids) {
      expect([...select.options].find(o => o.value === id)!.text).toBe(PLAYS[id].name);
      select.value = id; select.dispatchEvent(new Event('input', { bubbles: true }));
      expect(loadSettings().play).toBe(id);
    }
  });
  it('stellt bei Spain, Horns, SLOB und Short Roll realistische Lobs bereit', () => {
    for (const id of ['spain', 'horns', 'slob', 'shortroll'] as const) {
      expect(Object.values(PLAYS[id].segments).some(s => s.options!.some(o => o.lob))).toBe(true);
    }
    const s = PLAYS.shortroll.segments[PLAYS.shortroll.start];
    const pass = s.options!.find(o => o.kind === 'pass')!;
    expect(s.paths[pass.to!].at(-1)!.z).toBeCloseTo(4.2);
    expect(PLAYS.shortroll.segments[pass.next!].options!.map(o => o.kind)).toContain('shoot');
  });
  it('bietet beim Lob-Einwurf nur Luftabschlüsse bei 0,8 Sekunden an', () => {
    const p = PLAYS.lob08, s = p.segments[p.start];
    expect(p.clockS).toBe(.8);
    expect(p.inboundBy).toBe(s.handler);
    expect(s.paths[s.handler][0].z).toBeLessThan(0);
    expect(s.options!.length).toBeGreaterThanOrEqual(2);
    expect(s.options!.every(o => o.kind === 'pass' && o.lob)).toBe(true);
  });
  it.each([0, .1, .5, .99])('bewahrt die 0,8 Sekunden auch bei Situationszufall (rng=%s)', roll => {
    const s = createPlayState(PLAYS.lob08, { ...cfg, situationRandom: true }, () => roll);
    expect(s.clock).toBe(.8);
    expect(s.play.inboundBy).toBe(s.handler);
    expect(s.play.segments[s.play.start].options!.every(o => o.lob)).toBe(true);
  });
  it('stellt bei Double Drag, Stagger und Elevator zwei Blöcke und Dreierpositionen bereit', () => {
    for (const id of ['doubledrag', 'stagger', 'elevator'] as const) {
      const p = PLAYS[id], s = p.segments[p.start];
      expect(Object.values(s.paths).filter(path => path.some(w => w.act === 'screen')).length).toBeGreaterThanOrEqual(2);
      expect(Object.values(p.segments).some(s => s.options!.some(o => o.kind === 'shoot')
        && Math.hypot(s.paths[s.handler][0].x, s.paths[s.handler][0].z) >= 6.75)).toBe(true);
    }
  });
  it('führt Floppy, Pin-down, Stagger, Elevator und Flare zum freien Dreier-Catch mit Folgeentscheidung', () => {
    for (const id of ['floppy', 'pindown', 'stagger', 'elevator', 'flare'] as const) {
      const p = PLAYS[id], s = p.segments[p.start];
      const catches = s.options!.filter(o => o.kind === 'pass').map(o => p.segments[o.next!]);
      const shooter = catches.find(c => {
        const at = c.paths[c.handler][0];
        return Math.hypot(at.x, at.z) >= 6.75 && c.options!.some(o => o.kind === 'shoot');
      });
      expect(shooter).toBeDefined();
      if (id === 'pindown') {
        expect(Math.abs(shooter!.paths[shooter!.handler][0].x)).toBeGreaterThanOrEqual(6.75);
        expect(shooter!.paths[shooter!.handler][0].z).toBeLessThan(1);
      }
      if (id !== 'elevator') expect(shooter!.options).toContainEqual({ kind: 'drive' });
    }
  });
  it('trennt bei Spain Rückenblock und Pop, bei Double Drag Roll und Pop und beim SLOB beide Einwurfziele', () => {
    const spain = PLAYS.spain.segments[PLAYS.spain.start];
    expect(spain.paths.r11.some(p => p.act === 'screen')).toBe(true);
    expect(spain.options).toContainEqual(expect.objectContaining({ to: 'r50', lob: true }));
    expect(spain.options).toContainEqual(expect.objectContaining({ to: 'r11', next: 'pop' }));
    expect(Math.hypot(spain.paths.r11.at(-1)!.x, spain.paths.r11.at(-1)!.z)).toBeGreaterThanOrEqual(6.75);
    const drag = PLAYS.doubledrag.segments[PLAYS.doubledrag.start];
    expect(drag.paths.r50.find(p => p.act === 'screen')!.z).toBeGreaterThan(drag.paths.r32.find(p => p.act === 'screen')!.z);
    expect(drag.paths.r50.at(-1)!.z).toBeLessThan(2);
    expect(Math.hypot(drag.paths.r32.at(-1)!.x, drag.paths.r32.at(-1)!.z)).toBeGreaterThanOrEqual(6.75);
    const slob = PLAYS.slob, inbound = slob.segments[slob.start];
    expect(slob.inboundBy).toBe(inbound.handler);
    expect(inbound.paths[inbound.handler][0].x).toBe(7.3);
    expect(inbound.options!.filter(o => o.lob)).toHaveLength(1);
    expect(inbound.options!.filter(o => !o.lob && o.kind === 'pass')).toHaveLength(1);
  });
});

const routes = plays.flatMap(play => play.variants.flatMap(variant => Object.keys(play.segments).flatMap(start =>
  playRoutes(play, start, 3).flatMap(route => [false, true].map(live => ({
    title: `${play.id}/${variant.id}/${start}/${route.map(o => o.to ?? o.kind).join('/')}/live=${live}`,
    play: { ...play, start, variants: [{ ...variant, weight: 1 }] }, route, live,
  }))))));
describe.each(routes)('Paket 2 Route $title', ({ play, route, live }) => {
  it('führt jede Option rekursiv bis Tiefe 3 aus und erreicht ended vor 60 Spielsekunden', () => {
    const c = live ? { ...cfg, decisionLead: 2.5, decisionS: 2.5, finishArrow: true } : cfg;
    const s = createPlayState(play, c, safe);
    let index = 0;
    let lobTarget: string | undefined;
    for (let i = 0; i < 14400 && s.phase !== 'ended'; i++) {
      if (s.phase === 'decision') {
        const option = route[index];
        if (option && (option.kind !== 'shoot' || !s.arrowMeter || s.realTime >= s.arrowMeter.startTime)) {
          index++;
          if (option.lob) lobTarget = option.to;
          command(s, option.kind === 'pass' ? { kind: 'pass', to: option.to!, quality: 1 }
            : option.kind === 'drive' ? { kind: 'drive', lane: 0 }
              : s.arrowMeter ? { kind: 'tap' } : { kind: 'comboStart' }, c, safe);
        }
      }
      if (s.phase === 'takeoff' && s.arrowMeter && s.realTime >= s.arrowMeter.startTime) command(s, { kind: 'tap' }, c, safe);
      else if (s.phase === 'takeoff' || s.phase === 'freethrows') command(s, { kind: 'comboStart' }, c, safe);
      if (s.phase === 'combo') command(s, { kind: 'comboRelease', holdMs: s.combo!.meterMs, angleDeg: 0 }, c, safe);
      step(s, 1 / 120, c, safe);
      if (lobTarget && s.handler === lobTarget) {
        const catchPos = s.actors[lobTarget].pos;
        expect(Math.hypot(catchPos.x, catchPos.z)).toBeLessThan(2.5);
        lobTarget = undefined;
      }
    }
    expect(index).toBe(route.length);
    expect(s.phase).toBe('ended');
    expect(s.gameT).toBeLessThan(60);
    expect(s.banner).not.toBe('ZEIT ABGELAUFEN');
  });
});

describe.each(plays.flatMap(play => play.variants.map(variant => ({
  title: `${play.id}/${variant.id}`, play: { ...play, variants: [{ ...variant, weight: 1 }] },
}))))('Paket 2 ohne Eingabe $title', ({ play }) => {
  it('beendet auch ohne Nutzereingabe jede Phase vor 60 Spielsekunden', () => {
    const s = createPlayState(play, cfg, safe);
    for (let i = 0; i < 14400 && s.phase !== 'ended'; i++) step(s, 1 / 120, cfg, safe);
    expect(s.phase).toBe('ended');
    expect(s.gameT).toBeLessThan(60);
  });
});
