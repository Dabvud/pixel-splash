import * as THREE from 'three';
import { pixelTexture } from './arena-textures';
import type { PlayState } from '../play/engine';

const COURT_Z = 5.4;

export function createGrave(scene: THREE.Scene) {
  const group = new THREE.Group();
  group.name = 'poster-grave';
  group.visible = false;
  scene.add(group);
  let stone: THREE.Mesh<THREE.ExtrudeGeometry, THREE.MeshLambertMaterial> | undefined;
  let front: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | undefined;

  function build(): void {
    const shape = new THREE.Shape();
    shape.moveTo(-.25, 0); shape.lineTo(.25, 0); shape.lineTo(.25, .58);
    shape.lineTo(.13, .7); shape.lineTo(-.13, .7); shape.lineTo(-.25, .58); shape.closePath();
    stone = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: .12, bevelEnabled: false }),
      new THREE.MeshLambertMaterial({ color: 0x999999 }));
    stone.position.z = -.06;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#999999'; ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#333333'; ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('R.I.P.', 32, 32);
    front = new THREE.Mesh(new THREE.PlaneGeometry(.46, .46), new THREE.MeshBasicMaterial({ map: pixelTexture(canvas) }));
    front.name = 'grave-inscription';
    front.position.set(0, .36, .061);
    group.add(stone, front);
    const earth = new THREE.Group();
    earth.name = 'grave-earth';
    const browns = [0x5a3a22, 0x7a5233, 0x946640].map(color => new THREE.MeshLambertMaterial({ color }));
    const clod = (x: number, z: number, w: number, h: number, d: number, y: number, color: number): void => {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), browns[color]);
      mesh.position.set(x, y + h / 2, z);
      earth.add(mesh);
    };
    clod(0, .62, .55, .06, 1, 0, 0);
    clod(-.025, .61, .44, .045, .84, .06, 1);
    clod(.025, .63, .3, .025, .62, .105, 0);
    for (let i = 0; i < 5; i++) clod((i % 2 ? -.13 : .12), .28 + i * .16, .09, .025, .1, .105, 2);
    for (let i = 0; i < 4; i++) clod(i % 2 ? -.36 : .35, .3 + i * .21, .07, .045, .08, 0, i % 3);
    group.add(earth);
  }

  return {
    sync(grave: PlayState['grave'], time = Infinity): void {
      group.visible = Boolean(grave && time >= grave.since);
      if (!grave || !group.visible) return;
      if (!stone) build();
      group.position.set(grave.x, 0, grave.z);
      group.rotation.y = Math.atan2(-grave.x, COURT_Z - grave.z); // Inschrift zum Spielfeld (Kamera), nicht zur Grundlinie
    },
    dispose(): void {
      scene.remove(group);
      const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>();
      group.traverse(o => {
        if (!(o instanceof THREE.Mesh)) return;
        geometries.add(o.geometry);
        for (const material of Array.isArray(o.material) ? o.material : [o.material]) materials.add(material);
      });
      geometries.forEach(g => g.dispose());
      front?.material.map?.dispose();
      materials.forEach(m => m.dispose());
    },
  };
}
