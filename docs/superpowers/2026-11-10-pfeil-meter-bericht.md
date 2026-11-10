# Pfeil-Meter: Umsetzungsbericht

Umgesetzt am 10.11.2026 nach dem letzten Abschnitt der Spielzug-Labor-Spezifikation und der ergänzenden Gestenvorgabe des Nutzers. Zuerst wurden die Tests ergänzt beziehungsweise die zwingend betroffenen Alt-Tests angepasst, danach der Produktivcode. Weitere Randfalltests wurden jeweils vor den dazugehörigen Korrekturen ergänzt. Nichts installiert, kein Git verwendet, Vitest nicht gestartet.

## Geänderte Dateien

| Datei | Änderung |
| --- | --- |
| [src/play/engine.ts](../../src/play/engine.ts) | Öffentliches `arrowMeter` mit Art, Startzeit, Dauer, Zonen und festgehaltenem Tipp-Füllstand; pausierbare `realTime`; Command `tap`; Ereignisse `arrowStart`, `arrowTap`, `arrowEnd`; Lob-Planung und Catch-and-Shoot; gespeicherter Aufsetzzeitpunkt/P; begrenzte Wartezeiten. |
| [src/modes/play-lab.ts](../../src/modes/play-lab.ts) | Tipp erst beim Loslassen bestätigen; Zeit/P beim Aufsetzen sichern; weitere Gestenauswertung dieser Berührung unterdrücken; Catch-and-Shoot-Kurzwisch weiterhin als Ziehen/Pass auswerten; Pfeil auch während Passflug/Kamerafahrt bedienen; HUD und Menüpause anbinden. |
| [src/input/gesture.ts](../../src/input/gesture.ts) | Im Spielzug-Modus gilt ein gehaltener seitlicher Wisch ab 30 px als Abbruch, damit er nicht versehentlich als Pfeil-Tipp zählt. Schnelle Wische bleiben `flick`. Verhalten ohne Spielzug-Optionen bleibt erhalten. |
| [src/ui/hud.ts](../../src/ui/hud.ts) | Optionaler Pfeilmodus an derselben Anzeige, grüner Bereich bleibt erhalten, Release-Markierung bleibt bis zum Ergebnis sichtbar. Standard bleibt der Füllbalken. |
| [src/style.css](../../src/style.css) | Darstellung des wandernden Pfeils `◄`. |
| [tests/engine-arrow.test.ts](../../tests/engine-arrow.test.ts) | Neue Engine-Tests, siehe Namen unten. |
| [tests/hud-arrow.test.ts](../../tests/hud-arrow.test.ts) | Neue HUD-/Gestentracker-Tests, siehe Namen unten. |
| [tests/play-lab.test.ts](../../tests/play-lab.test.ts) | Sechs neue Integrationstests; vorhandene Tests unverändert. |
| [tests/engine.test.ts](../../tests/engine.test.ts) | Gemeinsame Release-Hilfe und vollständige Routen auf den unmittelbaren Pfeilwurf nach dem Fangen erweitern. |
| [tests/engine-pocket.test.ts](../../tests/engine-pocket.test.ts) | Unmittelbare Würfe nach dem Fangen, Lob-Verhalten und Routen an das neue Meter anpassen; Einzelheiten unten. |
| `tsconfig.tsbuildinfo` | Von `npx tsc -b` automatisch aktualisierte Build-Metadaten. |
| Dieses Dokument | Bericht mit Änderungen, Testnamen, Alt-Test-Anpassungen und Prüfstand. |

`src/modes/shot-lab.ts`, Wurfauflösung, Wurfbahnen, Spielzug-Daten, Einstellungen und Abhängigkeiten wurden nicht geändert. Die gemeinsam verwendeten HUD-/Gestenfunktionen behalten für das Wurf-Labor ihr Standardverhalten.

## Neue Testnamen

### tests/engine-arrow.test.ts

- `wertet %s nur mit Timing und denselben effektiven Zonen` — ideal, grün, früh, spät.
- `ignoriert tap außerhalb eines aktiven Meters`.
- `trifft bei Animationstempo %s den Idealpunkt beim Fangen, auch bei q = 0` — 0,5 / 1 / 1,5.
- `wertet einen Tipp vor dem Fangen erst mit dem Empfänger aus`.
- `beendet ohne Tipp mit VOM RING statt einer wartenden Abschluss-Kombi`.
- `wendet Positions-, Foul-, Kontakt- und Lobfaktor genau einmal an und endet ohne Tipp mit GEBLOCKT`.
- `startet bei einem kürzeren Lob frühestens beim Abspiel`.
- `würfelt das Tempo einmal beim Start und aktualisiert die Zonen bis zum Tipp mit dem aktuellen P`.
- `startet erst nach der Pass-Verzögerung und nur mit Wurfoption`.
- `friert P beim Aufsetzen ein und bestätigt den Tipp erst beim Loslassen`.
- `beendet den Pfeil beim Kurzwisch für %s` — drive / pass.
- `beginnt die normale Entscheidungsfrist erst nach dem Durchlauf`.
- `nutzt bei Zeitlupe %s Echtzeit und pausiert bei dt = 0` — 0,2 / 0,5, zusätzlich Animationstempo 0,5.
- `begrenzt eine nie beendete Pfeil-Berührung`.
- `wechselt nach einem getroffenen Pfeilwurf mit Foul zu Freiwürfen mit normaler Halte-Kombi`.
- `bewahrt einen rechtzeitigen Tipp über das Meterende hinaus und wertet seinen ursprünglichen Füllstand`.
- `akzeptiert Aufsetzen nach %s ms nur strikt vor 0:00, auch bei späterem Loslassen` — 99 / 100 / 101 ms.
- `Pfeil-Routen <Spielzug>/<Variante> > erreicht mit Pfeil-Tipps = %s ended` — alle Spielzüge/Varianten, mit und ohne Tipp.

### tests/hud-arrow.test.ts

- `bewegt den Pfeil statt des Balkens und hält die Tipp-Markierung bis zum Ausblenden`.
- `liefert einen schnellen Wisch ab %s px weiterhin als flick` — 30 / 50 px.
- `wertet einen gehaltenen seitlichen Wisch ab 30 px nicht als Tipp`.

### tests/play-lab.test.ts

- `bestätigt den Pfeil-Tipp beim Loslassen mit Aufsetzzeit und hält seine Markierung fest`.
- `unterdrückt hold und release derselben Pfeil-Berührung und lässt danach normale Kombis zu`.
- `lässt einen schnellen 30-px-Wisch während Catch-and-Shoot sofort ziehen, auch während der Kamerafahrt`.
- `pausiert den Pfeil und verwirft einen noch unbestätigten Tipp beim Menüöffnen`.
- `verliert nach einem 500-ms-Frameaussetzer keine Pfeil-Echtzeit`.
- `erlaubt den Lob-Tipp während des Passflugs und unterdrückt hold derselben Berührung`.

## Anpassungen bestehender Tests

### tests/engine.test.ts

- Hilfe `release`: Bei einem aktiven Pfeil wird jetzt `tap` gesendet; für einen perfekten Versuch wird zuvor bis zum Idealpunkt fortgeschrieben. Für normale Wurf-/Abschluss-/Freiwurf-Kombis bleibt die bisherige Hilfe erhalten. Davon betroffen ist insbesondere `wechselt Kontrolle beim Fangen, setzt Assist und ignoriert Eingaben unterwegs`: Der erfolgreiche Wurf unmittelbar nach dem Pass nutzt jetzt Catch-and-Shoot. Die bisherigen Assertions bleiben bestehen.
- Parametrisierter Test `erreicht mit allen Folgeentscheidungen innerhalb von 30 Sekunden ended`: Die unmittelbar auf den Pass folgende Wurfoption nutzt das Pfeil-Meter. Routenlänge, Ende-Frist, perfekte/verfehlte Varianten sowie Ball-/Figurenprüfungen bleiben bestehen. Lob-Abschlüsse nutzen die erweiterte Release-Hilfe.

### tests/engine-pocket.test.ts

- Hilfe `shootP`: Ermittelt das eingefrorene P nach dem Fangen mit `tap` anstelle von `comboStart`. Das betrifft die unveränderten Vergleichsassertions in `kann bei festem RNG einen mittelguten Pass freier lassen als einen perfekten`, `verwendet Startversatz und Endabstand unabhängig voneinander` und `liefert im Mittel über 200 RNG-Seeds höheres P für q = 1 als q = 0,3`; außerdem den Vergleichswert in dem folgenden Verzögerungstest.
- `lässt den Empfänger beim perfekten Pass sofort werfen, auch ohne quality-Feld`: Erwartet Catch-and-Shoot und nach `tap` die Phase `ballflight`, statt nach `comboStart` die Phase `combo`.
- `sperrt bei q = 0 alle Aktionen für exakt 0,6 Spielsekunden und senkt P`: Nur der Wurf direkt nach der Verzögerung wurde von `comboStart` auf `tap` umgestellt. Die unveränderten Assertions zur exakten Verzögerung und zur Eingabesperre bleiben erhalten.
- `nutzt passDelayMax = 0 und verändert bei fehlendem Closeout-Regler den alten RNG-Ablauf nicht`: Die bisherige Funktion, die jeden RNG-Aufruf beim Fangen verbot, wurde durch eine Zählung ersetzt. Genau zwei Aufrufe sind jetzt nötig: Foul-Los und Tempo für das neu startende Catch-and-Shoot-Meter. Die Pass-/Closeout-Zufallsentscheidungen erhalten keine zusätzlichen Aufrufe.
- Bisher `wartet auch beim ungenauen Lob vor der Abschluss-Kombi und beendet bei Uhrablauf`, jetzt `fängt auch den ungenauen Lob direkt am Idealpunkt und beendet ohne Tipp`: Erwartet `takeoff` mit Alley-oop-Meter und vorbereiteten Abschlusswerten sowie abschließend `VOM RING`. Die alte Empfangswartezeit widerspräche dem neuen Lob-Idealpunkt beim Fangen.
- `verändert bei q = 1 und Closeout-Zufall 0 die Fangposition des Verteidigers nicht`: Nur der unmittelbar folgende Wurfstart wurde zu `tap` geändert; Positions-/P-Assertions bleiben bestehen.
- `Pocket-Route <Route> > erreicht weiterhin ended`: Unmittelbare Wurfoptionen nach einem Pass sowie Lob-Abschlüsse nutzen `tap`. Die gesamte bestehende Matrix aus Spielzügen, Varianten, Folgeoptionen und q = 0 / 0,3 / 1 sowie die Assertions für Ende und Routenlänge bleiben erhalten.

Keine weiteren bestehenden Tests wurden angepasst.

## Auslegung und Abweichungen

- Die ergänzende Nutzervorgabe ersetzt die sofortige Auslösung beim Aufsetzen: Die Engine sichert beim Aufsetzen Zeit und P; `tap` wird beim Loslassen ohne Wisch bestätigt. Während derselben Berührung startet keine Halte-Kombi. Ein schneller Catch-and-Shoot-Wisch ab 30 px geht weiterhin durch die bestehende Zielwahl für Ziehen/Pass.
- Beim Lob entfällt die frühere Empfangsverzögerung: Der Abschluss ist beim Fangen bereit; die Passgenauigkeit wirkt weiterhin über den Lob-Zonenfaktor. Das ist erforderlich, damit Fangen und Idealpunkt zusammenfallen.
- Beim Catch-and-Shoot wird die tatsächliche Meterdauer einmal beim Meterstart mit dem dann vorhandenen P ausgewürfelt. P für Foul und Zonen wird beim Aufsetzen eingefroren; bis dahin aktualisiert das HUD dieselben effektiven Zonen, die auch die Auflösung verwendet. Die laufende Meterdauer wird beim Tipp nicht nachträglich verändert.
- Beim Lob werden Dauer und Abschlusswerte anhand des berechneten Fangpunkts und der dort vorhergesagten Verteidigerpositionen vorbereitet. Der Start ist Fangzeit minus tatsächliche Meterdauer in Echtzeit, frühestens beim Abspiel. Bei einem Passflug kürzer als die Meterdauer greift entsprechend der Spezifikation diese Untergrenze; ein früherer Start wird nicht erfunden.
- Eine rechtzeitig aufgesetzte, noch unbestätigte Berührung darf das Meterende überbrücken. Nach spätestens einer zusätzlichen Entscheidungsfrist wird sie verworfen; das Meter kann keine Route dauerhaft blockieren.
- Keine weiteren beabsichtigten Abweichungen. Keine echte Browser-/WebGL-Sichtprüfung durchgeführt.

## Prüfung

- `npx tsc -b`: erfolgreich, Exitcode 0, keine Diagnosen.
- Vitest: absprachegemäß nicht ausgeführt; die Ausführung übernimmt der Nutzer.
- Ergänzende Engine-Durchläufe über Node ohne Vitest und ohne Installation: 450 Kombinationen aus Spielzügen, Varianten, Folgeoptionen, Passgenauigkeit und Tipp-/Timeout-Verhalten erreichten `ended`; alle geprüften Ballpositionen blieben endlich.
- Ergänzende Engine-Prüfungen: perfektes/frühes/spätes Timing, Lob-Fangsynchronität bei verschiedenen Animationstempi, 99/100/101-ms-Uhrgrenze, gespeichertes Aufsetz-P und unveränderte 0,6-Spielsekunden-Empfangsverzögerung erfolgreich.
- Ergänzende DOM-Prüfungen über vorhandenes jsdom, mit nachgebildetem Renderer/Gesteneingang: stehender Pfeil und Markierung nach verzögertem Tipp, Hold-/Release-Unterdrückung, normale Folge-Kombi, 30-px-Kurzwisch zum Ziehen während der Kamerafahrt, Menüpause und Lob-Tipp im Passflug erfolgreich. Diese Prüfungen ersetzen keinen vollständigen Vitest-Lauf oder eine WebGL-Sichtprüfung.
