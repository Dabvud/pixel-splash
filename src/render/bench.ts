import type { ActorView } from './actors';
import type { MoveId } from '../figure/moves';
import { BENCH_RED, BENCH_BLUE, DOC, MEDIC2 } from '../play/teams';

export type BenchTeam = 'off' | 'def';
export interface BenchFigure extends ActorView { team: BenchTeam }
export interface BenchStretcher { x: number; z: number; y: number; visible: boolean }
export const BENCH_MOVES: readonly MoveId[] = ['sit', 'bench_cheer', 'knocked_down'];
export const DOC_MOVES: readonly MoveId[] = ['idle', 'carry'];

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
  const medics: [BenchFigure, BenchFigure] = [DOC, MEDIC2].map(look => ({
    id: look.id, team: 'off', x: 0, y: 0, z: 9, facing: 0, move: 'idle', moveT: 0, visible: false,
  })) as [BenchFigure, BenchFigure];
  const stretcher: BenchStretcher = { x: 0, y: .12, z: 9, visible: false };
  const cheers = new Map<string, { start: number; end: number }>();
  let faint: { victim: BenchFigure; at: number; tunnelX: number } | null = null;
  let faintPosition: { x: number; z: number } | null = null;
  const state = { figures, medics, stretcher, forceFaint: false, highlight, update, reset,
    get faint() { return faintPosition; } };

  function reset(): void {
    faint = null; faintPosition = null; cheers.clear(); stretcher.visible = false;
    medics.forEach(m => { m.visible = false; m.move = 'idle'; m.moveT = 0; });
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

  function transport(x: number, z: number, tx: number, tz: number, elapsed: number, speed: number): void {
    const distance = Math.hypot(tx - x, tz - z), t = distance ? Math.min(1, Math.max(0, elapsed) * speed / distance) : 1;
    stretcher.x = x + (tx - x) * t; stretcher.z = z + (tz - z) * t;
  }

  function formation(team: BenchTeam, carrying: boolean, elapsed: number): void {
    medics.forEach((m, i) => {
      m.visible = true; m.team = team;
      m.x = stretcher.x; m.z = stretcher.z + (i === 0 ? -1.1 : 1.1);
      // Beide greifen zur Mitte; die Längsachse bleibt für die Bank-Kamera quer im Bild.
      m.facing = i === 0 ? Math.PI : 0;
      m.move = carrying ? 'carry' : 'idle'; m.moveT = elapsed;
    });
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
    faintPosition ??= { x, z };
    victim.x = x; victim.y = 0; victim.z = z; victim.move = 'knocked_down'; victim.moveT = nowS - at;
    const spawn = at + .8, targetX = x - Math.sign(x) * .35;
    const distance = Math.hypot(targetX - tunnelX, z - 9);
    const arrival = spawn + distance / 3.5, load = arrival + .5, lift = load + .15, leave = lift + .15;
    stretcher.visible = nowS >= spawn;
    if (nowS < spawn) return;
    if (nowS < arrival) {
      stretcher.y = .8;
      transport(tunnelX, 9, targetX, z, nowS - spawn, 3.5);
    } else {
      stretcher.x = targetX; stretcher.z = z;
      stretcher.y = .12 + .68 * Math.min(1, Math.max(0, (nowS - lift) / .15));
      if (nowS >= leave) transport(targetX, z, tunnelX, 9, nowS - leave, 3);
    }
    formation(victim.team, nowS < arrival || nowS >= lift, nowS < arrival ? nowS - spawn : nowS - arrival);
    if (nowS >= load) {
      victim.x = stretcher.x; victim.z = stretcher.z; victim.y = stretcher.y + .05;
      // Die Seitenansicht hält den liegenden Billboard-Körper entlang der sichtbaren Trage.
      victim.facing = victim.team === 'off' ? Math.PI : 0;
    }
    if (nowS >= leave + distance / 3) {
      victim.x = stretcher.x = tunnelX; victim.z = stretcher.z = 9;
      victim.visible = stretcher.visible = false;
      medics.forEach(m => { m.visible = false; });
      cheers.delete(victim.id); faint = null; faintPosition = null;
    }
  }
  return state;
}
