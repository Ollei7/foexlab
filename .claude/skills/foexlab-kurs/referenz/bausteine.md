# Bausteine nach Absicht

Kurzbeispiele zu allen Bausteinen aus `docs/FORMAT.md` (dort die vollständige Beschreibung). Dateipfade: siehe „Pfade zu Dateien“ unten – **nur `.bildzuordnung bild=` steht ohne `media/`**. `##` = Karte (eine Ansicht am iPad), `###` = Feld bzw. Frage. Jedes Feld bekommt eine feste ID `#id`, jede Karte `{#id}`. Vollständiges Beispiel: `referenz/beispielkurs/`.

## Gliederung

- Datei `abschnitte/NN-name.md` = ein Kapitel; Kapitel-ID = Dateiname ohne Nummer (`01-messung.md` → `messung`). Feld-ID für Verweise: `kapitel/karte/feld`.
- Frontmatter: `titel`, `nr`, optional `oeffnet_nach`, `grund`, `nachschlagen: true`, `versteckt: true`.
- Kartenarten (optional, nur Optik): `## Titel {.test}`, `{.aufgabe}`, `{.material}`; `{.versteckt}` wird nicht ausgegeben; `{.einbetten}` zeigt PDFs aus `:::dateien` direkt.

## Text und Hinweise

| Absicht | Baustein |
|---|---|
| Erklärtext als eigener Block (keine Frage) | `### So arbeitet ihr {.info}` |
| ruhiger Kasten im Text | `:::info` … `:::` |
| Merksatz | `:::merksatz` … `:::` |
| aufklappbarer Zusatz | `:::mehr Was bedeuten die Spalten?` … `:::` |
| gestufte Hilfe | `:::tipp` … `:::` (mehrfach = Tipp 1, Tipp 2 …) |
| nur für Betreuende (Erwartung, Leitfragen) | `:::lehrkraft` … `:::` – nie im Protokoll/PDF |
| Notiz an Kolleginnen | `<!-- … -->` – wird entfernt |
| Dateien zum Herunterladen | `:::dateien` mit einem Pfad `media/…` je Zeile |

## Hypothese

```
### Vermutung: Periodendauer {.vermutung sperrt #vermutung}
Wie ändert sich die Periodendauer, wenn …? Begründet kurz.
```
`sperrt`: Folgendes öffnet erst nach einer Eingabe. Wird festgehalten, sobald im selben Kapitel ein späteres Feld ausgefüllt ist. Werkzeug als Hypothese: `hypothese: true` in der Feldart (z. B. `vorhersage`).

## Freitext

```
### Beobachtung {.frei sperrt #beobachtung}
Beschreibt, was ihr seht.
:::loesung
Musterlösung (Knopf „Lösung anzeigen“; im PDF nur bei `musterloesungen: true` in kurs.yml)
:::
```
Schalter: `{.frei stift}` (startet im Stiftmodus), `optional` (zählt nicht für `felder:`), `platzhalter="1. … 2. …"`. `:::hinweis` = Rückmeldung/Musterlösung nach „Prüfen“.

## Lückentext, der erst richtig gelöst weiterführt

```
### Zusammenhang {.luecke sperrt versuche="2" #zusammenhang}
Je länger der Faden, desto {{größer|kleiner}} ist die Periodendauer.   ← erste Option ist richtig
:::richtig
Richtig: …
:::
:::falsch
Noch nicht. Vergleicht …
:::
:::nach_versuchen
Erklärung der Lösung (erscheint nach 2 falschen Prüfungen, Lösung wird markiert)
:::
```
`:::teilweise` = Rückmeldung bei teilweise richtig. Gilt auch für `{.zuordnung sperrt}`, `{.bildzuordnung sperrt}`, `{.mc sperrt}`.

## Kontrollfrage (Multiple Choice)

```
### Kontrollfrage: Masse {.mc sperrt #kontrolle-masse}
Was passiert mit der Periodendauer?
:::antworten
- [ ] Sie wird doppelt so groß. || Rückmeldung zu dieser Antwort
- [x] Sie bleibt gleich.
:::
```
Mehrere richtig: `{.mc .mehrfach}`; Teilpunkte `- [50%] …`. Bei `sperrt` genau eine richtige Antwort.

## Weitere Fragetypen

| Absicht | Baustein |
|---|---|
| Begriffe zuordnen | `### … {.zuordnung sperrt #id}` + `:::paare` mit `Begriff => Zuordnung`, Ablenker `=> Ablenker` |
| kurze Textantwort | `### … {.kurz #id}` + `:::antworten` mit `= Antwort \|\| Feedback`, `= [50%] teilweise`, `*` als Platzhalter; `{.kurz .gross}` = Groß/Klein beachten |
| Zahl mit Toleranz | `### … {.zahl einheit="cm" #id}` + `:::antworten` mit `= 1.3 ± 0.05` |
| Beschriftungen auf einem Bild wählen | `### … {.bildzuordnung bild="schema.png" #id}` (Datei `media/schema.png`, im Attribut **ohne** `media/`) + `:::marken` mit `x,y = Label`, `= Ablenker` |
| Beschriftungen auf ein Bild ziehen | `### … {.bildzuordnung ziehen sperrt bild="schema.svg" #id}` (Datei `media/schema.svg`, Attribut ohne `media/`; bei SVG: Koordinaten in SVG-Einheiten) |
| Quiz-Serie, öffnet etwas | `## Verständnisfragen {.quiz oeffnet="<kapitel- oder karten-id>"}`, darunter je Frage `### … {.mc}`; `:::nachschlagen` mit Karten-ID ergänzt „Hier nochmal nachschlagen“ |

## Messreihe mit Diagramm

```
### Messreihe: Periodendauer {.messtabelle #messreihe}
Messt für mindestens fünf Fadenlängen …
:::spalten
L | Fadenlänge L | m                 ← Kürzel | Name | Einheit
t10 | Zeit für 10 Schwingungen | s
T = t10/10 | Periodendauer T | s     ← berechnete Spalte
:::
:::diagramm
x = L, y = T, ausgleich = keiner     ← linear | ursprung | keiner
:::
:::konstanten
g = 9.81
:::
```
Formeln: `+ - * / ^`, Klammern, `pi`, `sqrt sin cos tan ln log`.

## Foto, Skizze, Checkliste

| Absicht | Baustein |
|---|---|
| Foto aufnehmen | `### Foto: Muster auf dem Schirm {.foto sperrt #foto-muster}` |
| zeichnen, optional auf Vorlage | `### Strahlengang skizzieren {.skizze bild="media/aufbau.jpg" #skizze}` (Attribut **mit** `media/`; nur JPG/PNG, ein SVG bricht den Bau ab) |
| Material abhaken | `### Materialliste {.checkliste sperrt #material}` + Listenpunkte `- Laser` (oder `:::liste`, eine Zeile je Punkt) |

## Anleitung und Video

| Absicht | Baustein |
|---|---|
| Schritt-für-Schritt-Anleitung | `## Aufbau {.schritte}`, jede `###` darunter ist ein Schritt |
| zwischen Video und Text wechseln | `### Hilfe beim Aufbau {.umschalter}` mit `:::ansicht Video` … `:::` und `:::ansicht Anleitung` … `:::` |
| Video | `<video controls><source src="media/aufbau.mp4"></video>` |
| Bild | `![Alt-Text](media/bild.jpg)` oder `<img src="media/bild.jpg" alt="…" width="300">` |

## Pfade zu Dateien

Alle Dateien liegen in `kurse/<id>/media/`. Was im Text steht, unterscheidet sich je Baustein (so liest es die Engine):

| Baustein | Schreibweise | Pfad relativ zu |
|---|---|---|
| Bild Markdown / HTML | `![Alt](media/bild.jpg)`, `<img src="media/bild.jpg">` | Kursordner (mit `media/`) |
| Video | `<video controls><source src="media/film.mp4"></video>`, `poster="media/bild.jpg"` | Kursordner (mit `media/`) |
| Link, PDF, HTML-Datei | `[Text](media/datei.pdf)` | Kursordner (mit `media/`) |
| `:::dateien` | eine Zeile `media/datei.pdf` je Datei | Kursordner (mit `media/`) |
| `{.skizze bild="…"}` | `bild="media/vorlage.jpg"` (JPG/PNG) | Kursordner (mit `media/`) |
| `{.bildzuordnung bild="…"}` | `bild="schema.svg"` | Ordner `media/` (**ohne** `media/`) |

Hinweis: `kurs_pruefen` meldet bei `{.skizze bild="media/…"}` zurzeit fälschlich „media/media/… fehlt“ (Fehler im Prüfwerkzeug, gemeldet). Bis zur Korrektur die Skizze ohne Vorlagenbild anlegen oder das Bild per `![…](media/…)` darüber zeigen und das in „Noch zu prüfen“ notieren.

## Freischaltung

| Absicht | Baustein |
|---|---|
| Kapitel öffnet nach einer Karte | Frontmatter `oeffnet_nach: felder:<kapitel>/<karte>` + `grund: "Öffnet sich, wenn …"` |
| Kapitel öffnet nach Quiz | `oeffnet_nach: quiz:<kapitel>/<quizkarte>` |
| Betreuende geben frei („Besprechung erledigt“) | `### Besprechung erledigt {.knopf oeffnet="<kapitel>/<karte>" id="stopp-1"}`, dann `## Sicherung {#sicherung oeffnet_nach="knopf:stopp-1"}` |
| Karte innerhalb des Kapitels sperren | `## Karte {#id oeffnet_nach="felder:<kapitel>/<karte>" grund="…"}` |
| Hintergrundseite, immer offen | Frontmatter `nachschlagen: true` |

## Simulationen

| Absicht | Baustein |
|---|---|
| vorhandenes oder neues Werkzeug | `### Simulation: Fadenlänge {.werkzeug name="pendel" min="10" max="100" sperrt #sim}` (siehe `referenz/werkzeuge.md`) |
| Simulation folgt später | `### Simulation: Masse {.platzhalter}` + ein Absatz, was sie können soll (kein Feld, sperrt nie) |
