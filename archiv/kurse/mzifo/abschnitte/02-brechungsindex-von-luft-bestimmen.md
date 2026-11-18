---
titel: "Brechungsindex von Luft bestimmen"
nr: 2
---

## Was steckt hinter dem Begriff Brechungsindex? {.test}

In diesem Versuch soll es darum gehen, den Brechungsindex von Luft zu messen. Vorher müssen wir erstmal klären, was wir genau meinen, wenn wir von Brechungsindex eines Materials oder der optischen Weglänge sprechen.

### Die optische Weglänge {.info}

Betrachtet man grundlegend, was mit einem Interferometer gemessen wird, sind dies lediglich Phasenunterschiede zwischen den beiden Lichtbündeln. Bei konstruktiver Interferenz beträgt dieser \( n\cdot\pi \) und bei destruktiver Interferenz \( \frac{2n+1}{2}\cdot\pi \).

Da die Lichtbündel gleiche Wellenlänge haben, können wir von den Phasenunterschieden direkt auf Gangunterschiede der beiden Lichtbündel schließen. Der Gangunterschied bei konstruktiver Interferenz beträgt \( n\cdot\lambda \) und bei destruktiver Interferenz beträgt \( \frac{2n+1}{2}\cdot\lambda \). Dabei beziehen sich die Gangunterschiede nicht auf die geometrische Weglänge \( L_{geom} \), also die Weglänge, die wir mit einem Lineal messen können, sondern auf die sogenannte optische Weglänge \( L_{opt} \).

Die optische Weglänge kann durch zwei Faktoren beeinflusst werden:

1. Die geometrische Weglänge \( L_{geom} \): Sie kann im Michaelson-Interferometer vor allem durch das Verschieben eines Spiegels erreicht werden. Im Mach-Zehnder-Interferometer gestaltet sich die Veränderung der geometrischen Weglänge in nur einer der beiden Arme eher schwierig.
2. Der Brechungsindex \( n \): Wird in einem der beiden Arme des Interferometers zum Beispiel eine Küvette mit Wasser aufgestellt, verändert sich die optische Weglänge in diesem Arm wegen des erhöhten Brechungsindex von Wasser im Vergleich zu Luft.

### Lichtgeschwindigkeit im Medium {.frei}

Anhand der folgenden drei Videos sollt ihr den Effekt von Medien mit unterschiedlichen Brechungsindizes auf die Ausbreitungsgeschwindigkeit von Licht untersuchen. Die Welle auf grünem Hintergrund stellt die elektro-magnetische Welle im Medium dar. Der eingestellte Brechungsindex ist im Video oben links an dem Regler erkennbar. Die Welle ohne grünen Hintergrund stellt die elektro-magnetische Welle in Vakuum dar und ist dementsprechend in jedem Video gleich. Die Punkte, die die beiden Wellen abfahren, stellen die Ausbreitungsgeschwindigkeiten der beiden Lichtwellen dar.

<video controls="true"><source src="media/Vergleich-Lichtgeschwindigkeit-Vakuum-vs.-n-1.mp4"></video>

<video controls="true"><source src="media/Vergleich-Lichtgeschwindigkeit-Vakuum-vs.-n-2.mp4"></video>

<video controls="true"><source src="media/Vergleich-Lichtgeschwindigkeit-Vakuum-vs.-n-4.mp4"></video>

##### Aufgaben:

1. Vergleicht in allen drei Videos die Lichtgeschwindigkeit im Medium mit der Lichtgeschwindigkeit in Vakuum. Welches Verhältnis besteht jeweils zwischen diesen beiden Lichtgeschwindigkeiten? Stellt dieselben Vergleiche für die jeweiligen Wellenlängen an.
2. Welcher Zusammenhang besteht zwischen der Veränderung der Lichtgeschwindigkeit und der Veränderung der Wellenlänge im Medium? Welche spezifische Größe der elektromagnetischen Welle ist in allen drei Videos konstant? Erklärt eure Beobachtungen mithilfe der Energieerhaltung der elektromagnetischen Welle.
3. Betrachtet zwei Medien mit identischer geometrischer Weglänge \(L_{geom}\), aber unterschiedlichen Brechungsindizes \(n\). Erklärt anhand eurer Erkenntnisse aus der ersten Aufgabe, wie der Unterschied der optischen Weglänge \(L_{opt}\) zu Stande kommt.
4. Stellt Thesen auf, aus welchem physikalischen Grund die Lichtgeschwindigkeit in einem Medium mit hohem Brechungsindex (einem sog. optisch dichten Medium) verringert ist.

:::hinweis
1. 
2. Der Faktor, um den sich Lichtgeschwindigkeit und Wellenlänge ändern, ist gleich. Er ist zudem antiproportional zum Brechungsindex \(n\). Bei näherer Betrachtung der Videos sollte auffallen, dass die Frequenz konstant ist, unabhängig vom Brechungsindex des Mediums. Da die Energie der elektromagnetischen Welle \(E=h\cdot f\) erhalten bleibt, folgt dies zwangsläufig auch für die Frequenz. Durch den Zusammenhang \(c=f\cdot\lambda\) folgt auch die Proportionalität von Lichtgeschwindigkeit \(c\) und Wellenlänge \(\lambda\) im Medium.
3. Da sich die Lichtgeschwindigkeit im Medium antiproportional zum Brechungsindex verändert, braucht das Licht für eine gleich lange geometrische Weglänge vergleichsweise mehr Zeit, wenn der Brechungsindex des betrachteten Mediums höher ist als der Brechungsindex des verglichenen Mediums. Es scheint also, als würde das Licht durch das Medium mit größerem Brechungsindex einen längeren Weg zurücklegen. Dieses Phänomen wird durch die optische Weglänge \(L_{opt}=n\cdot L_{geom}\) beschrieben.
4. In einem optisch dichteren Medium gibt es mehr Teilchen, die mit den Photonen des Lichts wechselwirken, als in einem optisch dünneren Medium. Durch die vielen Wechselwirkungen wird die Lichtgeschwindigkeit verringert.
:::

## Messung und Auswertung {.test}

Jetzt wollen wir selber messen!

### Messprinzip {.frei}

Wir wollen nun mit unserem Interferometer den Brechungsindex von Luft ermitteln. Dazu stellen wir in einen der beiden Arme unseres Interferometers eine Küvette, aus der wir die Luft abpumpen und damit den Luftdruck verringern können. Durch die Verringerung des Luftdruck sehen wir eine Veränderung des Interferenzbildes.

Stellt eine Vermutung auf, warum sich das Interferenzbild bei Druckverringerung verändert. Erinnert euch dafür an das vorherige Kapitel zum Thema "Was steckt hinter dem Begriff Brechungsindex".

:::hinweis
Wird der Druck in der Luftküvette verringert, verringert sich auch die Anzahl an Teilchen in der Küvette, mit der die Photonen des Lasers wechselwirken können. Wie wir aus dem vorherigen Kapitel wissen, hängt diese Teilchenanzahl unmittelbar mit dem Brechungsindex der Luft zusammen. Somit verringert sich auch der Brechungsindex der Luft und die optische Weglänge der Küvette verkürzt sich. Mit der optischen Weglänge der Küvette verkürzt sich auch die optische Weglänge des gesamten Arms des Interferometers. Schlussendlich verändert sich damit die optische Weglängendifferenz der beiden Arme des Interferometers und das Interferenzmuster verändert sich.
:::

### Theorie zur Auswertung MZI {.info}

Für die Auswertung wird die Beobachtung der Mitte des ringförmigen Interferenzmusters am wichtigsten sein. Hat sich diese einmal von Dunkel zu Hell und wieder zurück zu Dunkel verändert, hat sich die optische Weglängendifferenz zwischen den beiden Interferometerarmen um genau eine Wellenlänge \(\lambda\) verschoben. Überlegt kurz für euch, warum das so ist.

:::hinweis
Verändert sich die Mitte des Interferenzmusters von Dunkel zu Hell und wieder zurück zu Dunkel, haben wir das gleiche Interferenzmuster wie am Ausgangspunkt. Die Phasendifferenz der beiden Teilstrahlen am Schirm muss sich also um \(2\pi\) verschoben haben, die optische Weglängendifferenz entsprechend um \(\lambda\). Da der Laserstrahl die Küvette im Mach-Zehnder-Interferometer nur einmal durchläuft auf dem Weg vom Laser zum Schirm, muss sich auch die optische Weglängendifferenz zwischen den beiden Interferometerarmen um \(\lambda\) verschoben haben.
:::

### Messung {.info}

Erstellt euch als Vorbereitung eine Tabelle mit zwei Spalten. In die linke Spalte tragt ihr die Anzahl der Wechsel Dunkel \(\to\) Hell \(\to\) Dunkel \(\Delta N\) ein und auf der rechten Seite den zugehörigen Druckunterschied \(\Delta p\) in Millibar. Auf dem Barometer ist das die schwarze Skala.

Pumpt nun so lange Luft ab, bis ihr \(\Delta n=5\) Wechsel Dunkel \(\to\) Hell \(\to\) Dunkel gezählt habt und messt dann den Druckunterschied in Millibar. Notiert die Messwerte in der vorher angefertigten Tabelle. Wiederholt dies, bis ihr bei \(\Delta n=20\) oder \(\Delta n=25\) angelangt seid.

### Regressionsüberlegungen MZI {.info}

Erstellt euch ein Diagramm mit \(\Delta N\) auf der y-Achse und \(\Delta p\) auf der x-Achse und tragt eure Messpunkte ein.

Die Messpunkte \( (\Delta p,\Delta N) \) sollten theoretisch auf einer Geraden der Form \( \Delta N= m \cdot \Delta p \) liegen. Zur Berechnung des Brechungsindex benötigen wir die Steigung dieser Gerade.

Zeichnet nun eine Ausgleichsgerade durch eure Messpunkte und bestimmt die Steigung. Diese können wir mittels Steigungsdreieck bestimmen: \( m=\dfrac{\Delta N}{\Delta p} \)

Für eine genauere Auswertung bestimmt mittels linearer Regression eures Taschenrechners die Steigung der Ausgleichsgeraden.

Aus der Steigung könnt ihr nun den Wert für \( n_{Luft}\) berechnen. Dafür benötigt ihr folgende Parameter:

Außenluftdruck \( p_0 \) wird von uns vor Ort angegeben.

Wellenlänge des Lasers: \( \lambda = 532\) nm

Länge der Küvette: \( L = 5\) cm

Der Zusammenhang zwischen der Steigung \( \left( \dfrac{\Delta N}{\Delta p}\right)\) und \( n_{Luft}\) ist gegeben durch:

$$ n\_{Luft}= 1 + \dfrac{\Delta N}{\Delta p}\cdot \dfrac{\lambda}{L} p\_0 $$

Achtet bei der Auswertung darauf, dass ihr Längen und Luftdrücke jeweils in der gleichen Einheit in die Berechnung einbringt.

Wenn ihr den Hintergrund dieser Formel nicht versteht, macht euch keine Sorge: Hierfür braucht man Vorwissen aus verschiedenen Bereichen der Physik, welches in der Regel in der Schule nicht vermittelt wird.

Vergleicht den von euch gemessenen Wert, mit dem aus der Literatur (bei Normalbedingungen: \( n_{Luft}= 1,000292 \) ).

Stimmt eure Messung mit der Literatur überein?
