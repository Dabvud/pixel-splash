# Pixel Splash – Teilprojekt 1: Wurf-Labor

Stand: 2026-11-10 · Status: Entwurf zur Freigabe

## Gesamtvision (Kontext, nicht Teil dieses Teilprojekts)

Pixel Splash ist ein Basketballspiel für den App-Hub (dabvud.github.io), gespielt am Handy im Hochformat.
Optik: 3D-Halle mit Pixel-Look im Stil von Pokémon Schwarz/Weiß, gerendert in niedriger Auflösung und pixelig hochskaliert, die Figuren sind Pixel-Sprites. Die Kamera steht hinter dem Spieler, passt sich der Situation an und ist zusätzlich wählbar.

Das Gesamtprojekt besteht aus fünf Teilprojekten, jedes mit eigener Spezifikation, eigenem Plan und eigener Umsetzung:

1. **Wurf-Labor** (dieses Dokument)
2. Dreier-Contest als Turnierleiter: Jede Stufe ist ein Mini-Contest (5 Spots à 5 Bälle, der letzte Ball zählt doppelt, 60 s) gegen 3 KI-Schützen, Platz 1 schaltet die nächste Stufe frei, 6–8 Stufen bis zum Legenden-Finale. KI-Würfe nutzen dieselbe Wurf-Logik.
3. Spielerpool (20–30 echte NBA-Schützen, aktuelle und Legenden), Baukasten-Sprites (Hautton, Frisur, Bart, Stirnband, Größe, Teamfarben ohne Logos, Name und Nummer), Freischalten über Münzen, besiegte Gegner und Meilensteine
4. 1v1: virtueller Joystick unten links, Wurf rechts, Verteidiger-KI, Kamerafahrten
5. Teamspiel

Gegner: solo gegen KI bzw. auf Highscore. Kein Online-Multiplayer. Sound vorerst nicht.

## Ziel des Wurf-Labors

Eine spielbare Testseite, auf der die Wurfmechanik am Handy ausprobiert und feinjustiert wird. Halle, Kamera, Gestenerkennung und Wurf-Logik werden so gebaut, dass Contest und 1v1 sie unverändert übernehmen können.

**Erfolgreich ist das Labor, wenn** der Nutzer am Handy von allen Spots werfen kann, die Steuerung sich gut anfühlt und er die Startwerte über das Labor-Menü so einstellen kann, dass sie in die nächsten Teilprojekte übernommen werden.

**Nicht enthalten:** KI-Schützen, Contest, echte Spieler, Baukasten-Figuren (es gibt eine einzige Platzhalter-Figur), Freischalten, Sound, Vibration, Hub-Kachel.

## Bildschirm (Hochformat)

- 3D-Halle im Pixel-Look: Feld mit Linien, Korb mit Brett und Netz, Publikum an den Wänden. Der eigene Spieler ist als Pixel-Sprite von hinten zu sehen, Ball als 3D-Kugel.
- Pixel-Auflösung: Die Bildhöhe wird mit 320 px gerendert und pixelig (`image-rendering: pixelated`) auf Bildschirmgröße hochskaliert. Wählbar sind 220, 320, 420 und 540.
- Wurfanzeige neben dem Spieler: ein senkrechter Balken mit grüner Zone oben. Nach dem Wurf bleibt kurz eine Markierung an der Stelle stehen, an der losgelassen wurde.
- Ergebnis-Banner in Pixel-Schrift (z. B. „SWISH“, „RING VORNE“), darunter die grobe Rückmeldung (siehe Wurf-Logik)
- Sitzungsstatistik am oberen Rand: Treffer / Würfe und Quote
- Zahnrad öffnet das Labor-Menü

## Labor-Menü

Alle Werte werden in `localStorage` gespeichert. Ist der Speicher gesperrt oder leer, gelten die Standardwerte.

| Einstellung | Werte | Standard |
|---|---|---|
| Wurfspot | Ecke links, Flügel links, Top, Flügel rechts, Ecke rechts (Dreierlinie), Freiwurf, Mitteldistanz | Top |
| Kamera | tief hinter Spieler / erhöht / automatisch | automatisch |
| Testprofil | Elite (0,9) / Durchschnitt (0,5) / Center (0,1) | Durchschnitt |
| Stat-Einfluss | aus (0) / leicht (0,3) / fair (0,6) / stark (1,0) | fair |
| Anzeigedauer | 400–1200 ms | 700 ms |
| Grüne Zone (Halbbreite) | 3–15 % | 7 % |
| Richtungs-Spielraum (halb) | 2–12° | 6° |
| Pixel-Auflösung | 220 / 320 / 420 / 540 | 320 |

„Automatisch“ bedeutet: Beim Zielen steht die Kamera tief hinter dem Spieler, während des Ballflugs schwenkt sie nach oben zum Korb und kehrt danach zurück.

## Steuerung (Wurf-Kombi)

Finger und Maus funktionieren gleich, beide laufen über Pointer Events. Eine Bewegung: aufsetzen → nach oben ziehen → loslassen.

1. **Aufsetzen** im unteren Bildschirmbereich: Der Spieler geht in die Wurfpose, die Wurfanzeige beginnt sich zu füllen.
2. **Ziehen** Richtung Korb: Die Richtung des Wischs (Vektor vom Aufsetz- zum Loslasspunkt) bestimmt links und rechts. Die Länge des Wischs spielt keine Rolle.
3. **Loslassen:** Der Ball ist raus. Der Zeitpunkt bestimmt die Weite.

Sonderfälle:
- Wisch kürzer als 30 px nach oben und nicht nach unten: Es passiert nichts (später der Pumpfake im 1v1).
- Wisch mehr als 30 px nach unten: Abbruch.
- Während ein Ball fliegt, werden neue Gesten ignoriert.

## Wurf-Logik

### Messen
- Füllstand `m = Haltedauer / Anzeigedauer`, begrenzt auf höchstens 1,6. Ideal ist `m = 1`.
- Winkel `w` = Abweichung des Wischvektors von der Senkrechten nach oben, in Grad (negativ = links). Ideal ist 0°, weil die Kamera hinter dem Spieler steht und der Korb deshalb immer oben liegt.

### Zonen anpassen
- Stat-Faktor `k = 1 + Einfluss × (Wurfwert − 0,5) × 1,6`
- Distanzfaktor `d = 1 − 0,04 × (Distanz zum Korb in m − 4,6)`, begrenzt auf den Bereich 0,8 bis 1,0. Freiwurf = 1,0, Dreier ≈ 0,91.
- Effektive grüne Zone `g = Grundzone × k × d`, effektiver Richtungs-Spielraum `a = Grundspielraum × k × d`

### Ergebnis
- Normierte Fehler: `t = (m − 1) / g`, `r = w / a`, Gesamtfehler `F = √(t² + r²)`

| F | Ergebnis | Code |
|---|---|---|
| ≤ 0,5 | Swish | `swish` |
| ≤ 1,0 | Treffer mit Ringberührung | `rim_in` |
| ≤ 1,3 | Ringtanz, 50 % rein | `roll_in` / `roll_out` |
| ≤ 2,0 | Ring raus: vorne (t<0), hinten (t>0), links/rechts (r) – die betragsmäßig größere Komponente entscheidet | `rim_front` / `rim_back` / `rim_left` / `rim_right` |
| > 2,0 | Klar daneben: Airball (t dominiert, t<0), Brett (t dominiert, t>0), seitlich vorbei (r dominiert) | `airball` / `board` / `wide_left` / `wide_right` |

Der Zufall beim Ringtanz kommt aus einer übergebenen Zufallsfunktion, damit er im Test festgelegt werden kann.

### Rückmeldung (bewusst grob)
- Timing: `|t| ≤ 1` → „perfekt“ · `1 < |t| ≤ 2` → „etwas zu früh/spät“ · `|t| > 2` → „viel zu früh/spät“
- Richtung: `|r| ≤ 1` → kein Text · `1 < |r| ≤ 2` → „leicht links/rechts“ · `|r| > 2` → „weit links/rechts“
- Keine Millisekunden und keine Grad. Beispiel: „RING VORNE“, darunter „etwas zu früh“.

### Flugbahn
- Parabel von der Wurfhand zum Zielpunkt. Die Scheitelhöhe wächst mit der Distanz und liegt immer über Ringhöhe (3,05 m), Flugzeit etwa 0,9–1,2 s.
- Zielpunkte: Netzmitte (Swish), Ringkante an der jeweiligen Seite (Ring-Fälle), Brett oberhalb des Rings (Brett), vor oder neben dem Korb (Airball, seitlich vorbei)
- Nach einer Ringberührung folgt ein kurzer Abpraller nach außen bzw. ein Roller hinein, danach fällt der Ball zu Boden und springt aus.

### Wurfspots (Weltkoordinaten in m, Ring bei x=0, z=0)
Dreierlinie (6,75 m bzw. 6,6 m in den Ecken): Ecke links (−6,6 | 0,5), Flügel links (−4,8 | 4,8), Top (0 | 6,9), Flügel rechts (4,8 | 4,8), Ecke rechts (6,6 | 0,5). Freiwurf (0 | 4,2). Mitteldistanz (0 | 5,2).
Der Spieler schaut immer zum Korb, und die Kamera steht auf der Verlängerung von Korb → Spieler hinter ihm.

## Aufbau

Vite + TypeScript + three.js (npm) + vite-plugin-pwa, Tests mit vitest. Kein React. Die Menüs sind schlichtes DOM über dem Canvas.

| Datei | Aufgabe | Abhängigkeiten |
|---|---|---|
| `src/shot/resolve.ts` | Messwerte + Spot + Profil + Einstellungen + Zufallsfunktion → Ergebnis-Code, normierte Fehler, Rückmeldungstext | keine |
| `src/shot/trajectory.ts` | Ergebnis + Startpunkt → Funktion Zeit → Position, plus Gesamtdauer | Typen aus resolve |
| `src/input/gesture.ts` | Pointer Events → `start`, `release(haltedauerMs, winkelGrad)`, `cancel`, `tap` | keine |
| `src/render/scene.ts` | Halle, Feld, Korb, Publikum, Licht | three |
| `src/render/pixel.ts` | Renderer mit niedriger Auflösung und Pixel-Skalierung | three |
| `src/render/camera.ts` | Kameramodi und Kamerafahrt während des Flugs | three |
| `src/render/player.ts` | Platzhalter-Sprite mit den Posen „bereit“ und „Wurf“ | three |
| `src/ui/hud.ts` | Wurfanzeige, Banner, Statistik | DOM |
| `src/ui/lab-menu.ts` | Labor-Menü | DOM, settings |
| `src/settings.ts` | Standardwerte, Spots, Profile, Laden und Speichern | keine |
| `src/main.ts` | Verdrahtung und Spielschleife | alle |

Ablauf: `gesture.release` → `resolve` → `trajectory` → Szene und Kamera spielen ab → `hud` zeigt Ergebnis und Statistik.

## Tests

- `resolve`: jede Ergebnisklasse an ihren Grenzen; Stat-Faktoren entsprechen der Tabelle (z. B. fair/Elite → ×1,38); bei Einfluss „aus“ liefern alle Profile dasselbe Ergebnis; Distanzfaktor; Ringtanz mit fester Zufallsfunktion; Rückmeldungsschwellen
- `trajectory`: Start an der Hand, Ende am richtigen Zielpunkt je Ergebnis, Scheitel über 3,05 m
- `gesture`: Wisch nach oben → `release` mit korrektem Winkel und korrekter Dauer; Wisch nach unten → `cancel`; kurzes Antippen → `tap`
- `settings`: kaputter oder fehlender Speicher → Standardwerte
- Selbst prüfen: im Browser in Handygröße von jedem Spot werfen und alle Kameramodi durchschalten

## Veröffentlichung

Repo `pixel-splash` (lokal `Desktop\Meine Programme\pixel-splash`), GitHub `Dabvud/pixel-splash`, Deploy per GitHub Actions nach `dabvud.github.io/pixel-splash/`. Anlegen des Repos, Push und Deploy erst nach OK des Nutzers. Keine Hub-Kachel in diesem Teilprojekt.
