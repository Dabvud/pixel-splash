# Karriere – Play-In und Playoffs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Nach dem Saisonende geht es je nach Platz ins Play-In (7–10) und/oder in die Playoffs (1–6 bzw. Play-In-Sieger): pro Runde genau ein Key Game, das die Serie entscheidet; Meisterschaften werden gezählt.

**Architecture:** Reine Logik in `src/career/playoffs.ts` (Bracket, Serien-Situation, Ergebnis), Bildschirme in `src/modes/career.ts` zwischen „Saisonende“ und „Nächste Saison“. Spielstand bekommt ein optionales Feld `postseason`.

**Tech Stack:** wie bisher. **Spec:** `docs/superpowers/specs/2026-11-11-karriere-design.md` Abschnitt 3.

## Global Constraints

- Platz 1–6 Playoffs direkt, 7–10 Play-In (1 Key Game, Niederlage = Saison vorbei), 11–15 keine Playoffs.
- 4 Runden: 1. Runde, Conference-Halbfinale, Conference-Finale, Finals. Pro Runde 1 Key Game, das die Serie entscheidet.
- Situationen passend zur Serie: „Closing Game (3-2)“, „Elimination Game (2-3)“, „Game 7 (3-3)“, „Game 1 auswärts“ – zufällig je Runde, Finals bevorzugt Game 7.
- Gegner: 1. Runde aus der eigenen Conference (Platz-Paarung 1–8, 2–7, 3–6, 4–5; Play-In-Sieger als 7 oder 8), weitere Runden stärkere Gegner der eigenen Conference, Finals Gegner aus der anderen Conference.
- Ein Key Game in den Playoffs hat immer 3 Szenen, Rückstand der Crunchtime wie bisher.
- Speichern nach jedem Playoff-Spiel; Abbruch → dasselbe Spiel neu.
- Meisterschaften (`rings`) und Finals-Teilnahmen landen in `SeasonRecord` (`playoff: 'none' | 'playin' | 'r1' | 'r2' | 'cf' | 'finals' | 'champion'`).

## Review Focus

1. Play-In verloren → Saison endet sofort mit „Play-In verloren“, keine Playoff-Runde (Test Task 2).
2. Abbruch mitten in Runde 3 → Fortsetzen startet Runde 3 erneut, nicht die Saison (Test Task 2).
3. Alter Speicherstand ohne `postseason` lädt weiter (Test Task 1).
4. Gegner in Runde 1 ist nie das eigene Team und stammt aus der eigenen Conference (Test Task 1).
5. Titel wird genau einmal gezählt, auch nach Neuladen auf dem Meister-Bildschirm (Test Task 2).

### Task 1: Playoff-Logik

**Files:** Create `src/career/playoffs.ts`; Modify `src/career/state.ts` (`postseason?`, `SeasonRecord.playoff?`); Test `tests/career-playoffs.test.ts`

**Interfaces:**
- `export type Round = 'playin' | 'r1' | 'r2' | 'cf' | 'finals'`
- `export interface Postseason { rank: number; ownWins: number; round: Round; opponent: string; situation: string; home: boolean; done: boolean; result: 'none' | 'playin' | 'r1' | 'r2' | 'cf' | 'finals' | 'champion' }`
- `export function startPostseason(state: CareerState, ownWins: number, table: {team: string; wins: number}[], rng): Postseason | null` – null bei Platz 11–15.
- `export function postseasonGame(p: Postseason): KeyGame` – Etikett z. B. „1. Runde · Game 7“, „NBA Finals · Elimination Game (2-3)“.
- `export function advance(p: Postseason, won: boolean, state: CareerState, rng): Postseason` – nächste Runde oder `done` mit `result`.
- Tests: Platz 3 → Runde 1 gegen Platz 6; Platz 8 → Play-In; Play-In-Sieg → Runde 1 gegen Platz 1 oder 2; Niederlage → done mit richtigem `result`; vier Siege → `champion`; Finals-Gegner aus anderer Conference; Situationstexte aus der Liste; Speicherstand mit/ohne `postseason` gültig.

### Task 2: Playoff-Bildschirme

**Files:** Modify `src/modes/career.ts`, `src/career/keygame.ts` (`scenePlan` = 3 für Playoff-Etiketten), `src/style.css`; Test `tests/career-flow.test.ts`

- Saisonende: bei Platz 1–10 statt „Nächste Saison“ der Knopf „Playoffs“ bzw. „Play-In“.
- Playoff-Übersicht: Runde, Gegner, Situation, Knopf „Spielen“ → Ticker/Szenen wie Key Games → Ergebnis-Bildschirm „Serie gewonnen“ / „Ausgeschieden“.
- Meister: Bildschirm „MEISTER!“ mit Saisonjahr; `SeasonRecord.playoff = 'champion'`, Ringe in der Karriere-Statistik (Spalte „Playoffs“ + Summe Ringe).
- Danach „Nächste Saison“ (finishSeason mit gespeichertem Ergebnis).
- Tests: Durchlauf Platz 1 → vier Siege → Meister, Ringe = 1; Play-In-Niederlage → direkt „Nächste Saison“; Abbruch in Runde 3 → Fortsetzen = Runde 3.
