import type { ActorView } from './actors';
import type { PlayState } from '../play/engine';

export const REPLAY_SPEED = 0.4; // Zeitlupe
export const REPLAY_SECONDS = 1.6; // Vorlauf vor dem Höhepunkt: erst kurz vor dem Abschluss einsteigen

type Effects = Pick<PlayState, 'realTime' | 'poster' | 'grave'>;
export interface Snap extends Effects { t: number; ball: { x: number; y: number; z: number }; actors: ActorView[] }

/** Ringpuffer der letzten Sekunden; Schnappschüsse werden wiederverwendet (keine Allokation pro Bild im Dauerbetrieb). */
export function createRecorder(maxSeconds: number, fps = 60) {
  const capacity = Math.ceil(maxSeconds * fps) + 1;
  const ring: Snap[] = [];
  let next = 0, size = 0;
  return {
    push(t: number, views: readonly ActorView[], ball: { x: number; y: number; z: number }, effects?: Effects): void {
      const snap = (ring[next] ??= { t: 0, ball: { x: 0, y: 0, z: 0 }, actors: [], realTime: 0, poster: null, grave: null });
      snap.t = t;
      snap.realTime = effects?.realTime ?? t / 1000;
      snap.poster = effects?.poster ? Object.assign(snap.poster ?? {}, effects.poster) : null;
      snap.grave = effects?.grave ? Object.assign(snap.grave ?? {}, effects.grave) : null;
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
        out.push({ t: s.t, ball: { ...s.ball }, actors: s.actors.map((a) => ({ ...a })),
          realTime: s.realTime, poster: s.poster && { ...s.poster }, grave: s.grave && { ...s.grave } });
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
