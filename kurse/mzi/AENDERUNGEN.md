# Änderungen gegenüber der Quelle (Kurs mzi)

## Herkunft

- Quelle des Gesamtkurses: „MZI Kurs Test“ (Ordner `Inhalte/` 1–10 und `Technik/vorlage.html`), Stand 18.11.2026. Kapitel 1–9 und die beiden Hintergründe stammen daraus.
- Kapitel 5–7 und `91-hintergrund-photonen` wurden aus dem früheren Kurs `mzi-photonen` (Quelle „MZI einzelne Photonen“, `Inhalte/` und `Technik/`) übernommen; dieser Kurs liegt jetzt unter `archiv/kurse/mzi-photonen`. Die Abschnitts- und Karten-IDs blieben unverändert (`drei-aufbauten`, `quantenradierer`, `delayed-choice`).
- Texte, Reihenfolge der Schritte und Freischaltschwellen sind übernommen (Schwellen als Konstanten oben in `werkzeuge/mzikern.js`).
- HTML-Kommentare der Quelle („Regel 14 bewusst verletzt …“) stehen als Kommentare im Markdown und werden nicht ausgegeben.

## Abweichungen

Gemäß Spec Abschnitt 2 (Nicht-Ziele) fallen weg, mit Ersatz durch die Plattform:

- Zwischenstand-Datei sichern/laden und Willkommen-Dialog → Abholcode und „Neue Gruppe“.
- Eigener Vorführmodus und `#lehrkraft` → Betreuungsmodus (fünfmal auf „foeXlab“ im Kopf tippen).
- Fotos bemalen → Fotos wie in den anderen Kursen, Skizzen als eigenes Skizzenfeld.
- Rotis-Schrift und Banner der Quelle → foeXlab-Design.

Weitere Abweichungen:

- Die Mindestlänge für Texteingaben entfällt (die Plattform kennt sie nicht).
- **Kontrollfragen:** In der Quelle wird eine Antwort mit einem Tipp gewählt und sofort bewertet. Im Kurs sind es Auswahlknöpfe (Radio) mit „Prüfen“ (`{.mc sperrt}`); erst eine richtig geprüfte Antwort öffnet das Folgende, mit `versuche="2"` nach zwei Fehlversuchen die markierte Lösung.
- **Rückmeldung bei falscher Antwort:** Wo die Quelle keinen eigenen Text hat (Kurze Kontrolle 1 und 2 in „So funktioniert das Experiment“), zeigt die Plattform ihren Standardtext „Nicht richtig“.
- **Schritt 3:** Die Erklärung der Tabellenspalten steht dort ein zweites Mal als aufklappbarer Kasten `:::mehr` („Was bedeuten die Spalten?“), damit sie nicht nur in Schritt 2 erreichbar ist.
- **Überschriften:** Kartentitel folgen `data-name`, Feldüberschriften (sie sind die Überschriften in Ergebnisseite und PDF) `data-q` aus `Technik/vorlage.html`. Wiederkehrende Überschriften tragen Aufbau, Schritt oder Kapitel davor (z. B. „Aufbau 2: Abgleich“, „Schritt 1: Kurze Kontrolle“, „Sicherung: Widerspruch“); Felder ohne `data-q` (Vorhersage, Messungen, Kontrollfragen) haben eine Überschrift nach demselben Muster. Die zweiten Karten der Sicherungsseiten (nach „Besprechung erledigt“) heißen „Sicherung“, „Komplementarität“ und „Gesamtergebnis“. Die Kennungen (`#…`) sind unverändert.
- **Stopp in Kapitel 3:** Stopp-Hinweis und Lehrkraft-Kasten stehen hinter dem Antwortfeld der Leitfrage (eigener Baustein „Besprechung“), nicht im Aufgabentext darüber.
- Der Hintergrund für Lehrkräfte (`abschnitte/91-hintergrund-photonen.md`) ist die einzige inhaltliche Anpassung: Der Absatz „Bedienung“ ist auf die Plattform umgeschrieben (Betreuungsmodus statt `#lehrkraft`, „Neue Gruppe“ und Abholcode statt Zwischenstand-Datei). Die Fußzeile der Quelle entfällt (die Plattform setzt die Fußzeile).

## Ergänzungen für Kapitel 1–4 und den Gesamtkurs

- **Ziehen:** Das Zuordnen der Bauteile in Kapitel 2 („Schema zusammensetzen“) ist ein Ziehen-Feld der Plattform (Bildzuordnung mit Chips) statt des Original-Ziehen-Codes der Vorlage.
- **Checkliste:** Die Materialliste in Kapitel 3 ist ein Checklistenfeld (zehn Kästchen) der Plattform.
- **Knopf:** „Aufbau fertig“ in Kapitel 3 ist ein Knopf der Plattform (`knopf:aufbau-fertig`) statt des Bestätigen-Knopfs der Vorlage; er öffnet Kapitel 4.
- **Titelregel:** Kartentitel = `data-name`, Feldüberschriften = `data-q` der Vorlage; wo kein `data-q` existiert, das `lbl` der Vorlage, bei Wiederholung mit Kapitel- oder Seitenpräfix eindeutig.
- **Kapitel 5:** Neue erste Karte „Von der klassischen Physik zur Quantenphysik“ (`#uebergang`, Info-Kasten) mit dem Text „Übergang“ aus `5-drei-aufbauten.md`. Kapitel 5 öffnet sich nach dem Vergleich der Interferenzmuster (Kapitel 4). Die Kapitel 6 und 7 behalten ihre Ketten.
- **Kapitelnummern:** Die früheren Kapitel 1–3 des Photonenkurses sind jetzt Kapitel 5–7 (`nr`).
- **Hintergründe:** `90-hintergrund-aufbau` („Hintergrund: Aufbau und Interferenz“) und `91-hintergrund-photonen` („Hintergrund: Einzelne Photonen“) stehen unter „Zum Nachschlagen“.
- **Abgleich:** Der Inhaltsabgleich gegen `MZI Kurs Test/Inhalte` meldet keine fehlenden Sätze; Ausnahmen (Sicherung, Fußzeilen, Bedienung) mit Begründung in `abgleich-ausnahmen.txt`. Der übrige Wortlaut der Kapitel 5–7 und des Photonen-Hintergrunds stimmt mit der neuen Quelle überein.

## Fassung v3 (23.11.2026): Rückmeldungen aus der ersten Erprobung

Quelle ist jetzt „MZI Kurs Test v3“ (`Inhalte/` und `Technik/`, Stand 23.11.2026). Der Inhaltsabgleich gegen `MZI Kurs Test v3/Inhalte` meldet keine fehlenden Sätze (`tests/py/test_mzi_struktur.py` prüft das).

**Fotos (Rückmeldung der Erprobung, Plattform):**

- Der Foto-Upload ließ „Weiter“ manchmal gesperrt, obwohl das Foto gespeichert war: Die Plattform prüfte die Sperre nach dem Hinzufügen eines Fotos nicht neu (`engine/web/js/foto.js`). Behoben; außerdem liest der Upload Bilder robuster ein (ohne `createImageBitmap`-Optionen bzw. über `<img>`, Ersatz für ein leeres `toBlob`).
- Lässt sich ein Foto trotzdem nicht hochladen, erscheint nach dem ersten Versuch der Knopf „Foto klappt nicht? Ohne Foto weiter“. Das Feld gilt dann als erledigt; Ergebnisseite und PDF zeigen „Kein Foto: Es ließ sich nicht hochladen.“
- Ein sperrendes Foto-Feld sagt jetzt „Fügt zuerst ein Foto hinzu, dann geht es weiter.“
- Kapitel 6: Je Seite ist nur noch **ein** Foto Pflicht (`pol-par`, `rad-p45`); das zweite (`pol-kr`, `rad-m45`) ist freiwillig. Unter den Fotofeldern steht „Pflicht: mindestens dieses eine Foto.“ bzw. „Freiwillig.“

**Inhalte (v2/v3 der Quelle):**

- **Kapitel 4:** Neue Karte „Gangunterschied“ (`#a-k4-gang`) mit Beobachtung, Info, Simulation (neues Werkzeug `gangunterschied`: Ringmuster auf beiden Schirmen, Regler 0–2λ in λ/16), Lückenfrage zu den beiden Werten (λ/2, λ), Erklärung und Kontrollfrage. In der Quelle zwei Auswahlfelder mit eigenem „Prüfen“; hier eine Lücken-Kontrollfrage der Plattform. Kapitel 5 öffnet sich jetzt nach dieser Karte.
- **Kapitel 5:** Einstieg über die „verbotene Frage“. „Spiegel verschieben“ heißt „Armlänge verändern“ und arbeitet mit dem Gangunterschied Δs statt Δφ (Anzeige in Bruchteilen von λ, intern weiter Grad; Regler in λ/16). „Abweichung des realen Aufbaus“, „Widerspruch“ und die Sicherungsseiten `k1-sich-1`/`k1-sich-2` entfallen; die Zusatzaufgabe Wesenszüge steht freiwillig am Ende von „Armlänge verändern“. Neue Karte „Klassisch und quantenphysikalisch“ (`#k1-vgl`) mit Vergleichstabelle (neues Werkzeug `vergleich`, nur Tippen, kein Stift), den Hilfen „Wo findet ihr das?“ als aufklappbarer Kasten, Erwartungshorizont für Lehrkräfte, Koinzidenz-Hilfe (neues Werkzeug `koinzidenz`, freiwillig) und Ausblick. Kapitel 6 öffnet sich nach der Vergleichstabelle.
- **Kapitel 6:** Roter Faden über Begründung 1 (Störung) und 2 (Festlegung vorab). Hypothesen und Abgleiche (`qr-hyp1`, `qr-abgl1`, `qr-hyp2`, `qr-abgl2`) entfallen. Neue Kontrollfrage zu Begründung 1 (`#qr-k3`, `versuche="2"`). Die Karte „Komplementarität“ enthält jetzt Sicherung, „Begründung 1 beurteilen“ (mit Tipp und Erwartung für Lehrkräfte), Kontrollfrage und Besprechung; Merksatz und Überleitung stehen nach „Besprechung erledigt“. Die Felder `qr-sich` und `qr-eign` liegen damit in `k2-sich-1` statt `k2-sich-2` (gespeicherte Eingaben aus der ersten Erprobung erscheinen dort nicht mehr).
- **Kapitel 7:** Begründung 2 statt Hypothese A/B. Die Vorhersage (`dc-hyp`) steht jetzt mit Zitat, Tipp und Erwartung für Lehrkräfte nach den beiden Kurzkontrollen in „So funktioniert das Experiment“ (`k3-funk` statt `k3-motiv`). Δs statt Δφ in allen Schritten; der Messdurchlauf hat 17 Messreihen in Schritten von λ/16. Neue Aufgabe „Eigene Begründung“ (`#deut4`, mit Tipp). Kapitel 7 öffnet sich über „Besprechung erledigt“ in Kapitel 6.
- Tippfehler der Quelle „Interferenzsmusters“ (Merksatz Komplementarität) ist im Kurs und in `MZI Kurs Test v3/Inhalte/6-quantenradierer.md` zu „Interferenzmusters“ korrigiert.
- Hilfen der Quelle („Hilfe“ zum Aufklappen) sind `:::tipp`-Kästen, Zitate der Begründungen Blockzitate.

## Noch zu prüfen

- **Phasensprünge Info:** Der Text ist ein Entwurf von Claude nach NUN-AB 01 (Kommentar „Entwurf von Claude … bitte prüfen“ im Markdown) und wurde unverändert übernommen.
- **Kontrollfragen:** Alle Kontrollfragen („Kurze Kontrolle“, „Kontrolle Einzelmessungen“, „Kontrolle Messreihen“, „Kontrolle Ergebnis“ und die Quizfragen) stammen aus der überarbeiteten Fassung der Quelle und wurden unverändert übernommen; fachliche und didaktische Prüfung steht aus.
- **Kapitelnummern in den Quelltexten 5–7:** Die Texte der Kapitel 5–7 verweisen wörtlich auf „Kapitel 1/2/3“ des früheren Einzelphotonen-Kurses (05: Z. 245; 06: Z. 22, 55, 111; 07: Z. 28, 229, 254). Sie wurden unverändert übernommen; die Autorinnen und Autoren entscheiden, ob daraus Kapitel 5/6/7 werden.
- **v3 – Kapitelverweise:** Auch die neuen Texte verweisen auf „Kapitel 1/2“ des Einzelphotonen-Teils (z. B. „Welche der beiden Begründungen ist nach Kapitel 2 noch offen?“) und auf den „Aufbau-Teil“.
- **v3 – Lückenfrage Gangunterschied:** Rückmeldung bei richtiger Antwort („Richtig.“) ist ergänzt; die Quelle hat dort keinen Text.
- **v3 – Vergleichstabelle:** In der Quelle lassen sich die Tabellenfelder auch mit dem Stift beschreiben; hier nur Tippen.
- **v3 – Foto-Upload:** Die Ursache „Weiter bleibt gesperrt“ ist behoben und mit Tests abgesichert. Ob der robustere Bild-Import das Problem auf den Labor-iPads ganz löst, ist dort noch nicht erprobt; der Knopf „Ohne Foto weiter“ verhindert in jedem Fall, dass eine Gruppe hängen bleibt.
