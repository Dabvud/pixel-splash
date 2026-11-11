import type { Settings } from "../settings";

// Ein laufender Modus (Wurf- oder Spielzug-Labor); main.ts wechselt zwischen ihnen
export interface Mode {
  apply(s: Settings): void;
  stop(): void;
  /** Menü offen: Spielzeit und Fristen anhalten */
  setPaused?(paused: boolean): void;
  /** Pause-Menü: Spielzug neu starten bzw. Statistik zurücksetzen */
  restart?(): void;
  /** Pause-Menü: Zusatzinhalt (z. B. Boxscore) in den Bereich schreiben */
  renderPause?(extra: HTMLElement): void;
}
