# Vorhandene Werkzeuge (Simulationen)

Werkzeuge sind JavaScript-Dateien in `kurse/<kurs>/werkzeuge/`; im Kurstext: `### Titel {.werkzeug name="<art>" … #id}`.
Schnittstelle und Regeln: `docs/FORMAT.md`, Abschnitt „Werkzeug-Schnittstelle“. Diese Liste von Hand pflegen: Jedes neue Werkzeug unter `kurse/*/werkzeuge/` (außer `*kern*.js`) bekommt hier einen Eintrag – ein Test (`tests/py/test_skill_beispielkurs.py`) prüft das.

## Reihenfolge der Wahl

1. **Vorhanden:** passt ein Werkzeug unten genau? → in den eigenen Kurs kopieren (siehe „Kopieren“).
2. **Variante:** passt es fast (andere Schwelle, anderer Text, ein Modus mehr)? → kopieren und in der Kopie ändern, Test anpassen.
   Unterscheidet sich nur eine Zahl (Brechzahl, Masse, Schwelle) und liest das Werkzeug sie als Attribut (Vorlage: `k.n`), keine Kopie: dasselbe Werkzeug zweimal im Kurs mit anderem Attribut (`n="1.33"`). Ein Werkzeug aus der Vorlage im **eigenen** Kurs bekommt so ein Attribut direkt (siehe `simulation-vorlage/LIESMICH.md`, Schritt 3).
3. **Neu:** nichts passt → aus `referenz/simulation-vorlage/` bauen (dort `LIESMICH.md`), nie frei.
4. **Platzhalter:** soll (noch) nicht gebaut werden → `### Simulation … {.platzhalter}` mit einem Absatz, was sie können soll.

## Kopieren (Pflicht, auch bei unveränderter Übernahme)

- Werkzeugdatei **und** jede Datei mit `kern` im Namen, die sie braucht, nach `kurse/<id>/werkzeuge/` kopieren. Alle mzi-Werkzeuge brauchen `mzikern.js` (sie beginnen mit `M = FX.mzi`).
- Die Kopie gehört dem neuen Kurs. Das Original in `kurse/mzi/` **nie** ändern – auch nicht „nur kurz“.
- Test mitkopieren: die Testdatei aus der Tabelle nach `tests/js/<id>/`, darin `kurse/mzi/` durch `kurse/<id>/` ersetzen und Testfälle für nicht kopierte Werkzeuge löschen. `require('../helfer')` bleibt.
- Manche Tests laden mehrere Werkzeuge in einer gemeinsamen Funktion `umgebung()` (z. B. lädt `aufbau.test.js` `mzikern.js`, `vorhersage.js` **und** `aufbau.js`): entweder alle geladenen Werkzeuge mitkopieren oder in `umgebung()` die `ladeDatei`-Zeilen der nicht kopierten entfernen.
- Werkzeuge, die andere Felder lesen (`vorhersage=`, `quelle=`, `vorher=` …), bekommen die Feld-ID des eigenen Kurses: `abschnitt/karte/feld` (Abschnitt = Dateiname ohne Nummer, z. B. `01-messung.md` → `messung`).
- Schwellen (Photonenzahlen, Anzahl Messreihen) stehen in `EINST` oben in `mzikern.js`; in der Kopie ändern ist eine Variante.

## Regeln für Varianten und neue Werkzeuge

- JavaScript ES2017: kein `?.`, kein `??`, kein `import`/`export`; Datei bleibt `(function (root) { … })(typeof self !== 'undefined' ? self : this);`.
- Gespeichert wird nur über `wert`/`laden`; kein `localStorage`, kein eigenes Speichern.
- `change` (bubbles) erst nach einer Handlung oder am Ende einer Animation; währenddessen Knöpfe/Regler sperren, `wert` bleibt gleich.
- SVG nur mit festen Farben (`#3F9AD6`, `#33416E`, `#F58411`, `#222222`), nie `var(--…)` oder `currentColor`.
- Jedes Werkzeug hat einen Test in `tests/js/<id>/`, der `werkzeuge/<name>.js` lädt; sonst meldet `kurs_pruefen` „hat keinen Test“.

## Liste (Kurs `mzi`, Kern `mzikern.js`)

| Werkzeug | Zweck | Konfig | Test in `tests/js/mzi/` |
|---|---|---|---|
| `vorhersage` | Hypothese: zwei Prozentwerte (Detektor 1/2, Summe 100 %), Plus/Minus in 5er-Schritten; wird festgehalten | – | `aufbau.test.js` |
| `aufbau` | Einzelphotonen-MZI, Aufbau 1–3; 1/100/1000 Photonen senden, Tabelle/Diagramm, Vergleich mit der Vorhersage | `modus="1"\|"2"\|"3"`, `vorhersage="<feld-id>"` | `aufbau.test.js` |
| `phasendifferenz` | Phasendifferenz Δφ je Detektor: Kurzabfrage, bei Fehler Tabelle der Phasensprünge | `modus="schirm"` (Laser, Schirme statt Detektoren) | `phase.test.js` |
| `spiegel` | Spiegel verschieben: Δφ 0–360° per Regler, 1000 Photonen messen, Diagramm mit optionalem theoretischem Verlauf | – | `phase.test.js` |
| `polskizze` | Skizze des Aufbaus mit Polarisationsfiltern; Fragetext wird Bildunterschrift; nur Anzeige | – | `polskizze.test.js` |
| `dcaufbau` | Delayed-Choice-Aufbau mit Zeitleiste, nur Anzeige | – | `dc.test.js` |
| `dceinzel` | Delayed Choice, Einzelmessungen: Photon senden, Zufallsgenerator wählt Strahlteiler 2 | – | `dc.test.js` |
| `dcmessreihe` | Delayed Choice, Messreihen à 1000 Photonen, bei Δφ = 0° oder per Regler | `modus="s2"\|"s3"`, `vorher="<feld-id s2>"` (bei s3), `nachher="<feld-id s3>"` (bei s2) | `dc.test.js` |
| `dcsortieren` | Messreihen „drin“/„draußen“ zuordnen und mitteln | `quellen="<feld-id s2>,<feld-id s3>"` | `dc2.test.js` |
| `dcdurchlauf` | Messdurchlauf Δφ 0–360° im Zeitraffer; meldet auch die Art `dcergebnis` an | – (mzi schreibt `modus="lauf"`, ohne Wirkung) | `dc2.test.js` |
| `dcergebnis` | (in `dcdurchlauf.js`) zeigt die Diagramme eines Messdurchlaufs noch einmal, nur Anzeige | `quelle="<feld-id des Durchlaufs>"` | `dc2.test.js` |
| `zitat` | zeigt eine frühere Vermutung als Zitat (Text oder Stiftschrift), nur Anzeige | `quelle="<feld-id der Vermutung>"` | `dc2.test.js` |

Beispiele aus `kurse/mzi/abschnitte/`:

```
### Aufbau 1: Hypothese {.werkzeug name="vorhersage" sperrt #a1-pred}
### Aufbau 1: Überprüfen {.werkzeug name="aufbau" modus="1" vorhersage="drei-aufbauten/k1-a1/a1-pred" sperrt #a1-mess}
### Phasensprünge {.werkzeug name="phasendifferenz" modus="schirm" sperrt #sphase}
### Spiegel verschieben: Überprüfen {.werkzeug name="spiegel" sperrt #ph-mess}
### Skizze zum Aufbau {.werkzeug name="polskizze" #pol-skizze}
### Schritt 3: Messreihen bei anderen Phasendifferenzen {.werkzeug name="dcmessreihe" modus="s3" vorher="delayed-choice/k3-s2/s2" sperrt #s3}
### Schritt 4: Sortieren und mitteln {.werkzeug name="dcsortieren" quellen="delayed-choice/k3-s2/s2,delayed-choice/k3-s3/s3" sperrt #s4}
### Ergebnis des Messdurchlaufs {.werkzeug name="dcergebnis" quelle="delayed-choice/k3-s5/s5" #erg-anzeige}
### Vorhersage {.werkzeug name="zitat" quelle="delayed-choice/k3-motiv/dc-hyp" #zitat}
```

## Werkzeuge anderer Kurse

Hier trägt jeder Kurs mit eigenen (neuen oder abgewandelten) Werkzeugen eine Zeile ein, im selben Commit wie das Werkzeug. Name in Backticks, sonst erkennt der Test den Eintrag nicht. Das erste echte Werkzeug **ersetzt** die Zeile „(noch keine)“; jedes weitere kommt als neue Zeile darunter. Zusatzattribute (z. B. `n`) in der Spalte „Konfig“ nennen.

Format einer Zeile (Beispiel, noch kein echtes Werkzeug):

```
| `brechung` | `brechung` | Einfallswinkel per Regler, Brechungswinkel messen (aus der Vorlage) | `min`, `max`, `schritt`, `n` (Brechzahl, Standard 1.5) | `tests/js/brechung/brechung.test.js` |
```

| Werkzeug | Kurs | Zweck | Konfig | Test |
|---|---|---|---|---|
| (noch keine) | | | | |

## Beispiel aus der Vorlage

`referenz/beispielkurs/werkzeuge/pendel.js` (Art `pendel`): Regler Fadenlänge, Skizze, „Messwert übernehmen“ → Periodendauer. Zeigt, wie eine Vorlage-Kopie aussieht (nur `ART`, `f(x)`, `skizze` geändert), Test in `referenz/beispielkurs/tests/js/pendel.test.js`.

```
### Simulation: Fadenlänge {.werkzeug name="pendel" min="10" max="100" schritt="10" einheit="cm" groesse="Fadenlänge" sperrt #sim-laenge}
```
