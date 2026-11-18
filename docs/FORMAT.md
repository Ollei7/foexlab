# Schreibweise der Kurs-Dateien

Ordner je Kurs: `kurse/<kurs>/` mit `kurs.yml` (Titel, `id`, `musterloesungen`), `abschnitte/NN-name.md` (ein Abschnitt je Datei, Reihenfolge = Dateiname) und `media/` (Bilder, PDFs, Videos, HTML). Generator und Layout liegen in `engine/`.

Bauen (im Ordner `foexlab/`):
- `python3 engine/build.py kurse/mzi` → `dist/mzi/` (Ordner für den Pi)
- `python3 engine/build.py kurse/mzi --einzeldatei` → `dist/mzi.html` (eine Datei, ohne Abholcode)
- `python3 engine/build.py --alle` → alle Kurse + Startseite `dist/index.html`

Testen am Mac: `python3 tools/devserver.py`, dann `http://localhost:8000/`.

## Gliederung
```
---
titel: "Justage des Interferometers"
nr: 1
---
Optionaler Text unter der Abschnittsüberschrift.

## Name der Aktivität {.test}          ← Test (auch: .aufgabe, .material; zusätzlich .versteckt, .einbetten)
Einleitungstext des Tests.

### Name der Frage {.mc}               ← Frage bzw. Textbaustein (.info)
Fragetext in Markdown, Formeln mit \( ... \)

:::antworten
...
:::
:::hinweis
Rückmeldung/Lösungshinweis, erscheint nach „Prüfen“
:::
```
`:::richtig`, `:::teilweise`, `:::falsch` – optionale Rückmeldungen je nach Ergebnis.
HTML-Kommentare `<!-- … -->` sind Notizen für Autoren und erscheinen nirgends.

## Fragetypen
| Kürzel | Zweck | Antwortblock |
|---|---|---|
| `{.info}` | reiner Text im Test (keine Frage, keine Nummer) | – |
| `{.frei}` | Freitext (keine Auswertung, `:::hinweis` = Musterlösung) | – |
| `{.mc}` / `{.mc .mehrfach}` | Multiple Choice | `:::antworten` mit `- [x] richtig \|\| Feedback`, `- [ ] falsch`, Teilpunkte `- [50%] …` |
| `{.luecke}` | Lückentext mit Auswahllisten | im Text: `{{richtig\|falsch1\|falsch2}}` – **erste** Option ist richtig |
| `{.zuordnung}` | Zuordnen | `:::paare` mit `Begriff => Zuordnung`; `=> Ablenker` ohne linke Seite |
| `{.kurz}` (`.gross` = Groß/Klein beachten) | Kurzantwort | `:::antworten`: `= Antwort \|\| Feedback`, `= [50%] teilweise`, `*` als Platzhalter |
| `{.zahl einheit="cm"}` | Zahleneingabe | `:::antworten`: `= 1.3 ± 0.05` |
| `{.bildzuordnung bild="datei.png"}` | Beschriftungen auf Bild | `:::marken`: `x,y = Label` (Pixel), `= Ablenker` |
| `{.bildzuordnung ziehen bild="schema.svg"}` | wie oben, aber die Beschriftungen werden als Bausteine aus einer Ablage auf die Plätze **gezogen** (Finger, Stift, Maus) oder erst der Baustein, dann der Platz angetippt; ein belegter Platz gibt seinen Baustein zurück. Die Auswahllisten bleiben das Datenmodell (Speichern, Prüfen, `sperrt`, `versuche`, Protokoll wie bei jeder Bildzuordnung); gleich beschriftete Plätze sind austauschbar. Die Bausteine haben dauerhaft `touch-action:none` (sonst scrollt der Browser statt zu ziehen). Bei `.svg` wird die Größe aus `viewBox` (sonst `width`/`height`) gelesen, die Koordinaten in `:::marken` sind SVG-Einheiten |

Auswahllisten werden alphabetisch sortiert angezeigt.

## Neue Bausteine (Ergebnissicherung)

Alle Eingaben werden automatisch im Browser gespeichert und erscheinen im Protokoll. Ein Feld erkennt seine Eingaben an der Überschrift. **Überschriften also nicht während eines Labortags umbenennen.** Eine feste Kennung verhindert das Problem: `### Messung {.messtabelle #messung1}`.

| Baustein | Zweck |
|---|---|
| `## Titel {.schritte}` | Anleitung als Schritt-Karten: jede `###` darunter ist ein Schritt (eine Ansicht, „Nächster Schritt“, Häkchen „Erledigt“) |
| `### … {.vermutung}` | Textfeld für eine Vermutung; mit `{.vermutung sperrt}` öffnen sich die folgenden Felder der Karte erst nach einer Eingabe |
| `### … {.mc sperrt}`, `{.luecke sperrt}`, `{.zuordnung sperrt}`, `{.bildzuordnung sperrt}` | **Kontrollfrage** (bei Lücken, Zuordnungen und Bildzuordnungen gilt sie als bestanden, wenn **alle** Auswahllisten richtig sind; „Lösung anzeigen“ stellt jede Liste auf die richtige Auswahl): die folgenden Felder der Karte (und Folgekarten des Kapitels) öffnen sich erst nach einer **richtig geprüften** Antwort, nicht schon bei der Auswahl. Danach sind die Eingaben gesperrt, „Zurücksetzen“ entfällt. Mit `versuche="n"` gilt die Frage nach `n` falsch geprüften Antworten als erledigt: die richtige Antwort wird markiert und der Block `:::nach_versuchen` (Erklärung der Lösung) erscheint. `:::richtig` / `:::falsch` liefern die Rückmeldung nach jeder Prüfung |
| `### … {.messtabelle}` | Messtabelle, Blöcke siehe unten |
| `### … {.foto}` | Foto aufnehmen oder aus der Mediathek wählen |
| `### … {.skizze bild="media/vorlage.jpg"}` | Zeichenfläche (Stift/Finger), optional mit Vorlagenbild |
| `### … {.checkliste sperrt #material}` | Liste zum Abhaken: jeder Listenpunkt (`- …`) im Fragetext wird ein Haken, Status „n von m abgehakt.“ bzw. „Alles da.“. Erledigt (für `sperrt`, Freischaltung `felder:`), sobald **alle** Haken gesetzt sind. Alternativ ein Block `:::liste` mit einer Zeile je Punkt (gewinnt, wenn beides vorkommt). Protokoll: Tabelle Punkt \| ✓/– |
| `:::tipp` … `:::` | gestufte Hilfe zum Aufklappen; mehrfach möglich (Tipp 1, Tipp 2 …) |
| `{.frei}`, `{.vermutung}` | Antwortfeld mit Umschalter **Tippen / Stift**; `{.frei stift}` startet im Stiftmodus. Gespeichert werden Text und Striche, im Protokoll erscheinen beide (Striche als Vektor im PDF). Weitere Schalter: `sperrt` (sperrt folgende Felder der Karte **und alle folgenden Karten des Kapitels**, bis das Feld nicht leer ist), `optional` (das Feld zählt für `oeffnet_nach: felder:` nicht mit) |
| `:::loesung` … `:::` | in `{.frei}`, `{.vermutung}`, `{.mc}`: Knopf „Lösung anzeigen“; im PDF nur bei `musterloesungen: ja` in `kurs.yml` |
| `## Titel {.quiz oeffnet="<ziel>"}` | **Quiz-Serie**: jede `### … {.mc}` ist eine Frage (eine pro Ansicht, „Frage n von m“). Falsch: Erklärung aus `\|\|`, „Nochmal versuchen“; `:::nachschlagen` mit einer Karten-ID ergänzt „Hier nochmal nachschlagen“ (mit Rücksprung). Alle richtig → `ziel` (Kapitel- oder Karten-ID) öffnet sich |
| `:::info`, `:::merksatz` | ruhige Kästen an Ort und Stelle im Text (auch im Karten-Intro und in `{.info}`-Fragen) |
| `:::lehrkraft` … `:::` | Hinweise für Lehrkräfte (Leitfragen, Erwartungshorizont); nur im Betreuungsmodus sichtbar, nie im Protokoll oder PDF |
| `:::mehr Titel` | aufklappbare Zusatzkarte |
| `### Titel {.umschalter}` mit `:::ansicht Name` | Knöpfe wechseln zwischen Abbildungen/Texten; kein Protokolleintrag |
| `### Titel {.knopf oeffnet="<abschnitt-id>" id="<knopf-id>"}` | Knopf, der einen Abschnitt öffnet (`oeffnet_nach: knopf:<id>`) und dorthin springt |
| `### Titel {.werkzeug name="<modul>" modus="…"}` | Feld aus `kurse/<kurs>/werkzeuge/*.js`; das Modul registriert die Feldart per `FX.felder.registriere(art, {init, laden, wert, leer, protokoll, …})` (alle Einträge unter „Werkzeug-Schnittstelle“). Weitere Attribute (`modus="eve"`) landen als Konfiguration im Feld. `protokoll(el, wert)` liefert Teile `{typ:'text'|'tabelle'|'grafik'|'striche', …}` für Ergebnisseite und PDF. Dateien mit „kern“ im Namen werden zuerst geladen |

Messtabelle:
```
### Messung {.messtabelle}
Arbeitsauftrag …

:::spalten
dp | Druckunterschied Δp | mbar
dN | Anzahl Wechsel ΔN |
n = 1 + dN*lambda/(2*L) | Brechzahl |      ← berechnete Spalte (Formel mit Kürzeln und Konstanten)
:::
:::diagramm
x = dp, y = dN, ausgleich = ursprung        ← ausgleich: linear | ursprung | keiner
:::
:::konstanten
lambda = 532e-9
L = 0.05
:::
```
Formeln: `+ - * / ^`, Klammern, `pi`, `sqrt sin cos tan ln log`.

Karten: Jede `##`-Überschrift wird eine Karte (eine Ansicht am iPad). `{.versteckt}` wird nicht ausgegeben. Ein ganzer Abschnitt lässt sich mit `versteckt: true` in der Frontmatter ausblenden, z. B. die Moodle-Fragensammlung `99-fragensammlung.md`; die Datei bleibt erhalten.

## Freischaltung

Im Kopf eines Abschnitts (Frontmatter) oder als Attribut einer `##`-Karte:

```
---
titel: Kapitel 2
oeffnet_nach: quiz:schluesselverteilungsproblem/verstaendnisfragen-kapitel-1
grund: Öffnet sich, wenn … (sonst Standardtext)
nachschlagen: true        ← immer offen, nicht in der Weiter-Reihenfolge, Übersicht „Zum Nachschlagen“
---
## Karte {.test oeffnet_nach="quiz:abschnitt/andere-karte" grund="…"}   ← sperrt die Karte und alle folgenden des Kapitels
```

Bedingungen: `felder:<karten-id>` (alle nicht `optional`en Felder der Karte ausgefüllt), `quiz:<karten-id>` (Quiz-Serie bestanden), `knopf:<id>`. Gesperrtes zeigt Schloss und Grund; „Weiter“ endet nie in einer leeren Ansicht. Einmal Geöffnetes bleibt offen. **Betreuungsmodus:** fünfmal auf „foeXlab“ im Kopf tippen und bestätigen → alles frei, bis „Neue Gruppe“.

## Hypothesen festhalten

Eine Vermutung (`{.vermutung}`) und jedes Werkzeug mit der Option `hypothese: true` gilt als **Hypothese**. Sobald im selben Kapitel (gleiche `abschnitt-id`) ein **späteres** Feld ausgefüllt ist, wird die Hypothese festgehalten: sie ist schreibgeschützt (bei Stift-Antworten auch Umschalter, Stift-Leiste und Zeichenfläche) und zeigt den Hinweis „Festgehalten – eure Hypothese vor der Messung.“ Das gilt nach der Eingabe und auch nach dem Neuladen mit gespeicherten Werten.

- Das spätere Feld zählt, wenn es selbst keine Hypothese ist (so friert die Begründung zu einer Vorhersage die Vorhersage nicht ein) und nicht `ohneProtokoll` ist; `optional`e Felder zählen mit.
- `{.frei}` ändert sich nicht; im Betreuungsmodus wird nie festgehalten.
- Eine Feldart kann optional `begonnen(wert)` liefern. Dann löst sie das Festhalten aus, sobald `begonnen` wahr ist, statt erst bei „nicht leer“. So friert die Vorhersage schon nach dem ersten Photon ein, auch wenn die Messung (`leer`) bis zur Mindestzahl Photonen die Sperren noch geschlossen hält. `leer` steuert weiter nur `sperrt`.
- Eigene Feldarten (`FX.felder.registriere(art, h)`) setzen `hypothese: true` und liefern `schreibschutz(el, an)` mit, das die Eingabe sperrt bzw. wieder freigibt.

## Werkzeug-Schnittstelle

Ein Werkzeug ist eine Datei `kurse/<kurs>/werkzeuge/<name>.js`, die eine oder mehrere Feldarten anmeldet. Im Markdown steht `### Titel {.werkzeug name="<art>" sperrt …}`; Dateien mit „kern“ im Namen werden vor den übrigen geladen (gemeinsame Hilfen, z. B. `FX.mzi`).

**Anmeldung:** `FX.felder.registriere('<art>', h)` mit diesen Einträgen (nur `wert` und `laden` sind Pflicht):

| Eintrag | Bedeutung |
|---|---|
| `init(el)` | einmal beim Binden des Felds; baut die Bedienung in `el.querySelector('.fx-werkzeug-flaeche')` auf. Muss mehrfaches Aufrufen vertragen |
| `laden(el, wert)` | gespeicherten Wert anzeigen (nur, wenn einer gespeichert ist) |
| `wert(el)` | aktueller Wert als JSON-fähiges Objekt; wird nach jedem `input`/`change` entprellt (400 ms) gespeichert |
| `leer(wert)` | wahr, solange das Feld nicht erledigt ist: steuert `sperrt`, die Freischaltung `felder:` und „Noch offen“ |
| `begonnen(wert)` | optional: wahr ab der ersten Eingabe/Messung. Löst das Festhalten von Hypothesen aus und bringt ein begonnenes, noch nicht erledigtes Feld trotzdem in Ergebnisseite und PDF (es steht dann auch unter „Noch offen“) |
| `hypothese: true` + `schreibschutz(el, an)` | das Feld ist eine Hypothese und wird festgehalten (siehe oben); `schreibschutz` sperrt bzw. gibt die Eingabe frei |
| `ohneProtokoll: true` | reine Anzeige (Aufbau, Zitat, Ergebnisanzeige): nicht im Protokoll, löst kein Festhalten aus |
| `beiEingabe(el, ereignis)` | optional, bei jedem `input`/`change` vor dem Speichern |
| `pruefen(el)` | optional, für Felder mit „Prüfen“: `FX.felder.pruefen(el)` ruft es auf und speichert sofort |
| `sperrhinweis` | optional, Text oder `function (el)`: Hinweis unter dem Feld, solange es mit `sperrt` die folgenden Felder sperrt. Standard: Hypothesen „Tragt zuerst eure Vermutung ein.“, sonst „Erledigt zuerst diese Aufgabe, dann geht es weiter.“ |
| `protokoll(el, wert)` | Liste von Teilen für Ergebnisseite und PDF: `{typ:'text', text, titel?}`, `{typ:'tabelle', kopf:[…], zeilen:[[…]], markierung?:[…], titel?}`, `{typ:'grafik', svg, titel?, breite_mm?}`, `{typ:'striche', striche, verhaeltnis, titel?}` |
| `speicherfehler(el, fehler)` | optional, wenn das Speichern scheitert |

**Regeln**

- **Wert erst am Ende einer Animation ändern:** Während eine Messung läuft, bleibt `wert(el)` unverändert, Knöpfe und Regler sind gesperrt; erst danach den Wert ergänzen und `change` (bubbles) am Feld auslösen.
- **Andere Felder lesen:** `FX.felder.speicher().lies('<feld-id>')` (Promise) liefert den gespeicherten Wert; auf `document`-Ereignis `fx:geaendert` (`e.detail.id`) neu lesen. Der Speicher hinkt der Eingabe bis zu 400 ms hinterher. Wo es auf den neuesten Stand ankommt (z. B. fortlaufende Nummern), das Feld im Dokument über `FX.felder.arten['<art>'].wert(el)` lesen.
- **Konfiguration:** Alle Attribute außer `name` und `#id` (z. B. `modus="s3" vorher="kapitel/karte/feld"`) stehen als JSON in `data-fx-konfig` des Felds (`JSON.parse(el.getAttribute('data-fx-konfig'))`). `sperrt` und `optional` wirken wie bei anderen Feldern.
- **JavaScript-Stand:** ES2017 (Pfeilfunktionen, `const`/`let`, Vorlagen-Zeichenketten, `async`/`await`), aber kein `?.` und kein `??`; keine Module (`import`/`export`), jede Datei ist eine selbstaufrufende Funktion `(function (root) { … })(typeof self !== 'undefined' ? self : this);`. Ältere iPads laufen sonst nicht.
- **Grafiken für das PDF:** SVG mit festen Farben (`#3F9AD6`), nicht `var(--…)` oder `currentColor`; das PDF rendert das SVG ohne Seiten-CSS.
- **Labormodus:** Eigene Stile mit hellen Farben brauchen ein Gegenstück unter `html[data-labor="1"]`.

**Kontrollfragen:** `versuche="n"` wirkt nur zusammen mit `sperrt` (`{.mc sperrt versuche="2"}`, ebenso bei `luecke`, `zuordnung`, `bildzuordnung`); ohne `sperrt` meldet der Bau eine Warnung.
**Warnungen beim Bau:** Eine Lücken-, Zuordnungs- oder Bildzuordnungsfrage **ohne** Auswahlliste (`{{…}}`, gültige `=>`-Paare, `:::marken`) gilt nicht als Kontrollfrage, auch mit `sperrt` (sonst bliebe das Kapitel für immer zu); der Bau meldet „keine Auswahlliste“. Weitere Warnungen: `ziehen` bei etwas anderem als `bildzuordnung`; `versuche` bei `{.checkliste}`; eine `:::marken`-Zeile ohne `x,y = Label` (Koordinaten dürfen Dezimalstellen haben, z. B. `480.5,250`); Markdown-Listenpunkte neben `:::liste` bei `{.checkliste}` (die Listenpunkte entfallen). Bildzuordnungen zeigen kleine Platznummern am Bild; das Protokoll (Seite und PDF) führt sie als Tabelle „Platz | Zuordnung“.

**Kommentare:** HTML-Kommentare `<!-- … -->` werden vor der Umwandlung in HTML entfernt, auch in Code-Blöcken und Inline-Code; ein Kommentar lässt sich deshalb nicht als Beispieltext zeigen.

## Medien
Dateien in `media/` ablegen und mit relativem Pfad einbinden:
`![Alt-Text](media/bild.jpg)` · mit Größe: `<img src="media/bild.jpg" width="300">` ·
Video: `<video controls><source src="media/film.mp4"></video>` · PDF/HTML-Download: `[Text](media/datei.pdf)` ·
HTML-Dateien (z. B. GeoGebra) öffnen sich im Dialog. Bilder werden beim Bauen auf 1200 px verkleinert, Videos >10 MB nicht eingebettet.
Dateien zu Aufgaben/Material: `:::dateien` mit einem Pfad je Zeile (`.einbetten` zeigt PDFs direkt an).

## Erneuter Export aus Moodle
`python3 tools/export_moodle.py <entpacktes-backup> <neuer-ordner>` (überschreibt keine bestehende Bearbeitung, solange der Zielordner neu ist).

## Design
`template.html` setzt das **foeXlab Design System** um (Projekt „foeXlab Design System“ in claude.ai/design): QF-Palette (Blau #3F9AD6, Navy #33416E, Rosé #CF6F82), foeXlab-Orange #F58411 als Leitakzent, Source Sans 3 (offline, OFL), schmale weiße Kopfleiste mit Fortschrittsbalken, weiße Karten mit feiner Linie (Radius 10 px), kleine Logos im Fuß. Alle Werte stehen als CSS-Variablen am Anfang des Templates.
Die Schrift liegt in `engine/web/fonts/` (Source Sans 3, Lizenz OFL.txt), die Logos in `engine/design/logos/`; beides wird beim Bauen eingebettet.
Titel und Fuß lassen sich in `kurs.yml` ändern (`titel`, `untertitel`, `lizenz` – Standard „CC BY 4.0“; die Fußzeile lautet „Kurs · foeXlab, Leibniz Universität Hannover · Lizenz“).

## Formeln (offline)
Formeln (`\( … \)`, `\[ … \]`) werden beim Bauen mit MathJax zu eingebettetem SVG gerendert. Voraussetzung: `node` und `mathjax-full` (`npm install mathjax-full`, dann `NODE_PATH=<ordner>/node_modules python3 build.py`). Ohne das bleibt TeX stehen und wird im Browser per KaTeX (Internet) dargestellt.
Sehr große Dateien (>50 MB, z. B. Videos) kopiert `tools/export_moodle.py` nicht nach `media/` (Option: Umgebungsvariable `MAX_COPY_MB`); sie können von Hand abgelegt werden.
