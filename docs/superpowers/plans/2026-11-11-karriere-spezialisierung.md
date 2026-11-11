# Karriere – Spezialisierungen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Genau eine Spezialisierung pro Spieler (beim Erstellen gewählt), 3 Stufen mit Skillpunkten freischaltbar, jede Stufe wirkt nur für den eigenen Spieler in den Szenen.

**Spec:** `docs/superpowers/specs/2026-11-11-karriere-design.md` Abschnitt 6.1.

## Global Constraints

- Spezialisierungen: `playmaking` (Playmaking), `shooting` (Werfen), `finishing` (Korbabschluss); Stufe 0–3; Kosten je Stufe 4 / 6 / 10 Skillpunkte (für alle gleich).
- Stufen (wirken nur für den eigenen Spieler, nur in Karriere-Szenen):
  - Playmaking 1: Steal-Chance der eigenen Pässe ×0,6. 2: Coach-Call – vor jeder Szene 2 Spielzüge zur Wahl. 3: Floor General – nach eigenem Pass steuerst du den Fänger bis zum Abschluss bzw. bis der Ball zurückkommt.
  - Werfen 1: grüne Zone beim Dreier ×1,3. 2: Deep Range – weite Dreier ohne Entfernungsabzug. 3: Green Light – nach 2 eigenen Treffern in Folge (über Szenen und Key Games hinweg) brennt der Ball; brennend ist jeder Wurf im Grün sicher drin; ein Fehlwurf löscht.
  - Korbabschluss 1: Abschluss-Meter ×1,15 länger. 2: Kontakt-Dunk-Chance ×1,5, And-one-Chance ×1,5. 3: Posterizer – getroffener Kontakt-Dunk ist immer ein Poster, verfehlter Kontakt-Dunk wird nie geblockt (normaler Fehlwurf), beim Ziehen fällt der nächste Verteidiger mit 20 % um (Ankle Breaker, Sterne, zählt nicht mehr im Positionswert).
- Gleich stark: gleiche Kosten; die Feinabstimmung der Stärke passiert über Handytests (eine Simulation kann Spielergeschick – z. B. Floor General – nicht sinnvoll messen; siehe Hinweis an den Nutzer).
- Alte Speicherstände ohne Spezialisierung: `spec` fehlt → Auswahl beim nächsten Off-Season-Skillbildschirm.

## Review Focus

1. Floor General: Mitspieler passt zurück → Steuerung wieder beim eigenen Spieler, nie zwei steuerbare Spieler (Test Task 2).
2. Green Light über Szenen hinweg: Streak im Spielstand, nicht nur in der Szene (Test Task 3).
3. Stufe kaufen ohne genug Punkte → nichts passiert (Test Task 1).
4. Perks wirken nicht im Spielzug-Labor (Test Task 2: ohne `perks` identisch).
5. Posterizer-Fehlwurf ohne Block-Animation endet sauber (Test Task 2).

### Task 1: Datenmodell + Erstellen + Skill-Bildschirm
Files: `src/career/spec.ts` (SPECS, Kosten, `buyStage`, `perksOf`), `src/career/state.ts` (`player.spec?`, `player.specLevel?`, `hot?: number`), `src/ui/career-create.ts` (Auswahl), `src/modes/career.ts` (Stufen-Kauf im Skillpunkte-Bildschirm). Tests.

### Task 2: Engine-Perks
Files: `src/play/engine.ts` (`EngineConfig.perks?: Perks` für `controlled`), `src/modes/play-lab.ts` (weitergeben, Ankle-Breaker-Sterne, Feuer bei Green Light). Tests je Perk.

### Task 3: Karriere-Verdrahtung
Files: `src/career/keygame.ts`/`src/modes/career.ts` (Perks in SceneSpec, Coach-Call-Auswahl, Green-Light-Streak über Szenen speichern). Tests im Ablauf.
