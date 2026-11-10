export type GestureEvent =
  | { type: 'start' }
  | { type: 'release'; holdMs: number; angleDeg: number }
  | { type: 'cancel' }
  | { type: 'tap' }
  | { type: 'flick'; dx: number; dy: number; holdMs: number }
  | { type: 'hold'; startedAt?: number };
export interface GestureOptions { flicks: boolean; holdThresholdMs: number }
export const MIN_SWIPE_PX = 30;

export class GestureTracker {
  private pointer: { id: number; x: number; y: number; t: number } | null = null;
  private held = false;

  constructor(private opts: GestureOptions = { flicks: false, holdThresholdMs: 0 }) {}

  get active(): boolean {
    return this.pointer !== null;
  }

  down(id: number, x: number, y: number, t: number): GestureEvent | null {
    if (this.active) return null;
    this.pointer = { id, x, y, t };
    this.held = false;
    return { type: 'start' };
  }

  poll(t: number, id = this.pointer?.id): GestureEvent | null {
    if (!this.pointer || this.held || this.opts.holdThresholdMs <= 0
      || this.pointer.id !== id
      || t - this.pointer.t < this.opts.holdThresholdMs) return null;
    this.held = true;
    return { type: 'hold', startedAt: this.pointer.t + this.opts.holdThresholdMs };
  }

  up(id: number, x: number, y: number, t: number): GestureEvent | null {
    if (this.pointer === null || this.pointer.id !== id) return null;
    const start = this.pointer;
    this.pointer = null;
    const holdMs = t - start.t;
    const dx = x - start.x;
    const dy = y - start.y;
    if (this.opts.flicks && holdMs < this.opts.holdThresholdMs) {
      return Math.hypot(dx, dy) >= MIN_SWIPE_PX
        ? { type: 'flick', dx, dy, holdMs } : { type: 'tap' };
    }
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

export function attachGesture(el: HTMLElement, onEvent: (e: GestureEvent) => void, isLocked: () => boolean,
  opts?: GestureOptions): () => void {
  const tracker = new GestureTracker(opts);
  let holdTimer: ReturnType<typeof setTimeout> | undefined;

  function clearHold(): void {
    clearTimeout(holdTimer);
    holdTimer = undefined;
  }

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
      if (opts && opts.holdThresholdMs > 0) {
        holdTimer = setTimeout(() => {
          holdTimer = undefined;
          const held = tracker.poll(performance.now());
          if (held) onEvent(held);
        }, opts.holdThresholdMs);
      }
      onEvent(event);
    }
  }

  function up(e: PointerEvent): void {
    const bounds = el.getBoundingClientRect();
    const now = performance.now();
    const held = tracker.poll(now, e.pointerId);
    if (held) onEvent(held);
    const event = tracker.up(e.pointerId, e.clientX - bounds.left, e.clientY - bounds.top, now);
    if (event) {
      clearHold();
      onEvent(event);
    }
  }

  function cancel(e: PointerEvent): void {
    const event = tracker.abort(e.pointerId);
    if (event) {
      clearHold();
      onEvent(event);
    }
  }

  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', cancel);
  el.addEventListener('lostpointercapture', cancel);
  return () => {
    clearHold();
    el.removeEventListener('pointerdown', down);
    el.removeEventListener('pointerup', up);
    el.removeEventListener('pointercancel', cancel);
    el.removeEventListener('lostpointercapture', cancel);
  };
}
