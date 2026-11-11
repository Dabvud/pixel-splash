# Umsetzung: Neue Animationen

Der Erweiterungsabschnitt vom 11.11.2026 ist umgesetzt. Tests wurden vor dem Produktivcode ergänzt. Keine Installation, keine Git-Befehle, kein Vitest-Aufruf.

Die 16 neuen Bewegungen haben jeweils acht Bilder. Die vier Dribbel-Moves laufen mit 20 fps in 0,4 Spielsekunden und wechseln danach zu `dribble_run`. Die übrigen neuen Bewegungen laufen mit 10 fps. Zwei bis vier anatomisch definierte Phasen werden über Winkel in acht Schlüsselposen abgetastet; damit behalten auch Spin und große Armbewegungen ihre Segmentlängen. Die bisherigen Bewegungen behalten ihre Bildzahlen und Bildraten.

Die Engine hält die sichtbare Variante getrennt von `ShotKind`. Treffer-, Foul-, Positions-, Steal- und Zonenformeln bleiben bestehen. Alle neuen Zufallsauswahlen verwenden das übergebene `rng`. Als Grenze zwischen Außenwurf und zonennahem Wurf dient ein Korbabstand von 4 m. Reverse-Layups tragen den Körper unter dem Korb auf die Gegenseite. Kontakt-Treffer zeigen gemeinsamen Sprung, Kontakt am Ringbild, Rückstoß und anschließend `knocked_down`. Ergebnis-Animationen laufen nach `ended` weiter; Spieluhr und Spielzeit bleiben stehen.

**Geänderte Dateien**

| Datei | Änderung |
|---|---|
| `src/figure/moves.ts` | Alle neuen Posen, überarbeiteter Kontakt-Dunk, Winkelabtastung und Bodenkontakt |
| `src/play/engine.ts` | Auswahlregeln, Varianten und Übergänge, Reverse-Bahn, Kontakt und Sturz, Passbahnen, Endreaktionen und Zusammenlaufen |
| `src/figure/atlas.ts` | Aufteilung auf Atlas-Seiten mit höchstens 4096 × 4096 Pixeln; Texturzuordnung pro Akteur |
| `src/render/actors.ts` | Richtige Atlas-Seite pro Sprite, anatomisch passende Spiegelung zur Zugseite |
| `src/modes/play-lab.ts` | Zugseite weitergeben, Endreaktionen abspielen, Poster-Zeit weiterführen, alle Atlas-Seiten freigeben |
| `tests/engine-animations.test.ts` | Neue Auswahl-, Ballbahn-, Übergangs- und Endzustandstests |
| `tests/moves.test.ts` | Neue Bewegungen in alle Anatomieprüfungen aufnehmen; zusätzliche charakteristische Posen prüfen |
| `tests/actors.test.ts` | Spiegelung und Ansichtswechsel in allen vier Richtungen |
| `tests/canvas-textures.test.ts` | Größenlimit je Spielzug und Texturzuordnung über Seitengrenzen |
| `tests/engine.test.ts` | Zwei zwingend geänderte Erwartungen an die sichtbare Variante |
| `tests/engine-finish-feedback.test.ts` | Offenen Korbleger als `finger_roll` prüfen |
| `docs/superpowers/reports/2026-11-11-neue-animationen.md` | Dieser Bericht |

**Neue Testnamen** (parametrisierte Namen als Vorlagen)

In `engine-animations.test.ts`:

- `Bahn %s / rng %s wählt %s einmal und kehrt in höchstens 0,5 s zu dribble_run zurück`
- `%s wählt %s/%s/%s/%s → %s und erreicht ended` — Ecke, Kreuzung, P unter 0,35, P = 0,35, knapp unter 0,7, P = 0,7 und offen
- `Reverse-Layup trägt den Körper unter den Korb und gibt den Ball rückwärts auf der Gegenseite frei`
- `Bogenpass hat einen höheren Scheitel als der normale Pass`
- `freier Dunk mit rng %s wählt %s und erreicht ended`
- `Wurf (%s,%s), Verteidiger (%s,%s) → %s und ended`
- `Kontakt-Dunk-Treffer zeigt block_jump_hit, Luftkontakt und Abräumen vor knocked_down`
- `celebrate nach Treffer bei Rückstand %s, Mitspieler laufen binnen 1 s zum Schützen`
- `%s hält den Ball bis zur gestreckten Wurfhand`
- `dejected nach %s und ended`
- `Passdistanz %s / Verteidiger (%s,%s) → %s mit Ballbahn und ended` — einschließlich Bodenpass-Mitte y = 0,12 und strikter Grenzen bei 6 m, 9 m und 1,5 m Linienabstand

Weitere neue Tests:

- `zeigt bei den neuen Ballhandling-Moves Handwechsel, Schutz hinter dem Rücken, Drehung und Verzögerung`
- `unterscheidet Euro-Doppelschritt, Reverse, Tomahawk, Rückwärtssprung und Endreaktionen`
- `spiegelt bei Facing %s zur Bahnseite und verwendet Ansicht %s mit passender Tiefe`
- `$id hält alle Atlas-Seiten für seine Akteure innerhalb 4096 × 4096`
- `ordnet jedem Akteur seine Atlas-Seite auch im Sprite-Texturklon zu`

**Angepasste Alt-Tests mit alter/neuer Erwartung**

| Test | Alt | Neu / Begründung |
|---|---|---|
| `enthält genau die Bewegungen der Spec` | 14 IDs | 30 IDs: die 16 neuen Bewegungen kommen hinzu |
| Bildzahl-/Bildraten-/Schlüsselposenprüfung je Bewegung | Nur bisherige 14 Bewegungen; maximal vier Schlüsselposen | Bisherige Werte unverändert; neue Bewegungen acht Bilder, acht abgetastete Posen; vier neue Dribbel-Moves 20 fps, übrige neue Moves 10 fps |
| Kopf-oben-Prüfung | Überkopfhände für jumpshot, layup, dunk, contact_dunk, block_jump erlaubt | Dieselbe Ausnahme zusätzlich für die neuen Abschluss-, Block-, Jubel- und Überkopfpass-Posen; keine neue Ausnahme für Kopf, Ellbogen oder Füße; `knocked_down` bleibt die bisherige Liege-Ausnahme |
| Ellbogen-/Kniebeugung | Vorzeichen in fester z-Richtung | Vorzeichen entlang der mit den Schultern gedrehten Körperachse; nötig für `spin_move`, bei bisherigen Posen äquivalent |
| `%s erreicht im rimFrame den Ring mit Ball an der Hand` | Freier Dunk mit rng = 0,99 zeigt `dunk`; Handreferenz aus `dunk` | `two_hand_dunk` und dessen Handreferenz; Kontakt-Dunk-Erwartung bleibt gleich |
| `animiert Sprungwurf, Block-Sprung und Foulkontakt mit Höhe` | Nah verteidigter Außenwurf zeigt `jumpshot` | `step_back`; Höhe, Block-Sprung und Foulkontakt weiterhin unverändert geprüft |
| `%s zeigt nach kurzem tap alle Bilder 0…rimFrame in normaler Spielzeit vor result` | Offener Korbleger zeigt `layup` | `finger_roll`; weiterhin alle acht Bilder, identisches Release-Bild 7 und vollständige Laufzeitprüfung; dunk/contact_dunk bleiben unverändert |

Alle bestehenden Prüfungen für ±5 % Gliedmaßenlänge, Boden, Ballhand und Bildzahl gelten auch für die neuen Bewegungen. Es wurden keine Treffer- oder Regelerwartungen abgeschwächt.

**Prüfung**

`npx tsc -b`: erfolgreich, Exitcode 0. Vitest wurde wie gewünscht nicht ausgeführt; dessen Ausführung bleibt beim Nutzer.

Zusätzlich wurde ein Node-Prüfskript außerhalb des Repos ausgeführt: 254 direkte Prüfungen erfolgreich, keine Fehler. Darin enthalten: alle 150 ursprünglichen Datenrouten aus Spielzug × Verteidigungsvariante × Entscheidungen × Treffer/Fehlwurf bis `ended`, 72 Abschluss-/Lob-Konstellationen mit Foulmultiplikator 0/2, Timing 0/1/1,4 und Animationstempo 0,5/1,5, alle neuen Auswahlarten, Anatomie, Atlas-UVs und Sprite-Texturzuordnung. Diese Prüfung ersetzt keinen Vitest-Lauf.

Gemessene Atlas-Seiten für die Akteure des jeweiligen Spielzugs:

| Spielzug | Seiten |
|---|---|
| Pick & Roll | 4096 × 3840, 4096 × 448 |
| Fast Break | 4096 × 2176 |
| Kick-out | 4096 × 3840, 4096 × 448 |
| Inbound | 4096 × 3840, 4096 × 448 |

**Optische Prüfung**

Bildbogen: `C:\Users\trill\AppData\Local\Temp\pixel-splash-neue-animationen.png`.

Erzeugt mit `C:\Users\trill\AppData\Local\Temp\pixel-splash-animation-review.cjs`, unter Verwendung von `src/figure/raster.ts`, für sämtliche neuen Bewegungen und den überarbeiteten Kontakt-Dunk in `back` und `right`, jeweils alle acht Bilder. Das Skript und die PNGs liegen ausschließlich im Temp-Ordner. Ballpositionen sind orange markiert. Die Posen wurden selbst visuell anhand des Bildbogens und seiner drei Detailausschnitte geprüft: Schrittfolge und Kniehub, seitlicher Euro-Schritt, geschütztes Ballhandling, vollständige Drehung, rückwärtiges Reverse-Release, Tomahawk-Ausholen, beidhändiges Hängen, Rückwärtsverlagerung beim Wurf, Jubel und Hände auf den Knien sind erkennbar. Kleine Bodenunterschreitungen und der Platzbedarf der gebückten Pose wurden vor der abschließenden Rasterung korrigiert.
