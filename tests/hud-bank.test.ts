import { afterEach, describe, expect, it } from 'vitest';
import { createHud } from '../src/ui/hud';
import { bankWindow, effectiveZones } from '../src/shot/resolve';

afterEach(() => document.body.replaceChildren());

describe('Brett-Fenster im HUD', () => {
  it.each([false, true])('zeigt den Streifen an den Auswertungsgrenzen (Pfeil=%s) und entfernt alte Fenster', arrow => {
    const hud = createHud(document.body);
    const p = { meterMs: 700, greenZone: .1, aimDeg: 8, rating: .9, influence: .6,
      distance: 6.75, zoneFactor: .6, bankAngleDeg: 45 };
    const window = bankWindow(p)!;
    hud.setMeter(.5, effectiveZones(p), 1.6, arrow, window);
    const stripe = document.querySelector<HTMLElement>('.hud-bank')!;
    expect(stripe.hidden).toBe(false);
    expect(parseFloat(stripe.style.bottom)).toBeCloseTo(window.lo / 1.6 * 100, 10);
    expect(parseFloat(stripe.style.height)).toBeCloseTo((window.hi - window.lo) / 1.6 * 100, 10);
    hud.setMeter(.6, effectiveZones(p), 1.6, arrow);
    expect(stripe.hidden).toBe(true);
    hud.setMeter(.6, effectiveZones(p), 1.6, arrow, window);
    hud.setMeter(null, effectiveZones(p), 1.6, arrow, window);
    expect(stripe.hidden).toBe(true);
  });
});
