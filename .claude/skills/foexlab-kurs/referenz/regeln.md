# Regeln für foeXlab-Kurse

Gelernt aus den Umstellungen `mzi-photonen` und `mzi`. Was `tools/kurs_pruefen.py` prüft, ist mit (P) markiert – dort führt ein Verstoß zu „noch nicht bereit“.

## Grenzen

- **Engine nie ändern** (`engine/`, `docs/FORMAT.md`, `tools/`, `tests/js/*.test.js` der Engine). Fehlt ein Baustein, mit vorhandenen Bausteinen lösen oder Platzhalter; der Autorin sagen, was fehlt.
- **Bestehende Kurse nur ändern, wenn die Autorin das ausdrücklich will** (und dann nur diesen Kurs).
- Keine eigene HTML-Seite, kein eigenes Layout, kein eigenes Speichern am Format vorbei.
- Nur eigene Dateien committen: `kurse/<id>/`, `tests/js/<id>/`, ggf. `tests/py/test_<id>*.py` und (bei neuen Werkzeugen) `.claude/skills/foexlab-kurs/referenz/werkzeuge.md`. Nie `git add -A` oder `git add .`.

## Kursordner

- `kurse/<id>/` mit `kurs.yml`, `abschnitte/NN-name.md`, `media/`, ggf. `werkzeuge/`, und `AENDERUNGEN.md`.
- Kurs-ID nur `a-z`, `0-9` und einzelne `-` (keine Großbuchstaben, Umlaute, Leerzeichen); sie wird Internetadresse und Speicherschlüssel. Ordnername = `id` in `kurs.yml` (P).
- `kurs.yml`:
  ```
  titel: "Brechung am Halbzylinder"
  untertitel: "Lichtbrechung messen und deuten"
  id: brechung
  musterloesungen: false      # true oder false – nie „ja“/„nein“ (jeder Text gilt als wahr)
  ```
- `AENDERUNGEN.md`: Herkunft (welche Notizen, Stand), Abweichungen von den Notizen, und immer ein Abschnitt **„## Noch zu prüfen“** mit allem, was die Autorin klären muss (Platzhalter, unsichere Fachaussagen, fehlende Fotos, geschätzte Messwerte).

## Kennungen und Titel

- Jede Karte `## Titel {#karten-id}`, jedes Feld `### Titel {… #feld-id}`: feste, sprechende IDs, klein, mit Bindestrichen (`#vermutung-laenge`, `#messreihe-1`). Nie nachträglich ändern, sobald ein Kurs im Labor läuft (gespeicherte Eingaben hängen daran).
- Kartentitel je Kapitel eindeutig (P). Feldtitel im ganzen Kurs eindeutig (P) – sie sind die Überschriften im Protokoll. Bei Wiederholung ein Präfix: „Aufbau 1: Hypothese“, „Aufbau 2: Hypothese“.
- Feld-IDs im ganzen Kurs eindeutig (P).

## Ablauf und Freischaltung

- Was weiterführen soll, sperrt: `{.luecke sperrt}`, `{.mc sperrt}`, `{.zuordnung sperrt}`, `{.vermutung sperrt}`, `{.frei sperrt}`, Werkzeug mit `sperrt`.
- Kontrollfragen (Lücke, MC, Zuordnung, Bildzuordnung mit `sperrt`) immer mit `:::richtig` und `:::falsch`. Wo Gruppen hängen bleiben könnten: `versuche="2"` + `:::nach_versuchen` mit der Erklärung. Jede Kontrollfrage braucht Auswahllisten und eine richtige Antwort (P); bei `.mc sperrt` genau eine `[x]`.
- Kapitel öffnen sich über Frontmatter `oeffnet_nach: felder:<kapitel>/<karte>` (oder `quiz:…`, `knopf:…`) mit kurzem `grund: "Öffnet sich, wenn …"`. Kapitel 1 hat keine Bedingung (P). Ziele müssen existieren, dürfen nicht versteckt und keine leeren Karten sein; keine Kreise (P).
- **Keine Freischaltung auf eine Karte, die nur einen Platzhalter enthält** (P) – sonst hängt die Gruppe.
- Ein `{.knopf oeffnet="…"}` darf ein Kapitel oder eine Karte öffnen; die Karte dahinter trägt `oeffnet_nach="knopf:<id>"`.
- Hypothesen mit `{.vermutung}` (oder Werkzeug mit `hypothese: true`): sie frieren ein, sobald im selben Kapitel ein späteres Feld ausgefüllt ist. Vermutung und Messung deshalb ins selbe Kapitel, Vermutung zuerst.
- Hintergrundseiten (für Lehrkräfte, Nachlesen) als eigenes Kapitel `90-hintergrund-….md` mit `nachschlagen: true`. Das befreit nur auf Kapitelebene; einzelne Karten anderer Kapitel nicht.

## Inhalte

- Anrede „ihr“, kurze Sätze, Operatoren wie in den Notizen. Text der Autorin möglichst wörtlich übernehmen; nichts fachlich Unsicheres erfinden – in „Noch zu prüfen“ notieren.
- `:::lehrkraft` für Hinweise nur für Betreuende (Erwartungshorizont, Stopp-Punkte); erscheinen nie im Protokoll.
- HTML-Kommentare `<!-- … -->` sind erlaubt und werden entfernt: gut für Notizen an Kolleginnen („Text von Moritz, 17.11.“).
- Formeln als `\( … \)` bzw. `\[ … \]`.

## Medien

- Nur aus `kurse/<id>/media/`, relativ eingebunden (`media/bild.jpg`) (P: Datei muss existieren, Bilder nur aus `media/`).
- **Ausnahme:** `{.bildzuordnung bild="schema.svg"}` nennt die Datei ohne `media/`; alle anderen (`![…]`, `<img>`, `<video>`, `:::dateien`, `{.skizze bild="media/…"}`) mit `media/`. Tabelle: `referenz/bausteine.md`, „Pfade zu Dateien“.
- Bilder höchstens 1200 px breit (der Bau verkleinert, das Repo bleibt aber groß), Videos klein halten (über 10 MB werden sie nicht eingebettet). Dateinamen ohne Leerzeichen und Umlaute.
- SVGs mit festen Farben (`#3F9AD6` Blau, `#33416E` Navy, `#F58411` Orange, `#222222` Text), nie `var(--…)` oder `currentColor`.
- Fotos der Autorin: verkleinern, z. B. `sips -Z 1200 foto.jpg --out kurse/<id>/media/foto.jpg` (Mac).

## Werkzeuge

- Wahl: vorhanden → Variante → neu nach `referenz/simulation-vorlage/` → Platzhalter. Details: `referenz/werkzeuge.md`.
- Vorhandene Werkzeuge in den eigenen Kurs **kopieren** (samt `*kern*.js` und Test), nie das Original ändern.
- Jedes Werkzeug hat einen Test unter `tests/js/<id>/` (P), der die Datei `werkzeuge/<name>.js` lädt.
- Platzhalter, wenn eine Simulation (noch) nicht gebaut werden soll oder der Aufwand zu groß ist: `### Simulation: … {.platzhalter}` mit einem Absatz, was sie können soll; in „Noch zu prüfen“ eintragen.
