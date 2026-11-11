import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ShotResult } from '../src/shot/resolve';
import { createHud } from '../src/ui/hud';

const result: ShotResult = {
  outcome: 'swish', made: true, fill: 1, t: 0, r: 0, F: 0,
  banner: 'SWISH', hint: 'perfekt',
};
const zones = { g: .1, a: 8 };
const q = (selector: string) => document.querySelector<HTMLElement>(selector)!;

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe('HUD-Pause', () => {
  it('haelt das Banner nach 1 s fuer 10 s an und blendet es erst nach weiteren 0,8 s aus', () => {
    const hud = createHud(document.body);
    hud.showResult(result);
    const banner = q('.hud-banner');
    expect(banner.hidden).toBe(false);
    vi.advanceTimersByTime(1000);
    hud.setPaused(true);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10000);
    expect(banner.hidden).toBe(false);
    hud.setPaused(false);
    vi.advanceTimersByTime(799);
    expect(banner.hidden).toBe(false);
    vi.advanceTimersByTime(1);
    expect(banner.hidden).toBe(true);
    hud.dispose();
  });

  it('bewahrt getrennte Restzeiten fuer Banner und Loslass-Markierung ueber mehrere Pausen', () => {
    const hud = createHud(document.body);
    hud.setMeter(1, zones, 1.6);
    hud.showResult(result);
    hud.markRelease(1);
    vi.advanceTimersByTime(1000);
    hud.setPaused(true);
    vi.advanceTimersByTime(4000);
    hud.setPaused(true);
    vi.advanceTimersByTime(6000);
    hud.setPaused(false);
    vi.advanceTimersByTime(200);
    hud.setPaused(false);
    hud.setPaused(true);
    vi.advanceTimersByTime(10000);
    hud.setPaused(false);
    vi.advanceTimersByTime(299);
    expect(q('.hud-mark').hidden).toBe(false);
    expect(q('.hud-banner').hidden).toBe(false);
    vi.advanceTimersByTime(1);
    expect(q('.hud-mark').hidden).toBe(true);
    vi.advanceTimersByTime(299);
    expect(q('.hud-banner').hidden).toBe(false);
    vi.advanceTimersByTime(1);
    expect(q('.hud-banner').hidden).toBe(true);
    hud.dispose();
  });

  it('startet ersetzte Anzeigen waehrend der Pause erst beim Fortsetzen', () => {
    const hud = createHud(document.body);
    hud.showResult(result);
    hud.markRelease(1);
    vi.advanceTimersByTime(1000);
    hud.setPaused(true);
    hud.showResult({ ...result, banner: 'TREFFER' });
    hud.markRelease(.9);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10000);
    expect(q('.hud-banner').textContent).toContain('TREFFER');
    expect(q('.hud-banner').hidden).toBe(false);
    expect(q('.hud-mark').hidden).toBe(false);
    hud.setPaused(false);
    vi.advanceTimersByTime(1499);
    expect(q('.hud-mark').hidden).toBe(false);
    vi.advanceTimersByTime(1);
    expect(q('.hud-mark').hidden).toBe(true);
    vi.advanceTimersByTime(299);
    expect(q('.hud-banner').hidden).toBe(false);
    vi.advanceTimersByTime(1);
    expect(q('.hud-banner').hidden).toBe(true);
    hud.dispose();
  });

  it.each(['hidden', 'persistent'] as const)('verwirft die pausierte Markierungsfrist bei %s', action => {
    const hud = createHud(document.body);
    hud.setMeter(1, zones, 1.6);
    hud.markRelease(1);
    vi.advanceTimersByTime(1000);
    hud.setPaused(true);
    if (action === 'hidden') hud.setMeter(null, zones, 1.6);
    else hud.markRelease(1, true);
    hud.setPaused(false);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10000);
    expect(q('.hud-mark').hidden).toBe(action === 'hidden');
    hud.dispose();
  });

  it.each([false, true])('dispose beendet alle Timer und entfernt nur HUD-Elemente (pausiert=%s)', paused => {
    const sibling = document.createElement('div');
    document.body.append(sibling);
    const hud = createHud(document.body);
    hud.showResult(result);
    hud.markRelease(1);
    expect(vi.getTimerCount()).toBe(2);
    if (paused) hud.setPaused(true);
    hud.dispose();
    hud.dispose();
    expect([...document.body.children]).toEqual([sibling]);
    expect(vi.getTimerCount()).toBe(0);
    hud.setPaused(false);
    hud.showResult(result);
    hud.markRelease(1);
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(10000);
    expect([...document.body.children]).toEqual([sibling]);
  });
});
