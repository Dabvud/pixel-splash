export type Joint = 'head'|'neck'|'shL'|'shR'|'elL'|'elR'|'haL'|'haR'|'pelvis'|'hipL'|'hipR'|'knL'|'knR'|'ftL'|'ftR';
export const JOINTS: readonly Joint[] = [
  'head', 'neck', 'shL', 'shR', 'elL', 'elR', 'haL', 'haR',
  'pelvis', 'hipL', 'hipR', 'knL', 'knR', 'ftL', 'ftR',
];
export interface V3 { x: number; y: number; z: number }
export type Pose = Record<Joint, V3>;
export type Dir = 'front' | 'back' | 'left' | 'right';

export function lerpPose(a: Pose, b: Pose, t: number): Pose {
  return Object.fromEntries(JOINTS.map(joint => [joint, {
    x: a[joint].x * (1 - t) + b[joint].x * t,
    y: a[joint].y * (1 - t) + b[joint].y * t,
    z: a[joint].z * (1 - t) + b[joint].z * t,
  }])) as Pose;
}

export function framesFromKeys(keys: Pose[], count: number, loop: boolean): Pose[] {
  return Array.from({ length: count }, (_, i) => {
    const position = loop ? i * keys.length / count
      : count === 1 ? 0 : i * (keys.length - 1) / (count - 1);
    const index = Math.floor(position);
    return lerpPose(keys[index], keys[(index + 1) % keys.length], position - index);
  });
}

export function project(p: Pose, dir: Dir): Record<Joint, { u: number; v: number; depth: number }> {
  return Object.fromEntries(JOINTS.map(joint => {
    const { x, y, z } = p[joint];
    switch (dir) {
      case 'front': return [joint, { u: -x, v: y, depth: z }];
      case 'back': return [joint, { u: x, v: y, depth: -z }];
      case 'left': return [joint, { u: -z, v: y, depth: -x }];
      case 'right': return [joint, { u: z, v: y, depth: x }];
    }
  })) as Record<Joint, { u: number; v: number; depth: number }>;
}
