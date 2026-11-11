import * as THREE from 'three';
import { pixelTexture } from './arena-textures';
import type { PlayState } from '../play/engine';

type Effects = Partial<Pick<PlayState, 'ghost' | 'splinters' | 'ouch'>>;

export function createPosterEffects(scene: THREE.Scene) {
  function ghostTexture(): THREE.CanvasTexture {
    const soulCanvas = document.createElement('canvas');
    soulCanvas.width = 16; soulCanvas.height = 20;
    const soul = soulCanvas.getContext('2d')!;
    soul.fillStyle = '#deefff';
    soul.fillRect(5, 1, 6, 2); soul.fillRect(3, 3, 10, 3); soul.fillRect(2, 6, 12, 10);
    for (let i = 0; i < 3; i++) soul.fillRect(2 + i * 4, 16, 2, 3);
    soul.fillStyle = '#344e83'; soul.fillRect(5, 6, 2, 3); soul.fillRect(10, 6, 2, 3);
    return pixelTexture(soulCanvas);
  }
  const ghost = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, opacity: .45, depthWrite: false }));
  ghost.name = 'poster-ghost'; ghost.scale.set(.8, 1, 1);

  function ouchTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 48;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#b81820'; ctx.fillRect(0, 0, 128, 48);
    ctx.fillStyle = '#ffe44c';
    // Feste Pixelbuchstaben bleiben unabhängig vom Ladezeitpunkt der Web-Schrift.
    const letters = ['01110/11011/11011/11011/11011/11011/01110', '11011/11011/11011/11011/11011/11011/01110',
      '01111/11000/11000/11000/11000/11000/01111', '11011/11011/11011/11111/11011/11011/11011',
      '00100/00100/00100/00100/00100/00000/00100'];
    letters.forEach((letter, i) => letter.split('/').forEach((row, y) => [...row].forEach((pixel, x) => {
      if (pixel === '1') ctx.fillRect(5 + i * 24 + x * 4, 10 + y * 4, 4, 4);
    })));
    return pixelTexture(canvas);
  }
  const ouch = new THREE.Mesh(new THREE.PlaneGeometry(4.3, 2.25), new THREE.MeshBasicMaterial());
  ouch.name = 'poster-ouch'; ouch.position.set(0, 14.5, 10.7); ouch.rotation.y = Math.PI;

  const splinters = new THREE.Group(); splinters.name = 'poster-splinters';
  const wood = new THREE.MeshLambertMaterial({ color: 0xe5bc7e }), box = new THREE.BoxGeometry(.16, .055, .07);
  for (let i = 0; i < 8; i++) {
    const chip = new THREE.Mesh(box, wood), angle = i * Math.PI / 4;
    chip.position.set(Math.cos(angle) * (.3 + (i % 2) * .13), .055, Math.sin(angle) * .35);
    chip.rotation.set((i % 3) * .3, angle, (i % 2 ? 1 : -1) * .4);
    splinters.add(chip);
  }
  ghost.visible = ouch.visible = splinters.visible = false;
  scene.add(ghost, ouch, splinters);

  return {
    sync(effects: Effects | null, time: number): void {
      const data = effects?.ghost, age = data ? time - data.since : -1;
      ghost.visible = Boolean(data && age >= 0 && age < 2.5);
      if (ghost.visible && !ghost.material.map) {
        ghost.material.map = ghostTexture(); ghost.material.needsUpdate = true;
      }
      if (data && age >= 0) {
        const f = Math.min(1, age / 2.5);
        ghost.position.set(data.x + .18 * Math.sin(age * 5), .5 + 4.5 * f, data.z);
        ghost.material.opacity = .45 * (1 - f);
      }
      const flash = effects?.ouch, flashAge = flash ? time - flash.since : -1;
      ouch.visible = Boolean(flash && flashAge >= 0 && flashAge < 2 && Math.floor((flashAge + 1e-9) / .15) % 2 === 0);
      if (ouch.visible && !ouch.material.map) {
        ouch.material.map = ouchTexture(); ouch.material.needsUpdate = true;
      }
      const chips = effects?.splinters;
      splinters.visible = Boolean(chips && time >= chips.since);
      if (chips) splinters.position.set(chips.x, 0, chips.z);
    },
    dispose(): void {
      scene.remove(ghost, ouch, splinters);
      ghost.material.map?.dispose(); ghost.material.dispose();
      ouch.material.map?.dispose(); ouch.material.dispose(); ouch.geometry.dispose();
      box.dispose(); wood.dispose();
    },
  };
}
