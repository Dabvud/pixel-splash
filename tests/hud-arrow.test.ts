import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHud } from '../src/ui/hud';
import { GestureTracker } from '../src/input/gesture';

afterEach(() => { document.body.replaceChildren(); vi.useRealTimers(); });

describe('Pfeil-Anzeige', () => {
  it.each([false, true])('färbt Markierung und eingefrorenen Pfeil nur in der grünen Zone (Pfeil=%s)', arrow => {
    const hud = createHud(document.body), zones = { g: .07, a: 6 };
    const mark = document.querySelector<HTMLElement>('.hud-mark')!;
    const pointer = document.querySelector<HTMLElement>('.hud-arrow')!;
    for (const [fill, good] of [[1, true], [1.07, true], [1.2, false], [1 + 1.5 * zones.g, false]] as const) {
      hud.setMeter(fill, zones, 1.6, arrow, { lo: 1.08, hi: 1.14 });
      hud.markRelease(fill, true, zones);
      expect(mark.classList.contains('good')).toBe(good);
      expect(pointer.classList.contains('good')).toBe(good);
      expect(pointer.classList.contains('released')).toBe(true);
    }
    hud.setMeter(null, zones, 1.6, arrow);
    hud.setMeter(.5, zones, 1.6, arrow);
    expect(pointer.classList.contains('good')).toBe(false);
    expect(pointer.classList.contains('released')).toBe(false);
  });
  it('bewegt den Pfeil statt des Balkens und hält die Tipp-Markierung bis zum Ausblenden', () => {
    vi.useFakeTimers();
    const hud = createHud(document.body), zones = { g: .1, a: 8 };
    hud.setMeter(.5, zones, 1.6, true);
    const arrow = document.querySelector<HTMLElement>('.hud-arrow')!;
    const mark = document.querySelector<HTMLElement>('.hud-mark')!;
    expect(arrow.textContent).toBe('◄');
    expect(arrow.hidden).toBe(false);
    expect(arrow.style.bottom).toBe('31.25%');
    expect(document.querySelector<HTMLElement>('.hud-fill')!.hidden).toBe(true);
    hud.setMeter(1, zones, 1.6, true);
    hud.markRelease(1, true);
    vi.advanceTimersByTime(3000);
    expect(mark.hidden).toBe(false);
    expect(mark.style.bottom).toBe('62.5%');
    expect(arrow.style.bottom).toBe('62.5%');
    hud.setMeter(null, zones, 1.6, true);
    expect(mark.hidden).toBe(true);
    hud.setMeter(.5, zones, 1.6);
    expect(arrow.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>('.hud-fill')!.hidden).toBe(false);
  });
});

describe('Pfeil-Berührung im Gestentracker', () => {
  it.each([30, 50])('liefert einen schnellen Wisch ab %s px weiterhin als flick', dx => {
    const tracker = new GestureTracker({ flicks: true, holdThresholdMs: 200 });
    tracker.down(1, 0, 0, 0);
    expect(tracker.up(1, dx, 0, 100)).toEqual({ type: 'flick', dx, dy: 0, holdMs: 100 });
  });
  it('wertet einen gehaltenen seitlichen Wisch ab 30 px nicht als Tipp', () => {
    const tracker = new GestureTracker({ flicks: true, holdThresholdMs: 200 });
    tracker.down(1, 0, 0, 0);
    tracker.poll(200);
    expect(tracker.up(1, 30, 0, 250)).toEqual({ type: 'cancel' });
  });
});
