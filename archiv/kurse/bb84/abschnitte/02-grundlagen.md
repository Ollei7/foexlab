---
titel: Die Grundlagen der Quantenphysik
nr: 2
oeffnet_nach: quiz:schluesselverteilungsproblem/verstaendnisfragen-kapitel-1
---
Um zu verstehen wie die sichere Kommunikation mit dem BB84-Protokoll funktioniert müssen erst einmal einige Grundbegriffe geklärt werden. Nimm dir die Zeit, die du brauchst und halte zwischendurch dein neues oder aufgefrischtes Wissen in den bearbeitbaren Textfeldern fest.

## Das Einzelphoton und sein Zustand

Das Photon ist das Quantenobjekt des Lichtes.

Wollen wir dieses beschreiben, können wir uns an keinen klassischen Eigenschaften wie Ort oder Polarisation bedienen, da Quantenobjekte diese schlichtweg nicht besitzt. Stattdessen nutzen wir den **quantenmechanischen Zustand** |ψ⟩ zur Beschreibung.

Im Zustand werden alle potenziell möglichen Messwerte eines Experiments verknüpft mit einer Wahrscheinlichkeit zusammengefasst. Der Zustand beschreibt damit keine bereits vorliegende Eigenschaft des Objekts, sondern ist ein Vorhersagekatalog für alle potenziell möglichen Messergebnisse. Solange keine Messung erfolgt ist, kann man einem Photon keine Eigenschaften zuschreiben, die sich erst durch die Messung feststellen lassen.

:::merksatz
Daher kann man auch nicht beantworten, was ein Photon "vor" einer Messung tut, ob es sich „irgendwo befindet" oder wie es sich „bewegt". Diese Fragen sind nicht beantwortbar. Eine Beschreibung des Photons ist nur mit mathematischen Konzepten der Quantenphysik möglich, die jedoch nicht in der Schule behandelt werden, weshalb wir nicht genauer auf diese eingehen.
:::

### Beschreibe in eigenen Worten, was ein Quantenzustand ist. {.frei platzhalter="…" #def-zustand}

## Präparation: Einen Zustand gezielt herstellen

Die Präparation des Photons erfolgt durch den **Sender (Alice)** mithilfe eines Polarisationsdrehers. Alice besteht im Gesamten aus einer Photonenquelle, in unserem Fall ein Laser und dem genannten Polarisationsdreher mit vier verschiedenen Winkeleinstellungen.

![Alice](media/alice.jpg) ![Alice Poldreher](media/alice-poldreher.jpg)

Präparation beschreibt den gezielten experimentellen Eingriff von Alice, durch den das Photon in einen definierten und bekannten Zustand |Ψ⟩ gebracht wird. Durch die Präparation wird so festgelegt, welche Wahrscheinlichkeiten für die Ergebnisse aller nachfolgenden Messungen gelten.

Mithilfe der vier möglichen Winkeleinstellungen des Polarisationsdrehers kann Alice vier verschiedene Polarisationszustände präparieren, die sich in die zwei Basen + und × einteilen lassen:

**Zustände der [+]-Basis**

- Zustand: |→⟩ (90°)
- Zustand: |↑⟩ (0°)

**Zustände der [×]-Basis**

- Zustand: |↗⟩ (45°)
- Zustand: |↘⟩ (- 45°)

:::mehr Wenn du wissen willst warum man bei der Präparation von „+ Basis" oder „× Basis" spricht klicke hier
Alice braucht für die Präparation nur einen einzigen Polfilter und präpariert auch immer nur einen einzigen Zustand. Woher kommt dann aber der Begriff „Basis" und zusätzlich die Symbole + oder ×, die eine Überlagerung zweier Zustände visualisieren? Eine **Basis** ist mathematisch ein Paar zweier zueinander senkrechter Zustände, mit denen man jeden beliebigen Polarisationszustand beschreiben kann:

- **[+]-Basis:** besteht aus |↑⟩ und |→⟩ (vertikal / horizontal)
- **[×]-Basis:** besteht aus |↗⟩ und |↘⟩ (diagonal / anti-diagonal)

„Alice präpariert in der [+]-Basis" heißt daher: Sie wählt einen der beiden Zustände aus diesem Paar, entweder |↑⟩ oder |→⟩. Die Basis gibt an, aus welchem Paar sie wählt, nicht dass sie beide gleichzeitig präpariert.
:::

Schaut euch nun die möglichen Einstellungen des Polarisationsdrehers an und bereitet ihn für die nächste Aufgabe vor. Präpariert dazu den Zustand **|→⟩**. Sucht in der Auflistung oben den passenden Drehwinkel und stellt ihn ein.

### Polarisationsdreher: die vier Einstellungen {.werkzeug name="praeparation"}

### Beschreibe in eigenen Worten, was die Präparation eines Quantenzustands bedeutet. {.frei platzhalter="…" #def-praeparation}

## Messung: Ein irreversibler Eingriff

Der Zustand des Photons wurde durch Alice präpariert. Damit dieser Zustand zur Informationsübertragung genutzt werden kann, muss er gemessen werden.

In der Quantenphysik ist eine Messung dabei kein passives Ablesen oder bloßes „Nachschauen". Eine Messung ist eine physikalische Wechselwirkung zwischen einem Messapparat und dem Quantenobjekt durch die der Zustand in ein konkretes, eindeutiges Ergebnis übergeht. Diesen Wesenszug der eindeutigen Messergebnisse kennt ihr bereits aus dem Unterricht.

Entscheidend ist, dass das Ergebnis vor der Messung grundsätzlich nicht feststeht, sondern erst durch die Messung selbst erzeugt wird. Das Ergebnis ist vorher also unbestimmt. Von einer solchen Unbestimmtheit kann man aber in zwei verschiedenen Bedeutungen sprechen. Von einer **subjektiven Unbestimmtheit** spricht man, wenn ein Ergebnis bereits feststeht und lediglich unser Wissen darüber fehlt. In der Quantenphysik liegt dagegen eine **objektive Unbestimmtheit** vor, denn das Ergebnis existiert vor der Messung tatsächlich noch nicht. Die Zufälligkeit ist hier also kein Zeichen für fehlendes Wissen, sondern ein grundlegendes Merkmal der Quantenphysik.

Um verschiedene Polarisationszustände voneinander zu unterscheiden, wird ein Messapparat benötigt. Dieser besteht aus einem Polarisationsdreher mit zwei Winkeleinstellungen, einem Polarisationsstrahlteiler und zwei Detektoren.

Genau wie Alice ein Photon in zwei verschiedenen Basen präparieren kann, kann der Messapparat auch in zwei verschiedenen Basen messen.

Im Folgenden bezeichnen wir einen Messapparat als **Messapparat der [+]-Basis**, wenn er eindeutig zwischen horizontal |→⟩ und vertikal |↑⟩ polarisierten Photonen unterscheiden kann. Ein **Messapparat der [×]-Basis** kann dagegen eindeutig zwischen diagonal |↗⟩ und anti-diagonal |↘⟩ polarisierten Photonen unterscheiden.

Welche Basis für die Messung verwendet wird, wird über die Einstellung des Polarisationsdrehers festgelegt. Bei einem Drehwinkel von **0°** erfolgt die Messung in der **[+]-Basis**, bei einem von **45°** in der **[×]-Basis**.

**Im folgenden ist der Aufbau des [+]-Messapparats dargestellt:**

### Messapparat {.umschalter}
:::ansicht [+] Messapparat
![Messapparat der [+]-Basis: Photon, Polarisationsdreher 0°, Polarisationsstrahlteiler, Detektor 0 für |↑⟩ und Detektor 1 für |→⟩](media/messapparat-plus.svg)
:::
:::ansicht [×] Messapparat
![Messapparat der [×]-Basis: Photon, Polarisationsdreher 45°, Polarisationsstrahlteiler, Detektor 0 für |↘⟩ und Detektor 1 für |↗⟩](media/messapparat-kreuz.svg)
:::

### Was unterscheidet eine quantenphysikalische Messung (die Bestimmung der Polarisation eines Photons) fundamental von einer klassischen Messung, wie zum Beispiel dem Ablesen einer Temperatur? Beschreibe in eigenen Worten. {.frei platzhalter="…" #def-messung}

## Experiment: Messapparat [+] mit Polarisationsdreher

Der im Bild zu sehende Teilaufbau übernimmt in unserem Experiment die Rolle des Messapparats und ist somit der Nachrichtenempfänger. Im Folgenden bezeichnen wir diesen Aufbau als **Bob (Empfänger)**.

![Bob Messapparat](media/bob.jpg) ![Bob Polarisationsfilter](media/bob-polfilter.jpg)

Als Erstes sollt ihr einige Messungen in der **[+]-Basis** durchführen. Dafür muss der Polarisationsdreher von Bob auf **0°** eingestellt sein, wie im Bild zu sehen ist.

Alices Polarisationsdreher habt ihr im vorherigen Schritt bereits so eingestellt, dass der horizontale Zustand **|→⟩** präpariert wird.

**A1:** Sendet nun **10 Photonen**, indem ihr zehnmal auf den roten Knopf drückt. Jedes dieser Photonen wird im Zustand **|→⟩** präpariert. Beobachtet bei jeder Messung, welcher der beiden Detektoren aufleuchtet. Beantwortet anschließend unten die beiden Fragen zum Zustand |→⟩.

**A2:** Wiederholt die Messung nun mit dem zweiten Zustand der [+]-Basis. Ändert dazu Alices Polarisationsdreher so, dass der Zustand **|↑⟩** präpariert wird. Bobs Einstellung bleibt unverändert. Sendet erneut **10 Photonen** und beantwortet die beiden Fragen zum Zustand |↑⟩, sodass am Ende alle vier Felder ausgefüllt sind.

**Aufgaben zum Experiment**

### Fragen zu A1: Zustand |→⟩ (horizontal) {.frei platzhalter="…"}
Wenn wir den Zustand |→⟩ einstellen welcher Detektor schlägt an? Beschreibe deine Beobachtung.
:::loesung
**Beobachtung:** Das Einzelphoton wird bei jeder Messung an Detektor D1 registriert. Detektor D0 verzeichnet kein Ereignis.
:::

### Fragen zu A1: Deutung |→⟩ {.frei platzhalter="…"}
Erkläre wieso es zu deiner Beobachtung für den Zustand |→⟩ kommt. Verwende dabei auch die Begriffe **Zustand** und **Präparation**. Gib zusätzlich die Detektionswahrscheinlichkeit für D0 und D1 an.
:::loesung
**Deutung:** Das Einzelphoton wurde durch den 90°-Polarisationsdreher im Zustand |→⟩ (horizontal) präpariert. Der Messapparat kann den Zustand eindeutig messen. Bei jeder Messung registriert ausschließlich Detektor D1 ein Detektionsereignis. Detektor D0 verzeichnet keines. Detektionswahrscheinlichkeit D1: **100 %** Detektionswahrscheinlichkeit D0: **0 %**
:::

### Fragen zu A2: Zustand |↑⟩ (vertikal) {.frei platzhalter="…"}
Wenn wir den Zustand |↑⟩ einstellen welcher Detektor schlägt an? Beschreibe deine Beobachtung.
:::loesung
**Beobachtung:** Das Einzelphoton wird bei jeder Messung an Detektor D0 registriert. Detektor D1 verzeichnet kein Ereignis.
:::

### Fragen zu A2: Deutung |↑⟩ {.frei platzhalter="…"}
Erkläre wieso es zu deiner Beobachtung für den Zustand |↑⟩ kommt. Verwende dabei auch die Begriffe **Zustand** und **Präparation**. Gib zusätzlich die Detektionswahrscheinlichkeit für D0 und D1 an.
:::loesung
**Deutung:** Das Einzelphoton wurde durch den 0°-Polarisationsdreher im Zustand |↑⟩ (vertikal) präpariert. Der Messapparat kann den Zustand eindeutig messen. Bei jeder Messung registriert ausschließlich Detektor D0 ein Detektionsereignis. Detektor D1 verzeichnet keines. Detektionswahrscheinlichkeit D0: **100 %** Detektionswahrscheinlichkeit D1: **0 %**
:::

## Experiment: Messapparat [×] mit Polarisationsdreher

Untersucht nun den Messapparat in der **[×]-Basis**. Passt dafür die Polarisationsdreher von Alice und Bob an.

Präpariert bei **Alice** den Zustand **|↘⟩**. Schaut den passenden Drehwinkel wieder nach. Stellt anschließend **Bobs** Polarisationsdreher auf **45°** ein. Dadurch misst Bob in der [×]-Basis. Aufbau und Funktionsweise des Messapparats bleiben unverändert, gewechselt wurden lediglich die Präparations- und die Messbasis.

**A1:** Sendet wieder nacheinander **10 Photonen** durch zehnmaliges Drücken auf den roten Knopf aus. Jedes dieser Photonen wird im Zustand **|↘⟩** präpariert. Beobachtet bei jeder Messung, welcher der beiden Detektoren aufleuchtet. Beantwortet anschließend unten die beiden Fragen zum Zustand |↘⟩.

**A2:** Wiederholt die Messung nun mit dem zweiten Zustand der [×]-Basis. Ändert dazu Alices Polarisationsdreher so, dass der diagonale Zustand **|↗⟩** präpariert wird. Bobs Einstellung bleibt unverändert. Sendet erneut **10 Photonen** und beantwortet die beiden Fragen zum Zustand |↗⟩, sodass am Ende alle vier Felder ausgefüllt sind.

**Aufgaben zum Experiment**

### Fragen zu A1: Zustand |↘⟩ (anti-diagonal) {.frei platzhalter="…"}
Wenn wir den Zustand |↘⟩ einstellen welcher Detektor schlägt an? Beschreibe deine Beobachtung.
:::loesung
**Beobachtung:** Das Einzelphoton wird bei jeder Messung an Detektor D0 registriert. Detektor D1 verzeichnet kein Ereignis.
:::

### Fragen zu A1: Deutung |↘⟩ {.frei platzhalter="…"}
Erkläre wieso es zu deiner Beobachtung für den Zustand |↘⟩ kommt. Verwende dabei auch die Begriffe **Zustand** und **Präparation**. Gib zusätzlich die Detektionswahrscheinlichkeit für D0 und D1 an.
:::loesung
**Deutung:** Das Einzelphoton wurde durch den –45°-Polarisationsdreher im Zustand |↘⟩ (anti-diagonal) präpariert. Der Messapparat kann den Zustand eindeutig messen. Bei jeder Messung registriert ausschließlich Detektor D0 ein Detektionsereignis. Detektor D1 verzeichnet keines. Detektionswahrscheinlichkeit D0: **100 %** Detektionswahrscheinlichkeit D1: **0 %**
:::

### Fragen zu A2: Zustand |↗⟩ (diagonal) {.frei platzhalter="…"}
Wenn wir den Zustand |↗⟩ einstellen welcher Detektor schlägt an? Beschreibe deine Beobachtung.
:::loesung
**Beobachtung:** Das Einzelphoton wird bei jeder Messung an Detektor D1 registriert. Detektor D0 verzeichnet kein Ereignis.
:::

### Fragen zu A2: Deutung |↗⟩ {.frei platzhalter="…"}
Erkläre wieso es zu deiner Beobachtung für den Zustand |↗⟩ kommt. Verwende dabei auch die Begriffe **Zustand** und **Präparation**. Gib zusätzlich die Detektionswahrscheinlichkeit für D0 und D1 an.
:::loesung
**Deutung:** Das Einzelphoton wurde durch den 45°-Polarisationsdreher im Zustand |↗⟩ (diagonal) präpariert. Der Messapparat kann den Zustand eindeutig messen. Bei jeder Messung registriert ausschließlich Detektor D1 ein Detektionsereignis. Detektor D0 verzeichnet keines. Detektionswahrscheinlichkeit D1: **100 %** Detektionswahrscheinlichkeit D0: **0 %**
:::

## Wissenscheck: Welche Auswirkung hat die Basiswahl? {.quiz oeffnet="grundlagen/experiment-praeparation-in-basis-und-mes"}

Wende dein Wissen aus den beiden Experimenten an. Beantworte die **drei Fragen** und schalte damit den nächsten Abschnitt frei.

### Alice präpariert ein Photon im Zustand |↑⟩ und Bob misst in der [+]-Basis. Wie oft registriert Bob den Zustand |↑⟩? {.mc}
:::antworten
- [ ] In genau 50 % der Messungen, die Detektoren wechseln sich zufällig ab.
- [x] In 100 % der Messungen. Das Ergebnis ist deterministisch, weil Präparations- und Messbasis übereinstimmen.
- [ ] In etwa 75 % der Messungen, der Rest geht verloren.
- [ ] Gar nicht, das Photon wird im Messapparat blockiert.
:::
:::nachschlagen
nachschlagen/gleiche-basis-bedeutet-vollstaendige-inf
:::

### Gilt dieses eindeutige Ergebnis nur für die [+]-Basis? {.mc}
:::antworten
- [ ] Ja, nur die [+]-Basis liefert eindeutige Ergebnisse, die [×]-Basis ist immer zufällig.
- [ ] Ja, weil die Zustände |↗⟩ und |↘⟩ keine echten Zustände sind.
- [x] Nein, im Experiment mit der [×]-Basis war das Ergebnis für |↗⟩ und |↘⟩ genauso eindeutig. Entscheidend ist nur, dass beide dieselbe Basis verwenden.
- [ ] Nein, aber in der [×]-Basis stimmt das Ergebnis nur in etwa 90 % der Fälle.
:::
:::nachschlagen
nachschlagen/gleiche-basis-bedeutet-vollstaendige-inf
:::

### Alice und Bob haben vereinbart: |→⟩ bzw. |↗⟩ steht für das Bit 1, |↑⟩ bzw. |↘⟩ für das Bit 0. Was müssen die beiden öffentlich austauschen, damit Bob Alices Bit sicher kennt? {.mc}
:::antworten
- [x] Nur die verwendete Basis. Stimmt sie überein, hat Bob denselben Bitwert bereits gemessen.
- [ ] Den kompletten Bitwert jedes einzelnen Photons.
- [ ] Den genauen Winkel des Polarisationsdrehers und zusätzlich den Bitwert.
- [ ] Gar nichts, Bob kennt Alices Bit auch ohne jede Absprache.
:::
:::nachschlagen
nachschlagen/gleiche-basis-bedeutet-vollstaendige-inf
:::

### Welchen Nutzen hat nun die Basengleichheit für die Kommunikation zwischen Alice und Bob? {.frei sperrt platzhalter="…"}
:::loesung
**Nutzen:** Bei gleicher Basis ist Bobs Messergebnis deterministisch, er misst also genau den Zustand, den Alice präpariert hat. Die Information wird vollständig durch den Quantenzustand des Photons übertragen. Alice und Bob müssen deshalb nur ihre **Basen** öffentlich vergleichen und niemals die Bitwerte selbst. So erzeugen beide dieselbe geheime Bitfolge, ohne sie jemals auszutauschen.
:::

## Experiment: Präparation in [+]-Basis und Messung in [×]-Basis {oeffnet_nach="quiz:grundlagen/wissenscheck-welche-auswirkung-hat-die-b" grund="Öffnet sich nach dem bestandenen Wissenscheck."}

Wir wollen jetzt schauen was passiert wenn Alice einen Zustand der **[+]-Basis** präpariert, Bob aber in der **[×]-Basis** misst.

1. Präpariert mit **Alice** einen Zustand der [+]-Basis. Stellt dafür den Polarisationsdreher auf **0°** (Zustand |↑⟩) oder **90°** (Zustand |→⟩) ein.

2. Stellt bei **Bob** den Polarisationsdreher auf **45°** ein. Bob misst somit in der [×]-Basis.

3. Führt mindestens 15 Messungen durch (wieder Drücken des roten Knopfes) und beobachtet genau, welche Detektoren auslösen. Beantwortet anschließend die untenstehenden Fragen.

**Aufgaben zum Experiment**

### Fragen zu A1: Beobachtung {.frei platzhalter="…"}
Beschreibe, was du beobachtest. Welche Detektoren schlagen aus und wie oft? Was fällt dir im Vergleich zu den vorherigen Experimenten auf?
:::loesung
**Beobachtung:** Beide Detektoren D0 und D1 schlagen aus und das zufällig. Mal leuchtet D0, mal D1, ohne erkennbares Muster. Das Ergebnis ist nicht mehr vorhersagbar.
:::

### Fragen zu A1: Erklärungsversuch {.frei platzhalter="…"}
Stelle eine Hypothese auf, welche die veränderten Beobachtungen erklärt.
:::loesung
Eine Erklärung findet ihr im nächsten Abschnitt zum Thema der Superposition.
:::

### Fragen zu A2: Zustand [×]-Basis {.frei sperrt platzhalter="…"}
Wechselt nun bei Alice auf einen Zustand der [×]-Basis (Polarisationsdreher −45° bzw. 45°). Bob wechselt zusätzlich auf die [+]-Basis. Was beobachtet ihr jetzt? Ändert sich etwas?
:::loesung
**Beobachtung:** Wenn ein [×]-Zustand präpariert und in [+]-Basis gemessen wird, bleibt das Ergebnis zufällig. D0 und D1 schlagen weiterhin unvorhersehbar aus. Es spielt keine Rolle, welchen der [×]- oder [+]-Zustände Alice wählt: Solange Alice und Bob ungleiche Basen verwenden, ist das Ergebnis zufällig.
:::

## Superposition

Du hast beobachtet, dass Bob zufällige Messergebnisse erhält, sobald Alice und Bob unterschiedliche Basen verwenden. Eine Erklärung für diese Beobachtung liefert das quantenphysikalische Konzept der **Superposition**.

Die beiden Zustände, aus denen eine Mess- oder Präparationsbasis besteht, bezeichnet man als Basiszustände. In der [+]-Basis sind dies ∣→⟩ und ∣↑⟩.

**Was passiert, wenn der präparierte Zustand kein Basiszustand der Messbasis ist?** Dann lässt er sich als Kombination der beiden Basiszustände dieser Messbasis beschreiben. Die folgende Darstellung zeigt das für den Zustand |→⟩, der in der [×]-Basis gemessen wird.

→ horizontal ([+]) = ↗ 50 % |↗⟩ + ↘ 50 % |↘⟩

Ein im Zustand **|→⟩** präpariertes Photon besitzt bezüglich der **[×]-Basis** also Anteile der Zustände |↗⟩ und |↘⟩. Man sagt: Das Photon befindet sich in einer **Superposition** der Zustände |↗⟩ und |↘⟩.

Wird das im Zustand **|→⟩** präparierte Photon nun mit dem **[×]-Messapparat** gemessen, kann als Ergebnis entweder **|↗⟩** oder **|↘⟩** auftreten. Da die beiden Zustände gleichermaßen im horizontalen Zustand |→⟩ enthalten sind, beträgt die Wahrscheinlichkeit für jedes Messergebnis **50 %**. Das Messergebnis ist also völlig zufällig. Auch hier gilt der Wesenszug der **Eindeutigkeit der Messung**. Die Messung löst die Superposition auf und liefert genau ein Ergebnis an einem der beiden Detektoren, niemals an beiden zugleich.

Diese Beobachtung gilt auch für die anderen drei genannten Zustände, sobald ein Photon in einer anderen Basis gemessen als präpariert wird. Die folgende Grafik visualisiert dir nochmal, wie man sich diese Überlagerung der Zustände vorstellen kann:

### Superposition der Zustände {.werkzeug name="superposition"}

### Zusammenfassung {.info}
| Gleiche Basen | Deterministisch: Messergebnis 100 % eindeutig |
|---|---|
| Ungleiche Basen | Zufällig: 50 % / 50 % |

:::merksatz
**Superposition ≠ Unwissen:** Ein Superpositionszustand ist ein eigenständiger Zustand und keine Mischung zweier Möglichkeiten, die wir bloß nicht kennen. Das Messergebnis ist **objektiv unbestimmt** und wird erst durch die Messung festgelegt, die die Superposition auflöst. An einem **einzelnen** Photon lässt sich der präparierte Zustand daher nicht bestimmen.
:::

### Beschreibe in eigenen Worten, was Superposition ist und warum sie kein Ausdruck von Unwissen ist. {.frei platzhalter="…" #def-superposition}

## Alles zusammen: BB84 in der Sprache der Quantenphysik

Du kennst jetzt alle Bausteine. Hier siehst du, wie sie im BB84-Protokoll zusammenspielen:

![Überblick: Alice sendet Photonen über den Quantenkanal an Bob; Eve könnte dazwischen lauschen; die Basen werden über einen öffentlichen klassischen Kanal verglichen](media/aufbau-ueberblick.svg)

**Alice präpariert**: Alice schickt kein klassisches Signal, sondern ein einzelnes Photon. Mit dem Polarisationsdreher präpariert sie es in einem der vier Zustände |↑⟩, |→⟩, |↗⟩ oder |↘⟩. Über die Winkeleinstellung legt sie dabei zugleich die **Basis** und den **Bitwert** fest.

**Bob misst**: Bob wählt für seine Messung ebenfalls eine Basis. Verwenden beide dieselbe Basis, erhält er deterministisch denselben Bitwert, den Alice präpariert hat. Sind die Basen ungleich, ist sein Ergebnis zufällig und das Bit wird verworfen.

**Ungleiche Basen**: Bei ungleichen Basen ist der von Alice präparierte Zustand kein Basiszustand von Bobs Messbasis. Bobs Messergebnis ist dann **objektiv unbestimmt** und fällt zufällig aus. Genau dadurch macht sich auch ein Lauscher bemerkbar.

**Gemeinsamer Schlüssel**: Der Bitwert wird nie als fertige Nachricht verschickt. Er entsteht erst aus dem Zusammenspiel von Alices Präparation und Bobs Messung in derselben Basis.

**Übersicht: Welches Bit bei welchem Zustand**

| Bit | Basis | Zustand | Präparation |
|---|---|---|---|
| 0 | + | \|↑⟩ (vertikal) | durch 0°-Winkeleinstellung |
| 1 | + | \|→⟩ (horizontal) | durch 90°-Winkeleinstellung |
| 0 | × | \|↘⟩ (antidiagonal) | durch -45°-Winkeleinstellung |
| 1 | × | \|↗⟩ (diagonal) | durch 45°-Winkeleinstellung |

## Verständnisfragen – Kapitel 2 {.quiz oeffnet="durchfuehrung"}

### Was unterscheidet Präparation von Messung in der Quantenmechanik? {.mc}
:::antworten
- [ ] Präparation ist genauer als Messung, weil dabei keine Störung des Systems auftritt.
- [x] Präparation erzeugt einen definierten Zustand. Messung liefert ein eindeutiges Ergebnis und löst dabei einen eventuellen Superpositionszustand auf.
- [ ] Beide sind identisch. Messen ist dasselbe wie Präparieren.
- [ ] Messung verändert den Zustand nicht, Präparation schon.
:::
:::richtig
Richtig! Präparation stellt einen Zustand her (z. B. durch einen Filter, den das Photon passiert). Messung fragt nach dem Zustand und erzwingt eine Entscheidung, wenn der Zustand eine Superposition war. Beide Vorgänge hinterlassen unwiderrufliche Spuren.
:::
:::falsch
Nicht korrekt. Präparation erzeugt einen definierten Zustand, Messung liest ihn aus und kann dabei eine Superposition kollabieren. Der wesentliche Unterschied: Beide Vorgänge sind irreversibel, aber auf verschiedene Weisen.
:::
:::nachschlagen
grundlagen/praeparation-einen-zustand-gezielt-herst
:::

### Was passiert im Messapparat der [+]-Basis mit einem |↑⟩-polarisierten Photon? {.mc}
:::antworten
- [x] Es trifft deterministisch den Detektor, der dem |↑⟩-Kanal zugeordnet ist. Die Basis stimmt überein.
- [ ] Es trifft zufällig einen der beiden Detektoren.
- [ ] Es wird vom Polarisationsdreher blockiert und kommt an keinem Detektor an.
- [ ] Es wird in einen |→⟩-Zustand umgewandelt und dann gemessen.
:::
:::richtig
Richtig! Im Messapparat der [+]-Basis trennen die Polarisationsdreher |↑⟩- und |→⟩-polarisierte Photonen auf zwei getrennte Detektoren. Stimmt der Zustand des Photons mit der Basis überein, schlägt immer derselbe Detektor aus. Das Ergebnis ist deterministisch.
:::
:::falsch
Nicht ganz. Stimmt die Basis des Messapparats mit dem Zustand des Photons überein, ist das Ergebnis deterministisch. Immer derselbe Detektor schlägt aus. Zufälligkeit entsteht nur bei ungleichen Basen.
:::
:::nachschlagen
grundlagen/experiment-messapparat-mit-polarisations
:::

### Ein Photon startet im Zustand |→⟩. Ein Polarisationsdreher präpariert es zu |↑⟩ um. Anschließend wird es in der [+]-Basis gemessen. Was ist das Ergebnis? {.mc}
:::antworten
- [ ] Das Ergebnis ist zufällig, weil das Photon zweimal manipuliert wurde und kein stabiler Zustand mehr vorliegt.
- [ ] Das Photon wird vom Messapparat blockiert, weil der ursprüngliche Zustand |→⟩ nicht mehr vorhanden ist.
- [x] Das Ergebnis ist deterministisch |↑⟩. Der Polarisationsdreher hat den Zustand neu präpariert und die Messbasis stimmt mit dem neuen Zustand überein.
- [ ] Das Ergebnis ist deterministisch |→⟩, weil der ursprüngliche Zustand durch die Messung wiederhergestellt wird.
:::
:::richtig
Richtig! Der Polarisationsdreher hat den Zustand des Photons von |→⟩ zu |↑⟩ umpräpariert. Entscheidend für das Messergebnis ist immer der aktuelle Zustand beim Eintreffen am Messapparat. Da |↑⟩ ein Basiszustand der [+]-Basis ist, ist das Ergebnis deterministisch |↑⟩.
:::
:::falsch
Nicht ganz. Der Polarisationsdreher ist selbst eine Präparation. Er setzt den Zustand des Photons auf |↑⟩ neu. Die Messung in der [+]-Basis sieht nur diesen neuen Zustand. Das Ergebnis ist deterministisch |↑⟩, weil Zustand und Messbasis übereinstimmen.
:::
:::nachschlagen
nachschlagen/gleiche-basis-bedeutet-vollstaendige-inf
:::

### Alice präpariert ein Photon im Zustand |↗⟩ . Bob misst es in der [+] Basis. Was ist das Ergebnis? {.mc}
:::antworten
- [ ] Bob erhält sicher |↗⟩, das Photon wird korrekt gemessen.
- [x] Bob erhält zufällig |↑⟩ oder |→⟩, mit je 50 % Wahrscheinlichkeit. Das Ergebnis ist wertlos und wird verworfen.
- [ ] Bob erhält gar kein Ergebnis, das Photon wird blockiert.
- [ ] Bob erhält |↗⟩, aber mit verringerter Intensität.
:::
:::richtig
Genau! Wenn die Messbasis nicht zur Polarisation passt, ist das Ergebnis zufällig. Dieser Fall wird beim Basisabgleich nach der Übertragung erkannt und verworfen.
:::
:::falsch
Falsch. Ein |↗⟩-Photon in der + Basis gemessen ergibt ein zufälliges Ergebnis (|↑⟩ oder |→⟩, je 50 %). Das ist kein Fehler, sondern das physikalische Messprinzip bei ungleichen Basen.
:::
:::nachschlagen
grundlagen/experiment-praeparation-in-basis-und-mes
:::

### Welche Aussage beschreibt das Phänomen der Superposition? {.mc}
:::antworten
- [ ] Das Photon hat "heimlich" schon einen bestimmten Zustand, wir kennen ihn nur nicht.
- [ ] Superposition bedeutet, dass es zwei verschiedene Photonen gibt, die sich abwechseln.
- [x] Das Quantenobjekt befindet sich in einem eigenständigen Zustand mit Anteilen mehrerer Basiszustände. Erst die Messung erzeugt ein definites Ergebnis. Das ist keine Unkenntnis, sondern physikalische Realität.
- [ ] Superposition ist nur ein Rechenmodell, das der physikalischen Realität nicht entspricht.
:::
:::richtig
Sehr gut! Der Unterschied zwischen Superposition und Unwissen ist fundamentaler Natur und experimentell nachweisbar. Superposition ist ein realer Zustand, kein Wissensdefizit.
:::
:::falsch
Nicht korrekt. Superposition ist nicht "Unwissen über den echten Zustand". Das Quantenobjekt hat vor der Messung keinen definierten Wert in der betreffenden Eigenschaft. Das ist experimentell belegbar.
:::
:::nachschlagen
grundlagen/superposition
:::
