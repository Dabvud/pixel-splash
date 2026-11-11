import { describe, expect, it } from 'vitest';
import { createRecorder, replayAt, REPLAY_SPEED } from '../src/render/replay';

const view = (id: string, x: number) => ({ id, x, y: 0, z: 0, facing: 0, move: 'idle' as const, moveT: 0, visible: true });

describe('Instant-Replay-Aufzeichnung', () => {
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
