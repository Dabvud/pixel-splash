import { afterEach, describe, expect, it, vi } from 'vitest';
import { GestureTracker, MIN_SWIPE_PX, attachGesture } from '../src/input/gesture';
import type { GestureOptions } from '../src/input/gesture';

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

const playOptions: GestureOptions = { flicks: true, holdThresholdMs: 200 };

describe('Spielzug-Gesten', () => {
  it.each([
    [-80, 0, 120], [0, 60, 100], [0, -30, 199], [30, 0, 100], [24, 18, 100],
  ])('liefert den vollständigen Flick (%s, %s) mit Dauer %s', (dx, dy, holdMs) => {
    const tracker = new GestureTracker(playOptions);
    tracker.down(1, 100, 500, 0);
    expect(tracker.up(1, 100 + dx, 500 + dy, holdMs)).toEqual({ type: 'flick', dx, dy, holdMs });
  });

  it('wertet 10 px vor der Schwelle als tap', () => {
    const tracker = new GestureTracker(playOptions);
    tracker.down(1, 100, 500, 0);
    expect(tracker.up(1, 110, 500, 100)).toEqual({ type: 'tap' });
  });

  it('bricht gehaltene Gesten mit 60 px nach unten ab', () => {
    const tracker = new GestureTracker(playOptions);
    tracker.down(1, 100, 500, 0);
    expect(tracker.up(1, 100, 560, 300)).toEqual({ type: 'cancel' });
  });

  it('liefert ab genau 200 ms release mit roher Haltedauer', () => {
    const tracker = new GestureTracker(playOptions);
    tracker.down(1, 100, 500, 0);
    expect(tracker.up(1, 100, 440, 200)).toEqual({ type: 'release', holdMs: 200, angleDeg: 0 });
  });

  it('meldet hold pro Geste genau einmal ab der Schwelle', () => {
    const tracker = new GestureTracker(playOptions);
    expect(tracker.poll(500)).toBeNull();
    tracker.down(1, 100, 500, 100);
    expect(tracker.poll(299)).toBeNull();
    expect(tracker.poll(300)).toEqual({ type: 'hold', startedAt: 300 });
    expect(tracker.poll(400)).toBeNull();
    tracker.abort(1);
    expect(tracker.poll(500)).toBeNull();
    tracker.down(2, 100, 500, 600);
    expect(tracker.poll(800)).toEqual({ type: 'hold', startedAt: 800 });
  });

  it('fügt dem Wurf-Labor ohne Optionen kein hold hinzu', () => {
    const tracker = new GestureTracker();
    tracker.down(1, 100, 500, 0);
    expect(tracker.poll(300)).toBeNull();
  });
});

describe('Spielzug-Haltetimer', () => {
  it('holt bei überfälligem Timer hold vor release mit dem Schwellenzeitpunkt nach', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const now = vi.spyOn(performance, 'now').mockReturnValue(100);
    const { pointer, onEvent, detach } = setup();
    pointer('pointerdown');
    now.mockReturnValue(1000);
    // Der Timer wird absichtlich nicht ausgeführt; pointerup kommt zuerst dran.
    pointer('pointerup', 2);
    expect(onEvent).toHaveBeenCalledTimes(1);
    pointer('pointerup', 1, 440);
    expect(onEvent.mock.calls.flat()).toEqual([
      { type: 'start' }, { type: 'hold', startedAt: 300 }, { type: 'release', holdMs: 900, angleDeg: 0 },
    ]);
    vi.advanceTimersByTime(1000);
    expect(onEvent).toHaveBeenCalledTimes(3);
    detach();
  });

  function setup() {
    const el = document.createElement('div');
    el.setPointerCapture = vi.fn();
    vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, top: 0, left: 0, bottom: 600, right: 300, width: 300, height: 600,
      toJSON: () => ({}),
    });
    const onEvent = vi.fn();
    const detach = attachGesture(el, onEvent, () => false, playOptions);
    const pointer = (type: string, id = 1, y = 500) => el.dispatchEvent(new PointerEvent(type, {
      pointerId: id, clientX: 100, clientY: y,
    }));
    return { pointer, onEvent, detach };
  }

  afterEach(() => vi.useRealTimers());

  it('leitet drag vor dem Loslassen weiter und unterdrückt danach hold', () => {
    const now = vi.spyOn(performance, 'now').mockReturnValue(0);
    const { pointer, onEvent, detach } = setup();
    pointer('pointerdown');
    now.mockReturnValue(80);
    pointer('pointermove', 1, 420);
    expect(onEvent.mock.calls.flat()).toEqual([
      { type: 'start' }, { type: 'drag', dx: 0, dy: -80 },
    ]);
    now.mockReturnValue(500);
    pointer('pointerup', 1, 400);
    expect(onEvent).toHaveBeenLastCalledWith({ type: 'flick', dx: 0, dy: -100, holdMs: 500 });
    expect(onEvent.mock.calls.flat().some(event => event.type === 'hold')).toBe(false);
    detach();
  });

  it('liefert hold nach 200 ms per Timer und ignoriert fremde Finger', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    const { pointer, onEvent, detach } = setup();
    pointer('pointerdown');
    vi.advanceTimersByTime(199);
    expect(onEvent.mock.calls).toEqual([[{ type: 'start' }]]);
    pointer('pointerup', 2);
    pointer('pointercancel', 2);
    vi.advanceTimersByTime(1);
    expect(onEvent.mock.calls).toEqual([[{ type: 'start' }], [{ type: 'hold', startedAt: 200 }]]);
    vi.advanceTimersByTime(500);
    expect(onEvent).toHaveBeenCalledTimes(2);
    pointer('pointerup', 1, 440);
    expect(onEvent.mock.calls.flat()).toEqual([
      { type: 'start' }, { type: 'hold', startedAt: 200 }, { type: 'release', holdMs: 700, angleDeg: 0 },
    ]);
    detach();
  });

  it.each(['pointerup', 'pointercancel', 'lostpointercapture', 'detach'])(
    'entfernt den Haltetimer bei %s', (action) => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
      const { pointer, onEvent, detach } = setup();
      pointer('pointerdown');
      if (action === 'detach') detach();
      else pointer(action);
      vi.advanceTimersByTime(300);
      expect(onEvent.mock.calls.flat().some(event => event.type === 'hold')).toBe(false);
      detach();
    });
});

describe('GestureTracker', () => {
  it('startet und misst einen geraden Wurf nach oben', () => {
    const tracker = new GestureTracker();
    expect(MIN_SWIPE_PX).toBe(30);
    expect(tracker.active).toBe(false);
    expect(tracker.down(1, 100, 500, 0)).toEqual({ type: 'start' });
    expect(tracker.active).toBe(true);
    expect(tracker.up(1, 100, 400, 700)).toEqual({ type: 'release', holdMs: 700, angleDeg: 0 });
    expect(tracker.active).toBe(false);
  });

  it.each([[150, 45], [50, -45]])('misst den Winkel bei x=%s als %s Grad', (x, angleDeg) => {
    const tracker = new GestureTracker();
    tracker.down(1, 100, 500, 0);
    expect(tracker.up(1, x, 450, 500)).toEqual({ type: 'release', holdMs: 500, angleDeg });
  });

  it.each([
    [100, 540, 'cancel'], [100, 510, 'tap'], [100, 490, 'tap'],
    [200, 490, 'tap'], [100, 500, 'tap'], [100, 530, 'tap'],
    [100, 530.001, 'cancel'], [100, 470.001, 'tap'],
  ])('behandelt Loslassen bei (%s, %s) als %s', (x, y, type) => {
    const tracker = new GestureTracker();
    tracker.down(1, 100, 500, 0);
    expect(tracker.up(1, x as number, y as number, 500)).toEqual({ type });
    expect(tracker.active).toBe(false);
  });

  it('lässt ab genau 30 px nach oben los', () => {
    const tracker = new GestureTracker();
    tracker.down(1, 100, 500, 10);
    expect(tracker.up(1, 100, 470, 710)).toEqual({ type: 'release', holdMs: 700, angleDeg: 0 });
  });

  it('verwendet die Richtung unabhängig von der Wischlänge', () => {
    const tracker = new GestureTracker();
    tracker.down(1, 100, 500, 0);
    const short = tracker.up(1, 150, 450, 500);
    tracker.down(1, 100, 500, 0);
    expect(tracker.up(1, 300, 300, 500)).toEqual(short);
  });

  it('ignoriert den zweiten Finger, ohne den laufenden Wurf zu ändern', () => {
    const tracker = new GestureTracker();
    tracker.down(1, 100, 500, 0);
    expect(tracker.down(2, 300, 600, 200)).toBeNull();
    expect(tracker.up(2, 300, 200, 400)).toBeNull();
    expect(tracker.active).toBe(true);
    expect(tracker.up(1, 100, 400, 700)).toEqual({ type: 'release', holdMs: 700, angleDeg: 0 });
  });

  it('bricht nur die eigene Geste ab und kann anschließend neu starten', () => {
    const tracker = new GestureTracker();
    tracker.down(1, 100, 500, 0);
    expect(tracker.abort(2)).toBeNull();
    expect(tracker.active).toBe(true);
    expect(tracker.abort(1)).toEqual({ type: 'cancel' });
    expect(tracker.active).toBe(false);
    expect(tracker.up(1, 100, 400, 700)).toBeNull();
    expect(tracker.abort(2)).toBeNull();
    expect(tracker.down(2, 100, 500, 800)).toEqual({ type: 'start' });
    expect(tracker.up(2, 100, 400, 1500)).toEqual({ type: 'release', holdMs: 700, angleDeg: 0 });
  });

  it('ignoriert Loslassen und Abbruch ohne aktive Geste', () => {
    const tracker = new GestureTracker();
    expect(tracker.up(1, 100, 400, 700)).toBeNull();
    expect(tracker.abort(1)).toBeNull();
    expect(tracker.active).toBe(false);
  });
});

function attach() {
  const el = document.createElement('div');
  document.body.append(el);
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    x: 20, y: 100, top: 100, left: 20, bottom: 600, right: 220, width: 200, height: 500,
    toJSON: () => ({}),
  });
  const capture = vi.fn();
  el.setPointerCapture = capture;
  const onEvent = vi.fn();
  const isLocked = vi.fn(() => false);
  const now = vi.spyOn(performance, 'now').mockReturnValue(100);
  const detach = attachGesture(el, onEvent, isLocked);
  function pointer(type: string, id: number, x: number, y: number) {
    el.dispatchEvent(new PointerEvent(type, { pointerId: id, clientX: x, clientY: y, bubbles: true }));
  }
  return { el, onEvent, isLocked, now, capture, detach, pointer };
}

describe('attachGesture', () => {
  it('ignoriert die oberen 40 Prozent relativ zum Element', () => {
    const { onEvent, capture, pointer } = attach();
    pointer('pointerdown', 1, 120, 299);
    pointer('pointerup', 1, 120, 100);
    expect(onEvent).not.toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalled();
  });

  it('startet an der Grenze von 40 Prozent', () => {
    const { onEvent, pointer } = attach();
    pointer('pointerdown', 1, 120, 300);
    expect(onEvent).toHaveBeenCalledExactlyOnceWith({ type: 'start' });
  });

  it('startet unten, fängt den Pointer ein und misst Dauer und Richtung', () => {
    const { onEvent, now, capture, pointer } = attach();
    now.mockReturnValue(123.5);
    pointer('pointerdown', 7, 120, 550);
    expect(onEvent).toHaveBeenNthCalledWith(1, { type: 'start' });
    expect(capture).toHaveBeenCalledExactlyOnceWith(7);
    now.mockReturnValue(823.5);
    pointer('pointerup', 7, 170, 500);
    expect(onEvent).toHaveBeenNthCalledWith(2, { type: 'release', holdMs: 700, angleDeg: 45 });
    expect(onEvent).toHaveBeenCalledTimes(2);
  });

  it('ignoriert neue Gesten bei gesperrter Eingabe', () => {
    const { onEvent, isLocked, capture, pointer } = attach();
    isLocked.mockReturnValue(true);
    pointer('pointerdown', 1, 120, 550);
    pointer('pointerup', 1, 120, 450);
    expect(onEvent).not.toHaveBeenCalled();
    expect(capture).not.toHaveBeenCalled();
    isLocked.mockReturnValue(false);
    pointer('pointerdown', 2, 120, 550);
    expect(onEvent).toHaveBeenCalledExactlyOnceWith({ type: 'start' });
  });

  it('ignoriert auch über Pointer Events den zweiten Finger', () => {
    const { onEvent, now, capture, pointer } = attach();
    pointer('pointerdown', 1, 120, 550);
    now.mockReturnValue(300);
    pointer('pointerdown', 2, 180, 500);
    pointer('pointerup', 2, 180, 400);
    pointer('pointercancel', 2, 180, 400);
    now.mockReturnValue(800);
    pointer('pointerup', 1, 120, 450);
    expect(onEvent.mock.calls).toEqual([
      [{ type: 'start' }], [{ type: 'release', holdMs: 700, angleDeg: 0 }],
    ]);
    expect(capture).toHaveBeenCalledExactlyOnceWith(1);
  });

  it('bricht bei pointercancel ab und erlaubt danach eine neue Geste', () => {
    const { onEvent, pointer } = attach();
    pointer('pointerdown', 1, 120, 550);
    pointer('pointercancel', 1, 120, 500);
    pointer('pointerup', 1, 120, 400);
    pointer('pointerdown', 2, 120, 550);
    expect(onEvent.mock.calls).toEqual([
      [{ type: 'start' }], [{ type: 'cancel' }], [{ type: 'start' }],
    ]);
  });

  it('bricht bei lostpointercapture genau einmal ab und erlaubt danach eine neue Geste', () => {
    const { onEvent, pointer } = attach();
    pointer('pointerdown', 1, 120, 550);
    expect(onEvent).toHaveBeenCalledExactlyOnceWith({ type: 'start' });
    pointer('lostpointercapture', 1, 120, 550);
    pointer('lostpointercapture', 1, 120, 550);
    expect(onEvent.mock.calls).toEqual([
      [{ type: 'start' }], [{ type: 'cancel' }],
    ]);
    pointer('pointerdown', 2, 120, 550);
    expect(onEvent.mock.calls).toEqual([
      [{ type: 'start' }], [{ type: 'cancel' }], [{ type: 'start' }],
    ]);
  });

  it('ignoriert lostpointercapture nach normalem Loslassen', () => {
    const { onEvent, now, pointer } = attach();
    pointer('pointerdown', 1, 120, 550);
    now.mockReturnValue(800);
    pointer('pointerup', 1, 120, 450);
    expect(onEvent.mock.calls).toEqual([
      [{ type: 'start' }], [{ type: 'release', holdMs: 700, angleDeg: 0 }],
    ]);
    pointer('lostpointercapture', 1, 120, 450);
    expect(onEvent).toHaveBeenCalledTimes(2);
  });

  it('verarbeitet Loslassen außerhalb des Elements nach Pointer Capture', () => {
    const { onEvent, now, pointer } = attach();
    pointer('pointerdown', 1, 120, 550);
    now.mockReturnValue(800);
    pointer('pointerup', 1, 120, 50);
    expect(onEvent).toHaveBeenLastCalledWith({ type: 'release', holdMs: 700, angleDeg: 0 });
  });

  it('erkennt Antippen und Wischen nach unten auch über Pointer Events', () => {
    const { onEvent, pointer } = attach();
    pointer('pointerdown', 1, 120, 550);
    pointer('pointerup', 1, 120, 540);
    pointer('pointerdown', 2, 120, 550);
    pointer('pointerup', 2, 120, 590);
    expect(onEvent.mock.calls).toEqual([
      [{ type: 'start' }], [{ type: 'tap' }], [{ type: 'start' }], [{ type: 'cancel' }],
    ]);
  });

  it('meldet bei fehlgeschlagenem Pointer Capture keinen Start und erlaubt danach eine neue Geste', () => {
    const { el, onEvent, pointer } = attach();
    const capture = vi.spyOn(el, 'setPointerCapture').mockImplementationOnce(() => {
      throw new Error('nicht verfügbar');
    });
    pointer('pointerdown', 1, 120, 550);
    expect(onEvent).not.toHaveBeenCalled();
    capture.mockImplementation(() => {});
    pointer('pointerdown', 2, 120, 550);
    expect(onEvent).toHaveBeenCalledExactlyOnceWith({ type: 'start' });
    expect(capture.mock.calls).toEqual([[1], [2]]);
  });

  it('entfernt alle vier Listener mit der Rückgabefunktion', () => {
    const { el, onEvent, detach, pointer } = attach();
    const remove = vi.spyOn(el, 'removeEventListener');
    pointer('pointerdown', 1, 120, 550);
    detach();
    onEvent.mockClear();
    pointer('lostpointercapture', 1, 120, 550);
    pointer('pointerup', 1, 120, 450);
    pointer('pointercancel', 1, 120, 450);
    pointer('pointerdown', 2, 120, 550);
    expect(onEvent).not.toHaveBeenCalled();
    expect(remove.mock.calls.map(([type]) => type).sort()).toEqual([
      'lostpointercapture', 'pointercancel', 'pointerdown', 'pointermove', 'pointerup',
    ]);
  });
});

describe('Ruhe-Regel: Wisch vs. Wurf im Spielzug-Labor', () => {
  const opts = { flicks: true, holdThresholdMs: 200 };

  it('meldet laufende Wischvektoren nur nach der Ruhe-Regel und nur im flicks-Modus', () => {
    const t = new GestureTracker(opts);
    t.down(1, 100, 500, 0);
    expect(t.move(2, 100, 420, 50)).toBeNull();
    expect(t.move(1, 100, 490, 50)).toBeNull();
    expect(t.move(1, 100, 470, 80)).toEqual({ type: 'drag', dx: 0, dy: -30 });
    expect(t.move(1, 100, 420, 450)).toEqual({ type: 'drag', dx: 0, dy: -80 });
    expect(t.up(1, 100, 400, 500)).toEqual({ type: 'flick', dx: 0, dy: -100, holdMs: 500 });
    const shot = new GestureTracker();
    shot.down(1, 100, 500, 0);
    expect(shot.move(1, 100, 420, 50)).toBeNull();
    t.down(1, 100, 500, 600);
    t.poll(800);
    expect(t.move(1, 100, 420, 900)).toBeNull();
  });

  it('wertet eine frühe Bewegung über 20 px als Wisch, auch wenn sie länger als die Halteschwelle dauert', () => {
    const t = new GestureTracker(opts);
    t.down(1, 100, 500, 0);
    t.move(1, 130, 500, 80);
    expect(t.poll(250)).toBeNull();
    expect(t.up(1, 220, 500, 450)).toEqual({ type: 'flick', dx: 120, dy: 0, holdMs: 450 });
  });

  it('startet die Kombi nur bei ruhendem Finger und wertet danach den Wisch nach oben als Release', () => {
    const t = new GestureTracker(opts);
    t.down(1, 100, 500, 0);
    t.move(1, 108, 505, 100);
    expect(t.poll(200)).toMatchObject({ type: 'hold' });
    t.move(1, 100, 400, 600);
    expect(t.up(1, 100, 380, 700)).toMatchObject({ type: 'release', holdMs: 700 });
  });

  it('ignoriert Bewegungen fremder Finger und Bewegungen nach der Schwelle', () => {
    const t = new GestureTracker(opts);
    t.down(1, 100, 500, 0);
    t.move(2, 300, 500, 50);
    t.move(1, 200, 500, 260);
    expect(t.poll(260)).toMatchObject({ type: 'hold' });
  });
});
