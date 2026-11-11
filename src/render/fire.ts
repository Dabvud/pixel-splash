import * as THREE from 'three';

export function createBallFire(scene: THREE.Scene, ball: THREE.Object3D): {
  setActive(on: boolean): void;
  readonly active: boolean;
  update(nowMs: number): void;
} {
  const group = new THREE.Group();
  group.visible = false;
  scene.add(group);
  const geometry = new THREE.BoxGeometry(.08, .1, .07);
  const materials = [0xffd23f, 0xff7a1a, 0xe8371b].map(color => new THREE.MeshBasicMaterial({ color }));
  const particles = Array.from({ length: 12 }, (_, i) => {
    const particle = new THREE.Mesh(geometry, materials[i % materials.length]);
    particle.visible = false;
    group.add(particle);
    return particle;
  });
  const glow = new THREE.Color(0xff7a1a);
  const position = new THREE.Vector3();
  let active = false;
  let originals: { value: THREE.Color; original: THREE.Color }[] = [];

  return {
    get active() { return active; },
    setActive(on) {
      if (on === active) return;
      active = on;
      group.visible = on;
      particles.forEach(p => { p.visible = on; });
      if (on) {
        const seen = new Set<THREE.Material>();
        ball.traverse(node => {
          if (!(node instanceof THREE.Mesh)) return;
          const list: THREE.Material[] = Array.isArray(node.material) ? node.material : [node.material];
          for (const material of list) {
            if (seen.has(material)) continue;
            seen.add(material);
            const value = 'emissive' in material && material.emissive instanceof THREE.Color ? material.emissive
              : 'color' in material && material.color instanceof THREE.Color ? material.color : null;
            if (!value) continue;
            originals.push({ value, original: value.clone() });
            value.lerp(glow, .4);
          }
        });
      } else {
        originals.forEach(({ value, original }) => value.copy(original));
        originals = [];
      }
    },
    update(nowMs) {
      if (!active) return;
      // Die aktuelle Ballposition hält die Flammen auch im Flug am Ball.
      ball.getWorldPosition(position);
      group.position.copy(scene.worldToLocal(position));
      particles.forEach((particle, i) => {
        const age = ((nowMs / (650 + i % 3 * 90) + i / particles.length) % 1 + 1) % 1;
        const angle = i * 2.4 + age * 2;
        const radius = .04 + age * .06;
        particle.position.set(Math.cos(angle) * radius, .07 + age * .43, Math.sin(angle) * radius);
        particle.scale.setScalar((.7 + i % 4 * .1) * (1 - age * .8));
      });
    },
  };
}
