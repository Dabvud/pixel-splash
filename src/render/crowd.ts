import * as THREE from 'three';
import { pixelTexture } from './arena-textures';

export interface CrowdSeat {
  x: number; y: number; z: number; yaw: number;
  style: number; phase: number; scale: number; upper: boolean;
}

export interface CrowdController {
  /** Clamp strength to 0..1; restart a 1200 ms cheer on the update clock. */
  cheer(strength: number): void;
  /** Absolute monotonic milliseconds, e.g. the requestAnimationFrame timestamp. */
  update(nowMs: number): void;
}

function clampedStrength(strength: number): number {
  return Number.isNaN(strength) ? 0 : Math.max(0, Math.min(1, strength));
}

/** Pure envelope; the last frame rejoins the ordinary seated sway exactly. */
export function cheerEnvelope(elapsedMs: number, strength: number): number {
  if (elapsedMs <= 0 || elapsedMs >= 1200 || !Number.isFinite(elapsedMs)) return 0;
  return clampedStrength(strength) * Math.sin(Math.PI * elapsedMs / 1200);
}

const SKIN = ['#e5ad80', '#9f6246', '#f4c69e', '#633d30'];
const HAIR = ['#241d21', '#543021', '#d6ad60', '#181b26'];
const SHIRTS = ['#ce3d3b', '#af303e', '#ef5948', '#952e37', '#437e9b', '#d9b967', '#8b79ae', '#56958e',
  '#d6c8b3', '#57729c', '#b87b50', '#718158', '#bd6689', '#648eaa', '#b8a077', '#888d9e'];

function crowdAtlas(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 16 * 16; canvas.height = 2 * 20;
  const g = canvas.getContext('2d')!;
  for (let style = 0; style < 16; style++) for (let pose = 0; pose < 2; pose++) {
    const x = style * 16, y = pose * 20;
    g.fillStyle = '#242b3d'; g.fillRect(x + 4, y + 17, 3, 2); g.fillRect(x + 9, y + 17, 3, 2);
    g.fillStyle = SHIRTS[style]; g.fillRect(x + 4, y + 11, 8, 6);
    g.fillStyle = '#f2dfba'; g.fillRect(x + 7, y + 12, 2, 2);
    g.fillStyle = SKIN[style % 4]; g.fillRect(x + 5, y + 5, 6, 6);
    if (pose === 0) {
      g.fillRect(x + 2, y + 12, 2, 5); g.fillRect(x + 12, y + 12, 2, 5);
    } else {
      g.fillRect(x + 2, y + 3, 2, 10); g.fillRect(x + 12, y + 3, 2, 10);
      g.fillRect(x + 1, y + 1, 3, 3); g.fillRect(x + 12, y + 1, 3, 3);
    }
    g.fillStyle = HAIR[Math.floor(style / 4)];
    g.fillRect(x + 5, y + 4, 6, 2); g.fillRect(x + 5 + (style % 2) * 5, y + 6, 1, 2);
    g.fillStyle = '#2a2025'; g.fillRect(x + 6, y + 7, 1, 1); g.fillRect(x + 9, y + 7, 1, 1);
  }
  return pixelTexture(canvas);
}

/** One alpha-tested, double-sided atlas quad per seated fan: one draw, no shadows. */
export function createCrowd(seats: readonly CrowdSeat[], atlas: THREE.Texture = crowdAtlas()): CrowdController & {
  mesh: THREE.InstancedMesh<THREE.PlaneGeometry, THREE.MeshLambertMaterial>;
} {
  const geometry = new THREE.PlaneGeometry(.72, .9);
  geometry.translate(0, .45, 0);
  const tiles = new THREE.InstancedBufferAttribute(new Float32Array(seats.length * 2), 2);
  tiles.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('crowdTile', tiles);
  const material = new THREE.MeshLambertMaterial({ map: atlas, alphaTest: .5, side: THREE.DoubleSide });
  material.forceSinglePass = true;
  material.onBeforeCompile = shader => {
    shader.vertexShader = 'attribute vec2 crowdTile;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <uv_vertex>', `
      #include <uv_vertex>
      #ifdef USE_MAP
        vMapUv = (vMapUv + vec2(crowdTile.x, 1.0 - crowdTile.y)) / vec2(16.0, 2.0);
      #endif
    `);
  };
  material.customProgramCacheKey = () => 'pixel-arena-crowd-v1';
  const mesh = new THREE.InstancedMesh(geometry, material, seats.length);
  mesh.name = 'arena-crowd';
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const cos = new Float32Array(seats.length), sin = new Float32Array(seats.length);
  const color = new THREE.Color(), matrix = new THREE.Matrix4();
  for (let i = 0; i < seats.length; i++) {
    cos[i] = Math.cos(seats[i].yaw) * seats[i].scale;
    sin[i] = Math.sin(seats[i].yaw) * seats[i].scale;
    tiles.setXY(i, seats[i].style, 0);
    color.setScalar(seats[i].upper ? .48 : .82);
    mesh.setColorAt(i, color);
  }
  let lastNow = 0, hasClock = false, cheerAt = -Infinity, strength = 0, pending = false;
  const update = (nowMs: number): void => {
    if (!Number.isFinite(nowMs)) return;
    lastNow = Math.max(lastNow, nowMs);
    hasClock = true;
    if (pending) { cheerAt = lastNow; pending = false; }
    const lift = cheerEnvelope(lastNow - cheerAt, strength);
    for (let i = 0; i < seats.length; i++) {
      const seat = seats[i];
      const bounce = Math.sin(lastNow * (.0017 + (seat.phase % .5) * .001) + seat.phase);
      const y = seat.y + .018 * bounce + lift * (.28 + .06 * Math.sin(seat.phase));
      // Write into a single scratch matrix and the existing GPU buffers. No frame allocations.
      matrix.set(cos[i], 0, sin[i], seat.x, 0, seat.scale, 0, y, -sin[i], 0, cos[i], seat.z, 0, 0, 0, 1);
      mesh.setMatrixAt(i, matrix);
      tiles.setY(i, lift > .12 + .12 * (1 + Math.sin(seat.phase)) ? 1 : 0);
    }
    mesh.instanceMatrix.needsUpdate = true;
    tiles.needsUpdate = true;
  };
  update(0);
  hasClock = false;
  // Static conservative culling volume also includes the maximum jump and sway.
  mesh.computeBoundingBox();
  mesh.boundingBox!.expandByScalar(.4);
  mesh.boundingSphere = mesh.boundingBox!.getBoundingSphere(new THREE.Sphere());
  return {
    mesh, update,
    cheer(value) {
      strength = clampedStrength(value);
      cheerAt = lastNow;
      pending = !hasClock;
    },
  };
}
