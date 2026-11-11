import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { createBallFire } from '../src/render/fire';

function setup() {
  const scene = new THREE.Scene();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(.12), new THREE.MeshLambertMaterial({ color: 0xd8661f }));
  scene.add(ball);
  const fire = createBallFire(scene, ball);
  const particles: THREE.Mesh[] = [];
  scene.traverse(node => { if (node instanceof THREE.Mesh && node !== ball) particles.push(node); });
  return { scene, ball, fire, particles };
}

describe('Ballfeuer', () => {
  it('bleibt inaktiv vollständig unsichtbar', () => {
    const { fire, particles } = setup();
    expect(fire.active).toBe(false);
    expect(particles.length).toBeGreaterThanOrEqual(10);
    expect(particles.length).toBeLessThanOrEqual(14);
    fire.update(1234);
    expect(particles.every(p => !p.visible)).toBe(true);
  });

  it('zeigt deterministische Partikel nahe der aktuellen Ballposition auch im Flug', () => {
    const { ball, fire, particles } = setup();
    const random = vi.spyOn(Math, 'random');
    try {
      fire.setActive(true);
      expect(fire.active).toBe(true);
      for (const [x, y, z, time] of [[2, 3, -4, 1234], [-5, 7, 8, 1789], [0, 2, 0, 4321]]) {
        ball.position.set(x, y, z);
        fire.update(time);
        for (const particle of particles) {
          expect(particle.visible).toBe(true);
          const pos = particle.getWorldPosition(new THREE.Vector3());
          expect(pos.distanceTo(ball.position)).toBeLessThan(.6);
          expect(pos.y).toBeGreaterThanOrEqual(ball.position.y);
        }
        const before = particles.map(p => ({ pos: p.position.clone(), scale: p.scale.clone() }));
        fire.update(time);
        expect(particles.map(p => ({ pos: p.position, scale: p.scale }))).toEqual(before);
      }
      expect(random).not.toHaveBeenCalled();
      fire.setActive(false);
      fire.update(9999);
      expect(particles.every(p => !p.visible)).toBe(true);
    } finally { random.mockRestore(); }
  });

  it('lässt Partikel innerhalb eines Zyklus aufsteigen und kleiner werden', () => {
    const { fire, particles } = setup();
    fire.setActive(true);
    fire.update(0);
    const before = particles.map(p => ({ y: p.position.y, scale: p.scale.x }));
    fire.update(1);
    particles.forEach((p, i) => {
      expect(p.position.y).toBeGreaterThan(before[i].y);
      expect(p.scale.x).toBeLessThan(before[i].scale);
    });
  });

  it('stellt emissive, Intensität und Farbe auch nach wiederholtem Aktivieren exakt wieder her', () => {
    const { ball, fire } = setup();
    ball.material.emissive.set(0x123456);
    ball.material.emissiveIntensity = .35;
    const before = ball.material.toJSON();
    fire.setActive(true);
    expect(ball.material.emissive.getHex()).not.toBe(0x123456);
    fire.setActive(true);
    fire.setActive(false);
    expect(ball.material.toJSON()).toEqual(before);
    fire.setActive(true);
    fire.setActive(false);
    expect(ball.material.toJSON()).toEqual(before);
  });

  it('mischt bei Material ohne emissive die Farbe und stellt Materialarrays exakt wieder her', () => {
    const scene = new THREE.Scene();
    const materials = [new THREE.MeshBasicMaterial({ color: 0x987654 }), new THREE.MeshBasicMaterial({ color: 0x112233 })];
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.12), materials);
    scene.add(ball);
    const fire = createBallFire(scene, ball);
    const before = materials.map(m => m.toJSON());
    fire.setActive(true);
    materials.forEach((m, i) => expect(m.toJSON()).not.toEqual(before[i]));
    fire.setActive(false);
    expect(ball.material).toBe(materials);
    expect(materials.map(m => m.toJSON())).toEqual(before);
  });
});
