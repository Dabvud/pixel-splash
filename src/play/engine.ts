import type { MoveId } from '../figure/moves';
import { emptyLine, type StatLine } from '../stats/statline';
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
import { finishMeter, ratingsOf } from './ratings';
import { CONTEST_ZONE, blockChance, contestLevel } from './contest';
import { TACTICS, TACTIC_NAME, findBallScreen, tacticTarget, type Tactic } from './tactics';
import { castPlay, varyHelpTiming } from './situations';
import type { Activity, Option, Play, Segment, Variant, Waypoint } from './types';

export type Phase = 'intro' | 'running' | 'decision' | 'passing' | 'receiving' | 'driving' | 'takeoff' | 'combo' | 'ballflight' | 'freethrows' | 'ended';
export type PosterVariant = 'classic' | 'flyout' | 'grave' | 'crowd' | 'net' | 'ghost' | 'stuck' | 'jumbotron';
export interface Perks {
  passSteal?: number; coachCall?: boolean; floorGeneral?: boolean;
  threeGreen?: number; deepRange?: boolean; greenLight?: boolean;
  finishMeter?: number; contactBoost?: number; posterizer?: boolean;
}
export interface EngineConfig {
  situationRandom?: boolean; // Ohne Opt-in bleibt auch die bisherige RNG-Folge erhalten.
  /** Bei Fouls: Schiri läuft ein und pfeift, beim And-one Feier + Abklatschen vor den Freiwürfen */ foulScene?: boolean;
  /** Korbleger/Dunk nach dem Ziehen per Pfeil-Meter (ein Tipp) statt Halten + Wischen */ finishArrow?: boolean;
  /** Spielsekunden vor Wegende, ab denen schon entschieden werden darf (Entscheiden im Laufen) */ decisionLead?: number;
  slowmo: number; decisionS: number; animSpeed: number; foulMult: number; zoneFloor: number; tempoSpread: number;
  passDelayMax?: number; closeoutRandom?: number; // alte Aufrufe: 0,6 s und kein zusätzlicher Zufall
  finishFoulOverride?: number; // < 0 oder nicht gesetzt: normale Foul-Chance
  forcePoster?: boolean;
  glassChance?: number;
  forceGlass?: boolean;
  /** Alley-oop vom Brett bei freier Bahn + Athletik ≥ 0,8: Chance (Standard 0,1) bzw. erzwungen */
  boardOopChance?: number; forceBoardOop?: boolean;
  /** Karriere: Spielerwerte wirken voll (Abschluss-Meter, Pass-Steals, Dribbling gegen Verteidigung) */
  ratingMeters?: boolean;
  /** Karriere: nur dieser Akteur nimmt Eingaben an; Mitspieler entscheiden und werfen per KI */
  controlled?: string;
  /** Karriere: Schwierigkeits-Faktor auf die Trefferquote der KI-Mitspieler (Rookie 1,1 · Pro 1 · Hall of Fame 0,85) */
  aiDifficulty?: number;
  /** Karriere vor der Crunchtime: kein Spielende-Jubel/-Frust, nur kurzer Treffer-Jubel des Schützen */
  calmEnd?: boolean;
  /** Verteidigungstaktik am Ballblock würfeln (Switch/Drop/Hedge/Doppeln/Unter dem Block) + Mismatch-Effekt; forceTactic für Tests */
  tactics?: boolean; forceTactic?: Tactic;
  /** Kontest-Stufen (Wide Open … Smothered) mit kleinerem Fenster und Block-Chance, Help-Verteidiger am Korb beim Drive; forceContest/helpChance für Tests */
  contests?: boolean; forceContest?: number; helpChance?: number;
  /** Karriere-Spezialisierung: wirkt nur für `controlled` (onFire = Green Light aktiv) */
  perks?: Perks & { onFire?: boolean };
  posterVariant?: 'random' | PosterVariant;
  blockFoulChance?: number;
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
  overtime: boolean; foulTrouble: string | null;
  actors: Record<string, ActorState>; ball: Vec3; points: number; assisted: boolean; turnovers: number; foulScene: boolean;
  /** Statline dieses Spielzugs (Punkte, Assists) je Spieler-ID */ box: Record<string, StatLine>; lastPasser: string | null;
  combo: null | { kind: ShotKind; P: number; meterMs: number; zones: Zones; fouled: boolean; bankWindow: BankWindow | null;
    /** Kontest-Stufe 0–4 und der kontestende Verteidiger (nur mit cfg.contests) */ contest?: number; contestBy?: string };
  freeThrows: null | { shooter: string; left: number }; banner: string | null; verdict: string | null; fingerDown: boolean;
  realTime: number; arrowMeter: ArrowMeter | null; // pausierbare Echtzeit in Sekunden
  poster: { victim: string; kind: 'poster' | 'block' | 'ankle'; variant: PosterVariant; startedAt: number } | null;
  grave: { x: number; z: number; since: number } | null;
  /** gewürfelte Verteidigungstaktik am Ballblock (null: keine bzw. kein Ballblock) */
  tactic: Tactic | null;
  ghost: { x: number; z: number; since: number } | null;
  splinters: { x: number; z: number; since: number } | null;
  ouch: { since: number } | null;
  glass: { since: number } | null;
  glassSweep: number;
}
export type Command = { kind: 'pass'; to: string; quality?: number } | { kind: 'drive'; lane: -1 | 0 | 1 } | { kind: 'comboStart' }
  | { kind: 'comboRelease'; holdMs: number; angleDeg: number } | { kind: 'finger'; down: boolean } | { kind: 'tap' };
export type EngineEvent = { type: 'decision'; options: Option[] } | { type: 'pass'; from: string; to: string; steal: boolean }
  | { type: 'caught'; by: string } | { type: 'takeoff'; kind: 'layup' | 'dunk' | 'contact_dunk' }
  | { type: 'pocket'; quality: number }
  | { type: 'arrowStart'; kind: ArrowMeter['kind']; contest?: number } | { type: 'arrowTap'; fill: number } | { type: 'arrowEnd' }
  | { type: 'combo'; fouled: boolean; contact: boolean; contest?: number } | { type: 'result'; banner: string; made: boolean }
  | { type: 'foul'; andOne: boolean }
  | { type: 'glass' } | { type: 'glassFixed' } | { type: 'boardOop' } | { type: 'ankle' } | { type: 'tactic'; name: string } | { type: 'mismatch' }
  | { type: 'freethrow'; left: number } | { type: 'end'; verdict: string };

interface Pass {
  option: Option; from: Vec3; to: Vec3; catchPos: Vec2; duration: number; elapsed: number; stolenBy?: string;
  quality: number; startOffset: number; endOffset: number;
  style: 'normal' | 'bounce' | 'overhead';
  /** Alley-oop vom Brett: Ball prallt hier vom Glas zum Fänger */
  board?: Vec3;
}
interface Reception {
  quality: number; delay: number; elapsed: number; offset: Vec3;
  closeout?: { id: string; from: Vec2; distance: number; start: number; end: number };
}
interface Drive { from: Vec2; to: Vec2; duration: number; elapsed: number; lane: -1 | 0 | 1 }
interface Shot {
  result: ShotResult; kind: ShotKind; fouled: boolean; ft: boolean; elapsed: number; delay: number;
  flight?: Flight; from: Vec2; fromY: number; windup: number; defender?: string; defenderFrom?: Vec2;
  lob: boolean; timedOut: boolean; swatted?: boolean;
  perfect: boolean; glassChecked?: boolean;
}
interface ComboData { combo: NonNullable<PlayState['combo']>; params: ShotParams; foulRoll: number }
interface ArrowInput { holdMs: number; P: number }
interface Runtime {
  ratings?: boolean;
  perks?: Perks & { onFire?: boolean }; controlled?: string; calmEnd?: boolean;
  /** Help-Verteidiger vom Korb, der beim Drive zum Kontesten rotiert */
  help?: { id: string; pos: Vec2 };
  tacticRt?: { t: number; screener: string; hd?: string; sd?: string; pos: Record<string, Vec2>; done?: boolean };
  /** Floor General: dieser Mitspieler wird nach dem Pass des eigenen Spielers mitgesteuert */
  borrowed?: string;
  /** KI-Zug eines Mitspielers (Karriere): Schlüssel der aktuellen Situation, Startzeit, Ziel-Füllstand, Wurfzeitpunkt */
  ai?: { key: string; at: number; target?: number; releaseAt?: number; hold?: number; decided?: boolean };
  impact?: { victim: string; from: Vec2; to: Vec2; elapsed: number; duration: number; variant: PosterVariant };
  segment: Segment; variant: Variant; segT: number; phaseT: number; realT: number; aiSelected: Option | null;
  paths: Record<string, Waypoint[]>;
  decisionEnd?: number;
  decisionPathRate?: number;
  clockStarted: boolean; pass?: Pass; drive?: Drive; shot?: Shot; params?: ShotParams;
  offsets: Record<string, Vec2>;
  lob?: boolean;
  reception?: Reception;
  comboWait?: { phase: 'decision' | 'takeoff' | 'freethrows'; elapsed: number };
  arrow?: ComboData & { tapped?: ArrowInput; timedOut?: boolean };
  comboMove?: MoveId;
  celebration?: { from: Record<string, Vec2>; elapsed: number };
  /** hold: Sekunden Pfiff/Feier vor der Aufstellung; ref: Zielpunkt des Schiris; mate: abklatschender Mitspieler */
  lineup?: { from: Record<string, Vec2>; elapsed: number; hold?: number; ref?: Vec2; mate?: string; fived?: boolean; avoidGlass?: boolean };
  glassCleanup?: { stage: 'wait' | 'enter' | 'sweep' | 'leave'; elapsed: number };
}
// Laufzeitdetails gehören zu genau diesem Zustand, ohne das öffentliche Datenformat zu erweitern.
const runtimes = new WeakMap<PlayState, Runtime>();
const poses = Object.fromEntries(Object.keys(MOVES).map(id => [id, moveFrames(id as MoveId)])) as Record<MoveId, ReturnType<typeof moveFrames>>;
const facingTo = (from: Vec2, to: Vec2) => Math.atan2(to.x - from.x, -(to.z - from.z));
const distance = (a: Vec2, b: Vec2) => Math.hypot(a.x - b.x, a.z - b.z);
const mix = (a: number, b: number, f: number) => a + (b - a) * f;
const rt = (s: PlayState) => runtimes.get(s)!;
const defenders = (s: PlayState) => Object.values(s.actors).filter(a => ACTORS[a.id].team === 'def');
const impacted = (a: ActorState) => a.move === 'knocked_down' || a.move === 'hang_upside' || a.move === 'legs_up';
const contactDefenders = (s: PlayState) => defenders(s).filter(a => a.id !== s.foulTrouble && !impacted(a));
/** Perks gelten nur für den eigenen Spieler */
const perksFor = (s: PlayState, id: string) => { const r = rt(s); return r?.controlled === id ? r.perks ?? {} : {}; };
/** Korbabschluss 2: aus manchem Korbleger wird ein Kontakt-Dunk (Würfel nur mit aktivem Perk) */
function boostKind(s: PlayState, id: string, kind: 'layup' | 'dunk' | 'contact_dunk', P: number, rng: () => number): typeof kind {
  const boost = perksFor(s, id).contactBoost;
  return boost && kind === 'layup' && P < .6 && ratingsOf(ACTORS[id]).dunk >= .6 && rng() < .3 * (boost - 1) / .5 ? 'contact_dunk' : kind;
}
export function playPositionValue(s: PlayState, pos: Vec2, ahead = 0): number {
  const r = rt(s)?.ratings, dribble = r ? ratingsOf(ACTORS[s.handler]).dribble : 0;
  return positionValue(pos, defenders(s).filter(a => !impacted(a)).map(a => ({ ...(ahead ? predicted(s, a.id, ahead) : a.pos),
    // Karriere: guter Dribbler gegen schwachen Verteidiger → Verteidiger zählt weniger
    weight: (a.id === s.foulTrouble ? .5 : 1) * mismatch(s, a.id, pos)
      * (r ? Math.max(.7, Math.min(1.3, 1 - .4 * (dribble - ratingsOf(ACTORS[a.id]).defense))) : 1) })));
}
/** Mismatch (nur mit Taktiken): langsamer Big draußen gegen Guard/Flügel zählt weniger, kleiner Verteidiger gegen Big am Korb ebenso */
function mismatch(s: PlayState, defId: string, pos: Vec2): number {
  if (!rt(s)?.tacticRt) return 1;
  const off = ACTORS[s.handler]?.role, def = ACTORS[defId]?.role, rimD = distance(pos, { x: 0, z: 0 });
  if (def === 'big' && off !== 'big' && rimD > 3) return .8;
  if (def === 'guard' && off === 'big' && rimD <= 3) return .75;
  return 1;
}
const isMismatch = (s: PlayState) => {
  const h = s.actors[s.handler], d = h && defenders(s).filter(a => !impacted(a)).sort((a, b) => distance(a.pos, h.pos) - distance(b.pos, h.pos))[0];
  return Boolean(d && distance(d.pos, h.pos) < 2.5 && mismatch(s, d.id, h.pos) < 1);
};
const currentP = (s: PlayState) => playPositionValue(s, s.actors[s.handler].pos);

/** Help-Verteidiger läuft zwischen Absprungpunkt und Korb und bleibt dort bis zum Ende des Angriffs */
function applyHelp(s: PlayState, dt: number): void {
  const r = rt(s), help = r.help, a = help && s.actors[help.id];
  if (!help || !a) return;
  if (s.freeThrows || s.phase === 'ended' || impacted(a)) { releaseHelp(s); return; }
  if (s.phase === 'ballflight' && help.id === r.shot?.defender) return;
  const to = r.drive?.to ?? s.actors[s.handler].pos, len = distance(to, { x: 0, z: 0 }) || 1, m = Math.min(.9, len);
  a.pos = { ...help.pos };
  const arrived = stepToward(a, { x: to.x - to.x / len * m, z: to.z - to.z / len * m }, 5.5 * dt);
  help.pos = { ...a.pos };
  if (!['block_jump', 'block_jump_hit', 'contact'].includes(a.move)) move(a, arrived ? 'defend' : 'run');
  a.facing = facingTo(a.pos, s.actors[s.handler].pos);
}
/** Help beenden: Abweichung als Versatz zum Laufweg behalten, statt zurückzuspringen */
function releaseHelp(s: PlayState): void {
  const r = rt(s), help = r.help, path = help && r.paths[help.id];
  if (help && path?.length) {
    const p = point(path, r.segT);
    r.offsets[help.id] = { x: help.pos.x - p.x, z: help.pos.z - p.z };
  }
  r.help = undefined;
}

/** Ab dem Ballblock bewegen sich die zwei beteiligten Verteidiger nach der gewürfelten Taktik statt nach ihrem Laufweg */
function applyTactic(s: PlayState, dt: number, events: EngineEvent[]): void {
  const r = rt(s), tr = r.tacticRt;
  if (!tr || !s.tactic) return;
  if (r.segment.id !== s.play.start || s.freeThrows || s.phase === 'ended') {
    if (tr.hd && tr.sd && !tr.done) {
      tr.done = true;
      // danach: Abweichung als Versatz zum neuen Laufweg behalten, statt zurückzuspringen
      for (const id of [tr.hd, tr.sd]) {
        const a = s.actors[id], path = r.paths[id];
        if (!a || !path?.length || !tr.pos[id] || impacted(a)) continue;
        const p = point(path, r.segT);
        r.offsets[id] = { x: tr.pos[id].x - p.x, z: tr.pos[id].z - p.z };
        a.pos = { ...tr.pos[id] };
      }
    }
    return;
  }
  if (r.segT < tr.t) return;
  const h = s.actors[s.handler], sc = s.actors[tr.screener];
  if (!h || !sc) return;
  if (!tr.hd) {
    const defs = defenders(s).filter(a => !impacted(a));
    const by = (p: Vec2) => (a: ActorState, b: ActorState) => distance(a.pos, p) - distance(b.pos, p);
    const hd = [...defs].sort(by(h.pos))[0], sd = defs.filter(a => a !== hd).sort(by(sc.pos))[0];
    if (!hd || !sd) { tr.done = true; return; }
    tr.hd = hd.id; tr.sd = sd.id; tr.pos[hd.id] = { ...hd.pos }; tr.pos[sd.id] = { ...sd.pos };
    events.push({ type: 'tactic', name: TACTIC_NAME[s.tactic] });
  }
  for (const [id, role] of [[tr.hd, 'hd'], [tr.sd!, 'sd']] as const) {
    const a = s.actors[id];
    if (!a || impacted(a) || (s.phase === 'ballflight' && id === r.shot?.defender)) continue;
    a.pos = { ...tr.pos[id] };
    const arrived = stepToward(a, tacticTarget(s.tactic, role, h.pos, sc.pos, r.segT - tr.t), 6.5 * dt);
    tr.pos[id] = { ...a.pos };
    if (!['block_jump', 'block_jump_hit', 'contact'].includes(a.move)) move(a, arrived ? 'defend' : 'run');
    a.facing = facingTo(a.pos, h.pos);
  }
}
function contactKind(s: PlayState, kind: 'layup' | 'dunk' | 'contact_dunk', pos: Vec2, ahead = 0): typeof kind {
  return s.foulTrouble && kind === 'contact_dunk'
    && !contactDefenders(s).some(a => distance(ahead ? predicted(s, a.id, ahead) : a.pos, pos) <= 2.5) ? 'dunk' : kind;
}

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

/** Tatsächlicher Kopf der aktuellen Pose, auch bei liegenden Figuren. */
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
  const r = rt(s), paths = r.paths;
  for (const a of Object.values(s.actors)) {
    if (ACTORS[a.id].team === 'crew') continue;
    if (impacted(a)) continue;
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
  s.verdict = verdict(s.points, s.deficit, s.overtime);
  const h = s.actors[s.handler];
  if (impacted(h)) {
    // Der Block bleibt auch im Ergebnisbild sichtbar.
  } else if (rt(s).calmEnd) {
    // Mitten im Spiel: nur der Schütze freut sich kurz über einen Treffer, niemand feiert das Spielende
    if (s.points > 0) { h.y = 0; move(h, 'flex', true); }
  } else if (s.verdict === 'GAMEWINNER' || s.verdict === 'OVERTIME' || s.verdict === 'DOPPEL-OVERTIME') {
    move(h, 'celebrate', true);
    rt(s).celebration = { elapsed: 0, from: {} };
    for (const a of Object.values(s.actors)) if (a.id !== h.id && ACTORS[a.id].team === 'off' && !impacted(a)) {
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
  // Karriere: Pull-up und Zug zum Korb sind immer möglich – außer beim Einwurf von außerhalb des Feldes
  const inbounding = s.play.inboundBy === s.handler && rt(s).segment.id === s.play.start;
  if (rt(s).controlled && !inbounding) {
    if (!options.some(o => o.kind === 'drive')) options.unshift({ kind: 'drive' });
    if (!options.some(o => o.kind === 'shoot')) options.unshift({ kind: 'shoot' });
  }
  for (const a of Object.values(s.actors)) {
    if (ACTORS[a.id].team === 'off' && a.id !== s.handler && !options.some(o => o.kind === 'pass' && o.to === a.id)) {
      options.push({ kind: 'pass', to: a.id });
    }
  }
  return options;
}

function decision(s: PlayState, events: EngineEvent[], cfg: EngineConfig): void {
  phase(s, 'decision');
  const r = rt(s);
  r.aiSelected = null;
  if (cfg.decisionLead !== undefined) {
    r.decisionEnd = s.gameT + cfg.decisionS;
    // Das verbleibende Wegstück füllt genau das gewählte Fenster. Zusätzliche
    // Pässe ohne Folgesegment behalten dagegen ihre bisherige Weg-Zeitachse.
    r.decisionPathRate = r.segment.id === 'received' ? 1
      : Math.max(0, (r.segment.decisionAt ?? 0) - r.segT) / cfg.decisionS;
  }
  events.push({ type: 'decision', options: decisionOptions(s) });
  if (isMismatch(s)) events.push({ type: 'mismatch' });
}

export function createPlayState(play: Play, cfg: EngineConfig, rng: () => number): PlayState {
  let overtime = false, clock = play.clockS, situationDeficit: number | undefined;
  let foulTrouble: string | null = null;
  if (cfg.situationRandom ?? false) {
    overtime = rng() < .15;
    const min = overtime ? (play.id === 'fastbreak' ? 4 : 3)
      : Math.max(play.id === 'inbound' ? 1.5 : play.id === 'fastbreak' ? 4 : 3, play.clockS * .5);
    const max = overtime ? 12 : Math.min(24, play.clockS * 2.5);
    clock = mix(min, max, rng());
    // Der 0,8-s-Einwurf erlaubt absichtlich nur einen Abschluss in der Luft.
    if (play.id === 'lob08') clock = play.clockS;
    const maxDeficit = overtime || clock < 5 ? 3 : 6;
    situationDeficit = 1 + Math.min(maxDeficit - 1, Math.floor(rng() * maxDeficit));
    play = castPlay(play, rng);
    if (rng() < .15) {
      const defense = play.actors.filter(id => ACTORS[id].team === 'def');
      foulTrouble = defense[Math.min(defense.length - 1, Math.floor(rng() * defense.length))] ?? null;
    }
  }
  // Kurze Folgesegmente bieten auch beim maximalen Reglerwert ein volles Fenster.
  // Alle Angreifer- und Verteidigerwege teilen dieselbe gestreckte Zeitachse.
  if (cfg.decisionLead !== undefined) {
    const factors = Object.fromEntries(Object.entries(play.segments).map(([id, segment]) =>
      [id, segment.decisionAt ? Math.max(1, cfg.decisionS / segment.decisionAt) : 1]));
    const scaled = (paths: Record<string, Waypoint[]>, f: number) => Object.fromEntries(
      Object.entries(paths).map(([id, path]) => [id, path.map(p => ({ ...p, t: p.t * f }))]));
    play = { ...play, segments: Object.fromEntries(Object.entries(play.segments).map(([id, segment]) =>
      [id, { ...segment, decisionAt: (segment.decisionAt ?? 0) * factors[id], paths: scaled(segment.paths, factors[id]) }])),
      variants: play.variants.map(v => ({ ...v, defPaths: Object.fromEntries(Object.entries(v.defPaths)
        .map(([id, paths]) => [id, scaled(paths, factors[id] ?? 1)])) })) };
  }
  if (cfg.situationRandom) play = varyHelpTiming(play, rng);
  const total = play.variants.reduce((sum, v) => sum + v.weight, 0);
  let pick = rng() * total;
  const variant = play.variants.find(v => (pick -= v.weight) < 0) ?? play.variants[play.variants.length - 1];
  const segment = play.segments[play.start];
  const deficit = situationDeficit ?? (typeof play.deficit === 'number' ? play.deficit
    : play.deficit[0] + Math.min(play.deficit[1] - play.deficit[0], Math.floor(rng() * (play.deficit[1] - play.deficit[0] + 1))));
  const s: PlayState = {
    play, variant: variant.id, deficit, overtime, foulTrouble, phase: 'intro', gameT: 0, clock, handler: segment.handler,
    actors: {}, ball: { x: 0, y: 0, z: 0 }, points: 0, assisted: false, turnovers: 0, foulScene: cfg.foulScene ?? false, box: {}, lastPasser: null,
    combo: null, freeThrows: null, banner: null, verdict: null, fingerDown: false, realTime: 0, arrowMeter: null, poster: null, grave: null,
    ghost: null, splinters: null, ouch: null, glass: null, glassSweep: 0, tactic: null,
  };
  runtimes.set(s, { segment, variant, paths: { ...segment.paths, ...variant.defPaths[segment.id] },
    segT: 0, phaseT: 0, realT: 0, aiSelected: null, clockStarted: !play.inboundBy, offsets: {}, ratings: cfg.ratingMeters ?? false,
    perks: cfg.perks, controlled: cfg.controlled, calmEnd: cfg.calmEnd });
  // Taktik nur würfeln, wenn eingeschaltet und der Spielzug einen Ballblock hat (sonst kein zusätzlicher Zufall)
  const screen = cfg.tactics ? findBallScreen(play) : null;
  if (screen) {
    s.tactic = cfg.forceTactic ?? TACTICS[Math.min(TACTICS.length - 1, Math.floor(rng() * TACTICS.length))];
    rt(s).tacticRt = { t: screen.t, screener: screen.screener, pos: {} };
  }
  for (const id of play.actors) {
    const p = (variant.defPaths[segment.id]?.[id] ?? segment.paths[id])?.[0];
    s.actors[id] = { id, pos: { x: p?.x ?? 0, z: p?.z ?? 0 }, y: 0, facing: 0, move: 'idle', moveT: 0 };
  }
  updatePaths(s, -1);
  heldBall(s);
  return s;
}

function predicted(s: PlayState, id: string, ahead: number): Vec2 {
  const r = rt(s), path = r.paths[id];
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
    return playPositionValue(s, target.pos, target.duration);
  };
  return [...options].sort((a, b) => value(a) - value(b) || rank[a.kind] - rank[b.kind])[0];
}

function comboData(s: PlayState, kind: ShotKind, P: number, cfg: EngineConfig, rng: () => number,
  actor = s.handler, pos = s.actors[actor].pos, lobQuality?: number, ahead = 0): ComboData {
  const ft = s.freeThrows !== null, finishing = kind !== 'jump2' && kind !== 'three';
  const at = (a: ActorState) => ahead ? predicted(s, a.id, ahead) : a.pos;
  const nearest = s.foulTrouble && defenders(s).sort((a, b) => distance(at(a), pos) - distance(at(b), pos))[0];
  const chance = nearest && nearest.id === s.foulTrouble ? 0
    : finishing && cfg.finishFoulOverride !== undefined && cfg.finishFoulOverride >= 0
      ? cfg.finishFoulOverride : foulChance(kind, P, cfg.foulMult) * (finishing ? perksFor(s, actor).contactBoost ?? 1 : 1);
  const foulRoll = ft ? 1 : rng(), fouled = !ft && foulRoll < chance;
  const a = ACTORS[actor], ratings = ratingsOf(a);
  const perks = perksFor(s, actor);
  const rated = finishing ? cfg.ratingMeters && !ft ? { ...cfg.finish, ...finishMeter(cfg.finish, ratings.finish) } : cfg.finish : cfg.shot;
  const base = { ...rated,
    meterMs: rated.meterMs * (finishing && !ft ? perks.finishMeter ?? 1 : 1),
    greenZone: rated.greenZone * (kind === 'three' && !ft ? perks.threeGreen ?? 1 : 1) };
  const meterMs = ft ? base.meterMs : meterDuration(base.meterMs, P, cfg.tempoSpread, rng);
  const params = { ...base, meterMs, influence: cfg.shot.influence,
    rating: finishing ? ratings.finish : kind === 'three' ? ratings.three : ratings.mid,
    // Deep Range: weite Dreier ohne Entfernungsabzug
    distance: ft ? 4.2 : finishing ? 4.6 : kind === 'three' && perks.deepRange ? Math.min(4.6, distance(pos, { x: 0, z: 0 })) : distance(pos, { x: 0, z: 0 }),
    bankAngleDeg: kind === 'dunk' || kind === 'contact_dunk' ? undefined
      : ft ? 0 : Math.atan2(Math.abs(pos.x), pos.z) * 180 / Math.PI,
    zoneFactor: ft ? 1 : zoneFactor(P, cfg.zoneFloor, fouled, kind === 'contact_dunk')
      * (lobQuality === undefined ? 1 : .75 + .25 * lobQuality) };
  let contest: { contest?: number; contestBy?: string } = {};
  if (cfg.contests && !ft) {
    // der Help-Verteidiger zählt schon, als stünde er am Abschluss (er ist unterwegs dorthin)
    const help = finishing ? rt(s).help?.id : undefined;
    const gap = (d: ActorState) => d.id === help ? Math.min(1, distance(at(d), pos)) : distance(at(d), pos);
    const by = defenders(s).filter(d => !impacted(d)).sort((x, y) => gap(x) - gap(y))[0];
    if (by) {
      const level = cfg.forceContest ?? contestLevel(gap(by), ratingsOf(ACTORS[by.id]).defense, rng);
      contest = { contest: level, contestBy: by.id };
      params.zoneFactor *= CONTEST_ZONE[level];
    }
  }
  return { params, combo: { kind, P, meterMs, zones: effectiveZones(params), fouled, bankWindow: bankWindow(params), ...contest }, foulRoll };
}

function prepareCombo(s: PlayState, kind: ShotKind, P: number, cfg: EngineConfig, rng: () => number, events: EngineEvent[]): void {
  const data = comboData(s, kind, P, cfg, rng);
  rt(s).params = data.params;
  s.combo = data.combo;
  rt(s).comboMove = shotMove(s, kind, P, rng);
  move(s.actors[s.handler], rt(s).comboMove!, true);
  s.actors[s.handler].facing = facingTo(s.actors[s.handler].pos, { x: 0, z: 0 });
  events.push({ type: 'combo', fouled: data.combo.fouled, contact: kind === 'contact_dunk', contest: data.combo.contest });
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
  events.push({ type: 'arrowStart', kind, contest: kind === 'catchshoot' ? data.combo.contest : undefined });
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
  a.params.zoneFactor = zoneFactor(P, cfg.zoneFloor, c.fouled, false) * CONTEST_ZONE[c.contest ?? 0];
  c.zones = effectiveZones(a.params);
  c.bankWindow = bankWindow(a.params);
  s.arrowMeter!.zones = c.zones;
  s.arrowMeter!.bankWindow = c.bankWindow;
}

/** Abschluss-Meter (Korbleger/Dunk/Alley-oop): Pfeil läuft bis zur Spitze (Füllstand 1) und um diesen Anteil zurück */
export const FINISH_RETURN = 0.35;
/** Anteil des Wegs bis zum Ringkontakt, den der Spieler während des Abschluss-Meters schon ausholt */
const WINDUP_SHARE = 0.75;

/** Füllstand, bei dem ein Pfeil-Meter endet */
export function arrowEndFill(kind: ArrowMeter['kind']): number {
  return kind === 'catchshoot' ? MAX_FILL : 1 + FINISH_RETURN;
}

/** Angezeigte Pfeilhöhe: Abschluss-Meter steigen bis zur Spitze und fallen danach wieder */
export function meterDisplayFill(kind: ArrowMeter['kind'], fill: number): number {
  return kind === 'catchshoot' || fill <= 1 ? fill : 2 - fill;
}

function arrowInput(s: PlayState): ArrowInput | undefined {
  const m = s.arrowMeter;
  if (!m || m.fill !== null || s.realTime < m.startTime || s.realTime >= m.startTime + m.meterMs * arrowEndFill(m.kind) / 1000
    || (s.clock <= 0 && m.kind === 'catchshoot')) return;
  return { holdMs: (s.realTime - m.startTime) * 1000, P: currentP(s) };
}

function tapArrow(s: PlayState, cfg: EngineConfig, rng: () => number, events: EngineEvent[]): void {
  const m = s.arrowMeter, a = rt(s).arrow;
  if (!m || !a || m.fill !== null) return;
  const input = arrowInput(s);
  if (!input) return;
  a.tapped = input;
  m.fill = Math.min(arrowEndFill(m.kind), input.holdMs / m.meterMs);
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
  const endFill = arrowEndFill(m.kind);
  m.fill = endFill;
  m.feedback = 'ZU LANGSAM';
  data.timedOut = true;
  data.tapped = { holdMs: m.meterMs * endFill, P: data.combo.P };
  events.push({ type: 'arrowTap', fill: endFill });
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
  const P = currentP(s), pos = s.actors[s.handler].pos;
  const kind = contactKind(s, cfg.forcePoster
    ? contactDefenders(s).some(a => distance(a.pos, pos) <= 2.5) ? 'contact_dunk' : 'dunk'
    : boostKind(s, s.handler, finishKind(ratingsOf(ACTORS[s.handler]).dunk, P, rng), P, rng), pos);
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
      paths: r.paths,
      decisionAt: .4, options: [{ kind: 'shoot' }, { kind: 'drive' }] };
    return;
  }
  r.segment = next;
  r.paths = { ...next.paths, ...r.variant.defPaths[next.id] };
  r.segT = 0;
  r.offsets = {};
  // Bewegte Empfänger bleiben am tatsächlichen Fangpunkt; Fortsetzungen sind relativ dazu.
  for (const [id, path] of Object.entries(r.paths)) {
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
  const passFactor = cfg.ratingMeters ? Math.max(.5, Math.min(1.3, 1.3 - .6 * ratingsOf(ACTORS[h.id]).pass)) : 1;
  const steal = rng() < stealChance(h.pos, target.pos, defenders(s).map(a => a.pos), quality) * passFactor * (perksFor(s, h.id).passSteal ?? 1);
  // Floor General: nach eigenem Pass wird der Fänger mitgesteuert; passt der Mitspieler weiter, endet das
  const fr = rt(s);
  fr.borrowed = !steal && fr.perks?.floorGeneral && h.id === fr.controlled ? catcher.id : undefined;
  r.comboMove = undefined; r.drive = undefined;
  releaseHelp(s);
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
    const defense = contactDefenders(s).map(a => predicted(s, a.id, target.duration));
    const P = playPositionValue(s, target.pos, target.duration);
    const kind = contactKind(s, cfg.forcePoster
      ? defense.some(pos => distance(pos, target.pos) <= 2.5) ? 'contact_dunk' : 'dunk'
      : boostKind(s, catcher.id, finishKind(ratingsOf(ACTORS[catcher.id]).dunk, P, rng), P, rng), target.pos, target.duration);
    // Nur bei freier Bahn (Dunk ohne Kontakt) und hohem Dunk-Wert; gewürfelt nur dann
    if (kind === 'dunk' && ratingsOf(ACTORS[catcher.id]).dunk >= .8
      && (cfg.forceBoardOop || rng() < (cfg.boardOopChance ?? .1))) {
      r.pass.board = { x: target.pos.x * .3, y: 3.6, z: -.36 };
      events.push({ type: 'boardOop' });
    }
    const data = comboData(s, kind, P, cfg, rng, catcher.id, target.pos, quality, target.duration);
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
    const path = r.paths[c.id];
    if (path?.length) {
      const p = point(path, r.segT), a = s.actors[c.id];
      r.offsets[c.id] = { x: a.pos.x - p.x, z: a.pos.z - p.z };
    }
  }
  r.reception = undefined;
  decision(s, events, cfg);
  if ((r.segment.options ?? [{ kind: 'shoot' }]).some(o => o.kind === 'shoot')) {
    const data = comboData(s, shotKindAt(s.actors[s.handler].pos), currentP(s), cfg, rng);
    startArrow(s, 'catchshoot', s.realTime, data, events);
  }
  heldBall(s);
}

function startShot(s: PlayState, input: { holdMs: number; angleDeg: number }, rng: () => number): void {
  const r = rt(s), combo = s.combo!, h = s.actors[s.handler];
  let result = resolveShot(input, r.params!, rng);
  const perks = perksFor(s, h.id);
  // Green Light: brennend ist jeder Wurf im grünen Timing-Fenster sicher drin
  if (perks.greenLight && perks.onFire && !result.made && Math.abs(result.t) <= 1) {
    result = { ...resolveShot({ holdMs: r.params!.meterMs, angleDeg: 0 }, r.params!, rng), fill: result.fill, t: result.t };
  }
  const finishing = combo.kind !== 'jump2' && combo.kind !== 'three';
  const id: MoveId = finishing && r.comboMove ? r.comboMove : shotMove(s, combo.kind, combo.P, rng);
  // Bereits gezeigtes Ausholen nicht wiederholen: Animation läuft an der aktuellen Stelle weiter
  const windup = finishing && h.move === id ? h.moveT : 0;
  move(h, id, true);
  h.moveT = windup;
  const nearest = !s.freeThrows && contactDefenders(s).sort((a, b) => distance(a.pos, h.pos) - distance(b.pos, h.pos))[0];
  // Posterizer: ein verfehlter Kontakt-Dunk wird nie geblockt (normaler Fehlwurf ohne Verteidigerkontakt)
  const noBlock = perks.posterizer && combo.kind === 'contact_dunk' && !result.made;
  let defender = !noBlock && nearest && distance(nearest.pos, h.pos) < 2.5 ? nearest : undefined;
  // Kontest: ab „Contested“ kann der Verteidiger den Wurf blocken – auch bei perfektem Timing (Kontakt-Dunk hat sein eigenes Duell)
  const by = combo.contestBy ? s.actors[combo.contestBy] : undefined;
  const swatted = Boolean(by) && !s.freeThrows && combo.kind !== 'contact_dunk' && !impacted(by!)
    && rng() < blockChance(combo.contest ?? 0, ratingsOf(ACTORS[by!.id]).defense);
  if (swatted) {
    result = { ...result, made: false, outcome: 'airball', banner: 'GEBLOCKT' };
    defender = by;
  }
  if (defender) {
    move(defender, combo.kind === 'contact_dunk' ? 'block_jump_hit'
      : combo.fouled ? 'contact' : 'block_jump', true);
    defender.facing = facingTo(defender.pos, h.pos);
  }
  r.shot = { result, kind: combo.kind, fouled: combo.fouled, ft: s.freeThrows !== null,
    elapsed: windup, delay: combo.kind === 'contact_dunk' && !result.made ? .3
      : finishing || id === 'step_back' || id === 'fadeaway' ? ((MOVES[id].rimFrame ?? 2) + 1) / MOVES[id].fps : .2,
    from: { ...h.pos }, fromY: h.y, windup, defender: defender?.id, defenderFrom: defender && { ...defender.pos }, lob: r.lob ?? false,
    timedOut: r.arrow?.timedOut ?? false, swatted,
    perfect: s.arrowMeter && s.arrowMeter.kind !== 'catchshoot' ? s.arrowMeter.feedback === 'PERFEKT' : Math.abs(result.t) <= 1 };
  phase(s, 'ballflight');
  heldBall(s);
}

/** Wer gerade Eingaben geben darf: Fänger beim Alley-oop-Pfeil, Schütze bei Freiwürfen, sonst Ballführer */
export function inputOwner(s: PlayState): string {
  if (s.arrowMeter?.kind === 'alleyoop' && s.phase === 'passing') return rt(s).pass!.option.to!;
  return s.freeThrows?.shooter ?? s.handler;
}

/** Karriere: darf der Nutzer gerade eingeben? (eigener Spieler oder per Floor General mitgesteuerter Fänger) */
export function isControlled(s: PlayState): boolean {
  const r = rt(s), owner = inputOwner(s);
  return !r.controlled || owner === r.controlled || (r.borrowed !== undefined && owner === r.borrowed);
}

export function command(s: PlayState, cmd: Command, cfg: EngineConfig, rng: () => number): EngineEvent[] {
  if (cfg.controlled && !isControlled(s)) return [];
  return runCommand(s, cmd, cfg, rng);
}

/** Ziel-Füllstand der KI: um die Ideallinie gestreut, enger bei hohem Wert (Einheiten der grünen Zone) */
/** Karriere: Trefferquote der KI-Mitspieler (mit dem Nutzer abgestimmte Wertetabelle):
 *  Basis Korb 70 % · Mitteldistanz 50 % · Dreier 40 % · weiter Dreier (> 7,5 m) 30 %,
 *  × Verteidigung (offen 1 · leicht 0,85 · eng 0,7 · sehr eng 0,55), ± 5 %-Punkte je 10 Wertpunkte um 60, × Schwierigkeit, 5–90 % */
export function aiHitChance(kind: ShotKind | 'ft', P: number, rating: number, distanceM: number, difficulty = 1): number {
  if (kind === 'ft') return Math.max(.05, Math.min(.9, (.55 + .35 * rating) * difficulty));
  const base = kind === 'three' ? distanceM > 7.5 ? .3 : .4 : kind === 'jump2' ? .5 : .7;
  const defense = P >= .8 ? 1 : P >= .6 ? .85 : P >= .4 ? .7 : .55;
  return Math.max(.05, Math.min(.9, (base * defense + (rating - .6) * .5) * difficulty));
}

/** Ziel-Füllstand der KI: Treffer → sicher im Grün, Fehlwurf → deutlich daneben (Einheiten der grünen Zone) */
function aiFill(g: number, hit: boolean, rng: () => number): number {
  return hit ? 1 + (rng() * 2 - 1) * .85 * g : 1 + (rng() < .5 ? -1 : 1) * (1.5 + .8 * rng()) * g;
}

/** KI-Mitspieler (Karriere): entscheidet nach kurzer Pause, wirft/tippt Meter mit wertabhängiger Streuung */
function aiAct(s: PlayState, cfg: EngineConfig, rng: () => number, events: EngineEvent[]): void {
  if (s.phase === 'ended' || isControlled(s)) return;
  const r = rt(s), owner = inputOwner(s), m = s.arrowMeter;
  const key = `${s.phase}|${owner}|${m ? m.startTime : ''}|${s.freeThrows?.left ?? ''}`;
  if (r.ai?.key !== key) r.ai = { key, at: s.realTime };
  const ai = r.ai, ratings = ratingsOf(ACTORS[owner]);
  if (m && m.fill === null) {
    if (s.realTime < m.startTime) return;
    // Nach dem Fang nicht nur werfen: mit offener Bahn oft, sonst manchmal zum Korb ziehen
    if (m.kind === 'catchshoot' && !ai.decided) {
      ai.decided = true;
      if (rng() < driveChance(s, owner)) { events.push(...runCommand(s, { kind: 'drive', lane: 0 }, cfg, rng)); return; }
    }
    if (ai.target === undefined) {
      const combo = r.arrow?.combo, kind = combo?.kind ?? 'jump2', pos = s.actors[owner]?.pos ?? { x: 0, z: 0 };
      const rating = kind === 'three' ? ratings.three : kind === 'jump2' ? ratings.mid : ratings.finish;
      ai.target = aiFill(m.zones.g, rng() < aiHitChance(kind, combo?.P ?? 1, rating, distance(pos, { x: 0, z: 0 }), cfg.aiDifficulty) * CONTEST_ZONE[combo?.contest ?? 0], rng);
    }
    if ((s.realTime - m.startTime) * 1000 / m.meterMs + 1e-9 >= ai.target) tapArrow(s, cfg, rng, events);
    return;
  }
  if (s.phase === 'combo' && s.combo && ai.releaseAt !== undefined) {
    if (s.realTime + 1e-9 >= ai.releaseAt) events.push(...runCommand(s, { kind: 'comboRelease', holdMs: ai.hold!, angleDeg: 0 }, cfg, rng));
    return;
  }
  if (s.realTime - ai.at < .5) return;
  const shoot = () => {
    events.push(...runCommand(s, { kind: 'comboStart' }, cfg, rng));
    if (!s.combo) return;
    const kind = s.combo.kind, rating = s.freeThrows ? ratings.mid : kind === 'three' ? ratings.three : kind === 'jump2' ? ratings.mid : ratings.finish;
    const chance = aiHitChance(s.freeThrows ? 'ft' : kind, s.combo.P, rating, distance(s.actors[owner].pos, { x: 0, z: 0 }), cfg.aiDifficulty)
      * (s.freeThrows ? 1 : CONTEST_ZONE[s.combo.contest ?? 0]);
    const hold = s.combo.meterMs * aiFill(s.combo.zones.g, rng() < chance, rng);
    r.ai = { key: `${s.phase}|${owner}||${s.freeThrows?.left ?? ''}`, at: s.realTime, releaseAt: s.realTime + hold / 1000, hold };
  };
  if (s.phase === 'freethrows') { if ((r.lineup?.hold ?? 0) <= 0) shoot(); return; }
  if (s.phase !== 'decision' || s.combo) return;
  const options = decisionOptions(s);
  const toHero = options.find(o => o.kind === 'pass' && o.to === cfg.controlled);
  // Szenen drehen sich um den eigenen Spieler: Mitspieler suchen ihn bevorzugt
  let option = toHero && rng() < .75 ? toHero : bestOption(s, options);
  if (option.kind === 'shoot' && options.some(o => o.kind === 'drive') && rng() < driveChance(s, owner)) option = { kind: 'drive' };
  if (option.kind === 'pass') events.push(...runCommand(s, { kind: 'pass', to: option.to!, quality: .55 + .45 * ratings.pass }, cfg, rng));
  else if (option.kind === 'drive') events.push(...runCommand(s, { kind: 'drive', lane: 0 }, cfg, rng));
  else shoot();
}

/** KI-Zug zum Korb: offene Bahn (Positionswert am Absprungpunkt ≥ 0,7) 55 %, sonst 20 % */
function driveChance(s: PlayState, owner: string): number {
  const pos = s.actors[owner]?.pos;
  return pos && playPositionValue(s, takeoffPoint(pos)) >= .7 ? .55 : .2;
}

function bestOption(s: PlayState, options: Option[]): Option {
  const from = s.actors[s.handler].pos;
  const value = (o: Option): number => o.kind === 'shoot' ? currentP(s)
    : o.kind === 'drive' ? playPositionValue(s, takeoffPoint(from)) : playPositionValue(s, catchPoint(s, o.to!).pos);
  return [...options].sort((a, b) => value(b) - value(a))[0];
}

function runCommand(s: PlayState, cmd: Command, cfg: EngineConfig, rng: () => number): EngineEvent[] {
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
    if (s.freeThrows && s.glass) return events;
    if (s.freeThrows && distance(s.actors[s.freeThrows.shooter].pos, { x: 0, z: 4.2 }) > 1e-6) return events;
    if (s.phase === 'combo') return events;
    if (s.phase === 'takeoff') {
      r.comboWait = { phase: 'takeoff', elapsed: r.realT };
      phase(s, 'combo'); return events;
    }
    if (s.phase === 'freethrows' && (r.lineup?.hold ?? 0) > 0) return events; // erst Pfiff und Feier abwarten
    if (s.phase === 'freethrows' || (s.phase === 'decision' && decisionOptions(s).some(o => o.kind === 'shoot'))) {
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
  } else if (cmd.kind === 'drive' && decisionOptions(s).some(o => o.kind === 'drive')) {
    clearArrow(s, events);
    const h = s.actors[s.handler], to = takeoffPoint(h.pos, cmd.lane);
    r.drive = { from: { ...h.pos }, to, duration: Math.max(1, distance(h.pos, to) / 8), elapsed: 0, lane: cmd.lane };
    r.comboMove = undefined;
    if (cfg.contests) {
      // Help: steht ein Verteidiger (nicht der am Ball) am Korb, rotiert er meistens zum Kontesten
      const free = defenders(s).filter(a => !impacted(a)).sort((a, b) => distance(a.pos, h.pos) - distance(b.pos, h.pos)).slice(1);
      const big = free.filter(a => distance(a.pos, { x: 0, z: 0 }) <= 3.2).sort((a, b) => distance(a.pos, to) - distance(b.pos, to))[0];
      if (big && rng() < (cfg.helpChance ?? .9)) r.help = { id: big.id, pos: { ...big.pos } };
    }
    phase(s, 'driving');
    const driveMove = cmd.lane === 0 ? rng() < .5 ? 'hesitation' : 'spin_move'
      : rng() < .5 ? 'crossover' : 'behind_back';
    move(h, driveMove, true);
    if (cmd.lane) h.moveSide = cmd.lane === -1 ? 1 : -1;
    h.facing = facingTo(h.pos, to);
    heldBall(s);
    // Posterizer: Ankle Breaker – der nächste Verteidiger fällt mit 20 % um
    if (perksFor(s, h.id).posterizer && rng() < .2) {
      const d = contactDefenders(s).sort((a, b) => distance(a.pos, h.pos) - distance(b.pos, h.pos))[0];
      if (d && distance(d.pos, h.pos) < 3) {
        d.y = 0; move(d, 'knocked_down', true);
        s.poster = { victim: d.id, kind: 'ankle', variant: 'classic', startedAt: s.realTime };
        events.push({ type: 'ankle' });
      }
    }
  }
  return events;
}

// Freiwurf-Aufstellung: Schütze an der Linie, alle anderen abwechselnd links/rechts am Zonenrand
function lineUp(s: PlayState, dtReal: number): void {
  const shooter = s.freeThrows!.shooter;
  const r = rt(s);
  const setup = r.lineup ??= { from: Object.fromEntries(Object.values(s.actors).map(a => [a.id, { ...a.pos }])), elapsed: 0,
    avoidGlass: Boolean(s.glass) };
  if (foulScene(s, dtReal)) return;
  setup.elapsed = Math.min(.8, setup.elapsed + dtReal);
  const f = setup.elapsed / .8;
  let i = 0;
  for (const a of Object.values(s.actors)) {
    // Neue Varianten bleiben auch während der Glasreparatur an ihrem Platz.
    const fixedPoster = s.poster?.victim === a.id && ['crowd', 'net', 'ghost', 'stuck', 'jumbotron'].includes(s.poster.variant);
    if (fixedPoster || (a.move === 'knocked_down' && !setup.avoidGlass) || a.id === 'ref' || ACTORS[a.id].team === 'crew') continue;
    const to = a.id === shooter ? { x: 0, z: 4.2 } : { x: i % 2 ? 2.75 : -2.75,
      z: setup.avoidGlass ? 4.2 + Math.floor(i / 2) * .9 : 1.2 + Math.floor(i / 2) * .6 };
    if (a.id !== shooter) i++;
    if (f >= 1 || distance(setup.from[a.id], to) < 1e-6) {
      a.pos = to;
      a.facing = facingTo(a.pos, { x: 0, z: 0 });
      if ((a.id !== shooter || s.phase === 'freethrows') && a.move !== "idle") move(a, "idle", true);
    } else {
      a.facing = facingTo(a.pos, to);
      a.pos = { x: mix(setup.from[a.id].x, to.x, f), z: mix(setup.from[a.id].z, to.z, f) };
      if (a.move !== "run") move(a, "run", true);
    }
    if (a.id !== shooter) a.y = 0;
  }
}

const REF_SPEED = 7; // m/s, Schiri sprintet ins Bild
const MATE_SPEED = 6;

/** Pfiff: Schiri läuft von der Seitenlinie zum Korb und zeigt das Foul an; beim And-one feiert der Schütze, ein Mitspieler klatscht ab. */
function callFoul(s: PlayState, andOne: boolean, events: EngineEvent[]): void {
  const r = rt(s), shooter = s.actors[s.freeThrows!.shooter], setup = r.lineup!;
  const side = shooter.pos.x >= 0 ? 1 : -1, from = { x: side * 8.2, z: 3 };
  s.actors.ref = { id: 'ref', pos: from, y: 0, facing: facingTo(from, { x: 0, z: 0 }), move: 'run', moveT: 0 };
  // Direkt neben die Korbstange (z = −1,6): dort ist er aus jeder Abschluss- und Freiwurfkamera zu sehen
  setup.ref = { x: side * 0.9, z: -1.35 };
  setup.hold = andOne ? 1.8 : 1.1;
  events.push({ type: 'foul', andOne });
  if (!andOne) return;
  move(shooter, 'flex', true);
  const mate = Object.values(s.actors).filter(a => ACTORS[a.id].team === 'off' && a.id !== shooter.id)
    .sort((a, b) => distance(a.pos, shooter.pos) - distance(b.pos, shooter.pos))[0];
  if (mate) setup.mate = mate.id;
}

function stepToward(a: ActorState, to: Vec2, stepM: number): boolean {
  const d = distance(a.pos, to);
  if (d <= stepM) { a.pos = { ...to }; return true; }
  a.facing = facingTo(a.pos, to);
  a.pos = { x: a.pos.x + (to.x - a.pos.x) * stepM / d, z: a.pos.z + (to.z - a.pos.z) * stepM / d };
  return false;
}

/** Schiri, Feier und Abklatschen während der Pfiff-Pause; true, solange die Aufstellung warten soll */
function foulScene(s: PlayState, dtReal: number): boolean {
  const setup = rt(s).lineup!, ref = s.actors.ref;
  if (ref && setup.ref && ref.move !== 'ref_whistle') {
    if (stepToward(ref, setup.ref, REF_SPEED * dtReal)) {
      ref.facing = facingTo(ref.pos, s.actors[s.freeThrows!.shooter].pos);
      move(ref, 'ref_whistle', true);
    } else if (ref.move !== 'run') move(ref, 'run', true);
  }
  if (!((setup.hold ?? 0) > 0)) return false;
  setup.hold! -= dtReal;
  const shooter = s.actors[s.freeThrows!.shooter], mate = setup.mate ? s.actors[setup.mate] : undefined;
  if (mate && !setup.fived) {
    const spot = { x: shooter.pos.x + (shooter.pos.x >= 0 ? -.7 : .7), z: shooter.pos.z + .3 };
    if (stepToward(mate, spot, MATE_SPEED * dtReal)) {
      setup.fived = true;
      mate.facing = facingTo(mate.pos, shooter.pos);
      shooter.facing = facingTo(shooter.pos, mate.pos);
      move(mate, 'high_five', true);
      move(shooter, 'high_five', true);
    } else if (mate.move !== 'run') move(mate, 'run', true);
  }
  if (setup.hold! > 0) return true;
  // Pfiff/Feier vorbei: Aufstellung startet von den aktuellen Positionen
  setup.from = Object.fromEntries(Object.values(s.actors).map(a => [a.id, { ...a.pos }]));
  setup.elapsed = 0;
  return false;
}

function freeThrow(s: PlayState, events: EngineEvent[]): void {
  phase(s, 'freethrows');
  s.combo = null;
  const h = s.actors[s.freeThrows!.shooter];
  if (rt(s).impact?.victim === h.id) rt(s).impact = undefined;
  s.handler = h.id;
  h.y = 0; h.facing = 0;
  // Nach der Reparatur bleiben die Plätze außerhalb des Wischbereichs bestehen.
  rt(s).lineup = { from: Object.fromEntries(Object.values(s.actors).map(a => [a.id, { ...a.pos }])), elapsed: 0,
    avoidGlass: Boolean(s.glass) };
  rt(s).lob = false;
  move(h, 'idle', true);
  heldBall(s);
  events.push({ type: 'freethrow', left: s.freeThrows!.left });
}

function addPoints(s: PlayState, id: string, pts: number): void {
  (s.box[id] ??= emptyLine()).pts += pts;
}

function finishShot(s: PlayState, events: EngineEvent[]): void {
  const shot = rt(s).shot!, { result, kind, fouled, ft } = shot;
  if (result.made) {
    const pts = ft ? 1 : kind === 'three' ? 3 : 2;
    s.points += pts;
    const scorer = ft ? s.freeThrows!.shooter : s.handler;
    addPoints(s, scorer, pts);
    // Assist nur für den Feldkorb, nicht für Freiwürfe
    if (!ft && s.assisted && s.lastPasser && s.lastPasser !== scorer) (s.box[s.lastPasser] ??= emptyLine()).ast++;
  }
  s.banner = shot.swatted ? 'GEBLOCKT' : shot.timedOut ? kind === 'contact_dunk' ? 'GEBLOCKT' : 'VOM RING'
    : result.outcome === 'bank_in'
    ? `${!ft && s.assisted ? 'ASSIST + ' : ''}${result.banner}${!ft && fouled ? ' + AND-ONE' : ''}`
    : ft ? result.made ? 'TREFFER' : 'DANEBEN' : finishBanner(kind, result.made, fouled, s.assisted);
  events.push({ type: 'result', banner: s.banner, made: result.made });
  s.combo = null;
  clearArrow(s, events);
  for (const a of Object.values(s.actors)) {
    if (impacted(a) || ACTORS[a.id].team === 'crew') continue;
    a.y = 0; move(a, ACTORS[a.id].team === 'def' ? 'defend' : 'idle');
  }
  if (s.glass) {
    rt(s).glassCleanup = { stage: 'wait', elapsed: 0 };
  }
  afterShot(s, events);
}

function afterShot(s: PlayState, events: EngineEvent[]): void {
  const { result, kind, fouled, ft } = rt(s).shot!;
  if (ft) {
    s.freeThrows!.left--;
    if (s.freeThrows!.left > 0) freeThrow(s, events); else end(s, events);
  } else {
    const count = freeThrowCount(kind, result.made, fouled);
    if (count) {
      s.freeThrows = { shooter: s.handler, left: count };
      freeThrow(s, events);
      if (s.foulScene) callFoul(s, result.made, events);
      else if (s.poster?.kind === 'block' && !result.made) events.push({ type: 'foul', andOne: false });
    }
    else end(s, events);
  }
}

const MOP_SIDELINE = { x: 7.2, z: 1 };
const MOP_SPOT = { x: 0, z: .6 };

function cleanGlass(s: PlayState, dtReal: number, events: EngineEvent[]): void {
  const r = rt(s), cleanup = r.glassCleanup!;
  cleanup.elapsed += dtReal;
  if (cleanup.stage === 'wait') {
    if (cleanup.elapsed + 1e-9 < .8) return;
    s.actors.mop = { id: 'mop', pos: { ...MOP_SIDELINE }, y: 0, facing: facingTo(MOP_SIDELINE, MOP_SPOT), move: 'run', moveT: 0 };
    cleanup.stage = 'enter'; cleanup.elapsed = 0;
    return;
  }
  const mop = s.actors.mop;
  mop.moveT += dtReal;
  if (cleanup.stage === 'enter') {
    if (stepToward(mop, MOP_SPOT, 5 * dtReal)) {
      cleanup.stage = 'sweep'; cleanup.elapsed = 0;
      mop.facing = 0; move(mop, 'mop_sweep', true);
    }
  } else if (cleanup.stage === 'sweep') {
    s.glassSweep = Math.min(1, cleanup.elapsed / 2.4);
    mop.pos.x = .6 * Math.sin(s.glassSweep * Math.PI * 8);
    if (s.glassSweep === 1) { cleanup.stage = 'leave'; cleanup.elapsed = 0; move(mop, 'run', true); }
  } else if (stepToward(mop, MOP_SIDELINE, 5 * dtReal)) {
    delete s.actors.mop;
    s.glass = null;
    r.glassCleanup = undefined;
    events.push({ type: 'glassFixed' });
  }
}

function startImpact(s: PlayState, shot: Shot, cfg: EngineConfig, rng: () => number): void {
  const blocked = !shot.result.made, h = s.actors[s.handler], victim = blocked ? h : s.actors[shot.defender!];
  const choice = cfg.posterVariant ?? 'random';
  const roll = !blocked && choice === 'random' ? rng() : 0;
  const variant: PosterVariant = blocked ? 'classic' : choice === 'random' ? roll < .3 ? 'classic' : roll < .4 ? 'flyout' : roll < .5 ? 'grave'
    : roll < .6 ? 'crowd' : roll < .7 ? 'net' : roll < .8 ? 'ghost' : roll < .9 ? 'stuck' : 'jumbotron' : choice;
  if (blocked) shot.fouled = rng() < (cfg.blockFoulChance ?? .15);
  victim.y = 0;
  move(victim, variant === 'stuck' ? 'legs_up' : 'knocked_down', true);
  s.poster = { victim: victim.id, kind: blocked ? 'block' : 'poster', variant,
    startedAt: ['flyout', 'crowd', 'net', 'jumbotron'].includes(variant) ? Infinity : s.realTime };
  const from = { ...victim.pos }, sign = blocked ? -1 : 1;
  // Hinter Grundlinie und Ständer, mit Abstand zur rückwärtigen Bande.
  const to = variant === 'flyout' ? { x: (from.x >= 0 ? 1 : -1) * .8, z: -2.4 }
    // z = 1,5 wäre der Treppenaufgang zwischen den Zuschauerblöcken.
    : variant === 'crowd' ? { x: (from.x >= 0 ? 1 : -1) * 15.775, z: 2.4 }
    : variant === 'net' ? { x: 0, z: 0 }
    : variant === 'jumbotron' ? { x: (from.x >= 0 ? 1 : -1) * .8, z: -2.4 }
    : ['grave', 'ghost', 'stuck'].includes(variant) ? { ...from }
      : { x: from.x + sign * .9 * Math.sin(h.facing), z: from.z - sign * .9 * Math.cos(h.facing) };
  rt(s).impact = { victim: victim.id, from, to, elapsed: 0,
    duration: variant === 'flyout' ? .9 : variant === 'crowd' || variant === 'net' ? 1
      : variant === 'jumbotron' ? 2.3 : variant === 'grave' || variant === 'ghost' ? .5 : .3, variant };
  if (variant === 'grave' || variant === 'ghost') s.grave = { ...from, since: s.realTime };
}

function updateImpact(s: PlayState, dt: number): void {
  const impact = rt(s).impact;
  if (!impact) return;
  const a = s.actors[impact.victim];
  impact.elapsed += dt;
  const f = Math.min(1, impact.elapsed / impact.duration), variant = impact.variant, height = ACTORS[a.id].heightM;
  a.pos = { x: mix(impact.from.x, impact.to.x, f), z: mix(impact.from.z, impact.to.z, f) };
  if (variant === 'jumbotron') {
    const hit = { x: 0, z: 10.65 }, up = Math.min(1, impact.elapsed / 1.3);
    if (impact.elapsed + 1e-9 < 1.3) {
      a.pos = { x: mix(impact.from.x, hit.x, up), z: mix(impact.from.z, hit.z, up) };
      a.y = 13.1 * (1 - (1 - up) ** 2);
    } else {
      s.ouch ??= { since: s.realTime };
      const fall = Math.max(0, Math.min(1, impact.elapsed - 1.3));
      a.pos = { x: mix(hit.x, impact.to.x, fall), z: mix(hit.z, impact.to.z, fall) };
      a.y = 13.1 * (1 - fall * fall);
    }
  } else {
    a.y = variant === 'flyout' ? 4 * 2.8 * f * (1 - f)
      : variant === 'crowd' ? 4 * 3.4 * f * (1 - f) + .7 * f
      : variant === 'net' ? (2.8 - 1.15 * height) * f + 4 * .8 * f * (1 - f)
      : variant === 'grave' || variant === 'ghost' ? -height * f
      : variant === 'stuck' ? -.65 * height * f : 0;
  }
  if (f === 1) {
    a.pos = { ...impact.to };
    if (s.poster!.startedAt === Infinity) s.poster!.startedAt = s.realTime;
    if (variant === 'ghost') s.ghost ??= { ...impact.to, since: s.realTime };
    if (variant === 'stuck') {
      move(a, 'legs_up');
      s.splinters ??= { ...impact.to, since: s.realTime };
    }
    if (variant === 'net') {
      move(a, 'hang_upside');
      a.pos.x = .08 * Math.sin((impact.elapsed - impact.duration) * 3);
    } else rt(s).impact = undefined;
  }
}

function shotAnimation(s: PlayState, dt: number, events: EngineEvent[], cfg: EngineConfig, rng: () => number): void {
  const shot = rt(s).shot!, a = s.actors[s.handler], m = MOVES[a.move];
  shot.elapsed += dt;
  const t = shot.elapsed;
  const blocked = shot.kind === 'contact_dunk' && !shot.result.made && shot.defender !== undefined;
  if (t >= Math.max(1.1, shot.delay + .2) && shot.flight) {
    if (!impacted(a)) { a.y = 0; move(a, 'idle'); }
    if (shot.defender) {
      const d = s.actors[shot.defender];
      if (!impacted(d)) { d.y = 0; move(d, 'defend'); }
    }
    s.ball = shot.flight.at(t - shot.delay);
    if (t >= shot.delay + shot.flight.duration) finishShot(s, events);
    return;
  }
  const isDunk = shot.kind === 'dunk' || shot.kind === 'contact_dunk';
  if (isDunk && !shot.glassChecked && t + 1e-9 >= m.rimFrame! / m.fps) {
    shot.glassChecked = true;
    const chance = cfg.glassChance ?? .08;
    if (shot.result.made && (cfg.forceGlass || (shot.perfect && chance > 0 && rng() < chance))) {
      s.glass = { since: s.realTime };
      s.glassSweep = 0;
      events.push({ type: 'glass' });
    }
  }
  if (impacted(a)) {
    // Die Kontaktbewegung gehört updateImpact, nicht mehr der Wurfanimation.
  } else if (isDunk && !blocked) {
    const contactT = m.rimFrame! / m.fps;
    const target = shot.result.made ? { x: 0, y: 3.05, z: 0 }
      : targetPoint(shot.result.outcome === 'airball' ? 'rim_front' : shot.result.outcome, { ...shot.from, y: 0 });
    const targetHand = poses[a.move][m.rimFrame!][m.ballHand!], size = ACTORS[a.id].heightM;
    // Bis zum Ringkontakt steigen, anschließend landen; wechselnde Handposen
    // dürfen den Fußversatz nicht schon während des Absprungs absenken.
    const jump = Math.max(0, target.y - targetHand.y * size);
    const hangUntil = m.frames / m.fps;
    // Position und Höhe stammen vom Tipp; nur die verbleibende Animationszeit führt zum Ring.
    const progress = Math.min(1, (t - shot.windup) / (contactT - shot.windup));
    a.y = t <= contactT ? mix(shot.fromY, jump, progress)
      : jump * (t <= hangUntil ? 1 : Math.max(0, (1.1 - t) / (1.1 - hangUntil)));
    const co = Math.cos(a.facing), si = Math.sin(a.facing);
    a.pos = { x: mix(shot.from.x, target.x - size * (targetHand.x * co + targetHand.z * si), progress),
      z: mix(shot.from.z, target.z - size * (targetHand.x * si - targetHand.z * co), progress) };
  } else {
    a.pos = { ...shot.from };
    if (a.move === 'reverse_layup') {
      const len = Math.hypot(shot.from.x, shot.from.z) || 1;
      const f = Math.min(1, (t - shot.windup) / (m.rimFrame! / m.fps - shot.windup));
      a.pos = { x: mix(shot.from.x, -.55 * shot.from.x / len, f),
        z: mix(shot.from.z, -.55 * shot.from.z / len, f) };
    }
    a.y = Math.max(0, Math.sin(Math.PI * Math.min(1, t / 1.1))) * (shot.kind === 'layup' ? .35 : .25);
  }
  if (shot.fouled && !impacted(a)) a.pos.x += .12 * Math.sin(Math.PI * Math.min(1, t / 1.1));
  if (shot.defender) {
    const d = s.actors[shot.defender];
    if (blocked) d.moveT = Math.min(t, shot.delay);
    const posterContact = shot.kind === 'contact_dunk' && shot.result.made;
    if (!impacted(d)) d.y = shot.fouled && !blocked && !posterContact ? 0
      : .3 * Math.max(0, Math.sin(Math.PI * Math.min(1, (blocked ? Math.min(t, shot.delay) : t) / .8)));
    if (posterContact && shot.defenderFrom && !impacted(d)) {
      const from = shot.defenderFrom, contactT = MOVES.contact_dunk.rimFrame! / MOVES.contact_dunk.fps;
      const push = Math.max(0, Math.min(1, (t - contactT) / .3));
      const co = Math.cos(a.facing), si = Math.sin(a.facing);
      // Vor dem Ringbild Körperkontakt, danach in Angriffsrichtung nach hinten räumen.
      const meet = Math.min(1, (t - shot.windup) / (contactT - shot.windup));
      const contact = { x: a.pos.x + .35 * si, z: a.pos.z - .35 * co };
      d.pos = { x: mix(from.x, contact.x, meet) + .9 * si * push,
        z: mix(from.z, contact.z, meet) - .9 * co * push };
    } else if (shot.fouled && !blocked && !impacted(d) && shot.defenderFrom) {
      const from = shot.defenderFrom, len = distance(from, shot.from) || 1, p = Math.min(1, t / .4) * .15;
      d.pos = { x: from.x + (shot.from.x - from.x) / len * p, z: from.z + (shot.from.z - from.z) / len * p };
    }
  }
  const release = hand(a);
  if (shot.kind === 'contact_dunk' && shot.defender && !s.poster
    && t + 1e-9 >= MOVES.contact_dunk.rimFrame! / MOVES.contact_dunk.fps) startImpact(s, shot, cfg, rng);
  if (t < shot.delay - 1e-9) { heldBall(s); return; }
  if (!shot.flight) {
    shot.flight = shot.kind === 'layup' || isDunk ? buildFinishFlight(shot.kind as 'layup' | 'dunk' | 'contact_dunk', shot.result.outcome, release, .1,
      { from: { ...shot.from, y: 0 }, block: blocked ? hand(s.actors[shot.defender!]) : undefined })
      : buildFlight(shot.result.outcome, release);
  }
  s.ball = shot.flight.at(Math.max(0, t - shot.delay));
  if (t >= shot.delay + shot.flight.duration) finishShot(s, events);
}

function tick(s: PlayState, dtReal: number, cfg: EngineConfig, rng: () => number, events: EngineEvent[]): void {
  const r = rt(s), oldPhase = s.phase;
  s.realTime += dtReal;
  // Reinigung und Crew-Animation laufen unabhängig von Spielphase und Zeitlupe.
  if (r.glassCleanup) cleanGlass(s, dtReal, events);
  if (oldPhase === 'ended') {
    // Nur die Ergebnis-Animation läuft weiter; Spieluhr und Regeln sind abgeschlossen.
    updateImpact(s, dtReal * cfg.animSpeed);
    for (const a of Object.values(s.actors)) if (ACTORS[a.id].team !== 'crew') a.moveT += dtReal * cfg.animSpeed;
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
  const slow = oldPhase === 'decision' || oldPhase === 'combo' || oldPhase === 'takeoff';
  const dt = dtReal * cfg.animSpeed * (slow ? cfg.slowmo : 1);
  r.phaseT += dt; r.realT += dtReal;
  if (oldPhase === 'intro') {
    if (r.phaseT >= .7) phase(s, 'running');
    return;
  }
  s.gameT += dt;
  updateImpact(s, dt);
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
  for (const a of Object.values(s.actors)) if (ACTORS[a.id].team !== 'crew') a.moveT += dt;
  const previous = r.segT;
  r.segT += dt * ((oldPhase === 'decision' || (oldPhase === 'combo' && r.comboWait?.phase === 'decision'))
    ? r.decisionPathRate ?? 1 : 1);
  updatePaths(s, previous);
  applyTactic(s, dt, events);
  applyHelp(s, dt);
  if (oldPhase === 'running') {
    // Entscheiden im Laufen: das Fenster öffnet schon während der letzten Wegsekunde, niemand bleibt stehen
    if (r.segT >= Math.max(0, (r.segment.decisionAt ?? 0) - (cfg.decisionLead ?? 0))) decision(s, events, cfg);
  } else if (oldPhase === 'decision' && !s.arrowMeter && !s.fingerDown
    && (r.aiSelected || cfg.decisionLead === undefined ? r.segT + 1e-9 >= (r.segment.decisionAt ?? 0) && r.realT + 1e-9 >= cfg.decisionS
      : s.gameT + 1e-9 >= r.decisionEnd!)) {
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
    if (p.board) {
      // 60 % der Zeit zum Brett, dann im kleinen Bogen herunter in die Hand des Fängers
      const b = p.board, g = f <= .6 ? f / .6 : (f - .6) / .4;
      s.ball = f <= .6
        ? { x: mix(p.from.x, b.x, g), y: mix(p.from.y, b.y, g) + 1.2 * 4 * g * (1 - g), z: mix(p.from.z, b.z, g) }
        : { x: mix(b.x, p.to.x, g), y: mix(b.y, p.to.y, g) + .35 * 4 * g * (1 - g), z: mix(b.z, p.to.z, g) };
    }
    if (f >= 1) {
      if (p.stolenBy) {
        // Nur das tatsächliche Abfangen zählt als Ballverlust, niemals Ballbesitz oder Closeout.
        s.ball = hand(s.actors[p.stolenBy]); s.turnovers++;
        end(s, events, 'STEAL');
      } else {
        s.lastPasser = s.handler;
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
    // Ausholen synchron zum Abschluss-Pfeil: bis zur Spitze 75 % des Weges bis zum Ringkontakt,
    // danach wartet die Pose; startShot spielt von hier aus im normalen Tempo weiter.
    const a = s.actors[s.handler], m = s.arrowMeter, rim = MOVES[a.move].rimFrame;
    if (m && m.fill === null && rim !== undefined) {
      const p = Math.max(0, Math.min(1, (s.realTime - m.startTime) / (m.meterMs / 1000)));
      a.moveT = WINDUP_SHARE * p * rim / MOVES[a.move].fps;
    } else a.moveT = 0;
    if (!s.arrowMeter && r.realT + 1e-9 >= cfg.decisionS && !s.fingerDown) miss(s, events, r.aiSelected ? 'ZU LANGE GEZÖGERT' : 'VERLEGT');
  } else if (oldPhase === 'combo') {
    s.actors[s.handler].moveT = 0;
    // Auch abgebrochene Kombis und Freiwürfe haben eine endliche Wartezeit.
    // Freiwürfe warten ohne Zeitlimit auf den Nutzer
    if (!s.freeThrows && r.realT >= cfg.decisionS + s.combo!.meterMs * 1.6 / 1000) miss(s, events, finishing ? 'VERLEGT' : 'ZU LANGE GEZÖGERT');
  } else if (oldPhase === 'ballflight') shotAnimation(s, dt, events, cfg, rng);
  const meter = s.arrowMeter;
  if (meter && meter.fill === null) {
    if (meter.kind === 'catchshoot') refreshCatchArrow(s, currentP(s), cfg);
    const endTime = meter.startTime + meter.meterMs * arrowEndFill(meter.kind) / 1000;
    // Auch ein aufliegender Finger verlängert den einmaligen Durchlauf nicht.
    if (s.realTime + 1e-9 >= endTime) {
      s.fingerDown = false;
      if (meter.kind !== 'catchshoot') timeoutFinishArrow(s, rng, events);
      else { clearArrow(s, events); decision(s, events, cfg); }
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
    if (cfg.controlled) aiAct(s, cfg, rng, events);
    left -= dt;
  }
  return events;
}
