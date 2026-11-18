# Vorlage für eine neue Simulation

`vorlage.js` ist ein fertiges, getestetes Werkzeug: ein Regler, eine Skizze, die mit dem Regler mitgeht, ein Knopf „Messwert übernehmen“ und eine Tabelle der übernommenen Werte. Neue Simulationen entstehen immer aus dieser Vorlage, nie von Grund auf.

## So gehst du vor

1. **Kopieren:** `vorlage.js` nach `kurse/<kurs>/werkzeuge/<name>.js` kopieren, `vorlage.test.js` nach `tests/js/<kurs>/<name>.test.js`. Gehört der Kurs nicht zu `kurse/`, sondern liegt an einem eigenen Pfad, kommt der Test nach `<pfad>/tests/js/`. Den Test brauchst du immer: ohne ihn meldet `kurs_pruefen` „hat keinen Test“. Der Name besteht nur aus Kleinbuchstaben, Ziffern und `-`.
2. **Umbenennen:** In `<name>.js` die Zeile `const ART = 'vorlage';` auf den neuen Namen setzen. Im Kurstext steht dasselbe: `### Titel {.werkzeug name="<name>" min="0" max="10" schritt="1" einheit="cm" groesse="Länge"}`.
3. **f(x) und Skizze anpassen:** Nur die Stellen mit `HIER ANPASSEN` ändern: die Rechenvorschrift `f(x)`, die Zeichnung `skizze(x, k)` und bei Bedarf `leer` (ab wie vielen Werten das Feld als erledigt gilt).
4. **Test anpassen:** In `<name>.test.js` oben nur zwei Zeilen ändern: `const ART = '<name>';` und `const DATEI = 'kurse/<kurs>/werkzeuge/<name>.js';` (der Projektordner wird von selbst gefunden). Dann die erwarteten Zahlen (`x`, `y`) an dein `f(x)` anpassen.
5. **Prüfen:** `python3 tools/kurs_pruefen.py <kurs>` ausführen; das führt auch die Tests des Kurses aus. Erst wenn am Ende „bereit“ steht, ist die Simulation fertig.

## Was du nicht ändern darfst

- Gespeichert wird nur über `wert` und `laden`; kein `localStorage`, kein eigenes Speichern. Das Ereignis `change` kommt nur nach einer Handlung (Klick auf „Messwert übernehmen“) oder am Ende einer Animation, nie beim Bewegen des Reglers.
- Die Skizze nutzt nur feste Farben wie `#3F9AD6`, nie `var(--…)` oder `currentColor`; sonst fehlt sie im PDF.
- Altes JavaScript: kein `?.`, kein `??`, kein `import`/`export`; die Datei bleibt eine selbstaufrufende Funktion `(function (root) { … })(…)`.
