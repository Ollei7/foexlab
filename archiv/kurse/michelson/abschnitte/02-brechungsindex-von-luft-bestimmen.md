---
titel: "Brechungsindex von Luft bestimmen"
nr: 2
---

## Was steckt hinter dem Begriff Brechungsindex? {.test}

In diesem Versuch soll es darum gehen, den Brechungsindex von Luft zu messen. Vorher müssen wir erstmal klären, was wir genau meinen, wenn wir von Brechungsindex eines Materials oder der optischen Weglänge sprechen.

### Brechungsindex Infotext {.info}

#### Lichtbrechung und Brechzahl

Die Wechselwirkung von Licht mit Materie liefert eine Vielzahl von Phänomenen, zu deren Beschreibung quantenphysikalische Modelle notwendig sind. Unter sehr vereinfachenden Randbedingungen kann man jedoch eine Perspektive „von weit oben“ einnehmen: In transparenter Materie ändert sich die Amplitude der Welle nicht. Die veränderte Lichtausbreitung wird in diesem einfachen Modell mit einer reellen Zahl erfasst, die einen Unterschied zur Ausbreitung im Vakuum beschreibt.

Man bezeichnet den Quotienten aus der Phasengeschwindigkeit (das ist die Geschwindigkeit, mit der sich die Wellenfront ausbreitet) im Vakuum und der Phasengeschwindigkeit in der Materie als Brechzahl oder auch Brechungsindex n:

$$ n= \frac{c\_{Vakuum}}{c\_{Materie}} \geq 1 $$

Je geringer die Ausbreitungsgeschwindigkeit in einem Stoff ist, desto größer ist sein Brechungsindex.

Medien mit geringerer Ausbreitungsgeschwindigkeit nennt man optisch dichter.

### Brechungsindex_01 {.frei}

Begründe: Stets ist *n* ≥ 1.

:::hinweis
Da Licht sich in Materialien **immer** langsamer als im Vakuum ausbreitet, ist c\_{Material} immer kleiner als die Lichtgeschwindigkeit c\_0 im Vakuum. Bildet man nun den Quotienten n=\frac{c\_0}{c\_{Material}} ist dieser stets größer gleich 1, da der Nenner immer kleiner gleich dem Zähler ist.
:::

### Brechungsindex Materialien Zuordnungen {.luecke}

Der Brechungsindex von {{Vakuum|Diamant|Luft|Wasser|Glas}} ist mit dem Wert 1 am kleinsten. Am größten ist der Brechungsindex von {{Diamant|Vakuum|Luft|Wasser|Glas}}.

Dazwischen gilt:

Der Brechungsindex von {{Luft|Vakuum|Diamant|Wasser|Glas}} ist kleiner als der von {{Wasser|Vakuum|Diamant|Luft|Glas}}, welcher wiederum kleiner ist als der von {{Glas|Vakuum|Diamant|Luft|Wasser}}.

Aufsteigend sortiert ergibt sich folgende Reihenfolge:

{{Vakuum|Diamant|Luft|Wasser|Glas}} , {{Luft|Vakuum|Diamant|Wasser|Glas}}, {{Wasser|Vakuum|Diamant|Luft|Glas}}, {{Glas|Vakuum|Diamant|Luft|Wasser}}, {{Diamant|Vakuum|Luft|Wasser|Glas}}

### Brechung {.info}

##### Wie wird Licht gebrochen?

<img src="media/Brechungsindex.jpg" alt="" width="400" height="397">

Trifft eine ebene Welle, die sich in einem Medium 1 mit dem Brechungsindex *n*<sub>1</sub> ausbreitet auf eine Grenzfläche zu einem Medium 2 mit dem Brechungsindex *n*<sub>2</sub>, so ändert die Welle, als Folge einer unterschiedlichen Phasengeschwindigkeit, ihre Ausbreitungsrichtung. Diese Richtungsänderung wird auch durch das Huygenssche Gesetz anschaulich: Von links oben läuft eine ebene Welle auf die Grenzfläche zu. Diese Grenzfläche wird Ausgangspunkt für Huygenssche Elementarwellen auch in den Bereich mit dem größeren Brechungsindex hinein. Die geringere Phasengeschwindigkeit führt hier jedoch zu „abgeknickten“ Wellenfronten (daher der Terminus „Brechung“).

![](media/eingebettet-02.png)

### Snellius {.info}

##### Das Brechungsgesetz von Snellius

Wir haben nun bereits gelernt, dass Licht reflektiert oder gebrochen werden kann, wenn es auf eine Grenzfläche von zwei Medien mit unterschiedlichen Brechungsindizes trifft. Wie stark bzw. in welche Richtung das Licht gebrochen wird, ist abhängig vom Einfallswinkel \( \phi \) des Lichts und dem Verhältnis der Brechungsindizes. Diesen Zusammenhang beschreibt das Brechungsgesetz von Snellius:

$$ \frac{sin(\phi\_1)}{sin(\phi\_2)}= \frac{c\_1}{c\_2} =\frac{n\_2}{n\_1}$$

Hierbei sind \( c_1 \) und \( c_2 \) die Ausbreitungsgeschwindigkeiten des Lichts in den jeweiligen Medien.

### Lichtbrechung in Interferometer {.info}

##### Lichtbrechung im Interferometer

Auch in unserem MZI finden wir die Lichtbrechung an einer unerwarteten Stelle wieder, welche das ist, ist zunächst nicht sofort offensichtlich. Aber das werden wir in diesem Abschnitt klären: Durch das Einbringen einer evakuierbaren Luftküvette in einen Arm des Interferometers muss das Licht ein anderes Medium durchqueren. Trifft das Licht auf die Küvette wird es tatsächlich gebrochen! Es handelt sich hierbei um den Spezialfall, dass der Einfallswinkel 0° sind und somit aus dem Brechungsgesetz auch der Ausfallswinkel 0° ist (unabhängig von den Brechungsindizes).

Durch die reduzierte Lichtgeschwindigkeit im Medium wird das Licht im Vergleich zum Verlauf ohne das Medium etwas verzögert. Nach dem Zusammenhang \( c = \lambda \cdot f \) können wir schließen, dass bei einer geringeren Lichtgeschwindigkeit im Medium, auch die Wellenlänge λ kleiner werden muss (die Frequenz muss konstant bleiben).

Wenn Das Licht also ein Medium durchquert, wird die Wellenlänge kleiner und natürlich verändert sich dann ebenfalls das Interferenzmuster. Anders betrachtet, kann über die sogenannte optische **Weglänge** (nicht zu verwechseln mit der Wellenlänge!) eine Verzögerung des Lichts begründet werden.

Durch die reduzierte Ausbreitungsgeschwindigkeit der Wellenfronten in einem Medium im Vergleich zum Vakuum werden Weglängen „optisch“ länger – das Licht „braucht länger“ um die Strecke zu durchlaufen. Für die (geometrische) Länge *L* benötigt das Licht im Vakuum die Zeit

$$ t = \dfrac{L}{c\_{Vakuum}} $$

In Materie, mit der reduzierten Lichtgeschwindigkeit dauert es länger:

$$ t'=\frac{L}{c\_{Materie}}=\frac{L}{c\_{Vakuum}} \cdot \frac{c\_{Vakuum}}{c\_{Materie}}=n\cdot t $$

Wie in der Abbildung skizziert, führt die Lichtbrechung zu einer Verschiebung der Wellenfronten zwischen ungestörtem und gestörtem Lichtweg.

<img src="media/eingebettet-03.png" alt="" width="300" height="343">

Die **optische Weglänge \( L_{opt} \)**  ist also die Strecke, die das Licht innerhalb derselben Zeitspanne im Vakuum (anstatt im Material) zurücklegen könnte. Wenn ***L* die geometrische Weglänge** (das ist auch die im Vakuum), dann ist die optische Weglänge im Medium mit dem Brechungsindex *n* gegeben durch:

$$ L\_{opt} = n\cdot L $$

Dies ergibt Sinn, da das Licht in derselben Zeitspanne im Vakuum wegen der höheren Ausbreitungsgeschwindigkeit eine größere Strecke als im Material zurücklegen kann.

Nun wollen wir den Umgang mit diesen wichtigen Größen der Optik etwas üben:

### Aufgabe: Optische Weglänge Glasfaser_Luft1 {.zahl einheit="cm"}

Ein Lichtstrahl durchquert eine 1cm lange Glasfaser mit dem Brechungsindex \( n = 1,3 \). Mit welcher Weglänge im Vakuum ist dies vergleichbar, wie groß ist also die optische Weglänge?

:::antworten
= 1.3
:::

:::hinweis
Das Ergebnis folgt aus der Formel \(L_{opt} = n \cdot L \) mit \( n = 1,3 \) und \( L = 1 \)cm.
:::

### Aufgabe: Optische Weglänge Glasfaser_Luft2 {.zahl einheit="cm"}

Mit welcher Weglänge in der Glasfaser ist eine Weglänge von 1 cm im Vakuum vergleichbar?

:::antworten
= 0.769 ± 0.025 || Das Ergebnis folgt aus der Formel \( L = \frac{L_{opt}}{n} \) mit \( L_{opt} = 1\) cm und \(n = 1.3\).
:::

### Lichtbrechung_Abschluss {.info}

Das Interferenzmuster des Interferometers reagiert äußerst empfindlich auf winzige Verzögerungen des Lichts in einem der Interferometerarme (man spricht hier auch von einer Phasenverzögerung zwischen den Lichtfeldern in den Armen des MZI). Man kann also bereits winzige Phasenverzögerungen messen und daraus den Brechungsindex des verzögernden Mediums bestimmen.

## Messung und Auswertung {.test}

Nun wollen wir selber messen!

### Messprinzip {.info}

##### Eine einstellbare optische Weglänge: Die Luftküvette

Wir wollen mit unserem MZI den Brechungsindex von Luft bestimmen. Dafür fügen wir in einen der Arme des Mach-Zehnder-Interferometers eine Küvette ein, in der wir ein Vakuum erzeugen können. Wenn wir nun wieder Luft in die Küvette lassen, können wir anhand der Veränderung des Interferenzmusters die Veränderung der optischen Weglänge bestimmen.

### Eure Vermutung {.vermutung}

Kannst du schon vermuten, wie sich das Interferenzmuster verändert, wenn der Druck in der Küvette steigt oder sinkt?

### Foto vom Interferenzmuster {.foto}

Fotografiert das Interferenzmuster, bevor ihr Luft abpumpt.

### Theorie zur Auswertung MI {.info}

Für die Auswertung wird die Beobachtung der Mitte des ringförmigen Interferenzmusters am wichtigsten sein. Hat sich diese einmal von Dunkel zu Hell und wieder zurück zu Dunkel verändert, hat sich die optische Weglängendifferenz zwischen den beiden Interferometerarmen um genau eine halbe Wellenlänge \(\dfrac{\lambda}{2}\) verschoben. Überlegt kurz für euch, warum das so ist.

:::hinweis
Verändert sich die Mitte des Interferenzmusters von Dunkel zu Hell und wieder zurück zu Dunkel, haben wir das gleiche Interferenzmuster wie am Ausgangspunkt. Die Phasendifferenz der beiden Teilstrahlen am Schirm muss sich also um \(2\pi\) verschoben haben, die optische Weglängendifferenz entsprechend um \(\lambda\). Da der Laserstrahl die Küvette im Michelson-Interferometer zweimal durchläuft auf dem Weg vom Laser zum Schirm, muss sich die optische Weglängendifferenz zwischen den beiden Interferometerarmen um \(\frac{lambda}{2}\) verschoben haben.
:::

### Messung {.messtabelle}

Pumpt nun so lange Luft ab, bis ihr \(\Delta n=5\) Wechsel Dunkel \(\to\) Hell \(\to\) Dunkel gezählt habt und messt dann den Druckunterschied \(\Delta p\) in Millibar. Auf dem Barometer ist das die schwarze Skala. Tragt die Messwerte in die Tabelle ein. Wiederholt dies, bis ihr bei \(\Delta n=20\) oder \(\Delta n=25\) angelangt seid.

:::spalten
dp | Druckunterschied Δp | mbar
dN | Anzahl Wechsel ΔN |
:::

:::diagramm
x = dp, y = dN, ausgleich = ursprung
:::

### Regressionsüberlegungen MI {.info}

Das Diagramm unter eurer Tabelle zeigt eure Messpunkte mit \(\Delta N\) auf der y-Achse und \(\Delta p\) auf der x-Achse.

Die Messpunkte \( (\Delta p,\Delta N) \) sollten theoretisch auf einer Geraden der Form \( \Delta N= m \cdot \Delta p \) liegen. Zur Berechnung des Brechungsindex benötigen wir die Steigung dieser Gerade. Sie steht unter dem Diagramm (Ausgleichsgerade durch den Ursprung).

Aus der Steigung könnt ihr nun den Wert für \( n_{Luft}\) berechnen. Dafür benötigt ihr folgende Parameter:

Außenluftdruck \( p_0 \) wird von uns vor Ort angegeben.

Wellenlänge des Lasers: \( \lambda = 532\) nm

Länge der Küvette: \( L = 5\) cm

Der Zusammenhang zwischen der Steigung \( \left( \dfrac{\Delta N}{\Delta p}\right)\) und \( n_{Luft}\) ist gegeben durch:

$$ n\_{Luft}= 1 + \dfrac{\Delta N}{\Delta p}\cdot \dfrac{\lambda}{2\cdot L} p\_0 $$

Achtet bei der Auswertung darauf, dass ihr Längen und Luftdrücke jeweils in der gleichen Einheit in die Berechnung einbringt. Das Teilen durch \(2\cdot L\) ist nötig, da der Laserstrahl die Küvette zweimal durckläuft.

Wenn ihr den Hintergrund dieser Formel nicht versteht, macht euch keine Sorge: Hierfür braucht man Vorwissen aus verschiedenen Bereichen der Physik, welches in der Regel in der Schule nicht vermittelt wird.

### Euer Wert für n_Luft {.frei}

Berechnet \( n_{Luft}\) aus eurer Steigung und notiert den Rechenweg.

Vergleicht den von euch gemessenen Wert, mit dem aus der Literatur (bei Normalbedingungen: \( n_{Luft}= 1,000292 \) ).

Stimmt eure Messung mit der Literatur überein?

### Strahlengang skizzieren {.skizze bild="media/Aufbau-beschriftet.jpg"}

Zeichnet den Weg des Laserlichts in euren Aufbau ein, einschließlich der Küvette.
