import * as THREE from 'three';

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
