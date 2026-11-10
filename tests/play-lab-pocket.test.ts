import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import { attachGesture, GestureTracker, type GestureEvent } from '../src/input/gesture';
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
vi.mock('../src/input/gesture', async original => ({
  ...await original<typeof import('../src/input/gesture')>(), attachGesture: vi.fn(() => vi.fn()),
}));
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
  describe.each(['Kurzwisch', 'durchgehendes Ziehen', 'Richtungswechsel'] as const)('%s', route => {
  it.each([[0, 1], [25, .5], [40, .125]])('übergibt bei %s Grad Wischabweichung q = %s und die Einstellungen an die Engine', (angle, quality) => {
    const look = vi.spyOn(PerspectiveCamera.prototype, 'lookAt');
    const stage = document.querySelector('#stage')!;
    Object.defineProperties(stage, { clientWidth: { value: 800 }, clientHeight: { value: 600 } });
    advance(2.3);
    const camera = look.mock.contexts.at(-1) as PerspectiveCamera;
    const s = vi.mocked(createPlayState).mock.results.at(-1)!.value;
    const gesture = vi.mocked(attachGesture).mock.calls.at(-1)![1];
    const emit = (e: GestureEvent | null) => { if (e) gesture(e); };
    const tracker = new GestureTracker({ flicks: true, holdThresholdMs: 200 });
    const vector = (degrees: number, length?: number) => {
      // #50 liegt weniger als 15° neben #11 und ist näher: Seit alle Mitspieler
      // anspielbar sind, gewinnt er laut Zielwahlregel auch bei einem Wisch auf #11.
      // Die q-Fälle beziehen sich deshalb auf die Richtung des näheren Empfängers.
      const h = s.actors[s.handler].pos, a = s.actors.r50.pos;
      const origin = new Vector3(h.x, 1, h.z).project(camera), target = new Vector3(a.x, 1, a.z).project(camera);
      let dx = (target.x - origin.x) * 400, dy = (origin.y - target.y) * 300;
      if (length) { const k = length / Math.hypot(dx, dy); dx *= k; dy *= k; }
      const rad = degrees * Math.PI / 180;
      return { dx: dx * Math.cos(rad) - dy * Math.sin(rad), dy: dx * Math.sin(rad) + dy * Math.cos(rad) };
    };
    // Jede echte Geste beginnt mit start; ein isoliertes flick wird verworfen.
    emit(tracker.down(1, 0, 0, now));
    advance(.1);
    if (route !== 'Kurzwisch') {
      const initial = vector(route === 'Richtungswechsel' ? 15 : 0, 80);
      emit(tracker.move(1, initial.dx, initial.dy, now));
      advance(.2); // Die begonnene Bewegung bleibt auch jenseits der Halteschwelle ein Wisch.
      expect(tracker.poll(now)).toBeNull();
    }
    expect(s.phase).toBe('decision');
    expect(vi.mocked(command).mock.calls.some(([, cmd]) => cmd.kind === 'pass')).toBe(false);
    const release = vector(angle);
    emit(tracker.up(1, release.dx, release.dy, now));
    expect(command).toHaveBeenCalledWith(s, { kind: 'pass', to: 'r50', quality: expect.closeTo(quality, 10) },
      expect.objectContaining({ passDelayMax: .6, closeoutRandom: 1 }), expect.any(Function));
    expect(vi.mocked(command).mock.calls.filter(([, cmd]) => cmd.kind === 'pass')).toHaveLength(1);
    expect(s.phase).toBe('passing');
    expect(s.fingerDown).toBe(false);
  });
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
