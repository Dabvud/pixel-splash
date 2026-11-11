import * as THREE from 'three';
import { advertisingTexture, videoTexture } from './arena-textures';
import type { CrowdSeat } from './crowd';

type Side = 'baseline' | 'left' | 'right';
type Triple = readonly [number, number, number];
export interface ArenaBox {
  kind: 'tier' | 'stair' | 'rail' | 'concourse' | 'shell' | 'jumbotron' | 'rig' | 'board';
  side?: Side;
  center: Triple; size: Triple; color: number;
}

function random01(index: number): number {
  let n = Math.imul(index + 1, 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

/** Metres. No DOM/WebGL/random globals: layout and clearance can be tested directly. */
export function stadiumLayout(): { boxes: ArenaBox[]; seats: CrowdSeat[] } {
  const boxes: ArenaBox[] = [], seats: CrowdSeat[] = [];
  const add = (kind: ArenaBox['kind'], center: Triple, size: Triple, color: number, side?: Side) => {
    boxes.push({ kind, center, size, color, side });
  };
  let seatIndex = 0;
  for (const side of ['baseline', 'left', 'right'] as const) {
    const baseline = side === 'baseline', sign = side === 'left' ? -1 : 1;
    const length = baseline ? 31 : 29.8, alongStart = baseline ? -15.5 : -5.7;
    const inner = baseline ? 6 : 15.3;
    const point = (along: number, depth: number, y: number): Triple => baseline
      ? [along, y, -inner - depth] : [sign * (inner + depth), y, along];
    const dimensions = (along: number, height: number, depth: number): Triple => baseline
      ? [along, height, depth] : [depth, height, along];
    const blockLength = (length - 3 * 1.2) / 4;
    for (let row = 0; row < 12; row++) {
      const upper = row >= 6, r = row % 6;
      const depth = (upper ? 7.5 : 0) + r * .95 + .475;
      const top = upper ? 4.8 + r * .52 : .7 + r * .46;
      for (let block = 0; block < 4; block++) {
        const start = alongStart + block * (blockLength + 1.2);
        add('tier', point(start + blockLength / 2, depth, top / 2), dimensions(blockLength, top, .95), upper ? 0x171c2b : 0x323543, side);
        const count = Math.floor(blockLength / .72);
        for (let column = 0; column < count; column++) {
          const seed = seatIndex++, variation = random01(seed);
          if (variation < .035) continue;
          const along = start + (column + .5) * blockLength / count;
          const p = point(along, depth, top + .03);
          seats.push({ x: p[0], y: p[1], z: p[2], yaw: baseline ? 0 : -sign * Math.PI / 2,
            style: Math.floor(random01(seed + 3000) * 16), phase: random01(seed + 6000) * Math.PI * 2,
            scale: .88 + variation * .16, upper });
        }
      }
      for (let gap = 1; gap <= 3; gap++) {
        const along = alongStart + gap * blockLength + (gap - .5) * 1.2;
        // Two shorter treads per seating row make the access stairs legible.
        for (let half = 0; half < 2; half++) {
          const stairTop = top - (1 - half) * .23;
          add('stair', point(along, depth + (half - .5) * .475, stairTop / 2), dimensions(1.2, stairTop, .475), upper ? 0x353b4c : 0x626374, side);
        }
      }
    }
    const middle = alongStart + length / 2;
    add('concourse', point(middle, 6.6, 1.5), dimensions(length, 3, 1.8), 0x242a38, side);
    for (let gap = 1; gap <= 3; gap++) {
      const along = alongStart + gap * blockLength + (gap - .5) * 1.2;
      for (let step = 0; step < 6; step++) {
        const top = 3 + (step + 1) * (4.57 - 3) / 6;
        add('stair', point(along, 5.7 + (step + .5) * .3, top / 2), dimensions(1.2, top, .3), 0x626374, side);
      }
    }
    add('shell', point(middle, 13.5, 7), dimensions(length, 14, .4), 0x101521, side);
    // Continuous low fascia, a thin top rail and spaced vertical posts.
    add('rail', point(middle, -.16, .48), dimensions(length, .96, .18), 0x202c3d, side);
    add('rail', point(middle, -.16, 1.14), dimensions(length, .07, .07), 0x858b9a, side);
    for (let block = 0; block < 4; block++) {
      const along = alongStart + block * (blockLength + 1.2) + blockLength / 2;
      add('rail', point(along, 5.8, 4.12), dimensions(blockLength, .07, .07), 0x61697a, side);
    }
    for (let along = alongStart; along <= alongStart + length; along += 2) {
      add('rail', point(along, -.16, .9), dimensions(.065, .48, .065), 0x6e7788, side);
      if ((along - alongStart) % (blockLength + 1.2) <= blockLength) {
        add('rail', point(along, 5.8, 3.56), dimensions(.065, 1.12, .065), 0x61697a, side);
      }
    }
  }
  add('jumbotron', [0, 14.5, 12.425], [4.6, 2.6, 3.4], 0x111622);
  add('rig', [0, 17.4, 12.425], [.12, 3.2, .12], 0x434955);
  for (const z of [-5, 5, 15]) {
    add('rig', [0, 18.6, z], [48, .18, .18], 0x242c3b);
    add('rig', [0, 19.1, z], [48, .12, .12], 0x242c3b);
  }
  for (const x of [-10, 10]) add('rig', [x, 18.6, 5], [.18, .18, 40], 0x242c3b);
  for (const x of [-5, 0, 5]) add('board', [x, .48, -4.05], [4.8, .96, .24], 0x202633);
  for (const x of [-9.85, 9.85]) for (const z of [.5, 6, 11.5]) {
    add('board', [x, .48, z], [.24, .96, 4.8], 0x202633);
  }
  return { boxes, seats };
}

/** All opaque structure shares one box geometry/material/draw call. */
export function buildStadiumSolids(boxes: readonly ArenaBox[]): THREE.InstancedMesh<THREE.BoxGeometry, THREE.MeshLambertMaterial> {
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial(), boxes.length);
  mesh.name = 'arena-structure';
  const transform = new THREE.Object3D(), color = new THREE.Color();
  boxes.forEach((box, i) => {
    transform.position.set(...box.center); transform.scale.set(...box.size); transform.updateMatrix();
    mesh.setMatrixAt(i, transform.matrix); mesh.setColorAt(i, color.setHex(box.color));
  });
  mesh.receiveShadow = true;
  return mesh;
}

export function createStadium(): { group: THREE.Group; seats: CrowdSeat[] } {
  const { boxes, seats } = stadiumLayout();
  const group = new THREE.Group(); group.name = 'arena';
  group.add(buildStadiumSolids(boxes));
  const boards = boxes.filter(b => b.kind === 'board');
  const ads = new THREE.InstancedMesh(new THREE.PlaneGeometry(4.8, .88),
    new THREE.MeshBasicMaterial({ map: advertisingTexture() }), boards.length);
  ads.name = 'arena-advertising';
  const transform = new THREE.Object3D();
  boards.forEach((box, i) => {
    const [x, y, z] = box.center;
    transform.position.set(x, y, z); transform.rotation.y = 0;
    if (Math.abs(x) > 9) { transform.rotation.y = -Math.sign(x) * Math.PI / 2; transform.position.x -= Math.sign(x) * .125; }
    else transform.position.z += .125;
    transform.updateMatrix(); ads.setMatrixAt(i, transform.matrix);
  });
  group.add(ads);
  const video = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: videoTexture(), color: 0xc6d4df }), 4);
  video.name = 'arena-jumbotron';
  for (let face = 0; face < 4; face++) {
    const front = face % 2 === 0;
    transform.rotation.y = face * Math.PI / 2;
    transform.scale.set(front ? 4.3 : 3.1, 2.25, 1);
    transform.position.set(Math.sin(transform.rotation.y) * 2.31, 14.5, 12.425 + Math.cos(transform.rotation.y) * 1.71);
    transform.updateMatrix(); video.setMatrixAt(face, transform.matrix);
  }
  group.add(video);
  addArenaLights(group);
  return { group, seats };
}

function addArenaLights(group: THREE.Group): void {
  const beams = new THREE.InstancedMesh(new THREE.ConeGeometry(3.4, 16.8, 12, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xc5d9f1, transparent: true, opacity: .026,
      depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide }), 4);
  beams.name = 'arena-light-beams';
  const lamps = new THREE.InstancedMesh(new THREE.BoxGeometry(1.4, .12, .7), new THREE.MeshBasicMaterial({ color: 0xffedcd }), 4);
  lamps.name = 'arena-ceiling-lamps';
  const matrix = new THREE.Matrix4();
  let i = 0;
  for (const x of [-5, 5]) for (const z of [1, 10]) {
    beams.setMatrixAt(i, matrix.makeTranslation(x, 8.6, z));
    lamps.setMatrixAt(i, matrix.makeTranslation(x, 17.1, z));
    const light = new THREE.SpotLight(0xffecd6, 85, 30, .38, .6, 1);
    light.position.set(x, 17, z); light.target.position.set(x * .55, 0, z);
    group.add(light, light.target);
    i++;
  }
  group.add(beams, lamps);
}
