import { describe, expect, it } from 'vitest';
import { createRecorder, replayAt, REPLAY_SPEED } from '../src/render/replay';

const view = (id: string, x: number) => ({ id, x, y: 0, z: 0, facing: 0, move: 'idle' as const, moveT: 0, visible: true });

describe('Instant-Replay-Aufzeichnung', () => {
  it('kopiert den Glaszustand ab Ringkontakt und den Wischfortschritt unabhängig', () => {
    const rec = createRecorder(4);
    const effects = { realTime: 1, poster: null, grave: null, glass: null, glassSweep: 0 } as Pick<import('../src/play/engine').PlayState, 'realTime' | 'poster' | 'grave' | 'glass' | 'glassSweep'>;
    rec.push(1000, [], { x: 0, y: 3, z: 0 }, effects);
    effects.glass = { since: 1.2 }; effects.realTime = 1.2;
    rec.push(1200, [], { x: 0, y: 3, z: 0 }, effects);
    const clip = rec.clip(4);
    effects.glass.since = 99; effects.glassSweep = 1;
    expect(clip[0].glass).toBeNull();
    expect(clip[1].glass).toEqual({ since: 1.2 });
    expect(clip[1].glassSweep).toBe(0);
  });
  it('kopiert Flug, versunkene Figuren, Sterne und Grabstein ab ihrem Auftreten', () => {
    const rec = createRecorder(4), v = view('b1', .8);
    const effects = { realTime: 1, poster: null, grave: null } as Pick<import('../src/play/engine').PlayState, 'realTime' | 'poster' | 'grave'>;
    rec.push(1000, [v], { x: 0, y: 1, z: 0 }, effects);
    v.y = 2.8; v.z = -1.8;
    effects.realTime = 1.5;
    effects.poster = { victim: 'b1', kind: 'poster', variant: 'flyout', startedAt: 2 };
    rec.push(1500, [v], { x: 0, y: 1, z: 0 }, effects);
    v.y = -2;
    effects.realTime = 2;
    effects.poster.variant = 'grave'; effects.grave = { x: .8, z: -2.4, since: 2 };
    rec.push(2000, [v], { x: 0, y: 1, z: 0 }, effects);
    const clip = rec.clip(4);
    effects.grave.x = 99; effects.poster.victim = 'r23';
    expect(clip[0].grave).toBeNull(); expect(clip[0].poster).toBeNull();
    expect(clip[1].actors[0]).toMatchObject({ y: 2.8, z: -1.8 });
    expect(clip[1].poster).toMatchObject({ victim: 'b1', variant: 'flyout' });
    expect(clip[2].actors[0].y).toBe(-2);
    expect(clip[2].grave).toEqual({ x: .8, z: -2.4, since: 2 });
  });
  it('liefert die letzten Sekunden in zeitlicher Reihenfolge als unabhängige Kopien', () => {
    const rec = createRecorder(4);
    const v = [view('r3', 0)];
    for (let i = 0; i <= 300; i++) { v[0].x = i; rec.push(i * 1000 / 60, v, { x: i, y: 1, z: 0 }); }
    const clip = rec.clip(2);
    expect(clip.length).toBeGreaterThan(110);
    expect(clip.length).toBeLessThan(130);
    expect(clip.at(-1)!.actors[0].x).toBe(300);
    for (let i = 1; i < clip.length; i++) expect(clip[i].t).toBeGreaterThan(clip[i - 1].t);
    v[0].x = -1;
    expect(clip.at(-1)!.actors[0].x).toBe(300);
  });

  it('spielt in Zeitlupe ab und meldet das Ende', () => {
    const rec = createRecorder(4);
    for (let i = 0; i <= 120; i++) rec.push(i * 1000 / 60, [view('r3', i)], { x: i, y: 1, z: 0 });
    const clip = rec.clip(2);
    expect(replayAt(clip, 0)!.actors[0].x).toBe(clip[0].actors[0].x);
    const mid = replayAt(clip, 1000)!;
    expect(mid.t - clip[0].t).toBeCloseTo(1000 * REPLAY_SPEED, -2);
    expect(replayAt(clip, (2000 / REPLAY_SPEED) + 50)).toBeNull();
    expect(REPLAY_SPEED).toBeLessThan(0.6);
  });
});
