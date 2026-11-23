---
titel: "Delayed choice"
nr: 7
oeffnet_nach: knopf:stopp-2
grund: "Öffnet sich nach der Besprechung von Kapitel 6."
---

## Die Idee {#k3-motiv}

<!-- Regel 14 bewusst verletzt: klassische Annahme, die geprüft wird -->
Mit dem Quantenradierer habt ihr gesehen, dass sich Begründung 1 experimentell nicht halten lässt. Begründung 2 ist noch offen: „Physikalisch ist festgelegt, was passiert, wir wissen es nur nicht. Das Photon richtet sich schon bei der Emission nach dem Aufbau.“ Mit einem Aufbau, der feststeht, bevor die Quelle das Photon emittiert, lässt sie sich nicht prüfen. Deshalb schlug John Wheeler ein **Delayed-Choice-Experiment** vor.

Experimentelle Idee II: Ein Zufallsgenerator entscheidet, ob der zweite Strahlteiler im Aufbau steht oder nicht. Diese Entscheidung wird verspätet (delayed) getroffen, nämlich nachdem das Photon den ersten Strahlteiler passiert haben muss. Diese Zeit lässt sich aus der Lichtgeschwindigkeit und dem Abstand der Bauteile bestimmen. Nach vielen Wiederholungen des Experiments vergleichen wir die Messergebnisse für beide Varianten (Strahlteiler eingebaut oder nicht).

## So funktioniert das Experiment {#k3-funk}

### Aufbau des Experiments {.werkzeug name="dcaufbau" #dc-aufbau}

So haben Jacques und Kollegen das Experiment 2007 mit echten einzelnen Photonen durchgeführt:

- **Einzelphotonenquelle:** Sie emittiert immer genau ein Photon, etwa 1000 Photonen pro Sekunde.
- **Strahlteiler 1 und zwei Spiegel:** wie in Aufbau 2 und 3.
- **Strahlteiler 2 ist schaltbar:** Er ist für jedes Photon entweder drin oder draußen. Im echten Experiment ist das ein elektrooptisches Bauteil, das in wenigen milliardstel Sekunden umschaltet.
- **Zufallsgenerator:** Er entscheidet für jedes Photon neu, ob Strahlteiler 2 drin oder draußen ist, jeweils mit der Wahrscheinlichkeit ½.
- **Detektoren und Zählelektronik:** Für jedes Photon wird gespeichert, was der Zufallsgenerator gewählt hat und welcher Detektor geklickt hat.

### Zeitlicher Ablauf {.info}

<!-- Regel 14 bewusst verletzt: Bahnvorstellung als klassische Annahme, die zum Widerspruch führt -->Die Zeitleiste unter dem Aufbau zeigt die Reihenfolge für ein Photon. Im Experiment war das Interferometer 48 m lang, das Photon braucht dafür etwa 160 milliardstel Sekunden. Der Zufallsgenerator entscheidet erst, **wenn das Photon den ersten Strahlteiler schon durchlaufen hat**.  Wir werden das Experiment nachfolgend Schritt für Schritt durchgehen.

### Kurze Kontrolle 1: Zeitpunkt {.mc sperrt #dc-q1}

Wann entscheidet der Zufallsgenerator, ob Strahlteiler 2 drin ist?

:::antworten
- [ ] Bevor die Quelle das Photon emittiert.
- [x] <!-- Regel 14 bewusst verletzt: Bahnvorstellung als klassische Annahme, die zum Widerspruch führt -->Wenn das Photon den ersten Strahlteiler schon durchlaufen hat.
- [ ] Erst nachdem ein Detektor geklickt hat.
:::

### Kurze Kontrolle 2: Daten {.mc sperrt #dc-q2}

Was speichert die Zählelektronik für jedes Photon?

:::antworten
- [ ] Nur, welcher Detektor geklickt hat.
- [x] Welcher Detektor geklickt hat und was der Zufallsgenerator gewählt hat.
- [ ] Über welche Möglichkeit das Photon gelaufen ist.
:::

### Vorhersage der Hypothese {.vermutung sperrt #dc-hyp platzhalter="Bei „drin“ müsste …, bei „draußen“ …"}

<!-- Regel 14 bewusst verletzt: klassische Annahme, die geprüft wird -->
> **Begründung 2 (Festlegung vorab):** „Physikalisch ist festgelegt, was passiert, wir wissen es nur nicht, genau wie beim Würfeln oder beim Münzwurf. Das Photon richtet sich schon bei der Emission nach dem Aufbau: Ist Strahlteiler 2 eingebaut, zeigt es Interferenz. Ist er nicht eingebaut, steht fest, ob es am ersten Strahlteiler reflektiert oder transmittiert wurde.“

Leitet aus Begründung 2 ab, was ihr bei „Strahlteiler 2 drin“ und bei „Strahlteiler 2 draußen“ an den Detektoren messen müsstet, wenn erst nach der Emission über den Aufbau entschieden wird. Schreibt eure Vorhersage auf, bevor ihr weitermacht.

:::tipp
Nach Begründung 2 richtet sich das Photon nach dem Aufbau, der bei der Emission besteht. Welcher Aufbau ist das, wenn der Zufallsgenerator erst später entscheidet?
:::

:::lehrkraft
Erwartung: Nach Begründung 2 kann sich das Photon bei der Emission nur nach einem noch unentschiedenen Aufbau richten. Ändert sich der Aufbau danach, passt die Festlegung bei einem Teil der Photonen nicht zum Aufbau bei der Messung. Bei „drin“ wäre deshalb keine vollständige Interferenz zu erwarten, das Messergebnis müsste näher an 50 : 50 liegen. Gemessen wird: Bei „drin“ hängen die Zählraten wie in Aufbau 3 von Δs ab, bei „draußen“ je 50 %.
:::

## Schritt 1: Einzelmessungen {#k3-s1}

**Einzelmessungen.** Mit jedem Knopfdruck emittiert die Quelle ein einzelnes Photon. Verfolgt in der Zeitleiste, was nacheinander passiert: Bei jedem Photon entscheidet der Zufallsgenerator neu, ob Strahlteiler 2 drin oder draußen ist. Führt 10 Einzelmessungen durch. Die beiden Interferometerarme sind exakt gleich lang (Gangunterschied Δs = 0).

### Schritt 1: Einzelmessungen {.werkzeug name="dceinzel" sperrt #s1}

### Einzelmessungen: Beobachtung {.frei sperrt #s1-frage}

Beschreibt die Messergebnisse für die Fälle „drin“ und „draußen“. Beurteilt, ob 10 Einzelmessungen für eine sichere Beurteilung der Hypothesen reichen.

### Schritt 1: Kurze Kontrolle {.mc sperrt versuche="2" #s1-kontrolle}

Reichen 10 Einzelmessungen für eine sichere Beurteilung der Hypothesen?

:::antworten
- [ ] Ja, man sieht schon, an welchem Detektor die Zählrate größer ist.
- [x] Nein, die Messergebnisse sind zufällig. Bei wenigen Einzelmessungen kann die Häufigkeitsverteilung der Messergebnisse stark von der Wahrscheinlichkeit abweichen.
:::
:::falsch
Führt noch einmal 10 Einzelmessungen durch und vergleicht sie mit der ersten Runde.
:::
:::nach_versuchen
Die richtige Antwort ist markiert. Bei nur 10 Einzelmessungen kann die Häufigkeitsverteilung der Messergebnisse zufällig stark schwanken. Deshalb nehmt ihr im nächsten Schritt Messreihen auf.
:::

## Schritt 2: Messreihen bei Δs = 0 {#k3-s2}

**Messreihen.** Jetzt zählt die Zählelektronik eine Sekunde lang. In dieser Zeit emittiert die Quelle 1000 Photonen. Eine Messreihe besteht also aus 1000 Einzelmessungen, und bei jeder entscheidet der Zufallsgenerator neu, genau wie in Schritt 1. Die Messergebnisse werden nach der Einstellung des Zufallsgenerators getrennt gezählt. Führt mindestens 3 Messreihen bei Δs = 0 durch.

### Schritt 2: Messreihen {.werkzeug name="dcmessreihe" modus="s2" nachher="delayed-choice/k3-s3/s3" sperrt #s2}

:::mehr Was bedeuten die Spalten?
- **Messreihe:** Nummer der Messreihe. Eine Messreihe dauert 1 Sekunde und besteht aus 1000 Einzelmessungen.
- **Δs:** eingestellter Gangunterschied.
- **Strahlteiler 2:** was der Zufallsgenerator gewählt hat.
- **Messungen:** bei wie vielen der 1000 Einzelmessungen der Zufallsgenerator diese Einstellung gewählt hat.
- **Zählrate D1, Zählrate D2:** wie oft Detektor 1 bzw. Detektor 2 bei diesen Messungen geklickt hat.

Jede Messreihe steht deshalb in zwei Zeilen: eine für „drin“, eine für „draußen“. Mit „Häufigkeitsdiagramm“ seht ihr dieselben Messreihen als Diagramm.
:::

### Messreihen bei Δs = 0: Beobachtung {.frei sperrt #s2-frage}

Vergleicht die Messergebnisse für die Fälle „drin“ und „draußen“. 

## Schritt 3: Gangunterschied verändern {#k3-s3}

**Gangunterschied verändern.** Stellt mit dem Regler einen anderen Gangunterschied Δs ein. Führt bei mindestens 3 weiteren Gangunterschieden jeweils mindestens 2 Messreihen durch. So habt ihr für jeden Gangunterschied mehrere Messreihen, aus denen ihr im nächsten Schritt einen Mittelwert bildet.

### Schritt 3: Messreihen bei anderen Gangunterschieden {.werkzeug name="dcmessreihe" modus="s3" vorher="delayed-choice/k3-s2/s2" sperrt #s3}

:::mehr Was bedeuten die Spalten?
- **Messreihe:** Nummer der Messreihe. Eine Messreihe dauert 1 Sekunde und besteht aus 1000 Einzelmessungen.
- **Δs:** eingestellter Gangunterschied.
- **Strahlteiler 2:** was der Zufallsgenerator gewählt hat.
- **Messungen:** bei wie vielen der 1000 Einzelmessungen der Zufallsgenerator diese Einstellung gewählt hat.
- **Zählrate D1, Zählrate D2:** wie oft Detektor 1 bzw. Detektor 2 bei diesen Messungen geklickt hat.

Jede Messreihe steht deshalb in zwei Zeilen: eine für „drin“, eine für „draußen“.
:::

## Schritt 4: Sortieren und mitteln {#k3-s4}

### Vorhersage für die Diagramme {.vermutung sperrt #s4-vorh platzhalter="Wir erwarten …"}

Gleich ordnet ihr eure Messreihen zwei Diagrammen zu: „Strahlteiler 2 drin“ und „Strahlteiler 2 draußen“. Stellt eine Hypothese auf, wie in den jeweiligen Diagrammen die Zählraten von Detektor 1 und 2 vom Gangunterschied Δs abhängen.

### Schritt 4: Sortieren und mitteln {.werkzeug name="dcsortieren" quellen="delayed-choice/k3-s2/s2,delayed-choice/k3-s3/s3" sperrt #s4}

**Sortieren und mitteln.** Ordnet jede Zeile der Tabelle einem der beiden Diagramme zu. Entscheidend ist, was der Zufallsgenerator gewählt hat.

### Mittelwert {.info}

In die Diagramme wird für jeden Gangunterschied der **Mittelwert** eingetragen. Beispiel: Habt ihr bei einem Gangunterschied zwei Messreihen mit den Zählraten 120 und 130 pro Sekunde an einem Detektor, wird (120 + 130) : 2 = 125 pro Sekunde eingetragen. Blau ist Detektor 1, rot ist Detektor 2. Die Tabelle unter den Diagrammen zeigt, aus wie vielen Messreihen jeder Mittelwert gebildet ist.

### Was die Diagramme zeigen {.frei sperrt #s4-frage}

Beschreibt in ein bis zwei Sätzen, was ihr in den beiden Diagrammen seht. Beurteilt, ob eure Messreihen bereits ausreichen, um Begründung 2 beurteilen zu können.

### Schritt 4: Kurze Kontrolle {.mc sperrt versuche="2" #s4-kontrolle}

Reichen eure Messreihen für eine sichere Beurteilung der Hypothesen?

:::antworten
- [ ] Ja, die Mittelwerte zeigen den Verlauf schon eindeutig.
- [x] Nein, es liegen nur wenige Gangunterschiede mit wenigen Messreihen vor. Dazwischen ist der Verlauf unbekannt.
:::
:::falsch
Zählt, bei wie vielen Gangunterschieden ihr gemessen habt, und schaut, was zwischen diesen Punkten im Diagramm steht.
:::
:::nach_versuchen
Die richtige Antwort ist markiert. Mit wenigen Gangunterschieden bleibt offen, wie die Zählraten dazwischen verlaufen. Deshalb übernimmt im nächsten Schritt die Messsoftware einen kompletten Messdurchlauf.
:::

## Schritt 5: kompletter Messdurchlauf {#k3-s5}

**Kompletter Messdurchlauf.** Jetzt übernimmt die Messsoftware. Sie stellt Δs nacheinander von 0 bis λ in Schritten von λ/16 ein und nimmt bei jedem Gangunterschied eine Messreihe auf (1 Sekunde, 1000 Einzelmessungen). Dann sortiert sie die Messergebnisse nach der Einstellung des Zufallsgenerators und trägt sie in die beiden Diagramme ein. Ihr seht den Durchlauf im Zeitraffer, in Wirklichkeit dauert er über eine Minute.

### Schritt 5: Messdurchlauf {.werkzeug name="dcdurchlauf" modus="lauf" sperrt #s5}

## Ergebnis {#k3-erg}

### Ergebnis des Messdurchlaufs {.werkzeug name="dcergebnis" quelle="delayed-choice/k3-s5/s5" #erg-anzeige}

### Ergebnis {.frei sperrt #erg}

Beschreibt das Ergebnis des Messdurchlaufs. Geht auf beide Diagramme ein:

- Wie hängen die Zählraten an Detektor 1 und Detektor 2 vom Gangunterschied Δs ab?
- Bei welchen Gangunterschieden ist die Zählrate an einem Detektor null?
- Wie groß sind die Zählraten, wenn Strahlteiler 2 draußen ist?

## Deutung {#k3-deut}

Eure Vorhersage aus Begründung 2 vom Anfang des Kapitels:

### Vorhersage {.werkzeug name="zitat" quelle="delayed-choice/k3-funk/dc-hyp" #zitat}

### Deutung: Kurze Kontrolle {.mc sperrt #dc-kontrolle}

Was zeigen die beiden Diagramme des Messdurchlaufs?

:::antworten
- [ ] Bei „drin“ und bei „draußen“ hängen die Zählraten von Δs ab.
- [x] Nur bei „drin“ hängen die Zählraten von Δs ab, bei „draußen“ nicht.
- [ ] Bei keiner der beiden Einstellungen hängen die Zählraten von Δs ab.
:::
:::falsch
Schaut euch die beiden Diagramme noch einmal nebeneinander an.
:::

### Abgleich mit der Hypothese {.frei sperrt #deut1}

Vergleicht eure Vorhersage aus Begründung 2 mit dem Ergebnis.

### Späte Entscheidung und Begründung 2 {.frei sperrt #deut2 platzhalter="1. … 2. … 3. …"}

<!-- Regel 14 bewusst verletzt: Bahnvorstellung als klassische Annahme, die zum Widerspruch führt -->Der Zufallsgenerator hat erst entschieden, als das Photon den ersten Strahlteiler schon durchlaufen hatte.

1. Betrachtet die Photonen, bei denen Strahlteiler 2 erst danach eingebaut wurde. Leitet aus Begründung 2 ab, was ihr an den Detektoren messen müsstet, und vergleicht mit dem Messergebnis bei „drin“.
2. Betrachtet die Photonen, bei denen Strahlteiler 2 nicht eingebaut wurde. Leitet aus Begründung 2 ab, was ihr messen müsstet, und vergleicht mit dem Messergebnis bei „draußen“.
3. Beurteilt, ob Begründung 2 haltbar ist.

### Beschreibung ohne Wege {.frei sperrt #deut3}

Beschreibt das Ergebnis, ohne über Orte des Photons zu sprechen. Sagt nur, wie der Aufbau zum Zeitpunkt der Messung aussah und welche Zählraten gemessen wurden.

### Eigene Begründung {.frei sperrt #deut4}

Beide Begründungen sind widerlegt. Stellt eine eigene Begründung auf, warum die Frage „Wie gelangt das Photon von der Quelle zum Detektor?“ verboten ist, die zu allen euren Beobachtungen passt.

:::tipp
Begründung 2 nahm an, dass die Antwort feststeht und wir sie nur nicht kennen. Was folgt, wenn man diese Annahme fallen lässt?
:::

### Deutung der Physik {.info}

:::merksatz
**Deutung der Physik**

**Unbestimmtheit:** Ob das Photon reflektiert oder transmittiert wurde, ist nicht nur unbekannt, es steht nicht fest. Man nennt das objektiv unbestimmt. Anders als beim Münzwurf drückt die Wahrscheinlichkeit hier nicht unsere Unwissenheit aus, sie ist ein fester Bestandteil der Quantenphysik. Feststellen können wir nur das Messergebnis: Bei ausgebautem Strahlteiler 2 lässt sich aus dem Detektor, der klickt, auf Reflexion oder Transmission am ersten Strahlteiler schließen. Wann vorher etwas feststand, lässt sich nicht sagen. Wer dem Photon trotzdem einen Ort zuschreibt, kommt zu Widersprüchen.

**Kausalität:** Sie bleibt erhalten. Je nach Aufbau zum Zeitpunkt der Messung erhalten wir das erwartete Ergebnis, und zwar unabhängig davon, wann die Entscheidung über den Aufbau gefallen ist. Eine Wirkung in die Vergangenheit braucht man dafür nicht.

**Beschreibung ohne Wege:** Die Wahrscheinlichkeiten für die Messergebnisse ergeben sich aus dem gesamten Aufbau zum Zeitpunkt der Messung. Ist Strahlteiler 2 drin, sind die beiden klassisch denkbaren Möglichkeiten ununterscheidbar, und die Zählraten hängen von Δs ab. Ist er draußen, klickt jeder Detektor mit der Wahrscheinlichkeit ½.

**Nichtlokalität:** Für die Vorhersage muss man alle Teile des räumlich ausgedehnten Aufbaus gemeinsam betrachten. Man kann dem Photon zwischen Quelle und Detektor keinen bestimmten Weg zuschreiben.
:::

## Leitfrage und Abschluss {#k3-sich-1}

### Begründung zur Ausgangsfrage {.frei sperrt #k3-leitfrage}

Zurück zur verbotenen Frage vom Anfang: **Wie gelangt das Photon von der Quelle zum Detektor?** Begründet mithilfe eurer Beobachtungen aus allen drei Kapiteln, warum sich diese Frage nicht beantworten lässt. Geht dabei auf beide widerlegten Begründungen ein.

### Besprechung {.info}

:::info
Dieses Ergebnis sollten wir gemeinsam vergleichen. Tauscht euch in der Zwischenzeit mit einer Nachbargruppe aus.
:::

:::lehrkraft
Leitfragen für die Besprechung:

- Welches Experiment hat welche Begründung widerlegt, und wie?
- Was unterscheidet „objektiv unbestimmt“ von „subjektiv unbestimmt“ (Münzwurf)?
- Warum bleibt die Kausalität im Delayed-Choice-Experiment erhalten?
:::

### Zusatzaufgabe: Schlagzeile {.frei optional #zus-k3}

<figure class="zeitung" aria-label="Fiktiver Zeitungsartikel">
<div class="zkopf">Quanten-Aktuell</div>
<div class="zmeta"><span>Wissenschaft</span><span>fiktive Ausgabe</span><span>Preis: 1 Photon</span></div>
<div class="zschlag"><!-- Regel 14 bewusst verletzt: Schlagzeile mit Bahnvorstellung und Rückwirkung, die die Lernenden beurteilen sollen -->Photon entscheidet rückwirkend, welchen Weg es genommen hat</div>
<div class="zlead"><!-- Regel 14 bewusst verletzt: Schlagzeile mit Bahnvorstellung und Rückwirkung, die die Lernenden beurteilen sollen -->Ein Zufallsgenerator legt den Aufbau erst fest, als das Photon längst unterwegs ist. Trotzdem passt das Messergebnis immer zum Aufbau. Hat das Photon seine Vergangenheit nachträglich geändert?</div>
</figure>

Die Zeitung „Quanten-Aktuell“ berichtet über das Delayed-Choice-Experiment. Beurteilt die Schlagzeile mithilfe eurer Ergebnisse aus Kapitel 3.

### Besprechung erledigt {.knopf oeffnet="delayed-choice/k3-sich-2" id="stopp-3"}

## Gesamtergebnis {#k3-sich-2 oeffnet_nach="knopf:stopp-3"}

### Gesamtergebnis {.frei sperrt #k3-gesamt}

Fasst das Gesamtergebnis der Besprechung zusammen.
