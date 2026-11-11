import { framesFromKeys } from './skeleton';
import type { Pose, V3 } from './skeleton';

export type MoveId = 'idle'|'run'|'dribble'|'dribble_run'|'pass'|'catch'|'jumpshot'|'layup'|'dunk'|'contact_dunk'|'defend'|'block_jump'|'contact'|'knocked_down'
  | 'reverse_layup'|'block_jump_hit'|'crossover'|'behind_back'|'spin_move'|'hesitation'
  | 'euro_step'|'finger_roll'|'tomahawk_dunk'|'two_hand_dunk'|'step_back'|'fadeaway'
  | 'celebrate'|'dejected'|'pass_bounce'|'pass_overhead'
  | 'ref_whistle'|'flex'|'high_five';
export interface MoveDef { frames: number; fps: number; loop: boolean; keys: Pose[]; ballHand: 'haL' | 'haR' | null; rimFrame?: number }

type Limb = [upperPitch: number, lowerPitch: number, upperSpread?: number, lowerSpread?: number];
interface PoseOptions {
  x?: number;
  height?: number;
  forward?: number;
  lean?: number;
  turn?: number;
  arms?: [Limb, Limb];
  legs?: [Limb, Limb];
}
const rad = (degrees: number) => degrees * Math.PI / 180;

function segment(start: V3, length: number, pitch: number, spread = 0): V3 {
  const p = rad(pitch);
  const s = rad(spread);
  return {
    x: start.x + length * Math.sin(s),
    y: start.y - length * Math.cos(s) * Math.cos(p),
    z: start.z + length * Math.cos(s) * Math.sin(p),
  };
}

function limb(start: V3, angles: Limb, upper: number, lower: number): [V3, V3] {
  const middle = segment(start, upper, angles[0], angles[2]);
  return [middle, segment(middle, lower, angles[1], angles[3])];
}

function pose({ x = 0, height = 0.5, forward = 0, lean = 0, turn = 0,
  arms = [[5, 20, -8, -5], [5, 20, 8, 5]],
  legs = [[0, 0], [0, 0]],
}: PoseOptions = {}): Pose {
  const pelvis = { x, y: height, z: forward };
  const spine = (up: number, side = 0): V3 => ({
    x: x + side, y: height + up * Math.cos(rad(lean)), z: forward + up * Math.sin(rad(lean)),
  });
  const shL = spine(0.29, -0.115);
  const shR = spine(0.29, 0.115);
  const hipL = spine(0, -0.065);
  const hipR = spine(0, 0.065);
  // Feste Segmentlängen und kleine Winkelschritte halten auch Zwischenbilder anatomisch stimmig.
  const [elL, haL] = limb(shL, arms[0], 0.175, 0.165);
  const [elR, haR] = limb(shR, arms[1], 0.175, 0.165);
  const [knL, ftL] = limb(hipL, legs[0], 0.25, 0.25);
  const [knR, ftR] = limb(hipR, legs[1], 0.25, 0.25);
  const result = { head: spine(0.5), neck: spine(0.39), shL, shR, elL, elR, haL, haR,
    pelvis, hipL, hipR, knL, knR, ftL, ftR };
  if (!turn) return result;
  const co = Math.cos(rad(turn)), si = Math.sin(rad(turn));
  return Object.fromEntries(Object.entries(result).map(([j, p]) => [j, {
    x: x + (p.x - x) * co + (p.z - forward) * si, y: p.y,
    z: forward - (p.x - x) * si + (p.z - forward) * co,
  }])) as Pose;
}

/** Winkel statt Gelenksehnen interpolieren: auch volle Drehungen behalten ihre Anatomie.
 * Die acht abgetasteten Schlüsselposen sind zugleich die acht Rasterbilder. */
function sequence(stages: PoseOptions[]): Pose[] {
  const defaults: Required<PoseOptions> = { x: 0, height: .5, forward: 0, lean: 0, turn: 0,
    arms: [[5, 20, -8, -5], [5, 20, 8, 5]], legs: [[0, 0, 0, 0], [0, 0, 0, 0]] };
  return Array.from({ length: 8 }, (_, i) => {
    const t = i * (stages.length - 1) / 7, k = Math.min(stages.length - 2, Math.floor(t)), f = t - k;
    const a = { ...defaults, ...stages[k] }, b = { ...defaults, ...stages[k + 1] };
    const lerp = (a: number, b: number) => a + (b - a) * f;
    const limbs = (key: 'arms' | 'legs') => a[key].map((angles, side) =>
      [0, 1, 2, 3].map(n => lerp(angles[n] ?? 0, b[key][side][n] ?? 0)) as Limb) as [Limb, Limb];
    const p = pose({ x: lerp(a.x, b.x), height: lerp(a.height, b.height), forward: lerp(a.forward, b.forward),
      lean: lerp(a.lean, b.lean), turn: lerp(a.turn, b.turn), arms: limbs('arms'), legs: limbs('legs') });
    const lift = Math.max(0, -p.ftL.y, -p.ftR.y);
    for (const joint of Object.values(p)) joint.y += lift;
    return p;
  });
}

const newMove = (keys: Pose[], ballHand: MoveDef['ballHand'] = 'haR', rimFrame?: number, fps = 10): MoveDef =>
  ({ frames: 8, fps, loop: false, keys, ballHand, ...(rimFrame === undefined ? {} : { rimFrame }) });

function finishKeys(reverse = false, euro = false, finger = false): Pose[] {
  return sequence([
    { x: euro ? -.12 : 0, height: .5, arms: [[50, 100], [80, 120]], legs: [[-16, -30], [16, 0]] },
    { x: euro ? .12 : 0, height: .5, arms: [[35, 90], [110, 140]], legs: [[16, 0], [-16, -30]] },
    { height: .65, lean: reverse ? -8 : 0, arms: [[10, 65], [145, reverse ? 185 : 160]], legs: [[-5, -35], [40, 0]] },
    { height: .78, lean: reverse ? -16 : 0, arms: [[5, 60], [reverse ? 200 : finger ? 150 : 170, reverse ? 220 : finger ? 175 : 180]],
      legs: [[-10, -50], [50, 20]] },
  ]);
}

function variantDunkKeys(tomahawk: boolean): Pose[] {
  const base = dunkKeys(false);
  if (!tomahawk) return sequence([
    { height: .44, arms: [[90, 120, 10, 10], [90, 120, -10, -10]], legs: [[30, -30], [30, -30]] },
    { height: .6, arms: [[130, 150, 10, 10], [130, 150, -10, -10]], legs: [[20, -45], [20, -45]] },
    { height: .86, arms: [[140, 150, 10, 10], [140, 150, -10, -10]], legs: [[10, -65], [10, -65]] },
    // Gleiche Handhöhe am Ring wie beim Grund-Dunk; beide Hände greifen enger.
    { height: base[3].pelvis.y, forward: base[3].pelvis.z, arms: [[170, 180, 10, 10], [170, 180, -10, -10]], legs: [[-15, -80], [-15, -80]] },
  ]);
  return sequence([
    { height: .44, arms: [[35, 90], [100, 140]], legs: [[30, -30], [30, -30]] },
    { height: .64, lean: -5, arms: [[25, 80], [185, 245]], legs: [[10, -65], [35, -20]] },
    { height: .86, arms: [[15, 75], [140, 150]], legs: [[10, -65], [10, -65]] },
    { height: base[3].pelvis.y, forward: base[3].pelvis.z, arms: [[10, 65], [170, 180]], legs: [[-15, -80], [-15, -80]] },
  ]);
}

function runningKeys(dribbling: boolean): Pose[] {
  const plantHeight = 0.25 * (Math.cos(rad(30)) + Math.cos(rad(5)));
  const steps: PoseOptions[] = [
    { height: plantHeight, legs: [[30, -5], [-25, -55]], arms: [[-25, 65], [25, 95]] },
    { height: 0.52, legs: [[0, -25], [0, -30]], arms: [[0, 80], [0, 80]] },
    { height: plantHeight, legs: [[-25, -55], [30, -5]], arms: [[25, 95], [-25, 65]] },
    { height: 0.52, legs: [[0, -30], [0, -25]], arms: [[0, 80], [0, 80]] },
  ];
  return steps.map((step, i) => pose({ ...step, lean: 8,
    arms: dribbling ? [step.arms![0], i % 2 === 0 ? [-10, 15, 12, 8] : [20, 50, 12, 8]] : step.arms,
  }));
}

function dunkKeys(contact: boolean): Pose[] {
  const lean = contact ? 8 : 0;
  const side = contact ? 0.055 : 0;
  // Beim Hängen bleibt die Hand am Ring, während der Körper darunter schwingt.
  const reach = (upper: number, lower: number) => segment(segment({ x: 0, y: 0, z: 0 }, 0.175, upper), 0.165, lower);
  const touch = reach(140, 150);
  const hang = reach(170, 180);
  return [
    pose({ height: 0.44, lean, arms: [contact ? [80, 110] : [90, 120], [90, 120]], legs: [[30, -30], [30, -30]] }),
    pose({ x: -side, height: 0.54, lean, arms: [contact ? [105, 130] : [115, 135], [115, 135]], legs: [[20, -45], [20, -45]] }),
    // Die Engine ergänzt die Sprunghöhe; auch der größte Big erreicht so den Ring ohne negativen Fußversatz.
    pose({ x: side, height: 0.86, lean, arms: [contact ? [130, 150] : [140, 150], [140, 150]], legs: [[10, -65], contact ? [-10, -55] : [10, -65]] }),
    pose({ x: side, height: 0.86 + touch.y - hang.y, forward: touch.z - hang.z, lean,
      arms: [contact ? [155, 170] : [170, 180], [170, 180]], legs: [[-15, -80], contact ? [10, -65] : [-15, -80]] }),
  ];
}

function knockedDownKeys(): Pose[] {
  // Den ganzen Körper drehen: Segmentlängen bleiben beim Fallen erhalten.
  // Angezogene Beine halten die liegende Figur innerhalb der Atlas-Zelle.
  const base = pose({ arms: [[25, 90], [25, 90]], legs: [[70, -70], [70, -70]] });
  return [0, 50, 90, 90].map(degrees => {
    const angle = rad(degrees), co = Math.cos(angle), si = Math.sin(angle);
    return Object.fromEntries(Object.entries(base).map(([joint, p]) => [joint, {
      x: p.x,
      y: .14 + .36 * co + (p.y - .5) * co + p.z * si,
      z: .18 * si - (p.y - .5) * si + p.z * co,
    }])) as Pose;
  });
}

export const MOVES: Record<MoveId, MoveDef> = {
  idle: { frames: 2, fps: 10, loop: true, ballHand: null, keys: [
    pose(), pose({ height: 0.505 }),
  ] },
  run: { frames: 8, fps: 12, loop: true, ballHand: null, keys: runningKeys(false) },
  dribble: { frames: 6, fps: 10, loop: true, ballHand: 'haR', keys: [
    pose({ height: 0.46, lean: 10, legs: [[25, -25], [25, -25]],
      arms: [[30, 95, -25, -20], [-10, 15, 12, 8]] }),
    pose({ height: 0.47, lean: 10, legs: [[25, -25], [25, -25]],
      arms: [[30, 95, -25, -20], [20, 50, 12, 8]] }),
  ] },
  dribble_run: { frames: 8, fps: 12, loop: true, ballHand: 'haR', keys: runningKeys(true) },
  pass: { frames: 6, fps: 10, loop: false, ballHand: 'haR', keys: [
    pose({ arms: [[50, 120, 15, 20], [50, 120, -15, -20]] }),
    pose({ lean: 4, arms: [[65, 100, 15, 20], [65, 100, -15, -20]] }),
    pose({ lean: 8, arms: [[80, 80, 15, 20], [80, 80, -15, -20]] }),
    pose({ lean: 10, arms: [[80, 80, 15, 20], [80, 80, -15, -20]] }),
  ] },
  catch: { frames: 4, fps: 10, loop: false, ballHand: 'haR', keys: [
    pose({ arms: [[80, 80, 15, 20], [80, 80, -15, -20]] }),
    pose({ arms: [[65, 100, 15, 20], [65, 100, -15, -20]] }),
    pose({ height: 0.485, legs: [[15, -15], [15, -15]],
      arms: [[50, 120, 15, 20], [50, 120, -15, -20]] }),
    pose({ height: 0.485, legs: [[15, -15], [15, -15]],
      arms: [[50, 120, 15, 20], [50, 120, -15, -20]] }),
  ] },
  jumpshot: { frames: 6, fps: 10, loop: false, ballHand: 'haR', keys: [
    pose({ height: 0.44, legs: [[30, -30], [30, -30]], arms: [[90, 120], [90, 120]] }),
    pose({ arms: [[120, 140], [120, 140]], legs: [[15, -15], [15, -15]] }),
    pose({ height: 0.63, arms: [[150, 160], [150, 160]] }),
    pose({ height: 0.6, arms: [[175, 180], [175, 180]], legs: [[0, -15], [0, -15]] }),
  ] },
  layup: { frames: 8, fps: 10, loop: false, ballHand: 'haR', rimFrame: 7, keys: [
    pose({ legs: [[-16, -30], [16, 0]], arms: [[65, 110], [90, 120]] }),
    pose({ height: 0.495, legs: [[16, 0], [-16, -30]], arms: [[40, 95], [125, 140]] }),
    pose({ height: 0.65, legs: [[-5, -25], [18, 0]], arms: [[15, 80], [155, 165]] }),
    pose({ height: 0.78, legs: [[-10, -50], [50, 20]], arms: [[0, 65], [170, 180]] }),
  ] },
  dunk: { frames: 8, fps: 10, loop: false, ballHand: 'haR', rimFrame: 5, keys: dunkKeys(false) },
  contact_dunk: { frames: 8, fps: 10, loop: false, ballHand: 'haR', rimFrame: 5, keys: dunkKeys(true) },
  defend: { frames: 6, fps: 10, loop: true, ballHand: null, keys: [
    pose({ x: -0.045, height: 0.38, lean: 10, legs: [[25, -25, -35, -35], [30, -30, 35, 35]],
      arms: [[50, 80, -65, -55], [50, 80, 65, 55]] }),
    pose({ x: 0.045, height: 0.38, lean: 10, legs: [[30, -30, -35, -35], [25, -25, 35, 35]],
      arms: [[50, 80, -65, -55], [50, 80, 65, 55]] }),
  ] },
  block_jump: { frames: 6, fps: 10, loop: false, ballHand: null, keys: [
    pose({ height: 0.44, legs: [[30, -30], [30, -30]], arms: [[90, 120], [90, 120]] }),
    pose({ height: 0.54, legs: [[15, -15], [15, -15]], arms: [[120, 140], [120, 140]] }),
    pose({ height: 0.7, arms: [[150, 160], [150, 160]] }),
    pose({ height: 0.65, arms: [[175, 180], [175, 180]] }),
  ] },
  contact: { frames: 4, fps: 10, loop: false, ballHand: null, keys: [
    pose({ height: 0.46, legs: [[25, -25], [25, -25]], arms: [[45, 100], [45, 100]] }),
    pose({ height: 0.45, forward: 0.045, lean: 8, legs: [[40, -10], [10, -40]], arms: [[65, 90], [65, 90]] }),
    pose({ height: 0.45, forward: 0.09, lean: 12, legs: [[45, 0], [0, -45]], arms: [[75, 80], [75, 80]] }),
    pose({ height: 0.46, forward: 0.09, lean: 8, legs: [[30, -15], [15, -30]], arms: [[60, 95], [60, 95]] }),
  ] },
  knocked_down: { frames: 4, fps: 10, loop: false, ballHand: null, keys: knockedDownKeys() },
  reverse_layup: newMove(finishKeys(true), 'haR', 7),
  euro_step: newMove(finishKeys(false, true), 'haR', 7),
  finger_roll: newMove(finishKeys(false, false, true), 'haR', 7),
  tomahawk_dunk: newMove(variantDunkKeys(true), 'haR', 5),
  two_hand_dunk: newMove(variantDunkKeys(false), 'haR', 5),
  block_jump_hit: newMove(sequence([
    { height: .44, arms: [[90, 120], [90, 120]], legs: [[30, -30], [30, -30]] },
    { height: .62, arms: [[140, 160], [140, 160]], legs: [[15, -15], [15, -15]] },
    { height: .72, lean: -8, arms: [[165, 180], [165, 180]], legs: [[5, -25], [5, -25]] },
    { height: .6, forward: -.08, lean: -25, arms: [[100, 145, -25, -20], [100, 145, 25, 20]], legs: [[20, -35], [10, -45]] },
  ]), null),
  crossover: newMove(sequence([
    { height: .47, lean: 12, arms: [[20, 70, -20, -10], [5, 25, 35, 30]], legs: [[20, -20, -15, -10], [20, -20, 15, 10]] },
    { x: -.08, height: .46, lean: 15, arms: [[20, 70, -20, -10], [15, 35, -30, -30]], legs: [[25, -25, -25, -20], [15, -20, 20, 10]] },
    { x: -.1, height: .49, lean: 10, arms: [[20, 75], [25, 55, -35, -25]], legs: [[30, -5], [-25, -55]] },
  ]), 'haR', undefined, 20),
  behind_back: newMove(sequence([
    { height: .49, lean: 10, arms: [[30, 80], [-25, 0, 25, 25]], legs: [[20, -10], [-20, -45]] },
    { height: .47, lean: 10, arms: [[30, 80], [-45, -20, -25, -30]], legs: [[15, -15], [15, -25]] },
    { height: .5, lean: 10, arms: [[30, 80], [0, 35, -35, -30]], legs: [[-20, -45], [25, 0]] },
  ]), 'haR', undefined, 20),
  spin_move: newMove(sequence([
    { height: .48, lean: 8, turn: 0, arms: [[30, 90], [30, 100]], legs: [[15, -20], [20, -20]] },
    { height: .49, lean: 8, turn: 180, arms: [[40, 100], [50, 115]], legs: [[25, -25], [10, -30]] },
    { height: .5, lean: 8, turn: 360, arms: [[30, 90], [20, 60]], legs: [[-20, -45], [25, 0]] },
  ]), 'haR', undefined, 20),
  hesitation: newMove(sequence([
    { height: .47, lean: 12, arms: [[25, 80], [0, 25, 20, 15]], legs: [[25, -25], [20, -25]] },
    { height: .52, lean: 0, arms: [[30, 90], [35, 80, 20, 15]], legs: [[10, -15], [10, -15]] },
    { height: .5, lean: 16, arms: [[25, 80], [0, 30, 20, 15]], legs: [[30, -5], [-25, -55]] },
  ]), 'haR', undefined, 20),
  step_back: newMove(sequence([
    { height: .46, arms: [[65, 115], [65, 115]], legs: [[25, -25], [25, -25]] },
    { height: .5, forward: -.1, arms: [[100, 135], [100, 135]], legs: [[-15, -35], [15, -15]] },
    { height: .65, forward: -.2, arms: [[145, 160], [145, 160]], legs: [[0, -15], [0, -15]] },
    { height: .6, forward: -.2, arms: [[170, 180], [170, 180]] },
  ]), 'haR', 5),
  fadeaway: newMove(sequence([
    { height: .46, arms: [[85, 120], [85, 120]], legs: [[25, -25], [25, -25]] },
    { height: .57, lean: -8, forward: -.06, arms: [[120, 145], [120, 145]], legs: [[10, -25], [10, -25]] },
    { height: .67, lean: -20, forward: -.14, arms: [[150, 170], [150, 170]], legs: [[15, -25], [15, -25]] },
    { height: .62, lean: -25, forward: -.2, arms: [[165, 180], [165, 180]], legs: [[20, -20], [20, -20]] },
  ]), 'haR', 5),
  // Schiri: linker Arm gestreckt nach oben (Foul angezeigt), rechte Hand mit Pfeife am Mund
  ref_whistle: newMove(sequence([
    { arms: [[5, 20, -8, -5], [5, 20, 8, 5]] },
    { arms: [[150, 165, -8, -6], [50, 150, 10, -20]] },
    { arms: [[172, 178, -6, -4], [55, 165, 12, -25]] },
  ]), null),
  // And-one: Schütze feiert sich selbst ab (Bizeps zeigen, kurz in die Knie)
  flex: newMove(sequence([
    { arms: [[30, 60, -40, -40], [30, 60, 40, 40]] },
    { height: .47, legs: [[10, -15], [10, -15]], arms: [[15, 170, -75, -15], [15, 170, 75, 15]] },
    { height: .5, arms: [[20, 175, -80, -10], [20, 175, 80, 10]] },
  ]), null),
  // Abklatschen: rechter Arm schwingt nach oben vorn
  high_five: newMove(sequence([
    { arms: [[5, 20, -8, -5], [60, 110, 10, 10]] },
    { height: .53, arms: [[5, 20, -8, -5], [145, 160, 5, 5]] },
    { arms: [[5, 20, -8, -5], [120, 140, 8, 8]] },
  ]), null),
  celebrate: newMove(sequence([
    { arms: [[80, 120, -30, -30], [80, 120, 30, 30]] },
    { height: .53, arms: [[140, 170, -20, -20], [140, 170, 20, 20]] },
    { arms: [[145, 170, -20, -20], [95, 150, 20, 20]] },
  ]), null),
  dejected: newMove(sequence([
    { height: .49, lean: 12, arms: [[5, 20], [5, 20]], legs: [[10, -10], [10, -10]] },
    { height: .46, forward: -.06, lean: 45, arms: [[0, 20], [0, 20]], legs: [[20, -20], [20, -20]] },
    { height: .46, forward: -.08, lean: 55, arms: [[-5, 15], [-5, 15]], legs: [[20, -20], [20, -20]] },
  ]), null),
  pass_bounce: newMove(sequence([
    { arms: [[50, 120, 15, 20], [50, 120, -15, -20]] },
    { height: .49, lean: 8, arms: [[40, 70, 15, 20], [40, 70, -15, -20]], legs: [[15, -15], [15, -15]] },
    { height: .48, lean: 12, arms: [[30, 40, 15, 20], [30, 40, -15, -20]], legs: [[20, -20], [20, -20]] },
  ])),
  pass_overhead: newMove(sequence([
    { arms: [[130, 165, 15, 20], [130, 165, -15, -20]] },
    { arms: [[155, 190, 15, 20], [155, 190, -15, -20]] },
    { lean: 8, arms: [[125, 145, 15, 20], [125, 145, -15, -20]] },
  ])),
};

export function moveFrames(id: MoveId): Pose[] {
  const { keys, frames, loop } = MOVES[id];
  return framesFromKeys(keys, frames, loop);
}

export function ballHandAt(id: MoveId, frame: number): V3 | null {
  const hand = MOVES[id].ballHand;
  return hand === null ? null : moveFrames(id)[frame][hand];
}
