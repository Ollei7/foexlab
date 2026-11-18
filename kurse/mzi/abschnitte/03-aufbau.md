---
titel: "Aufbau"
nr: 3
oeffnet_nach: felder:bauteile/a-k2-schema
grund: "Öffnet sich nach Kapitel 2."
---

## Fehlerquellen {#a-k3-fehler}

Interferometer sind Präzisionsinstrumente zur Längenmessung. Schon kleine Abweichungen im Aufbau verhindern, dass ihr ein Interferenzmuster beobachten könnt. Lest die folgenden Hinweise, bevor ihr mit dem Aufbau beginnt.

:::info
1. Setzt die Aufweitungslinse erst **nach** der Justage vor den Laser.
2. Baut die Interferometerarme möglichst klein. Zwischen Strahlteiler und Spiegel sollte noch eine Faust passen.
3. Fasst niemals auf die Oberflächen der Optiken.
4. Legt lose Bauteile hin oder schraubt sie (leicht) fest.
:::

:::info
Hinweis: Ihr arbeitet mit reflektierenden Bauteilen. Auch wenn der Laser ohne Schutzbrille verwendet werden darf, schirmt bitte eure Arbeitsplatte mit den Schirmen ab und tragt beim Experimentieren keinen Schmuck wie Ringe oder Uhren.
:::

### Fingerabdruck {.mc sperrt #afinger}

<!-- Aufgabe zu Hinweis 3: Multiple Choice statt Freitext (Moritz, 17.11.). -->

Welche Folge hat ein Fingerabdruck auf einem Spiegel oder Strahlteiler für euren Aufbau?

:::antworten
- [ ] Der Fingerabdruck verändert die Wellenlänge des Laserlichts.
- [x] Das Licht wird am Fingerabdruck gestreut. Das Interferenzmuster wird schlechter erkennbar und die Oberfläche kann dauerhaft beschädigt werden.
- [ ] Ein Fingerabdruck hat keinen Einfluss, weil er sehr dünn ist.
- [ ] Am Fingerabdruck wird das gesamte Licht absorbiert, sodass auf den Schirmen nichts mehr zu sehen ist.
:::
:::falsch
Noch nicht richtig. Überlegt, was mit Licht geschieht, das auf eine verschmutzte Oberfläche trifft.
:::

### Loses Bauteil {.mc sperrt #alose}

<!-- Aufgabe zu Hinweis 4. -->

Welche Folge hat ein Bauteil, das nicht festgeschraubt ist, für euren Aufbau?

:::antworten
- [ ] Es hat keinen Einfluss, solange das Bauteil in der richtigen Lochreihe steht.
- [ ] Das Interferenzmuster wird dadurch heller.
- [x] Das Bauteil verschiebt oder verdreht sich bei der kleinsten Berührung. Weil schon sehr kleine Änderungen das Interferenzmuster verändern, geht die Justage verloren.
- [ ] Es verändert nur die Höhe des Strahls über der Platte, nicht das Interferenzmuster.
:::
:::falsch
Noch nicht richtig. Überlegt, wie genau ein Interferometer justiert sein muss.
:::

## Material holen {#a-k3-material}

### Materialliste {.checkliste sperrt #material}

Holt die folgenden Bauteile an euren Platz und hakt ab, was ihr habt.

:::liste
1 × Laser
2 × Spiegel
2 × Strahlteiler
1 × Aufweitungslinse
1 × Justierhilfe
1 × Schraubendreher
2 × Schirme
1 × Powerbank mit USB-Adapterkabel
8 × Fuß mit eckiger Basis
1 × runder Fuß mit Klemme (ggf. schon auf dem Breadboard)
:::

## Aufbau und Justage {#a-k3-aufbau}

Ihr baut das Interferometer jetzt auf und justiert es so gut, dass ihr ein Interferenzmuster beobachten könnt. Ihr könnt dafür das Video oder die Schritt-für-Schritt-Anleitung nutzen und jederzeit zwischen beiden wechseln.

### Hilfe beim Aufbau {.umschalter}

:::ansicht Video
Schaut euch das Video an. Haltet es zwischendurch an und baut die einzelnen Schritte nach. Wenn ihr an einer Stelle nicht weiterkommt, wechselt zur Anleitung oder sprecht die Betreuenden des foeXlab an.

<video controls playsinline preload="metadata"><source src="media/MZI-Aufbau.mp4" type="video/mp4"></video>
:::

:::ansicht Anleitung
**1. Den Laser justieren**

Auf der Justierhilfe ist ein Fadenkreuz aufgezeichnet. Mit ihr kann die Höhe und Parallelität des Laserstrahls geprüft werden. Stellt die Justierhilfe ganz nah vor den Laser und verstellt ihre Höhe, sodass der Laserstrahl genau die Mitte des Fadenkreuzes trifft.

![Ersteinstellung der Justierhilfe](media/IMG_20230620_103755.jpg)

Stellt nun die Justierhilfe an das andere Ende der Platte, sodass der Laser weiterhin auf sie scheint. Achtet darauf, dass die Mitte des Fadenkreuzes auf derselben Lochreihe wie die Austrittspupille des Lasers steht. Richtet nun mithilfe der beiden Schrauben am Rahmen des Lasers den Laser so aus, dass der Strahl wieder die Mitte des Fadenkreuzes trifft.

![Justierhilfe am anderen Ende der Platte](media/Justierung-Laser-Fernfeld.jpg)

Nutzt die Justierhilfe beim Dazustellen jedes weiteren Bauteils und stellt so sicher, dass die Lichtbündel immer parallel zur Aufbauplatte verlaufen. Achtet dabei darauf, über welcher Lochreihe der Arbeitsplatte das Strahlbündel verläuft. Nicht immer muss dies die Lochreihe sein, auf der der Fuß des Bauteils steht.

**2. Erster Strahlteiler**

Setzt nun den Strahlteiler mit dem eckigen Fuß vor den Laser, sodass die zwei entstehenden Bündel orthogonal zueinander stehen. Überprüft bitte **mit der Justierhilfe**, ob die Strahlbündel die **gleiche Höhe** über der Platte haben und **parallel zur Platte** verlaufen.

![Erster Strahlteiler](media/erster-Strahlteiler.jpg)

Achtet darauf, dass die **Bauteile mittig vom Laserstrahl getroffen** werden.

**3. Ersten Spiegel aufstellen**

![Erster Spiegel](media/IMG_20230620_103518.jpg)

Stellt den ersten Spiegel in den Strahlengang des am Strahlteiler transmittierten Teilbündels und achtet darauf, dass der **Strahl den Spiegel mittig trifft**. Außerdem müssen der **eintreffende und der reflektierte Strahl möglichst senkrecht zueinander** sein. Prüft auch nach diesem Schritt wieder mit der Justierhilfe die Parallelität des Strahls zur Platte und justiert den Spiegel gegebenenfalls an den Schrauben am Rahmen des Spiegels.

**4. Zweiten Spiegel aufbauen**

Der zweite Spiegel wird nun **im anderen Strahlengang analog zum ersten Spiegel** aufgebaut und justiert. Also müssen auch hier wieder eintreffender und reflektierter Strahl senkrecht zueinander sein. Außerdem muss der reflektierte Strahl parallel zur Platte verlaufen.

![Zweiter Spiegel](media/IMG_20230620_103440.jpg)

**5. Der zweite Strahlteiler vereint die Lichtbündel wieder**

![Lage des zweiten Strahlteilers](media/eingebettet-03.png) ![Ausrichtung des zweiten Strahlteilers](media/zweiter-Strahlteiler.jpg)

Bringt nun den **zweiten Strahlteiler am Schnittpunkt der beiden Teilstrahlen** in den Aufbau ein (Abbildung links). Die beiden **eintreffenden Lichtbündel** sollten auf dem Strahlteiler schon **möglichst nah beieinander** liegen und den **Strahlteiler möglichst mittig** treffen. Zum **Fixieren** verwendet ihr die **silberne Klemme**.

Hier ist es wichtig, auf die **Ausrichtung des Strahlteilers** zu achten, damit die **Reflexionen auf den Schirm** gelenkt werden (Abbildung rechts).

**6. Ausrichtung**

Nun ist euer Ziel, dass sich **die beiden Lichtbündel sowohl am Strahlteiler als auch an den Schirmen vollständig überschneiden**. Falls es euch im vorigen Schritt nicht gelungen ist, die Lichtbündel am Strahlteiler vollständig zu überlappen, **justiert die Spiegel mithilfe der Schrauben an der Halterung, bis ihr eine vollständige Überlagerung am Strahlteiler erreicht** habt. Wenn ihr nun **mit eurer Hand eines der beiden Lichtbündel abschirmt**, sollte sich der **Lichtfleck am Strahlteiler nur verdunkeln und nicht verkleinern**. Falls das noch nicht der Fall ist, müsst ihr nachbessern.

Habt ihr das geschafft, könnt ihr die beiden **Schirme aufbauen**. Haltet euch dabei an die **Abbildung oben links**.

Nun müsst ihr den Strahlteiler mithilfe der zwei Schrauben am Gestell so justieren, dass sich die **Lichtbündel an beiden Schirmen vollständig überlappen**. Ihr könnt die Überlappung wieder überprüfen, indem ihr eines der beiden Lichtbündel abschirmt und prüft, dass sich der Lichtfleck am Schirm nur verdunkelt, aber nicht verkleinert.

Danach stellt ihr die Aufweitungslinse zwischen Laser und ersten Strahlteiler. Die Ebene der Linse sollte dabei möglichst senkrecht zum Laserstrahl stehen und die Linse sollte möglichst mittig vom Laserstrahl getroffen werden.

Auf dem Schirm solltet ihr jetzt ein Muster mit konzentrischen Kreisen erkennen können. Wenn sich das Muster „bewegt“, während ihr auf die Arbeitsplatte drückt, habt ihr ein Interferenzmuster erzeugt.

Wenn ihr jetzt keine Interferenz seht, ist wahrscheinlich noch ein bisschen Feinjustierung am zweiten Strahlteiler nötig. Nehmt dafür vorher die Aufweitungslinse aus dem Aufbau, damit ihr die Lichtflecke an den Schirmen beobachten könnt.

Die meisten Gruppen brauchen zwei bis drei Anläufe.

**7. Falls es nicht klappt: der Beam-Walk**

Beim Beam-Walk werden Lichtbündel mit zwei optischen Elementen ausgerichtet. Diese beiden Elemente sind hier der erste Strahlteiler und ein Spiegel eurer Wahl. Sie werden verändert, um den Strahl auf zwei „Ziele“ einzustellen, nämlich auf den zweiten Strahlteiler <u>und</u> auf einen der beiden Schirme. Geht dabei wie folgt vor:

- Justiert den ersten Strahlteiler, bis die beiden Lichtbündel auf dem zweiten Strahlteiler überlappen.
- Justiert nun den von euch gewählten Spiegel so, dass die beiden Lichtbündel am Schirm übereinander liegen.

Wiederholt diese beiden Schritte so oft, bis die Lichtbündel sowohl am Strahlteiler als auch am Schirm optimal übereinander liegen. Setzt dann die Linse ein. Wenn ihr das Interferenzmuster noch nicht seht, dreht oder neigt langsam einen der Spiegel.

Findet ihr immer noch kein Muster, müssen die vorherigen Schritte wiederholt werden.
:::

### Foto: unser Interferenzmuster {.foto optional #muster}

<!-- Neu: Abschluss des Aufbaus. Das Foto ist freiwillig und landet in der PDF. -->

Fotografiert das Muster auf einem der Schirme. Tippt danach auf den Knopf, wenn euer Interferometer ein Interferenzmuster zeigt.

### Wir sehen ein Interferenzmuster {.knopf oeffnet="muster" id="aufbau-fertig"}
