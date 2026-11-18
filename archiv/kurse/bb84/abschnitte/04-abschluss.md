---
titel: Abschluss
nr: 4
oeffnet_nach: knopf:abschluss
grund: Öffnet sich über „Experiment abschließen“ am Ende von Kapitel 3.
---
Wo lässt sich das heute Gelernte wirklich anwenden?

## Grenzen des Analogieexperiments

Das Experiment im Labor bildet alle Grundprinzipien der Quantenverschlüsselung per BB84-Protokoll anschaulich nach, ist aber ein **Analogieaufbau** und keine echte Quantenkryptografie. An einigen Stellen muss man daher relativieren:

- Gesendet wird mit **kurzen Laserpulsen**, nicht mit einer echten Einzelphotonenquelle. Es werden also keine einzelnen Photonen übertragen.
- Die Übertragung erfolgt über einen **freien Strahlengang** im Labor und nicht über eine Glasfaserstrecke unter realen Feldbedingungen.
- Der Abgleich der Basen und die Auswertung der Bits geschehen **per Hand** und nicht automatisiert in Echtzeit.
- Effekte wie Detektorrauschen, Dämpfung oder eine reale Fehlerrate (QBER) treten nur stark vereinfacht auf.

:::merksatz
Diese Vereinfachungen schmälern die Übertragbarkeit der gelernten Inhalte jedoch nicht. Das Prinzip von Basiswahl, Schlüsselabgleich und Abhörerkennung lässt sich genauso auf die reale Quantenkryptografie anwenden.
:::

## Anwendung in der Praxis: Niedersachsen Quantum Link

**Reale Feldmessung • Niedersachsen, 2024**

#### Quantenschlüsselverteilung **zwischen Hannover und Braunschweig**

Niedersachsen Quantum Link · erste interstädtische QKD mit deterministischer Einzelphotonenquelle

![Quantenkanal Hannover–Braunschweig](media/quantenlink.png)

Abb. Quantum channel • 79 km Glasfaser, 25,49 dB Dämpfung • Hannover (Alice) → Braunschweig / PTB (Bob)

| | | |
|---|---|---|
| Streckenlänge | 79 km | verlegt, ≈ 130 km Standard-Faser |
| Kanalverlust | 25,49 dB | reale Feldbedingungen |
| QBER | ~ 0,65 % | Quantum Bit Error Ratio |

Was ihr heute im Labor mit Polarisationsdrehern auf dem Tisch nachvollzogen habt, funktioniert auch über reale Glasfaserstrecken im Feldeinsatz. Physikerinnen und Physiker der **Leibniz Universität Hannover** haben gemeinsam mit der **Physikalisch-Technischen Bundesanstalt (PTB) Braunschweig** das BB84-Protokoll genau über diese Strecke umgesetzt.

Besonders ist die verwendete Photonenquelle: Statt eines Lasers, der viele Photonen gleichzeitig aussendet, kam ein **Halbleiter-Quantenpunkt** zum Einsatz, eine Quelle, die einzelne Photonen auf Abruf emittiert. Die Information ist, wie in eurem Experiment, in der **Polarisationsrichtung** der Photonen kodiert.

**Einschränkungen & aktueller Stand**

So beeindruckend das Experiment ist: Es wäre irreführend, es als fertige Lösung darzustellen. Die 79-km-Glasfaser zwischen Hannover und Braunschweig ist eine **Telekommunikationsleitung der Deutschen Telekom**, die ursprünglich für klassische Datenkommunikation verlegt wurde und nur gemietet wird. Eine echte Quanteninfrastruktur, also Glasfaserleitungen, die speziell für Einzelphotonen optimiert und flächendeckend verfügbar sind, existiert bisher nicht.

Dazu kommt ein fundamentales Effizienzproblem: Von 100 ausgesendeten Photonen kommen bei dieser Strecke weniger als **0,3 % am Ziel an**. Der Rest geht in der Glasfaser verloren. Das bedeutet: Für jeden nutzbaren Schlüsselbit müssen hunderte von Photonen gesendet werden. Die Übertragungsrate verwertbarer Bits bleibt damit extrem niedrig, zu niedrig für viele praktische Anwendungen.

Hinzu kommt, dass das BB84-Protokoll allein noch keine vollständige Sicherheit garantiert. Nach dem Rohschlüsselaustausch braucht es **Fehlerkorrektur** (um Übertragungsfehler auszumerzen) und **Privacy Amplification** (um selbst geringe Informationslecks zu beseitigen). Beide Schritte kosten weitere Bits. Was am Ende übrig bleibt, ist oft ein Bruchteil der ursprünglich gesendeten Information.

Reichweite, Skalierbarkeit und Integrationsaufwand sind weitere offene Fragen. Ohne **Quantenrepeater**, die den Quantenzustand über Zwischenstationen weiterleiten könnten, ohne ihn zu messen und damit zu zerstören, ist QKD auf einige hundert Kilometer begrenzt. Diese Repeater existieren heute noch nicht als Produkt. Quantenkryptografie ist also real, erprobt und physikalisch sicher. Aber bis sie breite Anwendung findet, ist noch erhebliche Entwicklungsarbeit nötig.

Was ihr also im Kleinen ausprobiert habt, ist kein rein akademisches Gedankenexperiment. Die physikalischen Prinzipien sind real und bereits über 79 Kilometer Glasfaser erprobt. Ob daraus eines Tages ein verlässliches Quanteninternet wird, hängt davon ab, wie gut es gelingt, die offenen technischen Probleme zu lösen.

Quelle: [Light: Science & Applications, 2024](https://www.nature.com/articles/s41377-024-01488-0) · Leibniz Universität Hannover & PTB Braunschweig

## Das hast du in diesem Workshop gelernt

:::merksatz
- **Quantenzustand:** Der Zustand beschreibt keine bereits vorliegende Eigenschaft des Photons, sondern ist ein Vorhersagekatalog für alle potenziell möglichen Messergebnisse.
- **Präparation:** Ein gezielter experimenteller Eingriff, durch den das Photon in einen definierten und bekannten Zustand gebracht wird. Damit ist festgelegt, welche Wahrscheinlichkeiten für alle nachfolgenden Messungen gelten.
- **Messung:** Kein passives Ablesen, sondern eine physikalische Wechselwirkung zwischen Messapparat und Quantenobjekt, durch die der Zustand in ein konkretes, eindeutiges Ergebnis übergeht. Das Ergebnis steht vorher nicht fest, es ist **objektiv unbestimmt**.
- **Superposition:** Ist der präparierte Zustand kein Basiszustand der Messbasis, so besitzt er Anteile beider Basiszustände dieser Messbasis. Das Messergebnis fällt dann zufällig aus, und die Messung löst die Superposition auf.
- **Das BB84-Protokoll:** Alice präpariert Photonen in zufällig gewählten Basen, Bob misst sie in ebenfalls zufällig gewählten Basen. Anschließend vergleichen beide öffentlich nur ihre Basen, niemals die Bitwerte.
- **Sifting:** Alle Bits, bei denen Alice und Bob ungleiche Basen verwendet haben, werden verworfen. Übrig bleibt der Rohschlüssel, ohne dass je ein Bitwert öffentlich wurde.
- **Abhörsicherheit:** Jede Messung verändert den Zustand unwiederbringlich, und ein unbekannter Quantenzustand lässt sich nicht kopieren (**Kein-Klon-Theorem**). Jeder Lauschangriff hinterlässt daher statistisch nachweisbare Fehler im Rohschlüssel.
- **Vom Labor in die Praxis:** Was ihr auf dem Tisch nachgebaut habt, läuft bereits über 79 km Glasfaser zwischen Hannover und Braunschweig und ist Grundlage eines zukünftigen Quanteninternets.
:::

:::info
Deine Definitionen und alle Ergebnisse findest du auf der [Ergebnisseite](#ergebnis) und im Protokoll-PDF.
:::
