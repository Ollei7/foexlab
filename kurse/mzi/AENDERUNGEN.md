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

## Noch zu prüfen

- **Phasensprünge Info:** Der Text ist ein Entwurf von Claude nach NUN-AB 01 (Kommentar „Entwurf von Claude … bitte prüfen“ im Markdown) und wurde unverändert übernommen.
- **Kontrollfragen:** Alle Kontrollfragen („Kurze Kontrolle“, „Kontrolle Einzelmessungen“, „Kontrolle Messreihen“, „Kontrolle Ergebnis“ und die Quizfragen) stammen aus der überarbeiteten Fassung der Quelle und wurden unverändert übernommen; fachliche und didaktische Prüfung steht aus.
- **Kapitelnummern in den Quelltexten 5–7:** Die Texte der Kapitel 5–7 verweisen wörtlich auf „Kapitel 1/2/3“ des früheren Einzelphotonen-Kurses (05: Z. 245; 06: Z. 22, 55, 111; 07: Z. 28, 229, 254). Sie wurden unverändert übernommen; die Autorinnen und Autoren entscheiden, ob daraus Kapitel 5/6/7 werden.
