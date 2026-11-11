# Karriere – Awards, Legacy, Hall of Fame, Rangliste Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans.

**Goal:** Jede Saison vergibt Auszeichnungen, die Karriere sammelt einen Legacy-Score, am Ende gibt es eine Einstufung bis zur Hall of Fame bzw. GOAT-Debatte, und abgeschlossene Karrieren landen in einer Rangliste auf dem Gerät.

**Spec:** `docs/superpowers/specs/2026-11-11-karriere-design.md` Abschnitte 5 (Award-Skillpunkte) und 7.

## Global Constraints

- Saisonwerte: PPG/APG/RPG = Mittel der Key-Game-Statlines; Key-Sieg-Quote; Platz; Playoff-Ergebnis.
- Auszeichnungen (mehrere pro Saison möglich):
  - MVP: PPG ≥ 26, ≥ 4 Key-Siege, Platz ≤ 3 – Legacy 10, +3 Skillpunkte
  - Finals-MVP: Meister – Legacy 8, +2 SP; Ring: Meister – Legacy 12
  - All-NBA: PPG ≥ 23 – Legacy 4, +1 SP
  - All-Star: PPG ≥ 19 oder (PPG ≥ 16 und APG ≥ 7) – Legacy 3, +1 SP
  - Rookie of the Year: 1. Saison, PPG ≥ 15 – Legacy 2, +1 SP
  - Scoring-Titel: PPG ≥ 29 – Legacy 3, +1 SP
  - Defensive Player of the Year: Verteidigung ≥ 0,85, Platz ≤ 8 – Legacy 3, +1 SP
  - Clutch Player: alle Key Games der Saison gewonnen (mind. 5) – Legacy 2, +1 SP
- Legacy pro Saison zusätzlich: Siege / 10 + PPG × 0,3.
- Einstufung: < 20 Rollenspieler · < 45 Starter · < 80 All-Star · < 130 Hall of Famer · ab 130 GOAT-Debatte. Hall of Fame ab 80.
- Award-Skillpunkte werden in der folgenden Off-Season zusätzlich gutgeschrieben.
- Rangliste: `localStorage` `pixel-splash.careers.v1`, Liste abgeschlossener Karrieren {Name, Position, Saisons, Ringe, MVPs, Legacy, Einstufung, Datum}, absteigend nach Legacy, max. 20; jede Karriere genau einmal eingetragen.

## Review Focus
1. Karriereende zweimal öffnen → Rangliste nur einmal eingetragen.
2. Saison ohne Key Games (Werte 0) → keine Division durch 0, keine Awards.
3. Alte Saisons ohne `awards` → zählen mit 0.
4. Rangliste-Speicher kaputt → leere Liste, kein Absturz.
5. Trophäen-Vitrine bei 0 Awards → freundlicher Hinweis.

### Task 1: Logik (`src/career/legacy.ts`) – `seasonAwards`, `legacyOf`, `tierOf`, `awardPoints`, Rangliste laden/speichern; `finishSeason` speichert `awards`; `beginOffseason` addiert Award-Punkte. Tests.
### Task 2: Bildschirme – Auszeichnungen nach der Saison, Trophäen-Vitrine (Statistik), Karriereende mit Einstufung/Hall of Fame und Eintrag in die Rangliste, „Rangliste“ im Karriere-Startbildschirm. Tests.
