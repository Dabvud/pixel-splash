import { describe, expect, it } from 'vitest';
import { addPoints, addAssist, emptyGame, boxRows } from '../src/stats/statline';
import { command, createPlayState, step, type EngineConfig, type EngineEvent } from '../src/play/engine';
import { PLAYS } from '../src/play/plays';

describe('Statline', () => {
  it('summiert Punkte und Assists pro Spieler', () => {
    const g = emptyGame();
    addPoints(g, 'r3', 2);
    addPoints(g, 'r3', 3);
    addAssist(g, 'r11');
    expect(g.players.r3).toEqual({ pts: 5, ast: 0 });
    expect(g.players.r11).toEqual({ pts: 0, ast: 1 });
  });

  it('liefert Boxscore-Zeilen in Teamreihenfolge mit Nullen für Spieler ohne Statistik', () => {
    const g = emptyGame();
    addPoints(g, 'r50', 2);
    const rows = boxRows(g, ['r3', 'r50']);
    expect(rows).toEqual([{ id: 'r3', pts: 0, ast: 0 }, { id: 'r50', pts: 2, ast: 0 }]);
  });
});

const cfg: EngineConfig = {
  slowmo: 0.3, decisionS: 2, animSpeed: 1, foulMult: 0, zoneFloor: 0.7, tempoSpread: 0,
  shot: { meterMs: 700, greenZone: 0.07, aimDeg: 6, influence: 0.6 },
  finish: { meterMs: 450, greenZone: 0.1, aimDeg: 8 },
};

describe('Engine schreibt die Statline des Spielzugs', () => {
  it('gibt dem Schützen die Punkte und dem letzten Passgeber den Assist', () => {
    const rng = () => 0.99; // kein Steal, kein Foul
    const s = createPlayState(PLAYS.pnr, cfg, rng);
    for (let i = 0; i < 4000 && s.phase !== 'decision'; i++) step(s, 1 / 120, cfg, rng);
    const passer = s.handler;
    const option = (s as any).__opts ?? null;
    void option;
    const to = Object.values(s.actors).find((a) => a.id !== passer && a.id.startsWith('r'))!.id;
    command(s, { kind: 'pass', to, quality: 1 }, cfg, rng);
    for (let i = 0; i < 4000 && !(s.phase === 'decision' && s.handler === to) && s.phase !== 'ended'; i++) step(s, 1 / 120, cfg, rng);
    if (s.arrowMeter) {
      // Catch-and-Shoot verstreichen lassen, dann normal werfen
      for (let i = 0; i < 4000 && s.arrowMeter; i++) step(s, 1 / 120, cfg, rng);
    }
    expect(s.handler).toBe(to);
    command(s, { kind: 'comboStart' }, cfg, rng);
    command(s, { kind: 'comboRelease', holdMs: s.combo!.meterMs, angleDeg: 0 }, cfg, rng);
    const events: EngineEvent[] = [];
    for (let i = 0; i < 4000 && s.phase !== 'ended'; i++) events.push(...step(s, 1 / 60, cfg, rng));
    expect(s.points).toBeGreaterThan(0);
    expect(s.box[to].pts).toBe(s.points);
    expect(s.box[passer].ast).toBe(1);
    expect(s.box[to].ast).toBe(0);
  });

  it('gibt bei einem Wurf ohne Pass keinen Assist', () => {
    const rng = () => 0.99;
    const s = createPlayState(PLAYS.fastbreak, cfg, rng);
    for (let i = 0; i < 4000 && s.phase !== 'decision'; i++) step(s, 1 / 120, cfg, rng);
    command(s, { kind: 'comboStart' }, cfg, rng);
    command(s, { kind: 'comboRelease', holdMs: s.combo!.meterMs, angleDeg: 0 }, cfg, rng);
    for (let i = 0; i < 4000 && s.phase !== 'ended'; i++) step(s, 1 / 60, cfg, rng);
    expect(s.box[s.handler].pts).toBe(s.points);
    expect(Object.values(s.box).reduce((n, b) => n + b.ast, 0)).toBe(0);
  });
});
