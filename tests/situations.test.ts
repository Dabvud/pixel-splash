import { describe, expect, it } from 'vitest';
import { command, createPlayState, playPositionValue, step, type EngineConfig, type EngineEvent, type PlayState } from '../src/play/engine';
import { castPlay, varyHelpTiming } from '../src/play/situations';
import { PLAYS } from '../src/play/plays';
import { ACTORS } from '../src/play/teams';
import { positionValue } from '../src/play/position';
import type { Play } from '../src/play/types';

const cfg: EngineConfig = {
  slowmo: .3, decisionS: 2, animSpeed: 1, foulMult: 1, zoneFloor: .7, tempoSpread: .3,
  glassChance: 0, boardOopChance: 0,
  shot: { meterMs: 700, greenZone: .07, aimDeg: 6, influence: .6 },
  finish: { meterMs: 450, greenZone: .1, aimDeg: 8 },
};
const randomCfg = { ...cfg, situationRandom: true };
function seeded(seed: number): () => number {
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
function until(s: PlayState, predicate: () => boolean, c = cfg, rng = () => .99): EngineEvent[] {
  const events: EngineEvent[] = [];
  for (let i = 0; i < 2400 && !predicate(); i++) events.push(...step(s, 1 / 60, c, rng));
  expect(predicate()).toBe(true);
  return events;
}

describe('Situationen: Paket 1', () => {
  it.each(Object.values(PLAYS))('$id: aus behält Uhr, Rückstand, Akteure, Wege und RNG-Verbrauch', play => {
    for (const roll of [0, .49, .99]) {
      let calls = 0;
      const s = createPlayState(play, cfg, () => { calls++; return roll; });
      const explicit = createPlayState(play, { ...cfg, situationRandom: false }, () => roll);
      expect(s).toEqual(explicit);
      expect(s.play).toBe(play);
      expect(s.clock).toBe(play.clockS);
      expect(s.deficit).toBe(typeof play.deficit === 'number' ? play.deficit : 1 + Math.floor(roll * 3));
      expect(Object.keys(s.actors)).toEqual(play.actors);
      expect(s.overtime).toBe(false);
      expect(s.foulTrouble).toBeNull();
      expect(calls).toBe(typeof play.deficit === 'number' ? 1 : 2);
    }
  });

  it.each(Object.values(PLAYS))('$id: würfelt Uhr und erreichbaren Rückstand innerhalb der Grenzen', play => {
    const original = structuredClone(play);
    for (let seed = 1; seed <= 1000; seed++) {
      const s = createPlayState(play, randomCfg, seeded(seed));
      const lo = s.overtime ? (play.id === 'fastbreak' ? 4 : 3)
        : Math.max(play.id === 'inbound' ? 1.5 : play.id === 'fastbreak' ? 4 : 3, play.clockS * .5);
      const hi = s.overtime ? 12 : Math.min(24, play.clockS * 2.5);
      expect(s.clock).toBeGreaterThanOrEqual(lo);
      expect(s.clock).toBeLessThanOrEqual(hi);
      expect(Number.isInteger(s.deficit)).toBe(true);
      expect(s.deficit).toBeGreaterThanOrEqual(1);
      expect(s.deficit).toBeLessThanOrEqual(s.overtime || s.clock < 5 ? 3 : 6);
      if (s.foulTrouble) expect(ACTORS[s.foulTrouble].team).toBe('def');
    }
    expect(play).toEqual(original);
  });

  it('erreicht beide Uhrgrenzen und verteilt Rückstände gleichmäßig über rng', () => {
    // Die ersten drei Würfe bestimmen OT, Uhr und Rückstand.
    for (const [play, lo, hi] of [[PLAYS.pnr, 4, 20], [PLAYS.fastbreak, 4, 15], [PLAYS.inbound, 1.5, 7.5]] as const) {
      for (const [roll, clock] of [[0, lo], [1 - Number.EPSILON, hi]]) {
        let i = 0;
        const values = [.9, roll, .99];
        expect(createPlayState(play, randomCfg, () => values[i++] ?? .99).clock).toBeCloseTo(clock);
      }
    }
    for (let deficit = 1; deficit <= 6; deficit++) {
      let i = 0;
      const values = [.9, .5, (deficit - .5) / 6];
      expect(createPlayState(PLAYS.pnr, randomCfg, () => values[i++] ?? .99).deficit).toBe(deficit);
    }
  });

  it.each(Object.values(PLAYS))('$id: die zufällige Uhr verändert keine Angreifer-Zeitachse', play => {
    const s = createPlayState(play, randomCfg, seeded(42));
    for (const [i, id] of play.actors.entries()) if (ACTORS[id].team === 'off') {
      for (const [segment, data] of Object.entries(play.segments)) {
        expect(s.play.segments[segment].paths[s.play.actors[i]]).toEqual(data.paths[id]);
        expect(s.play.segments[segment].decisionAt).toBe(data.decisionAt);
      }
    }
  });

  it('würfelt Overtime und Foul-Probleme jeweils in ungefähr 15 Prozent der Angriffe', () => {
    let overtime = 0, foulTrouble = 0;
    const rng = seeded(27);
    for (let i = 0; i < 10000; i++) {
      const s = createPlayState(PLAYS.pnr, randomCfg, rng);
      overtime += Number(s.overtime); foulTrouble += Number(s.foulTrouble !== null);
    }
    expect(overtime / 10000).toBeGreaterThan(.13);
    expect(overtime / 10000).toBeLessThan(.17);
    expect(foulTrouble / 10000).toBeGreaterThan(.13);
    expect(foulTrouble / 10000).toBeLessThan(.17);
  });

  it.each([false, true])('Gleichstand bei overtime=%s liefert den passenden Endtext und Jubel', overtime => {
    const s = createPlayState(PLAYS.pnr, cfg, () => .99);
    s.overtime = overtime;
    s.points = s.deficit;
    until(s, () => s.phase === 'decision');
    s.clock = .001;
    const events = step(s, .1, cfg, () => .99);
    const text = overtime ? 'DOPPEL-OVERTIME' : 'OVERTIME';
    expect(s.verdict).toBe(text);
    expect(events).toContainEqual({ type: 'end', verdict: text });
    expect(s.actors[s.handler].move).toBe('celebrate');
  });
});

describe('Rollenbesetzung', () => {
  it.each(Object.values(PLAYS))('$id: benennt über 200 Seeds alle Referenzen konsistent und rollenkompatibel um', play => {
    const original = structuredClone(play), lineups = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const cast = castPlay(play, seeded(seed));
      lineups.add(cast.actors.join(','));
      expect(new Set(cast.actors).size).toBe(cast.actors.length);
      const ids = Object.fromEntries(play.actors.map((id, i) => [id, cast.actors[i]]));
      for (const id of play.actors) {
        expect(ACTORS[ids[id]].role).toBe(ACTORS[id].role);
        expect(ACTORS[ids[id]].team).toBe(ACTORS[id].team);
      }
      expect(cast.inboundBy).toBe(play.inboundBy && ids[play.inboundBy]);
      expect(cast.start).toBe(play.start);
      for (const [id, seg] of Object.entries(play.segments)) {
        const next = cast.segments[id];
        expect(next.handler).toBe(ids[seg.handler]);
        for (const [actor, path] of Object.entries(seg.paths)) expect(next.paths[ids[actor]]).toEqual(path);
        for (const [i, opt] of (seg.options ?? []).entries()) {
          expect(next.options![i]).toEqual({ ...opt, ...(opt.to ? { to: ids[opt.to] } : {}) });
          if (opt.next) expect(cast.segments[next.options![i].next!].handler).toBe(next.options![i].to);
        }
        for (const actor of Object.keys(next.paths)) expect(cast.actors).toContain(actor);
      }
      for (const [i, variant] of play.variants.entries()) for (const [seg, paths] of Object.entries(variant.defPaths)) {
        for (const [actor, path] of Object.entries(paths)) {
          expect(cast.actors).toContain(ids[actor]);
          expect(cast.variants[i].defPaths[seg][ids[actor]]).toEqual(path);
        }
      }
    }
    expect(lineups.size).toBeGreaterThan(1);
    expect(play).toEqual(original);
  });
});

describe('Frühe und späte Hilfe', () => {
  it.each([0, 1 - Number.EPSILON])('verschiebt nur Hilfe-/Closeout-Zeiten bei rng=%s', roll => {
    const play = structuredClone(PLAYS.kickout);
    const changed = varyHelpTiming(play, () => roll);
    expect(changed.segments).toEqual(play.segments);
    const before = play.variants[0].defPaths.to_r11.b7;
    const after = changed.variants[0].defPaths.to_r11.b7;
    expect(after[0]).toEqual(before[0]);
    expect(after[1].t - before[1].t).toBeCloseTo(-.25 + .7 * roll);
    expect(changed.variants[0].defPaths.setup.b44).toEqual(play.variants[0].defPaths.setup.b44);
    for (const [i, v] of changed.variants.entries()) for (const [seg, paths] of Object.entries(v.defPaths)) {
      for (const [actor, path] of Object.entries(paths)) for (const [j, p] of path.entries()) {
        expect({ ...p, t: 0 }).toEqual({ ...play.variants[i].defPaths[seg][actor][j], t: 0 });
        if (j) expect(p.t).toBeGreaterThan(path[j - 1].t);
      }
    }
  });
});

describe('Verteidiger mit fünf Fouls', () => {
  it.each([false, true])('halbiert dessen Positionsdruck und verhindert Kontakt, Block und Foul bei forcePoster=%s', forcePoster => {
    const c = { ...cfg, forcePoster, finishFoulOverride: 1, blockFoulChance: 1 };
    const s = createPlayState(PLAYS.kickout, c, () => .99);
    until(s, () => s.phase === 'decision', c);
    for (const a of Object.values(s.actors)) if (ACTORS[a.id].team === 'def') a.pos = { x: 7, z: 12 };
    s.actors.b1.pos = { x: 0, z: .8 };
    const pos = { x: 0, z: 1.2 };
    const before = positionValue(pos, [s.actors.b1.pos]);
    s.foulTrouble = 'b1';
    expect(playPositionValue(s, pos)).toBeCloseTo(1 - (1 - before) * .5);
    command(s, { kind: 'drive', lane: 0 }, c, () => 0);
    until(s, () => s.phase === 'takeoff', c, () => 0);
    expect(s.combo!.kind).toBe('dunk');
    expect(s.combo!.fouled).toBe(false);
    command(s, { kind: 'comboRelease', holdMs: 0, angleDeg: 80 }, c, () => 0);
    const events = until(s, () => s.phase === 'ended', c, () => 0);
    expect(s.poster).toBeNull();
    expect(events.some(e => e.type === 'foul' || e.type === 'freethrow')).toBe(false);
    expect(s.actors.b1.move).not.toBe('block_jump_hit');
  });

  it('prüft beim Lob die Verteidigung am künftigen Fangpunkt für das Foul', () => {
    const play: Play = {
      id: 'inbound', name: 'Lob', clockS: 8, deficit: 2, start: 'setup', inboundBy: 'r3',
      actors: ['r3', 'r50', 'b1', 'b7'],
      segments: { setup: { id: 'setup', handler: 'r3', decisionAt: 0,
        paths: { r3: [{ t: 0, x: -8, z: 3, act: 'inbound' }], r50: [{ t: 0, x: 0, z: .6, act: 'stand' }] },
        options: [{ kind: 'pass', to: 'r50', lob: true }] } },
      variants: [{ id: 'help', weight: 1, defPaths: { setup: {
        b1: [{ t: 0, x: 6, z: 6, act: 'defend' }, { t: .5, x: 0, z: .6, act: 'defend' }],
        b7: [{ t: 0, x: .5, z: .6, act: 'defend' }, { t: .5, x: 7, z: 12, act: 'defend' }],
      } } }],
    };
    const c = { ...cfg, forcePoster: true, finishFoulOverride: 1 };
    const s = createPlayState(play, c, () => .99);
    s.foulTrouble = 'b1';
    until(s, () => s.phase === 'decision', c);
    command(s, { kind: 'pass', to: 'r50', quality: 1 }, c, () => .99);
    until(s, () => s.phase === 'takeoff', c);
    expect(s.combo!.kind).toBe('dunk');
    expect(s.combo!.fouled).toBe(false);
  });

  it('unterdrückt auch beim Sprungwurf das Foul des nächsten Verteidigers, aber nicht das eines anderen', () => {
    for (const trouble of ['b1', 'b7']) {
      const c = { ...cfg, foulMult: 100 };
      const s = createPlayState(PLAYS.pnr, c, () => .99);
      until(s, () => s.phase === 'decision', c);
      s.foulTrouble = trouble;
      for (const a of Object.values(s.actors)) if (ACTORS[a.id].team === 'def') a.pos = { x: 7, z: 12 };
      s.actors.b1.pos = { ...s.actors[s.handler].pos };
      command(s, { kind: 'comboStart' }, c, () => 0);
      expect(s.combo!.fouled).toBe(trouble !== 'b1');
    }
  });
});

describe.each(Object.values(PLAYS))('$id mit zufälliger Situation', (play: Play) => {
  it('erreicht über 200 Seeds mit Pass-, Wurf- und Drive-Eingaben garantiert ended', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rng = seeded(seed), c = { ...randomCfg, decisionLead: 2, finishArrow: seed % 2 === 0 };
      const s = createPlayState(play, c, rng);
      let decisions = 0;
      for (let i = 0; i < 3600 && s.phase !== 'ended'; i++) {
        if (s.arrowMeter && s.arrowMeter.fill === null && s.realTime >= s.arrowMeter.startTime + s.arrowMeter.meterMs / 1000) {
          command(s, { kind: 'tap' }, c, rng);
        } else if (s.phase === 'decision' && !s.arrowMeter) {
          const options = s.play.segments[s.play.start].options ?? [];
          const pass = decisions++ === 0 ? options.filter(o => o.kind === 'pass')[seed % Math.max(1, options.filter(o => o.kind === 'pass').length)] : undefined;
          command(s, pass?.to ? { kind: 'pass', to: pass.to, quality: 1 }
            : seed % 3 === 0 ? { kind: 'drive', lane: 0 } : { kind: 'comboStart' }, c, rng);
        }
        if (!s.arrowMeter && (s.phase === 'combo' || s.phase === 'takeoff' || s.phase === 'freethrows')) {
          if (!s.combo) command(s, { kind: 'comboStart' }, c, rng);
          if (s.combo) command(s, { kind: 'comboRelease', holdMs: s.combo.meterMs, angleDeg: 0 }, c, rng);
        }
        step(s, 1 / 60, c, rng);
      }
      expect(s.phase, `Seed ${seed}`).toBe('ended');
      expect(Object.values(s.ball).every(Number.isFinite)).toBe(true);
    }
  }, 30000);
});
