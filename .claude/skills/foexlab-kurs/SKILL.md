---
name: foexlab-kurs
description: Verwenden, wenn im Repository foexlab eine Experimentanleitung als Kurs entstehen oder geändert werden soll – „neue Experimentseite“, „neue Anleitung“, „aus meinen Notizen einen Kurs“, „Kurs für das foeXlab“, „Anleitung überarbeiten“, „Kurs ändern“, „Simulation für meinen Kurs“. Führt von Notizen über Plan, Kursdateien, Werkzeuge und Prüfung (tools/kurs_pruefen.py) bis zum Pull Request mit automatischem Zusammenführen.
---

# foeXlab-Kurs aus Notizen

Die Autorin (Fachdidaktik, Lehrkraft) ist keine Programmiererin. Du schreibst den Kurs, führst alle Befehle selbst aus und erklärst Ergebnisse in einfachem Deutsch, ohne Fachbegriffe aus Git oder Programmierung. Niemand prüft den Code danach: `tools/kurs_pruefen.py` ist das Tor. Was dort „bereit“ sagt und auf GitHub grün ist, geht live.

**Feste Grenzen** (Einzelheiten `referenz/regeln.md`):
- Nur `kurse/<id>/`, `tests/js/<id>/` (und ggf. `tests/py/test_<id>*.py`, bei neuen Werkzeugen `referenz/werkzeuge.md`) anlegen oder ändern. Nie `engine/`, `tools/`, `docs/`, andere Kurse – außer die Autorin will ausdrücklich genau diesen bestehenden Kurs ändern.
- Nur Bausteine aus `docs/FORMAT.md`; keine eigene HTML-Seite, keine eigene Logik am Format vorbei.
- Nie `git add -A` / `git add .`, nie Force-Push, nie `gh pr merge --admin`.

**Nachschlagen:** `referenz/bausteine.md` (Bausteine nach Absicht), `referenz/regeln.md` (Konventionen), `referenz/werkzeuge.md` (vorhandene Simulationen, Kopierregeln), `referenz/simulation-vorlage/` (neue Simulation), `referenz/beispielkurs/` (kleiner vollständiger Kurs, besteht die Prüfung – Vorbild für Aufbau und Schreibweise), `docs/FORMAT.md` (vollständiges Format).

## Schritt 0: Umgebung (einmal je Sitzung)

Im Ordner `foexlab` ausführen:
```
python3 tools/kurs_pruefen.py mzi --ohne-tests
```
- Letzte Zeile „bereit“ → Umgebung reicht für die Prüfung.
- „Die Umgebung ist noch nicht eingerichtet“ (Exit 2) → genannte Befehle ausführen, meist `python3 -m pip install -r requirements.txt` und `npm install`; Node.js fehlt → `brew install node` (Mac). Danach wiederholen.
- `gh auth status` → nicht angemeldet: der Autorin sagen, sie soll im Terminal `gh auth login` ausführen (GitHub.com, HTTPS, im Browser anmelden). Passwörter nie selbst eingeben.

## Schritt 1: Notizen lesen, Kurs-ID, Branch

1. Alle Notizen, Fotos und Dateien der Autorin lesen. Unklar Gebliebenes sammeln, nicht raten.
2. **Kurs-ID** klären (kurz, nur `a-z`, `0-9`, `-`, z. B. `brechung`; wird Teil der Internetadresse). Gibt es `kurse/<id>/` schon, ist es eine Überarbeitung (siehe unten) – oder eine andere ID wählen. **Titel** und **Untertitel**: hat die Autorin keine genannt, schlägst du sie im Plan (Schritt 2) vor – keine eigene Frage.
3. Branch immer vom aktuellen `main` (auch wenn gerade ein anderer Branch oder ein „losgelöster“ Stand ausgecheckt ist):
   ```
   git status --short          # fremde Änderungen? nicht anfassen, Autorin fragen
   ```
   Unversionierte Ordner, die nicht zum Kurs gehören (z. B. persönliche Quellordner mit Notizen), einfach stehen lassen: nie committen, nie löschen.
   ```
   git switch main && git pull
   ls tools/kurs_pruefen.py .claude/skills/foexlab-kurs/SKILL.md
   git switch -c kurs/<id>
   ```
   Scheitert `git pull` oder fehlt danach eine der beiden Dateien: **aufhören** und der Autorin sagen, dass ihr Stand veraltet ist und sie sich an Oliver wendet. Nie auf einem alten Stand oder dem Stand eines anderen Branches weiterbauen.

## Schritt 2: Plan vorlegen – erst nach Bestätigung schreiben

Lege den Plan als Tabelle vor, ein Kapitel nach dem anderen. Darüber: **Titel** und **Untertitel** (aus den Notizen oder dein Vorschlag) – sie werden mit dem Plan bestätigt.

| Kapitel (Datei) | Karte (`#id`) | Feld: Titel – Baustein (`#id`) | Freischaltung | Werkzeug |
|---|---|---|---|---|
| 1 Brechung (`01-brechung.md`) | Vermutung (`#vermutung-karte`) | „Vermutung: Brechung“ – `{.vermutung sperrt}` (`#vermutung`) | – | – |
| | Messung (`#messung`) | „Messreihe: Winkel“ – `{.messtabelle}` mit Diagramm | – | – |
| | Simulation (`#simulation`) | „Simulation: Einfallswinkel“ – `{.werkzeug name="brechung" sperrt}` | – | neu nach Vorlage |
| | Kontrolle (`#kontrolle`) | „Kontrollfrage: …“ – `{.mc sperrt}` | – | – |
| Hintergrund (`90-hintergrund.md`) | … | `{.info}` | `nachschlagen: true` | – |

- **Größe:** Eine Laborstation ≈ ein Kapitel mit 4–7 Karten (Einstieg, Vermutung, Messung, Simulation, Auswertung, Kontrolle). Weitere Kapitel nur, wo ein Tor sinnvoll ist (`oeffnet_nach`, z. B. Deutung erst nach der Messung, Besprechung mit Betreuenden). Hintergrundseite nur, wenn die Notizen Hintergrund enthalten.
- **Kontrollfrage zum Schluss** gehört ans Ende des letzten Arbeitskapitels, nicht in ein eigenes Kapitel: mit `sperrt` zählt sie erst als erledigt, wenn sie richtig beantwortet ist (Fortschritt, „Noch offen“), auch ohne folgende Karte. Der Beispielkurs hat Kapitel 2 nur, um die Freischaltung zu zeigen, und dort folgt der Kontrollfrage noch eine Zusammenfassung.
- Jedes Werkzeug kennzeichnen: **vorhanden** (Name aus `referenz/werkzeuge.md`), **Variante** (von welchem), **neu nach Vorlage**, **Platzhalter**. Dasselbe Werkzeug mit anderer Zahl (z. B. Wasser statt Glas) ist **kein** zweites Werkzeug, sondern eine zweite Zeile mit Attribut (`n="1.33"`).
- Darunter die offenen Fragen aus den Notizen.
- Fragen: „Passt der Plan so?“ Erst nach einem klaren Ja weiter. Änderungswünsche einarbeiten und den geänderten Teil erneut zeigen.

## Schritt 3: Kurs schreiben

- `kurse/<id>/kurs.yml` (titel, untertitel, id, musterloesungen), `abschnitte/NN-name.md` je Kapitel, `media/`, `AENDERUNGEN.md` mit „## Noch zu prüfen“. Vorbild: `referenz/beispielkurs/`.
- Den Beispielkurs nicht als Ordner kopieren (seine Tests liegen dort nur, weil er außerhalb von `kurse/` steht); Kurstests gehören nach `tests/js/<id>/`.
- Konventionen aus `referenz/regeln.md` einhalten, besonders: feste `#id` an jeder Karte und jedem Feld; Feldtitel kursweit eindeutig; Kontrollfragen mit `sperrt`, `:::richtig`/`:::falsch` (bei Bedarf `versuche="2"` + `:::nach_versuchen`); Kapitel 2 ff. mit `oeffnet_nach` + `grund`; Hinweise für Betreuende in `:::lehrkraft`.
- Texte der Autorin möglichst wörtlich; fachlich Unsicheres nicht erfinden, sondern in „Noch zu prüfen“ eintragen.
- Bilder nach `kurse/<id>/media/`, höchstens 1200 px (`sips -Z 1200 <quelle> --out kurse/<id>/media/<name>.jpg`).
- Fehlt ein Foto oder Video, das die Notizen erwähnen: kein Bild erfinden, nicht auf eine fehlende Datei verweisen (`kurs_pruefen` meldet das). Stattdessen an der Stelle `<!-- Foto: Strohhalm im Wasserglas folgt -->` und eine Zeile in „Noch zu prüfen“.

## Schritt 4: Werkzeuge (Simulationen)

Reihenfolge, immer die erste passende Möglichkeit:
1. **Vorhanden:** Datei samt `*kern*.js` aus `kurse/<kurs>/werkzeuge/` nach `kurse/<id>/werkzeuge/` kopieren, Test nach `tests/js/<id>/` kopieren und Pfade anpassen. Original nie ändern. Details: `referenz/werkzeuge.md`.
2. **Variante:** wie 1, dann die Kopie anpassen und den Test mit.
3. **Neu:** nach `referenz/simulation-vorlage/LIESMICH.md` (kopieren, `ART`, `f(x, k)`, `skizze` anpassen, Test nach `tests/js/<id>/<name>.test.js` mit `DATEI = 'kurse/<id>/werkzeuge/<name>.js'`). Nie frei programmieren. Varianten derselben Simulation (andere Brechzahl, Masse …) über ein Attribut in der Kurszeile (`k.n`), nicht als Kopie.
4. **Platzhalter:** `### Simulation: … {.platzhalter}` + Absatz, was sie können soll; nichts darf auf diese Karte warten.

Eine Simulation vorschlagen, wenn die Notizen eine nennen oder eine Größe im Labor schwer zu verändern ist (Masse, Wellenlänge, Einzelphotonen); im Zweifel die Autorin fragen, nicht von selbst bauen.
Tests: Für jedes Werkzeug ist ein JS-Test Pflicht. Bei Werkzeugen aus der Vorlage ersetzt du den Test „HIER ANPASSEN: Rechenvorschrift prüfen“ durch zwei physikalisch bekannte Werte deiner Formel (Regel für dich: `kurs_pruefen` kann nicht erkennen, ob die Werte stimmen). Ein Python-Test `tests/py/test_<id>*.py` lohnt sich nur selten (z. B. wenn eine feste Kursstruktur geschützt werden soll).

Neue oder abgewandelte Werkzeuge in `referenz/werkzeuge.md`, Tabelle „Werkzeuge anderer Kurse“, eintragen (sonst schlägt ein Test fehl; das erste echte Werkzeug ersetzt die Zeile „(noch keine)“) – das ist die einzige Datei außerhalb des Kurses, die du dafür änderst, und sie gehört in denselben Commit.

## Schritt 5: Prüfen bis „bereit“

```
python3 tools/kurs_pruefen.py <id> --ohne-tests   # schnell, beim Schreiben
python3 tools/kurs_pruefen.py <id>                # mit den Tests des Kurses, vor Schritt 6 Pflicht
python3 tools/kurs_pruefen.py <id> --details      # zusätzlich Rohausgabe von Bau und Tests
```
- Jede Zeile `– Text (Ort)` ist ein Befund; Ort ist `datei.md:Zeile`, eine Karte oder `Tests`. Befund lesen, an der Stelle beheben, erneut prüfen.
- Letzte Zeile „bereit“ (Exit 0) = fertig. „noch nicht bereit (n Punkte)“ (Exit 1) = weitermachen. Exit 2 = Einrichtung oder falsche Kurs-ID (Schritt 0).
- Bei „bereit“ steht davor eine Zusammenfassung (Kapitel, Karten, Felder, Werkzeuge, Tests) und „Platzhalter: keine“ oder die Liste „Platzhalter (noch zu bauen)“ – kein Fehler, der Autorin nennen.
- Schlägt ein Test fehl: mit `--details` die Ursache suchen, das Werkzeug oder den Test im eigenen Kurs reparieren, nie die Engine.
- Befund nicht verstanden oder nicht im eigenen Kurs behebbar → der Autorin in einem Satz sagen, was los ist; nicht an `tools/` oder `engine/` herumändern.

## Schritt 6: Autorin klickt durch

```
python3 engine/build.py --alle
python3 tools/devserver.py        # im Hintergrund starten, läuft bis zum Beenden
```
- Adresse nennen: `http://localhost:8000/<id>/`. Port belegt → `python3 tools/devserver.py --port 8001` und die Adresse entsprechend.
- iPad im selben WLAN: `http://<IP-des-Mac>:8000/<id>/`, IP mit `ipconfig getifaddr en0` ermitteln.
- Hinweis an die Autorin: Gesperrtes öffnet sich über den Betreuungsmodus (fünfmal auf „foeXlab“ im Kopf tippen); „Neue Gruppe“ setzt alles zurück.
- Änderungswünsche → Schritt 3–5 wiederholen, neu bauen, Seite neu laden. Erst wenn die Autorin zufrieden ist, weiter. Danach den Testserver beenden.

## Schritt 7: Veröffentlichen

```
git add kurse/<id> tests/js/<id>        # nur diese Pfade; ggf. auch tests/py/test_<id>*.py
git add .claude/skills/foexlab-kurs/referenz/werkzeuge.md   # nur, wenn ein Werkzeug neu oder abgewandelt ist
git status --short                       # nichts Fremdes dabei?
git commit -m "kurs(<id>): <Titel> neu angelegt"
git push -u origin kurs/<id>          # abgelehnt (keine Schreibrechte)? Autorin bittet Oliver um Zugang zu Ollei7/foexlab
gh pr create --base main --title "Kurs <id>: <Titel>" --body "<2–3 Sätze: was der Kurs enthält, Platzhalter, Noch zu prüfen>"
gh pr merge --auto --squash
```
- Commit-Text auf Deutsch.
- Meldet `gh pr merge --auto`, automatisches Zusammenführen sei nicht erlaubt: der Autorin sagen, dass Oliver das einmal im Repository einschalten muss (Anleitung im README, Abschnitt „Für das Team“); der Pull Request bleibt offen und kann später zusammengeführt werden.
- Der Autorin sagen: GitHub prüft den Kurs jetzt (einige Minuten). Ist die Prüfung grün, wird er automatisch übernommen und ist danach unter **https://ollei7.github.io/foexlab/<id>/** öffentlich zu sehen (Repository: https://github.com/Ollei7/foexlab).
- Stand abfragen: `gh pr checks --watch`. Rot → `gh pr checks` und das Protokoll lesen, im eigenen Kurs beheben, Schritt 5, neuer Commit, `git push` – das automatische Zusammenführen bleibt eingeschaltet.
- Am Ende die Liste „Noch zu prüfen“ aus `AENDERUNGEN.md` und die Platzhalter nennen.

## Bestehenden Kurs überarbeiten

Nur wenn die Autorin genau diesen Kurs ändern will.
- Branch `kurs/<id>-<kurzwort>` (z. B. `kurs/mzi-tippfehler`) vom aktuellen `main`.
- Plan (Schritt 2) zeigt nur die Änderungen. **IDs (`#…`, Dateinamen) nie ändern** – gespeicherte Eingaben laufender Gruppen hängen daran; Feldtitel nur ändern, wenn nötig.
- Änderungen in `AENDERUNGEN.md` des Kurses vermerken. Dann Schritte 3–7 wie oben, Commit z. B. `kurs(<id>): Tippfehler in Kapitel 2`.
