import type { MoveId } from '../figure/moves';
import { MOVES, moveFrames } from '../figure/moves';
import { buildFinishFlight } from '../shot/finish-path';
import { bankWindow, effectiveZones, MAX_FILL, resolveShot } from '../shot/resolve';
import type { BankWindow, ShotParams, ShotResult, Zones } from '../shot/resolve';
import { buildFlight, targetPoint } from '../shot/trajectory';
import type { Flight, Vec3 } from '../shot/trajectory';
import { finishBanner, finishKind, foulChance, freeThrowCount, meterDuration, shotKindAt, verdict, zoneFactor } from './finish';
import type { ShotKind } from './finish';
import { passTime, stealChance } from './pass';
import { positionValue } from './position';
import type { Vec2 } from './position';
import { ACTORS } from './teams';
import type { Activity, Option, Play, Segment, Variant, Waypoint } from './types';

export type Phase = 'intro' | 'running' | 'decision' | 'passing' | 'receiving' | 'driving' | 'takeoff' | 'combo' | 'ballflight' | 'freethrows' | 'ended';
export interface EngineConfig {
  /** Korbleger/Dunk nach dem Ziehen per Pfeil-Meter (ein Tipp) statt Halten + Wischen */ finishArrow?: boolean;
  /** Spielsekunden vor Wegende, ab denen schon entschieden werden darf (Entscheiden im Laufen) */ decisionLead?: number;
  slowmo: number; decisionS: number; animSpeed: number; foulMult: number; zoneFloor: number; tempoSpread: number;
  passDelayMax?: number; closeoutRandom?: number; // alte Aufrufe: 0,6 s und kein zusätzlicher Zufall
  shot: { meterMs: number; greenZone: number; aimDeg: number; influence: number };
  finish: { meterMs: number; greenZone: number; aimDeg: number };
}
export interface ActorState { id: string; pos: Vec2; y: number; facing: number; move: MoveId; moveT: number; moveSide?: number }
export interface ArrowMeter {
  kind: 'alleyoop' | 'catchshoot' | 'finish'; startTime: number; meterMs: number; zones: Zones;
  bankWindow: BankWindow | null;
  fill: number | null; // null = läuft; nach dem Loslassen bleibt der Füllstand stehen
  feedback: FinishFeedback | null;
}
export type FinishFeedback = 'PERFEKT' | 'ZU FRÜH' | 'ZU SPÄT' | 'ZU LANGSAM';
export interface PlayState {
  play: Play; variant: string; deficit: number; phase: Phase; gameT: number; clock: number; handler: string;
  actors: Record<string, ActorState>; ball: Vec3; points: number; assisted: boolean; turnovers: number;
  combo: null | { kind: ShotKind; P: number; meterMs: number; zones: Zones; fouled: boolean; bankWindow: BankWindow | null };
  freeThrows: null | { shooter: string; left: number }; banner: string | null; verdict: string | null; fingerDown: boolean;
  realTime: number; arrowMeter: ArrowMeter | null; // pausierbare Echtzeit in Sekunden
  poster: { defender: string; startedAt: number } | null;
}
export type Command = { kind: 'pass'; to: string; quality?: number } | { kind: 'drive'; lane: -1 | 0 | 1 } | { kind: 'comboStart' }
  | { kind: 'comboRelease'; holdMs: number; angleDeg: number } | { kind: 'finger'; down: boolean } | { kind: 'tap' };
export type EngineEvent = { type: 'decision'; options: Option[] } | { type: 'pass'; from: string; to: string; steal: boolean }
  | { type: 'caught'; by: string } | { type: 'takeoff'; kind: 'layup' | 'dunk' | 'contact_dunk' }
  | { type: 'pocket'; quality: number }
  | { type: 'arrowStart'; kind: ArrowMeter['kind'] } | { type: 'arrowTap'; fill: number } | { type: 'arrowEnd' }
  | { type: 'combo'; fouled: boolean; contact: boolean } | { type: 'result'; banner: string; made: boolean }
  | { type: 'freethrow'; left: number } | { type: 'end'; verdict: string };

interface Pass {
  option: Option; from: Vec3; to: Vec3; catchPos: Vec2; duration: number; elapsed: number; stolenBy?: string;
  quality: number; startOffset: number; endOffset: number;
  style: 'normal' | 'bounce' | 'overhead';
}
interface Reception {
  quality: number; delay: number; elapsed: number; offset: Vec3;
  closeout?: { id: string; from: Vec2; distance: number; start: number; end: number };
}
interface Drive { from: Vec2; to: Vec2; duration: number; elapsed: number; lane: -1 | 0 | 1 }
interface Shot {
  result: ShotResult; kind: ShotKind; fouled: boolean; ft: boolean; elapsed: number; delay: number;
  flight?: Flight; from: Vec2; defender?: string; defenderFrom?: Vec2;
  lob: boolean; timedOut: boolean;
}
interface ComboData { combo: NonNullable<PlayState['combo']>; params: ShotParams; foulRoll: number }
interface ArrowInput { holdMs: number; P: number }
interface Runtime {
  segment: Segment; variant: Variant; segT: number; phaseT: number; realT: number; aiSelected: Option | null;
  clockStarted: boolean; pass?: Pass; drive?: Drive; shot?: Shot; params?: ShotParams;
  offsets: Record<string, Vec2>;
  lob?: boolean;
  reception?: Reception;
  comboWait?: { phase: 'decision' | 'takeoff' | 'freethrows'; elapsed: number };
  arrow?: ComboData & { tapped?: ArrowInput; timedOut?: boolean };
  comboMove?: MoveId;
  celebration?: { from: Record<string, Vec2>; elapsed: number };
}
// Laufzeitdetails gehören zu genau diesem Zustand, ohne das öffentliche Datenformat zu erweitern.
const runtimes = new WeakMap<PlayState, Runtime>();
const poses = Object.fromEntries(Object.keys(MOVES).map(id => [id, moveFrames(id as MoveId)])) as Record<MoveId, ReturnType<typeof moveFrames>>;
const facingTo = (from: Vec2, to: Vec2) => Math.atan2(to.x - from.x, -(to.z - from.z));
const distance = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.z - b.z);
const mix = (a: number, b: number, f: number) => a + (b - a) * f;
const rt = (s: PlayState) => runtimes.get(s)!;
const defenders = (s: PlayState) => Object.values(s.actors).filter(a => ACTORS[a.id].team === 'def');
const currentP = (s: PlayState) => positionValue(s.actors[s.handler].pos, defenders(s).map(a => a.pos));

function point(path: Waypoint[], time: number): Waypoint {
  const index = path.findIndex(p => p.t > time);
  if (index < 0) return path[path.length - 1];
  if (index === 0) return path[0];
  const a = path[index - 1], b = path[index], f = (time - a.t) / (b.t - a.t);
  return { t: time, x: mix(a.x, b.x, f), z: mix(a.z, b.z, f), act: a.act };
}

function frame(a: ActorState): number {
  const m = MOVES[a.move], n = Math.floor((a.moveT + 1e-10) * m.fps);
  return m.loop ? n % m.frames : Math.min(n, m.frames - 1);
}

function hand(a: ActorState): Vec3 {
  return jointPosition(a, MOVES[a.move].ballHand ?? 'haR');
}

function jointPosition(a: ActorState, joint: 'head' | 'haL' | 'haR'): Vec3 {
  const h = poses[a.move][frame(a)][joint];
  const size = ACTORS[a.id].heightM, co = Math.cos(a.facing), si = Math.sin(a.facing);
  const x = h.x * (a.moveSide ?? 1);
  return { x: a.pos.x + size * (x * co + h.z * si), y: a.y + size * h.y,
    z: a.pos.z + size * (x * si - h.z * co) };
}

/** Tatsächlicher Kopf der aktuellen Pose, auch beim liegenden Verteidiger. */
export function actorHead(a: ActorState): Vec3 { return jointPosition(a, 'head'); }

function heldBall(s: PlayState): void {
  const a = s.actors[s.handler];
  s.ball = hand(a);
  const reception = rt(s).reception;
  if (s.phase === 'receiving' && reception) {
    const f = 1 - Math.min(1, reception.elapsed / reception.delay);
    s.ball.x += reception.offset.x * f;
    s.ball.y += reception.offset.y * f;
    s.ball.z += reception.offset.z * f;
  }
  if (a.move === 'dribble' || a.move === 'dribble_run') {
    const beat = Math.abs(Math.cos(a.moveT * MOVES[a.move].fps / MOVES[a.move].frames * Math.PI * 2));
    s.ball.y = .12 + (s.ball.y - .12) * beat;
  }
  if (['crossover', 'behind_back', 'spin_move', 'hesitation'].includes(a.move)) {
    const beat = Math.abs(Math.cos(Math.min(1, a.moveT / .4) * Math.PI));
    s.ball.y = .12 + (s.ball.y - .12) * beat;
  }
}

function move(a: ActorState, id: MoveId, reset = false): void {
  if (a.move !== id || reset) a.moveT = 0;
  if (a.move !== id) a.moveSide = undefined;
  a.move = id;
}

function phase(s: PlayState, next: Phase): void {
  s.phase = next;
  rt(s).phaseT = rt(s).realT = 0;
}

function activityMove(act: Activity, moving: boolean): MoveId {
  if (act === 'dribble') return moving ? 'dribble_run' : 'dribble';
  if (act === 'defend') return 'defend';
  return moving && act === 'run' ? 'run' : 'idle';
}

function updatePaths(s: PlayState, previous: number): void {
  const r = rt(s), paths = { ...r.segment.paths, ...r.variant.defPaths[r.segment.id] };
  for (const a of Object.values(s.actors)) {
    if (a.move === 'knocked_down') continue;
    if (s.freeThrows || (['receiving', 'driving', 'ballflight', 'combo', 'takeoff'].includes(s.phase) && a.id === s.handler)
      || (s.phase === 'receiving' && a.id === r.reception?.closeout?.id)
      || (s.phase === 'ballflight' && a.id === r.shot?.defender)) continue;
    const path = paths[a.id];
    if (!path?.length) continue;
    const p = point(path, r.segT), before = point(path, Math.max(0, r.segT - .01));
    const moving = distance(p, before) > 1e-8;
    if (r.segT === 0 || previous < path[path.length - 1].t) {
      const off = r.offsets[a.id] ?? { x: 0, z: 0 };
      a.pos = { x: p.x + off.x, z: p.z + off.z };
    }
    if (s.phase === 'passing' && (a.id === s.handler || a.id === r.pass?.option.to || a.id === r.pass?.stolenBy)) continue;
    if (a.move === 'catch' && a.moveT < MOVES.catch.frames / MOVES.catch.fps) continue;
    move(a, activityMove(p.act, moving));
    a.facing = moving ? facingTo(before, p) : facingTo(a.pos,
      ACTORS[a.id].team === 'def' ? s.actors[s.handler].pos : { x: 0, z: 0 });
  }
}

function end(s: PlayState, events: EngineEvent[], banner?: string): void {
  if (s.phase === 'ended') return;
  if (banner) s.banner = banner;
  phase(s, 'ended');
  s.combo = null;
  clearArrow(s, events);
  s.freeThrows = null;
  s.fingerDown = false;
  s.verdict = verdict(s.points, s.deficit);
  const h = s.actors[s.handler];
  if (s.verdict === 'GAMEWINNER' || s.verdict === 'OVERTIME') {
    move(h, 'celebrate', true);
    rt(s).celebration = { elapsed: 0, from: {} };
    for (const a of Object.values(s.actors)) if (a.id !== h.id && ACTORS[a.id].team === 'off') {
      rt(s).celebration!.from[a.id] = { ...a.pos };
      move(a, 'run', true); a.facing = facingTo(a.pos, h.pos);
    }
  } else if (banner === 'STEAL' || banner === 'ZEIT ABGELAUFEN' || rt(s).shot?.result.made !== true) {
    h.y = 0; move(h, 'dejected', true);
  }
  events.push({ type: 'end', verdict: s.verdict });
}

function miss(s: PlayState, events: EngineEvent[], banner: string): void {
  s.banner = banner;
  events.push({ type: 'result', banner, made: false });
  end(s, events);
}

function decisionOptions(s: PlayState): Option[] {
  const options: Option[] = [...(rt(s).segment.options ?? [{ kind: 'shoot' }, { kind: 'drive' }])];
  for (const a of Object.values(s.actors)) {
    if (ACTORS[a.id].team === 'off' && a.id !== s.handler && !options.some(o => o.kind === 'pass' && o.to === a.id)) {
      options.push({ kind: 'pass', to: a.id });
    }
  }
  return options;
}

function decision(s: PlayState, events: EngineEvent[]): void {
  phase(s, 'decision');
  rt(s).aiSelected = null;
  events.push({ type: 'decision', options: decisionOptions(s) });
}

export function createPlayState(play: Play, _cfg: EngineConfig, rng: () => number): PlayState {
  const total = play.variants.reduce((sum, v) => sum + v.weight, 0);
  let pick = rng() * total;
  const variant = play.variants.find(v => (pick -= v.weight) < 0) ?? play.variants[play.variants.length - 1];
  const segment = play.segments[play.start];
  const deficit = typeof play.deficit === 'number' ? play.deficit
    : play.deficit[0] + Math.min(play.deficit[1] - play.deficit[0], Math.floor(rng() * (play.deficit[1] - play.deficit[0] + 1)));
  const s: PlayState = {
    play, variant: variant.id, deficit, phase: 'intro', gameT: 0, clock: play.clockS, handler: segment.handler,
    actors: {}, ball: { x: 0, y: 0, z: 0 }, points: 0, assisted: false, turnovers: 0,
    combo: null, freeThrows: null, banner: null, verdict: null, fingerDown: false, realTime: 0, arrowMeter: null, poster: null,
  };
  runtimes.set(s, { segment, variant, segT: 0, phaseT: 0, realT: 0, aiSelected: null, clockStarted: !play.inboundBy, offsets: {} });
  for (const id of play.actors) {
    const p = (variant.defPaths[segment.id]?.[id] ?? segment.paths[id])?.[0];
    s.actors[id] = { id, pos: { x: p?.x ?? 0, z: p?.z ?? 0 }, y: 0, facing: 0, move: 'idle', moveT: 0 };
  }
  updatePaths(s, -1);
  heldBall(s);
  return s;
}

function predicted(s: PlayState, id: string, ahead: number): Vec2 {
  const r = rt(s), path = r.variant.defPaths[r.segment.id]?.[id] ?? r.segment.paths[id];
  if (!path?.length || path[path.length - 1].t <= r.segT) return s.actors[id].pos;
  const p = point(path, r.segT + ahead), off = r.offsets[id] ?? { x: 0, z: 0 };
  return { x: p.x + off.x, z: p.z + off.z };
}

function catchPoint(s: PlayState, id: string): { pos: Vec2; duration: number } {
  const from = s.actors[s.handler].pos;
  let duration = passTime(distance(from, s.actors[id].pos));
  for (let i = 0; i < 20; i++) duration = passTime(distance(from, predicted(s, id, duration)));
  return { pos: predicted(s, id, duration), duration };
}

function takeoffPoint(from: Vec2, lane = 0): Vec2 {
  const len = Math.hypot(from.x, from.z) || 1, ux = from.x / len, uz = from.z / len;
  return { x: ux * 1.2 + uz * lane, z: uz * 1.2 - ux * lane };
}

/** Grober Timing-/Richtungshinweis zum letzten Wurf oder Abschluss (z. B. „etwas zu spät“) */
export function lastHint(s: PlayState): string {
  return rt(s).shot?.result.hint ?? '';
}

export function aiChoice(s: PlayState): Option {
  const options = decisionOptions(s);
  const rank = { shoot: 0, drive: 1, pass: 2 };
  const value = (o: Option): number => {
    if (o.kind === 'shoot') return currentP(s);
    const from = s.actors[s.handler].pos;
    const target = o.kind === 'drive' ? { pos: takeoffPoint(from), duration: Math.max(1, distance(from, takeoffPoint(from)) / 8) }
      : catchPoint(s, o.to!);
    return positionValue(target.pos, defenders(s).map(a => predicted(s, a.id, target.duration)));
  };
  return [...options].sort((a, b) => value(a) - value(b) || rank[a.kind] - rank[b.kind])[0];
}

function comboData(s: PlayState, kind: ShotKind, P: number, cfg: EngineConfig, rng: () => number,
  actor = s.handler, pos = s.actors[actor].pos, lobQuality?: number): ComboData {
  const ft = s.freeThrows !== null, finishing = kind !== 'jump2' && kind !== 'three';
  const foulRoll = ft ? 1 : rng(), fouled = !ft && foulRoll < foulChance(kind, P, cfg.foulMult);
  const base = finishing ? cfg.finish : cfg.shot;
  const meterMs = ft ? base.meterMs : meterDuration(base.meterMs, P, cfg.tempoSpread, rng);
  const a = ACTORS[actor];
  const params = { ...base, meterMs, influence: cfg.shot.influence,
    rating: finishing ? a.athleticism : a.shot,
    distance: finishing ? 4.6 : distance(pos, { x: 0, z: 0 }),
    bankAngleDeg: Math.atan2(Math.abs(pos.x), pos.z) * 180 / Math.PI,
    zoneFactor: ft ? 1 : zoneFactor(P, cfg.zoneFloor, fouled, kind === 'contact_dunk')
      * (lobQuality === undefined ? 1 : .75 + .25 * lobQuality) };
  return { params, combo: { kind, P, meterMs, zones: effectiveZones(params), fouled, bankWindow: bankWindow(params) }, foulRoll };
}

function prepareCombo(s: PlayState, kind: ShotKind, P: number, cfg: EngineConfig, rng: () => number, events: EngineEvent[]): void {
  const data = comboData(s, kind, P, cfg, rng);
  rt(s).params = data.params;
  s.combo = data.combo;
  rt(s).comboMove = shotMove(s, kind, P, rng);
  move(s.actors[s.handler], rt(s).comboMove!, true);
  s.actors[s.handler].facing = facingTo(s.actors[s.handler].pos, { x: 0, z: 0 });
  events.push({ type: 'combo', fouled: data.combo.fouled, contact: kind === 'contact_dunk' });
  heldBall(s);
}

/** Nur die Darstellung wählen; Ergebnis, Fouls und Zonen nutzen weiterhin ShotKind. */
function shotMove(s: PlayState, kind: ShotKind, P: number, rng: () => number): MoveId {
  const r = rt(s), h = s.actors[s.handler];
  if (kind === 'contact_dunk') return 'contact_dunk';
  if (kind === 'dunk') return (['dunk', 'tomahawk_dunk', 'two_hand_dunk'] as const)[Math.min(2, Math.floor(rng() * 3))];
  if (kind === 'layup') {
    const d = r.lob ? undefined : r.drive;
    if (d && (Math.abs(d.from.x) > 5 || (Math.abs(d.to.x) < .6 && d.from.x * d.to.x < 0))) return 'reverse_layup';
    return P >= .7 ? 'finger_roll' : P >= .35 ? 'euro_step' : 'layup';
  }
  if (!s.freeThrows && defenders(s).some(a => distance(a.pos, h.pos) < 1.5)) {
    return Math.hypot(h.pos.x, h.pos.z) >= 4 ? 'step_back' : 'fadeaway';
  }
  return 'jumpshot';
}

function clearArrow(s: PlayState, events: EngineEvent[]): void {
  if (s.arrowMeter) events.push({ type: 'arrowEnd' });
  s.arrowMeter = null;
  rt(s).arrow = undefined;
}

function startArrow(s: PlayState, kind: ArrowMeter['kind'], startTime: number, data: ComboData, events: EngineEvent[]): void {
  rt(s).arrow = data;
  s.arrowMeter = { kind, startTime, meterMs: data.combo.meterMs, zones: data.combo.zones,
    bankWindow: data.combo.bankWindow, fill: null, feedback: null };
  events.push({ type: 'arrowStart', kind });
  if (kind === 'alleyoop') events.push({ type: 'combo', fouled: data.combo.fouled, contact: data.combo.kind === 'contact_dunk' });
}

function refreshCatchArrow(s: PlayState, P: number, cfg: EngineConfig): void {
  const a = rt(s).arrow!, c = a.combo;
  c.kind = shotKindAt(s.actors[s.handler].pos);
  c.P = P;
  c.fouled = a.foulRoll < foulChance(c.kind, P, cfg.foulMult);
  a.params.distance = distance(s.actors[s.handler].pos, { x: 0, z: 0 });
  const pos = s.actors[s.handler].pos;
  a.params.bankAngleDeg = Math.atan2(Math.abs(pos.x), pos.z) * 180 / Math.PI;
  a.params.zoneFactor = zoneFactor(P, cfg.zoneFloor, c.fouled, false);
  c.zones = effectiveZones(a.params);
  c.bankWindow = bankWindow(a.params);
  s.arrowMeter!.zones = c.zones;
  s.arrowMeter!.bankWindow = c.bankWindow;
}

function arrowInput(s: PlayState): ArrowInput | undefined {
  const m = s.arrowMeter;
  if (!m || m.fill !== null || s.realTime < m.startTime || s.realTime >= m.startTime + m.meterMs * MAX_FILL / 1000
    || (s.clock <= 0 && m.kind === 'catchshoot')) return;
  return { holdMs: (s.realTime - m.startTime) * 1000, P: currentP(s) };
}

function tapArrow(s: PlayState, cfg: EngineConfig, rng: () => number, events: EngineEvent[]): void {
  const m = s.arrowMeter, a = rt(s).arrow;
  if (!m || !a || m.fill !== null) return;
  const input = arrowInput(s);
  if (!input) return;
  a.tapped = input;
  m.fill = Math.min(MAX_FILL, input.holdMs / m.meterMs);
  if (m.kind !== 'catchshoot') {
    const result = resolveShot({ holdMs: input.holdMs, angleDeg: 0 }, a.params, () => 1);
    m.feedback = Math.abs(result.t) <= 1 + 1e-9 ? 'PERFEKT' : result.t < -1 ? 'ZU FRÜH' : 'ZU SPÄT';
  }
  events.push({ type: 'arrowTap', fill: m.fill });
  if (m.kind === 'catchshoot') {
    refreshCatchArrow(s, input.P, cfg);
    s.combo = a.combo; rt(s).params = a.params;
    events.push({ type: 'combo', fouled: a.combo.fouled, contact: false });
  }
  if (s.phase !== 'passing') startShot(s, { holdMs: input.holdMs, angleDeg: 0 }, rng);
}

function timeoutFinishArrow(s: PlayState, rng: () => number, events: EngineEvent[]): void {
  const m = s.arrowMeter!, data = rt(s).arrow!;
  m.fill = MAX_FILL;
  m.feedback = 'ZU LANGSAM';
  data.timedOut = true;
  data.tapped = { holdMs: m.meterMs * MAX_FILL, P: data.combo.P };
  events.push({ type: 'arrowTap', fill: MAX_FILL });
  if (s.phase !== 'passing') startShot(s, { holdMs: data.tapped.holdMs, angleDeg: 0 }, rng);
}

function catchLob(s: PlayState, rng: () => number, events: EngineEvent[]): void {
  const r = rt(s), data = r.arrow!, a = s.actors[s.handler];
  phase(s, 'takeoff');
  r.lob = true;
  r.params = data.params; s.combo = data.combo;
  const kind = data.combo.kind as 'layup' | 'dunk' | 'contact_dunk';
  r.comboMove = shotMove(s, kind, data.combo.P, rng);
  move(a, r.comboMove, true);
  a.facing = facingTo(a.pos, { x: 0, z: 0 });
  a.y = Math.max(.35, 3.05 - (hand(a).y - a.y));
  events.push({ type: 'takeoff', kind });
  heldBall(s);
  if (data.tapped) startShot(s, { holdMs: data.tapped.holdMs, angleDeg: 0 }, rng);
}

function takeoff(s: PlayState, cfg: EngineConfig, rng: () => number, events: EngineEvent[]): void {
  const P = currentP(s), kind = finishKind(ACTORS[s.handler].athleticism, P, rng);
  phase(s, 'takeoff');
  rt(s).lob = false;
  events.push({ type: 'takeoff', kind });
  prepareCombo(s, kind, P, cfg, rng, events);
  const a = s.actors[s.handler];
  a.y = .06;
  heldBall(s);
  if (cfg.finishArrow) startArrow(s, 'finish', s.realTime, { params: rt(s).params!, combo: s.combo!, foulRoll: 1 } as ComboData, events);
}

function nextSegment(s: PlayState, option: Option): void {
  const r = rt(s), next = option.next && s.play.segments[option.next];
  if (!next) {
    // Ohne Fortsetzung laufen die bisherigen Wege mit ihrem Zeitstand und Versatz zu Ende.
    r.segment = { id: 'received', handler: option.to!,
      paths: { ...r.segment.paths, ...r.variant.defPaths[r.segment.id] },
      decisionAt: .4, options: [{ kind: 'shoot' }, { kind: 'drive' }] };
    return;
  }
  r.segment = next;
  r.segT = 0;
  r.offsets = {};
  // Bewegte Empfänger bleiben am tatsächlichen Fangpunkt; Fortsetzungen sind relativ dazu.
  for (const [id, path] of Object.entries(r.segment.paths)) {
    const a = s.actors[id];
    if (a && path.length) r.offsets[id] = { x: a.pos.x - path[0].x, z: a.pos.z - path[0].z };
  }
}

function catchOffset(a: ActorState, quality: number): Vec3 {
  // Seitlich und tief statt in der Pocket; Länge maximal 0,5 m.
  return { x: Math.cos(a.facing) * .3 * (1 - quality), y: -.4 * (1 - quality),
    z: Math.sin(a.facing) * .3 * (1 - quality) };
}

function startPass(s: PlayState, option: Option, quality: number, cfg: EngineConfig, rng: () => number, events: EngineEvent[]): void {
  const r = rt(s), catcher = s.actors[option.to!], target = catchPoint(s, catcher.id), h = s.actors[s.handler];
  // Steals nur bei abgefangenen Pässen: einmal beim Abspiel nach Passweg und Genauigkeit würfeln.
  const steal = rng() < stealChance(h.pos, target.pos, defenders(s).map(a => a.pos), quality);
  r.comboMove = undefined; r.drive = undefined;
  const dx = target.pos.x - h.pos.x, dz = target.pos.z - h.pos.z, len2 = dx * dx + dz * dz;
  const laneDistance = (a: ActorState) => {
    const f = Math.max(0, Math.min(1, ((a.pos.x - h.pos.x) * dx + (a.pos.z - h.pos.z) * dz) / (len2 || 1)));
    return distance(a.pos, { x: h.pos.x + f * dx, z: h.pos.z + f * dz });
  };
  const style: Pass['style'] = option.lob || Math.sqrt(len2) > 9 ? 'overhead'
    : Math.sqrt(len2) < 6 && defenders(s).some(a => laneDistance(a) < 1.5) ? 'bounce' : 'normal';
  let stolenBy: string | undefined;
  if (steal) {
    stolenBy = defenders(s).sort((a, b) => laneDistance(a) - laneDistance(b))[0]?.id;
  }
  h.facing = facingTo(h.pos, target.pos);
  move(h, style === 'bounce' ? 'pass_bounce' : style === 'overhead' ? 'pass_overhead' : 'pass', true);
  move(catcher, 'catch', true);
  catcher.facing = facingTo(target.pos, h.pos);
  const receiving = stolenBy ? s.actors[stolenBy] : catcher;
  if (stolenBy) { move(receiving, 'catch', true); receiving.facing = facingTo(receiving.pos, h.pos); }
  const catchPose = { ...receiving, pos: stolenBy ? receiving.pos : target.pos, moveT: 0 };
  if (option.lob && !stolenBy) catchPose.y = Math.max(.35, 3.05 - (hand(catchPose).y - catchPose.y));
  const to = hand(catchPose), offset = catchOffset(catchPose, stolenBy ? 1 : quality);
  const random = cfg.closeoutRandom ?? 0;
  r.pass = { option, quality, style, from: hand(h), to: { x: to.x + offset.x, y: to.y + offset.y, z: to.z + offset.z }, catchPos: target.pos,
    duration: target.duration, elapsed: 0, stolenBy,
    startOffset: !steal && random > 0 ? (rng() * 2 - 1) * .3 * random : 0,
    endOffset: !steal && random > 0 ? (rng() * 2 - 1) * .6 * random : 0 };
  phase(s, 'passing');
  s.ball = { ...r.pass.from };
  events.push({ type: 'pass', from: s.handler, to: catcher.id, steal });
  if (option.lob && !steal) {
    const P = positionValue(target.pos, defenders(s).map(a => predicted(s, a.id, target.duration)));
    const kind = finishKind(ACTORS[catcher.id].athleticism, P, rng);
    const data = comboData(s, kind, P, cfg, rng, catcher.id, target.pos, quality);
    const catchTime = s.realTime + target.duration / cfg.animSpeed;
    startArrow(s, 'alleyoop', Math.max(s.realTime, catchTime - data.combo.meterMs / 1000), data, events);
  }
}

function updateCloseout(s: PlayState): void {
  const reception = rt(s).reception!, c = reception.closeout;
  if (!c) return;
  // 3 m/s auf der Verbindung zum Empfänger; negativer Startversatz = schon beim Fang unterwegs.
  const remaining = Math.min(c.distance, Math.max(c.end,
    c.distance - 3 * Math.max(0, reception.elapsed - c.start)));
  const a = s.actors[c.id], target = s.actors[s.handler].pos;
  const f = c.distance ? remaining / c.distance : 0;
  a.pos = { x: target.x + (c.from.x - target.x) * f, z: target.z + (c.from.z - target.z) * f };
  a.facing = facingTo(a.pos, target);
  move(a, 'defend');
}

function receptionReady(s: PlayState, cfg: EngineConfig, rng: () => number, events: EngineEvent[]): void {
  const r = rt(s), reception = r.reception!, c = reception.closeout;
  // Anschließende Datenwege setzen am tatsächlichen Ende des Closeouts an.
  if (c) {
    const path = r.variant.defPaths[r.segment.id]?.[c.id] ?? r.segment.paths[c.id];
    if (path?.length) {
      const p = point(path, r.segT), a = s.actors[c.id];
      r.offsets[c.id] = { x: a.pos.x - p.x, z: a.pos.z - p.z };
    }
  }
  r.reception = undefined;
  decision(s, events);
  if ((r.segment.options ?? [{ kind: 'shoot' }]).some(o => o.kind === 'shoot')) {
    const data = comboData(s, shotKindAt(s.actors[s.handler].pos), currentP(s), cfg, rng);
    startArrow(s, 'catchshoot', s.realTime, data, events);
  }
  heldBall(s);
}

function startShot(s: PlayState, input: { holdMs: number; angleDeg: number }, rng: () => number): void {
  const r = rt(s), combo = s.combo!, result = resolveShot(input, r.params!, rng), h = s.actors[s.handler];
  const finishing = combo.kind !== 'jump2' && combo.kind !== 'three';
  const id: MoveId = finishing && r.comboMove ? r.comboMove : shotMove(s, combo.kind, combo.P, rng);
  move(h, id, true);
  const nearest = !s.freeThrows && defenders(s).sort((a, b) => distance(a.pos, h.pos) - distance(b.pos, h.pos))[0];
  const defender = nearest && distance(nearest.pos, h.pos) < 2.5 ? nearest : undefined;
  if (defender) {
    move(defender, combo.kind === 'contact_dunk' ? result.made ? 'block_jump_hit' : 'block_jump'
      : combo.fouled ? 'contact' : 'block_jump', true);
    defender.facing = facingTo(defender.pos, h.pos);
  }
  r.shot = { result, kind: combo.kind, fouled: combo.fouled, ft: s.freeThrows !== null,
    elapsed: 0, delay: combo.kind === 'contact_dunk' && !result.made ? .3
      : finishing || id === 'step_back' || id === 'fadeaway' ? ((MOVES[id].rimFrame ?? 2) + 1) / MOVES[id].fps : .2,
    from: { ...h.pos }, defender: defender?.id, defenderFrom: defender && { ...defender.pos }, lob: r.lob ?? false,
    timedOut: r.arrow?.timedOut ?? false };
  phase(s, 'ballflight');
  heldBall(s);
}

export function command(s: PlayState, cmd: Command, cfg: EngineConfig, rng: () => number): EngineEvent[] {
  const events: EngineEvent[] = [], r = rt(s);
  if (s.phase === 'ended') return events;
  if (cmd.kind === 'finger') {
    if (!cmd.down && s.fingerDown && s.phase === 'combo' && r.comboWait) {
      const wait = r.comboWait, elapsed = wait.elapsed + r.realT;
      phase(s, wait.phase);
      r.realT = elapsed;
      if (wait.phase !== 'takeoff') {
        s.combo = null;
        move(s.actors[s.handler], wait.phase === 'decision' ? 'dribble' : 'idle');
      }
      heldBall(s);
    }
    s.fingerDown = cmd.down;
    return events;
  }
  if (cmd.kind === 'tap') { tapArrow(s, cfg, rng, events); return events; }
  if (s.arrowMeter && (cmd.kind === 'comboStart' || cmd.kind === 'comboRelease')) return events;
  if (s.phase === 'intro' || s.phase === 'running' || s.phase === 'passing' || s.phase === 'receiving' || s.phase === 'driving' || s.phase === 'ballflight') return events;
  if (s.phase === 'decision' && r.aiSelected) {
    const selected = r.aiSelected;
    if ((cmd.kind === 'pass' && (selected.kind !== 'pass' || selected.to !== cmd.to))
      || (cmd.kind === 'drive' && selected.kind !== 'drive')
      || (cmd.kind === 'comboStart' && selected.kind !== 'shoot')) return events;
  }
  const finishing = s.combo && s.combo.kind !== 'jump2' && s.combo.kind !== 'three';
  // Nur ein begonnener Abschluss und Freiwürfe dürfen nach Ablauf noch ausgewertet werden.
  if (s.clock <= 0 && !s.freeThrows && !(finishing && (s.phase === 'takeoff' || s.phase === 'combo'))) {
    end(s, events, 'ZEIT ABGELAUFEN'); return events;
  }
  if (cmd.kind === 'comboRelease') {
    if ((s.phase === 'combo' || s.phase === 'takeoff') && s.combo) startShot(s, cmd, rng);
    return events;
  }
  if (cmd.kind === 'comboStart') {
    if (s.phase === 'combo') return events;
    if (s.phase === 'takeoff') {
      r.comboWait = { phase: 'takeoff', elapsed: r.realT };
      phase(s, 'combo'); return events;
    }
    if (s.phase === 'freethrows' || (s.phase === 'decision' && (r.segment.options ?? [{ kind: 'shoot' }]).some(o => o.kind === 'shoot'))) {
      r.comboWait = { phase: s.phase, elapsed: r.realT };
      phase(s, 'combo');
      prepareCombo(s, shotKindAt(s.actors[s.handler].pos), s.freeThrows ? 1 : currentP(s), cfg, rng, events);
    }
    return events;
  }
  if (s.phase !== 'decision' || s.combo) return events;
  if (cmd.kind === 'pass') {
    const option = decisionOptions(s).find(o => o.kind === 'pass' && o.to === cmd.to);
    if (option && s.actors[cmd.to]) {
      clearArrow(s, events);
      startPass(s, option, Math.max(0, Math.min(1, cmd.quality ?? 1)), cfg, rng, events);
    }
  } else if (cmd.kind === 'drive' && (r.segment.options ?? [{ kind: 'drive' }]).some(o => o.kind === 'drive')) {
    clearArrow(s, events);
    const h = s.actors[s.handler], to = takeoffPoint(h.pos, cmd.lane);
    r.drive = { from: { ...h.pos }, to, duration: Math.max(1, distance(h.pos, to) / 8), elapsed: 0, lane: cmd.lane };
    r.comboMove = undefined;
    phase(s, 'driving');
    const driveMove = cmd.lane === 0 ? rng() < .5 ? 'hesitation' : 'spin_move'
      : rng() < .5 ? 'crossover' : 'behind_back';
    move(h, driveMove, true);
    if (cmd.lane) h.moveSide = cmd.lane === -1 ? 1 : -1;
    h.facing = facingTo(h.pos, to);
    heldBall(s);
  }
  return events;
}

// Freiwurf-Aufstellung: Schütze an der Linie, alle anderen abwechselnd links/rechts am Zonenrand
function lineUp(s: PlayState, dtReal: number): void {
  const shooter = s.freeThrows!.shooter;
  let i = 0;
  for (const a of Object.values(s.actors)) {
    if (a.move === 'knocked_down') continue;
    const to = a.id === shooter ? { x: 0, z: 4.2 } : { x: i % 2 ? 2.75 : -2.75, z: 1.2 + Math.floor(i / 2) * 0.6 };
    if (a.id !== shooter) i++;
    const d = distance(a.pos, to), stepM = 8 * dtReal;
    if (d <= stepM) {
      a.pos = to;
      a.facing = facingTo(a.pos, { x: 0, z: 0 });
      if (a.id !== shooter && a.move !== "idle") move(a, "idle", true);
    } else {
      a.facing = facingTo(a.pos, to);
      a.pos = { x: a.pos.x + (to.x - a.pos.x) * stepM / d, z: a.pos.z + (to.z - a.pos.z) * stepM / d };
      if (a.id !== shooter && a.move !== "run") move(a, "run", true);
    }
    if (a.id !== shooter) a.y = 0;
  }
}

function freeThrow(s: PlayState, events: EngineEvent[]): void {
  phase(s, 'freethrows');
  s.combo = null;
  const h = s.actors[s.freeThrows!.shooter];
  s.handler = h.id;
  h.pos = { x: 0, z: 4.2 }; // Schütze sofort an die Linie, damit die Distanz für die Zonen stimmt
  h.y = 0; h.facing = 0;
  rt(s).lob = false;
  move(h, 'idle', true);
  heldBall(s);
  events.push({ type: 'freethrow', left: s.freeThrows!.left });
}

function finishShot(s: PlayState, events: EngineEvent[]): void {
  const shot = rt(s).shot!, { result, kind, fouled, ft } = shot;
  if (result.made) s.points += ft ? 1 : kind === 'three' ? 3 : 2;
  s.banner = shot.timedOut ? kind === 'contact_dunk' ? 'GEBLOCKT' : 'VOM RING'
    : result.outcome === 'bank_in'
    ? `${!ft && s.assisted ? 'ASSIST + ' : ''}${result.banner}${!ft && fouled ? ' + AND-ONE' : ''}`
    : ft ? result.made ? 'TREFFER' : 'DANEBEN' : finishBanner(kind, result.made, fouled, s.assisted);
  events.push({ type: 'result', banner: s.banner, made: result.made });
  s.combo = null;
  clearArrow(s, events);
  for (const a of Object.values(s.actors)) {
    if (a.move === 'knocked_down') continue;
    a.y = 0; move(a, ACTORS[a.id].team === 'def' ? 'defend' : 'idle');
  }
  if (ft) {
    s.freeThrows!.left--;
    if (s.freeThrows!.left > 0) freeThrow(s, events); else end(s, events);
  } else {
    const count = shot.timedOut ? 0 : freeThrowCount(kind, result.made, fouled);
    if (count) { s.freeThrows = { shooter: s.handler, left: count }; freeThrow(s, events); }
    else end(s, events);
  }
}

function shotAnimation(s: PlayState, dt: number, events: EngineEvent[]): void {
  const shot = rt(s).shot!, a = s.actors[s.handler], m = MOVES[a.move];
  shot.elapsed += dt;
  const t = shot.elapsed;
  const blocked = shot.kind === 'contact_dunk' && !shot.result.made && shot.defender !== undefined;
  if (shot.kind === 'contact_dunk' && shot.result.made && shot.defender && !s.poster
    && t + 1e-9 >= (MOVES.contact_dunk.rimFrame! + 2) / MOVES.contact_dunk.fps) {
    const d = s.actors[shot.defender];
    d.y = 0;
    move(d, 'knocked_down', true);
    s.poster = { defender: d.id, startedAt: s.realTime };
  }
  if (t >= Math.max(1.1, shot.delay + .2) && shot.flight) {
    a.y = 0;
    move(a, 'idle');
    if (shot.defender) {
      const d = s.actors[shot.defender];
      if (d.move !== 'knocked_down') { d.y = 0; move(d, 'defend'); }
    }
    s.ball = shot.flight.at(t - shot.delay);
    if (t >= shot.delay + shot.flight.duration) finishShot(s, events);
    return;
  }
  const isDunk = shot.kind === 'dunk' || shot.kind === 'contact_dunk';
  if (isDunk && !blocked) {
    const contactT = m.rimFrame! / m.fps;
    const target = shot.result.made ? { x: 0, y: 3.05, z: 0 }
      : targetPoint(shot.result.outcome === 'airball' ? 'rim_front' : shot.result.outcome, { ...shot.from, y: 0 });
    const targetHand = poses[a.move][m.rimFrame!][m.ballHand!], size = ACTORS[a.id].heightM;
    // Bis zum Ringkontakt steigen, anschließend landen; wechselnde Handposen
    // dürfen den Fußversatz nicht schon während des Absprungs absenken.
    const jump = Math.max(0, target.y - targetHand.y * size);
    const hangUntil = m.frames / m.fps;
    a.y = jump * (t <= contactT ? t / contactT : t <= hangUntil ? 1 : Math.max(0, (1.1 - t) / (1.1 - hangUntil)));
    const co = Math.cos(a.facing), si = Math.sin(a.facing), progress = Math.min(1, t / contactT);
    a.pos = { x: mix(shot.from.x, target.x - size * (targetHand.x * co + targetHand.z * si), progress),
      z: mix(shot.from.z, target.z - size * (targetHand.x * si - targetHand.z * co), progress) };
  } else {
    a.pos = { ...shot.from };
    if (a.move === 'reverse_layup') {
      const len = Math.hypot(shot.from.x, shot.from.z) || 1;
      const f = Math.min(1, t / (m.rimFrame! / m.fps));
      a.pos = { x: mix(shot.from.x, -.55 * shot.from.x / len, f),
        z: mix(shot.from.z, -.55 * shot.from.z / len, f) };
    }
    a.y = Math.max(0, Math.sin(Math.PI * Math.min(1, t / 1.1))) * (shot.kind === 'layup' ? .35 : .25);
  }
  if (shot.fouled) a.pos.x += .12 * Math.sin(Math.PI * Math.min(1, t / 1.1));
  if (shot.defender) {
    const d = s.actors[shot.defender];
    if (blocked) d.moveT = Math.min(t, shot.delay);
    const posterContact = shot.kind === 'contact_dunk' && shot.result.made;
    if (d.move !== 'knocked_down') d.y = shot.fouled && !blocked && !posterContact ? 0
      : .3 * Math.max(0, Math.sin(Math.PI * Math.min(1, (blocked ? Math.min(t, shot.delay) : t) / .8)));
    if (posterContact && shot.defenderFrom) {
      const from = shot.defenderFrom, contactT = MOVES.contact_dunk.rimFrame! / MOVES.contact_dunk.fps;
      const push = Math.max(0, Math.min(1, (t - contactT) / .3));
      const co = Math.cos(a.facing), si = Math.sin(a.facing);
      // Vor dem Ringbild Körperkontakt, danach in Angriffsrichtung nach hinten räumen.
      const meet = Math.min(1, t / contactT);
      const contact = { x: a.pos.x + .35 * si, z: a.pos.z - .35 * co };
      d.pos = { x: mix(from.x, contact.x, meet) + .9 * si * push,
        z: mix(from.z, contact.z, meet) - .9 * co * push };
    } else if (shot.fouled && !blocked && d.move !== 'knocked_down' && shot.defenderFrom) {
      const from = shot.defenderFrom, len = distance(from, shot.from) || 1, p = Math.min(1, t / .4) * .15;
      d.pos = { x: from.x + (shot.from.x - from.x) / len * p, z: from.z + (shot.from.z - from.z) / len * p };
    }
  }
  if (t < shot.delay - 1e-9) { heldBall(s); return; }
  if (!shot.flight) {
    const release = hand(a);
    shot.flight = shot.kind === 'layup' || isDunk ? buildFinishFlight(shot.kind as 'layup' | 'dunk' | 'contact_dunk', shot.result.outcome, release, .1,
      { from: { ...shot.from, y: 0 }, block: blocked ? hand(s.actors[shot.defender!]) : undefined })
      : buildFlight(shot.result.outcome, release);
  }
  s.ball = shot.flight.at(Math.max(0, t - shot.delay));
  if (t >= shot.delay + shot.flight.duration) finishShot(s, events);
}

function tick(s: PlayState, dtReal: number, cfg: EngineConfig, rng: () => number, events: EngineEvent[]): void {
  const r = rt(s), oldPhase = s.phase;
  if (oldPhase === 'ended') {
    // Nur die Ergebnis-Animation läuft weiter; Spieluhr und Regeln sind abgeschlossen.
    s.realTime += dtReal;
    for (const a of Object.values(s.actors)) a.moveT += dtReal * cfg.animSpeed;
    const c = r.celebration;
    if (c) {
      c.elapsed = Math.min(1, c.elapsed + dtReal);
      const h = s.actors[s.handler], ids = Object.keys(c.from);
      ids.forEach((id, i) => {
        const a = s.actors[id], angle = 2 * Math.PI * i / ids.length;
        const target = { x: h.pos.x + Math.cos(angle), z: h.pos.z + Math.sin(angle) };
        a.pos = { x: mix(c.from[id].x, target.x, c.elapsed), z: mix(c.from[id].z, target.z, c.elapsed) };
        if (c.elapsed === 1) move(a, 'celebrate');
      });
    }
    return;
  }
  s.realTime += dtReal;
  const slow = oldPhase === 'decision' || oldPhase === 'combo' || oldPhase === 'takeoff';
  const dt = dtReal * cfg.animSpeed * (slow ? cfg.slowmo : 1);
  r.phaseT += dt; r.realT += dtReal;
  if (oldPhase === 'intro') {
    if (r.phaseT >= .7) phase(s, 'running');
    return;
  }
  s.gameT += dt;
  if (s.freeThrows && (oldPhase === "freethrows" || oldPhase === "combo")) { lineUp(s, dtReal); heldBall(s); }
  if (r.clockStarted && !s.freeThrows) {
    s.clock = Math.max(0, s.clock - dt);
    // Rundungsreste dürfen einen Release genau bei 0:00 nicht nachträglich erlauben.
    if (s.clock < 1e-10) s.clock = 0;
  }
  const finishing = s.combo && s.combo.kind !== 'jump2' && s.combo.kind !== 'three';
  if (s.clock <= 0 && !s.freeThrows && oldPhase !== 'ballflight' && !(finishing && (oldPhase === 'takeoff' || oldPhase === 'combo'))) {
    end(s, events, 'ZEIT ABGELAUFEN'); return;
  }
  for (const a of Object.values(s.actors)) a.moveT += dt;
  const previous = r.segT;
  r.segT += dt;
  updatePaths(s, previous);
  if (oldPhase === 'running') {
    // Entscheiden im Laufen: das Fenster öffnet schon während der letzten Wegsekunde, niemand bleibt stehen
    if (r.segT >= Math.max(0, (r.segment.decisionAt ?? 0) - (cfg.decisionLead ?? 0))) decision(s, events);
  } else if (oldPhase === 'decision' && !s.arrowMeter && r.segT + 1e-9 >= (r.segment.decisionAt ?? 0) && r.realT + 1e-9 >= cfg.decisionS && !s.fingerDown) {
    if (r.aiSelected) miss(s, events, 'ZU LANGE GEZÖGERT');
    else {
      const option = aiChoice(s);
      r.aiSelected = option;
      r.realT = 0;
      events.push({ type: 'decision', options: [option] });
      if (option.kind === 'pass') events.push(...command(s, { kind: 'pass', to: option.to!, quality: .5 }, cfg, rng));
      else if (option.kind === 'drive') events.push(...command(s, { kind: 'drive', lane: 0 }, cfg, rng));
    }
  } else if (oldPhase === 'passing') {
    const p = r.pass!;
    p.elapsed += dt;
    const f = p.elapsed + 1e-9 >= p.duration ? 1 : p.elapsed / p.duration;
    const half = f <= .5 ? f * 2 : (f - .5) * 2;
    const y = p.style === 'bounce'
      ? (f <= .5 ? mix(p.from.y, .12, half) : mix(.12, p.to.y, half)) + .12 * 4 * half * (1 - half)
      : mix(p.from.y, p.to.y, f) + (p.style === 'overhead' ? 1.5 : .35) * 4 * f * (1 - f);
    s.ball = { x: mix(p.from.x, p.to.x, f), y, z: mix(p.from.z, p.to.z, f) };
    if (f >= 1) {
      if (p.stolenBy) {
        // Nur das tatsächliche Abfangen zählt als Ballverlust, niemals Ballbesitz oder Closeout.
        s.ball = hand(s.actors[p.stolenBy]); s.turnovers++;
        end(s, events, 'STEAL');
      } else {
        s.handler = p.option.to!;
        const a = s.actors[s.handler];
        a.pos = { ...p.catchPos };
        move(a, 'catch', true);
        s.assisted = true; r.clockStarted = true;
        const nearest = defenders(s).sort((d, e) => distance(d.pos, a.pos) - distance(e.pos, a.pos))[0];
        nextSegment(s, p.option);
        events.push({ type: 'caught', by: s.handler });
        if (p.option.lob) catchLob(s, rng, events);
        else {
          r.reception = { quality: p.quality, delay: (1 - p.quality) * (cfg.passDelayMax ?? .6), elapsed: 0,
            offset: catchOffset(a, p.quality),
            closeout: nearest && (p.quality < 1 || (cfg.closeoutRandom ?? 0) > 0) ? {
              id: nearest.id, from: { ...nearest.pos }, distance: distance(nearest.pos, a.pos),
              start: p.startOffset, end: Math.max(.1, .5 + p.endOffset),
            } : undefined };
          phase(s, 'receiving');
          updateCloseout(s);
          if (r.reception.delay <= 0) receptionReady(s, cfg, rng, events);
          else heldBall(s);
        }
        events.push({ type: 'pocket', quality: p.quality });
      }
    }
  } else if (oldPhase === 'receiving') {
    const reception = r.reception!;
    reception.elapsed = Math.min(reception.delay, reception.elapsed + dt);
    updateCloseout(s);
    if (reception.elapsed + 1e-9 >= reception.delay) receptionReady(s, cfg, rng, events);
  } else if (oldPhase === 'driving') {
    const d = r.drive!, a = s.actors[s.handler];
    d.elapsed += dt;
    const f = Math.min(1, d.elapsed / d.duration);
    a.pos = { x: mix(d.from.x, d.to.x, f), z: mix(d.from.z, d.to.z, f) };
    if (d.elapsed + 1e-9 >= .4) move(a, 'dribble_run');
    if (f >= 1) takeoff(s, cfg, rng, events);
  } else if (oldPhase === 'takeoff') {
    // Nur die Wartepose einfrieren. startShot setzt Bild 0 und ballflight
    // spielt danach mit normalem Spieltempo (ohne Entscheidungs-Zeitlupe).
    s.actors[s.handler].moveT = 0;
    if (!s.arrowMeter && r.realT + 1e-9 >= cfg.decisionS && !s.fingerDown) miss(s, events, r.aiSelected ? 'ZU LANGE GEZÖGERT' : 'VERLEGT');
  } else if (oldPhase === 'combo') {
    s.actors[s.handler].moveT = 0;
    // Auch abgebrochene Kombis und Freiwürfe haben eine endliche Wartezeit.
    // Freiwürfe warten ohne Zeitlimit auf den Nutzer
    if (!s.freeThrows && r.realT >= cfg.decisionS + s.combo!.meterMs * 1.6 / 1000) miss(s, events, finishing ? 'VERLEGT' : 'ZU LANGE GEZÖGERT');
  } else if (oldPhase === 'ballflight') shotAnimation(s, dt, events);
  const meter = s.arrowMeter;
  if (meter && meter.fill === null) {
    if (meter.kind === 'catchshoot') refreshCatchArrow(s, currentP(s), cfg);
    const endTime = meter.startTime + meter.meterMs * MAX_FILL / 1000;
    // Auch ein aufliegender Finger verlängert den einmaligen Durchlauf nicht.
    if (s.realTime + 1e-9 >= endTime) {
      s.fingerDown = false;
      if (meter.kind !== 'catchshoot') timeoutFinishArrow(s, rng, events);
      else { clearArrow(s, events); decision(s, events); }
    }
  }
  if (s.phase !== 'passing' && s.phase !== 'ballflight' && s.phase !== 'ended') heldBall(s);
}

export function step(s: PlayState, dtReal: number, cfg: EngineConfig, rng: () => number): EngineEvent[] {
  const events: EngineEvent[] = [];
  if (!Number.isFinite(dtReal) || dtReal <= 0) return events;
  // Kleine Teilintervalle bewahren Ereignisreihenfolge auch nach einem langsamen Render-Frame.
  let left = dtReal;
  while (left > 1e-10) {
    const r = rt(s);
    // Jeden Pass exakt beim Fangen teilen: Fangpunkt und weiterlaufende Wege
    // müssen denselben Zeitstand haben. Die Pass-Verzögerung endet in Spielzeit.
    const boundary = s.phase === 'passing' ? (r.pass!.duration - r.pass!.elapsed) / cfg.animSpeed
      : s.phase === 'receiving' ? (r.reception!.delay - r.reception!.elapsed) / cfg.animSpeed : Infinity;
    const dt = Math.min(left, 1 / 120, boundary > 1e-10 ? boundary : Infinity);
    tick(s, dt, cfg, rng, events);
    left -= dt;
  }
  return events;
}
