# Karriere – Off-Season Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Zwischen zwei Saisons entwickelt sich der Spieler: Vertrag läuft, bringt Skillpunkte, endet mit 2–3 Angeboten; seltene Trades; Skillpunkte verteilen; Alterung ab 31.

**Spec:** `docs/superpowers/specs/2026-11-11-karriere-design.md` Abschnitt 5 (+ Festlegungen).

## Global Constraints

- Skillpunkte (SP) kommen über Verträge: pro Saison `spPerYear` des laufenden Vertrags; ein Punkt = +0,02 auf einen Wert (max. 1).
- Rookie-Vertrag nach dem Draft: 4 Jahre, 1,5 Mio. $, 3 SP/Jahr.
- Marktwert v (0…1) = 0,6 × Mittel der Werte + 0,4 × Leistung (Key-Siege-Quote der letzten Saison, Playoff-Bonus: Runde 2 +0,05, Conf.-Finale +0,1, Finals +0,15, Meister +0,2), geklemmt.
- Angebot: SP/Jahr = round(2 + 7 × v) ± 1, Gehalt (Mio. $) = round(1 + 45 × v², 1 Nachkomma), Laufzeit 1–5 Jahre.
- Vertragsende → 3 Angebote: eigenes Team (Verlängerung) + 2 andere Teams. Mit 40 % Chance bietet ein schwaches Team (Stärke < 45) +2 SP mehr („schwer zu gewinnen, aber mehr Entwicklung“); starke Teams (> 70) bieten −1 SP.
- Trade: 5 % pro Saison mitten im Vertrag (nicht im letzten Vertragsjahr), zu einem zufälligen anderen Team; Vertrag läuft weiter.
- Alterung nach jeder Saison ab Alter 31: athleticism −0,03, dunk −0,03, finish −0,015; ab 34 zusätzlich mid/three −0,01; nie unter 0,05.
- Speicherung nach jedem Off-Season-Schritt; Abbruch → Fortsetzen landet im offenen Schritt.

## Review Focus

1. Abbruch auf dem Angebots- oder Skillpunkte-Bildschirm → beim Fortsetzen derselbe Bildschirm, Punkte nicht doppelt (Test Task 2).
2. Alter Speicherstand ohne `contract` → Rookie-Vertrag wird nachgetragen (Test Task 1).
3. Werte bleiben in 0…1 auch nach vielen Skillpunkten bzw. starker Alterung (Test Task 1).
4. Angebote nie zweimal vom selben Team, eigenes Team immer dabei (Test Task 1).
5. Karriereende (retired) überspringt die Off-Season (Test Task 2).

### Task 1: Off-Season-Logik

**Files:** Create `src/career/offseason.ts`; Modify `src/career/state.ts` (`contract`, `offseason`), `src/career/create.ts` (Rookie-Vertrag); Test `tests/career-offseason.test.ts`

- `export interface Contract { team: string; years: number; salary: number; spPerYear: number }`
- `export interface Offseason { step: 'offers' | 'trade' | 'skills'; offers?: Contract[]; tradedTo?: string; points: number }`
- `export function marketValue(state: CareerState): number`
- `export function makeOffers(state: CareerState, rng): Contract[]`
- `export function age(r: Ratings, age: number): Ratings`
- `export function beginOffseason(state: CareerState, rng): CareerState` – nach `finishSeason`: Vertragsjahr −1, Punkte gutschreiben, Alterung, ggf. Angebote oder Trade; setzt `offseason`.
- `export function acceptOffer(state, offer): CareerState`, `export function spend(state, key: RatingKey): CareerState`, `export function endOffseason(state): CareerState`.

### Task 2: Off-Season-Bildschirme

**Files:** Modify `src/modes/career.ts`, `src/style.css`; Test `tests/career-flow.test.ts`

- „Nächste Saison“ → Off-Season: ggf. Trade-Meldung, ggf. 3 Vertragsangebote (Karten mit Team, Teamstärke als Balken, Laufzeit, Gehalt, SP/Jahr), dann Skillpunkte verteilen (9 Werte als Balken mit „+“, Rest-Punkte, „Fertig“), dann Saison-Übersicht.
- Saison-Übersicht zeigt Vertrag („Vertrag: noch 2 Jahre · 12,4 Mio. $“).
