import { describe, expect, it } from 'vitest';
import { aiChoice, command, createPlayState, step } from '../src/play/engine';
import type { EngineConfig, EngineEvent, PlayState } from '../src/play/engine';
import { PLAYS } from '../src/play/plays';
import { ACTORS } from '../src/play/teams';
import type { Option, Play, Variant } from '../src/play/types';
import { ballHandAt, MOVES, moveFrames } from '../src/figure/moves';
import { bankWindow, effectiveZones } from '../src/shot/resolve';

const cfg: EngineConfig = {
  slowmo: .3, decisionS: 2, animSpeed: 1, foulMult: 0, zoneFloor: .7, tempoSpread: .3,
  shot: { meterMs: 700, greenZone: .07, aimDeg: 6, influence: .6 },
  finish: { meterMs: 450, greenZone: .1, aimDeg: 8 },
};
const safe = () => .99;

describe('Bankshots in der Engine', () => {
  it.each([[3, 3, 2], [5, 5, 3], [-5, 5, 3]] as const)(
    'zählt bank_in bei (%s,%s) mit %s Punkten und Assist-Banner', (x, z, points) => {
      const s = decision();
      s.actors[s.handler].pos = { x, z };
      s.assisted = true;
      command(s, { kind: 'comboStart' }, cfg, safe);
      const combo = s.combo!;
      expect(combo.bankWindow).toEqual(bankWindow({ ...cfg.shot, rating: .7, distance: Math.hypot(x, z),
        zoneFactor: .7 + .3 * combo.P, bankAngleDeg: 45 }));
      command(s, { kind: 'comboRelease', holdMs: combo.meterMs * (1 + 1.5 * combo.zones.g), angleDeg: 0 }, cfg, safe);
      const events = until(s, () => s.phase === 'ended');
      expect(s.points).toBe(points);
      expect(s.banner).toBe('ASSIST + BRETT – DRIN');
      expect(events).toContainEqual({ type: 'result', banner: 'ASSIST + BRETT – DRIN', made: true });
    });

  it('zählt den Brett-Freiwurf als einen Punkt und zeigt sein Banner', () => {
    const c = { ...cfg, foulMult: 2 }, s = decision(PLAYS.pnr, c, () => 0);
    release(s, true, c, () => 0);
    until(s, () => s.phase === 'freethrows', c, () => 0);
    const before = s.points;
    step(s, .8, c, safe); // Aufstellung vor der Wurf-Kombi
    command(s, { kind: 'comboStart' }, c, safe);
    const combo = s.combo!;
    expect(combo.bankWindow!.hi - combo.bankWindow!.lo).toBeCloseTo(.3 * combo.zones.g, 10);
    command(s, { kind: 'comboRelease', holdMs: combo.meterMs * (1 + 1.5 * combo.zones.g), angleDeg: 0 }, c, safe);
    until(s, () => s.phase === 'ended', c, safe);
    expect(s.points).toBe(before + 1);
    expect(s.banner).toBe('BRETT – DRIN');
  });

  it('behält bei bank_in den And-one-Zusatz und gewährt genau einen Freiwurf', () => {
    const c = { ...cfg, foulMult: 100 }, s = decision(PLAYS.pnr, c, () => 0);
    command(s, { kind: 'comboStart' }, c, () => 0);
    const combo = s.combo!;
    command(s, { kind: 'comboRelease', holdMs: combo.meterMs * (1 + 1.5 * combo.zones.g), angleDeg: 0 }, c, () => 0);
    const events = until(s, () => s.phase === 'freethrows', c, () => 0);
    expect(s.points).toBe(2);
    expect(s.freeThrows!.left).toBe(1);
    expect(events).toContainEqual({ type: 'result', banner: 'BRETT – DRIN + AND-ONE', made: true });
  });
});
function only(play: Play, variant: Variant): Play { return { ...play, variants: [{ ...variant, weight: 1 }] }; }
function until(s: PlayState, predicate: () => boolean, c = cfg, rng = safe, limit = 1800): EngineEvent[] {
  const events: EngineEvent[] = [];
  for (let i = 0; i < limit && !predicate(); i++) events.push(...step(s, 1 / 60, c, rng));
  expect(predicate()).toBe(true);
  return events;
}
function decision(play = PLAYS.pnr, c = cfg, rng = safe): PlayState {
  const s = createPlayState(play, c, rng);
  until(s, () => s.phase === 'decision', c, rng);
  return s;
}
function choose(s: PlayState, o: Option, c = cfg, rng = safe): EngineEvent[] {
  return command(s, o.kind === 'shoot' ? { kind: 'comboStart' }
    : o.kind === 'drive' ? { kind: 'drive', lane: 0 } : { kind: 'pass', to: o.to! }, c, rng);
}
function release(s: PlayState, perfect: boolean, c = cfg, rng = safe): void {
  if (s.phase === 'freethrows') step(s, .8, c, rng); // Aufstellung vor der Wurf-Kombi
  if (s.arrowMeter && s.arrowMeter.fill === null) {
    if (perfect) step(s, Math.max(0, s.arrowMeter.startTime + s.arrowMeter.meterMs / 1000 - s.realTime), c, rng);
    command(s, { kind: 'tap' }, c, rng);
    return;
  }
  if (s.phase !== 'combo') command(s, { kind: 'comboStart' }, c, rng);
  command(s, { kind: 'comboRelease', holdMs: perfect ? s.combo!.meterMs : 0, angleDeg: perfect ? 0 : 80 }, c, rng);
}

// Jede vollständige Route enthält auch die Entscheidungen der Passempfänger.
const routes = Object.values(PLAYS).flatMap(play => play.variants.flatMap(variant => {
  const first = play.segments[play.start].options!;
  return first.flatMap(option => {
    const next = option.kind === 'pass' && !option.lob
      ? play.segments[option.next!].options!.map(follow => [option, follow]) : [[option]];
    return next.flatMap(route => [true, false].map(perfect => ({
      title: `${play.id}/${variant.id}/${route.map(o => o.to ?? o.kind).join('/')}/${perfect ? 'perfekt' : 'verfehlt'}`,
      play: only(play, variant), route, perfect,
    })));
  });
}));

describe.each(routes)('$title', ({ play, route, perfect }) => {
  it('erreicht mit allen Folgeentscheidungen innerhalb von 30 Sekunden ended', () => {
    const s = decision(play);
    let index = 0;
    for (let i = 0; i < 1800 && s.phase !== 'ended'; i++) {
      if (s.phase === 'decision') {
        const option = route[index++] ?? { kind: 'shoot' };
        if (s.arrowMeter && option.kind === 'shoot') release(s, perfect);
        else choose(s, option);
      }
      if (s.phase === 'takeoff' || s.phase === 'freethrows' || s.phase === 'combo') release(s, perfect);
      step(s, 1 / 60, cfg, safe);
      for (const a of Object.values(s.actors)) {
        expect(Number.isFinite(a.y)).toBe(true);
        expect(a.y).toBeGreaterThanOrEqual(0);
      }
      expect(Object.values(s.ball).every(Number.isFinite)).toBe(true);
    }
    expect(s.phase).toBe('ended');
    expect(s.gameT).toBeLessThan(30);
    expect(index).toBe(route.length);
  });
});

describe('Engine Zeit, Kontrolle und KI', () => {
  it('enthält nur die am Spielzug beteiligten Figuren und würfelt Variante/Rückstand gewichtet', () => {
    const s = createPlayState(PLAYS.fastbreak, cfg, safe);
    expect(Object.keys(s.actors).sort()).toEqual([...PLAYS.fastbreak.actors].sort());
    expect(s.variant).toBe('stop_ball');
    expect(createPlayState(PLAYS.inbound, cfg, () => 0).deficit).toBe(1);
    expect(createPlayState(PLAYS.inbound, cfg, safe).deficit).toBe(3);
  });
  it('trennt Spielzeit mit Zeitlupe/Animationstempo von Echtzeit und pausiert bei dt=0', () => {
    const c = { ...cfg, animSpeed: 1.5 };
    const s = decision(PLAYS.pnr, c), clock = s.clock, gameT = s.gameT;
    step(s, .5, c, safe);
    expect(s.clock).toBeCloseTo(clock - .5 * .3 * 1.5);
    expect(s.gameT).toBeCloseTo(gameT + .5 * .3 * 1.5);
    const snapshot = JSON.stringify(s);
    expect(step(s, 0, c, safe)).toEqual([]);
    expect(JSON.stringify(s)).toBe(snapshot);
  });
  it('wählt kleinstes P und bei Gleichstand Werfen vor Ziehen vor Pass', () => {
    const s = decision();
    for (const a of Object.values(s.actors)) if (ACTORS[a.id].team === 'def') a.pos = { x: 7, z: 12 };
    expect(aiChoice(s).kind).toBe('shoot');
    s.actors.b1.pos = { x: 0, z: 5 };
    expect(aiChoice(s).kind).toBe('shoot');
    s.actors.b1.pos = { x: 0, z: .8 };
    expect(aiChoice(s).kind).toBe('drive');
    s.actors.b1.pos = { x: 6.5, z: .47 };
    expect(aiChoice(s).to).toBe('r11');
  });
  it('bewertet Ziehen nach künftigen Variantenwegen und Pass am bewegten Fangpunkt', () => {
    const p: Play = structuredClone(PLAYS.pnr);
    p.variants = [p.variants[0]];
    // Der Verteidiger erreicht den Ring erst nach dem aktuellen Entscheidungszeitpunkt.
    const future = p.segments.setup.decisionAt! + 1;
    p.variants[0].defPaths.setup = { b1: [{ t: 0, x: 7, z: 10, act: 'defend' }, { t: future, x: 0, z: .8, act: 'defend' }] };
    const s = decision(p);
    for (const a of Object.values(s.actors)) if (ACTORS[a.id].team === 'def') a.pos = { x: 7, z: 12 };
    expect(aiChoice(s).kind).toBe('drive');
  });
  it('hält die Frist bei Finger unten an und entscheidet erst nach Ende der Geste', () => {
    const s = decision();
    command(s, { kind: 'finger', down: true }, cfg, safe);
    const events = step(s, 3, cfg, safe);
    expect(s.phase).toBe('decision');
    expect(events.some(e => e.type === 'pass')).toBe(false);
    command(s, { kind: 'finger', down: false }, cfg, safe);
    const picked = aiChoice(s);
    const next = step(s, 1 / 60, cfg, safe);
    expect(picked.kind === 'pass' ? next.some(e => e.type === 'pass') : s.phase !== 'passing').toBe(true);
  });
  it('wartet nach KI-Werfen eine weitere Frist und beendet ohne Kombi', () => {
    const s = decision();
    s.actors.b1.pos = { x: 0, z: 5 };
    for (const id of ['b7', 'b15', 'b21', 'b44']) s.actors[id].pos = { x: 7, z: 12 };
    step(s, cfg.decisionS, cfg, safe);
    expect(s.phase).toBe('decision');
    until(s, () => s.phase === 'ended');
    expect(s.banner).toBe('ZU LANGE GEZÖGERT');
  });
  it('bindet nach KI-Werfen Befehle und Entscheidungsoptionen an die gewählte Option', () => {
    const s = decision(only(PLAYS.pnr, PLAYS.pnr.variants.find(v => v.id === 'hedge')!));
    expect(aiChoice(s).kind).toBe('shoot');
    const events = step(s, cfg.decisionS, cfg, safe);
    expect(events).toContainEqual({ type: 'decision', options: [{ kind: 'shoot' }] });
    expect(command(s, { kind: 'pass', to: 'r50' }, cfg, safe)).toEqual([]);
    expect(s.phase).toBe('decision');
    expect(command(s, { kind: 'drive', lane: 0 }, cfg, safe)).toEqual([]);
    expect(s.phase).toBe('decision');
    command(s, { kind: 'finger', down: true }, cfg, safe);
    command(s, { kind: 'comboStart' }, cfg, safe);
    expect(s.phase).toBe('combo');
    command(s, { kind: 'finger', down: false }, cfg, safe);
    command(s, { kind: 'pass', to: 'r50' }, cfg, safe);
    expect(s.phase).toBe('decision');
    release(s, true);
    expect(s.phase).toBe('ballflight');
  });
  it.each(Object.values(PLAYS).flatMap(p => p.variants.map(v => [p.id, v.id, only(p, v)] as const)))('%s/%s beendet auch ohne Eingaben', (_p, _v, p) => {
    const s = createPlayState(p, cfg, safe);
    until(s, () => s.phase === 'ended');
  });
  it('sperrt neue Aktionen bei 0:00 und wertet Release genau bei 0:00 nicht', () => {
    const s = decision();
    command(s, { kind: 'comboStart' }, cfg, safe);
    s.clock = 0;
    command(s, { kind: 'comboRelease', holdMs: s.combo!.meterMs, angleDeg: 0 }, cfg, safe);
    expect(s.points).toBe(0);
    expect(s.phase).toBe('ended');
    expect(s.banner).toBe('ZEIT ABGELAUFEN');
    expect(command(s, { kind: 'drive', lane: 0 }, cfg, safe)).toEqual([]);
  });
  it('wertet einen vor 0:00 losgelassenen Wurf vollständig', () => {
    const s = decision();
    command(s, { kind: 'comboStart' }, cfg, safe);
    s.clock = .001;
    release(s, true);
    until(s, () => s.phase === 'ended');
    expect(s.clock).toBe(0);
    expect(s.points).toBe(2);
    expect(s.banner).toBe('TREFFER');
  });
  it('beendet Aufbau und nicht losgelassene Sprungwurf-Kombi beim Uhrablauf', () => {
    const s = decision();
    command(s, { kind: 'comboStart' }, cfg, safe);
    s.clock = .01;
    step(s, .1, cfg, safe);
    expect(s.banner).toBe('ZEIT ABGELAUFEN');
    expect(s.phase).toBe('ended');
  });
  it('behandelt numerische Restbruchteile am exakten Ablaufzeitpunkt als 0:00', () => {
    const s = decision();
    command(s, { kind: 'comboStart' }, cfg, safe);
    s.clock = .03;
    step(s, .1, cfg, safe);
    expect(s.clock).toBe(0);
    expect(s.phase).toBe('ended');
    expect(command(s, { kind: 'comboRelease', holdMs: 700, angleDeg: 0 }, cfg, safe)).toEqual([]);
    expect(s.points).toBe(0);
  });
  it('beendet wartende takeoff-, combo- und Freiwurfphasen auch ohne Eingabe', () => {
    const s = decision();
    choose(s, { kind: 'drive' });
    until(s, () => s.phase === 'takeoff');
    until(s, () => s.phase === 'ended');
    expect(s.banner).toBe('VERLEGT');
    const t = decision();
    command(t, { kind: 'comboStart' }, cfg, safe);
    until(t, () => t.phase === 'ended');
    expect(t.banner).toBe('ZU LANGE GEZÖGERT');
  });
  it('beendet abgebrochene Gesten wieder am selben Entscheidungspunkt mit weiterlaufender Frist', () => {
    const s = decision();
    s.actors.b1.pos = { x: 0, z: 5 };
    step(s, 1, cfg, safe);
    command(s, { kind: 'finger', down: true }, cfg, safe);
    command(s, { kind: 'comboStart' }, cfg, safe);
    step(s, .5, cfg, safe);
    command(s, { kind: 'finger', down: false }, cfg, safe);
    expect(s.phase).toBe('decision');
    expect(s.combo).toBeNull();
    step(s, .6, cfg, safe);
    step(s, 2, cfg, safe);
    expect(s.phase).toBe('ended');
    expect(s.banner).toBe('ZU LANGE GEZÖGERT');
  });
  it('lässt einen vor 0:00 begonnenen Abschluss einschließlich Foul und Freiwürfen zu Ende laufen', () => {
    const c = { ...cfg, foulMult: 2 }, s = decision(PLAYS.kickout, c);
    command(s, { kind: 'drive', lane: 0 }, c, () => 0);
    until(s, () => s.phase === 'takeoff', c, () => 0);
    s.clock = .001;
    command(s, { kind: 'comboStart' }, c, () => 0);
    step(s, .1, c, () => 0);
    expect(s.clock).toBe(0);
    release(s, true, c, () => 0);
    until(s, () => s.phase === 'freethrows', c, () => 0);
    release(s, true, c, () => 0);
    until(s, () => s.phase === 'ended', c, () => 0);
    expect(s.points).toBe(3);
  });
});

describe('Pass, Einwurf und Abschluss', () => {
  it.each([[1, false], [.5, true], [0, true]] as const)(
    'berücksichtigt beim Abspiel q=%s für Steal=%s', (quality, steal) => {
      const s = decision();
      const from = s.actors[s.handler].pos, to = s.actors.r11.pos;
      for (const a of Object.values(s.actors).filter(a => ACTORS[a.id].team === 'def')) a.pos = { x: -7, z: 12 };
      s.actors.b1.pos = { x: (from.x + to.x) / 2, z: (from.z + to.z) / 2 };
      expect(command(s, { kind: 'pass', to: 'r11', quality }, cfg, () => .2))
        .toContainEqual({ type: 'pass', from: s.handler, to: 'r11', steal });
    });
  it('würfelt Steal genau beim Abspiel, animiert den Abfang und zählt Ballverlust', () => {
    const s = decision();
    const from = s.actors[s.handler].pos, to = s.actors.r50.pos;
    s.actors.b1.pos = { x: (from.x + to.x) / 2, z: (from.z + to.z) / 2 };
    const events = command(s, { kind: 'pass', to: 'r50' }, cfg, () => 0);
    expect(events).toContainEqual({ type: 'pass', from: 'r3', to: 'r50', steal: true });
    until(s, () => {
      expect(s.actors.b1.move).toBe('catch');
      return s.phase === 'ended';
    }, cfg, () => { throw new Error('erneutes Steal-Würfeln'); });
    expect(s.banner).toBe('STEAL');
    expect(s.turnovers).toBe(1);
    expect(s.actors.b1.move).toBe('catch');
  });
  it('wechselt Kontrolle beim Fangen, setzt Assist und ignoriert Eingaben unterwegs', () => {
    const s = decision();
    command(s, { kind: 'pass', to: 'r50' }, cfg, safe);
    const snapshot = s.handler;
    expect(command(s, { kind: 'comboStart' }, cfg, safe)).toEqual([]);
    expect(s.handler).toBe(snapshot);
    const events = until(s, () => s.handler === 'r50');
    expect(events).toContainEqual({ type: 'caught', by: 'r50' });
    expect(s.assisted).toBe(true);
    expect(s.actors.r50.move).toBe('catch');
    until(s, () => s.phase === 'decision');
    release(s, true);
    until(s, () => s.phase === 'ended');
    expect(s.banner).toBe('ASSIST + TREFFER');
  });
  it('berechnet den Fangpunkt aus dem Weg zur Fangzeit und landet an der Fanghand', () => {
    const p: Play = structuredClone(PLAYS.pnr);
    p.segments.setup.paths.r50.push({ t: 4, x: 4, z: 2, act: 'run' });
    const s = decision(p), startX = s.actors.r50.pos.x;
    command(s, { kind: 'pass', to: 'r50' }, cfg, safe);
    until(s, () => s.handler === 'r50');
    expect(s.actors.r50.pos.x).toBeGreaterThan(startX);
    expect(s.ball).toEqual(hand(s));
  });
  it('liefert ohne next einen Entscheidungspunkt Werfen/Ziehen und Pässe zu allen Mitspielern', () => {
    const p: Play = structuredClone(PLAYS.pnr);
    delete p.segments.setup.options!.find(o => o.to === 'r50')!.next;
    const s = decision(p);
    command(s, { kind: 'pass', to: 'r50' }, cfg, safe);
    const events = until(s, () => s.handler === 'r50' && s.phase === 'decision');
    expect(events).toContainEqual({ type: 'decision', options: [{ kind: 'shoot' }, { kind: 'drive' },
      ...Object.values(s.actors).filter(a => ACTORS[a.id].team === 'off' && a.id !== s.handler)
        .map(a => ({ kind: 'pass', to: a.id }))] });
  });
  it('startet die Inbound-Uhr beim Fangen und geht beim Lob direkt in takeoff', () => {
    const s = decision(PLAYS.inbound);
    expect(s.clock).toBe(3);
    command(s, { kind: 'pass', to: 'r50' }, cfg, safe);
    step(s, .1, cfg, safe);
    expect(s.clock).toBe(3);
    const events = until(s, () => s.handler === 'r50');
    expect(s.phase).toBe('takeoff');
    expect(events.some(e => e.type === 'takeoff')).toBe(true);
    expect(s.actors.r50.y).toBeGreaterThan(0);
    step(s, .1, cfg, safe);
    expect(s.clock).toBeLessThan(3);
  });
  it('friert P, Foul, Tempo und Zonen am Kombi-Start ein', () => {
    const c = { ...cfg, foulMult: 2 }, s = decision(PLAYS.pnr, c);
    s.actors.b1.pos = { x: 0, z: 5 };
    command(s, { kind: 'comboStart' }, c, () => 0);
    const combo = structuredClone(s.combo!);
    expect(combo.P).toBeCloseTo(0);
    expect(combo.fouled).toBe(true);
    expect(combo.meterMs).toBeCloseTo(490);
    expect(combo.zones).toEqual(effectiveZones({ ...c.shot, distance: 5.4, rating: .7, zoneFactor: .7 * .6 }));
    s.actors.b1.pos = { x: 7, z: 12 };
    step(s, .1, c, safe);
    expect(s.combo).toEqual(combo);
  });
  it('entscheidet Kontakt-Dunk am Absprung und nutzt Athletik/Abschlusswerte', () => {
    const s = decision(PLAYS.kickout);
    choose(s, { kind: 'drive' });
    s.actors.b1.pos = { x: 0, z: .8 };
    const events = until(s, () => s.phase === 'takeoff', cfg, () => .4);
    expect(events).toContainEqual({ type: 'takeoff', kind: 'contact_dunk' });
    expect(s.combo!.kind).toBe('contact_dunk');
    expect(s.combo!.zones.g).toBeCloseTo(.1 * (1 + .6 * (.9 - .5) * 1.6) * .7 * .75);
  });
  it('lässt Nr. 23 nach dem Fast-Break-Pass gegen den Ballstopp frei zum Dunk ziehen', () => {
    const p = PLAYS.fastbreak, s = decision(only(p, p.variants.find(v => v.id === 'stop_ball')!));
    command(s, { kind: 'pass', to: 'r23' }, cfg, safe);
    until(s, () => s.handler === 'r23' && s.phase === 'decision');
    command(s, { kind: 'drive', lane: 0 }, cfg, safe);
    until(s, () => s.phase === 'takeoff');
    expect(s.combo!.kind).toBe('dunk');
    expect(s.combo!.P).toBeGreaterThanOrEqual(.7);
  });
  it.each([-1, 0, 1] as const)('fährt Bahn %s zum um 1 m versetzten Absprung', lane => {
    const s = decision();
    command(s, { kind: 'drive', lane }, cfg, safe);
    until(s, () => s.phase === 'takeoff');
    expect(s.actors.r3.pos.x).toBeCloseTo(lane);
    expect(s.actors.r3.pos.z).toBeCloseTo(1.2);
  });
});

describe('Freiwurf-Serie', () => {
  it('hält die Freiwurf-Frist bei fingerDown über die Halteschwelle hinaus an', () => {
    const c = { ...cfg, foulMult: 2 }, s = decision(PLAYS.kickout, c);
    command(s, { kind: 'drive', lane: 0 }, c, () => 0);
    until(s, () => s.phase === 'takeoff', c, () => 0);
    release(s, true, c, () => 0);
    until(s, () => s.phase === 'freethrows', c, () => 0);
    step(s, 1.85, c, safe);
    command(s, { kind: 'finger', down: true }, c, safe);
    expect(step(s, .2, c, safe)).toEqual([]);
    expect(s.phase).toBe('freethrows');
    command(s, { kind: 'comboStart' }, c, safe);
    expect(s.phase).toBe('combo');
    release(s, true, c, safe);
    expect(s.phase).toBe('ballflight');
  });

  function fouled(perfect: boolean) {
    const p: Play = structuredClone(PLAYS.pnr);
    p.segments.setup.paths.r3 = [{ t: 0, x: 0, z: 7, act: 'stand' }];
    const c = { ...cfg, foulMult: 2 }, s = decision(p, c, () => 0);
    release(s, perfect, c, () => 0);
    until(s, () => s.phase === 'freethrows', c, () => 0);
    return { s, c };
  }
  it('gewährt beim gefoulten Fehlwurf-Dreier drei Versuche, stehende Uhr und späte Bewertung', () => {
    const { s, c } = fouled(false);
    expect(s.freeThrows).toEqual({ shooter: 'r3', left: 3 });
    expect(s.verdict).toBeNull();
    const clock = s.clock;
    for (const [i, made] of [false, true, false].entries()) {
      release(s, made, c, () => 0);
      until(s, () => s.phase === 'freethrows' || s.phase === 'ended', c, () => 0);
      expect(s.clock).toBe(clock);
      if (i < 2) { expect(s.freeThrows!.left).toBe(2 - i); expect(s.verdict).toBeNull(); }
    }
    expect(s.points).toBe(1);
    expect(s.phase).toBe('ended');
    expect(s.verdict).toBe('VERLOREN');
  });
  it('wertet And-one als Korb plus genau einen Freiwurf ohne Positions-/Foul-/Tempoeffekt', () => {
    const { s, c } = fouled(true);
    expect(s.points).toBe(3);
    expect(s.freeThrows!.left).toBe(1);
    s.clock = 0;
    step(s, .8, c, () => 0); // Aufstellung vor der Wurf-Kombi
    command(s, { kind: 'comboStart' }, c, () => 0);
    expect(s.combo!.meterMs).toBe(c.shot.meterMs);
    expect(s.combo!.fouled).toBe(false);
    expect(s.combo!.zones).toEqual(effectiveZones({ ...c.shot, distance: 4.2, rating: .7 }));
    release(s, true, c, () => 0);
    until(s, () => s.phase === 'ended', c, () => 0);
    expect(s.points).toBe(4);
    expect(s.verdict).toBe('GAMEWINNER');
  });
});

function hand(s: PlayState) {
  const a = s.actors[s.handler], m = MOVES[a.move];
  const frame = m.loop ? Math.floor(a.moveT * m.fps) % m.frames : Math.min(m.frames - 1, Math.floor(a.moveT * m.fps));
  const h = ballHandAt(a.move, frame) ?? moveFrames(a.move)[frame].haR;
  const size = ACTORS[a.id].heightM, co = Math.cos(a.facing), si = Math.sin(a.facing);
  return { x: a.pos.x + size * (h.x * co + h.z * si), y: a.y + size * h.y, z: a.pos.z + size * (h.x * si - h.z * co) };
}

describe('Figuren und Weltball', () => {
  it('blickt beim Laufen entlang (sin f, −cos f), im Stand zum Korb/Ballführer', () => {
    const s = createPlayState(PLAYS.fastbreak, cfg, safe);
    until(s, () => s.phase === 'running');
    step(s, .1, cfg, safe);
    expect(s.actors.r3.move).toBe('dribble_run');
    expect(s.actors.r3.facing).toBeCloseTo(0);
    expect(s.actors.r23.move).toBe('run');
    until(s, () => s.phase === 'decision');
    step(s, .1, cfg, safe);
    expect(s.actors.r3.move).toBe('dribble');
    const d = s.actors.b1, h = s.actors.r3;
    expect(Math.sin(d.facing)).toBeCloseTo((h.pos.x - d.pos.x) / Math.hypot(h.pos.x - d.pos.x, h.pos.z - d.pos.z));
  });
  it('hält den Ball nach Drehung und Größenmaßstab an der Passhand', () => {
    const s = decision();
    command(s, { kind: 'pass', to: 'r11' }, cfg, safe);
    expect(s.actors.r3.move).toBe('pass');
    expect(s.ball).toEqual(hand(s));
  });
  it('dribbelt zwischen Boden und Hand, ohne den Ball in den Boden zu setzen', () => {
    const s = decision(), heights: number[] = [];
    command(s, { kind: 'finger', down: true }, cfg, safe);
    for (let i = 0; i < 100; i++) { step(s, 1 / 60, cfg, safe); heights.push(s.ball.y); expect(s.ball.y).toBeLessThanOrEqual(hand(s).y); }
    expect(Math.min(...heights)).toBeCloseTo(.12, 1);
    expect(Math.max(...heights)).toBeGreaterThan(.6);
  });
  it.each(['dunk', 'contact_dunk'] as const)('%s erreicht im rimFrame den Ring mit Ball an der Hand', kind => {
    const s = decision(PLAYS.kickout);
    choose(s, { kind: 'drive' });
    if (kind === 'contact_dunk') s.actors.b1.pos = { x: 0, z: .8 };
    else for (const a of Object.values(s.actors)) if (ACTORS[a.id].team === 'def') a.pos = { x: 7, z: 12 };
    const rng = kind === 'contact_dunk' ? () => .4 : safe;
    until(s, () => s.phase === 'takeoff', cfg, rng);
    release(s, true, cfg, rng);
    const animation = kind === 'dunk' ? 'two_hand_dunk' : kind;
    until(s, () => Math.floor(s.actors.r23.moveT * 10 + 1e-8) >= MOVES[animation].rimFrame!, cfg, rng);
    const a = s.actors.r23;
    expect(a.move).toBe(animation);
    expect(a.y).toBeCloseTo(Math.max(0, 3.05 - ballHandAt(animation, MOVES[animation].rimFrame!)!.y * 2.03));
    expect(s.ball).toEqual(hand(s));
    expect(s.ball.y).toBeCloseTo(3.05);
  });
  it('animiert Sprungwurf, Block-Sprung und Foulkontakt mit Höhe', () => {
    const s = decision();
    s.actors.b1.pos = { x: 0, z: 5 };
    release(s, true);
    step(s, .2, cfg, safe);
    expect(s.actors.r3.move).toBe('step_back');
    expect(s.actors.r3.y).toBeGreaterThan(0);
    expect(s.actors.b1.move).toBe('block_jump');
    expect(s.actors.b1.y).toBeGreaterThan(0);
    const c = { ...cfg, foulMult: 2 }, f = decision(PLAYS.pnr, c);
    f.actors.b1.pos = { x: 0, z: 5 };
    release(f, true, c, () => 0);
    step(f, .2, c, safe);
    expect(f.actors.b1.move).toBe('contact');
    expect(f.actors.r3.pos.x).not.toBe(0);
    expect(Math.abs(f.actors.r3.pos.x)).toBeLessThan(.2);
  });
  it('landet nach der Sprungwurfbewegung, während der Ball weiterfliegt', () => {
    const s = decision();
    release(s, true);
    step(s, 1.2, cfg, safe);
    expect(s.phase).toBe('ballflight');
    expect(s.actors.r3.y).toBe(0);
    expect(s.actors.r3.move).toBe('idle');
  });
  it('animiert den Korbleger aus der Hand mit angehobenen Füßen', () => {
    const s = decision();
    command(s, { kind: 'drive', lane: 0 }, cfg, safe);
    until(s, () => s.phase === 'takeoff');
    release(s, true);
    step(s, .3, cfg, safe);
    expect(s.actors.r3.move).toBe('layup');
    expect(s.actors.r3.y).toBeGreaterThan(0);
    expect(s.ball).toEqual(hand(s));
  });
});
