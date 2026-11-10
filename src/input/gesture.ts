export type GestureEvent =
  | { type: 'start' }
  | { type: 'release'; holdMs: number; angleDeg: number }
  | { type: 'cancel' }
  | { type: 'tap' };
export const MIN_SWIPE_PX = 30;

export class GestureTracker {
  private pointer: { id: number; x: number; y: number; t: number } | null = null;

  get active(): boolean {
    return this.pointer !== null;
  }

  down(id: number, x: number, y: number, t: number): GestureEvent | null {
    if (this.active) return null;
    this.pointer = { id, x, y, t };
    return { type: 'start' };
  }

  up(id: number, x: number, y: number, t: number): GestureEvent | null {
    if (this.pointer === null || this.pointer.id !== id) return null;
    const start = this.pointer;
    this.pointer = null;
    const dyUp = start.y - y;
    // Die Spezifikation verlangt mehr als 30 Pixel nach unten für den Abbruch.
    if (dyUp < -MIN_SWIPE_PX) return { type: 'cancel' };
    if (dyUp < MIN_SWIPE_PX) return { type: 'tap' };
    return {
      type: 'release', holdMs: t - start.t,
      angleDeg: Math.atan2(x - start.x, dyUp) * 180 / Math.PI,
    };
  }

  abort(id: number): GestureEvent | null {
    if (this.pointer === null || this.pointer.id !== id) return null;
    this.pointer = null;
    return { type: 'cancel' };
  }
}

export function attachGesture(el: HTMLElement, onEvent: (e: GestureEvent) => void, isLocked: () => boolean): () => void {
  const tracker = new GestureTracker();

  function down(e: PointerEvent): void {
    if (isLocked() || tracker.active) return;
    const bounds = el.getBoundingClientRect();
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;
    if (y < bounds.height * 0.4) return;
    const event = tracker.down(e.pointerId, x, y, performance.now());
    if (event) {
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // Der Pointer kann vor dem Einfangen bereits verschwunden sein.
        tracker.abort(e.pointerId);
        return;
      }
      onEvent(event);
    }
  }

  function up(e: PointerEvent): void {
    const bounds = el.getBoundingClientRect();
    const event = tracker.up(e.pointerId, e.clientX - bounds.left, e.clientY - bounds.top, performance.now());
    if (event) onEvent(event);
  }

  function cancel(e: PointerEvent): void {
    const event = tracker.abort(e.pointerId);
    if (event) onEvent(event);
  }

  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', cancel);
  el.addEventListener('lostpointercapture', cancel);
  return () => {
    el.removeEventListener('pointerdown', down);
    el.removeEventListener('pointerup', up);
    el.removeEventListener('pointercancel', cancel);
    el.removeEventListener('lostpointercapture', cancel);
  };
}
