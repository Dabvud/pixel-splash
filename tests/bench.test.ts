import { describe, expect, it, vi } from 'vitest';
import { benchHighlightTeam, createBenchState } from '../src/render/bench';
import { ACTORS, BENCH_RED, BENCH_BLUE, DOC, RED, BLUE } from '../src/play/teams';

describe('Bank-Reaktionen', () => {
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

  it.each([false, true])('lässt genau einen Spieler umfallen und vom Arzt abholen (forceFaint=%s)', forced => {
    const rng = vi.fn(() => forced ? .8 : .02), bank = createBenchState(rng);
    bank.forceFaint = forced;
    bank.highlight(0, 'off');
    bank.update(.9);
    expect(bank.figures.some(f => f.move === 'knocked_down')).toBe(false);
    bank.update(1.01);
    const down = bank.figures.filter(f => f.move === 'knocked_down');
    expect(down).toHaveLength(1);
    expect(down[0].x).toBeCloseTo(-7.6);
    expect(bank.doctor.visible).toBe(false);
    bank.update(2.2);
    expect(bank.doctor).toMatchObject({ visible: true, x: -9.5, z: 9, move: 'run' });
    const target = { x: down[0].x, z: down[0].z + .45 };
    const travel = Math.hypot(target.x + 9.5, target.z - 9) / 3;
    bank.update(2.2 + travel / 2);
    expect(bank.doctor.x).toBeCloseTo((-9.5 + target.x) / 2);
    expect(bank.doctor.z).toBeCloseTo((9 + target.z) / 2);
    bank.update(2.2 + travel + .01);
    expect(bank.doctor).toMatchObject({ visible: true, move: 'idle', ...target });
    expect(down[0].move).toBe('knocked_down');
    const leave = 2.2 + travel + 1.5;
    bank.update(leave + .1);
    expect(down[0].move).toBe('run');
    expect(bank.doctor.move).toBe('run');
    const x = down[0].x, z = down[0].z, t = down[0].moveT;
    bank.update(leave + .3);
    expect(Math.hypot(down[0].x - x, down[0].z - z)).toBeCloseTo(.4);
    expect(down[0].moveT - t).toBeCloseTo(.1);
    bank.update(30);
    expect(down[0]).toMatchObject({ visible: false, x: -9.5, z: 9 });
    expect(bank.doctor).toMatchObject({ visible: false, x: -9.5, z: 9 });
    expect(bank.figures.filter(f => f.visible)).toHaveLength(5);
    bank.highlight(31, 'off'); bank.update(31.3);
    expect(down[0].visible).toBe(false);
  });

  it.each([.03, .5, .999])('erzeugt bei rng=%s ohne Erzwingen keine Ohnmacht', value => {
    const bank = createBenchState(() => value);
    bank.highlight(0, 'off'); bank.update(1.1); bank.update(20);
    expect(bank.figures.every(f => f.visible && f.move === 'sit')).toBe(true);
    expect(bank.doctor.visible).toBe(false);
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
      bank.update(2.2); expect(bank.doctor.x).toBe(9.5);
      return victim.id;
    });
    expect(new Set(victims).size).toBe(3);
  });

  it.each([.5, 1.1, 3, 30])('reset stellt alle sechs Spieler wieder her und bricht die Arzt-Szene ab bei %s s', time => {
    const bank = createBenchState(() => 0);
    bank.highlight(0, 'off'); bank.update(time); bank.reset(); bank.update(50);
    expect(bank.figures).toHaveLength(6);
    expect(bank.figures.every(f => f.visible && f.move === 'sit' && Math.abs(f.x) === 8.4)).toBe(true);
    expect(bank.doctor.visible).toBe(false);
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
    expect(ACTORS[DOC.id]).toBeUndefined();
    expect(DOC).toMatchObject({ jersey: '#ffffff', shorts: '#ffffff', cross: true, num: -1 });
  });
});
