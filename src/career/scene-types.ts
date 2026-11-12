import type { Settings } from '../settings';
import type { Mode } from '../modes/mode';
import type { Play } from '../play/types';
import type { Perks } from '../play/engine';

/** Eine Karriere-Szene: fester Spielzug, Rückstand, Uhr, eigener Spieler */
export interface SceneSpec {
  play: Play; deficit: number; clockS: number; title: string; subtitle: string; controlled: string;
  /** Anzeigetafel: Kürzel eigenes Team / Gegner und Viertel der Szene */
  teams?: [string, string]; period?: string;
  /** echter Spielstand zu Szenenbeginn (eigenes Team, Gegner) */
  score?: [number, number];
  /** Szene mitten im Viertel: die Szenen-Uhr ist die Wurfuhr, die Spieluhr zeigt so viele Sekunden mehr */
  clockOffset?: number;
  /** Schwierigkeit in der Szene: grüne Zone, Meter-Dauer, Trefferquote der KI-Mitspieler (Faktoren) */
  tuning?: { zone: number; meter: number; ai: number };
  /** letzte Szene (Crunchtime)? Davor zeigt das Ende „+X PUNKTE“ statt GAMEWINNER/VERLOREN/OVERTIME */
  final?: boolean;
  /** Spezialisierung des eigenen Spielers; onFire = Green Light brennt */
  perks?: Perks & { onFire?: boolean };
}
/** won = GAMEWINNER; verdict OVERTIME/DOPPEL-OVERTIME (Gleichstand) entscheidet die Karriere-Logik */
export interface SceneResult { won: boolean; verdict: string; pts: number; ast: number; heroShots?: number; heroMakes?: number; teamPts?: number }
export type PlayScene = (app: HTMLElement, s: Settings, spec: SceneSpec, onEnd: (r: SceneResult) => void) => Mode;
