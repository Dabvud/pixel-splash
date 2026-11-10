export type SpotId = 'corner_l' | 'wing_l' | 'top' | 'wing_r' | 'corner_r' | 'ft' | 'mid';
export type CameraMode = 'low' | 'high' | 'auto';
export type ProfileId = 'elite' | 'avg' | 'center';
export type InfluenceId = 'off' | 'light' | 'fair' | 'strong';

export interface Spot { id: SpotId; label: string; x: number; z: number }
export interface Profile { id: ProfileId; label: string; rating: number }
export interface Settings {
  spot: SpotId;
  camera: CameraMode;
  profile: ProfileId;
  influence: InfluenceId;
  meterMs: number;
  greenZone: number;
  aimDeg: number;
  pixelHeight: 220 | 320 | 420 | 540;
}

export const SPOTS: readonly Spot[] = [
  { id: 'corner_l', label: 'Ecke links', x: -6.6, z: 0.5 },
  { id: 'wing_l', label: 'Flügel links', x: -4.8, z: 4.8 },
  { id: 'top', label: 'Top', x: 0, z: 6.9 },
  { id: 'wing_r', label: 'Flügel rechts', x: 4.8, z: 4.8 },
  { id: 'corner_r', label: 'Ecke rechts', x: 6.6, z: 0.5 },
  { id: 'ft', label: 'Freiwurf', x: 0, z: 4.2 },
  { id: 'mid', label: 'Mitteldistanz', x: 0, z: 5.2 },
];
export const PROFILES: readonly Profile[] = [
  { id: 'elite', label: 'Elite-Schütze', rating: 0.9 },
  { id: 'avg', label: 'Durchschnitt', rating: 0.5 },
  { id: 'center', label: 'Center', rating: 0.1 },
];
export const INFLUENCE: Record<InfluenceId, number> = { off: 0, light: 0.3, fair: 0.6, strong: 1 };
export const DEFAULTS: Settings = {
  spot: 'top', camera: 'auto', profile: 'avg', influence: 'fair',
  meterMs: 700, greenZone: 0.07, aimDeg: 6, pixelHeight: 320,
};
export const STORAGE_KEY = 'pixel-splash.settings.v1';

function bounded(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.max(min, Math.min(max, value)) : fallback;
}

function choice<T extends string | number>(value: unknown, values: readonly T[], fallback: T): T {
  return values.find((candidate) => candidate === value) ?? fallback;
}

export function loadSettings(storage?: Storage | null): Settings {
  try {
    const raw = (storage === undefined ? globalThis.localStorage : storage)?.getItem(STORAGE_KEY);
    const data: unknown = raw ? JSON.parse(raw) : null;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return { ...DEFAULTS };
    const fields = data as Record<string, unknown>;
    return {
      spot: choice(fields.spot, SPOTS.map((spot) => spot.id), DEFAULTS.spot),
      camera: choice(fields.camera, ['low', 'high', 'auto'], DEFAULTS.camera),
      profile: choice(fields.profile, PROFILES.map((profile) => profile.id), DEFAULTS.profile),
      influence: choice(fields.influence, ['off', 'light', 'fair', 'strong'], DEFAULTS.influence),
      meterMs: bounded(fields.meterMs, 400, 1200, DEFAULTS.meterMs),
      greenZone: bounded(fields.greenZone, 0.03, 0.15, DEFAULTS.greenZone),
      aimDeg: bounded(fields.aimDeg, 2, 12, DEFAULTS.aimDeg),
      pixelHeight: choice(fields.pixelHeight, [220, 320, 420, 540], DEFAULTS.pixelHeight),
    };
  } catch {
    // Gesperrter Speicher darf den Start nicht verhindern.
    return { ...DEFAULTS };
  }
}

export function saveSettings(s: Settings, storage?: Storage | null): void {
  try {
    (storage === undefined ? globalThis.localStorage : storage)?.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // Bei gesperrtem oder vollem Speicher bleibt die Sitzung nutzbar.
  }
}

export function spotDistance(spot: Spot): number {
  return Math.hypot(spot.x, spot.z);
}
