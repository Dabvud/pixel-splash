import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PerspectiveCamera, Vector3 } from 'three';
import type { GestureEvent } from '../src/input/gesture';
import { attachGesture } from '../src/input/gesture';
import { command, createPlayState, step } from '../src/play/engine';
import type { PlayState } from '../src/play/engine';
import { startPlayLab } from '../src/modes/play-lab';
import { DEFAULTS } from '../src/settings';
import { MAX_FILL } from '../src/shot/resolve';
import type { Mode } from '../src/modes/mode';
import { ACTORS } from '../src/play/teams';

vi.mock('../src/render/scene', async () => {
  const THREE = await import('three');
  return { createScene: () => ({ scene: new THREE.Scene(), ball: new THREE.Object3D() }) };
});
vi.mock('../src/render/pixel', () => ({ createPixelRenderer: () => ({ renderer: { render: vi.fn(), dispose: vi.fn() }, resize: vi.fn() }) }));
vi.mock('../src/figure/atlas', async () => {
  const THREE = await import('three');
  return { buildAtlas: () => ({ texture: new THREE.Texture(), uv: () => [0, 0, 1, 1] }) };
});
vi.mock('../src/render/actors', () => ({ createActors: () => ({ sync: vi.fn(), dispose: vi.fn() }) }));
vi.mock('../src/input/gesture', () => ({ attachGesture: vi.fn(() => vi.fn()) }));
vi.mock('../src/play/engine', async importOriginal => {
  const actual = await importOriginal<typeof import('../src/play/engine')>();
  return { ...actual, createPlayState: vi.fn(actual.createPlayState), step: vi.fn(actual.step) };
});

let mode: Mode, frame: FrameRequestCallback, now: number;
function advance(seconds: number): void {
  for (let i = 0; i < Math.ceil(seconds * 60); i++) { now += 1000 / 60; frame(now); }
}
function state(): PlayState { return vi.mocked(createPlayState).mock.results.at(-1)!.value; }
function gesture(e: GestureEvent): void { vi.mocked(attachGesture).mock.calls.at(-1)![1](e); }

beforeEach(() => {
  vi.clearAllMocks();
  now = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { frame = callback; return 1; }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  document.body.innerHTML = '<div id="app"></div>';
  mode = startPlayLab(document.querySelector('#app')!, { ...DEFAULTS, mode: 'play', play: 'pnr', defenseRandom: false });
});
afterEach(() => { mode.stop(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('Spielzug-Labor Integration', () => {
  function catchArrow(): PlayState {
    advance(2.3);
    const s = state(), c = vi.mocked(step).mock.calls.at(-1)![2];
    command(s, { kind: 'pass', to: 'r11' }, c, () => 1);
    for (let i = 0; i < 240 && !s.arrowMeter; i++) advance(1 / 60);
    expect(s.arrowMeter?.kind).toBe('catchshoot');
    return s;
  }
  it('bestätigt den Pfeil-Tipp beim Loslassen mit Aufsetzzeit und hält seine Markierung fest', () => {
    const s = catchArrow();
    now += (s.arrowMeter!.startTime + s.arrowMeter!.meterMs / 1000 - s.realTime) * 1000;
    gesture({ type: 'start' });
    expect(s.phase).toBe('decision');
    now += 120;
    frame(now);
    gesture({ type: 'tap' });
    frame(now);
    expect(s.phase).toBe('ballflight');
    expect(s.arrowMeter!.fill).toBeCloseTo(1, 8);
    const arrow = document.querySelector<HTMLElement>('.hud-arrow')!;
    const mark = document.querySelector<HTMLElement>('.hud-mark')!;
    expect(arrow.hidden).toBe(false);
    const bottom = arrow.style.bottom;
    expect(mark.style.bottom).toBe(bottom);
    advance(.5);
    expect(arrow.style.bottom).toBe(bottom);
    expect(mark.style.bottom).toBe(bottom);
  });
  it('unterdrückt hold und release derselben Pfeil-Berührung und lässt danach normale Kombis zu', () => {
    const s = catchArrow();
    gesture({ type: 'start' });
    now += 200;
    gesture({ type: 'hold' });
    expect(s.combo).toBeNull();
    gesture({ type: 'release', holdMs: 250, angleDeg: 0 });
    expect(s.phase).toBe('decision');
    for (let i = 0; i < 120 && s.arrowMeter; i++) advance(1 / 60);
    gesture({ type: 'start' });
    gesture({ type: 'hold' });
    expect(s.phase).toBe('combo');
  });
  it('lässt einen schnellen 30-px-Wisch während Catch-and-Shoot sofort ziehen, auch während der Kamerafahrt', () => {
    const look = vi.spyOn(PerspectiveCamera.prototype, 'lookAt');
    const stage = document.querySelector<HTMLElement>('#stage')!;
    Object.defineProperties(stage, { clientWidth: { value: 800 }, clientHeight: { value: 600 } });
    const s = catchArrow();
    expect(vi.mocked(attachGesture).mock.calls.at(-1)![2]()).toBe(false);
    const camera = look.mock.contexts.at(-1) as PerspectiveCamera;
    const h = s.actors[s.handler].pos;
    const origin = new Vector3(h.x, 1, h.z).project(camera), rim = new Vector3(0, 3.05, 0).project(camera);
    const dx = (rim.x - origin.x) * 400, dy = (origin.y - rim.y) * 300, len = Math.hypot(dx, dy);
    gesture({ type: 'start' });
    now += 100;
    gesture({ type: 'flick', dx: dx / len * 30, dy: dy / len * 30, holdMs: 100 });
    expect(s.phase).toBe('driving');
    expect(s.arrowMeter).toBeNull();
  });
  it('pausiert den Pfeil und verwirft einen noch unbestätigten Tipp beim Menüöffnen', () => {
    const s = catchArrow();
    gesture({ type: 'start' });
    mode.setPaused!(true);
    const snapshot = JSON.stringify(s);
    advance(5);
    expect(JSON.stringify(s)).toBe(snapshot);
    mode.setPaused!(false);
    gesture({ type: 'tap' });
    expect(s.phase).toBe('decision');
    expect(s.arrowMeter!.fill).toBeNull();
  });
  it('verliert nach einem 500-ms-Frameaussetzer keine Pfeil-Echtzeit', () => {
    const s = catchArrow(), before = s.realTime;
    now += 500;
    frame(now);
    expect(s.realTime - before).toBeCloseTo(.5, 8);
    expect(parseFloat(document.querySelector<HTMLElement>('.hud-arrow')!.style.bottom))
      .toBeCloseTo((s.realTime - s.arrowMeter!.startTime) * 1000 / s.arrowMeter!.meterMs / MAX_FILL * 100, 8);
  });
  it('erlaubt den Lob-Tipp während des Passflugs und unterdrückt hold derselben Berührung', () => {
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'inbound', defenseRandom: false });
    advance(1.3);
    const s = state(), c = vi.mocked(step).mock.calls.at(-1)![2];
    command(s, { kind: 'pass', to: 'r50' }, c, () => 1);
    for (let i = 0; i < 120 && s.realTime < s.arrowMeter!.startTime; i++) advance(1 / 60);
    expect(s.phase).toBe('passing');
    expect(vi.mocked(attachGesture).mock.calls.at(-1)![2]()).toBe(false);
    gesture({ type: 'start' });
    now += 200;
    gesture({ type: 'hold' });
    expect(s.phase).toBe('passing');
    gesture({ type: 'tap' });
    expect(s.arrowMeter!.fill).not.toBeNull();
    for (let i = 0; i < 120 && s.handler === 'r3'; i++) advance(1 / 60);
    expect(s.handler).toBe('r50');
    expect(s.phase).toBe('ballflight');
    expect(document.querySelector<HTMLElement>('.hud-mark')!.hidden).toBe(false);
  });
  it('verwendet nach 500 ms Frameaussetzer dieselbe Echtzeit für Kombianzeige und Release', () => {
    advance(2.3);
    gesture({ type: 'start' });
    now += 200;
    gesture({ type: 'hold' });
    const meterMs = state().combo!.meterMs;
    vi.mocked(step).mockClear();
    now += 500;
    frame(now);
    const fill = document.querySelector<HTMLElement>('.hud-fill')!;
    const displayed = fill.style.height;
    expect(parseFloat(displayed)).toBeCloseTo(500 / meterMs / MAX_FILL * 100, 8);
    const intervals = vi.mocked(step).mock.calls.map(call => call[1]);
    expect(intervals.reduce((a, b) => a + b, 0)).toBeCloseTo(.5, 10);
    expect(intervals.every(dt => dt <= .05)).toBe(true);
    gesture({ type: 'release', holdMs: 700, angleDeg: 0 });
    frame(now);
    expect(state().phase).toBe('ballflight');
    expect(fill.style.height).toBe(displayed);
    expect(document.querySelector<HTMLElement>('.hud-mark')!.style.bottom).toBe(displayed);
  });

  it('verliert bei langen Frames keine Entscheidungsfrist und pausiert die Echtzeit im Menü', () => {
    advance(2.3);
    const before = state().clock;
    mode.setPaused!(true);
    now += 5000;
    frame(now);
    expect(state().clock).toBe(before);
    mode.setPaused!(false);
    state().actors.b1.pos = { x: 0, z: 5 };
    for (const id of ['b7', 'b15', 'b21', 'b44']) state().actors[id].pos = { x: 7, z: 12 };
    now += (DEFAULTS.decisionS + .1) * 1000;
    frame(now);
    expect(document.querySelector('.phud-markers')!.children).toHaveLength(1);
    expect(state().clock).toBeCloseTo(before - (DEFAULTS.decisionS + .1) * DEFAULTS.slowmo, 8);
    gesture({ type: 'start' });
    gesture({ type: 'hold' });
    const meterMs = state().combo!.meterMs;
    now += 500;
    frame(now);
    expect(parseFloat(document.querySelector<HTMLElement>('.hud-fill')!.style.height))
      .toBeCloseTo(500 / meterMs / MAX_FILL * 100, 8);
  });

  it('startet die Kombianzeige bei verspätetem hold am ursprünglichen Schwellenzeitpunkt', () => {
    advance(2.3);
    gesture({ type: 'start' });
    const startedAt = now + 200;
    now += 700;
    gesture({ type: 'hold', startedAt });
    frame(now);
    expect(parseFloat(document.querySelector<HTMLElement>('.hud-fill')!.style.height))
      .toBeCloseTo(500 / state().combo!.meterMs / MAX_FILL * 100, 8);
    gesture({ type: 'release', holdMs: 700, angleDeg: 0 });
    expect(state().phase).toBe('ballflight');
  });

  it.each([[99, 'ballflight'], [100, 'ended'], [101, 'ended']] as const)(
    'wertet Release nach %s ms zwischen Frames nur strikt vor Uhrablauf (%s)', (elapsed, phase) => {
      advance(2.3);
      gesture({ type: 'start' });
      gesture({ type: 'hold' });
      state().clock = .1 * DEFAULTS.slowmo;
      now += elapsed;
      gesture({ type: 'release', holdMs: 200 + elapsed, angleDeg: 0 });
      expect(state().phase).toBe(phase);
      if (phase === 'ended') {
        expect(state().clock).toBe(0);
        expect(state().banner).toBe('ZEIT ABGELAUFEN');
        expect(state().points).toBe(0);
      }
    });

  it.each([
    { type: 'start' }, { type: 'hold' }, { type: 'tap' }, { type: 'cancel' },
    { type: 'flick', dx: 100, dy: 0, holdMs: 101 },
  ] satisfies GestureEvent[])('schreibt vor $type die Simulation bis zur Eingabe fort', event => {
    advance(2.3);
    state().clock = .1 * DEFAULTS.slowmo;
    now += 101;
    gesture(event);
    expect(state().phase).toBe('ended');
    expect(state().banner).toBe('ZEIT ABGELAUFEN');
  });

  it.each(['intro', 'running', 'passing', 'combo', 'ballflight', 'freethrows'] as const)(
    'zeigt in %s einen weißen Positionsring und den Spielerpfeil', phase => {
      mode.setPaused!(true);
      state().phase = phase;
      advance(1 / 60);
      const ring = document.querySelector<HTMLElement>('.phud-ring')!;
      const arrow = document.querySelector<HTMLElement>('.phud-handler')!;
      expect(ring.hidden).toBe(false);
      expect(ring.style.borderColor).toBe('white');
      expect(arrow.hidden).toBe(false);
      expect(arrow.textContent).toBe('▼');
    });
  it.each(['decision', 'driving', 'takeoff'] as const)(
    'behält in %s die Positionsfarbe am sichtbaren Ring', phase => {
      mode.setPaused!(true);
      state().phase = phase;
      advance(1 / 60);
      const ring = document.querySelector<HTMLElement>('.phud-ring')!;
      expect(ring.hidden).toBe(false);
      expect(ring.style.borderColor).not.toBe('');
      expect(ring.style.borderColor).not.toBe('white');
    });
  it('lässt Ring und Spielerpfeil nach einem Pass dem handler folgen und projiziert den Pfeil über dem Kopf', () => {
    const lookAt = vi.spyOn(PerspectiveCamera.prototype, 'lookAt');
    const stage = document.querySelector<HTMLElement>('#stage')!;
    Object.defineProperties(stage, { clientWidth: { value: 800 }, clientHeight: { value: 600 } });
    const projected = (x: number, y: number, z: number) => {
      const camera = lookAt.mock.contexts.at(-1) as PerspectiveCamera;
      const v = new Vector3(x, y, z).project(camera);
      const f = v.z > 1 ? -1 : 1;
      return `translate(${(v.x * f + 1) / 2 * 800}px, ${(1 - v.y * f) / 2 * 600}px)`;
    };
    const checkPositions = () => {
      const h = state().actors[state().handler];
      expect(document.querySelector<HTMLElement>('.phud-ring')!.style.transform).toBe(projected(h.pos.x, 0, h.pos.z));
      expect(document.querySelector<HTMLElement>('.phud-handler')!.style.transform)
        .toBe(projected(h.pos.x, h.y + ACTORS[h.id].heightM + .35, h.pos.z));
    };
    advance(2.3);
    expect(state().phase).toBe('decision');
    checkPositions();
    const shoot = document.querySelector<HTMLElement>('.phud-m-shoot')!;
    const arrow = document.querySelector<HTMLElement>('.phud-handler')!;
    expect(parseFloat(shoot.style.transform.split(',')[1]))
      .toBeLessThan(parseFloat(arrow.style.transform.split(',')[1]) - 32);
    const before = document.querySelector<HTMLElement>('.phud-handler')!.style.transform;
    const cfg = vi.mocked(step).mock.calls.at(-1)![2];
    command(state(), { kind: 'pass', to: 'r50' }, cfg, () => 1);
    advance(1 / 60);
    expect(state().phase).toBe('passing');
    expect(document.querySelector<HTMLElement>('.phud-ring')!.style.borderColor).toBe('white');
    checkPositions();
    for (let i = 0; i < 120 && state().phase === 'passing'; i++) advance(1 / 60);
    expect(state().handler).toBe('r50');
    expect(document.querySelector<HTMLElement>('.phud-handler')!.style.transform).not.toBe(before);
    checkPositions();
    mode.setPaused!(true);
    state().phase = 'freethrows';
    state().freeThrows = { shooter: state().handler, left: 2 };
    state().actors[state().handler].y = .6;
    advance(1 / 60);
    checkPositions();
    expect(document.querySelector<HTMLElement>('.phud-ring')!.style.borderColor).toBe('white');
  });
  it('blendet Positionsring und Spielerpfeil in ended aus', () => {
    mode.setPaused!(true);
    advance(1 / 60);
    state().phase = 'ended';
    advance(1 / 60);
    expect(document.querySelector<HTMLElement>('.phud-ring')!.hidden).toBe(true);
    expect(document.querySelector<HTMLElement>('.phud-handler')!.hidden).toBe(true);
  });
  it('pausiert Spielzeit und Fristen bei offenem Menü und startet nach Spielzugwechsel pausiert neu', () => {
    advance(1);
    mode.setPaused!(true);
    const snapshot = JSON.stringify(state()), calls = vi.mocked(step).mock.calls.length;
    advance(5);
    expect(JSON.stringify(state())).toBe(snapshot);
    expect(vi.mocked(step).mock.calls).toHaveLength(calls);
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'inbound', defenseRandom: false });
    expect(state().play.id).toBe('inbound');
    advance(3);
    expect(state().phase).toBe('intro');
    mode.setPaused!(false);
    advance(1);
    expect(state().phase).not.toBe('intro');
  });
  it('verwirft eine aktive Geste beim Menüöffnen und kann danach erneut gestartet werden', () => {
    advance(2.3);
    gesture({ type: 'start' });
    gesture({ type: 'hold' });
    expect(state().phase).toBe('combo');
    mode.setPaused!(true);
    expect(state().fingerDown).toBe(false);
    expect(state().phase).toBe('decision');
    mode.setPaused!(false);
    gesture({ type: 'start' });
    gesture({ type: 'hold' });
    now += state().combo!.meterMs;
    gesture({ type: 'release', holdMs: 200 + state().combo!.meterMs, angleDeg: 0 });
    expect(state().phase).toBe('ballflight');
  });
  it('kehrt bei Abbruch an den Entscheidungspunkt zurück und rechnet die Halteschwelle einmal ab', () => {
    advance(2.3);
    gesture({ type: 'start' }); gesture({ type: 'hold' }); gesture({ type: 'cancel' });
    expect(state().phase).toBe('decision');
    gesture({ type: 'start' }); gesture({ type: 'hold' });
    const meter = state().combo!.meterMs;
    now += meter;
    gesture({ type: 'release', holdMs: meter + 200, angleDeg: 0 });
    advance(4);
    expect(state().points).toBeGreaterThanOrEqual(2);
  });
  it('entfernt Optionsmarker nach der Entscheidung aus dem sichtbaren HUD', () => {
    advance(2.3);
    const markers = document.querySelector('.phud-markers')!;
    expect(markers.children.length).toBeGreaterThan(0);
    gesture({ type: 'start' }); gesture({ type: 'hold' });
    advance(1 / 60);
    expect(markers.children).toHaveLength(0);
  });
  it('zeigt nach KI-Werfen nur noch den verbindlichen Wurfmarker', () => {
    advance(2.3);
    state().actors.b1.pos = { x: 0, z: 5 };
    for (const id of ['b7', 'b15', 'b21', 'b44']) state().actors[id].pos = { x: 7, z: 12 };
    advance(DEFAULTS.decisionS);
    expect(state().phase).toBe('decision');
    const markers = document.querySelector('.phud-markers')!;
    expect(markers.children).toHaveLength(1);
    expect(markers.firstElementChild!.classList.contains('phud-m-shoot')).toBe(true);
  });
  it('hält Wurfanzeige und Loslass-Markierung bis zum Ergebnis sichtbar und eingefroren', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    advance(2.3);
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'pnr', defenseRandom: false, animSpeed: .5 });
    gesture({ type: 'start' }); gesture({ type: 'hold' });
    const comboStartedAt = now;
    advance(1 / 60);
    const meter = document.querySelector<HTMLElement>('#hud-meter')!;
    const fill = meter.querySelector<HTMLElement>('.hud-fill')!;
    const mark = meter.querySelector<HTMLElement>('.hud-mark')!;
    now = comboStartedAt + state().combo!.meterMs * .6;
    gesture({ type: 'release', holdMs: 200 + state().combo!.meterMs * .6, angleDeg: 0 });
    advance(1 / 60);
    const releasedHeight = fill.style.height, releasedBottom = mark.style.bottom;
    expect(parseFloat(releasedHeight)).toBeCloseTo(.6 / MAX_FILL * 100, 8);
    expect(releasedBottom).toBe(releasedHeight);
    advance(1.6);
    vi.advanceTimersByTime(1600);
    expect(state().phase).toBe('ballflight');
    expect(meter.hidden).toBe(false);
    expect(mark.hidden).toBe(false);
    expect(fill.style.height).toBe(releasedHeight);
    expect(mark.style.bottom).toBe(releasedBottom);
    mode.setPaused!(true);
    advance(1);
    expect(meter.hidden).toBe(false);
    expect(mark.hidden).toBe(false);
    expect(fill.style.height).toBe(releasedHeight);
    mode.setPaused!(false);
    for (let i = 0; i < 600 && state().phase === 'ballflight'; i++) advance(1 / 60);
    expect(state().phase).not.toBe('ballflight');
    expect(meter.hidden).toBe(true);
    expect(mark.hidden).toBe(true);
  });
  it('übernimmt die aim-Mittelachse unter 0,5 m auch in die gerenderte Kamera', () => {
    const lookAt = vi.spyOn(PerspectiveCamera.prototype, 'lookAt');
    mode.apply({ ...DEFAULTS, mode: 'play', play: 'pnr', defenseRandom: false, camera: 'low' });
    mode.setPaused!(true);
    state().actors[state().handler].pos = { x: -.2, z: .3 };
    advance(1 / 60);
    const camera = lookAt.mock.contexts.at(-1) as PerspectiveCamera;
    expect(camera.position.x).toBe(0);
    expect(camera.position.z).toBeCloseTo(Math.hypot(.2, .3) + 7.5, 8);
    expect(camera.position.y).toBeCloseTo(4.2, 8);
  });
  it('hält das Ergebnis genau zwei aktive Sekunden und entsorgt Gesten beim Stoppen', () => {
    state().phase = 'ended';
    // Das End-Ereignis wird wie aus der Engine zugestellt.
    vi.mocked(step).mockReturnValueOnce([{ type: 'end', verdict: 'VERLOREN' }]);
    advance(1 / 60);
    const before = vi.mocked(createPlayState).mock.calls.length;
    advance(1);
    mode.setPaused!(true); advance(5); mode.setPaused!(false);
    expect(vi.mocked(createPlayState).mock.calls).toHaveLength(before);
    advance(1.1);
    expect(vi.mocked(createPlayState).mock.calls).toHaveLength(before + 1);
    const detach = vi.mocked(attachGesture).mock.results.at(-1)!.value;
    mode.stop();
    expect(detach).toHaveBeenCalled();
    expect(document.querySelector('#stage')).toBeNull();
  });
});
