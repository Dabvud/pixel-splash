Alle sechs gemeldeten Fehler wurden im Node-Ersatzlauf reproduziert und behoben. Zwei Fälle benötigen dieselbe Codekorrektur an der Kamerazeit; vier Tests schreiben Annahmen des alten Zeit-/Foulmodells fest und wurden angepasst. Spezifikation und Erweiterungen bleiben unverändert.

| Test | Ursache | Änderung |
| --- | --- | --- |
| `play-lab.test.ts`: „zeigt nach tap alle Abschlussbilder und hält finishCameraPose bis result (halten=false)“ | Echter Codefehler: `advanceTo()` verarbeitet beim Loslassen die gesamte aktive Zeit seit dem letzten Schritt. Die Kamera erhielt beim nächsten Rendern jedoch höchstens 100 ms aus der separat begrenzten Framezeit. Nach dem Sprung zum idealen Release lag ihr Sichtfeld deshalb noch bei 53,499° statt nahe 50°. | `src/modes/play-lab.ts`: Die Kamera verwendet die Differenz der aktiven Millisekunden seit dem letzten Bild. Auch Zeit, die ein Eingabeereignis bereits simuliert hat, geht vollständig in die Kamerafahrt ein. Pause und verworfene Hintergrundzeit erhöhen diese Uhr nicht. Die bestehenden Prüfungen für Sichtfeld, Achse, Höhe, sämtliche Animationsbilder, Mindestdauer und Punkte bleiben unverändert. |
| `play-lab.test.ts`: derselbe Test mit `(halten=true)` | Derselbe Zeitfehler bei vorher aufgelegtem Finger. Der Abschluss lief korrekt, während die Kamera zeitlich zurückblieb. | Dieselbe Codekorrektur; auch dieser Test bleibt vollständig unverändert. |
| `engine-arrow.test.ts`: „wendet Positions-, Foul-, Kontakt- und Lobfaktor genau einmal an und endet ohne Tipp mit GEBLOCKT“ | Überholte Annahme: Der Test erzwingt ein Foul und wartet nach dem Meter-Timeout auf `ended`, ohne Freiwürfe auszuführen. Bindend bleibt das angekündigte Foul erhalten: `GEBLOCKT`, null Punkte und zwei Freiwürfe. Freiwürfe warten ohne Zeitlimit auf Eingabe. | Der umbenannte Test prüft weiterhin das exakte Produkt aller vier Zonenfaktoren. Zusätzlich prüft er das Fehlversuch-Ereignis, Banner und Schützen sowie genau zwei Freiwürfe, wartet zehn Sekunden ohne Eingabe und führt anschließend beide Nutzer-Kombis bis `ended` aus. Kein Eingriff in die Foulregeln. |
| `engine-all-teammates.test.ts`: „berücksichtigt den zusätzlichen Pass bei der KI-Wahl und spielt ihn mit q = 0,5“ | Überholte Echtzeitannahme: `step(s, 4, …)` simuliert vier Echtsekunden, bei Zeitlupe 0,3 also nur 1,2 Spielsekunden. Das Entscheidungsfenster dauert vier Spielsekunden, entsprechend 13⅓ Echtsekunden. Zusätzlich waren Fenster und Vorlauf widersprüchlich mit 4 / 2,5 konfiguriert. | Gemeinsame Testkonfiguration auf `decisionLead = decisionS = 4` vereinheitlicht. Der Test prüft explizit, dass unmittelbar vor Fensterende kein Pass erfolgt; exakt bei vier Spielsekunden muss der KI-Pass zu #11 erfolgen. Die Qualitätsprüfung `q = 0,5` bleibt. |
| `engine-all-teammates.test.ts`: „führt begonnene Wege samt Variantenwegen nach zusätzlichen Pässen ohne Zurückspringen zu Ende“ | Die Testhilfe setzte `decisionS = 100`, um Entscheidungen zu unterdrücken. Seit der Fensterkorrektur streckt dies das 0,2-s-Segment auf 100 Spielsekunden; mit Vorlauf 2,5 öffnet die Entscheidung erst bei 97,5 s. Die 30-s-Spieluhr läuft vorher ab. Der Test erreicht seine eigentliche Wegprüfung gar nicht. | Reguläres viersekündiges Fenster und `decisionAt = 4`, damit die bewusst geprüften Wege mit 0,2 m/s unverändert bleiben. Nach drei zusätzlichen Pässen läuft das Catch-and-Shoot-Meter regulär aus. Erst danach setzt ein aufliegender Finger die normale KI-Wartefrist aus. Alle exakten Zwischenpositionen von Angreifer und Variantenverteidiger sowie beide Endpositionen werden weiterhin geprüft. |
| `engine-all-teammates.test.ts`: „berechnet auch nach einem zusätzlichen Pass den nächsten Fangpunkt aus dem weiterlaufenden Weg“ | Überholte feste Geschwindigkeit: Das kurze Segment wird für das viersekündige Fenster um Faktor 20 gestreckt, einschließlich seiner Wege. Der Test erwartete weiterhin 0,2 m/s, korrekt sind 0,01 m/s. Die gemeldeten 0,027286877 m entsprechen genau der alten Erwartung 0,545737540 m geteilt durch 20. | Der Test prüft die Streckung des Wegendes ausdrücklich und berechnet die erwartete Geschwindigkeit aus dem gestreckten Weg. Die Prüfung gegen die Spielzeit bleibt auf acht Nachkommastellen, ebenso die Vorwärtsbewegung beim Fangen. Die Engine wird nicht auf die alte Zeitachse zurückgesetzt. |

Geänderte Produktivdatei: `src/modes/play-lab.ts`. Geänderte Testdateien: `tests/engine-arrow.test.ts` und `tests/engine-all-teammates.test.ts`. `tests/play-lab.test.ts` wurde nicht verändert. `src/play/engine.ts` wurde nicht verändert; insbesondere bleiben gemeinsame Angreifer-/Verteidigerwege und ihre Segmentversätze sowie das Foul beim Meter-Timeout erhalten. Die parallel bearbeiteten Dateien `src/figure/raster.ts` und `tests/raster.test.ts` wurden nicht verändert. Keine Installation, kein Git, kein Vitest-Start.

Der vorhandene Ersatzläufer `.superpowers/run-targeted-tests.cjs` wurde für die inzwischen hinzugekommenen Testmittel ergänzt: gemeinsame `vi.hoisted`-Werte für Mock-Fabriken und Tests, `MutationObserver` aus jsdom sowie `vi.getTimerCount`. Er verwendet Nodes `stripTypeScriptTypes`, die installierten originalen Assertions aus `@vitest/expect`, Spies aus `@vitest/spy`, Modul-Mocks und jsdom. Dies ist kein nativer Vitest-Lauf und kein vollständiger Repository-Testlauf.

Zusätzlich prüft `.superpowers/probe-six-regressions.cjs` unabhängig vom Testläufer die Produktions-Engine mit Node-Typentfernung. Die Simulation bestätigt das KI-Fenster in Spielsekunden und `q = 0,5`, erklärt den Uhrablauf der alten 100-s-Testhilfe und prüft den Fangpunkt analytisch für Animationstempo 0,5 / 1 / 1,5 bei Frameabständen 1/120 s / 1/60 s / 0,25 s. Für den zweiten Pass bei Empfängerposition x₀ und Geschwindigkeit v = 0,01 m/s gilt `T = (0,49 − 0,06·x₀) / (1 + 0,06·v)`. Geprüft werden Passflug unmittelbar vor dem Fang, Entscheidung unmittelbar danach, kein Rücksprung, Position und exakter Start des Catch-and-Shoot-Meters; Toleranz 1e−10. Alle elf Simulationsfälle bestehen.

| Datei im Ersatzlauf | Bestanden | Fehlgeschlagen |
| --- | ---: | ---: |
| `engine-all-teammates.test.ts` | 66 | 0 |
| `engine-arrow.test.ts` | 58 | 0 |
| `play-lab.test.ts` | 64 | 0 |
| `review-engine.test.ts` | 7 | 0 |
| `engine-finish-feedback.test.ts` | 36 | 0 |
| `engine-decision-lead.test.ts` | 152 | 0 |
| `play-lab-pocket.test.ts` | 14 | 0 |
| `play-camera.test.ts` | 51 | 0 |
| `engine-pocket.test.ts` | 242 | 0 |
| `engine.test.ts` | 207 | 0 |
| **Summe** | **897** | **0** |

Die drei betroffenen Dateien enthalten zusammen 188 bestandene Tests. Die übrigen sieben Dateien prüfen die angrenzenden Regeln und Übergänge. `npx tsc -b` ist fehlerfrei, Exitcode 0.

Reproduzierbare Befehle aus dem Repository:

```powershell
node --disable-warning=ExperimentalWarning .superpowers/probe-six-regressions.cjs
node --disable-warning=ExperimentalWarning .superpowers/run-targeted-tests.cjs tests/engine-all-teammates.test.ts tests/engine-arrow.test.ts tests/play-lab.test.ts tests/review-engine.test.ts tests/engine-finish-feedback.test.ts tests/engine-decision-lead.test.ts tests/play-lab-pocket.test.ts tests/play-camera.test.ts tests/engine-pocket.test.ts tests/engine.test.ts
npx tsc -b
```

Protokolle in `.superpowers`: `six-tests-before.log` und `camera-tests-before.log` reproduzieren die sechs ursprünglichen Fehler; `six-tests-probe.log` enthält die unabhängige Simulation, `six-tests-verified.log` den abschließenden gemeinsamen Ersatzlauf. Der ursprüngliche zusätzliche Fehler in `test.log` ist ein Vitest-Worker-RPC-Timeout (`Timeout calling "onTaskUpdate"`); eine Behebung des nativen Vitest-Runners wird mit diesem Ersatzlauf nicht behauptet.
