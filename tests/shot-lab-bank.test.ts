import { afterEach, describe, expect, it, vi } from 'vitest';
import { attachGesture } from '../src/input/gesture';
import { startShotLab } from '../src/modes/shot-lab';
import { DEFAULTS, SPOTS, spotDistance, INFLUENCE } from '../src/settings';
import { bankWindow, effectiveZones } from '../src/shot/resolve';

vi.mock('../src/render/scene', async () => {
  const t = await import('three');
  return { createScene: () => ({ scene: new t.Scene(), ball: new t.Object3D(), updateNet: () => {} }) };
});
vi.mock('../src/render/pixel', () => ({ createPixelRenderer: () => ({ renderer: { render: vi.fn(), dispose: vi.fn() }, resize: vi.fn() }) }));
vi.mock('../src/render/player', () => ({ createPlayer: () => ({ setSpot: vi.fn(), setPose: vi.fn(),
  handPos: () => ({ x: -4.8, y: 2.45, z: 4.8 }) }) }));
vi.mock('../src/input/gesture', () => ({ attachGesture: vi.fn(() => vi.fn()) }));

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); document.body.replaceChildren(); });

describe('Brett-Fenster im Wurf-Labor', () => {
  it.each([1, 1.2])('färbt die Loslass-Markierung bei Füllstand %s nach der angezeigten Zone', fill => {
    vi.spyOn(performance, 'now').mockReturnValue(0);
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const mode = startShotLab(document.body, { ...DEFAULTS, greenZone: .07 });
    const gesture = vi.mocked(attachGesture).mock.calls.at(-1)![1];
    gesture({ type: 'start' });
    gesture({ type: 'release', holdMs: DEFAULTS.meterMs * fill, angleDeg: 0 });
    expect(document.querySelector('.hud-mark')!.classList.contains('good')).toBe(fill === 1);
    mode.stop();
  });
  it.each(['wing_l', 'corner_l', 'ft'] as const)('zeigt und wertet vom Spot %s dasselbe Fenster', spot => {
    let frame: FrameRequestCallback = () => {};
    vi.spyOn(performance, 'now').mockReturnValue(0);
    vi.stubGlobal('requestAnimationFrame', vi.fn((f: FrameRequestCallback) => { frame = f; return 1; }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    const mode = startShotLab(document.body, { ...DEFAULTS, spot });
    const s = SPOTS.find(s => s.id === spot)!;
    const p = { ...DEFAULTS, rating: .5, influence: INFLUENCE[DEFAULTS.influence], distance: spotDistance(s),
      bankAngleDeg: Math.atan2(Math.abs(s.x), s.z) * 180 / Math.PI };
    const gesture = vi.mocked(attachGesture).mock.calls.at(-1)![1];
    gesture({ type: 'start' });
    frame(100);
    const stripe = document.querySelector<HTMLElement>('.hud-bank')!;
    const window = bankWindow(p);
    expect(stripe.hidden).toBe(window === null);
    if (window) expect(parseFloat(stripe.style.bottom)).toBeCloseTo(window.lo / 1.6 * 100, 10);
    gesture({ type: 'release', holdMs: p.meterMs * (1 + 1.5 * effectiveZones(p).g), angleDeg: 0 });
    expect(document.querySelector('.hud-title')!.textContent).toBe(window ? 'BRETT – DRIN' : 'RING HINTEN');
    expect(document.querySelector('#hud-stats')!.textContent).toContain(window ? 'Treffer 1 / 1' : 'Treffer 0 / 1');
    mode.stop();
  });
});
