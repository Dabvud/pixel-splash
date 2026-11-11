// Statline pro Spiel: vorerst nur Punkte und Assists. Weitere Werte (REB, STL, …)
// werden später für den Karrieremodus aus der Spielleistung generiert.
export interface StatLine { pts: number; ast: number }
export interface GameStats { players: Record<string, StatLine> }

export const emptyLine = (): StatLine => ({ pts: 0, ast: 0 });
export const emptyGame = (): GameStats => ({ players: {} });

const line = (g: GameStats, id: string): StatLine => (g.players[id] ??= emptyLine());

export function addPoints(g: GameStats, id: string, pts: number): void {
  line(g, id).pts += pts;
}

export function addAssist(g: GameStats, id: string): void {
  line(g, id).ast++;
}

/** Statline eines Spielzugs ins laufende Spiel übernehmen */
export function addPlay(g: GameStats, box: Record<string, StatLine>): void {
  for (const [id, b] of Object.entries(box)) {
    const l = line(g, id);
    l.pts += b.pts;
    l.ast += b.ast;
  }
}

export function boxRows(g: GameStats, ids: string[]): ({ id: string } & StatLine)[] {
  return ids.map((id) => ({ id, ...(g.players[id] ?? emptyLine()) }));
}
