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
  iso: 'Isolation', handoff: 'Handoff (DHO)', backdoor: 'Backdoor-Cut', giveandgo: 'Give-and-Go',
  twoonone: '2-gegen-1 Konter', threeontwo: '3-gegen-2 Konter', pickpop: 'Pick & Pop', hammer: 'Hammer-Aktion',
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
    expect([p.x, p.z, p.t].every(Number.isFinite)).toBe(true);
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

describe('Spielzüge Paket A – Registrierung und Daten', () => {
  it('registriert alle acht IDs mit den Namen aus der Spec', () => {
    for (const [id, name] of Object.entries(expected)) expect(PLAYS[id as PlayId]).toMatchObject({ id, name });
  });
  it.each(plays)('$id: referenziert vollständige, begrenzte Wege und sinnvolle Folgeentscheidungen', play => {
    expect(play.segments[play.start]).toBeDefined();
    expect(new Set(play.actors).size).toBe(play.actors.length);
    const offense = play.actors.filter(id => ACTORS[id].team === 'off');
    const defense = play.actors.filter(id => ACTORS[id].team === 'def');
    for (const id of play.actors) expect(ACTORS[id]).toBeDefined();
    for (const [id, segment] of Object.entries(play.segments)) {
      expect(segment.id).toBe(id);
      expect(offense).toContain(segment.handler);
      expect(Object.keys(segment.paths).sort()).toEqual([...offense].sort());
      expect(segment.decisionAt).toBeGreaterThan(0);
      expect(segment.decisionAt!).toBeLessThan(play.clockS);
      for (const path of Object.values(segment.paths)) {
        checkPath(path);
        expect(path.at(-1)!.t).toBeGreaterThanOrEqual(segment.decisionAt!);
      }
      expect(segment.options!.length).toBeGreaterThanOrEqual(2);
      const passes = segment.options!.filter(o => o.kind === 'pass');
      // Gesten wählen den Empfänger; doppelte Ziele wären nicht getrennt erreichbar.
      expect(new Set(passes.map(o => o.to)).size).toBe(passes.length);
      for (const option of passes) {
        expect(offense).toContain(option.to);
        expect(option.to).not.toBe(segment.handler);
        const next = play.segments[option.next!];
        expect(next).toBeDefined();
        expect(next.handler).toBe(option.to);
        expect(next.options!.map(o => o.kind)).toEqual(expect.arrayContaining(['shoot', 'drive']));
        if (option.lob) {
          const catcher = segment.paths[option.to!].at(-1)!;
          expect(Math.hypot(catcher.x, catcher.z)).toBeLessThan(2.5);
        }
      }
      for (const variant of play.variants) {
        const paths = variant.defPaths[id];
        expect(Object.keys(paths).sort()).toEqual([...defense].sort());
        for (const path of Object.values(paths)) { checkPath(path); expect(path.at(-1)!.t).toBeGreaterThanOrEqual(segment.decisionAt!); }
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
      expect(ACTORS[cast.actors[i]].role).toBe(ACTORS[actor].role);
      if (ACTORS[actor].team === 'off') expect(PLAY_ROLES[play.id][actor]).toBe(ACTORS[actor].role);
    }
  });
  it.each([['twoonone', 2, 1], ['threeontwo', 3, 2]] as const)('%s nutzt nur %s Angreifer und %s Verteidiger', (id, off, def) => {
    expect(PLAYS[id].actors.filter(a => ACTORS[a].team === 'off')).toHaveLength(off);
    expect(PLAYS[id].actors.filter(a => ACTORS[a].team === 'def')).toHaveLength(def);
  });
  it('bietet Isolation am Dreier und räumt die Ballseite frei', () => {
    const p = PLAYS.iso, s = p.segments[p.start], handler = s.paths[s.handler].at(-1)!;
    expect(Math.hypot(handler.x, handler.z)).toBeGreaterThanOrEqual(6.75);
    expect(s.options!.map(o => o.kind)).toEqual(expect.arrayContaining(['shoot', 'drive', 'pass']));
    for (const [id, path] of Object.entries(s.paths)) if (id !== s.handler) expect(path.at(-1)!.x).toBeGreaterThan(0);
  });
  it('übergibt beim Handoff vom Big am Ellbogen und bietet danach Dreier, Drive und Pocket', () => {
    const p = PLAYS.handoff, s = p.segments[p.start];
    expect(ACTORS[s.handler].role).toBe('big');
    expect(s.paths[s.handler].at(-1)!.z).toBeCloseTo(4.2);
    for (const option of s.options!) {
      expect(ACTORS[option.to!].role).toBe('guard');
      const next = p.segments[option.next!];
      expect(next.options!.map(o => o.kind)).toEqual(expect.arrayContaining(['shoot', 'drive', 'pass']));
      expect(next.options).toContainEqual(expect.objectContaining({ kind: 'pass', to: s.handler }));
      const end = next.paths[next.handler].at(-1)!;
      expect(Math.hypot(end.x, end.z)).toBeGreaterThanOrEqual(6.75);
    }
  });
  it('erlaubt Backdoor-Bodenpass, Weiterlaufen über den Flügel und einen Lob auf denselben Cutter', () => {
    const p = PLAYS.backdoor, s = p.segments[p.start];
    const direct = s.options!.find(o => o.to === 'r23')!;
    expect(direct.lob).not.toBe(true);
    const start = s.paths.r23[0], end = s.paths.r23.at(-1)!;
    expect(start.z - end.z).toBeGreaterThan(3);
    expect(playRoutes(p).some(route => route.some(o => o.to === direct.to && o.lob))).toBe(true);
  });
  it('spielt Give-and-Go über beide Flügel mit Rückpass, Lob und zusätzlichem Pass am Korb', () => {
    const p = PLAYS.giveandgo, handler = p.segments[p.start].handler;
    const routes = playRoutes(p);
    expect(routes.some(route => route.length === 4 && route[1].to === handler && route[2].kind === 'pass')).toBe(true);
    expect(routes.some(route => route[1]?.to === handler && route[1].lob)).toBe(true);
    for (const first of p.segments[p.start].options!) {
      const cut = p.segments[first.next!].paths[handler];
      expect(cut[0].z - cut.at(-1)!.z).toBeGreaterThan(4);
    }
  });
  it('stellt beim 3-gegen-2 Flügelpass, Pull-up und Lob zur Wahl', () => {
    const p = PLAYS.threeontwo, s = p.segments[p.start];
    expect(s.options).toContainEqual({ kind: 'shoot' });
    expect(s.options!.some(o => o.kind === 'pass' && !o.lob)).toBe(true);
    expect(s.options!.some(o => o.kind === 'pass' && o.lob)).toBe(true);
  });
  it('lässt den Big nach dem Pick zum Dreier poppen und öffnet beim Hammer die Ecke hinter dem Block', () => {
    for (const id of ['pickpop', 'hammer'] as const) {
      const p = PLAYS[id], s = p.segments[p.start], pass = s.options!.find(o => o.kind === 'pass')!;
      const target = s.paths[pass.to!].at(-1)!;
      expect(Math.hypot(target.x, target.z)).toBeGreaterThanOrEqual(6.75);
      expect(s.paths.r50.some(p => p.act === 'screen')).toBe(true);
      expect(s.options).toContainEqual({ kind: 'drive' });
      if (id === 'pickpop') expect(ACTORS[pass.to!].role).toBe('big');
      else { expect(Math.abs(target.x)).toBeGreaterThanOrEqual(6.75); expect(target.z).toBeLessThan(1); }
    }
  });
  it('bietet alle Spielzüge einzeln an und speichert die neue Auswahl', () => {
    createLabMenu(document.body, { ...DEFAULTS, mode: 'play' }, () => {});
    const select = document.querySelector<HTMLSelectElement>('#lab-play')!;
    expect([...select.options].map(o => o.value)).toEqual(['random', ...Object.keys(PLAYS)]);
    for (const id of ids) {
      expect([...select.options].find(o => o.value === id)!.text).toBe(PLAYS[id].name);
      select.value = id; select.dispatchEvent(new Event('input', { bubbles: true }));
      expect(loadSettings().play).toBe(id);
    }
  });
});

const routes = plays.flatMap(play => play.variants.flatMap(variant => Object.keys(play.segments).flatMap(start =>
  playRoutes(play, start).flatMap(route => [false, true].map(live => ({
    title: `${play.id}/${variant.id}/${start}/${route.map(o => o.to ?? o.kind).join('/')}/live=${live}`,
    play: { ...play, start, variants: [{ ...variant, weight: 1 }] }, route, live,
  }))))));

describe.each(routes)('Paket A Route $title', ({ play, route, live }) => {
  it('führt jede Option rekursiv bis Tiefe 3 aus und erreicht ended vor 60 Spielsekunden', () => {
    const c = live ? { ...cfg, decisionLead: 2.5, decisionS: 2.5, finishArrow: true } : cfg;
    const s = createPlayState(play, c, safe);
    let index = 0;
    for (let i = 0; i < 14400 && s.phase !== 'ended'; i++) {
      if (s.phase === 'decision') {
        const option = route[index];
        if (option && (option.kind !== 'shoot' || !s.arrowMeter || s.realTime >= s.arrowMeter.startTime)) {
          index++;
          command(s, option.kind === 'pass' ? { kind: 'pass', to: option.to!, quality: 1 }
            : option.kind === 'drive' ? { kind: 'drive', lane: 0 }
              : s.arrowMeter ? { kind: 'tap' } : { kind: 'comboStart' }, c, safe);
        }
      }
      if (s.phase === 'takeoff' && s.arrowMeter && s.realTime >= s.arrowMeter.startTime) command(s, { kind: 'tap' }, c, safe);
      else if (s.phase === 'takeoff' || s.phase === 'freethrows') command(s, { kind: 'comboStart' }, c, safe);
      if (s.phase === 'combo') command(s, { kind: 'comboRelease', holdMs: s.combo!.meterMs, angleDeg: 0 }, c, safe);
      step(s, 1 / 120, c, safe);
    }
    expect(index).toBe(route.length);
    expect(s.phase).toBe('ended');
    expect(s.gameT).toBeLessThan(60);
    expect(s.banner).not.toBe('ZEIT ABGELAUFEN');
  });
});
