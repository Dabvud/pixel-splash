import { describe, expect, it, vi } from 'vitest';
import { benchHighlightTeam, createBenchState } from '../src/render/bench';
import { ACTORS, BENCH_RED, BENCH_BLUE, DOC, MEDIC2, RED, BLUE } from '../src/play/teams';

describe('Bank-Reaktionen', () => {
  it.each(['off', 'def'] as const)('meldet die Ohnmacht bis zum Verschwinden von Sanitätern und Trage, höchstens sechs Sekunden: %s', team => {
    const bank = createBenchState(() => 0);
    bank.forceFaint = true;
    bank.highlight(10, team);
    bank.update(10.9); expect(bank.faint).toBeNull();
    bank.update(11);
    expect(bank.faint).toEqual({ x: team === 'off' ? -7.6 : 7.6, z: 3 });
    bank.update(15.5);
    expect(bank.faint).not.toBeNull();
    expect(bank.medics.every(m => m.visible)).toBe(true);
    bank.update(17);
    expect(bank.faint).toBeNull();
    expect(bank.medics.every(m => !m.visible)).toBe(true);
    expect(bank.stretcher.visible).toBe(false);
    expect(bank.figures.filter(f => f.visible)).toHaveLength(5);
    bank.reset(); expect(bank.faint).toBeNull();
  });
  it.each(['off', 'def'] as const)('jubelt nur auf der richtigen Bank binnen 0,3 s und sitzt nach 2,2 s wieder: %s', team => {
    const rng = vi.fn(() => .5), bank = createBenchState(rng);
    bank.highlight(10, team);
    bank.update(10.3);
    expect(bank.figures.filter(f => f.team === team).every(f => f.move === 'bench_cheer')).toBe(true);
    expect(bank.figures.filter(f => f.team !== team).every(f => f.move === 'sit')).toBe(true);
    bank.update(12.21);
    expect(bank.figures.every(f => f.move === 'sit')).toBe(true);
    expect(rng).toHaveBeenCalledTimes(1);
  });

  it.each((['off', 'def'] as const).flatMap(team => [false, true].map(forced => ({ team, forced }))))(
    'transportiert genau einen Liegenden mit zwei Sanitätern und einer Trage: $team, forceFaint=$forced', ({ team, forced }) => {
    const rng = vi.fn(() => forced ? .8 : .02), bank = createBenchState(rng);
    bank.forceFaint = forced;
    bank.highlight(0, team); bank.update(.9);
    expect(bank.figures.some(f => f.move === 'knocked_down')).toBe(false);
    bank.update(1.01);
    const down = bank.figures.filter(f => f.move === 'knocked_down');
    expect(down).toHaveLength(1);
    const victim = down[0], x = team === 'off' ? -7.6 : 7.6, z = victim.z, tunnelX = Math.sign(x) * 9.5;
    expect(victim.x).toBeCloseTo(x);
    expect(bank.medics.every(m => !m.visible)).toBe(true);
    bank.update(1.8);
    expect(bank.medics.map(m => m.id)).toEqual([DOC.id, MEDIC2.id]);
    expect(bank.stretcher).toMatchObject({ visible: true, x: tunnelX, z: 9, y: .8 });
    function expectFormation(): void {
      const [front, rear] = bank.medics, bed = bank.stretcher;
      expect(front.visible && rear.visible && bed.visible).toBe(true);
      expect(front.x).toBeCloseTo(bed.x); expect(rear.x).toBeCloseTo(bed.x);
      expect(Math.abs(front.z - rear.z)).toBeCloseTo(2.2);
      expect((front.z + rear.z) / 2).toBeCloseTo(bed.z);
    }
    expectFormation();
    expect(bank.medics.every(m => m.move === 'carry')).toBe(true);
    const target = { x: x - Math.sign(x) * .35, z };
    const travel = Math.hypot(target.x - tunnelX, z - 9) / 3.5, arrival = 1.8 + travel;
    bank.update(1.8 + travel / 2);
    expect(bank.stretcher.x).toBeCloseTo((tunnelX + target.x) / 2);
    expect(bank.stretcher.z).toBeCloseTo((9 + z) / 2);
    expectFormation();
    bank.update(arrival + .01);
    expect(bank.stretcher).toMatchObject({ ...target, y: .12, visible: true });
    expect(bank.medics.every(m => m.move === 'idle')).toBe(true);
    expect(victim).toMatchObject({ x, z, y: 0, move: 'knocked_down' });
    bank.update(arrival + .49); expect(victim.x).toBe(x);
    bank.update(arrival + .51);
    expect(victim.x).toBe(bank.stretcher.x); expect(victim.z).toBe(bank.stretcher.z);
    expect(victim.y).toBeCloseTo(bank.stretcher.y + .05);
    bank.update(arrival + .85);
    expect(bank.stretcher.y).toBe(.8);
    expect(victim.move).toBe('knocked_down'); expect(victim.y).toBeCloseTo(.85);
    expect(bank.medics.every(m => m.move === 'carry')).toBe(true);
    expectFormation();
    const before = { ...bank.stretcher };
    bank.update(arrival + 1.05);
    expect(Math.hypot(bank.stretcher.x - before.x, bank.stretcher.z - before.z)).toBeCloseTo(.6);
    expect(Math.hypot(bank.stretcher.x - tunnelX, bank.stretcher.z - 9))
      .toBeLessThan(Math.hypot(before.x - tunnelX, before.z - 9));
    expect(victim.x).toBe(bank.stretcher.x); expect(victim.z).toBe(bank.stretcher.z);
    expect(victim.y).toBeCloseTo(bank.stretcher.y + .05);
    expectFormation();
    bank.update(7);
    expect(victim).toMatchObject({ visible: false, x: tunnelX, z: 9 });
    expect(bank.medics.every(m => !m.visible)).toBe(true);
    expect(bank.stretcher).toMatchObject({ visible: false, x: tunnelX, z: 9 });
    expect(bank.faint).toBeNull();
    expect(bank.figures.filter(f => f.visible)).toHaveLength(5);
    bank.highlight(8, team); bank.update(8.3); expect(victim.visible).toBe(false);
    expect(rng).toHaveBeenCalledTimes(2);
  });

  it.each(['off', 'def'] as const)('beendet jeden Opferweg binnen sechs aktiven Sekunden ab Fall: %s', team => {
    for (const choice of [0, .4, .9]) {
      const bank = createBenchState(() => choice);
      bank.forceFaint = true; bank.highlight(0, team);
      for (let t = 1; t < 7; t += .025) bank.update(t);
      bank.update(7);
      expect(bank.faint).toBeNull();
      expect(bank.medics.every(m => !m.visible)).toBe(true);
      expect(bank.stretcher.visible).toBe(false);
      expect(bank.figures.filter(f => !f.visible)).toHaveLength(1);
    }
  });

  it.each([.03, .5, .999])('erzeugt bei rng=%s ohne Erzwingen keine Ohnmacht', value => {
    const bank = createBenchState(() => value);
    bank.highlight(0, 'off'); bank.update(1.1); bank.update(20);
    expect(bank.figures.every(f => f.visible && f.move === 'sit')).toBe(true);
    expect(bank.medics.every(m => !m.visible)).toBe(true);
    expect(bank.stretcher.visible).toBe(false);
  });

  it('zieht pro Highlight einmal und erzeugt während einer Ohnmacht keine zweite', () => {
    const rng = vi.fn(() => .01), bank = createBenchState(rng);
    bank.highlight(0, 'off'); bank.highlight(.2, 'def'); bank.update(1.5);
    expect(bank.figures.filter(f => f.move === 'knocked_down')).toHaveLength(1);
    bank.highlight(3, 'def'); bank.update(4.1);
    expect(bank.figures.filter(f => f.move === 'knocked_down')).toHaveLength(1);
    expect(rng).toHaveBeenCalledTimes(3);
  });

  it('wählt über dieselbe Ziehung unterschiedliche Opfer und nutzt den Tunnel der richtigen Seite', () => {
    const victims = [.001, .012, .025].map(value => {
      const bank = createBenchState(() => value);
      bank.highlight(0, 'def'); bank.update(1.1);
      const victim = bank.figures.find(f => f.move === 'knocked_down')!;
      expect(victim.team).toBe('def'); expect(victim.x).toBeCloseTo(7.6);
      bank.update(1.8); expect(bank.medics.every(m => m.x === 9.5)).toBe(true);
      return victim.id;
    });
    expect(new Set(victims).size).toBe(3);
  });

  it.each([.5, 1.1, 3, 4.5, 5.3, 30])('reset stellt alle sechs Spieler wieder her und bricht die Tragen-Szene ab bei %s s', time => {
    const bank = createBenchState(() => 0);
    bank.highlight(0, 'off'); bank.update(time); bank.reset(); bank.update(50);
    expect(bank.figures).toHaveLength(6);
    expect(bank.figures.every(f => f.visible && f.move === 'sit' && Math.abs(f.x) === 8.4)).toBe(true);
    expect(bank.figures.every(f => f.y === 0)).toBe(true);
    expect(bank.medics.every(m => !m.visible)).toBe(true);
    expect(bank.stretcher.visible).toBe(false);
  });

  it.each([
    [{ type: 'result', made: true, banner: 'ASSIST + DUNK!' }, 'off'],
    [{ type: 'result', made: true, banner: 'POSTER!' }, 'off'],
    [{ type: 'result', made: true, banner: 'DREIER' }, 'off'],
    [{ type: 'foul', andOne: true }, 'off'], [{ type: 'glass' }, 'off'],
    [{ type: 'result', made: false, banner: 'WEGGEBLOCKT' }, 'def'],
    [{ type: 'result', made: false, banner: 'GEBLOCKT' }, 'def'],
    [{ type: 'result', made: false, banner: 'DUNK' }, null],
    [{ type: 'result', made: true, banner: 'TREFFER' }, null],
    [{ type: 'foul', andOne: false }, null],
  ] as const)('ordnet Highlight %j der Bank %s zu', (event, team) => {
    expect(benchHighlightTeam(event, 'off')).toBe(team);
    if (team) expect(benchHighlightTeam(event, 'def')).toBe(team === 'off' ? 'def' : 'off');
  });

  it('hält neue Looks aus ACTORS heraus und verwendet eigene Nummern und Teamfarben', () => {
    for (const [bench, players] of [[BENCH_RED, RED], [BENCH_BLUE, BLUE]]) {
      expect(bench).toHaveLength(3);
      expect(new Set(bench.map(a => `${a.skin}|${a.hair}|${a.heightM}`)).size).toBe(3);
      expect(new Set([...bench, ...players].map(a => a.num)).size).toBe(8);
      for (const a of bench) {
        expect(ACTORS[a.id]).toBeUndefined(); expect(a.towel).toBe(true);
        expect(a.jersey).toBe(players[0].jersey); expect(a.shorts).toBe(players[0].shorts);
      }
    }
    for (const medic of [DOC, MEDIC2]) {
      expect(ACTORS[medic.id]).toBeUndefined();
      expect(medic).toMatchObject({ jersey: '#ffffff', shorts: '#ffffff', cross: true, num: -1 });
    }
    expect(MEDIC2.skin).not.toBe(DOC.skin);
    expect(MEDIC2.hair).not.toBe(DOC.hair);
    expect(MEDIC2.heightM).not.toBe(DOC.heightM);
  });
});
