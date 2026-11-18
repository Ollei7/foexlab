---
titel: Das Schlüsselverteilungsproblem
nr: 1
oeffnet_nach: felder:lernblatt/lernblatt-mein-vorwissen
grund: Öffnet sich, wenn alle Fragen im Lernblatt beantwortet sind.
---
Warum ist sichere Kommunikation so schwer und wo liegt das eigentliche Problem?

## Eine wichtige Nachricht

Alice möchte Bob eine vertrauliche Nachricht senden. Beide befinden sich an unterschiedlichen Orten und kommunizieren deshalb über das Internet.

Das Problem: Nachrichten werden auf ihrem Weg durch zahlreiche Netzwerke, Router und Server geleitet. Alice und Bob haben keine Kontrolle darüber, welche Systeme die Nachricht durchläuft oder wer möglicherweise Zugriff auf diese hat.

:::merksatz
**Erste Frage:** Was können Alice und Bob machen, damit ihre Kommunikation geheim bleibt?
:::

### Was denkst du: Wie könnte Alice eine geheime Nachricht an Bob schicken? {.frei sperrt platzhalter="Deine Gedanken …"}

## Die Idee: Verschlüsselung

Eine naheliegende Antwort ist **Verschlüsselung**: Alice wandelt ihre Nachricht mithilfe eines **Schlüssels** in einen unlesbaren Geheimtext um. Nur wer denselben Schlüssel besitzt, kann die Nachricht wieder entschlüsseln.

Das wohl bekannteste Beispiel ist die Cäsarverschlüsselung. Bei dieser wird jeder Buchstabe im Alphabet um eine feste Anzahl von Positionen verschoben. Es zeigt sich jedoch schnell ein Problem. Es gibt nur 25 mögliche Schlüssel, was diese Methode nicht besonders sicher macht.

| Klartext | "Triff mich morgen" |
|---|---|
| + Schlüssel | z.B. Buchstabenverschiebung +3 |
| → Geheimtext | "Wulii plfk prujhq" ← unleserlich |
| Entschlüsseln | Schlüssel rückwärts → Klartext |

:::merksatz
**Zusatz:** Nutzen Alice und Bob denselben Schlüssel zum Ver- und Entschlüsseln ihrer Nachricht spricht man von **Symmetrischer Verschlüsselung**.
:::

## Das One-Time-Pad

Die Cäsarmethode ist wie sich zeigt eine sehr unsichere Verschlüsselungsmethode. Aber welchen Schlüssel sollte man wählen und wie sicher ist er wirklich? Mathematiker haben hierzu eine elegante Antwort gefunden: das **One-Time-Pad** (Einmal-Schlüssel). Es ist nicht nur schwer zu knacken, sondern mathematisch beweisbar **unknackbar**.

Das Prinzip: Alice wählt einen vollständig zufälligen Schlüssel, der genauso lang ist wie ihre Nachricht. Die Nachricht wird dabei als Folge von Bits dargestellt. Ein Bit ist die kleinste Informationseinheit eines Computers und kann nur die Werte 0 oder 1 annehmen. Nun wird die Nachricht bitweise mit dem Schlüssel verknüpft, wodurch der Geheimtext entsteht.

Das genaue Verfahren wirst du später im Anwendungskapitel sehen.

| Schlüssellänge | Genau so lang wie die Nachricht |
|---|---|
| Schlüssel | Zufällig erstellt ohne Muster |
| Verwendung | Jeder Schlüssel wird nur **einmal** benutzt |
| Sicherheit | Mathematisch beweisbar unknackbar |

:::merksatz
Das klingt nach der perfekten Lösung. **Also: Problem gelöst?**
:::

### Alice verschlüsselt ihre Nachricht mit einem OTP-Schlüssel und schickt Bob den Geheimtext. Was braucht Bob noch, um die Nachricht lesen zu können und wo könnte auch beim perfekten Schlüssel ein Problem entstehen? {.frei sperrt platzhalter="Deine Gedanken …"}

## Das Kernproblem der klassischen Kryptografie taucht auf

Vielleicht bist du selbst schon drauf gekommen: Bob braucht den **Schlüssel**. Aber wie bekommt er ihn?

Alice könnte den Schlüssel zusammen mit der Nachricht verschicken. Dann könnte jedoch jeder, der die Nachricht abfängt, auch den Schlüssel mitlesen. Sie könnte den Schlüssel auch über einen anderen Kanal senden. Doch solange dieser Kanal nicht sicher ist, besteht dort genau das gleiche Problem.

Das One-Time-Pad ist perfekt sicher, sobald Alice und Bob denselben geheimen Schlüssel besitzen. Doch genau diesen Schlüssel müssen sie zunächst austauschen.

:::merksatz
**Das Schlüsselverteilungsproblem:** Für eine sichere Kommunikation benötigen Alice und Bob einen gemeinsamen geheimen Schlüssel. Um diesen Schlüssel sicher zu übertragen, bräuchten sie jedoch bereits einen sicheren Kommunikationskanal. Einen solchen Kanal könnten sie aber erst mithilfe des Schlüssels aufbauen.
:::

In der klassischen Physik entsteht dadurch ein grundlegendes Problem: Über einen gewöhnlichen Kommunikationskanal, beispielsweise das Internet, Funkverbindungen oder Kabel, kann ein Angreifer den Schlüssel unbemerkt mitlesen, ohne dabei Spuren zu hinterlassen.

:::merksatz
Wie kann man dieses Problem lösen?
:::

### Beschreibe das Schlüsselverteilungsproblem in einem eigenen Satz: Warum reicht das One-Time-Pad allein nicht aus? {.frei sperrt platzhalter="Das Problem ist … weil …"}
Das Problem ist … weil …

## Ein Ausweg: Quantenphysik

Die Quantenphysik bietet eine überraschende Lösung für das Schlüsselverteilungsproblem. Anstatt zu versuchen, einen Kommunikationskanal zu schaffen, den niemand abhören kann, verfolgt die Quantenkryptografie einen anderen Ansatz: Alice und Bob tauschen einen Schlüssel aus, ohne über dessen eigentlichen Informationsinhalt zu sprechen und können anschließend überprüfen, ob jemand mitgehört hat.

:::merksatz
Wie das möglich ist, zeigt das BB84-Protokoll, das wir uns im Folgenden Schritt für Schritt ansehen werden.
:::

## Verständnisfragen – Kapitel 1 {.quiz oeffnet="grundlagen"}

### Was ist ein Bit? {.mc}
:::antworten
- [ ] Eine Maßeinheit für die Dateiübertragungsgeschwindigkeit im Netz.
- [x] Die kleinste Informationseinheit in der Informatik. Ein Bit kann genau zwei Werte annehmen: 0 oder 1.
- [ ] Ein Schlüssel mit einer festen Länge von genau einem Zeichen.
- [ ] Eine physikalische Messgröße, die den Polarisationswinkel eines Photons in Grad angibt.
:::
:::richtig
Richtig! Ein Bit ist die kleinste Informationseinheit der Informatik und kann genau zwei Werte annehmen: 0 oder 1. Im One-Time-Pad wird jedes Nachrichtenbit einzeln mit einem Schlüsselbit verknüpft.
:::
:::falsch
Nicht ganz. Ein Bit ist die kleinste Informationseinheit der Informatik mit genau zwei möglichen Werten (0 oder 1) – keine Maßeinheit, kein Schlüssel und keine physikalische Messgröße.
:::
:::nachschlagen
schluesselverteilungsproblem/das-one-time-pad
:::

### Was bedeutet symmetrische Verschlüsselung? {.mc}
:::antworten
- [x] Sender und Empfänger nutzen denselben geheimen Schlüssel zum Verschlüsseln und Entschlüsseln der Nachricht.
- [ ] Sender und Empfänger nutzen jeweils einen eigenen privaten Schlüssel, der dem anderen unbekannt bleibt.
- [ ] Die Nachricht wird durch ein öffentlich bekanntes Verfahren verschlüsselt, ein Schlüssel ist dabei nicht erforderlich.
- [ ] Der Schlüssel wird vom Empfänger nach jeder erfolgreichen Übertragung automatisch neu generiert.
:::
:::richtig
Richtig! Symmetrische Verschlüsselung bedeutet: Sender und Empfänger nutzen denselben geheimen Schlüssel. Das ist effizient – führt aber direkt zum Schlüsselverteilungsproblem.
:::
:::falsch
Nicht ganz. Symmetrisch bedeutet: beide Seiten nutzen denselben Schlüssel. Option B beschreibt asymmetrische Verschlüsselung; C und D entsprechen keinem realen Verfahren.
:::
:::nachschlagen
schluesselverteilungsproblem/die-idee-verschluesselung
:::

### Welche Eigenschaften muss der Schlüssel eines One-Time-Pads erfüllen, damit es unknackbar ist? {.mc}
:::antworten
- [ ] Er muss mindestens doppelt so lang sein wie die Nachricht und sich dabei regelmäßig wiederholen.
- [x] Er ist vollständig zufällig, genauso lang wie die Nachricht und wird nur ein einziges Mal verwendet.
- [ ] Er besteht aus einem gut merkbaren Wort, das nur Alice und Bob bekannt ist.
- [ ] Er wird aus der Nachricht selbst berechnet, sodass gar kein zusätzlicher Schlüssel nötig ist.
:::
:::richtig
Richtig! Genau diese drei Eigenschaften machen das One-Time-Pad unknackbar: Der Schlüssel ist vollständig zufällig, genauso lang wie die Nachricht und wird nur ein einziges Mal verwendet. Fällt eine davon weg, entstehen Muster, die ein Angreifer ausnutzen kann.
:::
:::falsch
Nicht ganz. Der Schlüssel muss genauso lang wie die Nachricht sein, nicht länger, und er darf sich weder wiederholen noch aus der Nachricht selbst ableiten lassen. Entscheidend sind Zufälligkeit, gleiche Länge und einmalige Verwendung.
:::
:::nachschlagen
schluesselverteilungsproblem/das-one-time-pad
:::

### Was ist das Kernproblem, das hinter dem Schlüsselverteilungsproblem steht? {.mc}
:::antworten
- [ ] Der Schlüssel lässt sich mit genügend Rechenleistung früher oder später berechnen.
- [x] Um den geheimen Schlüssel sicher auszutauschen, bräuchten Alice und Bob bereits einen sicheren Kanal. Diesen könnten sie aber erst mit dem Schlüssel aufbauen.
- [ ] Alice und Bob können sich nicht darauf einigen, welches Verschlüsselungsverfahren sie überhaupt verwenden wollen.
- [ ] Der Schlüssel geht bei der Übertragung über weite Strecken verloren und muss ständig neu gesendet werden.
:::
:::richtig
Richtig! Das ist genau die Zwickmühle: Der sichere Kanal wäre die Lösung, setzt aber den Schlüssel schon voraus – und der Schlüssel setzt den sicheren Kanal voraus. Das One-Time-Pad verschiebt das Problem also nur, statt es zu lösen.
:::
:::falsch
Nicht ganz. Es geht nicht um Rechenleistung – das One-Time-Pad ist ja beweisbar sicher. Das Problem ist, dass Alice und Bob für den sicheren Austausch des Schlüssels bereits einen sicheren Kanal bräuchten, den sie erst mit diesem Schlüssel aufbauen könnten.
:::
:::nachschlagen
schluesselverteilungsproblem/das-kernproblem-der-klassischen-kryptogr
:::
