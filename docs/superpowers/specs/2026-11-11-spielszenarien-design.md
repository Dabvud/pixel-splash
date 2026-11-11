# Spielszenarien – Abwechslung im Spielzug-Labor (Entwurf zum Durchgehen)

Stand 2026-11-11. Ziel: Jeder Angriff soll sich anders anfühlen. Bisher gibt es 4 Spielzüge (Pick & Roll, Fast Break, Kick-out, Inbound/Last Shot).
Kennzeichnung des Aufwands:
- **D** = nur neue Spielzug-Daten (Laufwege, Optionen, Verteidigungs-Varianten) – geht mit der heutigen Engine.
- **M** = braucht eine kleine neue Mechanik (steht dabei).
- **G** = größere neue Mechanik.

Zum Durchgehen: pro Nummer einfach „ja / nein / später“.

---

## A. Neue Spielzüge (je mit 2–4 zufälligen Verteidigungs-Varianten)

| Nr | Name | Ablauf | Entscheidungen | Aufwand |
|---|---|---|---|---|
| A1 | Isolation | Mitspieler räumen eine Seite, Ballführer 1-gegen-1 an der Dreierlinie | Ziehen / Step-back-Dreier / Kick-out, wenn Hilfe kommt | D |
| A2 | Post-up | Big bekommt den Ball am Block, Rücken zum Korb | Drop-Step-Dunk / Hook / Kick-out bei Doppeln | M (Post-Moves Hook + Drop-Step) |
| A3 | Handoff (DHO) | Big übergibt am Ellbogen an den Guard | Ziehen / Pull-up-Dreier / Pocket zurück zum Big | D |
| A4 | Floppy | Schütze läuft unter dem Korb um zwei Blöcke, wählt Seite | Catch-and-Shoot / Curl zum Korb | D |
| A5 | Pin-down Ecke | Schütze kommt aus der Zone um einen Pin-down in die Ecke | Eckendreier / Pump-Fake + Ziehen | D |
| A6 | Backdoor-Cut | Verteidiger überverteidigt den Passweg, Mitspieler schneidet hinten durch | Bounce-Pass / Lob / normal weiter | D |
| A7 | Horns | Zwei Bigs an den Ellbogen | Pick links oder rechts; anderer Big poppt zum Dreier oder rollt | D |
| A8 | Spain Pick & Roll | Pick & Roll + Rückenblock auf den Verteidiger des Rollenden | Lob zum Rollenden / Dreier des Blockstellers / selbst | D |
| A9 | Double Drag | Zwei Blöcke hintereinander im Fast-Break-Tempo | Ziehen / erster Big rollt / zweiter Big poppt | D |
| A10 | Stagger für den Dreier | Schütze läuft um zwei versetzte Blöcke zur Flügelposition | Catch-and-Shoot / Ziehen gegen Closeout | D |
| A11 | Elevator Doors | Zwei Blocksteller öffnen eine „Tür“, Schütze läuft durch, Tür geht zu | Dreier direkt nach dem Durchlaufen | D |
| A12 | Give-and-Go | Pass an den Flügel, sofort Cut zum Korb, Rückpass | Korbleger / Dunk / weiterpassen | D |
| A13 | Flare-Screen | Block weg vom Ball, Schütze driftet zur Seite | Skip-Pass + Dreier | D |
| A14 | Offensiv-Rebound | Mitspieler wirft daneben, Ball springt zufällig ab | Tip-in / Putback-Dunk / Kick-out zum freien Schützen | M (Rebound-Sprung + Ball-Abpraller zur Figur) |
| A15 | 2-gegen-1 Konter | Nach Steal zwei Angreifer gegen einen | Selbst abschließen / im letzten Moment passen | D |
| A16 | 3-gegen-2 Konter | Mitte mit Ball, zwei Flügel laufen | Pass auf Flügel / Pull-up / Lob | D |
| A17 | Seiteneinwurf (SLOB) | Einwurf von der Seitenlinie, wenig Zeit | Block für den Schützen / Lob über die Verteidigung | D |
| A18 | Gegen 2-3-Zone | Gegner spielt Zone | Ball in die High-Post, dann Skip-Pass oder Abschluss | M (Zonen-Verteidigung: Verteidiger bewachen Räume statt Spieler) |
| A19 | Press-Break | Ganzfeldpresse nach eigenem Einwurf | Ball nach vorn passen, Überzahl ausspielen, Fehler = Steal | M (längeres Feld, Rückfeld-Kamera) |
| A20 | Buzzer-Beater Halbzeit | 2,5 s, Ball in der eigenen Hälfte | Halbfeldwurf / langer Pass | M (sehr weiter Wurf mit eigener Trefferkurve) |
| A21 | Lob vom Einwurf | Letzte 0,8 s, nur Fangen + Abschluss in der Luft möglich | Alley-oop-Pfeil / Tip-Dunk | D |
| A22 | Pick & Pop | Big blockt und läuft zur Dreierlinie statt zum Korb | Pass zum Big für den Dreier / selbst ziehen | D |
| A23 | Short Roll | Big rollt nur bis zur Freiwurflinie, bekommt den Ball beim Doppeln | Floater / Lob zum Weak-Side-Big / Ecke | D |
| A24 | Hammer-Aktion | Ziehen zur Grundlinie, Schütze bekommt hinten einen Block für den Eckendreier | Kick-out in die Ecke / selbst | D |

## B. Zufall in jedem Spielzug (Modifikatoren)

| Nr | Name | Wirkung | Aufwand |
|---|---|---|---|
| B1 | Verteidigungstaktik beim Block | Pro Angriff zufällig: Switch, Drop, Hedge, Blitz (Doppeln), Unter-dem-Block | M (Taktik bestimmt Verteidiger-Wege beim Pick) |
| B2 | Mismatch nach Switch | Nach dem Switch steht ein Big gegen den Guard bzw. ein Guard gegen den Big → besseres Abschluss-Fenster am Korb oder beim Dreier | M (abhängig von B1) |
| B3 | Spielstand zufällig | Rückstand −1 bis −6 | D |
| B4 | Restzeit zufällig | 3 bis 24 s Spieluhr | D |
| B5 | Wurfuhr | Manchmal läuft die 24-s-Uhr ab (unter 5 s Restzeit) → Zwang zum schnellen Wurf | M (zweite Uhr in der Anzeigetafel) |
| B6 | Stolpernder Verteidiger | Selten rutscht ein Verteidiger aus → freie Bahn | M (Ausrutsch-Animation) |
| B7 | Späte Hilfe | Hilfsverteidiger reagiert zufällig zu spät oder zu früh | D |
| B8 | Zu früher Steal-Versuch | Verteidiger springt in den Passweg und ist dann aus dem Spiel | M |
| B9 | Absichtliches Foul | Wenn man vorne liegt, foult der Gegner sofort → Freiwürfe unter Druck (Publikum lauter) | M |
| B10 | Foul-Probleme | Ein Verteidiger hat 5 Fouls, geht keinem Kontakt nach → leichter Weg zum Korb | D |
| B11 | Zufällige Aufstellung | 5 aus den 10 Spielern, Verteidiger passend zugeordnet | D |
| B12 | Müdigkeit | Letzte Minute: Spieler etwas langsamer, Meter minimal schneller | M |
| B13 | Overtime | Statt 4. Viertel manchmal Verlängerung, eigene Einblendung | D |
| B14 | Hot Hand im Spielzug-Labor | Heißlaufen (3 Treffer in Folge) wie im Wurf-Labor | M (bereits im Wurf-Labor gebaut) |

## C. Rahmen

| Nr | Name | Wirkung | Aufwand |
|---|---|---|---|
| C1 | Mini-Spiel | 8–12 Angriffe am Stück mit echtem Spielstand; Gegner punktet dazwischen automatisch (zufällig 0/2/3) | G |
| C2 | Taktiktafel | Vor dem Angriff kurze Timeout-Tafel mit den Laufwegen des Spielzugs | M |
| C3 | Spielzug-Auswahl | Vor dem Angriff 2 Spielzüge zur Wahl („Coach-Call“) | M |
| C4 | Situation des Tages | Feste Herausforderung (z. B. „−3, 6 s, Gegner switcht alles“) | M |

## Vorschlag Reihenfolge

1. B3, B4, B7, B10, B11, B13 (nur Daten/Zufall – sofort mehr Abwechslung)
2. A1, A3, A6, A12, A15, A16, A22, A24 (neue Spielzüge nur aus Daten)
3. B1 + B2 (Verteidigungstaktiken – größter Unterschied im Spielgefühl)
4. A2, A14, A18 (neue Mechaniken)
5. C1 Mini-Spiel

## Gemeinsame Regeln für alle neuen Spielzüge

- Jeder Spielzug endet garantiert (Zeitlimit je Phase), wie die bestehenden.
- Jede Verteidigungs-Variante hat ein Gewicht; die Wahl läuft über die Engine-rng (deterministisch im Modus „Verteidigungs-Zufall aus“).
- Alle Mitspieler bleiben anspielbar; Lob nur dort, wo es realistisch ist.
- Im Labor-Menü unter „Spielzug“ einzeln wählbar, „Zufall“ wählt aus allen.
- Tests: pro Spielzug × Variante × Option erreicht die Engine `ended` (wie bisher).
