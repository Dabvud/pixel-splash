import { describe, expect, it } from 'vitest';
import { command, step, type EngineEvent } from '../src/play/engine';
import { posterConfig, posterShot } from './poster-fixture';

describe('Verfehlter Poster: krasser Block', () => {
  it('wirft am Kontakt den Angreifer zurück und lässt ihn bis ended liegen', () => {
    const c = { ...posterConfig, blockFoulChance: 0, finishFoulOverride: 1 }, s = posterShot(c, false);
    step(s, .49, c, () => .1);
    expect(s.poster).toBeNull();
    const contact = { ...s.actors.r23.pos };
    step(s, .02, c, () => .1);
    expect(s.actors.r23.move).toBe('knocked_down');
    expect(s.actors.r23.y).toBe(0);
    expect(s.actors.b1.move).toBe('block_jump_hit');
    expect(s.poster).toMatchObject({ kind: 'block', victim: 'r23', variant: 'classic' });
    const events = step(s, 3, c, () => .1);
    expect(s.actors.r23.pos.z - contact.z).toBeGreaterThanOrEqual(.6);
    expect(s.actors.r23.move).toBe('knocked_down');
    expect(s.phase).toBe('ended');
    expect(s.banner).toBe('GEBLOCKT');
    expect(events.some(e => e.type === 'foul' || e.type === 'freethrow')).toBe(false);
  });

  it.each([false, true])('blockFoulChance 1 gibt zwei Freiwürfe, foulScene=%s', foulScene => {
    const c = { ...posterConfig, foulScene, blockFoulChance: 1, finishFoulOverride: 0 }, s = posterShot(c, false);
    const events: EngineEvent[] = [];
    for (let i = 0; i < 1200 && !s.freeThrows; i++) events.push(...step(s, 1 / 240, c, () => .9));
    expect(events).toContainEqual({ type: 'foul', andOne: false });
    expect(events).toContainEqual({ type: 'freethrow', left: 2 });
    expect(s.freeThrows).toEqual({ shooter: 'r23', left: 2 });
    expect(Boolean(s.actors.ref)).toBe(foulScene);
    step(s, 3, c, () => .9);
    expect(s.actors.r23.move).not.toBe('knocked_down');
    expect(s.actors.r23.pos).toEqual({ x: 0, z: 4.2 });
    expect(s.actors.r23.y).toBe(0);
    expect(s.actors.b1.move).toBe('idle');
    command(s, { kind: 'comboStart' }, c, () => .9);
    expect(s.phase).toBe('combo');
  });

  it.each([[.149, true], [.15, false]])('Default-Foulchance 0,15 bei rng=%s: %s', (roll, foul) => {
    const s = posterShot(posterConfig, false), events = step(s, 3, posterConfig, () => roll);
    expect(events.some(e => e.type === 'foul')).toBe(foul);
  });
});
