# Wurf-Labor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Spielbare Testseite (PWA, Hochformat), auf der man im Pixel-Look per Halten+Wischen von 7 Spots wirft und alle Wurf-Parameter im Labor-Menü einstellt.

**Architecture:** Die reine Logik (`settings`, `shot/resolve`, `shot/trajectory`, `input/gesture`, Kamera-Pose) hat keine Abhängigkeit von three.js oder DOM und ist komplett mit vitest getestet. three.js-Rendering (Halle, Pixel-Renderer, Sprite) und DOM-UI (HUD, Menü) werden in `main.ts` zu einer Zustandsmaschine `ready → charging → flying → ready` verdrahtet.

**Tech Stack:** Vite 6, TypeScript 5 (strict), three (npm, aktuelle 0.x), vite-plugin-pwa, @vite-pwa/assets-generator, vitest + jsdom. Kein React.

**Spec:** `docs/superpowers/specs/2026-11-10-wurf-labor-design.md`

**Ausführung:** Logik-Tasks (1–4) setzt Codex um (`codex exec`, Sandbox `unelevated`, kein git), ich prüfe den Code, lasse die Tests laufen und committe. Render und UI (5–6) mache ich selbst. Task 7 erst nach OK des Nutzers.

## Global Constraints

- Weltkoordinaten in Metern; Ring-Mitte `(0, 3.05, 0)`, Ringradius 0,23, Ballradius 0,12, Brett-Vorderseite bei z = −0,375; Spieler stehen bei z > 0.
- Winkel: negativ = links, positiv = rechts (aus Sicht des Werfers / Bildschirms).
- Alle UI-Texte deutsch mit Umlauten; Rückmeldung nie mit Zahlen (keine ms, keine Grad).
- `localStorage`-Zugriffe immer in try/catch; ohne Speicher gelten die Standardwerte.
- Vite `base: process.env.BASE_PATH ?? "/"` (Deploy setzt `/pixel-splash/`), wie 82-0.
- Manifest: `name`/`short_name` „Pixel Splash“, `lang: "de"`, `orientation: "portrait"`, `display: "standalone"`.
- Keine Netzwerk-Zugriffe zur Laufzeit außer dem eigenen Bundle.

## Review Focus

1. Zweiter Finger setzt während des Haltens auf → wird ignoriert, der laufende Wurf bleibt gültig (Test in Task 4).
2. Das System bricht die Geste ab (`pointercancel`, z. B. iOS-Wischgeste, Anruf) → Wurf abgebrochen, die Anzeige hängt nicht (Test in Task 4).
3. Finger sehr lange gehalten (Füllstand > 1,6) → Füllstand bleibt 1,6, Ergebnis ist Brett oder Ring hinten, kein Absturz (Test in Task 2).
4. Kaputte oder veraltete Werte im Speicher (falscher Typ, außerhalb des Bereichs, kein JSON) → pro Feld Standardwert bzw. auf den Bereich begrenzt (Test in Task 1).
5. Wischen scrollt oder zoomt die Seite in iOS Safari → `touch-action: none`, kein Overscroll, kein Doppeltipp-Zoom (manuelle Prüfung in Task 6).

---

### Task 1: Projektgerüst + Einstellungen

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts` (Platzhalter), `src/settings.ts`, `tests/settings.test.ts`

**Interfaces:**
- Produces (`src/settings.ts`):
  ```ts
  export type SpotId = 'corner_l'|'wing_l'|'top'|'wing_r'|'corner_r'|'ft'|'mid';
  export type CameraMode = 'low'|'high'|'auto';
  export type ProfileId = 'elite'|'avg'|'center';
  export type InfluenceId = 'off'|'light'|'fair'|'strong';
  export interface Spot { id: SpotId; label: string; x: number; z: number }
  export interface Profile { id: ProfileId; label: string; rating: number }
  export interface Settings { spot: SpotId; camera: CameraMode; profile: ProfileId; influence: InfluenceId;
    meterMs: number; greenZone: number; aimDeg: number; pixelHeight: 220|320|420|540 }
  export const SPOTS: readonly Spot[];        // Reihenfolge und Koordinaten laut Spec „Wurfspots“
  export const PROFILES: readonly Profile[];  // elite 0.9 „Elite-Schütze“, avg 0.5 „Durchschnitt“, center 0.1 „Center“
  export const INFLUENCE: Record<InfluenceId, number>; // off 0, light 0.3, fair 0.6, strong 1.0
  export const DEFAULTS: Settings; // top, auto, avg, fair, 700, 0.07, 6, 320
  export const STORAGE_KEY = 'pixel-splash.settings.v1';
  export function loadSettings(storage?: Storage | null): Settings;
  export function saveSettings(s: Settings, storage?: Storage | null): void;
  export function spotDistance(spot: Spot): number; // √(x²+z²)
  ```
  Spot-Labels: „Ecke links“, „Flügel links“, „Top“, „Flügel rechts“, „Ecke rechts“, „Freiwurf“, „Mitteldistanz“.

- [ ] **Step 1: Gerüst anlegen.** `package.json` (Name `pixel-splash`, Version `0.1.0`, `type: module`, Skripte `dev`, `build` = `tsc -b && vite build`, `test` = `vitest run`), Abhängigkeiten `three`, Dev: `typescript`, `vite`, `vitest`, `jsdom`, `@types/three`, `@types/node`, `vite-plugin-pwa`, `@vite-pwa/assets-generator`. `tsconfig.json` wie 82-0 ohne `jsx` und ohne testing-library-Typen. `vite.config.ts` wie 82-0 ohne React, ohne Versions-define, Manifest laut Global Constraints, `test.environment: 'jsdom'`, `include: ['tests/**/*.test.ts']`. `npm install`.

- [ ] **Step 2: Failing tests schreiben** in `tests/settings.test.ts`:
  - `loadSettings(null)` und ein leerer Speicher → `toEqual(DEFAULTS)`
  - Speicher mit `'kein json'` → `DEFAULTS`
  - gespeichert `{ meterMs: 5000, greenZone: 0.01, aimDeg: 'x', spot: 'nirgends', pixelHeight: 333, camera: 'high' }` → `meterMs 1200`, `greenZone 0.03`, `aimDeg 6`, `spot 'top'`, `pixelHeight 320`, `camera 'high'`
  - `saveSettings` dann `loadSettings` → Rundweg identisch
  - Speicher, dessen `getItem`/`setItem` werfen → `loadSettings` liefert `DEFAULTS`, `saveSettings` wirft nicht
  - `spotDistance` für `top` ≈ 6,9, für `ft` ≈ 4,2 (`toBeCloseTo(…, 2)`)

- [ ] **Step 3: Tests laufen lassen.** `npx vitest run tests/settings.test.ts` → FAIL (Modul fehlt)

- [ ] **Step 4: `src/settings.ts` implementieren.** Feldweise Prüfung: Zahlen außerhalb des Bereichs auf 400–1200 / 0,03–0,15 / 2–12 begrenzen, falscher Typ oder unbekannte ID → Standardwert. `storage`-Default = `globalThis.localStorage`, Zugriff selbst in try/catch.

- [ ] **Step 5: Tests grün.** `npx vitest run` → PASS; `npx tsc -b` ohne Fehler

- [ ] **Step 6: Commit** `feat: Projektgerüst und Labor-Einstellungen`

---

### Task 2: Wurf-Auswertung (`resolve`)

**Files:**
- Create: `src/shot/resolve.ts`, `tests/resolve.test.ts`

**Interfaces:**
- Consumes: nichts (Werte werden übergeben)
- Produces:
  ```ts
  export type Outcome = 'swish'|'rim_in'|'roll_in'|'roll_out'|'rim_front'|'rim_back'|'rim_left'|'rim_right'|'airball'|'board'|'wide_left'|'wide_right';
  export interface ShotInput { holdMs: number; angleDeg: number }
  export interface ShotParams { meterMs: number; greenZone: number; aimDeg: number; rating: number; influence: number; distance: number }
  export interface Zones { g: number; a: number }          // effektive Halbbreiten (Füllstand-Anteil, Grad)
  export interface ShotResult { outcome: Outcome; made: boolean; fill: number; t: number; r: number; F: number; banner: string; hint: string }
  export const MAX_FILL = 1.6;
  export function statFactor(rating: number, influence: number): number;   // 1 + influence*(rating-0.5)*1.6
  export function distanceFactor(distance: number): number;                // 1 - 0.04*(distance-4.6), begrenzt [0.8, 1]
  export function effectiveZones(p: ShotParams): Zones;
  export function feedback(t: number, r: number): string;
  export function resolveShot(input: ShotInput, p: ShotParams, rng?: () => number): ShotResult;
  ```
  Banner: swish „SWISH“, rim_in „TREFFER“, roll_in „RINGTANZ – DRIN“, roll_out „RINGTANZ – RAUS“, rim_front „RING VORNE“, rim_back „RING HINTEN“, rim_left „RING LINKS“, rim_right „RING RECHTS“, airball „AIRBALL“, board „BRETT“, wide_left „LINKS VORBEI“, wide_right „RECHTS VORBEI“.
  Hint: Timing-Teil immer („perfekt“ | „etwas zu früh“/„etwas zu spät“ | „viel zu früh“/„viel zu spät“), Richtungs-Teil nur wenn |r| > 1 („leicht links/rechts“ | „weit links/rechts“), verbunden mit „ · “.

- [ ] **Step 1: Failing tests schreiben** (`tests/resolve.test.ts`, Basis-Params `P = { meterMs: 1000, greenZone: 0.1, aimDeg: 10, rating: 0.5, influence: 0.6, distance: 4.6 }` → g = 0,1, a = 10):
  - `statFactor(0.9,0.6)` ≈ 1,384, `statFactor(0.1,1)` ≈ 0,36, `statFactor(x,0)` = 1
  - `distanceFactor(4.2)` = 1, `distanceFactor(6.75)` ≈ 0,914, `distanceFactor(20)` = 0,8
  - `{holdMs:1000, angleDeg:0}` → `swish`, made, hint „perfekt“
  - `{holdMs:1080, angleDeg:0}` (t = 0,8) → `rim_in`
  - `{holdMs:1120, angleDeg:0}` (t = 1,2): rng `()=>0.2` → `roll_in` made; rng `()=>0.8` → `roll_out` nicht made
  - `{holdMs:850, angleDeg:0}` (t = −1,5) → `rim_front`, hint „etwas zu früh“
  - `{holdMs:1150, angleDeg:5}` (t = 1,5, r = 0,5) → `rim_back`
  - `{holdMs:1000, angleDeg:-17}` (r = −1,7) → `rim_left`, hint „perfekt · leicht links“
  - `{holdMs:1000, angleDeg:17}` → `rim_right`
  - `{holdMs:600, angleDeg:0}` (t = −4) → `airball`, hint „viel zu früh“
  - `{holdMs:1300, angleDeg:0}` → `board`, hint „viel zu spät“
  - `{holdMs:1000, angleDeg:-30}` → `wide_left`, hint „perfekt · weit links“; `+30` → `wide_right`
  - Review Focus 3: `{holdMs:99999, angleDeg:0}` → `fill` = 1,6, outcome `board`
  - Einfluss: mit `influence:0` liefern rating 0,1 und 0,9 dasselbe Ergebnis für `{holdMs:1150, angleDeg:0}`; mit `influence:1` wird derselbe Wurf für rating 0,9 `rim_in`/`roll_*`, für 0,1 `board`
  - Gleichstand |t| = |r| im Ring-raus-Band → Timing-Komponente entscheidet

- [ ] **Step 2: Tests laufen lassen** → FAIL

- [ ] **Step 3: `src/shot/resolve.ts` implementieren** laut Spec „Ergebnis“: `fill = min(holdMs/meterMs, 1.6)`, `t = (fill-1)/g`, `r = angleDeg/a`, `F = hypot(t,r)`, Grenzen jeweils inklusiv. Ring-raus und klar daneben: `|t| >= |r|` → Timing-Fall, sonst Richtungs-Fall. Ringtanz: `rng() < 0.5` → `roll_in`. Default-`rng` = `Math.random`.

- [ ] **Step 4: Tests grün** → `npx vitest run tests/resolve.test.ts` PASS

- [ ] **Step 5: Commit** `feat: Wurf-Auswertung mit Stat- und Distanzfaktor`

---

### Task 3: Flugbahn (`trajectory`) + Kamera-Pose

**Files:**
- Create: `src/shot/trajectory.ts`, `src/render/camera-pose.ts`, `tests/trajectory.test.ts`, `tests/camera-pose.test.ts`

**Interfaces:**
- Consumes: `Outcome` aus Task 2
- Produces:
  ```ts
  // trajectory.ts
  export interface Vec3 { x: number; y: number; z: number }
  export const RIM: Vec3;            // {0, 3.05, 0}
  export interface Flight { duration: number; arcEnd: number; at(time: number): Vec3 }
  export function targetPoint(outcome: Outcome, from: Vec3): Vec3;
  export function buildFlight(outcome: Outcome, from: Vec3): Flight;
  // camera-pose.ts
  export interface Pose { pos: Vec3; look: Vec3 }
  export function cameraPose(mode: 'low'|'high'|'auto', shooter: Vec3, flightProgress: number | null): Pose;
  ```
  Richtungen: `u` = waagerechter Einheitsvektor Ring → Werfer; vorne = RIM + u·0,23; hinten = RIM − u·0,23; links aus Werfersicht `L = (−u.z, u.x)` → RIM + L·0,23, rechts RIM − L·0,23; Netzmitte = RIM; Brett = (0, 3,45, −0,35); Airball = RIM + u·0,9 auf y 2,4; vorbei links/rechts = RIM ± L·0,7.
  Kamera: `low` → pos = shooter + u·3,6, y 2,5, look RIM − (0, 0,75, 0); `high` → pos = shooter + u·6,5, y 7, look (Ringposition + u·1,5, y 1,2); `auto` = `low`, wenn `flightProgress` null ist, sonst Interpolation Richtung (pos.y + 1,5, look = RIM) mit `flightProgress` 0..1.

- [ ] **Step 1: Failing tests** `tests/trajectory.test.ts` (Werfer `from = {x:0, y:2.45, z:6.9}` und Ecke `{x:-6.6, y:2.45, z:0.5}`):
  - `at(0)` = `from`; `at(arcEnd)` ≈ `targetPoint(outcome, from)` (Toleranz 0,01) für alle 12 Outcomes
  - Maximum von `at(t).y` über `[0, arcEnd]` (100 Stichproben) > 3,05 für alle Outcomes außer `airball`
  - `targetPoint('rim_left', {x:0,y:2.45,z:6.9}).x` < 0, `rim_right` > 0, `rim_front.z` > 0, `rim_back.z` < 0
  - Für `swish`/`rim_in`/`roll_in`: `at(duration)` hat y ≈ 0,12, waagerechte Entfernung zur Ringmitte < 0,3
  - Für Fehlwürfe: `at(duration).y` ≈ 0,12, waagerechte Entfernung zur Ringmitte > 0,3
  - `arcEnd` zwischen 0,9 und 1,2 s; `at(t)` für t > duration = `at(duration)`
- [ ] **Step 2: Failing tests** `tests/camera-pose.test.ts`: `low` für Top-Spot: pos.z > shooter.z, pos.x ≈ 0; für Ecke links: pos.x < shooter.x; `auto` mit `null` = `low`; `auto` mit 1 hat pos.y größer als bei `low`.
- [ ] **Step 3: Tests laufen lassen** → FAIL
- [ ] **Step 4: Implementieren.** Bogen: Parabel von `from` zum Ziel in `arcEnd = clamp(0.9 + 0.05·dist, 0.9, 1.2)`, Scheitelhöhe = `max(from.y, 3.05) + 1.0 + 0.15·dist`. Danach: Treffer → senkrecht durchs Netz zu Boden (0,45 s); Ring/Brett → Abpraller vom Ring weg (Ring) bzw. zum Werfer (Brett), 0,5 s, dann Fall zu Boden; Airball/vorbei → weiter mit der waagerechten Geschwindigkeit fallen bis y 0,12. `duration` = Ende der letzten Phase.
- [ ] **Step 5: Tests grün** → PASS
- [ ] **Step 6: Commit** `feat: Flugbahnen und Kamera-Posen`

---

### Task 4: Gestenerkennung

**Files:**
- Create: `src/input/gesture.ts`, `tests/gesture.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type GestureEvent =
    | { type: 'start' }
    | { type: 'release'; holdMs: number; angleDeg: number }
    | { type: 'cancel' }
    | { type: 'tap' };
  export const MIN_SWIPE_PX = 30;
  export class GestureTracker {
    get active(): boolean;
    down(id: number, x: number, y: number, t: number): GestureEvent | null; // 'start' oder null, wenn schon aktiv
    up(id: number, x: number, y: number, t: number): GestureEvent | null;   // null bei fremder id
    abort(id: number): GestureEvent | null;                                  // 'cancel' bei eigener id
  }
  export function attachGesture(el: HTMLElement, onEvent: (e: GestureEvent) => void, isLocked: () => boolean): () => void;
  ```
- [ ] **Step 1: Failing tests** (`GestureTracker`):
  - down(1, 100, 500, 0) → `start`; up(1, 100, 400, 700) → `release`, holdMs 700, angleDeg 0
  - up(1, 150, 450, 500) nach down bei (100,500) → angleDeg 45; (50,450) → −45
  - up 40 px nach unten → `cancel`; up 10 px nach oben → `tap`; 100 px seitlich, 10 px nach oben → `tap`
  - Review Focus 1: down(1…), down(2…) → null; up(2…) → null; up(1…) → `release`
  - Review Focus 2: down(1…), abort(1) → `cancel`, danach `active` false; abort(2) ohne Geste → null
  - `attachGesture` (jsdom): `pointerdown` im oberen 40 % des Elements → kein `start`; im unteren Bereich → `start`; bei `isLocked() === true` → nichts; Rückgabefunktion entfernt die Listener
- [ ] **Step 2: Tests laufen lassen** → FAIL
- [ ] **Step 3: Implementieren.** `angleDeg = atan2(dx, dyUp)` in Grad mit `dyUp = y0 − y`; `release` nur bei `dyUp ≥ 30`, `cancel` bei `dyUp ≤ −30`, sonst `tap`. `attachGesture`: `pointerdown`/`pointerup`/`pointercancel`, `setPointerCapture` in try/catch, `performance.now()` als Zeit, Koordinaten relativ zu `getBoundingClientRect`.
- [ ] **Step 4: Tests grün** → PASS
- [ ] **Step 5: Commit** `feat: Gestenerkennung für die Wurf-Kombi`

---

### Task 5: Halle, Pixel-Renderer, Spieler

**Files:**
- Create: `src/render/scene.ts`, `src/render/pixel.ts`, `src/render/player.ts`

**Interfaces:**
- Consumes: `Vec3`, `RIM` (Task 3)
- Produces:
  ```ts
  export function createScene(): { scene: THREE.Scene; ball: THREE.Mesh };            // scene.ts
  export function createPixelRenderer(host: HTMLElement): {
    renderer: THREE.WebGLRenderer; resize(pixelHeight: number, camera: THREE.PerspectiveCamera): void }; // pixel.ts
  export function createPlayer(scene: THREE.Scene): {
    setSpot(x: number, z: number): void; setPose(p: 'ready'|'shoot'): void; handPos(): Vec3 }; // player.ts
  ```
- [ ] **Step 1: Szene** aus der Look-Test-Vorschau übernehmen (Feld-Textur, Korb, Publikum, Licht der Variante „Pixel“; HD-2D- und Low-Poly-Teile weglassen).
- [ ] **Step 2: Pixel-Renderer:** `setPixelRatio(pixelHeight / host.clientHeight)`, Canvas `image-rendering: pixelated`, `antialias: false`.
- [ ] **Step 3: Spieler:** Sprite aus `drawFigure` der Vorschau (zwei Posen), steht am Spot, Hand in Pose `shoot` bei y 2,45.
- [ ] **Step 4: Prüfen:** `npx tsc -b` fehlerfrei; Platzhalter-`main.ts` rendert Szene + Spieler am Top-Spot, Sichtprüfung im Browser.
- [ ] **Step 5: Commit** `feat: Halle im Pixel-Look und Platzhalter-Spieler`

---

### Task 6: HUD, Labor-Menü, Verdrahtung, PWA

**Files:**
- Create: `src/ui/hud.ts`, `src/ui/lab-menu.ts`, `src/style.css`, `public/icon.svg`, `pwa-assets.config.ts`
- Modify: `src/main.ts`, `index.html`

**Interfaces:**
- Consumes: alles aus Tasks 1–5
- Produces:
  ```ts
  export function createHud(root: HTMLElement): {
    setMeter(fill: number | null, zones: Zones, fillMax: number): void;  // null = ausgeblendet
    markRelease(fill: number): void; showResult(r: ShotResult): void; setStats(made: number, shots: number): void };
  export function createLabMenu(root: HTMLElement, s: Settings, onChange: (s: Settings) => void): void;
  ```
- [ ] **Step 1: HUD:** senkrechte Anzeige rechts neben dem Spieler, die grüne Zone zeigt `effectiveZones` (Anteil an `MAX_FILL`), die Loslass-Markierung bleibt 1,5 s stehen. Banner in Pixel-Schrift (npm `@fontsource/press-start-2p`, offline im Bundle), Hinweis darunter. Statistik oben „Treffer x / y · z %“.
- [ ] **Step 2: Labor-Menü:** Zahnrad oben rechts öffnet `<dialog>` mit Auswahlen und Schiebereglern laut Spec-Tabelle; jede Änderung → `saveSettings` + `onChange`.
- [ ] **Step 3: `main.ts`:** Zustände `ready → charging → flying → ready`; `start` → Pose `shoot`, Anzeige läuft; `release` → `resolveShot` mit `effectiveZones`-Parametern aus Einstellungen/Profil/`spotDistance` → `buildFlight(handPos)` → Kamera `cameraPose` je Frame → nach `duration + 0.4 s` zurück auf `ready`. `cancel`/`tap` → zurück auf `ready`. Spot-Wechsel setzt den Spieler um. Fenster-Resize und Drehung rufen `resize`.
- [ ] **Step 4: Review Focus 5:** `html, body { overscroll-behavior: none; touch-action: none }`, Viewport-Meta mit `user-scalable=no`, Canvas `touch-action: none`.
- [ ] **Step 5: PWA:** `public/icon.svg` (Pixel-Ball), `npx pwa-assets-generator`, Manifest-Icons wie 82-0.
- [ ] **Step 6: Prüfen:** `npm test` grün, `npm run build` fehlerfrei; im Browser bei 390×844: von allen 7 Spots werfen, alle drei Kameramodi, Menüwerte bleiben nach dem Neuladen erhalten, Swipe scrollt nicht.
- [ ] **Step 7: Commit** `feat: spielbares Wurf-Labor`

---

### Task 7: Veröffentlichung (nur nach OK des Nutzers)

**Files:**
- Create: `.github/workflows/deploy.yml` (wie 82-0, `BASE_PATH=/pixel-splash/`), `README.md` (kurz: Zweck, `npm run dev`, Link)

- [ ] **Step 1:** Nutzer fragen, ob das Repo `Dabvud/pixel-splash` angelegt und gepusht werden darf. Ohne OK hier stoppen.
- [ ] **Step 2:** Repo per GitHub-API anlegen (kein gh CLI), Remote setzen, Pages auf „GitHub Actions“, `git push -u origin main`.
- [ ] **Step 3:** Prüfen: Der Actions-Lauf ist grün, `https://dabvud.github.io/pixel-splash/` antwortet mit 200 und lädt das Labor.
- [ ] **Step 4:** Tag `v0.1.0`, Nutzer den Link zum Handytest geben.
