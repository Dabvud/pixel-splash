import { framesFromKeys } from './skeleton';
import type { Pose, V3 } from './skeleton';

export type MoveId = 'idle'|'run'|'dribble'|'dribble_run'|'pass'|'catch'|'jumpshot'|'layup'|'dunk'|'contact_dunk'|'defend'|'block_jump'|'contact';
export interface MoveDef { frames: number; fps: number; loop: boolean; keys: Pose[]; ballHand: 'haL' | 'haR' | null; rimFrame?: number }

type Limb = [upperPitch: number, lowerPitch: number, upperSpread?: number, lowerSpread?: number];
interface PoseOptions {
  x?: number;
  height?: number;
  forward?: number;
  lean?: number;
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

function pose({ x = 0, height = 0.5, forward = 0, lean = 0,
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
  return { head: spine(0.5), neck: spine(0.39), shL, shR, elL, elR, haL, haR,
    pelvis, hipL, hipR, knL, knR, ftL, ftR };
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
    pose({ height: 0.44, lean, arms: [[90, 120], [90, 120]], legs: [[30, -30], [30, -30]] }),
    pose({ x: -side, height: 0.54, lean, arms: [[115, 135], [115, 135]], legs: [[20, -45], [20, -45]] }),
    // Die Engine ergänzt die Sprunghöhe; auch der größte Big erreicht so den Ring ohne negativen Fußversatz.
    pose({ x: side, height: 0.86, lean, arms: [[140, 150], [140, 150]], legs: [[10, -65], [10, -65]] }),
    pose({ x: side, height: 0.86 + touch.y - hang.y, forward: touch.z - hang.z, lean,
      arms: [[170, 180], [170, 180]], legs: [[-15, -80], [-15, -80]] }),
  ];
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
};

export function moveFrames(id: MoveId): Pose[] {
  const { keys, frames, loop } = MOVES[id];
  return framesFromKeys(keys, frames, loop);
}

export function ballHandAt(id: MoveId, frame: number): V3 | null {
  const hand = MOVES[id].ballHand;
  return hand === null ? null : moveFrames(id)[frame][hand];
}
