import type { Settings } from '../settings';
import type { Mode } from '../modes/mode';
import type { Play } from '../play/types';

/** Eine Karriere-Szene: fester Spielzug, Rückstand, Uhr, eigener Spieler */
export interface SceneSpec {
  play: Play; deficit: number; clockS: number; title: string; subtitle: string; controlled: string;
  /** Anzeigetafel: Kürzel eigenes Team / Gegner und Viertel der Szene */
  teams?: [string, string]; period?: string;
}
/** won = GAMEWINNER; verdict OVERTIME/DOPPEL-OVERTIME (Gleichstand) entscheidet die Karriere-Logik */
export interface SceneResult { won: boolean; verdict: string; pts: number; ast: number }
export type PlayScene = (app: HTMLElement, s: Settings, spec: SceneSpec, onEnd: (r: SceneResult) => void) => Mode;
