---
titel: "Durchführung: Das BB84-Protokoll"
nr: 3
oeffnet_nach: quiz:grundlagen/verstaendnisfragen-kapitel-2
nachschlag_link: nachschlagen/ueberblick-der-ablauf-des-bb84-protokoll
---
Führe das Protokoll im Labor selber durch. Bearbeitet die Aufgaben nach und nach und haltet eure Ergebnisse fest.

Wenn während der Durchführung der nachfolgenden Aufgaben Fragen aufkommen findest du hier einen ausführlichen Durchlauf des BB84-Protokolls und weitere nützliche Inhalte zum Nachlesen

## Aufgabe 1: Schlüsselaustausch & Verschlüsselung zwischen Alice und Bob

Ihr kennt nun alle Grundlagen für die Durchführung des BB84-Protokolls und solltet daher bereit sein, es selbst auszuprobieren. Teilt euch auf, sodass sowohl Alice als auch Bob von mindestens einer Person besetzt sind, und bearbeitet die Aufgaben gemeinsam der Reihe nach. Haltet eure Ergebnisse in den Feldern fest.

![Gesamtaufbau Alice und Bob](media/alice-bob.png)

Bei jedem Aufbau sollten einige Würfel liegen. Teilt diese so auf, dass die Gruppe, die **Alice** bedient, jeweils einen Würfel mit **+** und **×** sowie einen mit **0** und **1** hat. Die Gruppe, die **Bob** bedient, braucht nur den Würfel mit **+** und **×**. Mit diesen würfelt ihr folgend die Basen und Bits zur Präparation und Messung.

### Zu welcher Gruppe gehört ihr? {.werkzeug name="rollenwahl"}

### Aufgabe 1: Runden, Rohschlüssel und Buchstabe {.werkzeug name="handtabelle"}

### Codetabelle {.info}
![Codetabelle: Jeder Buchstabe von A bis Z hat eine Schreibweise aus 5 Bits](media/codetabelle.svg)

## Aufgabe 2: Verschlüsselt & entschlüsselt längere Nachrichten

In der ersten Aufgabe habt ihr durch Würfeln eure Basen und Bits festgelegt. Anschließend musstet ihr selbst in der Codetabelle nachschauen, wie ein Buchstabe in Bits umgewandelt wird, und die Verrechnung mithilfe der Binäraddition eigenständig durchführen. Wie ihr sicher gemerkt habt, ist dieser Prozess sehr zeitaufwendig.

In dieser Aufgabe sollt ihr nun sehen, wie auch längere Wörter übertragen werden können. Erstellt dafür einen Bitschlüssel mit mindestens 40 Bits. Mit einem solchen Schlüssel könnt ihr ein Wort mit bis zu 8 Buchstaben übertragen.

Die Website unterstützt euch dabei. Ihr könnt die Basen und Bits per Klick erzeugen lassen und müsst euch anschließend nur noch um die Einstellung der Polarisationsdreher kümmern.

Sobald ihr mindestens 5 Bits in eurem Schlüssel habt, könnt ihr euren Text eingeben und automatisch in Binärcode umwandeln lassen. Auch die Verrechnung mit eurem Schlüssel durch Binäraddition erfolgt automatisch. Da ihr eine Schlüssellänge von 40 Bits anstrebt wird die Tabelle nicht ausreichen. Tippt, wenn ihr die Tabelle voll habt, auf „Zeilen in den Schlüssel übernehmen“. Die Tabelle ist wieder geleert und ihr könnt weitere Bits für euren Schlüssel erstellen. Diese werden automatisch an den bestehenden angehängt.

Zum Abschluss tauscht ihr eure Geheimnachrichten mit den anderen Gruppen aus.

### Aufgabe 2: Schlüssel und Nachricht {.werkzeug name="schluessel"}

## Der Lauscher (Eve)

Du kennst jetzt die Grundlagen des BB84-Protokolls.

Wir haben bereits darüber gesprochen, dass die besondere Stärke der Quantenkryptografie ihre Abhörsicherheit ist. Doch wo ist eigentlich die Person, die versucht mitzuhören?

In der Kryptografie wird ein Lauscher traditionell als **Eve** bezeichnet. Ein Deckname, genau wie **Alice** für die Senderin und **Bob** für den Empfänger.

![Eve – Die Lauscherin](media/eve-seite.jpg)

Eve besteht im Kern aus den gleichen Teilen wie Bob und Alice. Links ein Messapparat, der zwischen der [×] und [+] Basis wechseln kann und die Photonen von Alice abfängt. Sowie rechts einem Sender, der ein neues Photon im von ihr gemessenen Zustand mithilfe eines eigenen Polarisationsdrehers an Bob schickt.

![Eve Messteil](media/eve-messteil.jpg) ![Eve Senderteil](media/eve-senderteil.jpg)

![Überblick: Alice sendet Photonen über den Quantenkanal an Bob; Eve könnte dazwischen lauschen; die Basen werden über einen öffentlichen klassischen Kanal verglichen](media/aufbau-ueberblick.svg)

:::merksatz
Im Labor übernimmt gleich jemand die Rolle von Eve und ihr werdet sehen, dass ihre Eingriffe erkennbar werden.
:::

## Der Intercept-Resend-Angriff

Eve befindet sich zwischen Alice und Bob auf dem Quantenkanal und versucht, Informationen über den geheimen Schlüssel zu gewinnen. **Wichtig!**: Die wirkliche Nachricht hört sie nicht ab, nur die Schlüsselgenerierung.

Die einzige Möglichkeit für Eve, an diese Informationen zu gelangen, besteht darin, die gesendeten Photonen abzufangen und selbst zu messen. Würde Eve die Photonen jedoch nur messen und nicht weiterleiten, kämen bei Bob keine Photonen mehr an. Ein solcher Angriff wäre sofort erkennbar.

Deshalb geht Eve anders vor: Nachdem sie ein Photon gemessen hat, erzeugt sie ein neues Photon und sendet es mit dem von ihr gemessenen Zustand an Bob weiter. Auf diese Weise versucht sie, ihre Anwesenheit zu verbergen und gleichzeitig Informationen über den Schlüssel zu erhalten.

![Intercept-Resend: Alice sendet ein Photon, Eve fängt es ab, misst es und sendet ein neues Photon an Bob](media/intercept-resend.svg)

:::merksatz
**Eves Problem:** Sie kennt Alices Basis nicht, da der Basisabgleich erst später stattfindet. Sie muss also **raten** in welcher Basis sie die Messung durchführt.

Bereits dadurch hat Eve einen Nachteil: Da sie die Basen nur raten kann, wird sie den späteren Schlüssel niemals vollständig korrekt kennen. Doch damit nicht genug.

Durch das Raten der Basen und das Präparieren neuer Photonen wird Eve früher oder später Fehler in die Übertragung einbringen. Diese verraten ihre Anwesenheit. Wie genau das geschieht und wie schnell Eve entdeckt werden kann, schauen wir uns im nächsten Kapitel an.
:::

## Aufgabe 3: BB84 mit Eve

Ihr wisst jetzt, wie Eve vorgeht. Setzt Eve nun im echten Aufbau ein: Platziert Eve an der markierten Stelle und achtet darauf, dass die Strahlengänge korrekt positioniert sind. Lasst euren Aufbau von einer Laborangestellten oder einem Laborangestellten überprüfen, bevor ihr startet.

![Gesamtaufbau Alice, Eve und Bob](media/alice-eve-bob.png)

Teilt euch anschließend so auf, dass mindestens eine Person Alice, eine Person Bob, eine Person den Empfänger von Eve und eine Person den Sender von Eve bedient. Solltet ihr nur zu dritt sein, übernimmt eine Person beide Aufgaben von Eve.

Eure Aufgabe ist es nun erneut, einen Schlüssel zu erstellen. Das Tool zum automatischen Würfeln findet ihr in leicht angepasster Form wieder.

Dabei ändert sich das Vorgehen wie folgt:

1. Alice und Bob würfeln wie bisher ihre Basen und das zu sendende Bit. Eve macht dasselbe und würfelt ebenfalls die Basis, in der sie messen wird.
2. Alice präpariert das Bit und sendet es ab.
3. Eve fängt das Photon ab und misst es in der Basis, die sie gewürfelt hat. Der aufleuchtende Detektor gibt das Bit an, das Eve nun selber präpariert. Eve stellt ihren Polarisationsdreher entsprechend ein und sendet ein neues Photon an Bob.
4. Bob misst das von Eve gesendete Bit und notiert sein Messergebnis.
5. Am Ende vergleichen Alice und Bob wieder ihre Basen. Stimmen diese überein, wird das entsprechende Bit in den gemeinsamen Schlüssel übernommen. An diesem Schritt des Protokolls ändert sich zunächst nichts.

**Aufgabe:**

Erstellt mit diesem Vorgehen einen 10 Bit Schlüssel. Jetzt sollt ihr jedoch keine Nachricht verschlüsseln sondern eure Schlüsselbits vergleichen. Dafür liest die Gruppe Bob ihre Bits langsam der Gruppe Alice vor und diese trägt die Bits in der Tabellenspalte "Schlüssel-Bits der anderen Gruppe" ein. Macht das ganze auch für die Gruppe Bob. Klickt nun in den Zeilen den roten Knopf, um Unterschiede in den Schlüsseln zu markieren. Besprecht eure Ergebnisse.

### Zu welcher Gruppe gehört ihr? {.werkzeug name="rollenwahl" eve="true"}

### Aufgabe 3: Schlüssel mit Eve, Vergleich und Fehlerrate {.werkzeug name="schluessel" modus="eve"}

### Frage 2: Ursache der Fehler {.frei platzhalter="Deine Erklärung …"}
Warum kam es zu diesen Fehlern? Erkläre!

*Tipp: Es hat mit den Basen von Alice, Bob und Eve zu tun.*

### Frage 3: Baumdiagramm {.werkzeug name="baumdiagramm"}
Vervollständige das Baumdiagramm, um die Wahrscheinlichkeit zu berechnen, mit der Eve sich verrät. Trage die Wahrscheinlichkeiten an den Pfaden ein und beschrifte die Endknoten.

### Frage 4: Gesamtwahrscheinlichkeit {.frei platzhalter="Eure Antwort …"}
Wie hoch ist die Gesamtwahrscheinlichkeit, dass sich Eve beim Lauschen verrät?

### Frage 5: Wahrscheinlichkeit beim Schlüsselaustausch {.frei platzhalter="Eure Antwort …"}
Wie hoch ist die Wahrscheinlichkeit, dass Eve entdeckt wird, wenn Alice und Bob ihre Schlüsselbits vergleichen?

## Aufgabe 4: Wie viele Testbits braucht man?

Ihr habt nun gesehen, dass Eves Abhörversuche auffallen. Alice und Bob müssen, also um sicherzugehen, dass niemand sie abhört, jedes Mal entscheiden, wie viele ihrer gemeinsamen Schlüsselbits sie als **Testbits** opfern, also offen vergleichen.

Überlegt in eurer Gruppe: **Ab wie vielen verglichenen Testbits könnt ihr mit einer Sicherheit von 99% sagen, ob Eve dabei war? Notiert eure Schätzung:**

### Aufgabe 4: Schätzung, Testbits und Zufallsversuch {.werkzeug name="testbits"}

### Hinweise zum Zufallsversuch {.info}
:::merksatz
Beachtet: Bei wenigen Bits kann Eve auch bei 25 % Fehlerwahrscheinlichkeit manchmal **Glück haben** und keinen Fehler hinterlassen. Je mehr Testbits, desto zuverlässiger die Erkennung.
:::

:::mehr Was ist mit „technischen Gründen" gemeint?
In echten Quantenkommunikationssystemen entstehen Fehler nicht nur durch Lauschangriffe. Photonen sind extrem empfindlich und können bereits durch kleinste Störungen im Übertragungsweg beeinflusst werden. Ungenauigkeiten in den Messgeräten, Streulicht in der Glasfaser oder mechanische Vibrationen am Aufbau können dazu führen, dass Bob ein anderes Bit misst als Alice gesendet hat, obwohl niemand abgehört hat. Auch die Detektoren selbst sind nicht perfekt und registrieren gelegentlich Photonen falsch.

All diese unvermeidlichen Fehler summiert man zur sogenannten **Quantum Bit Error Rate (QBER)**. Sie gibt an, wie viel Prozent der verglichenen Bits nicht übereinstimmen. In der Praxis gibt es einen Schwellenwert für die QBER, unterhalb dessen die Fehler als technisch bedingt gelten und der Schlüssel als sicher betrachtet wird. Dieser Schwellenwert liegt typischerweise im Bereich von etwa 10–11 %, kann aber je nach verwendetem Sicherheitsprotokoll variieren. Liegt die gemessene QBER darüber, ist die Wahrscheinlichkeit zu hoch, dass jemand wie Eve im Spiel war. In diesem Fall wird der gesamte Schlüssel verworfen und der Prozess von vorne gestartet. Das BB84-Protokoll ist also nicht nur abhörsicher, sondern erkennt auch, wann die Übertragungsqualität für einen sicheren Schlüssel nicht ausreicht.
:::

## Das Kein-Klon-Theorem: Kopieren ist verboten

Ihr habt gesehen: Schon bei wenigen Testbits steigt die Chance, Eve aufzudecken und bei 100 Bits ist sie nicht zu übersehen. Warum lässt sich Eve überhaupt auf dieses zum Scheitern verurteilte Spiel ein um an die Informationen zu kommen Warum kann Eve die Photonen nicht einfach unverändert weiterschicken und heimlich abmessen, ohne überhaupt Spuren zu hinterlassen?

Die Antwort steckt in einem fundamentalen Gesetz der Quantenphysik: dem **Kein-Klon-Theorem**. Es besagt, dass es prinzipiell unmöglich ist, einen unbekannten Quantenzustand perfekt zu kopieren.

| Klassische Kopie | Quantenkopie |
|---|---|
| Eine Datei wird gelesen und dupliziert. Das Original bleibt völlig unverändert. Ob eine Kopie gemacht wurde, ist nicht nachweisbar. | Um einen Quantenzustand zu "lesen", muss man ihn messen. Die Messung kollabiert den Zustand. Eine perfekte Kopie ohne diesen Eingriff ist physikalisch unmöglich. |
| **Möglich – keine Spur** | **Prinzipiell unmöglich** |

**Was bedeutet das für das BB84-Protokoll?**

**Konsequenz für Eve:** Eve kann kein Photon abfangen, kopieren und das Original unverändert weiterschicken. Sie muss es zwingend messen und dabei verrät sie sich. Durch die Messung wird das Photon absorbiert, Eve kann es also gar nicht weiterschicken. Der Versuch ein neues Photon im richtig geratenen Zustand an Bob zu schicken ist dann nur noch der Versuch ihren Messprozess zu verschleiern.

:::merksatz
**Merksatz:** Das Kein-Klon-Theorem ist der physikalische Grund, warum Quantenkryptografie sicher ist. Nicht weil Abhören schwer ist, sondern weil es physikalisch unmöglich ist, **unbemerkt** zu bleiben.
:::

### Experiment abschließen → Kapitel 4 freischalten {.knopf oeffnet="abschluss" id="abschluss"}
