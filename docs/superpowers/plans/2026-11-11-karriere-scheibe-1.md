# Karriere – erste spielbare Scheibe Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eine Karriere ist spielbar: Spieler erstellen, Saison mit 5 Key Games à 2–3 Szenen, simulierte Tabelle, nächste Saison – mit Spielerwerten, die das Spiel spürbar beeinflussen (Teilprojekte 1–3 der Spec; Playoffs, Off-Season, Combine, Spezialisierungen, Awards folgen in eigenen Plänen).

**Architecture:** Neuer Ordner `src/career/` mit reiner, testbarer Logik (Werte, Liga, Speicherstand, Key Games, Saison-Simulation). Ein neuer Modus `src/modes/career.ts` steuert Bildschirme (`src/ui/career-*.ts`) und startet Szenen über eine Szenen-Schnittstelle des bestehenden Spielzug-Labors. Die Engine bekommt Spielerwerte und eine „nur eigener Spieler“-Steuerung; Labore bleiben unverändert.

**Tech Stack:** Vite 6, TypeScript strict, three.js, vitest + jsdom. Keine neuen Abhängigkeiten.

**Spec:** `docs/superpowers/specs/2026-11-11-karriere-design.md` (Abschnitte 2–4, 6-Grundsatz, 8, 9, Festlegungen)

## Global Constraints

- Keine neuen Abhängigkeiten; TypeScript strict; `npx tsc -b` fehlerfrei; vitest grün.
- Alle UI-Texte deutsch, Schrift „Press Start 2P“ wie bestehende HUDs, Hochformat (Handy) zuerst, keine horizontale Scrollbar.
- Wurf-Labor und Spielzug-Labor verhalten sich exakt wie vorher (bestehende Tests unverändert grün).
- Jeder Zugriff auf `localStorage` in try/catch; fehlt Speicher, läuft die Karriere ohne Fortsetzen weiter.
- Alle Zufälle der Karriere über einen gespeicherten Seed (`mulberry32`-artige rng aus `seeded()` in play-lab bzw. eigener Helfer), damit Tests deterministisch sind.
- Teamnamen exakt aus der Merkliste (30 Teams, siehe Task 2).
- 5 Key Games pro Saison, 2–3 Szenen pro Key Game (Spec 3/4).
- Nur der eigene Spieler wird gesteuert; Pass zu Mitspieler → dessen KI entscheidet; Assists zählen für den eigenen Spieler (Spec 6).
- Karriereende: natürliches Ende 36–40, freiwilliger Rücktritt ab 33; Schwierigkeit Rookie / Pro / Hall of Fame; Verletzungen ~5 % pro Saison → 3 statt 5 Key Games (Festlegungen).

## Review Focus

1. Alter/kaputter Speicherstand (anderes Format, abgeschnittenes JSON) → Karriere-Menü zeigt „Neue Karriere“, kein Absturz (Test in Task 3).
2. App wird mitten in einem Key Game geschlossen → beim Öffnen startet dasselbe Key Game von vorn, Saisonbilanz unverändert (Test in Task 11).
3. Eigener Spieler hat eine Rolle, die ein Spielzug nicht besetzt (z. B. Big in einem Guard-Spielzug) → Szenen-Generator wählt nur passende Spielzüge (Test in Task 6).
4. Szene endet durch Steal/Zeitablauf/Foul-Freiwürfe → Ergebnis wird trotzdem genau einmal gemeldet (Test in Task 8).
5. Extreme Werte (alle 0 bzw. alle 1) → Meter-Tempo und grüne Zone bleiben in sinnvollen Grenzen (Test in Task 1).

---

### Task 1: Spielerwerte und ihre Wirkung

**Files:**
- Create: `src/play/ratings.ts`
- Modify: `src/play/types.ts` (ActorDef), `src/play/teams.ts` (Werte für alle Spieler), `src/play/engine.ts` (Stellen mit `.shot`/`.athleticism`, Pass-Steal, Abschluss-Meter), `src/play/finish.ts`
- Test: `tests/ratings.test.ts`

**Interfaces:**
- Produces:
  - `export type RatingKey = 'mid' | 'three' | 'finish' | 'dunk' | 'dribble' | 'pass' | 'athleticism' | 'defense' | 'leadership'`
  - `export type Ratings = Record<RatingKey, number>` (0…1)
  - `export function ratingsOf(a: ActorDef): Ratings` – nutzt `a.ratings`, sonst abgeleitet aus `shot`/`athleticism` (mid = three = shot, finish = dunk = athleticism = athleticism, Rest 0,5)
  - `export function finishMeter(base: { meterMs: number; greenZone: number }, finish: number): { meterMs: number; greenZone: number }` – Merkzettel „Abschluss-Meter nach Spielerwert“: finish 0 → meterMs × 0,7 und greenZone × 0,6; finish 1 → meterMs × 1,15 und greenZone × 1,25; linear dazwischen
  - `ActorDef.ratings?: Ratings`
- Wirkung in der Engine: Sprungwurf/Dreier nutzt `mid` bzw. `three` als `rating`; `finishKind` nutzt `dunk`; Abschluss-Meter über `finishMeter` (nur wenn `cfg.ratingMeters === true`, Labore lassen es aus → Labore unverändert); Steal-Chance beim Pass × (1,3 − 0,6 × pass); Positionswert beim Ziehen: Verteidiger zählt × (1,2 − 0,4 × (dribble − defense des Verteidigers) ) begrenzt auf [0,7; 1,3].

- [ ] **Step 1: Tests schreiben** – `ratingsOf` leitet ohne `ratings` korrekt ab (r23: dunk 0,9, three 0,6); `finishMeter(…, 0)` und `(…, 1)` liefern die Faktoren oben; Werte außerhalb [0,1] werden geklemmt; alle bestehenden Spieler in teams.ts haben `ratings` mit 9 Schlüsseln in [0,1]; Engine mit `ratingMeters: true` und finish 1 → längeres Meter als finish 0; ohne `ratingMeters` identisch zu heute (Snapshot der combo-Werte eines bestehenden Tests).
- [ ] **Step 2:** `npx vitest run tests/ratings.test.ts` → FAIL (Modul fehlt).
- [ ] **Step 3:** Implementieren wie oben; bestehende Spieler bekommen Werte, die ihre heutigen `shot`/`athleticism` treffen (`shot`/`athleticism`-Felder bleiben für Abwärtskompatibilität).
- [ ] **Step 4:** `npx vitest run` → alles grün.
- [ ] **Step 5:** Commit `feat: Spielerwerte (9 Werte) und ihre Wirkung in der Engine`.

### Task 2: Liga (30 Teams)

**Files:** Create `src/career/league.ts`; Test `tests/career-league.test.ts`

**Interfaces:**
- Produces: `export interface Team { id: string; city: string; name: string; conference: 'east' | 'west'; jersey: string; shorts: string; strength: number }`, `export const TEAMS: Team[]`, `export function teamName(t: Team): string` („Boston Leprechauns“), `export function evolveStrength(t: Team, rng): number` (±0–8 pro Saison, geklemmt 25–95).
- Namen exakt: Osten – Boston Leprechauns, Brooklyn Buckets, New York Socks, Philadelphia 67ers, Toronto T-Rexes, Chicago Buffalos, Cleveland Musketeers, Detroit Gears, Indiana Slowers, Milwaukee Deers, Atlanta Birds, Charlotte Bees, Miami Blizzard, Orlando Physics, Washington Scientists. Westen – Denver Gold Diggers, Minnesota Woodpuppies, Oklahoma City Lightning, Portland Trail Walkers, Utah Hip-Hop, Golden State Pacifists, LA Sailboats, LA Puddles, Phoenix Moons, Sacramento Queens, Dallas Rebels, Houston UFOs, Memphis Teddies, New Orleans Penguins, San Antonio Boots.

- [ ] **Step 1: Tests** – 30 Teams, je 15 pro Conference, Namen exakt wie oben, ids eindeutig, Farben gültige `#rrggbb`, Stärken 25–95, `evolveStrength` bleibt in Grenzen über 1000 Würfe.
- [ ] **Step 2:** FAIL. **Step 3:** implementieren (Startstärken gestreut 35–85). **Step 4:** PASS. **Step 5:** Commit `feat: Karriere-Liga mit 30 Teams`.

### Task 3: Karriere-Speicherstand

**Files:** Create `src/career/state.ts`; Test `tests/career-state.test.ts`

**Interfaces:**
- Produces:
  - `export type Position = 'guard' | 'wing' | 'big'`, `export type Difficulty = 'rookie' | 'pro' | 'hof'`
  - `export interface CareerPlayer { name: string; num: number; look: Look; position: Position; ratings: Ratings; age: number }`
  - `export interface GameRecord { opponent: string; label: string; home: boolean; won: boolean; pts: number; ast: number; reb: number }`
  - `export interface SeasonRecord { year: number; team: string; age: number; wins: number; losses: number; rank: number; games: GameRecord[] }`
  - `export interface CareerState { version: 1; seed: number; difficulty: Difficulty; player: CareerPlayer; team: string; year: number; keyGames: KeyGame[]; gameIndex: number; history: SeasonRecord[]; injured: boolean; retired: boolean }` (`KeyGame` aus Task 9 – hier als Typ vorab in `state.ts` definiert: `{ opponent: string; label: string; home: boolean }`)
  - `export const CAREER_KEY = 'pixel-splash.career.v1'`
  - `export function loadCareer(storage?: Storage): CareerState | null`, `export function saveCareer(s: CareerState, storage?: Storage): void`, `export function clearCareer(storage?: Storage): void`

- [ ] **Step 1: Tests** – Roundtrip speichern/laden gleich; kaputtes JSON → null; `version: 2` → null; fehlende Pflichtfelder → null; Storage wirft → load null und save wirft nicht.
- [ ] **Step 2–4:** FAIL → implementieren (Validierung der Pflichtfelder und Typen, Werte geklemmt) → PASS.
- [ ] **Step 5:** Commit `feat: Karriere-Speicherstand`.

### Task 4: Hauptmenü und Karriere-Modus-Gerüst

**Files:** Create `src/ui/main-menu.ts`, `src/modes/career.ts` (Gerüst); Modify `src/settings.ts` (`mode: 'shot' | 'play' | 'career'`), `src/main.ts`, `src/ui/lab-menu.ts` (Modus-Auswahl ergänzt „Karriere“; in der Karriere sind Labor-Einstellungen ausgeblendet außer Kamera/Pixel-Auflösung), `src/style.css`; Test `tests/main-menu.test.ts`

**Interfaces:**
- Produces: `export function createMainMenu(root: HTMLElement, onPick: (mode: 'career' | 'shot' | 'play') => void): { show(): void; hide(): void }`; `export function startCareer(app: HTMLElement, s: Settings, deps?: CareerDeps): Mode` (deps für Tests: `{ storage?: Storage; playScene?: PlayScene }`, `PlayScene` aus Task 8).
- Verhalten: Beim App-Start erscheint das Hauptmenü (Karriere / Wurf-Labor / Spielzug-Labor) mit dem bisherigen Modus vorausgewählt hervorgehoben; Auswahl speichert `settings.mode`. Gerüst `startCareer`: ohne Speicherstand Bildschirm „Neue Karriere“ (Knopf → Task 5), mit Speicherstand „Fortsetzen“ + „Neue Karriere“ (Bestätigung, weil der alte Stand gelöscht wird).

- [ ] **Step 1: Tests** – Menü zeigt 3 Knöpfe mit genau diesen Texten; Klick ruft `onPick` mit richtigem Modus; `settings` akzeptiert `career`, ungültig → `shot`; `startCareer` ohne Stand zeigt „Neue Karriere“, mit Stand „Fortsetzen“; „Neue Karriere“ bei vorhandenem Stand fragt nach („Alte Karriere löschen?“).
- [ ] **Step 2–4:** FAIL → implementieren → PASS (bestehende Settings-/Lab-Menü-Tests weiter grün).
- [ ] **Step 5:** Commit `feat: Hauptmenü und Karriere-Modus-Gerüst`.

### Task 5: Spieler erstellen

**Files:** Create `src/ui/career-create.ts`, `src/career/create.ts`; Test `tests/career-create.test.ts`

**Interfaces:**
- Consumes: `Look` (`src/figure/raster.ts`), `rasterPose`/`project`/`moveFrames` für die Vorschau, `TEAMS`, `CareerState`.
- Produces: `export function newCareer(input: { name: string; num: number; look: Look; position: Position; difficulty: Difficulty }, seed: number): CareerState` in `create.ts`; `export function createCareerScreen(root: HTMLElement, onDone: (input) => void): void`.
- Startwerte: Position bestimmt Schwerpunkte (Guard: three/pass/dribble hoch; Flügel: mid/three/athleticism; Big: dunk/finish/defense), Summe je nach Schwierigkeit (Rookie 5,4 / Pro 4,9 / HoF 4,4 über 9 Werte), Alter 19. Draft-Team ohne Combine (Combine folgt später): eines der 5 schwächsten Teams, per Seed. Größe: Guard 1,85–1,96, Flügel 1,96–2,03, Big 2,05–2,13 (Schieberegler).
- UI: Name, Rückennummer 0–99, Position, Größe, Haut, Frisur, Bart, Stirnband, Ärmel, Schuhe, Socken, Statur, Schwierigkeit; Live-Vorschau der Figur (idle, front) als skalierte Pixel-Canvas; Trikot in den Farben des späteren Teams erst nach dem Draft – in der Vorschau neutral grau.

- [ ] **Step 1: Tests** – `newCareer` liefert gültigen Stand (Task 3 validiert ihn), Werte-Summe je Schwierigkeit ±0,01, Position-Schwerpunkte (Guard three > dunk, Big dunk > three), Team ist unter den 5 schwächsten, deterministisch je Seed; Bildschirm: alle Felder vorhanden, „Los geht's“ liefert Eingaben, leerer Name → Standardname „Rookie“.
- [ ] **Step 2–4:** FAIL → implementieren → PASS.
- [ ] **Step 5:** Commit `feat: Karriere – Spieler erstellen`.

### Task 6: Eigener Spieler in den Szenen (Held)

**Files:** Create `src/career/hero.ts`; Modify `src/play/teams.ts` (veränderbares Register), `src/play/situations.ts` (castPlay mit festem Helden); Test `tests/career-hero.test.ts`

**Interfaces:**
- Consumes: `castPlay(play, rng)`, `PLAY_ROLES`, `ACTORS`.
- Produces: `export const HERO_ID = 'hero'`; `export function registerHero(p: CareerPlayer, team: Team): ActorDef` (trägt ins `ACTORS`-Register ein, Teamfarben, team 'off', role = position, `ratings`); `export function playsForHero(position: Position): PlayId[]` (nur Spielzüge mit einer Rolle dieser Position und einer Rolle, die in einer Option den Ball bekommt); `export function castWithHero(play: Play, position: Position, rng: () => number): Play` (Held ersetzt einen Angreifer gleicher Rolle – bevorzugt den Ballführer des Startsegments bzw. den Empfänger der wichtigsten Option –, übrige Rollen wie castPlay).

- [ ] **Step 1: Tests** – für jede Position: `playsForHero` nicht leer; für jeden Spielzug daraus × 50 Seeds: `castWithHero` enthält `hero` genau einmal, alle ids konsistent (Muster aus `tests/situations.test.ts`), Engine erreicht `ended` (Muster `tests/play-routes.ts`); Atlas für `hero` mit Extrem-Look bleibt in den Grenzen (Muster `tests/canvas-textures.test.ts`).
- [ ] **Step 2–4:** FAIL → implementieren → PASS.
- [ ] **Step 5:** Commit `feat: Karriere – eigener Spieler in den Spielzügen`.

### Task 7: Nur den eigenen Spieler steuern

**Files:** Modify `src/play/engine.ts`; Test `tests/engine-controlled.test.ts`

**Interfaces:**
- Produces: `EngineConfig.controlled?: string` (ohne Wert: heutiges Verhalten). Mit Wert: Entscheidungen und Würfe anderer Ballführer trifft die KI sofort (Option nach Positionswert/Werten wie die bestehende KI-Auswahl `aiSelected`; Wurf mit Füllstand aus Wert: Treffer-Wahrscheinlichkeit ≈ 0,35 + 0,4 × Wert, über rng); Pfeil-Meter erscheinen nur für den eigenen Spieler; Assist für den eigenen Spieler, wenn der KI-Mitspieler nach seinem Pass trifft (bestehendes `lastPasser`).

- [ ] **Step 1: Tests** – Held passt zum Mitspieler → kein Meter für den Mitspieler, Szene endet ohne Eingabe, bei Treffer `box.hero.ast === 1`; Mitspieler passt zurück → Held hat wieder Entscheidung; ohne `controlled` identisch zu heute (bestehende Tests grün); 200 Seeds erreichen `ended`.
- [ ] **Step 2–4:** FAIL → implementieren → PASS.
- [ ] **Step 5:** Commit `feat: Engine – nur eigener Spieler gesteuert`.

### Task 8: Szenen-Schnittstelle des Spielzug-Labors

**Files:** Modify `src/modes/play-lab.ts`; Create `src/career/scene-types.ts`; Test `tests/play-lab-scene.test.ts`

**Interfaces:**
- Produces in `scene-types.ts`: `export interface SceneSpec { play: Play; deficit: number; clockS: number; title: string; subtitle: string; controlled: string; ratingMeters: true }`, `export interface SceneResult { won: boolean; verdict: string; pts: number; ast: number }`, `export type PlayScene = (app: HTMLElement, s: Settings, spec: SceneSpec, onEnd: (r: SceneResult) => void) => Mode`.
- `startPlayLab(app, settings, scene?: { spec: SceneSpec; onEnd: (r: SceneResult) => void })`: mit Szene keine Zufallswahl des Spielzugs, kein Neustart nach Ende; Intro-Einblendung zeigt `title`/`subtitle`; nach Ende (inkl. Freiwürfe, Replay, Mop-Boy, Bank-Szene) **genau einmal** `onEnd` (won = verdict GAMEWINNER oder OVERTIME bzw. DOPPEL-OVERTIME; pts/ast aus `box.hero`).

- [ ] **Step 1: Tests** – (gemockter Renderer wie `tests/play-lab.test.ts`) Szene startet den übergebenen Spielzug mit Rückstand/Uhr; `onEnd` genau einmal nach Treffer, nach Steal, nach Zeitablauf, nach And-one-Freiwürfen; Labor ohne Szene unverändert.
- [ ] **Step 2–4:** FAIL → implementieren → PASS.
- [ ] **Step 5:** Commit `feat: Spielzug-Labor als Szenen-Spieler für die Karriere`.

### Task 9: Key Games

**Files:** Create `src/career/keygame.ts`; Test `tests/career-keygame.test.ts`

**Interfaces:**
- Produces:
  - `export function scheduleSeason(state: CareerState, rng): KeyGame[]` – 5 Spiele (3 bei `injured`), Etiketten aus: „Rivalen-Duell“, „Spitzenspiel“, „Christmas Game“, „Auswärts in feindlicher Halle“, „Rückkehr zum Ex-Team“ (nur wenn es ein Ex-Team gibt), „Nationales TV-Spiel“; Gegner nie das eigene Team; Heim/Auswärts gemischt.
  - `export function scenePlan(game: KeyGame, chemistryScenes: number, rng): { count: 2 | 3 }` – 2 Szenen, 3 bei „Spitzenspiel“/„Christmas Game“.
  - `export function finalDeficit(earlier: boolean[]): number` – Start 3, je gewonnene frühere Szene −1, verlorene +1, geklemmt 1–6.
  - `export function sceneSpec(game: KeyGame, index: number, total: number, deficit: number, hero: CareerPlayer, rng): SceneSpec` – frühere Szenen: Uhr 8–24 s, „1.–3. Viertel“; letzte Szene: Crunchtime „4. VIERTEL“, Uhr 3–12 s, `deficit` aus `finalDeficit`; Spielzug aus `playsForHero` + `castWithHero`.
  - `export function gameResult(scenes: SceneResult[]): boolean` – Spiel gewonnen ⇔ letzte Szene gewonnen.
  - `export function projectLine(r: Ratings, scenes: SceneResult[], rng): { pts: number; ast: number; reb: number }` – pts = Szenenpunkte + round(6 + 18 × Mittel(mid,three,finish) ± 4), ast = Szenen-Assists + round(1 + 8 × pass ± 2), reb = round(1 + 9 × (athleticism + defense)/2 ± 2), alle ≥ 0.

- [ ] **Step 1: Tests** – Zahl und Etiketten, kein Spiel gegen sich selbst, deterministisch; `finalDeficit([true,true]) === 1`, `([false,false,false]) === 6`; `gameResult`; `projectLine` Grenzen über 1000 Würfe; `sceneSpec` letzte Szene hat Uhr 3–12 und Titel „4. VIERTEL“.
- [ ] **Step 2–4:** FAIL → implementieren → PASS.
- [ ] **Step 5:** Commit `feat: Karriere – Key Games und Szenenplan`.

### Task 10: Saison-Simulation und Tabelle

**Files:** Create `src/career/season.ts`; Test `tests/career-season.test.ts`

**Interfaces:**
- Produces:
  - `export function projectWins(teamStrength: number, keyWins: number, keyGames: number, difficulty: Difficulty, rng): number` – p = clamp(0,2…0,8; 0,5 + (strength − 60)/100 − {rookie: −0,05, pro: 0, hof: 0,05}); wins = round(82 × p + (keyWins − keyGames/2) × 3 ± 3), geklemmt 10–72.
  - `export function standings(state: CareerState, ownWins: number, rng): { team: string; wins: number; losses: number }[]` – eigene Conference, 15 Teams, andere Teams aus Stärke ± Zufall, sortiert.
  - `export function finishSeason(state: CareerState, ownWins: number, rng): CareerState` – hängt `SeasonRecord` an, Alter +1, Jahr +1, Teamstärken entwickeln, neue `keyGames`, `gameIndex = 0`, `injured` neu (5 %), Karriereende: ab Alter 36 jährlich Wahrscheinlichkeit (36: 20 %, 37: 35 %, 38: 55 %, 39: 75 %, 40: 100 %) → `retired = true`.
  - `export function playoffStatus(rank: number): 'playoffs' | 'playin' | 'out'` – 1–6 / 7–10 / 11–15 (Playoffs selbst folgen im nächsten Plan; hier nur Anzeige).

- [ ] **Step 1: Tests** – Grenzen von `projectWins`; mehr Key-Siege → im Mittel mehr Siege; `standings` 15 Einträge, eigenes Team enthalten, sortiert; `finishSeason` erhöht Alter/Jahr und hängt Saison an; Rücktritt spätestens mit 40; Verletzungsquote ≈ 5 % über 2000 Seeds.
- [ ] **Step 2–4:** FAIL → implementieren → PASS.
- [ ] **Step 5:** Commit `feat: Karriere – Saison-Simulation und Tabelle`.

### Task 11: Karriere-Bildschirme und Ablauf

**Files:** Modify `src/modes/career.ts`; Create `src/ui/career-hub.ts`, `src/ui/career-ticker.ts`; Modify `src/style.css`; Test `tests/career-flow.test.ts`

**Interfaces:**
- Consumes: alles aus Tasks 3–10.
- Bildschirme:
  - **Saison-Übersicht (Hub):** Name, Alter, Team, Jahr, Bilanz der Key Games (z. B. „2 / 5“), nächstes Key Game (Gegner, Etikett, Heim/Auswärts), Knöpfe „Spielen“, „Karriere-Statistik“ (Tabelle aus `history`), „Hauptmenü“.
  - **Ticker:** 2–3 s Text („Christmas Game – Auswärts bei den New York Socks · 3. Viertel · 74:77“) vor jeder Szene, antippen überspringt.
  - **Szene:** über `PlayScene` (Task 8).
  - **Spielergebnis:** Sieg/Niederlage, Endstand (simuliert, passend zum Ergebnis), Statline aus `projectLine`.
  - **Saisonende:** Platz in der Conference, Playoff-Status-Text („Playoffs erreicht – kommt bald“ / „Play-In“ / „Keine Playoffs“), Tabelle; „Nächste Saison“.
  - **Karriereende:** „Karriere beendet“ + Saison-Tabelle; danach Hauptmenü.
- Speichern nach jedem abgeschlossenen Key Game und jedem Saisonwechsel (nicht mitten in einer Szene).

- [ ] **Step 1: Tests** (gemockte `PlayScene`, die sofort ein vorgegebenes `SceneResult` meldet, Speicher-Mock) – kompletter Durchlauf einer Saison (5 Spiele) bis Saisonende-Bildschirm, Speicherstand nach jedem Spiel aktualisiert; Neuladen mitten im 3. Key Game (Mode stoppen nach 1 Szene) → „Fortsetzen“ startet Key Game 3 von vorn, Bilanz 2 Spiele; Karriereende-Bildschirm bei `retired`; Ticker per Tippen überspringbar.
- [ ] **Step 2–4:** FAIL → implementieren → PASS.
- [ ] **Step 5:** Commit `feat: Karriere – Bildschirme und Ablauf einer Saison`.

---

## Danach (eigene Pläne, Spec-Abschnitt 10)

4 Playoffs/Play-In · 5 Off-Season (Verträge mit Skillpunkten, Trades, Alter, Teamentwicklung, Skillpunkte verteilen) · 6 Draft-Combine · 7 Spezialisierungen + Chemie · 8 Awards, Legacy, Hall of Fame, Rangliste · 9 Auswärtshalle.
