import { afterEach, describe, expect, it, vi } from 'vitest';
import { GestureTracker, MIN_SWIPE_PX, attachGesture } from '../src/input/gesture';

afterEach(() => {
  vi.restoreAllMocks();
  document.body.replaceChildren();
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

  it('verträgt fehlgeschlagenes Pointer Capture', () => {
    const { onEvent, now, capture, pointer } = attach();
    capture.mockImplementation(() => { throw new Error('nicht verfügbar'); });
    pointer('pointerdown', 1, 120, 550);
    now.mockReturnValue(800);
    pointer('pointerup', 1, 120, 450);
    expect(onEvent.mock.calls).toEqual([
      [{ type: 'start' }], [{ type: 'release', holdMs: 700, angleDeg: 0 }],
    ]);
  });

  it('entfernt alle drei Listener mit der Rückgabefunktion', () => {
    const { el, onEvent, detach, pointer } = attach();
    const remove = vi.spyOn(el, 'removeEventListener');
    pointer('pointerdown', 1, 120, 550);
    detach();
    onEvent.mockClear();
    pointer('pointerup', 1, 120, 450);
    pointer('pointercancel', 1, 120, 450);
    pointer('pointerdown', 2, 120, 550);
    expect(onEvent).not.toHaveBeenCalled();
    expect(remove.mock.calls.map(([type]) => type).sort()).toEqual(['pointercancel', 'pointerdown', 'pointerup']);
  });
});
