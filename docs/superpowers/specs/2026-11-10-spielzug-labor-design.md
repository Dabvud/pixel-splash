# Pixel Splash – Teilprojekt 2A: Spielzug-Labor

Stand: 2026-11-10 · Status: Entwurf zur Freigabe · baut auf `2026-11-10-wurf-labor-design.md` auf

## Einordnung

Neue Reihenfolge der Teilprojekte:
1. Wurf-Labor (fertig, v0.1.0)
2. **A: Spielzug-Labor (dieses Dokument)** – Pass, Korbleger, Dunk, Kontakt-Dunk, Fouls/And-ones/Freiwürfe, Pixel-Animationen, 4 Spielzüge einzeln spielbar
   **B: Key Moments** – ein Spiel läuft simuliert als Ticker; an 3–5 zufälligen Schlüsselstellen spielt man den Spielzug selbst, das Ergebnis fließt in den Spielstand (eigene Spezifikation)
3. Dreier-Contest-Turnierleiter
4. Spielerpool + Baukasten + Freischalten
5. 1v1, danach Teamspiel

**Ziel:** Die Bausteine für Key Moments (Figuren-Animation, Spielzug-Abspieler, Pass, Abschlüsse, Fouls) spielbar machen und am Handy feinjustieren. **Erfolgreich ist das Teilprojekt, wenn** alle 4 Spielzüge mit allen Varianten durchspielbar sind, Pass/Korbleger/Dunk/Kontakt-Dunk/Freiwurf sichtbar animiert sind und der Nutzer die Werte im Labor-Menü einstellen kann.

**Nicht enthalten:** simuliertes Spiel/Ticker (2B), Rebounds (ein Fehlwurf ohne Foul beendet den Spielzug), echte NBA-Spieler, Sound, Hub-Kachel.

## Ablauf eines Spielzugs

1. Einblendung der Lage, z. B. „4. VIERTEL · 0:08 · −2“, und des Spielzugnamens
2. Aufbau: alle Figuren laufen ihre Wege, Kamera erhöht, der Nutzer führt den Ball
3. Entscheidungspunkt: Spiel in Zeitlupe, Marker zeigen die Optionen (Wurf-Symbol über dem Ballführer, Pfeil zum Korb = ziehen, Leuchtring unter jedem anspielbaren Mitspieler). Ohne Eingabe innerhalb der Entscheidungszeit wählt die KI die Option mit dem **schlechtesten** Positionswert.
4. Abschluss: Kamera fährt tief hinter den Schützen (auf der Achse zum Korb), Ballflug bzw. Animation
5. ggf. Freiwürfe
6. Ergebnis-Banner + Bewertung gegen den Rückstand + Statistik pro Spielzug (Versuche, Punkte, Ballverluste)

**Die Kontrolle wechselt mit dem Ball:** Nach einem Pass steuert der Nutzer den Empfänger. Ein Korb nach Pass wird als „ASSIST + …“ angezeigt.

**Ende eines Spielzugs:** Korb (ggf. nach Freiwürfen), Fehlwurf, Steal, oder die Spieluhr läuft ab („ZEIT ABGELAUFEN“).

**Bewertung gegen den Rückstand:** Punkte > Rückstand → „GAMEWINNER“, Punkte = Rückstand → „OVERTIME“, sonst „VERLOREN“.

## Gesten

Alles beginnt mit Finger/Maus auf dem Bildschirm (unterer 60-%-Bereich wie im Wurf-Labor):

- **Kurzer Wisch** (Finger nach < 200 ms oben, mindestens 30 px Weg) = Bewegung. Ziel ist das Objekt, dessen Bildschirm-Richtung vom Ballführer aus den kleinsten Winkel zur Wischrichtung hat: ein anspielbarer Mitspieler (→ **Pass**) oder der Korb-Pfeil (→ **Ziehen**). Ist der kleinste Winkel > 45°, passiert nichts.
  - Beim Ziehen bestimmt die Abweichung des Wischs von der Korb-Richtung die Bahn: < −8° links vorbei, > +8° rechts vorbei, sonst gerade. Die seitlichen Bahnen liegen 1,0 m neben der direkten Linie.
- **Halten (≥ 200 ms) + Wisch nach oben** = Wurf mit der Wurf-Kombi des Wurf-Labors. Die Anzeige wird erst ab 200 ms sichtbar.
- Abbruch und Antippen wie im Wurf-Labor (> 30 px nach unten = Abbruch, ohne Wisch = nichts).

## Positionswert P (0–1)

Berechnet im Moment von Wurf-Release bzw. Absprung, für jeden Verteidiger, P = Minimum über alle:

- `d` = waagerechter Abstand Verteidiger ↔ Angreifer (m)
- `c = clamp((2,0 − d) / 1,5, 0, 1)` (1 bei ≤ 0,5 m, 0 ab 2,0 m)
- `cosθ` = Kosinus des Winkels zwischen Angreifer→Korb und Angreifer→Verteidiger
- `w = clamp(0,2 + 0,8 · cosθ, 0, 1)` (direkt im Weg 1, seitlich 0,2, dahinter 0)
- `P = 1 − c · w`

Anzeige: Beim Ziehen hat der Ballführer einen Ring unter den Füßen, der seine Farbe live von Rot (P = 0) über Gelb (0,5) nach Grün (1) wechselt.

## Abschlüsse

### Sprungwurf (im Spielzug)
Wurf-Logik des Wurf-Labors mit der tatsächlichen Distanz zum Korb und dem Wurfwert des Spielers, zusätzlich Positions-, Tempo- und Foul-Wirkung (unten).

### Ziehen → Korbleger / Dunk / Kontakt-Dunk
- Der Spieler dribbelt automatisch auf der gewählten Bahn zum Absprungpunkt (ca. 1,2 m vor dem Korb, ca. 1 s). Am Absprungpunkt startet die **Abschluss-Kombi** (halten + nach oben wischen) mit eigener Grundeinstellung: Anzeige **450 ms**, grüne Zone **±10 %**, Richtung **±8°**, Wurfwert = **Athletik**, Distanzfaktor 1.
- Art des Abschlusses (wird beim Erreichen des Absprungpunkts festgelegt und angezeigt):
  - Athletik ≥ 0,7 und P ≥ 0,6 → **Dunk**
  - Athletik ≥ 0,7 und P < 0,6 → mit Wahrscheinlichkeit `clamp(1,5 · (Athletik − 0,57), 0, 1)` **Kontakt-Dunk** („POSTER?“ blitzt auf), sonst **Korbleger**
  - sonst **Korbleger**
- Ergebnislogik wie beim Wurf (Swish/Treffer/Ringtanz → Korb; sonst daneben). Banner: Korbleger „KORBLEGER“ / „VERLEGT“, Dunk „DUNK“ / „VOM RING“, Kontakt-Dunk „POSTER!“ / „GEBLOCKT“.

### Zonen und Tempo (alle Würfe und Abschlüsse außer Freiwürfen)
- Effektive Zonen: `Grundzone × Stat-Faktor × Distanz-Faktor × Positions-Faktor × Foul-Faktor × Kontakt-Faktor`
  - Positions-Faktor `= U + (1 − U) · P` mit Untergrenze `U = 0,7` → offen ×1,0, voll verteidigt ×0,7
  - Foul-Faktor ×0,6 (nur wenn Kontakt/Foul feststeht), Kontakt-Dunk-Faktor ×0,75
- Tempo der Anzeige: `Anzeigedauer × (1 + z · S · (1 − P))` mit `z` gleichverteilt in [−1, 1] und Spanne `S = 0,3`. Offen = normales Tempo, voll verteidigt = bis ±30 %. Die Auswertung nutzt die tatsächliche (ausgewürfelte) Dauer.

### Fouls
- Entschieden beim Start der Wurf-/Abschluss-Kombi; bei Foul blitzt sofort „KONTAKT!“ auf, und die Zonen sind sichtbar kleiner.
- Chancen (vor Multiplikator „Foul-Häufigkeit“ aus ×0 / selten ×0,5 / normal ×1 / oft ×2):
  - Korbleger/Dunk: `3 % + 27 % · (1 − P)`
  - Kontakt-Dunk: 40 %
  - Sprungwurf 2er: `1 % + 9 % · (1 − P)`
  - Dreier: `0,5 % + 4,5 % · (1 − P)`
- Treffer + Foul → **AND-ONE**: Korb zählt + 1 Freiwurf. Fehlwurf + Foul → 2 Freiwürfe (Dreier: 3).
- Animation: Der Verteidiger macht den Kontaktschritt, der Werfer wird im Flug leicht versetzt.

### Freiwürfe
Kamera tief hinter der Freiwurflinie, Wurf-Kombi mit den Werten des Wurf-Labors (Anzeigedauer, grüne Zone, Richtung), Wurfwert des Schützen, keine Positions-/Tempo-/Foul-Wirkung.

### Punkte
3 Punkte, wenn der Wurf außerhalb der Dreierlinie startet (Abstand > 6,75 m, in den Ecken |x| > 6,6 m bei z < 1,415), sonst 2; Freiwurf 1.

## Pass
- Ziel per kurzem Wisch (siehe Gesten), nur Mitspieler im Feld.
- Passweg: kleinster waagerechter Abstand eines Verteidigers zur Strecke Passgeber→Empfänger. < 0,5 m → 60 % Steal, < 1,0 m → 20 % Steal, sonst sicher.
- Flugzeit `0,25 s + 0,06 s · Distanz (m)`, leichter Bogen; Empfänger spielt „Fangen“, danach geht die Kontrolle auf ihn über.
- Steal: Verteidiger fängt den Ball ab → „STEAL“, Spielzug endet.

## Spielzüge (Daten)

Jeder Spielzug ist ein Datensatz: Lage (Viertel, Uhr, Rückstand), Startaufstellung, Zeitleiste mit Wegpunkten und Tätigkeit pro Figur, Entscheidungspunkte mit Optionen und Fortsetzungen (Fortsetzungen können weitere Entscheidungspunkte haben), Verteidigungsvarianten mit Wahrscheinlichkeit (beim Start ausgewürfelt, bestimmen die Verteidigerwege). Die Uhr läuft in Spielzeit (in der Zeitlupe entsprechend langsamer).

| Spielzug | Lage | Ablauf | Varianten → was frei wird |
|---|---|---|---|
| Pick & Roll | 4. · 0:08 · −2 | Nr. 3 oben mit Ball, Nr. 50 stellt Block; Entscheidung am Block: Pull-up, ziehen, Pass zum abrollenden Nr. 50, Pass in die Ecke zu Nr. 11 | drunter → Pull-up frei · Hedge → Roller frei · Switch → ziehen gegen den langsamen Big · Hilfe aus der Ecke → Nr. 11 frei |
| Fast Break | 4. · 0:06 · −2 | 3-gegen-2 ab Mittellinie: Nr. 3 Mitte, Nr. 23 und Nr. 11 auf den Flügeln; Entscheidung auf Höhe der Freiwurflinie | gestaffelt → Flügel frei · gesplittet → Mitte frei · einer stoppt den Ball → Nr. 23 frei zum Dunk |
| Kick-out | 4. · 0:08 · −2 | Nr. 23 zieht, Hilfe rotiert; Entscheidung: abschließen oder Pass zu Nr. 11 (Ecke) / Nr. 3 (Flügel); Empfänger entscheidet erneut: werfen oder am Closeout vorbeiziehen | Hilfe kommt → Ecke frei · Hilfe bleibt → Abschluss frei · Closeout zu schnell → Empfänger zieht vorbei |
| Inbound / Last Shot | 4. · 0:03 · −1 bis −3 (ausgewürfelt) | Nr. 3 wirft seitlich ein: Nr. 11 kommt um einen Block (Dreier), Nr. 50 zum Lob am Korb, Nr. 23 schneidet; Empfänger entscheidet sofort | übernimmt → Lob frei · bleibt hängen → Nr. 11 frei · Doppelung → Nr. 23 frei |

Fast Break nutzt nur 3 Angreifer und 2 Verteidiger, die übrigen Figuren sind ausgeblendet.

## Figuren

### Skelett und Rasterung
- 15 Gelenkpunkte in 3D, körperbezogen (Kopf, Hals, Schultern L/R, Ellbogen L/R, Hände L/R, Becken, Hüften L/R, Knie L/R, Füße L/R); Maßstab nach Körpergröße.
- Eine Bewegung = 2–4 Schlüsselposen; die Einzelbilder werden linear zwischen den Gelenkpositionen interpoliert.
- 4 Blickrichtungen (vorne, hinten, links, rechts) durch Parallelprojektion derselben 3D-Pose.
- Rasterung pro Bild auf ca. 32 × 48 px: Gliedmaßen als 2–3 px dicke Linien in Hautfarbe, Trikot und Hose als Flächen, Kopf mit Frisur, Schuhe, Nummer (Rücken bzw. Brust), danach 1-px-Umriss.
- Beim Start Vorberechnung aller Bilder pro Figur × Bewegung × Richtung in einen Textur-Atlas.
- Angezeigte Richtung aus der Blickrichtung der Figur relativ zur Kamera.
- Jedes Bild kennt die Position der Ballhand; der gehaltene Ball sitzt daran, beim Dribbeln springt er im Takt der Bilder zwischen Hand und Boden.

### Bewegungen

| Bewegung | Bilder |
|---|---|
| Stehen (atmen) | 2 |
| Laufen | 8 |
| Dribbeln stehend / laufend | 6 / 8 |
| Pass | 6 |
| Fangen | 4 |
| Sprungwurf | 6 |
| Korbleger | 8 |
| Dunk | 8 |
| Kontakt-Dunk | 8 |
| Verteidigen (Seitschritt) | 6 |
| Block-Sprung (Verteidiger) | 6 |
| Kontakt (Foul) | 4 |

### Figur-Parameter (= späterer Baukasten)
Größe, Statur (schmal/normal/breit), Hautton, Frisur (kurz/Glatze/Afro), Trikot- und Hosenfarbe, Nummer, Wurfwert, Athletik.

### Platzhalter-Teams
Rot (Nutzer):

| Nr. | Rolle | Größe | Wurf | Athletik |
|---|---|---|---|---|
| 3 | Aufbau | 1,88 | 0,7 | 0,6 |
| 11 | Schütze | 1,96 | 0,9 | 0,4 |
| 23 | Athlet | 2,03 | 0,6 | 0,9 |
| 32 | Forward | 2,06 | 0,5 | 0,6 |
| 50 | Big | 2,13 | 0,2 | 0,8 |

Blau (Verteidigung): Nr. 1, 7, 15, 21, 44 mit Größen 1,85 / 1,98 / 2,01 / 2,06 / 2,11, unterschiedliche Haut-/Frisur-Parameter.

## Kamera (Modus „Automatisch“)
- Aufbau und Zeitlupe: erhöht hinter dem Ballführer (Achse Korb → Ballführer)
- Wurf/Abschluss: fährt tief hinter den Schützen auf die Achse zum Korb
- Freiwurf: tief hinter der Freiwurflinie
- Feste Modi „tief“/„erhöht“ folgen dem Ballführer.

## Labor-Menü (zusätzlich)

| Einstellung | Werte | Standard |
|---|---|---|
| Modus | Wurf-Labor / Spielzug-Labor | Wurf-Labor |
| Spielzug | Pick & Roll / Fast Break / Kick-out / Inbound / Zufall | Zufall |
| Zeitlupe | 20–50 % | 30 % |
| Entscheidungszeit | 1–4 s | 2 s |
| Animationstempo | 50–150 % | 100 % |
| Verteidigungs-Zufall | an / aus (aus = fester Startwert) | an |
| Foul-Häufigkeit | aus / selten / normal / oft | normal |
| Abschluss-Anzeigedauer | 300–700 ms | 450 ms |
| Abschluss grüne Zone | 5–20 % | 10 % |
| Abschluss Richtung | 4–14° | 8° |
| Tempo-Spanne verteidigt | 0–50 % | 30 % |
| Zonen-Untergrenze verteidigt | 50–90 % | 70 % |

Alle Werte wie bisher im Browser gespeichert (neuer Schlüssel bzw. erweiterte Einstellungen; alte Werte bleiben gültig, fehlende Felder → Standard).

## Aufbau

| Datei | Aufgabe |
|---|---|
| `src/figure/skeleton.ts` | Pose-Typ, Interpolation, Projektion in 4 Richtungen |
| `src/figure/moves.ts` | Schlüsselposen aller Bewegungen, Ballhand pro Bild |
| `src/figure/raster.ts` | Pose + Figur-Parameter → Pixelbild |
| `src/figure/atlas.ts` | Vorberechnung in Textur-Atlas |
| `src/play/types.ts`, `src/play/plays/*.ts` | Datenformat, 4 Spielzüge |
| `src/play/engine.ts` | Abspieler: Zeit, Wege, Varianten, Entscheidungen, Ballbesitz, Uhr, Spielzug-Ende |
| `src/play/position.ts` | Positionswert P |
| `src/play/pass.ts` | Zielwahl per Wischrichtung, Passweg/Steal |
| `src/play/finish.ts` | Abschlussart, Fouls, Zonen-/Tempo-Faktoren, Punkte, Freiwürfe, Banner |
| `src/input/gesture.ts` | erweitert um kurzen Wisch vs. Halten |
| `src/render/actors.ts` | Figuren-Sprites aus dem Atlas, Richtung und Bild wählen |
| `src/ui/play-hud.ts` | Lage-Einblendung, Marker, Positionsring, Banner, Statistik |
| `src/modes/shot-lab.ts` | bisheriges Wurf-Labor aus `main.ts` |
| `src/modes/play-lab.ts` | Spielzug-Labor |
| `src/main.ts` | wählt den Modus |

Alle Zufallsentscheidungen (Varianten, Fouls, Tempo, Steals, Kontakt-Dunk, Ringtanz, Rückstand) laufen über eine übergebene Zufallsfunktion; „Verteidigungs-Zufall aus“ nutzt einen festen Startwert.

## Tests

- `position`: P-Grenzen (direkt im Weg 0,5 m → 0; seitlich; dahinter → 1; ≥ 2 m → 1), Minimum über mehrere Verteidiger
- `finish`: Abschlussart nach Athletik/P/Zufall; Foul-Chancen bei P = 0 / 0,5 / 1 und Foul-Häufigkeit; Zonen-Faktor-Produkt; Tempo-Spanne; Punkte 2/3 inkl. Ecke; And-one/Freiwurf-Anzahl
- `pass`: Zielwahl nach kleinstem Winkel, > 45° → keine Aktion; Steal-Schwellen
- `engine`: jeder Spielzug × jede Variante × jede Option (inkl. KI-Wahl nach Ablauf der Entscheidungszeit) läuft bis zu einem Ende; Uhr-Ablauf beendet; Kontrolle wechselt mit dem Ball
- Spielzug-Daten: alle Figuren-IDs gültig, Wegpunkte zeitlich aufsteigend, alle Positionen im Feld
- `skeleton`/`moves`: Interpolation an Schlüsselposen exakt, Bildanzahl je Bewegung laut Tabelle, Ballhand = Handgelenk im jeweiligen Bild
- `gesture`: kurzer Wisch (< 200 ms) vs. Halten; bestehende Tests bleiben grün
- `settings`: neue Felder mit Grenzen/Standard; alte gespeicherte Daten ohne neue Felder laden fehlerfrei
- Browser (headless, 390 × 844, Touch): jeden Spielzug durchspielen; Screenshots von Pass, Korbleger, Dunk, Kontakt-Dunk, Freiwurf; keine Konsolenfehler

## Veröffentlichung
Wie bisher: Branch `entwicklung`, nach Review Merge in `main` → Deploy nach `dabvud.github.io/pixel-splash/`. Push nur nach OK des Nutzers.
