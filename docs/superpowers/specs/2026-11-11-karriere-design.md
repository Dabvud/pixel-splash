# Karriere-Modus – Design (Entwurf zum Durchgehen)

Stand 2026-11-11. Grundlage: Gespräch mit dem Nutzer. Vom Nutzer freigegeben (2026-11-11).

## 1. Idee in einem Satz

Du erstellst einen eigenen Spieler und spielst seine ganze NBA-Karriere (z. B. 17 Jahre) in kurzen, entscheidenden Szenen – grob 15–40 Minuten für eine komplette Karriere.

## 2. Ablauf einer Karriere

1. **Spieler erstellen** – Baukasten (Haut, Frisur, Bart, Stirnband, Ärmel, Schuhe, Socken, Statur), Position (Guard / Flügel / Big), Größe passend zur Position, Name, Rückennummer.
2. **Draft-Combine** – 3 kurze Prüfungen:
   - Wurf-Serie (Wurf-Labor, 10 Würfe von 5 Spots),
   - Dunk-/Abschluss-Test (3 Abschluss-Meter),
   - Pass-Test (Pässe auf Mitspieler mit Pass-Genauigkeit).
   Ergebnis → Draft-Position 1–60 → Team. Schlechtes Team = mehr Szenen mit dem Ball, schwerer zu gewinnen; gutes Team = Titelchancen, weniger Ballbesitz.
3. **Saison** (siehe 3), danach **Off-Season** (siehe 5), dann nächste Saison – bis zum Karriereende.
4. **Karriereende** – mit 36–40 Jahren oder freiwillig („Rücktritt“ ab 33). Danach Legacy-Bilanz und Hall of Fame (siehe 7).

## 3. Saison

- **5 Key Games in der regulären Saison.** Jedes Key Game ist ein besonderes Spiel (Rivalen-Duell, Spitzenspiel, Christmas Game, Auswärts in feindlicher Halle, Rückkehr zum Ex-Team …).
- Der Rest der Saison wird simuliert. Die Ergebnisse der 5 Key Games (plus deine Werte und die Teamstärke) bestimmen die **Bilanz** und damit die **Platzierung** in der Conference.
- **Platz 1–6:** Playoffs direkt. **Platz 7–10:** Play-In (1 Key Game, Verlieren = Saison vorbei). **Platz 11–15:** keine Playoffs.
- **Playoffs:** 4 Runden (1. Runde, Conference-Halbfinale, Conference-Finale, Finals). Pro Runde **1 Key Game**, das die Serie entscheidet – die Situation passt zur Serie, z. B.:
  - Closing Game (3-2 vorne, Serie zumachen),
  - Elimination Game („mit dem Rücken zur Wand“, 2-3 hinten),
  - Game 7,
  - Game 1 auswärts.
  Die simulierte Serie wird vorher als kurzer Ticker gezeigt („Serie 3-3 – Game 7 in Boston“).

## 4. Ein Key Game

- Kurzer **Ticker-Vorlauf** (Gegner, Halle, Spielstand, Serie).
- **2–3 Szenen** pro Key Game (die Spielzug-Labor-Szenen mit allen Spielzügen, Situationen und Spaß-Features). Zwischen den Szenen tickert das Spiel weiter (Spielstand ändert sich simuliert).
- **Ergebnis:** Die Szenen entscheiden mit, ob das Spiel gewonnen wird. Die letzte Szene ist oft die Crunchtime (Gamewinner-Chance).
- **Statistik:** Punkte/Assists aus den Szenen + hochgerechnete Werte für den Rest des Spiels (aus den Spielerwerten und der Leistung in den Szenen) → PTS/AST/REB pro Spiel.

## 5. Off-Season: Verträge und Skillpunkte

- **Skillpunkte kommen über Verträge.** Ein besserer Vertrag = mehr Skillpunkte (pro Vertragsjahr), dazu ein fiktives Gehalt (nur zur Anzeige/Legacy).
- Zusätzlich kleine Skillpunkt-Boni für Awards (MVP, All-Star …).
- **Vertragsende → 2–3 Angebote** von verschiedenen Teams. Jedes Angebot zeigt: Team, Teamstärke, Laufzeit (1–5 Jahre), Gehalt, Skillpunkte pro Jahr.
- **Abwägung (vom Nutzer gewünscht):** Bei schlechten Teams ist es wirklich schwerer zu gewinnen (Mitspieler schwächer, Simulation schlechter, Gegner stärker in den Szenen). Dafür bieten schlechte Teams **manchmal** (nicht immer) den besseren Vertrag mit mehr Skillpunkten. Gute Teams bieten oft weniger, dafür Titelchancen.
- Auch während eines laufenden Vertrags: **zufällige Trades** (selten, kurze Meldung „Du wurdest zu den Philadelphia 67ers getradet!“).
- **Skillpunkte verteilen** auf die Spezialisierungs-Stufen (6.1) und auf: Wurf (Mitteldistanz), Dreier, Abschluss (Korbleger), Dunk, Dribbling, Passen, Athletik, Verteidigung, Führung. Werte wirken direkt aufs Spiel (Meter-Tempo, Größe der grünen Zone, Dunk-/Kontakt-Dunk-Chancen, Steal-Risiko beim Pass, Positionswert beim Ziehen …).
- **Alter:** ab ca. 31 sinken Athletik und Dunk langsam von selbst, Wurf hält länger – Skillpunkte können das teilweise ausgleichen.
- Die Teams werden über die Jahre automatisch besser oder schlechter (Draft, Alter, Zufall).

## 6. Steuerung, Spezialisierung und Chemie

- **Grundsatz:** Du steuerst nur deinen Spieler. Passt du zu einem Mitspieler, entscheidet dessen KI (wirft/zieht/passt nach seinen Werten); kommt der Ball zurück, steuerst du wieder. Assists zählen für dich.

### 6.1 Spezialisierung (genau eine, beim Erstellen gewählt)

Drei Spezialisierungen, je 3 Stufen, mit Skillpunkten freigeschaltet. Stufe 3 = Oberbelohnung. **Alle drei müssen gleich stark sein:** gleiche Kosten, und per Simulation über viele Szenen wird die Siegchance-Wirkung angeglichen (Ziel: Abweichung ≤ ±3 %).

| Stufe | Playmaking | Werfen | Korbabschluss |
|---|---|---|---|
| 1 | Genauere Pässe, weniger Steals | Größere grüne Zone beim Dreier | Abschluss-Meter langsamer |
| 2 | Coach-Call: Spielzug aus 2 wählen | Deep Range: weite Dreier ohne Abzug | Kontakt-Dunks häufiger, And-one-Chance ×1,5 |
| 3 | **Floor General:** nach deinem Pass steuerst du den Mitspieler (auch beim Abschluss) | **Green Light:** Heißlaufen schon nach 2 Treffern; brennend ist jeder grüne Wurf sicher drin | **Posterizer:** jeder grüne Kontakt-Dunk wird Poster, verfehlte Kontakt-Dunks werden nie geblockt, Ankle Breaker beim Ziehen |

Die Spezialisierung ist für die ganze Karriere fest.

### 6.2 Chemie / Leader-Stufe pro Team (Neustart bei Teamwechsel)

Mitspieler steuern gibt es **nur** über Playmaking Stufe 3. Chemie belohnt anders:
  1. **Neuling** – keine Boni.
  2. **Stammspieler** – Coach-Call (2 Spielzüge zur Wahl; für Playmaker dann 3 zur Wahl).
  3. **Führungsspieler** – Mitspieler treffen nach deinem Pass häufiger (bessere KI-Wertung).
  4. **Franchise-Gesicht** – eine Szene mehr pro Key Game und bessere Vertragsangebote vom eigenen Team.
- **Wege, die Stufe zu steigern (alle zählen, siehe Festlegungen):**
  - a) Jahre im Team (je Saison +1 Chemie),
  - b) Clutch-Szenen gewinnen (Gamewinner, Closing Game, Game 7),
  - c) Skillpunkte in „Führung“,
  - d) Status: All-Star/MVP zählt im Team sofort eine Stufe mehr,
  - e) Max-Vertrag = sofort Stufe 2 beim neuen Team („Star-Signing“),
  - f) Veteranen-Bonus: ab 30 Jahren startet man bei neuen Teams eine Stufe höher (Mentor),
  - g) Teamkollegen-Beziehung: Pässe auf einen Mitspieler, die zu Treffern führen, bauen mit ihm Chemie auf → bei ihm darfst du früher übernehmen,
  - h) Kabinen-Ereignis zwischen Spielen (kurze Wahl, z. B. „Mannschaft zum Essen einladen“ / „Kritik am Coach“) mit Chemie-Folgen.

## 7. Ziele und Bewertung

- **Trophäen-Vitrine:** Meisterschaften (Ringe), Finals-MVP, MVP, All-Star, All-NBA, Rookie of the Year, Scoring-Titel, Defensive Player of the Year, Clutch Player.
- **Karriere-Statistik:** Tabelle Saison für Saison (Team, Bilanz, Platzierung, Playoffs-Ergebnis, PTS/AST/REB) + Karriere-Highlights (beste Szenen, z. B. Game-7-Gamewinner, Poster in den Finals).
- **Legacy-Score + Hall of Fame:** Punkte für Siege, Clutch-Szenen, Awards, Ringe, Statistik. Einstufung am Ende: Rollenspieler → Starter → All-Star → Hall of Famer → GOAT-Debatte.
- **Rangliste der Karrieren:** abgeschlossene Karrieren werden auf dem Gerät gespeichert und verglichen.

## 8. Welt

- 30 Teams mit den abgewandelten Namen (Liste in der Merkliste, alle 30 vergeben), Teamfarben ohne Logos, zwei Conferences wie in der NBA.
- Teamstärke 1–100 pro Team, ändert sich pro Saison.
- Gegnerische Spieler bleiben Baukasten-Figuren mit zufälligen Werten; echte NBA-Spieler kommen nicht vor.
- **Auswärtshalle** (Merkliste): Buhrufe/Ballons bei Freiwürfen, wackelnde grüne Zone in feindlichen Hallen – passt in die Key Games.
- Speicherung: ein laufender Karrierestand im Gerät (localStorage), jederzeit fortsetzbar.

## 9. Abhängigkeiten / technische Grundlagen

- **Spielerwerte-System:** Alle Spieler (auch Mitspieler/Gegner) brauchen Werte, die das Spiel beeinflussen (heute nur `shot` und `athleticism`). Darauf baut auch der Merkzettel „Abschluss-Meter nach Spielerwert“ auf.
- **Simulation:** einfache Spielsimulation (Teamstärke + Werte + Zufall) für Rest-Saison, Ticker, Serien.
- **Szenen-Generator:** wählt Spielzug, Situation (Rückstand/Uhr/Halle) passend zum Key Game und baut deinen Spieler in die Hauptrolle ein (castPlay aus den Spielszenarien kann das bereits teilweise).
- **Neues Menü:** Hauptmenü (Karriere / Wurf-Labor / Spielzug-Labor), Karriere-Bildschirme (Erstellen, Combine, Saison-Übersicht, Vertragsangebote, Skillpunkte, Vitrine, Statistik, Rangliste).

## 10. Vorschlag für die Umsetzung in Teilprojekten

1. Spielerwerte-System + Wirkung im Spiel (Grundlage für alles).
2. Spieler erstellen + Speicherstand + Hauptmenü.
3. Key Game + Szenen-Generator + Simulation/Ticker (spielbare Saison ohne Off-Season).
4. Playoffs/Play-In mit Serien-Situationen.
5. Off-Season: Verträge, Skillpunkte, Trades, Alter, Teamentwicklung.
6. Draft-Combine.
7. Spezialisierungen (inkl. Balance-Simulation) + Chemie/Leader-Stufen.
8. Awards, Statistik, Legacy, Hall of Fame, Rangliste.
9. Auswärtshalle und weitere Key-Game-Würze.

## Festlegungen (Nutzer hat die Spec mit „ja“ freigegeben; offene Punkte mit Standardwerten entschieden, jederzeit änderbar)

- Wege zur Chemie-/Leader-Stufe: alle Vorschläge 6a–h zählen; Gewichtung im Plan.
- Karrierelänge: natürliches Ende zwischen 36 und 40 (Werte-abhängig), freiwilliger Rücktritt ab 33.
- Schwierigkeitsgrad beim Erstellen wählbar: Rookie / Pro / Hall of Fame (wirkt auf Gegnerstärke und Meter-Fenster).
- Verletzungen: selten (ca. 5 % pro Saison), dann nur 3 statt 5 Key Games in dieser Saison; keine Karriere-Enden durch Verletzung.
