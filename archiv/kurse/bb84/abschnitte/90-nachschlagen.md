---
titel: Das BB84-Protokoll
nr: N
nachschlagen: true
---
Wie Alice und Bob mit Quantenphotonen einen geheimen Schlüssel vereinbaren.

**Diese Seite ist zum Nachschlagen bei Problemen gedacht.** Hier musst du nichts der Reihe nach lesen. Schau hier nach, wenn du **während der Durchführung** Fragen zum Ablauf des BB84-Protokolls hast, z. B. welche Schritte es gibt, wie ein Beispieldurchlauf aussieht oder wie die Verschlüsselung funktioniert.

## Einleitung

Du hast nun die Grundlagen der Quantenphysik kennengelernt und möchtest während der Durchführung etwas nachschlagen oder genauer verstehen, was hinter den Aufgaben steckt. Auf dieser Seite findest du einen detaillierten Ablauf des BB84-Protokolls, weitere Beispielübertragungen sowie Erklärungen zur Binäraddition. Das zentrale Verfahren dieses Workshops ist das **BB84-Protokoll**, das 1984 von **Charles H. Bennett** und **Gilles Brassard** entwickelt wurde. Es nutzt die Gesetze der Quantenmechanik, um einen Schlüssel zu erzeugen, der physikalisch abhörsicher ist. Wie genau das funktioniert, zeigen die folgenden Schritte, zunächst nur zwischen dem Sender **Alice** und dem Empfänger **Bob**, bevor wir uns anschauen, was passiert, wenn der Lauscher **Eve** versucht, das Gespräch abzuhören.

## Überblick: Der Ablauf des BB84-Protokolls

| Schritt 1 | Alice wählt zufällig Bit (0/1) und Basis (+/×) |
|---|---|
| Schritt 2 | Bob wählt zufällig eine Messbasis (+/×) |
| Schritt 3 | Alice präpariert und schickt das Photon |
| Schritt 4 | Bob detektiert das präparierte Photon von Alice |
| Schritt 5 | Basisabgleich: Alice und Bob vergleichen öffentlich ihre Basen |
| Schritt 6 | Sifting: Bits mit gleicher Basis werden dem Rohschlüssel hinzugefügt, die anderen verworfen |

:::merksatz
**Wichtig:** Beim Basisabgleich tauschen Alice und Bob **nur** ihre Basen aus, nicht die Bits! Durch dieses Vorgehen kann ein möglicher Lauscher (Eve) keine Informationen über den Schlüssel erlangen, was im Weiteren des Kapitels genauer erklärt wird.
:::

## Ablauf des BB84 Protokolls anhand eines Beispiels

**Schritt 1: Alice wählt Bit und Basis**

Bevor Alice ein Photon senden kann muss sie zufällig das Bit selbst und die Basis, in der das Bit kodiert wird, wählen. In unserem Beispiel wurde zufällig folgendes bestimmt:

| Bit | 0 |
|---|---|
| Basis | + |

Diese Wahl ist absolut zufällig und geheim! Weder Bob noch Eve kennen sie.

**Schritt 2: Bob wählt seine Messbasis**

Bob wählt **unabhängig und zufällig** eine Messbasis und stellt seinen Messapparat ein. Er weiß zu diesem Zeitpunkt nicht, welche Basis Alice zur Präparation verwendet.

| Bob Basis | + |
|---|---|

In diesem Beispiel liegt Bob richtig aber das ist Zufall (50/50).

**Schritt 3: Alice präpariert das Photon**

Mit Basis **+** und Bit **0** präpariert Alice ein Photon im Zustand |↑⟩ (vertikal) mithilfe des auf 0° eingestellten Polarisationsdrehers und schickt es in den Quantenkanal.

![Alice](media/alice.jpg) ![Alice Poldreher](media/alice-poldreher.jpg)

**Schritt 4: Bob misst das Photon**

Das präparierte Photon von Alice wird durch Bobs **[+]-Messapparat** detektiert. Bobs und Alice Basis **+** stimmen überein. Der **Detektor 0** schlägt mit Sicherheit aus. Das Bit **0** wurde erfolgreich übermittelt.

![Bob Polarisationsfilter](media/bob-polfilter.jpg) ![Detektor 0 leuchtet](media/d0-leuchtet.jpg)

**Schritt 5·6: Basisabgleich & Schlüssel**

**Schritt 5:** Alice und Bob tauschen öffentlich ihre Basen aus nicht aber die Bits.

| # | Alice Bit | Alice Basis | Photon | Bob Basis | Bob Messung | Basis gleich? | Im Schlüssel |
|---|---|---|---|---|---|---|---|
| 1 | **0** | + | \|↑⟩ | + | **0** | ✓ Ja | **0** |

**Schritt 6:** Da die Basen übereinstimmen, wird das übermittelte Bit in den gemeinsamen Rohschlüssel übernommen.

Rohschlüssel: **0**

## Schritt-für-Schritt: 8 Photonen

Ein vollständiger Durchlauf des BB84-Protokolls wurde bereits im Detail betrachtet. In der Praxis gibt es jedoch viele mögliche Abläufe bei der Erzeugung der Schlüsselbits. Im Folgenden werden die einzelnen Schritte zwischen Alice und Bob erneut durchlaufen. Dabei liegt der Fokus darauf zu verstehen, unter welchen Bedingungen ein Bit in den Rohschlüssel übernommen oder verworfen wird. Klicke auf „Nächster Schritt“, um die sechs Schritte des Protokolls für ein weiteres Photon nacheinander aufzudecken.

### 8 Photonen {.werkzeug name="photonen8"}

## Von Text zu Bits: „Hallo"

Computer und Quantenkryptografie arbeiten mit Nullen und Einsen, die so genannten **Bits**. Bevor eine Nachricht verschlüsselt werden kann, muss sie daher in diesen Binärcode umgewandelt werden.

In unserem vereinfachten Alphabet-Code hat jeder Buchstabe eine Schreibweise, die aus **5 Bits** besteht. So ist es möglich nur mit 2 Ziffern ganze Worte oder Sätze zu schreiben und zu verschicken:

![Codetabelle: Jeder Buchstabe von A bis Z hat eine Schreibweise aus 5 Bits](media/codetabelle.svg)

| | | | | | |
|---|---|---|---|---|---|
| | H | A | L | L | O |
| wird zu | 00111 | 00000 | 01011 | 01011 | 01110 |

**Binärtext (25 Bits für „HALLO")**

00111 00000 01011 01011 01110

## Verschlüsselung: H mit dem Quantenschlüssel

Der mit dem BB84-Protokoll erstellte Schlüssel lautet **01001**. Per **Binäraddition** wird der erste Buchstabe **H** (Binär: 00111) Bit für Bit verschlüsselt:

| | | | | | |
|---|---|---|---|---|---|
| Schlüssel (BB84) | 0 | 1 | 0 | 0 | 1 |
| H in Binärschreibweise | 0 | 0 | 1 | 1 | 1 |
| = Verschlüsselt | 0 | 1 | 1 | 1 | 0 |

**Binäraddition (⊕)**

| | |
|---|---|
| 0 + 0 = **0** | 0 + 1 = **1** |
| 1 + 0 = **1** | 1 + 1 = **0** |

Bob hat die verschlüsselte Nachricht **01110** erhalten. Wie kommt er jetzt an den ursprünglichen Buchstaben?

:::merksatz
Es muss der Schlüssel **01001** nochmal binär addiert werden! Die Verschlüsselung ist selbstinvers: **01110 + 01001 = 00111 = H**
:::

## Gleiche Basis bedeutet vollständige Informationsübertragung

**Eure Beobachtungen sollten Folgendes ergeben haben:**

Wird ein Photon in einem Zustand einer Basis präpariert und anschließend in derselben Basis gemessen, misst Bob eindeutig den von Alice präparierten Zustand. Das Photon überträgt so die Information vollständig, ohne dass Alice und Bob den gesendeten Zustand austauschen müssen. Schon das gemeinsame Vergleichen der Basen genügt, da beide wissen, dass bei gleicher Basis das Messergebnis dem präparierten Zustand entspricht.

Dadurch können Bits übertragen werden. Alice und Bob vereinbaren lediglich, welcher Polarisationszustand für **0** und welcher für **1** steht. Verwendet Bob dieselbe Basis wie Alice, erhält er mit Sicherheit denselben Bitwert. So können beide dieselbe Bitfolge erzeugen, ohne die Bitwerte direkt miteinander auszutauschen.

Zustand **|→⟩** bzw. **|↗⟩** entspricht dem Bit **1** Zustand **|↑⟩** bzw. **|↘⟩** entspricht dem Bit **0**

**Gleiche Basis [+]**

• Alice präpariert |↑⟩ • Bob misst mit [+] Bob registriert immer **|↑⟩** mit **100 %** ⇒ Das Ergebnis ist vollständig **deterministisch**

**Gleiche Basis [×]**

• Alice präpariert |↗⟩ • Bob misst mit [×] Bob registriert immer **|↗⟩** mit **100 %** ⇒ Das Ergebnis ist vollständig **deterministisch**

:::merksatz
**Quintessenz:** Verwenden Alice und Bob dieselbe Basis, kann Bob den von Alice kodierten Bitwert mit 100 % Sicherheit bestimmen. Die Information wird dabei durch den Quantenzustand des Photons übertragen. Das Bit selbst wird niemals direkt ausgetauscht.
:::

:::merksatz
Was passiert nun aber wenn Alice und Bob **unterschiedliche** Basen zum präparieren und messen wählen?
:::
