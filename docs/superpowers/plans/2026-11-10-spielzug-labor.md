# Spielzug-Labor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Zweiter Modus „Spielzug-Labor“ in Pixel Splash: 4 Spielzüge mit Zeitlupen-Entscheidungen, Pass, Korbleger/Dunk/Kontakt-Dunk, Fouls/And-ones/Freiwürfe, Positionswert und Skelett-Pixelfiguren mit 6–8 Bildern pro Bewegung.

**Architecture:** Reine Logik ohne three.js/DOM (Einstellungen, Zonen, Positionswert, Abschlüsse, Pass, Skelett/Bewegungen, Spielzug-Daten, Abspieler-Engine, Abschlussbahnen) wird von Codex testgetrieben gebaut. Rastern, Atlas, Figuren-Rendering, HUD, Kamera-Phasen und Verdrahtung baue ich. Die Engine ist eine Zustandsmaschine `createPlayState → step(dt) / command(cmd)`, die Ereignisse zurückgibt; der Modus `play-lab` übersetzt Gesten in Befehle und Zustände in Bilder.

**Tech Stack:** wie Wurf-Labor (Vite 6, TypeScript strict, three, vitest + jsdom). Keine neuen Abhängigkeiten.

**Spec:** `docs/superpowers/specs/2026-11-10-spielzug-labor-design.md` (inkl. Abschnitt „Präzisierungen“, der vorgeht)

**Ausführung:** Tasks 1–8 Codex (`codex exec`, Sandbox `unelevated`, kein git, keine Installation), ich prüfe Code, führe Tests aus, mache Mutationsproben, committe. Tasks 9–12 ich selbst. Task 13 nach OK des Nutzers.

## Global Constraints

- Weltkoordinaten wie bisher: Meter, Ring `(0, 3.05, 0)`, Spieler bei z > 0, Grundlinie z = −1,575, Seitenlinien x = ±7,5, Mittellinie z = 12,425.
- Alle Zufallsentscheidungen über eine übergebene `rng: () => number`; nie `Math.random` direkt in Logikmodulen außer als Default-Parameter.
- Das Wurf-Labor verhält sich nach allen Änderungen unverändert (bestehende 257 Tests bleiben grün, unverändert).
- Texte deutsch mit Umlauten; Banner exakt wie in der Spec.
- Spielzeit vs. Echtzeit laut Präzisierung 5.
- Kamera immer auf der Achse Korb → Ballführer (Präzisierung 11).

## Review Focus

1. Finger liegt beim Ablauf der Entscheidungsfrist auf dem Bildschirm → Frist angehalten, keine KI-Wahl mitten in der Geste (Test Task 8).
2. Spieluhr läuft während eines Ballflugs oder einer Freiwurf-Serie ab → Wurf wird gewertet, Freiwürfe finden statt (Test Task 8).
3. Labor-Menü wird mitten im Spielzug geöffnet oder der Spielzug/Modus gewechselt → Spielzeit pausiert bzw. Spielzug startet sauber neu, kein hängender Zustand (manuelle Prüfung Task 12).
4. Alte gespeicherte Einstellungen ohne neue Felder → laden fehlerfrei, neue Felder = Standard (Test Task 1).
5. Ziel außerhalb des Bildes im Hochformat (Ecke) → Randpfeil sichtbar, Pass per Wisch in seine Richtung möglich (Test Task 4 für die Wahl, manuelle Prüfung Task 12).

---

### Task 1: Einstellungen erweitern + gemeinsamer Zonenfaktor

**Files:** Modify `src/settings.ts`, `src/shot/resolve.ts`; Test `tests/settings.test.ts`, `tests/resolve.test.ts`

**Interfaces – Produces:**
```ts
// settings.ts (Settings bekommt zusätzliche Felder)
export type ModeId = 'shot' | 'play';
export type PlayChoice = 'pnr' | 'fastbreak' | 'kickout' | 'inbound' | 'random';
export type FoulRate = 'off' | 'rare' | 'normal' | 'often';
export const FOUL_MULT: Record<FoulRate, number>; // 0, 0.5, 1, 2
// neue Felder + Standard + Bereich:
// mode 'shot' | play 'random' | slowmo 0.3 [0.2,0.5] | decisionS 2 [1,4] | animSpeed 1 [0.5,1.5]
// defenseRandom true | fouls 'normal' | finishMeterMs 450 [300,700] | finishGreen 0.1 [0.05,0.2]
// finishAim 8 [4,14] | tempoSpread 0.3 [0,0.5] | zoneFloor 0.7 [0.5,0.9]
// resolve.ts
export interface ShotParams { /* bisherige Felder */ zoneFactor?: number } // Default 1
```
- [ ] **Step 1: Failing tests:** gespeicherte v1-Daten ohne neue Felder → alte Werte bleiben, neue Felder = Standard; Grenzen (`slowmo: 0.9` → 0.5, `fouls: 'x'` → 'normal', `defenseRandom: 'ja'` → true); `effectiveZones({…P, zoneFactor: 0.5})` halbiert g und a; ohne `zoneFactor` identisch zu vorher; `resolveShot` mit `zoneFactor: 0.5` wertet `{holdMs: 1080}` (t = 1,6 statt 0,8) als `rim_back` statt `rim_in`.
- [ ] **Step 2:** `npx vitest run tests/settings.test.ts tests/resolve.test.ts` → FAIL
- [ ] **Step 3:** Implementieren (Feldprüfung im bestehenden `loadSettings`-Stil; `effectiveZones` multipliziert `zoneFactor ?? 1`).
- [ ] **Step 4:** `npx vitest run` → alle grün
- [ ] **Step 5:** Commit `feat: Einstellungen für Spielzug-Labor und gemeinsamer Zonenfaktor`

---

### Task 2: Gesten mit Kurzwisch und Halteschwelle

**Files:** Modify `src/input/gesture.ts`; Test `tests/gesture.test.ts`

**Interfaces – Produces:**
```ts
export type GestureEvent = /* bisherige */ | { type: 'flick'; dx: number; dy: number } | { type: 'hold' };
export interface GestureOptions { flicks: boolean; holdThresholdMs: number } // Wurf-Labor: { flicks: false, holdThresholdMs: 0 }
export class GestureTracker { constructor(opts?: GestureOptions); poll(t: number): GestureEvent | null; /* bisherige Methoden */ }
export function attachGesture(el, onEvent, isLocked, opts?: GestureOptions): () => void;
```
Regeln bei `flicks: true` (Präzisierung 9/10): `up` vor Schwelle mit Weg ≥ 30 px in beliebige Richtung → `flick` (dx, dy in px, dy positiv = nach unten); vor Schwelle mit < 30 px → `tap`; nach Schwelle wie bisher (`release` mit roher `holdMs`, > 30 px nach unten → `cancel`). `poll(t)` liefert genau einmal `hold`, sobald `t − t0 ≥ holdThresholdMs`. `attachGesture` ruft `poll` per `setTimeout(holdThresholdMs)` auf. Ohne `opts` exakt das bisherige Verhalten.
- [ ] **Step 1: Failing tests:** Flick nach links (−80, 0) in 120 ms → `flick` dx −80; Flick nach unten (0, 60) in 100 ms → `flick` (kein `cancel`); 10 px in 100 ms → `tap`; Halten 300 ms und 60 px nach unten → `cancel`; `poll` vor Schwelle `null`, danach einmal `hold`, dann wieder `null`; jsdom: `hold` kommt per Timer (fake timers); alle bisherigen Tests unverändert grün.
- [ ] **Step 2–4:** RED → implementieren → `npx vitest run` grün
- [ ] **Step 5:** Commit `feat: Kurzwisch und Halteschwelle für Spielzug-Gesten`

---

### Task 3: Positionswert und Abschluss-Regeln

**Files:** Create `src/play/position.ts`, `src/play/finish.ts`; Tests `tests/position.test.ts`, `tests/finish.test.ts`

**Interfaces – Produces:**
```ts
// position.ts
export interface Vec2 { x: number; z: number }
export function positionValue(att: Vec2, defenders: Vec2[], rim?: Vec2): number; // Spec „Positionswert P“, Minimum über alle, ohne Verteidiger 1
// finish.ts
export type ShotKind = 'jump2' | 'three' | 'layup' | 'dunk' | 'contact_dunk';
export function finishKind(athleticism: number, P: number, rng: () => number): 'layup' | 'dunk' | 'contact_dunk';
export function foulChance(kind: ShotKind, P: number, foulMult: number): number;
export function zoneFactor(P: number, floor: number, fouled: boolean, contact: boolean): number; // (floor+(1-floor)P)·(0.6?)·(0.75?)
export function meterDuration(baseMs: number, P: number, spread: number, rng: () => number): number; // ≥ 250
export function isThree(pos: Vec2): boolean;
export function shotKindAt(pos: Vec2): 'jump2' | 'three';
export function freeThrowCount(kind: ShotKind, made: boolean, fouled: boolean): number; // and-one 1, Fehlwurf 2 bzw. 3, sonst 0
export function finishBanner(kind: ShotKind, made: boolean, fouled: boolean, assisted: boolean): string;
export function verdict(points: number, deficit: number): 'GAMEWINNER' | 'OVERTIME' | 'VERLOREN';
```
Banner: Treffer jump2/three „TREFFER“ bzw. „DREIER“, layup „KORBLEGER“, dunk „DUNK“, contact_dunk „POSTER!“; daneben „DANEBEN“, „VERLEGT“, „VOM RING“, „GEBLOCKT“; Foul + Treffer: Zusatz „ + AND-ONE“; Foul + Fehlwurf: „FOUL – x FREIWÜRFE“; assisted + Treffer: Präfix „ASSIST + “.
- [ ] **Step 1: Failing tests:** P: Verteidiger 0,5 m direkt zwischen Angreifer und Ring → 0; 0,5 m seitlich → 0,8; 0,5 m dahinter → 1; 2,5 m vorne → 1; zwei Verteidiger → Minimum. `finishKind(0.9, 0.8)` → dunk; `(0.9, 0.3, rng 0.4)` → contact_dunk, `(0.9, 0.3, rng 0.6)` → layup (Chance 0,495); `(0.6, 1)` → layup. `foulChance('layup', 0, 1)` = 0,30, `(…, 1, 1)` = 0,03, `('three', 0, 2)` = 0,10, `('contact_dunk', 1, 0.5)` = 0,20. `zoneFactor(0, 0.7, true, true)` = 0,7·0,6·0,75. `meterDuration(450, 0, 0.3, ()=>0)` = 315, `(…, ()=>1)` → 585 (rng 1 ≙ z = +1), `(450, 1, …)` = 450, `(300, 0, 0.5, ()=>0)` = 250. `isThree({x:0,z:7})` true, `({x:7,z:0.5})` true, `({x:6.5,z:1})` false. `freeThrowCount('three', false, true)` = 3, `('layup', true, true)` = 1. `verdict(3,2)` GAMEWINNER, `(2,2)` OVERTIME, `(0,2)` VERLOREN. Banner-Beispiele: `finishBanner('dunk', true, false, true)` = „ASSIST + DUNK“, `('contact_dunk', true, true, false)` = „POSTER! + AND-ONE“.
- [ ] **Step 2–4:** RED → implementieren → grün
- [ ] **Step 5:** Commit `feat: Positionswert, Abschlussart, Fouls und Punkte`

---

### Task 4: Pass-Logik

**Files:** Create `src/play/pass.ts`; Test `tests/pass.test.ts`

**Interfaces – Consumes:** `Vec2` (Task 3). **Produces:**
```ts
export interface ScreenTarget { id: string; x: number; y: number; distM: number } // Bildschirm-px (auch außerhalb), id = Akteur-ID oder 'rim'
export function pickTarget(origin: { x: number; y: number }, swipe: { dx: number; dy: number }, targets: ScreenTarget[]): string | null;
export function laneFromAngle(deg: number): -1 | 0 | 1; // < −8 → −1, > 8 → 1
export function swipeAngleTo(origin, target, swipe): number; // Grad, negativ = links der Zielrichtung
export function stealChance(from: Vec2, to: Vec2, defenders: Vec2[]): number; // < 0,5 m → 0,6; < 1 m → 0,2; sonst 0
export function passTime(distM: number): number; // 0.25 + 0.06·d
```
- [ ] **Step 1: Failing tests:** Wisch nach rechts wählt Ziel rechts; nichts innerhalb 45° → null; zwei Ziele 10° auseinander → näheres (`distM`) gewinnt; Ziel außerhalb des Bildes (x = −200) per Wisch nach links wählbar; `laneFromAngle(−10)` = −1, `(5)` = 0; Steal-Schwellen an 0,4 / 0,8 / 1,2 m; Verteidiger hinter dem Passgeber (Projektion außerhalb der Strecke) zählt mit Abstand zum Streckenende; `passTime(10)` = 0,85.
- [ ] **Step 2–4:** RED → implementieren → grün
- [ ] **Step 5:** Commit `feat: Pass-Zielwahl und Steal-Chance`

---

### Task 5: Skelett und Bewegungen

**Files:** Create `src/figure/skeleton.ts`, `src/figure/moves.ts`; Tests `tests/skeleton.test.ts`, `tests/moves.test.ts`

**Interfaces – Produces:**
```ts
// skeleton.ts – Körperraum: x rechts, y oben, z vorne; Einheit = Körpergröße (Kopf oben ≈ 1.0, Füße 0)
export type Joint = 'head'|'neck'|'shL'|'shR'|'elL'|'elR'|'haL'|'haR'|'pelvis'|'hipL'|'hipR'|'knL'|'knR'|'ftL'|'ftR';
export const JOINTS: readonly Joint[];
export interface V3 { x: number; y: number; z: number }
export type Pose = Record<Joint, V3>;
export type Dir = 'front' | 'back' | 'left' | 'right';
export function lerpPose(a: Pose, b: Pose, t: number): Pose;
export function framesFromKeys(keys: Pose[], count: number, loop: boolean): Pose[]; // Schlüsselposen gleichmäßig verteilt; Bild 0 = keys[0]
export function project(p: Pose, dir: Dir): Record<Joint, { u: number; v: number; depth: number }>; // u rechts im Bild, v oben
// moves.ts
export type MoveId = 'idle'|'run'|'dribble'|'dribble_run'|'pass'|'catch'|'jumpshot'|'layup'|'dunk'|'contact_dunk'|'defend'|'block_jump'|'contact';
export interface MoveDef { frames: number; fps: number; loop: boolean; keys: Pose[]; ballHand: 'haL' | 'haR' | null; rimFrame?: number }
export const MOVES: Record<MoveId, MoveDef>; // Bildzahlen laut Spec-Tabelle, fps 10 (laufen 12)
export function moveFrames(id: MoveId): Pose[];
export function ballHandAt(id: MoveId, frame: number): V3 | null;
```
Richtungen: `front` = Figur schaut zur Kamera (Bild-u = −x), `back` = von hinten (u = x), `left`/`right` = Profil (u = ∓z). `rimFrame` bei dunk/contact_dunk/layup = Bild des Ring- bzw. Loslass-Kontakts. Posen anatomisch plausibel (Gelenkabstände je Bewegung konstant ±5 %).
- [ ] **Step 1: Failing tests:** `framesFromKeys` trifft Schlüsselposen exakt an ihren Bildern; Bildzahlen je Bewegung laut Spec; `project(p,'back').u` = x, `'front'` = −x; in jedem Bild jeder Bewegung: Oberarm-, Unterarm-, Ober- und Unterschenkellänge innerhalb ±5 % der Ruhepose (`idle` Bild 0); Kopf immer höchster Punkt außer bei Armen über Kopf (dunk/jumpshot/block_jump: Hände dürfen höher sein); `ballHandAt` = Gelenkposition der Ballhand des Bilds; dunk hat `rimFrame`, und dort liegt die Ballhand über y = 1,2 (über Kopfhöhe).
- [ ] **Step 2–4:** RED → implementieren → grün
- [ ] **Step 5:** Commit `feat: Skelett-Posen und Bewegungen`

---

### Task 6: Spielzug-Datenformat und 4 Spielzüge

**Files:** Create `src/play/types.ts`, `src/play/teams.ts`, `src/play/plays/pnr.ts`, `fastbreak.ts`, `kickout.ts`, `inbound.ts`, `src/play/plays/index.ts`; Test `tests/plays.test.ts`

**Interfaces – Consumes:** `Vec2`, `MoveId`. **Produces:**
```ts
// types.ts
export type PlayId = 'pnr' | 'fastbreak' | 'kickout' | 'inbound';
export interface ActorDef { id: string; team: 'off' | 'def'; num: number; heightM: number; build: 'slim'|'normal'|'broad';
  skin: string; hair: 'short'|'bald'|'afro'; jersey: string; shorts: string; shot: number; athleticism: number }
export type Activity = 'stand' | 'run' | 'dribble' | 'screen' | 'defend' | 'inbound';
export interface Waypoint { t: number; x: number; z: number; act: Activity }  // t in Spielsekunden ab Segmentbeginn
export interface Option { kind: 'shoot' | 'drive' | 'pass'; to?: string; lob?: boolean; next?: string }
export interface Segment { id: string; handler: string; paths: Record<string, Waypoint[]>; decisionAt?: number; options?: Option[] }
export interface Variant { id: string; weight: number; defPaths: Record<string, Record<string, Waypoint[]>> } // Segment-ID → Verteidiger-ID → Weg
export interface Play { id: PlayId; name: string; clockS: number; deficit: number | [number, number]; actors: string[];
  start: string; segments: Record<string, Segment>; variants: Variant[]; inboundBy?: string }
// teams.ts
export const RED: ActorDef[]; export const BLUE: ActorDef[]; export const ACTORS: Record<string, ActorDef>; // IDs 'r3','r11','r23','r32','r50','b1','b7','b15','b21','b44'
// plays/index.ts
export const PLAYS: Record<PlayId, Play>;
```
Inhalt laut Spec-Tabelle „Spielzüge“ und Präzisierungen 7/8: jede Pass-Option hat ein `next`-Segment des Empfängers mit eigenem Entscheidungspunkt (mindestens Werfen + Ziehen; Kick-out-Empfänger zusätzlich Closeout-Variante); Lob-Option `lob: true`. Verteidigerwege kommen aus den Varianten, so dass die in der Spec genannte Option je Variante wirklich frei ist (P ≥ 0,7 laut `positionValue` am Entscheidungs- bzw. Fangpunkt, die anderen ≤ 0,5).
- [ ] **Step 1: Failing tests:** für jeden Spielzug: alle Akteur-IDs existieren in `ACTORS`; Wegpunkte zeitlich streng aufsteigend; Positionen im Feld (Inbound-Einwerfer bis 1,5 m außerhalb); jedes `next` existiert; Variantengewichte > 0; Fast Break nutzt genau 3 + 2 Akteure; **je Variante** hat die laut Spec freie Option P ≥ 0,7 und mindestens eine andere Option P ≤ 0,5 (P am Entscheidungszeitpunkt für Werfen, am Fangpunkt für Pass); Laufgeschwindigkeit zwischen Wegpunkten ≤ 8 m/s.
- [ ] **Step 2–4:** RED → Daten schreiben → grün
- [ ] **Step 5:** Commit `feat: Spielzug-Daten und Platzhalter-Teams`

---

### Task 7: Abschlussbahnen (Korbleger/Dunk)

**Files:** Create `src/shot/finish-path.ts`; Test `tests/finish-path.test.ts`

**Interfaces – Consumes:** `Outcome`, `Flight`, `Vec3`, `RIM`. **Produces:**
```ts
export function buildFinishFlight(kind: 'layup' | 'dunk' | 'contact_dunk', outcome: Outcome, release: Vec3, rimContactS: number): Flight;
```
Korbleger: Bogen 0,4–0,5 s vom `release` zum Ring/Brett-Zielpunkt (Zielpunkte wie `targetPoint`), danach wie `buildFlight` (Fallen, Abpraller, Aufspringen). Dunk: Ball folgt bis `rimContactS` linear von `release` zur Ringmitte + 0,1 m Höhe; Treffer → durchs Netz zu Boden; Fehlversuch → Abpraller nach außen.
- [ ] **Step 1: Failing tests:** `at(0)` = release; Korbleger-Bogen endet nach 0,4–0,5 s am Zielpunkt; Dunk bei `rimContactS` an Ringmitte (±0,1); Treffer endet unter dem Ring auf y 0,12; Fehlversuch endet > 0,3 m von der Ringmitte; `at(t>duration)` = Endpunkt.
- [ ] **Step 2–4:** RED → implementieren → grün
- [ ] **Step 5:** Commit `feat: Ballbahnen für Korbleger und Dunk`

---

### Task 8: Spielzug-Engine

**Files:** Create `src/play/engine.ts`; Test `tests/engine.test.ts`

**Interfaces – Consumes:** Tasks 1, 3, 4, 6, 7, `resolveShot`, `buildFlight`. **Produces:**
```ts
export type Phase = 'intro' | 'running' | 'decision' | 'passing' | 'driving' | 'takeoff' | 'combo' | 'ballflight' | 'freethrows' | 'ended';
export interface EngineConfig { slowmo: number; decisionS: number; animSpeed: number; foulMult: number; zoneFloor: number; tempoSpread: number;
  shot: { meterMs: number; greenZone: number; aimDeg: number; influence: number };
  finish: { meterMs: number; greenZone: number; aimDeg: number } }
export interface ActorState { id: string; pos: Vec2; facing: number /* rad, 0 = Richtung −z (zum Korb) */; move: MoveId; moveT: number /* Spielsek. seit Start */ }
export interface PlayState { play: Play; variant: string; deficit: number; phase: Phase; gameT: number; clock: number; handler: string;
  actors: Record<string, ActorState>; ball: Vec3; points: number; assisted: boolean; turnovers: number;
  combo: null | { kind: ShotKind; P: number; meterMs: number; zones: Zones; fouled: boolean };
  freeThrows: null | { shooter: string; left: number }; banner: string | null; verdict: string | null; fingerDown: boolean }
export type Command = { kind: 'pass'; to: string } | { kind: 'drive'; lane: -1 | 0 | 1 } | { kind: 'comboStart' }
  | { kind: 'comboRelease'; holdMs: number; angleDeg: number } | { kind: 'finger'; down: boolean };
export type EngineEvent = { type: 'decision'; options: Option[] } | { type: 'pass'; from: string; to: string; steal: boolean }
  | { type: 'caught'; by: string } | { type: 'takeoff'; kind: 'layup'|'dunk'|'contact_dunk' } | { type: 'combo'; fouled: boolean; contact: boolean }
  | { type: 'result'; banner: string; made: boolean } | { type: 'freethrow'; left: number } | { type: 'end'; verdict: string };
export function createPlayState(play: Play, cfg: EngineConfig, rng: () => number): PlayState;
export function step(s: PlayState, dtReal: number, cfg: EngineConfig, rng: () => number): EngineEvent[];
export function command(s: PlayState, cmd: Command, cfg: EngineConfig, rng: () => number): EngineEvent[];
export function aiChoice(s: PlayState): Option; // Präzisierung 6
```
Verhalten laut Spec-Abschnitte „Ablauf“, „Abschlüsse“, „Pass“, „Spielzüge“ und Präzisierungen 1–8, 13. Zeit: `step` rechnet Spielzeit = `dtReal × animSpeed × (phase ∈ {decision, combo, takeoff} ? slowmo : 1)`; Fristen in Echtzeit. `comboRelease.holdMs` ist bereits um die Schwelle bereinigt (Präzisierung 10). Wurfquelle: Sprungwurf `resolveShot` mit `zoneFactor` und `meterMs` aus `combo`; Abschluss mit `finish`-Werten, `rating = athleticism`, `distance = 4.6`.
- [ ] **Step 1: Failing tests (feste rng):** für **jeden Spielzug × jede Variante × jede Option** (inkl. Folge-Entscheidungen, bei Wurf/Abschluss mit perfekter und mit verfehlter Kombi) erreicht die Simulation mit `step(1/60)` innerhalb von 30 Spielsekunden `ended`; Pass mit Steal → `STEAL`, `turnovers` 1; Pass ohne Steal → `caught`, `handler` = Empfänger, Assist-Flag; Uhr läuft in `decision` mit `slowmo`-Tempo; Frist abgelaufen ohne Finger → `aiChoice` (kleinstes P, Gleichstand Werfen > Ziehen > Pass); Frist mit `finger down` angehalten (Review Focus 1); nach KI-Werfen ohne Kombi → „ZU LANGE GEZÖGERT“; Uhr läuft während `ballflight` ab → Treffer zählt (Review Focus 2); gefoulter Fehlwurf-Dreier → `freethrows` mit 3 Versuchen, Uhr steht, `verdict` erst nach dem letzten; And-one → 1 Freiwurf; Inbound: Uhr startet erst beim Fangen; Lob → direkt `takeoff` ohne `driving`; Kontakt-Dunk bei P < 0,6 und Athletik 0,9 mit rng < 0,495; `deficit` als Bereich wird ausgewürfelt und ist positiv.
- [ ] **Step 2–4:** RED → implementieren → grün
- [ ] **Step 5:** Commit `feat: Spielzug-Engine`

---

### Task 9: Rastern, Atlas, Figuren-Rendering (ich)

**Files:** Create `src/figure/raster.ts`, `src/figure/atlas.ts`, `src/render/actors.ts`; Test `tests/raster.test.ts` (jsdom-Canvas-Ersatz nicht vorhanden → Pixelproben über eigenes Uint8-Raster statt Canvas)

**Interfaces – Produces:**
```ts
export interface Look { heightM: number; build: ActorDef['build']; skin: string; hair: ActorDef['hair']; jersey: string; shorts: string; num: number }
export function rasterPose(p2d: ReturnType<typeof project>, look: Look, dir: Dir, w = 32, h = 48): Uint8ClampedArray; // RGBA
export function buildAtlas(looks: Record<string, Look>): { texture: THREE.CanvasTexture; uv(id: string, move: MoveId, dir: Dir, frame: number): [number, number, number, number] };
export function createActors(scene: THREE.Scene, atlas): { sync(s: PlayState, cameraYaw: number): void };
```
- [ ] **Step 1: Failing tests:** `rasterPose` der `idle`-Pose: Kopfpixel in den obersten 20 % gesetzt, Fußpixel in den untersten 10 %, Rückennummer nur bei `back`, Umriss-Pixel um jede gefüllte Fläche, größere Figur (2,13 m) hat mehr gefüllte Zeilen als 1,88 m.
- [ ] **Step 2–4:** RED → implementieren → grün; Sichtprüfung: Atlas als PNG exportieren und ansehen.
- [ ] **Step 5:** Commit `feat: Pixel-Rasterung, Atlas und Figuren-Rendering`

### Task 10: Modus-Aufteilung (ich)

**Files:** Create `src/modes/shot-lab.ts`; Modify `src/main.ts`, `src/ui/lab-menu.ts`
- [ ] **Step 1:** Wurf-Labor-Logik aus `main.ts` nach `modes/shot-lab.ts` verschieben (`startShotLab(app): { stop(): void }`); `main.ts` startet je nach `settings.mode`; Menü bekommt „Modus“ und die Spielzug-Felder (nur im Modus `play` sichtbar).
- [ ] **Step 2:** `npx vitest run` grün, Browser-Smoke-Test des Wurf-Labors (Skript aus v0.1.0) unverändert erfolgreich.
- [ ] **Step 3:** Commit `refactor: Wurf-Labor als eigener Modus, Modus-Auswahl im Menü`

### Task 11: Spielzug-HUD und Kamera-Phasen (ich)

**Files:** Create `src/ui/play-hud.ts`; Modify `src/render/camera-pose.ts`; Test `tests/camera-pose.test.ts`
- [ ] **Step 1: Failing tests:** neue Funktion `playCameraPose(phase: Phase, handler: Vec2, ftSpot: boolean, blend: number): Pose & { fov: number }` – in `decision` erhöht mit fov 60, in `combo`/`takeoff` tief (bestehende `cameraPose('low')`-Werte), immer auf der Achse Korb → Ballführer (pos.x/pos.z = handler.x/handler.z bei Abstand > 0).
- [ ] **Step 2–4:** RED → implementieren → grün; HUD: Lage-Einblendung, Optionsmarker (Wurf-Symbol, Korb-Pfeil, Leuchtring), Randpfeile für Ziele außerhalb, Positionsring, „KONTAKT!“/„POSTER?“, Banner, Spielzug-Statistik.
- [ ] **Step 5:** Commit `feat: Spielzug-HUD und Kamera-Phasen`

### Task 12: Spielzug-Labor verdrahten + Browser-Prüfung (ich)

**Files:** Create `src/modes/play-lab.ts`; Modify `src/main.ts`
- [ ] **Step 1:** Verdrahten: Gesten (`flicks: true, holdThresholdMs: 200`) → `pickTarget` mit projizierten Bildschirmpositionen → `command`; `hold` → `comboStart`; `release` → `comboRelease` mit `holdMs − 200`; Menü offen → `step` mit dt 0; Spielzug-Wechsel → neuer `createPlayState`; nach `end` 2 s Banner, dann nächster Spielzug.
- [ ] **Step 2:** Headless-Browser (390 × 844, Touch): jeden Spielzug durchspielen (Pass, Ziehen, Wurf), Screenshots von Pass, Korbleger, Dunk, Kontakt-Dunk, Freiwurf, Randpfeil; Menü mitten im Spielzug öffnen/schließen (Review Focus 3); keine Konsolenfehler.
- [ ] **Step 3:** `npm test`, `npm run build` grün
- [ ] **Step 4:** Commit `feat: spielbares Spielzug-Labor`

### Task 13: Abschluss-Review und Veröffentlichung (nach OK)

- [ ] **Step 1:** Codex-Review des ganzen Branches (read-only) mit Spec, Plan, Review Focus; Critical/Important beheben (RED → GREEN).
- [ ] **Step 2:** Nutzer fragen, ob gemergt und deployt werden darf; dann `main` fast-forward, Push, Actions grün, Live-Smoke-Test, Tag `v0.2.0`.
