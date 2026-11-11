import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { attachGesture } from '../src/input/gesture';
import { startShotLab } from '../src/modes/shot-lab';
import type { Mode } from '../src/modes/mode';
import { DEFAULTS } from '../src/settings';

const fire = vi.hoisted(() => ({ setActive: vi.fn(), update: vi.fn(), active: false }));
vi.mock('../src/render/fire', () => ({ createBallFire: () => fire }));
vi.mock('../src/render/scene', async () => {
  const t = await import('three');
  return { createScene: () => ({ scene: new t.Scene(), ball: new t.Object3D(), updateNet: vi.fn() }) };
});
vi.mock('../src/render/pixel', () => ({ createPixelRenderer: () => ({ renderer: { render: vi.fn(), dispose: vi.fn() }, resize: vi.fn() }) }));
vi.mock('../src/render/player', () => ({ createPlayer: () => ({ setSpot: vi.fn(), setPose: vi.fn(),
  handPos: () => ({ x: 0, y: 2.45, z: 4.2 }) }) }));
vi.mock('../src/input/gesture', () => ({ attachGesture: vi.fn(() => vi.fn()) }));

let mode: Mode, now: number, frame: FrameRequestCallback;
const gesture = () => vi.mocked(attachGesture).mock.calls.at(-1)![1];
const badge = () => document.querySelector<HTMLElement>('.hud-hot');
function release(fill = 1, angleDeg = 0): void {
  gesture()({ type: 'start' });
  gesture()({ type: 'release', holdMs: DEFAULTS.meterMs * fill, angleDeg });
}
function settle(): void {
  for (let i = 0; i < 100; i++) { now += 100; frame(now); }
}
function heat(): void {
  for (let i = 0; i < 3; i++) { release(); settle(); }
}

beforeEach(() => {
  vi.clearAllMocks();
  now = 0;
  frame = () => {};
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => { frame = f; return 1; });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  mode = startShotLab(document.body, { ...DEFAULTS, spot: 'ft', influence: 'off' });
});
afterEach(() => {
  mode.stop();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  document.body.replaceChildren();
});

describe('Heißlaufen im Wurf-Labor', () => {
  it('zündet sofort beim dritten Treffer und wertet den nächsten Wurf mit größerer Meter-Zone', () => {
    for (let i = 0; i < 2; i++) {
      release();
      expect(badge()?.hidden ?? true).toBe(true);
      expect(fire.setActive).toHaveBeenLastCalledWith(false);
      settle();
    }
    release();
    expect(badge()!.hidden).toBe(false);
    expect(fire.setActive).toHaveBeenLastCalledWith(true);
    settle();
    gesture()({ type: 'start' }); now += 100; frame(now);
    const green = document.querySelector<HTMLElement>('.hud-green')!;
    expect(parseFloat(green.style.height)).toBeCloseTo(2 * .105 / 1.6 * 100, 8);
    gesture()({ type: 'release', holdMs: DEFAULTS.meterMs * .9, angleDeg: 0 });
    expect(document.querySelector('#hud-stats')!.textContent).toContain('Treffer 4 / 4');
    expect(document.querySelector('.hud-mark')!.classList.contains('good')).toBe(true);
  });

  it('vergrößert die Zone nicht vor der Wertung des dritten Wurfs', () => {
    release(); settle(); release(); settle(); release(.9);
    expect(document.querySelector('#hud-stats')!.textContent).toContain('Treffer 2 / 3');
    expect(document.querySelector('.hud-mark')!.classList.contains('good')).toBe(false);
    expect(badge()?.hidden ?? true).toBe(true);
    settle(); release(); settle(); release();
    expect(badge()?.hidden ?? true).toBe(true);
  });

  it('löscht Feuer sofort beim Fehlwurf und stellt die normale Zone wieder her', () => {
    heat(); release(1, 100);
    expect(fire.setActive).toHaveBeenLastCalledWith(false);
    expect(badge()!.hidden).toBe(true);
    settle(); gesture()({ type: 'start' }); now += 100; frame(now);
    expect(parseFloat(document.querySelector<HTMLElement>('.hud-green')!.style.height)).toBeCloseTo(2 * .07 / 1.6 * 100, 8);
    gesture()({ type: 'release', holdMs: DEFAULTS.meterMs, angleDeg: 0 });
    settle(); release();
    expect(badge()!.hidden).toBe(true);
  });

  it('setzt Feuer, Abzeichen, Statistik und Serie beim Neustart zurück', () => {
    heat(); mode.restart!();
    expect(fire.setActive).toHaveBeenLastCalledWith(false);
    expect(badge()!.hidden).toBe(true);
    expect(document.querySelector('#hud-stats')!.textContent).toBe('Treffer 0 / 0');
    release(); settle(); release();
    expect(badge()!.hidden).toBe(true);
  });

  it('aktualisiert Feuer nur mit aktiver Zeit und friert es in Pause ein', () => {
    heat(); now += 100; frame(now);
    const activeTime = fire.update.mock.calls.at(-1)![0] as number;
    const count = fire.update.mock.calls.length;
    mode.setPaused!(true);
    mode.apply({ ...DEFAULTS, spot: 'ft', influence: 'off' });
    now += 5000; frame(now);
    expect(fire.update).toHaveBeenCalledTimes(count);
    mode.setPaused!(false); now += 100; frame(now);
    expect(fire.update.mock.calls.at(-1)![0]).toBe(activeTime + 100);
  });
});
