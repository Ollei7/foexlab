# Prüfliste Pilot Michelson

Stand: 21.10.2026, iPad-Test durch Oliver am selben Tag. Pilot: Michelson, Abschnitte „Justage des Interferometers“ und „Brechungsindex von Luft bestimmen“.

> Hinweis: Die Kurse `michelson`, `mzifo`, `bb84` und `mzi-photonen` (in `mzi` aufgegangen) liegen unter `archiv/kurse/` und werden nicht mehr gebaut. Die Prüfpunkte unten sind der Stand der damaligen Piloten; für den aktuellen Kurs gelten dieselben Bedienpunkte unter `/mzi/`.

## Testlauf am Mac (ohne Pi)

```bash
python3 engine/build.py --alle
python3 tools/devserver.py
```

- Am Mac: `http://localhost:8000/mzi/`
- iPad und Handy im **selben WLAN** wie der Mac: `http://<IP-des-Mac>:8000/mzi/`. Die IP steht unter Systemeinstellungen → WLAN → Details.

**Status:** ✓ bestanden · ✗ Fehler (mit Notiz) · leer = noch offen.

| # | Prüfpunkt | Gerät | Status | Notiz |
|---|---|---|---|---|
| 1 | Eingaben bleiben nach Neuladen erhalten | Mac-Browser (Chromium) | ✓ | Text, Messtabelle, Skizze geprüft |
| 1 | Eingaben bleiben nach Neuladen und nach Schließen und Öffnen des Tabs erhalten | iPad (Safari) | ✓ | |
| 2 | Warnung im privaten Tab erscheint | iPad (Safari, privater Tab) | zurückgestellt | 21.10.: keine allgemeine Warnung beim Öffnen; eine Meldung erscheint nur beim Foto. Bewusst so gelassen (Oliver): Daten gehen nur beim Schließen des privaten Tabs verloren, PDF bleibt jederzeit möglich. |
| 3 | „Foto aufnehmen“ öffnet die Kamera, „Aus Fotos wählen“ die Mediathek; Foto erscheint und bleibt nach Neuladen | iPad | ✓ | |
| 4 | Skizze mit Apple Pencil und mit Finger; Rückgängig; Radierer | iPad | ✓ | |
| 5 | Diagramm mit den Testdaten 92,3/5 · 184,6/10 · 276,9/15 · 369,2/20 → m = 0,05417 | Mac-Browser | ✓ | |
| 5 | wie oben | iPad | ✓ | |
| 6 | „Protokoll als PDF sichern“ → Teilen-Menü → in Dateien sichern, in GoodNotes öffnen | iPad | ✓ | |
| 7 | „Abholcode erzeugen“ → Code + QR; mit Handy abholen | Mac-Browser + curl | ✓ | PDF über Code heruntergeladen und geprüft |
| 7 | wie oben, Abholen mit iPhone | iPhone | ✓ | |
| 7 | wie oben, Abholen mit Android-Handy | Android | | |
| 8 | Labormodus: dunkel, gedimmt, bleibt nach Neuladen | Mac-Browser | ✓ | |
| 8 | Labormodus im abgedunkelten Raum lesbar | iPad | ✓ | |
| 9 | Querformat und Hochformat: kein seitliches Scrollen | Mac-Browser 1024×768, 768×1024 | ✓ | |
| 9 | Split View neben der Kamera-App | iPad | ✓ | |
| 10 | 20 Geräte gleichzeitig (Probelauf auf dem Pi) | Pi + Router | | |
| 11 | Schritt-Karten: „Nächster Schritt“, Häkchen „Erledigt“ bleiben nach Neuladen | iPad | ✓ | |
| 12 | „Neue Gruppe beginnen“ löscht nach Rückfrage alle Eingaben | iPad | ✓ | |

## BB84 und neues Design: Prüfpunkte für das iPad

Stand: 22.10.2026. Am Mac im Browser durchgespielt (Lernblatt bis Abschluss, Ergebnisseite, PDF angesehen); **nichts davon ist auf dem iPad geprüft**. Aufruf: `http://<IP-des-Mac>:8000/bb84/`. Für „alles frei“ fünfmal auf „foeXlab“ im Kopf tippen (Betreuungsmodus).

| # | Prüfpunkt | Gerät | Status | Notiz |
|---|---|---|---|---|
| B1 | Antwortfeld „Stift“: Schreiben mit Apple Pencil bei eingeschaltetem „Nur Apple Pencil“; der Finger blättert die Seite, zeichnet nicht | iPad | | Striche brechen nicht ab; Hintergrund Linien/Karo |
| B2 | Stiftfeld: Radierer (entfernt ganze Striche), Rückgängig, Wiederholen, „+ mehr Platz“ | iPad | | |
| B3 | Stiftfeld: „Nur Apple Pencil“ aus: der Finger zeichnet; Wechsel zwischen Tippen und Stift behält Text und Striche | iPad | | |
| B4 | Baumdiagramm: Kärtchen antippen, dann Feld antippen; Ziehen mit Finger und Pencil; belegtes Feld antippen legt zurück; seitliches Scrollen im Baum | iPad | | |
| B5 | Würfeln (🎲) in Aufgabe 2 und 3, Markieren grün/rot, „Zeilen in den Schlüssel übernehmen“, Verschlüsseln und Entschlüsseln | iPad | | |
| B6 | Rollenwechsel Alice ↔ Bob ↔ Eve: Daten jeder Rolle bleiben erhalten | iPad | | |
| B7 | Betreuungsmodus: fünf Tipps auf „foeXlab“ im Kopf mit Rückfrage; „Neue Gruppe“ nimmt die Freischaltung zurück | iPad | | |
| B8 | Sperren: „Weiter“ vor einem gesperrten Kapitel zeigt den Grund; gesperrte Karten nach einem Schreibfeld; Rücksprung „← Zurück zu …“ nach „Im Protokoll nachschlagen“ | iPad | | |
| B9 | Quiz-Serien: falsche Antwort zeigt die Erklärung, „Nochmal versuchen“, „Hier nochmal nachschlagen“ | iPad | | |
| B10 | Protokoll-PDF mit Stiftfeldern und Baumdiagramm: Teilen, Abholcode; Seite 1 „Auf einen Blick“ | iPad | | Handschrift als Linien |
| B11 | Neues Design: Schrift Source Sans 3, schmale Kopfleiste, Fortschrittsbalken, kleine Logos; Michelson und MZI unverändert bedienbar | iPad | | Hoch- und Querformat |
| B12 | Offline: Seite ohne Netz öffnen (Schrift ist eingebettet) | iPad | | |

**Am Mac geprüft (Chromium, 1024 × 768):** Start- und Kartenansicht in Michelson und BB84, Labormodus, Stiftstrich per Zeigerereignis, alle BB84-Werkzeuge per Klick, vollständiger Durchlauf mit Freischaltungen, PDF mit vier Seiten angesehen (Seite 1, Kopf mit beiden Logos, Tabellenmarkierungen, Baumdiagramm). 768 × 1024 nur über flexible Layouts, nicht gesondert angesehen.

## Bekannte Lücken

- Die Videos `MI_NG.mp4` (228 MB) und `MI_Final.mp4` (342 MB) fehlen in `archiv/kurse/michelson/media/`, weil sie für den automatischen Export zu groß waren. Für iPads und den Pi sollten sie auf ca. 720p und wenige MB verkleinert werden, z. B. mit HandBrake (Voreinstellung „Fast 720p30“). Danach unter genau diesem Namen ablegen.
- Der Caddyfile wurde nur auf Syntax geprüft, nicht mit Caddy selbst. Er wird erst auf dem Pi getestet.

## Offene Entscheidungen (nach dem Probelauf, mit Task 18)

- MZIFo: Viele Karten sind aus Moodle als `.versteckt` markiert (Wellenlänge, Polarisation, Quantenphysik des Photons) und werden derzeit nicht ausgegeben. Entscheiden: anzeigen, teilweise anzeigen oder ausgeblendet lassen.

## Für die didaktische Überarbeitung (nicht im Pilot korrigiert)

- „Michaelson“ statt „Michelson“ (Abschnitt 01, mehrfach).
- Abschnitt 02, „Messprinzip“: Im Michelson-Kurs steht „mit unserem MZI“ und „Arme des Mach-Zehnder-Interferometers“.
- Abschnitt 02, „Messung“: „\(\Delta n=5\)“ meint die Zahl der Wechsel und sollte \(\Delta N\) heißen; \(n\) ist sonst die Brechzahl.
- Abschnitt 02, Hinweis zur „Theorie zur Auswertung“: `\frac{lambda}{2}` ohne Backslash, die Formel wird deshalb falsch gesetzt.
- Abschnitt 02, „Regressionsüberlegungen“: Tippfehler „durckläuft“.
- **Fachlich unklar**, Abschnitt 02, „Theorie zur Auswertung“: Der Text sagt, ein Wechsel dunkel → hell → dunkel verschiebe die optische Weglängendifferenz der Arme um λ/2. Der Hinweis sagt erst λ, dann λ/2. Richtig ist:
  - Ein Wechsel entspricht einer Änderung der optischen Weglängendifferenz um λ.
  - Weil das Licht die Küvette zweimal durchläuft, ändert sich \(n \cdot L\) dabei um λ/2.
  - Die Formel \(n_{Luft} = 1 + \frac{\Delta N}{\Delta p}\cdot\frac{\lambda}{2L}\,p_0\) ist korrekt; nur der Text sollte das sauber trennen.
