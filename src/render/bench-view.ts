import * as THREE from 'three';
import { pixelTexture } from './arena-textures';
import type { BenchStretcher } from './bench';

export function createBenchStretcher(scene: THREE.Scene): { sync(state: BenchStretcher): void; dispose(): void } {
  const group = new THREE.Group();
  group.name = 'bench-stretcher'; group.visible = false;
  const canvas = document.createElement('canvas');
  canvas.width = 16; canvas.height = 48;
  const ctx = canvas.getContext('2d');
  // Ohne Canvas-Kontext (z. B. jsdom) bleibt die Trage einfach ungemustert
  if (ctx) {
    ctx.fillStyle = '#eeeeee'; ctx.fillRect(0, 0, 16, 48);
    ctx.fillStyle = '#dc2028';
    ctx.fillRect(6, 18, 4, 12); ctx.fillRect(2, 22, 12, 4);
  }
  const texture = pixelTexture(canvas);
  const cloth = new THREE.MeshLambertMaterial({ map: texture });
  const dark = new THREE.MeshLambertMaterial({ color: 0x303038 });
  const bedGeometry = new THREE.BoxGeometry(.55, .05, 1.9);
  const railGeometry = new THREE.BoxGeometry(.05, .05, 2.2);
  const bed = new THREE.Mesh(bedGeometry, cloth);
  bed.name = 'stretcher-bed'; bed.position.y = .025;
  group.add(bed);
  for (const x of [-.3, .3]) {
    const rail = new THREE.Mesh(railGeometry, dark);
    rail.name = 'stretcher-rail'; rail.position.set(x, .025, 0); group.add(rail);
  }
  scene.add(group);
  return {
    sync(state) { group.visible = state.visible; group.position.set(state.x, state.y, state.z); },
    dispose() {
      scene.remove(group); bedGeometry.dispose(); railGeometry.dispose();
      cloth.dispose(); dark.dispose(); texture.dispose();
    },
  };
}

export function createBenchSeats(scene: THREE.Scene): { dispose(): void } {
  const geometry = new THREE.BoxGeometry(.55, .45, 3);
  const material = new THREE.MeshLambertMaterial({ color: 0x333338 });
  const seats = [-8.4, 8.4].map(x => {
    const seat = new THREE.Mesh(geometry, material);
    seat.name = 'bench-seat'; seat.position.set(x, .225, 4); scene.add(seat);
    return seat;
  });
  return { dispose() { seats.forEach(seat => scene.remove(seat)); geometry.dispose(); material.dispose(); } };
}
