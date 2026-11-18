---
titel: "Herzlich Willkommen!"
nr: 0
---

Heute geht es um Interferometrie. Dafür gucken wir uns das Michaelson-Interferometer näher an. Am Ende der Versuchseinheit werdet ihr ein Michaelson-Interferometer aufgebaut und korrekt justiert haben, sowie mithilfe von Interferenzphänomenen den Wärmeausdehnungskoeffizienten von Aluminium bestimmt haben.

Wenn ihr auf Begriffe stoßt, die ihr noch nicht kennt, könnt ihr diese am besten im Glossar nachschlagen, häufig ist ein Link hinterlegt, der euch direkt zum PDF führt.

Für die Auswertung benötigt ihr noch ein Handout. Darin werdet ihr eure Messwerte aufnehmen und auswerten.

Bevor es gleich losgeht noch ein kleiner Hinweis: Wenn ihr gleich mit dem Kurs startet, werdet ihr in Moodle sogenannte "Tests" durchführen. Dabei haben wir ein paar Informationen und Aufgaben für euch zusammengestellt, die ihr bearbeiten werdet, damit ihr fit für den Versuch seid. Ihr müsst euch aber keine Sorgen darüber machen, dass Moodle euch manchmal eine Bewertung ausgibt oder fragt, ob ihr den Test wirklich abgeben wollt. Ihr könnt auf diese Weise aber prüfen, welche Fragen ihr richtig beantwortet habt oder ob ihr das Thema richtig verstanden habt. Es ist also überhaupt nicht dramatisch mal eine Frage falsch zu beantworten ;) Die erreichten Punkte sind nicht relevant für den Versuch, also probiert es am besten einfach selbst aus. Wir wünschen euch viel Spaß und einen erfolgreichen Labortag!

Solltet ihr an der einen oder anderen Stelle nicht weiter wissen, fragt doch einfach mal euren Nachbarn und versucht, die Aufgabe gemeinsam zu lösen. Ansonsten könnt ihr natürlich aber auch immer die Mitarbeiter des foeXlab ansprechen.

## Kleine Wiederholung ;) {.test}

Zunächst wollen wir uns kurz erinnern was Interferenz ist und wo wir sie beobachten können.

### Beugung vs. Interferenz {.luecke}

#### [Beugung](media/Glossar_Optik.pdf) vs. [Interferenz](media/Glossar_Optik.pdf)

<img src="media/Rasierklinge.png" alt="Rasierklinge im Lichtweg einer monochromatischen Lichtquelle" width="200" height="253">

Was ist was? Der Unterschied zwischen diesen beiden Begriffen verschwimmt etwas. Man ist aber auf der sicheren Seite, wenn man mit {{Beugung|Interferenz}} ganz allgemein Wechselwirkungen zwischen Lichtwellen und Hindernissen, die im Lichtweg stehen, beschreibt. {{Interferenz|Beugung}} sagt man, wenn man einzelne Wellen identifizieren kann, die sich überlagern. In der oberen Abbildung wird sichtbar, dass eine Rasierklinge nicht einfach nur einen scharf umrandeten Schatten wirft, wenn {{Beugung|Interferenz}} im Spiel ist: Es treten an den Rändern sog. {{Beugungsmuster|Interferenzmuster}} auf.

:::richtig
Super, das ist richtig!
:::

:::teilweise
Das stimmt noch nicht ganz, versuch es gerne noch einmal!
:::

:::falsch
Diese Antwort ist leider nicht richtig, versuche es noch einmal
:::

### Kohärenz {.zuordnung}

#### Kohärenz

Die Kohärenz ist ein Maß für die Änderung der Phase mehrerer Wellen, während der Beobachtungszeit. Für Experimente in der Optik ist es enorm wichtig, die Kohärenzeigenschaften des verwendeten Lichtes zu kennen.

**Interferenz kann nur zwischen kohärenten Wellen auftreten!**

Überlegt euch kurz, warum dies so ist.

Ordne anschließend die verschiedenen Arten von Kohärenz ihrer Beschreibung zu:

:::paare
Als [...] werden zwei oder mehr Wellen bezeichnet, wenn sich zwischen ihnen während der Beobachtungszeit **die Phase** **nicht** **ändert**. => (zeitlich) kohärent
Als [...] werden zwei oder mehr Wellen bezeichnet, wenn sich zwischen ihnen während der Beobachtungszeit **die Phase nicht wesentlich ändert**. => (zeitlich) partiell kohärent
Als [...] werden zwei oder mehr Wellen bezeichnet, wenn sich zwischen ihnen während der Beobachtungszeit **die Phase zufällig und um mehr als** **eine Periode ändert**. => (zeitlich) inkohärent
:::

:::richtig
Super, das ist die richtige Antwort.
:::

:::teilweise
Die Antwort ist fast richtig.
:::

:::falsch
Die Antwort ist noch nicht richtig, versuche es noch einmal :)
:::

### Doppelspalt {.kurz}

#### Ein erstes Experiment zur Wellenoptik...

Das folgende Bild (oder ein Ähnliches) hast du sicher schon einmal gesehen. Es handelt sich hierbei um eines der klassischen Experimente zum Einstieg in die Wellenoptik.

<img src="media/Doppelspalt-Geogebra.png" alt="" width="700" height="424">

Wie ist der Name dieses Experimentes?

:::antworten
= Doppelspaltexperiment || Das stimmt! Dieser Versuch geht auf Thomas Young zurück, der mit solchen Experimenten Lichtwellenlängen gemessen hat und damit maßgeblich zum Durchbruch des elektromagnetischen Wellenmodells des Lichts beigetragen hat.
= Doppelspalt || Das stimmt! Dieser Versuch geht auf Thomas Young zurück, der mit solchen Experimenten Lichtwellenlängen gemessen hat und damit maßgeblich zum Durchbruch des elektromagnetischen Wellenmodells des Lichts beigetragen hat.
= Doppelspalteffekt || Das stimmt! Dieser Versuch geht auf Thomas Young zurück, der mit solchen Experimenten Lichtwellenlängen gemessen hat und damit maßgeblich zum Durchbruch des elektromagnetischen Wellenmodells des Lichts beigetragen hat.
= [0%] Doppelspalt Experiment || Das stimmt! Dieser Versuch geht auf Thomas Young zurück, der mit solchen Experimenten Lichtwellenlängen gemessen hat und damit maßgeblich zum Durchbruch des elektromagnetischen Wellenmodells des Lichts beigetragen hat.
= [0%] Interferenz am Doppelspalt || Das stimmt! Dieser Versuch geht auf Thomas Young zurück, der mit solchen Experimenten Lichtwellenlängen gemessen hat und damit maßgeblich zum Durchbruch des elektromagnetischen Wellenmodells des Lichts beigetragen hat.
= [0%] Doppelspalt-Experiment || Das stimmt! Dieser Versuch geht auf Thomas Young zurück, der mit solchen Experimenten Lichtwellenlängen gemessen hat und damit maßgeblich zum Durchbruch des elektromagnetischen Wellenmodells des Lichts beigetragen hat.
= [0%] Doppelspalt Experiment || Das stimmt! Dieser Versuch geht auf Thomas Young zurück, der mit solchen Experimenten Lichtwellenlängen gemessen hat und damit maßgeblich zum Durchbruch des elektromagnetischen Wellenmodells des Lichts beigetragen hat.
:::

### Doppelspalt und Interferenzmuster {.luecke}

#### Der Doppelspalt und sein Interferenzmuster

Schauen wir uns das Interferenzmuster noch einmal genau an:

<img src="media/Doppelspaltbild.png" alt="Interferenzbild eines Doppelspaltexperimentes" width="565" height="390">

Das obere Bild zeigt, wie man sich die Überlagerung vorstellen kann. Jede Öffnung erzeugt im Bereich hinter den Spalten eine Kugelwelle. Dieses Prinzip heißt {{Huygensches|Fermatsches}} Prinzip. Da diese Elementarwellen von einer einzigen auftreffenden Welle erzeugt wurden, sind die Phasen dieser beiden Partialwellen stets gleich; sie sind also kohärent.

Im Bereich hinter dem Doppelspalt gibt es nun Zonen, in denen sich die Partialwellen genau phasengleich überlagern (Maxima auf Maxima, bzw. Minima auf Minima; grün gekennzeichnet) und solche, in denen die Phasen um eine halbe Wellenlänge verschoben sind. Die Überlagerung in den grünen Zonen wird als {{konstruktive|destruktive}} Interferenz bezeichnet (hier ist es hell), die andere als {{destruktive|konstruktive}} (hier ist es dunkel).

:::richtig
Genau richtig!
:::

:::teilweise
Da hast du anscheinend etwas verwechselt, versuch es noch einmal.

Bei der konstruktiven Interferenz überlagern sich zwei oder mehr gleichphasige Wellen - die Gesamtamplitude der resultierende Welle vergrößert sich also.

<img src="media/konstruktive-interferenz.PNG" alt="Konstruktive Interferenz" width="700" height="361">

Bei der destruktiven Interferenz löschen sich die Wellenberge gerade mit den Wellentälern aus, sodass die resultierende Welle keine Amplitude mehr hat.

<img src="media/destruktive-INterferenz.PNG" alt="Destruktive Interferent" width="700" height="290">
:::

:::falsch
Da hast du anscheinend etwas verwechselt, versuch es noch einmal.

Bei der konstruktiven Interferenz überlagern sich zwei oder mehr gleichphasige Wellen - die Gesamtamplitude der resultierende Welle vergrößert sich also.

<img src="media/konstruktive-interferenz.PNG" alt="Konstruktive Interferenz" width="700" height="361">

Bei der destruktiven Interferenz löschen sich die Wellenberge gerade mit den Wellentälern aus, sodass die resultierende Welle keine Amplitude mehr hat.

<img src="media/destruktive-INterferenz.PNG" alt="Destruktive Interferent" width="700" height="290">
:::

:::hinweis
Bei der konstruktiven Interferenz überlagern sich zwei oder mehr gleichphasige Wellen - die Gesamtamplitude der resultierende Welle vergrößert sich also.

<img src="media/konstruktive-interferenz.PNG" alt="Konstruktive Interferenz" width="700" height="361">

Bei der destruktiven Interferenz löschen sich die Wellenberge gerade mit den Wellentälern aus, sodass die resultierende Welle keine Amplitude mehr hat.

<img src="media/destruktive-INterferenz.PNG" alt="Destruktive Interferent" width="700" height="290">
:::
