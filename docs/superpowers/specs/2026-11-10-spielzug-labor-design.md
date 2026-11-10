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

## Präzisierungen (nach Spec-Review durch Codex)

Diese Regeln gehen den Abschnitten oben vor, wo sie sie genauer fassen.

1. **Uhr bei 0:00:** sperrt nur neue Aktionen (Pass, Ziehen, Kombi-Start). Ein vor 0:00 losgelassener Wurf bzw. ein vor 0:00 begonnener Abschluss wird vollständig ausgewertet, einschließlich Foul und Freiwürfen (Freiwürfe finden bei stehender Uhr statt). Gleichzeitigkeit: Release-Zeitpunkt < Ablaufzeitpunkt zählt.
2. **P wird eingefroren:** am Start der Wurf-Kombi (Überschreiten der 200-ms-Schwelle) bzw. beim Erreichen des Absprungpunkts. Dieser Wert gilt für Foul, Tempo, Zonen und Kontakt-Dunk-Wahl. Der Positionsring zeigt davor live den aktuellen Wert.
3. **Rückstand** wird intern als positive Zahl gespeichert (2 = zwei Punkte hinten), angezeigt mit Minus.
4. **Freiwurf-Serie** ist ein eigener Zustand: Uhr steht; Schütze = gefoulter Spieler; verbleibende Versuche; Punkte des Spielzugs laufen mit; Eingabe nur für die Wurf-Kombi; Bewertung gegen den Rückstand erst nach dem letzten Freiwurf. Ein verworfener Freiwurf beendet die Serie nicht.
5. **Zeitmodell:**
   - Spielzeit (Wege, Animationen, Ballflug, Passflug, Spieluhr) läuft mit `Zeitlupen-Faktor × Animationstempo`; außerhalb von Entscheidungen ist der Zeitlupen-Faktor 1.
   - Echtzeit: Gesten (Haltedauer, Anzeige der Kombi) und Entscheidungsfrist.
   - Während einer Wurf-/Abschluss-Kombi bleibt die Zeitlupe aktiv.
   - Geöffnetes Labor-Menü pausiert alles (Spielzeit und Fristen).
6. **KI-Wahl nach Ablauf der Entscheidungsfrist:** Bewertung je Option mit P – Werfen: P des Ballführers jetzt; Ziehen: P am Absprungpunkt der geraden Bahn nach den Verteidigerwegen der Variante; Pass: P des Empfängers am Fangpunkt. Gewählt wird das kleinste P, bei Gleichstand Werfen vor Ziehen vor Pass. Ein Pass wird automatisch gespielt. Bei Werfen/Ziehen muss der Nutzer die Kombi trotzdem selbst ausführen; kommt innerhalb einer weiteren Entscheidungsfrist keine Kombi, endet der Spielzug mit „ZU LANGE GEZÖGERT“ (zählt als Fehlwurf). Liegt bei Fristablauf ein Finger auf dem Bildschirm, wird die Frist angehalten, bis die Geste endet.
7. **Fortsetzungen:** Jede Pass-Option nennt in den Daten die Fortsetzung des Empfängers; fehlt sie, bekommt der Empfänger einen Entscheidungspunkt mit den Optionen Werfen und Ziehen. Am Absprungpunkt wartet der Spieler in Zeitlupe (Sprung angedeutet) bis zur Abschluss-Kombi; ohne Kombi innerhalb der Entscheidungsfrist automatisch „VERLEGT“. Antippen/Abbruch an einem Entscheidungspunkt ändern nichts, die Frist läuft weiter.
8. **Inbound:** Der Einwerfer steht außerhalb des Feldes (Datenprüfung: Positionen im Feld oder bis 1,5 m außerhalb der Seitenlinie für den Einwerfer). Die Uhr startet beim Fangen des Einwurfs. Lob: Der Empfänger fängt im Sprung am Korb und geht sofort in die Abschluss-Kombi (Alley-oop, Dunk-Regeln mit seinem P); kein Ziehen davor.
9. **Gesten im Spielzug-Labor:** Der Tracker liefert zusätzlich `flick` mit vollständigem Wischvektor (dx, dy) und Dauer, wenn der Finger vor 200 ms oben ist und mindestens 30 px in **beliebige** Richtung gewischt wurde (seitliche und rückwärtige Pässe möglich). Abbruch per Wisch nach unten gilt im Spielzug-Labor nur für gehaltene Gesten (≥ 200 ms). Das Verhalten im Wurf-Labor bleibt unverändert.
10. **Anzeige startet nach der Schwelle:** Im Spielzug-Labor beginnt die Anzeige der Kombi erst bei 200 ms; ausgewertet wird `Haltedauer − 200 ms` gegen die (ggf. ausgewürfelte) Anzeigedauer. Untergrenze der ausgewürfelten Anzeigedauer: 250 ms.
11. **Kamera immer auf der Achse Korb → Ballführer** (erhöht wie tief), auch während der Fahrten. Dadurch zeigt „gerade nach oben wischen“ in jeder Phase auf den Korb. Wurf-Kombis sind erst möglich, wenn die Kamera nach einem Ballwechsel auf der neuen Achse angekommen ist (Fahrt ≤ 0,4 s Echtzeit, Eingaben werden bis dahin ignoriert).
12. **Sichtbarkeit im Hochformat:** In der erhöhten Kamera bei Entscheidungen Sichtfeld 60° und Abstand so, dass möglichst alle Optionen im Bild sind. Ziele außerhalb des Bildes bekommen einen Randpfeil in ihre Richtung. Die Zielwahl per Wisch nutzt die projizierte Bildschirmrichtung, auch für Ziele außerhalb des Bildes. Liegen zwei Ziele weniger als 15° auseinander, gewinnt das näher am Ballführer.
13. **Pass:** Zielpunkt = berechneter Fangpunkt (Position des Empfängers zur Fangzeit laut Weg). Steal wird einmal beim Abspiel bestimmt, mit den Verteidigerpositionen zur Abspielzeit gegen die Strecke Passgeber → Fangpunkt. Während des Passflugs gibt es den Zustand „Ball unterwegs“ ohne Eingabe.
14. **Eine Zonen-Berechnung für Anzeige und Auswertung:** `ShotParams` bekommt einen zusätzlichen Faktor `zoneFactor` (Produkt aus Positions-, Foul- und Kontakt-Faktor) und die tatsächliche Anzeigedauer; `effectiveZones` wendet alle Faktoren genau einmal an und wird von HUD und `resolveShot` gemeinsam genutzt. Bestehende Aufrufe ohne `zoneFactor` verhalten sich unverändert (Faktor 1).
15. **Eigene Bahnen für Korbleger/Dunk:** `buildFlight` bleibt für Sprungwürfe und Freiwürfe. Korbleger: kurzer Bogen (0,4–0,5 s) von der Hand am Sprunghöhepunkt zum Ring bzw. Brett. Dunk/Kontakt-Dunk: Ball bleibt an der Hand bis zum Ringkontakt-Bild der Animation; Treffer → durchs Netz; Fehlversuch → Abpraller vom Ring nach außen. Das Ergebnis kommt weiterhin aus `resolveShot`.

## Erweiterung: Passgenauigkeit und Shooting Pocket (2026-11-10, vom Nutzer freigegeben)

- **Passgenauigkeit q (0–1)** aus der Abweichung des Kurzwischs von der Bildschirmrichtung zum Empfänger: ≤ 5° → q = 1; linear fallend bis q = 0 bei 45°.
- **Verzögerung beim Empfänger:** `(1 − q) × maxDelay` Spielsekunden (Standard maxDelay 0,6 s, einstellbar 0–1 s), in denen der Empfänger den Ball sichert und weder Wurf, Ziehen noch Pass möglich ist; die Fangbewegung zeigt den Ball je nach q in der Pocket (Brusthöhe vor dem Körper) oder versetzt (tief/hoch/seitlich, Versatz bis 0,5 m).
- **Closeout:** Der dem Empfänger zugeordnete Verteidiger läuft während der Verzögerung weiter auf ihn zu; der Positionswert sinkt dadurch über die vorhandene Formel.
- **Zufall je Pass:** Startversatz des Closeouts gleichverteilt in ± 0,3 s × Regler und Endabstand ± 0,6 m × Regler (Regler „Closeout-Zufall“ 0–100 %, Standard 100 %). Ein mittelguter Pass kann so frei bleiben, ein perfekter verteidigt sein; im Mittel ist der genaue Pass klar besser.
- **Lob:** Bei ungenauem Lob wird der Alley-oop schwerer: zusätzlicher Zonenfaktor `0,75 + 0,25 × q`.
- **Kurzmeldung:** q ≥ 0,9 „IN DIE POCKET!“, q ≤ 0,4 „UNGENAU“.
- Die KI-Wahl „Pass“ nach Fristablauf spielt mit q = 0,5.
- Steal-Chancen bleiben unverändert.

## Erweiterung: Pfeil-Meter für Alley-oop und Catch-and-Shoot (2026-11-10, Nutzerwunsch)

- **Pfeil-Meter:** Ein Pfeil läuft genau einmal von unten nach oben durch die Anzeige (Dauer = Anzeigedauer der jeweiligen Kombi inkl. ausgewürfeltem Tempo, Lauf bis Füllstand 1,6). Auslösung beim Loslassen: Bei Alley-oop, Catch-and-Shoot und Abschluss zählt der Füllstand beim Loslassen ohne Wisch ≥ 30 px (auch nach frühem Auflegen oder kurzem Antippen), beim durchgehenden Ziehen das Loslassen der bereits konsumierten Wischgeste; ein aufliegender Finger verlängert den Durchlauf nicht. Ausgewertet wird nur das Timing (Richtungsfehler r = 0) mit denselben effektiven Zonen wie bisher (Positions-, Foul-, Kontakt-, Lob-Faktor). Keine 200-ms-Schwelle.
- **Alley-oop (Lob):** Der Pfeil startet automatisch so, dass der Idealpunkt (Füllstand 1) mit dem Fangen am Korb zusammenfällt (Start = Fangzeit − Anzeigedauer, frühestens beim Abspiel). Tipp → Auswertung wie Abschluss (Dunk-Regeln). Kein Tipp bis Laufende → Fehlversuch („VOM RING“ bzw. bei Kontakt „GEBLOCKT“).
- **Catch-and-Shoot:** Nach jedem gefangenen Pass (kein Lob), sobald die Pass-Verzögerung abgelaufen ist, startet der Pfeil automatisch, wenn der Empfänger die Option Werfen hat. Tipp → Sprungwurf mit dem Wurf-Wert des Empfängers; P wird beim Tipp eingefroren. Kurzwisch währenddessen → Ziehen/Pass wie bisher (Pfeil endet). Läuft der Pfeil ohne Tipp durch, verschwindet er; danach gilt die normale Entscheidung (Halten + Wischen), die Entscheidungsfrist beginnt dann.
- Ein Tipp (ohne Wisch) während des Pfeil-Meters darf nicht als Kurzwisch oder Halten gewertet werden; die Auslösung erfolgt beim Loslassen.
- Die übrigen Würfe (aus dem Dribbling, Abschluss nach Ziehen, Freiwürfe) bleiben bei Halten + Wischen.
- HUD: dieselbe Anzeige mit grüner Zone, statt Füllbalken ein wandernder Pfeil (◄) an der Anzeige; nach dem Tipp bleibt die Markierung stehen.

## Erweiterung: Übersichtskamera bei Entscheidungen und Steals nach Passgenauigkeit (2026-11-10, Nutzerwunsch)

- **Übersichtskamera:** An jedem Entscheidungspunkt (Kamera-Modus „Automatisch“ und „Erhöht“) müssen der Ballführer, alle anspielbaren Mitspieler und der Korb im Bild sein (Hochformat, mit mindestens 8 % Rand). Blickrichtung: von hinter dem Ballführer zum Korb, solange dabei alle Ziele ins Bild passen; steht der Ballführer näher als 4 m am Korb oder liegen Ziele hinter der Kamera, schaut die Kamera vom Schwerpunkt der Mitspieler aus (von weiter hinten und höher) Richtung Korb. Abstand und Höhe werden so gewählt, dass alle Punkte hineinpassen (Sichtfeld 60°). Für Wurf-/Abschluss-Kombis und das Pfeil-Meter beim Catch-and-Shoot gilt weiter die tiefe Kamera auf der Achse Korb → Schütze. Randpfeile bleiben als Rückfall bestehen.
- **Steal-Chance:** `Grundwert × (0,15 + 0,85 × (1 − q))` mit Grundwert 0,6 (Verteidiger < 0,5 m am Passweg), 0,2 (< 1 m), sonst 0; q = Passgenauigkeit. Die KI-Wahl „Pass“ nutzt q = 0,5.

## Erweiterung: Brett-Kollision und Bankshots (2026-11-10, Nutzerwunsch)

- Neues Ergebnis `bank_in` (Treffer, Banner „BRETT – DRIN“): Der Ball trifft das Brett oberhalb des Rings und fällt in den Korb.
- **Brett-Fenster:** normierter Timingfehler `t` (zu spät) im Bereich `1,5 ± 0,3·w` und Richtungsfehler `|r| ≤ 0,6` → `bank_in`; hat Vorrang vor den bisherigen Ring-/Brett-Fehlwürfen in diesem Bereich. `w` hängt vom Winkel φ zwischen der Linie Korb→Werfer und der Mittelachse (z-Achse) ab: φ ≤ 10° → 0,5; 20°–60° → 1,0; ≥ 75° → 0 (kein Bankshot aus der Ecke); dazwischen linear.
- Gilt für Sprungwürfe, Freiwürfe und das Wurf-Labor (Halten + Wischen). Beim Pfeil-Meter gilt das Fenster ebenfalls (r = 0).
- Anzeige: schmaler weißer Streifen auf der Wurfanzeige an der Stelle des Brett-Fensters (nur wenn w > 0).
- Flugbahn `bank_in`: Bogen zum Brettpunkt (etwa 0,25 m über dem Ring, seitlich je nach Wurfwinkel gespiegelt versetzt), Abprall, fällt durch den Ring. Korbleger-Treffer von der Seite (φ ≥ 20°) nutzen dieselbe Brett-Bahn.
- Fehlwürfe ans Brett prallen wie bisher zurück; der Ball durchdringt das Brett in keiner Bahn.

## Erweiterung: Netz, Gesten-Trennung, Freiwürfe, Entscheiden im Laufen, Pause-Menü (2026-11-10, Nutzer-Feedback nach Handytest)

1. **Netz:** Bei jedem Treffer streckt sich das Netz nach unten und schnappt zurück (ca. 0,4 s): Swish Streckung ×1,5, andere Treffer ×1,25 mit leichtem seitlichem Wackeln; bei Ring-Fehlwürfen nur kurzes Wackeln. Beide Modi.
2. **Pass/Ziehen vs. Wurf:** Entscheidend ist, ob der Finger zuerst ruht. Bewegt sich der Finger innerhalb der ersten 200 ms nach dem Aufsetzen mehr als 20 px vom Aufsetzpunkt weg, ist die Geste ein Wisch (Pass/Ziehen) – unabhängig von ihrer Gesamtdauer; ausgewertet wird der Vektor Aufsetzpunkt → Loslasspunkt (mind. 30 px). Nur wenn der Finger die ersten 200 ms innerhalb von 20 px bleibt, beginnt die Wurf-/Abschluss-Kombi (`hold`). Gilt nur im Spielzug-Labor; Wurf-Labor unverändert.
3. **Freiwürfe:** Der Schütze steht an der Freiwurflinie (0 | 4,2) mit Blick zum Korb; alle anderen Akteure stehen abwechselnd links und rechts am Zonenrand (x = ±2,75, z von 1,2 bis 3,6 verteilt) und schauen zum Korb; niemand steht zwischen Schütze und Korb. Kein automatischer Start und kein Zeitlimit: Der Freiwurf beginnt erst mit der Wurf-Kombi des Nutzers (ersetzt die frühere automatische Fehlwurf-Regel bei Freiwürfen). Die Aufstellung erfolgt mit kurzer Überblendung (Akteure laufen ≤ 1 s in Position, Echtzeit).
4. **Entscheiden im Laufen:** An Entscheidungspunkten bleibt niemand stehen. Jedes Segment mit Entscheidung hat ein Entscheidungsfenster von `decisionAt` bis zum Ende der Wege des Segments (mindestens 2,5 Spielsekunden Weg nach `decisionAt`; Daten der 4 Spielzüge entsprechend verlängern, sodass sich alle sinnvoll weiterbewegen – z. B. Ballführer dribbelt weiter Richtung Zone/Flügel, Roller rollt ab, Schützen driften in die Ecke). Während des Fensters läuft das Spiel in Zeitlupe weiter (Zeitlupen-Regler). Die bisherige Entscheidungsfrist in Echtzeit entfällt; das Fenster endet mit den Wegen. Ohne Eingabe bis dahin: KI-Wahl wie bisher (schlechteste Option, verbindlich). Der Menü-Regler „Entscheidungszeit“ wird zu „Entscheidungsfenster“ (Spielsekunden, 1,5–4, Standard 2,5) und skaliert die Fensterlänge.
   - **Ziehen:** Nach der Entscheidung zum Zug läuft das Spiel mit vollem Tempo (Zeitlupen-Faktor 1), bis am Absprungpunkt das Abschluss-Meter erscheint (dann wieder Zeitlupe).
   - **Pass:** Passflug in vollem Tempo; danach Catch-and-Shoot-Pfeil bzw. nächstes Entscheidungsfenster ohne Halt.
5. **Pause-Menü:** Der Zahnrad-Knopf oben rechts wird zum Pause-Knopf (⏸). Er hält das Spiel an (Spielzeit, Fristen, Meter) und zeigt ein Menü mit „Weiter“, „Spielzug neu starten“ (im Wurf-Labor: „Statistik zurücksetzen“) und „Einstellungen“ (bisheriges Labor-Menü). Solange Pause-Menü oder Einstellungen offen sind, bleibt alles angehalten; eine laufende Geste wird abgebrochen. Tastatur: Escape schließt bzw. setzt fort.

## Erweiterung: Abschluss-Feedback und Poster-Animation (2026-11-10, Nutzerwunsch)

1. **Meter bleibt sichtbar:** Bei Korbleger, Dunk, Kontakt-Dunk und Alley-oop bleibt das Pfeil-Meter nach dem Tipp bis zum Ergebnis-Banner sichtbar (Pfeil eingefroren an der Tippstelle, Markierung, grüne Zone). Direkt beim Tipp erscheint neben dem Meter ein kurzes Wort: „PERFEKT“ (|t| ≤ 1, grün), „ZU FRÜH“ (t < −1) oder „ZU SPÄT“ (t > 1) in der Akzentfarbe. Ohne Tipp: „ZU LANGSAM“.
2. **Animation zeigt den Grund:** Die Ballbahn des Abschlusses folgt dem Ergebnis sichtbar: zu früh → Ball kommt zu kurz und prallt am vorderen Ring nach vorne ab; zu spät → hinterer Ring bzw. Brett, Abprall nach hinten/oben; Kontakt-Dunk-Fehlversuch → Block: der Verteidiger springt (block_jump), der Ball wird an seiner Hand gestoppt und fällt nach vorne weg; Treffer → Ball durchs Netz (Dunk: Spieler hängt kurz am Ring). Der Hinweis unter dem Banner bleibt.
3. **Poster:** Bei erfolgreichem Kontakt-Dunk fällt der gepostete Verteidiger zu Boden (neue Bewegung `knocked_down`, 4 Bilder: getroffen, fallend, liegend, liegend) und bleibt bis zum Spielzugende liegen; über seinem Kopf kreisen 1,5 s lang drei Sterne (HUD-Element oder Sprite, Pixel-Stil, gelb). Bei prefers-reduced-motion stehen die Sterne still.
