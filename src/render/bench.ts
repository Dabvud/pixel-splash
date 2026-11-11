import type { ActorView } from './actors';
import type { MoveId } from '../figure/moves';
import { BENCH_RED, BENCH_BLUE } from '../play/teams';

export type BenchTeam = 'off' | 'def';
export interface BenchFigure extends ActorView { team: BenchTeam }
export const BENCH_MOVES: readonly MoveId[] = ['sit', 'bench_cheer', 'knocked_down', 'run'];
export const DOC_MOVES: readonly MoveId[] = ['idle', 'run'];

type HighlightEvent = { type: string; made?: boolean; banner?: string; andOne?: boolean };
export function benchHighlightTeam(event: HighlightEvent, offense: BenchTeam): BenchTeam | null {
  if (event.type === 'glass' || event.type === 'foul' && event.andOne) return offense;
  if (event.type !== 'result') return null;
  if (/GEBLOCKT/.test(event.banner ?? '')) return offense === 'off' ? 'def' : 'off';
  return event.made && /DUNK|POSTER|DREIER/.test(event.banner ?? '') ? offense : null;
}

export function createBenchState(rng: () => number) {
  const figures: BenchFigure[] = [...BENCH_RED, ...BENCH_BLUE].map((look, i) => ({
    id: look.id, team: i < 3 ? 'off' : 'def', x: i < 3 ? -8.4 : 8.4, y: 0,
    z: 3 + i % 3, facing: i < 3 ? Math.PI / 2 : -Math.PI / 2,
    move: 'sit', moveT: 0, visible: true,
  }));
  const doctor: ActorView = { id: 'doc', x: 0, y: 0, z: 9, facing: 0, move: 'idle', moveT: 0, visible: false };
  const cheers = new Map<string, { start: number; end: number }>();
  let faint: { victim: BenchFigure; at: number; tunnelX: number } | null = null;
  const state = { figures, doctor, forceFaint: false, highlight, update, reset };

  function reset(): void {
    faint = null; cheers.clear(); doctor.visible = false;
    figures.forEach((f, i) => {
      f.x = f.team === 'off' ? -8.4 : 8.4; f.y = 0; f.z = 3 + i % 3;
      f.facing = f.team === 'off' ? Math.PI / 2 : -Math.PI / 2;
      f.move = 'sit'; f.moveT = 0; f.visible = true;
    });
  }

  function highlight(nowS: number, team: BenchTeam = 'off'): void {
    update(nowS);
    // Eine Ziehung liefert zugleich Chance und Opferwahl.
    const roll = rng();
    const available = figures.filter(f => f.team === team && f.visible && f !== faint?.victim);
    available.forEach((f, i) => cheers.set(f.id, { start: nowS + i * .125, end: nowS + 2.2 }));
    if (!faint && available.length && (state.forceFaint || roll < .03)) {
      const choice = state.forceFaint ? roll : roll / .03;
      faint = { victim: available[Math.min(available.length - 1, Math.floor(choice * available.length))],
        at: nowS + 1, tunnelX: team === 'off' ? -9.5 : 9.5 };
    }
    update(nowS);
  }

  function walk(f: ActorView, x: number, z: number, tx: number, tz: number, elapsed: number, speed: number): void {
    const distance = Math.hypot(tx - x, tz - z), t = distance ? Math.min(1, elapsed * speed / distance) : 1;
    f.x = x + (tx - x) * t; f.z = z + (tz - z) * t;
    f.facing = Math.atan2(tx - x, -(tz - z)); f.move = 'run';
    f.moveT = elapsed * (speed === 2 ? .5 : 1);
  }

  function update(nowS: number): void {
    for (const f of figures) {
      if (!f.visible) continue;
      const cheer = cheers.get(f.id);
      f.move = cheer && nowS >= cheer.start && nowS < cheer.end ? 'bench_cheer' : 'sit';
      f.moveT = cheer && nowS >= cheer.start ? nowS - cheer.start : nowS;
    }
    if (!faint || nowS < faint.at) return;
    const { victim, at, tunnelX } = faint;
    const x = victim.team === 'off' ? -7.6 : 7.6;
    const z = 3 + figures.indexOf(victim) % 3;
    victim.x = x; victim.z = z; victim.move = 'knocked_down'; victim.moveT = nowS - at;
    const spawn = at + 1.2, targetZ = z + .45;
    const arrival = spawn + Math.hypot(x - tunnelX, targetZ - 9) / 3, leave = arrival + 1.5;
    doctor.visible = nowS >= spawn;
    if (nowS < spawn) return;
    if (nowS < arrival) walk(doctor, tunnelX, 9, x, targetZ, nowS - spawn, 3);
    else if (nowS < leave) {
      doctor.x = x; doctor.z = targetZ; doctor.move = 'idle'; doctor.moveT = nowS - arrival;
    } else {
      walk(victim, x, z, tunnelX, 9, nowS - leave, 2);
      walk(doctor, x, targetZ, tunnelX, 9, nowS - leave, 2);
      const end = leave + Math.max(Math.hypot(x - tunnelX, z - 9), Math.hypot(x - tunnelX, targetZ - 9)) / 2;
      if (nowS >= end) {
        victim.visible = doctor.visible = false; cheers.delete(victim.id); faint = null;
      }
    }
  }
  return state;
}
