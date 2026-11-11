import type { ActorView } from './actors';

export const REPLAY_SPEED = 0.4; // Zeitlupe
export const REPLAY_SECONDS = 2.6; // so viel Vorlauf vor dem Höhepunkt wird gezeigt

export interface Snap { t: number; ball: { x: number; y: number; z: number }; actors: ActorView[] }

/** Ringpuffer der letzten Sekunden; Schnappschüsse werden wiederverwendet (keine Allokation pro Bild im Dauerbetrieb). */
export function createRecorder(maxSeconds: number, fps = 60) {
  const capacity = Math.ceil(maxSeconds * fps) + 1;
  const ring: Snap[] = [];
  let next = 0, size = 0;
  return {
    push(t: number, views: readonly ActorView[], ball: { x: number; y: number; z: number }): void {
      const snap = (ring[next] ??= { t: 0, ball: { x: 0, y: 0, z: 0 }, actors: [] });
      snap.t = t;
      snap.ball.x = ball.x; snap.ball.y = ball.y; snap.ball.z = ball.z;
      snap.actors.length = views.length;
      views.forEach((v, i) => { snap.actors[i] = Object.assign(snap.actors[i] ?? ({} as ActorView), v); });
      next = (next + 1) % capacity;
      size = Math.min(capacity, size + 1);
    },
    /** Tiefe Kopie der letzten `seconds` Sekunden, älteste zuerst */
    clip(seconds: number): Snap[] {
      const out: Snap[] = [];
      for (let i = size; i >= 1; i--) {
        const s = ring[(next - i + capacity) % capacity];
        out.push({ t: s.t, ball: { ...s.ball }, actors: s.actors.map((a) => ({ ...a })) });
      }
      const end = out.at(-1)?.t ?? 0;
      return out.filter((s) => s.t >= end - seconds * 1000);
    },
    reset(): void { next = 0; size = 0; },
  };
}

/** Schnappschuss zur Wiedergabezeit (Echtzeit-ms seit Start) oder null, wenn das Replay vorbei ist */
export function replayAt(clip: Snap[], elapsedMs: number): Snap | null {
  if (!clip.length) return null;
  const t = clip[0].t + elapsedMs * REPLAY_SPEED;
  if (t > clip[clip.length - 1].t) return null;
  let i = 0;
  while (i + 1 < clip.length && clip[i + 1].t <= t) i++;
  return clip[i];
}
