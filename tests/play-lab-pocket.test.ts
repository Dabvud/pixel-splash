import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { attachGesture } from '../src/input/gesture';
import { command, createPlayState, step } from '../src/play/engine';
import { startPlayLab } from '../src/modes/play-lab';
import type { Mode } from '../src/modes/mode';
import { DEFAULTS } from '../src/settings';

vi.mock('../src/render/scene', async () => {
  const t = await import('three');
  return { createScene: () => ({ scene: new t.Scene(), ball: new t.Object3D(), updateNet: () => {} }) };
});
vi.mock('../src/render/pixel', () => ({ createPixelRenderer: () => ({ renderer: { render: vi.fn(), dispose: vi.fn() }, resize: vi.fn() }) }));
vi.mock('../src/figure/atlas', async () => {
  const t = await import('three');
  return { buildAtlas: () => ({ texture: new t.Texture(), uv: () => [0, 0, 1, 1] }) };
});
vi.mock('../src/render/actors', () => ({ createActors: () => ({ sync: vi.fn(), dispose: vi.fn() }) }));
vi.mock('../src/input/gesture', () => ({ attachGesture: vi.fn(() => vi.fn()) }));
vi.mock('../src/play/engine', async original => {
  const actual = await original<typeof import('../src/play/engine')>();
  return { ...actual, command: vi.fn(actual.command), createPlayState: vi.fn(actual.createPlayState), step: vi.fn(actual.step) };
});

let mode: Mode, now: number, frame: FrameRequestCallback;
function advance(seconds: number): void {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) { now += 1000 / 60; frame(now); }
}
beforeEach(() => {
  vi.clearAllMocks(); now = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.stubGlobal('requestAnimationFrame', vi.fn((f: FrameRequestCallback) => { frame = f; return 1; }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  mode = startPlayLab(document.body, { ...DEFAULTS, mode: 'play', play: 'kickout', defenseRandom: false });
});
afterEach(() => { mode.stop(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe('Pocket im Spielzug-Labor', () => {
  it.each([[0, 1], [25, .5], [40, .125]])('übergibt bei %s Grad Wischabweichung q = %s und die Einstellungen an die Engine', (angle, quality) => {
    const look = vi.spyOn(PerspectiveCamera.prototype, 'lookAt');
    const stage = document.querySelector('#stage')!;
    Object.defineProperties(stage, { clientWidth: { value: 800 }, clientHeight: { value: 600 } });
    advance(2.3);
    const camera = look.mock.contexts.at(-1) as PerspectiveCamera;
    const s = vi.mocked(createPlayState).mock.results.at(-1)!.value;
    const h = s.actors[s.handler].pos, a = s.actors.r11.pos;
    const origin = new Vector3(h.x, 1, h.z).project(camera), target = new Vector3(a.x, 1, a.z).project(camera);
    const gesture = vi.mocked(attachGesture).mock.calls.at(-1)![1];
    const dx = (target.x - origin.x) * 400, dy = (origin.y - target.y) * 300, aRad = angle * Math.PI / 180;
    gesture({ type: 'flick', dx: dx * Math.cos(aRad) - dy * Math.sin(aRad),
      dy: dx * Math.sin(aRad) + dy * Math.cos(aRad), holdMs: 100 });
    expect(command).toHaveBeenCalledWith(s, { kind: 'pass', to: 'r11', quality: expect.closeTo(quality, 10) },
      expect.objectContaining({ passDelayMax: .6, closeoutRandom: 1 }), expect.any(Function));
  });
  it.each([[1, 'IN DIE POCKET!'], [.9, 'IN DIE POCKET!'], [.4, 'UNGENAU'], [0, 'UNGENAU'], [.5, '']])(
    'zeigt für q = %s die Kurzmeldung %s', (quality, message) => {
      vi.mocked(step).mockReturnValueOnce([{ type: 'pocket', quality }]);
      advance(1 / 60);
      const flash = document.querySelector<HTMLElement>('.phud-flash')!;
      expect(flash.textContent).toBe(message);
      expect(flash.hidden).toBe(message === '');
    });
});
