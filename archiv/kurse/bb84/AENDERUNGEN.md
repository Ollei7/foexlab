# Änderungsliste: Dominiks BB84-Workshop als foeXlab-Kurs

Quelle: Dominik Spicka, Bachelorarbeit 2026, Website-Kopie vom 22.10.2026 (`index.html`, `baumdiagramm.html`). Lernschritte, Reihenfolge, Freischaltlogik und Formulierungen sind übernommen. Abweichungen stehen nur hier. Der Stil (du/ihr) bleibt unverändert.

Den Abgleich gegen die Lesefassung der Website macht `python3 tools/inhaltsabgleich.py <Lesefassung> kurse/bb84 --ausnahmen kurse/bb84/abgleich-ausnahmen.txt`; jede Ausnahme steht dort mit Grund.

## A. Umgesetzte fachliche Korrekturen

1. Deutung |↘⟩ (Kapitel 2, Experiment [×]): „ausschließlich Detektor D1 … D0 verzeichnet keines“ → D0 bzw. D1 vertauscht.
2. Deutung |↗⟩: D0 → D1 bzw. D1 → D0 (passend zu Beobachtung, Wahrscheinlichkeiten und Kodierungstabelle).
3. Quiz Kap. 2, Frage 1 (richtige Antwort): „Messung liest einen Zustand aus und kollabiert dabei …“ → „Messung liefert ein eindeutiges Ergebnis und löst dabei einen eventuellen Superpositionszustand auf.“
4. Quiz Kap. 2, Frage 5 (richtige Antwort): „befindet sich gleichzeitig in mehreren Zuständen“ → „befindet sich in einem eigenständigen Zustand mit Anteilen mehrerer Basiszustände“.
5. Eve-Infokarte: „im gleichen Zustand“ → „im von ihr gemessenen Zustand“.
6. Nachschlagen, Schritt 1: „verschlüsselt“ → „kodiert“.
7. Grenzen des Analogieexperiments: „einer kontinuierlichen Laserquelle“ → „kurzen Laserpulsen“ (das „einer“ entfällt der Grammatik wegen).
8. Lernblatt, Frage 3 (Kopie von Frage 2) → **Vorschlag:** „Was bedeutet für dich „zufällig“? Nenne ein Beispiel.“
9. Aufgabe 4: „Beispiele aus echten Experimenten“ mit festen Werten (vier Zeilen samt Bemerkungen) → Zufallsversuch „Eve 100-mal lauschen lassen“. Dominiks Erklärung zu den „technischen Gründen“ (QBER) steht als aufklappbare Zusatzkarte unter dem Werkzeug.

## B. Nur notiert (mit Dominik zu klären)

- Zustandskarte („besitzt Polarisation schlichtweg nicht“)
- Vorwegnahme der objektiven Unbestimmtheit in der Messungskarte
- fehlende Modellgrenzen („kein Quantenzufall am Aufbau“, „Auskoppeln unbemerkt möglich“) und der Satz zur Übertragbarkeit
- Klarstellung „zu hohe Fehlerrate → Schlüssel verwerfen“
- Jahr und Kennzahlen des Quantum Link
- „kollabiert“ in der Kein-Klon-Karte und in der Rückmeldung zu Quiz Kap. 2, Frage 1 („Messung liest ihn aus und kann dabei eine Superposition kollabieren“)
- fehlende Musterlösungen zu Eve-Fragen 1–5

## C. Still korrigierte Tippfehler

| Stelle | alt → neu |
|---|---|
| Kapitel 1, Cäsar-Beispiel | „Wulii plk prujhq“ → „Wulii plfk prujhq“ („mich“ + 3 ergibt „plfk“) |
| Kapitel 2, Experiment [+] | „Der im Bild zusehende Teilaufbau“ → „zu sehende“; „wie im Bild zusehen ist“ → „zu sehen“ |
| Kapitel 2, Experimente | „zehnmaliges drücken“ → „zehnmaliges Drücken“ |
| Kapitel 2, Experimente | „sodass am Ende sind alle vier Felder ausgefüllt sind“ und „… ausgefüllt.“ → „sodass am Ende alle vier Felder ausgefüllt sind“ |
| Kapitel 2, vier Deutungsfragen | „Gebe zusätzlich die Detektionswahrscheinlichkeit“ → „Gib zusätzlich …“ |
| Kapitel 2, ungleiche Basen | „wieder drücken des roten Knopf“ → „wieder Drücken des roten Knopfes“ |
| Kapitel 2 | „Messung in [x]-Basis“ und „Symbole + oder x“ → „[×]“ bzw. „×“ (Basiszeichen einheitlich) |
| Nachschlagen, Gleiche Basis | „das gemeinsame vergleichen der Basen“ → „Vergleichen“ |
| Nachschlagen, Überblick | „im weiteren des Kapitels“ → „im Weiteren des Kapitels“ |
| Nachschlagen, Schritt 3 | „des auf 0° eingestellten Polarisationsdreher“ → „Polarisationsdrehers“ |
| Kapitel 3 | „haltet eure Ergebisse fest“ → „Ergebnisse“; „Besprecht eure Ergebnisse“ → mit Punkt |

## D. Darstellung (keine inhaltliche Änderung)

**Plattform und Bedienung**

- Emojis, Bedienhinweise und Knöpfe der alten Website („Weiter →“, „Bitte alle Fragen beantworten!“, Admin-Schaltflächen, Schloss und Reset-Knopf in Aufgabe 2, „Verschlüsseln“-Knopf, „Als PDF speichern“) entfallen oder sind an die Plattform angepasst: Die Freischaltung geschieht über Sperren und Quiz-Serien, das Verschlüsseln läuft automatisch. Betroffen sind in Aufgabe 2 die Sätze zu Schloss und Reset-Knopf („Tippt, wenn ihr die Tabelle voll habt, auf „Zeilen in den Schlüssel übernehmen“ …“) und die Hinweise unter den Reitern Alice und Bob.
- Quiz-Rückmeldungen („Richtig! …“, „Nicht ganz. …“) stehen je Frage wie bei Dominik. Fettdruck in Fragetiteln entfällt, weil der Fragetext als Überschrift des Feldes steht.
- Die Auffangkarte „Gleiche Basis bedeutet vollständige Informationsübertragung“ (bei Dominik erst nach zweitem Fehlversuch im Wissenscheck eingeblendet) steht im Nachschlageteil und ist von jeder Wissenscheck-Frage aus erreichbar.
- Der Wissenscheck ist eine Quiz-Serie (eine Frage pro Ansicht, sofortige Rückmeldung) statt einer Folie mit Auswertung nach drei Fragen. Die Reflexionsfragen am Ende des Wissenschecks und der Aufgaben zur ungleichen Basis sperren die folgenden Karten, bis etwas eingetragen ist.
- Dominiks Karte „Deine Definitionen als PDF speichern“ entfällt; ersetzt durch den Hinweis „Deine Definitionen und alle Ergebnisse findest du auf der Ergebnisseite und im Protokoll-PDF.“ Das PDF-Export-Skript der alten Website mit eigener Zusammenfassung („Worum ging es?“) wird nicht übernommen; es steht nicht in der Lesefassung.
- Auf jeder Karte von Kapitel 3 führt „Im Protokoll nachschlagen“ in den Nachschlageteil (bei Dominik ein Hinweis am Kapitelanfang).

**Abbildungen und Werkzeuge**

- Neu gezeichnet: Messapparat [+] und [×] (statt der Abbildungen im Quelltext), Überblick Alice – Quantenkanal – (Eve) – Bob, Intercept-Resend, Codetabelle A–Z, Baumdiagramm als SVG mit Lösungsgrafik.
- Dominiks kleine Filter-Grafiken „Zustände der [+]/[×]-Basis“ sind eine Liste plus das Werkzeug „Polarisationsdreher“; die Pfeilgrafik zu |→⟩ in [×] ist eine Textzeile, die interaktive Superposition-Grafik bleibt als Werkzeug.
- „Gruppe Alice/Bob“-Tabellen in Aufgabe 1: 15 Runden untereinander statt nebeneinander; zusätzlich Spalten Dreherwinkel und Zustand bei Alice, Drehwinkel und gemessenes Bit bei Bob.
- Das Beispiel „H wird zu 00111 …“ und die Binäraddition sind Tabellen statt Kästchen.
