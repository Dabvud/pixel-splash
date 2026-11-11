import { describe, expect, it } from 'vitest';
import { Texture } from 'three';
import { createCrowd, cheerEnvelope } from '../src/render/crowd';
import { stadiumLayout } from '../src/render/stadium';

function fixture() { return createCrowd(stadiumLayout().seats, new Texture()); }
function matrices(crowd: ReturnType<typeof fixture>) { return Array.from(crowd.mesh.instanceMatrix.array); }

describe('Instanziertes Pixel-Publikum', () => {
  it('bleibt bei einem Draw-Call und unter 3000 Instanzen mit vielen individuellen Heimfans', () => {
    const { seats } = stadiumLayout();
    const crowd = fixture();
    expect(crowd.mesh.count).toBeGreaterThan(1000);
    expect(crowd.mesh.count).toBeLessThan(3000);
    expect(crowd.mesh.count).toBe(seats.length);
    expect(Array.isArray(crowd.mesh.material)).toBe(false);
    expect(crowd.mesh.geometry.groups).toHaveLength(0);
    expect(crowd.mesh.castShadow).toBe(false);
    expect(crowd.mesh.material.transparent).toBe(false);
    expect(new Set(seats.map(s => s.style)).size).toBe(16);
    expect(seats.filter(s => s.style < 4).length).toBeGreaterThan(seats.length * .15);
    expect(stadiumLayout().seats).toEqual(seats);
  });

  it('wippt deterministisch und verwendet dieselben Matrix-/Atlas-Puffer weiter', () => {
    const crowd = fixture();
    crowd.update(0);
    const initial = matrices(crowd), matrixBuffer = crowd.mesh.instanceMatrix.array;
    const atlasBuffer = crowd.mesh.geometry.getAttribute('crowdTile').array;
    crowd.update(350);
    expect(matrices(crowd)).not.toEqual(initial);
    crowd.update(700);
    expect(crowd.mesh.instanceMatrix.array).toBe(matrixBuffer);
    expect(crowd.mesh.geometry.getAttribute('crowdTile').array).toBe(atlasBuffer);
  });

  it('hebt beim Jubeln Figuren und Arme und kehrt nach 1200 ms exakt zur normalen Bewegung zurück', () => {
    const crowd = fixture(), idle = fixture();
    crowd.update(100); idle.update(100);
    crowd.cheer(1);
    crowd.update(400); idle.update(400);
    expect(matrices(crowd)).not.toEqual(matrices(idle));
    expect(crowd.mesh.instanceMatrix.array[13]).toBeGreaterThan(idle.mesh.instanceMatrix.array[13]);
    const tiles = crowd.mesh.geometry.getAttribute('crowdTile');
    expect(Array.from({ length: tiles.count }, (_, i) => tiles.getY(i)).some(y => y === 1)).toBe(true);
    crowd.update(1300); idle.update(1300);
    expect(matrices(crowd)).toEqual(matrices(idle));
    expect(Array.from({ length: tiles.count }, (_, i) => tiles.getY(i)).every(y => y === 0)).toBe(true);
  });

  it('begrenzt die Stärke auf 0–1 und kann schon vor dem ersten update jubeln', () => {
    const zero = fixture(), idle = fixture(), max = fixture(), clipped = fixture();
    zero.cheer(-2); zero.update(0); zero.update(300); idle.update(300);
    expect(matrices(zero)).toEqual(matrices(idle));
    max.cheer(1); clipped.cheer(20);
    max.update(5000); clipped.update(5000);
    max.update(5300); clipped.update(5300); idle.update(5300);
    expect(matrices(max)).toEqual(matrices(clipped));
    expect(matrices(max)).not.toEqual(matrices(idle));
    for (const strength of [NaN, Infinity, -Infinity]) expect(() => zero.cheer(strength)).not.toThrow();
  });
});

describe('Jubel-Hüllkurve', () => {
  it('ist nur innerhalb von 1,2 s aktiv, skaliert mit der Stärke und läuft weich aus', () => {
    expect(cheerEnvelope(-1, 1)).toBe(0);
    expect(cheerEnvelope(0, 1)).toBe(0);
    expect(cheerEnvelope(300, 1)).toBeGreaterThan(.5);
    expect(cheerEnvelope(1199, 1)).toBeLessThan(.01);
    expect(cheerEnvelope(1200, 1)).toBe(0);
    expect(cheerEnvelope(2000, 1)).toBe(0);
    expect(cheerEnvelope(300, .5)).toBeCloseTo(cheerEnvelope(300, 1) * .5);
    expect(cheerEnvelope(300, 8)).toBe(cheerEnvelope(300, 1));
    expect(cheerEnvelope(300, -1)).toBe(0);
    expect(cheerEnvelope(300, NaN)).toBe(0);
  });
});
