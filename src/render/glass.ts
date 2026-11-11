import * as THREE from 'three';

export function createGlassShards(scene: THREE.Scene): { burst(nowMs: number): void; sweep(progress: number): void; update(nowMs: number): void; reset(): void } {
  const pieces = Array.from({ length: 30 }, (_, i) => {
    const size = .04 + (i * 7 % 9) * .01;
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(size, size, .012),
      new THREE.MeshBasicMaterial({ color: i % 3 ? 0xc9efff : 0xffffff, transparent: true, opacity: .8 }));
    mesh.name = 'glass-shard';
    mesh.visible = false;
    scene.add(mesh);
    const x = (i % 6 - 2.5) * .3, y = 3.02 + Math.floor(i / 6) * .19;
    const vy = .3 + (i * 3 % 7) * .1;
    return { mesh, x, y, vx: x * .7 + Math.sin(i * 2.4) * .4, vy, vz: .6 + (i * 5 % 11) * .09,
      landAt: (vy + Math.sqrt(vy * vy + 2 * 9.81 * (y - .01))) / 9.81 };
  });
  let since = 0, active = false;
  const update = (nowMs: number): void => {
    if (!active) return;
    const elapsed = Math.max(0, (nowMs - since) / 1000);
    pieces.forEach(({ mesh, x, y, vx, vy, vz, landAt }, i) => {
      // Am Aufschlag einfrieren: kein Rutschen und dieselbe Bahn im Replay.
      const t = Math.min(elapsed, landAt);
      mesh.position.set(x + vx * t, Math.max(.01, y + vy * t - .5 * 9.81 * t * t), -.4 + vz * t);
      mesh.rotation.set(elapsed >= landAt ? -Math.PI / 2 : t * (2 + i % 3), 0, i + t * 2);
    });
  };
  const sweep = (progress: number): void => {
    const count = Math.floor(Math.max(0, Math.min(1, progress)) * pieces.length);
    pieces.forEach(({ mesh }, i) => { mesh.visible = active && i >= count; });
  };
  return {
    burst(nowMs) { since = nowMs; active = true; sweep(0); update(nowMs); },
    sweep, update,
    reset() { active = false; pieces.forEach(({ mesh }) => { mesh.visible = false; }); },
  };
}
