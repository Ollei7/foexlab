---
titel: "Das Fadenpendel"
nr: 1
---

<!-- Notiz an Kolleginnen: Dieser Beispielkurs gehört zum Skill foexlab-kurs. Kommentare wie dieser erscheinen nirgends. -->

## Worum es geht {#start}

Ein Fadenpendel schwingt hin und her. Ihr untersucht, wovon die Dauer einer Schwingung abhängt.

### So arbeitet ihr {.info}

![Fadenpendel mit Fadenlänge L](media/pendel.svg)

Die Lernumgebung führt euch Seite für Seite durch den Versuch. Eure Eingaben bleiben auf diesem iPad gespeichert.

:::merksatz
Die **Periodendauer** \(T\) ist die Zeit für eine vollständige Hin- und Herbewegung.
:::

## Eure Vermutung {#vermutung-karte}

### Vermutung: Periodendauer {.vermutung sperrt #vermutung}

Wie ändert sich die Periodendauer, wenn ihr den Faden länger macht? Begründet kurz.

:::tipp
Denkt an eine Schaukel mit langen und mit kurzen Seilen.
:::

## Messung am Pendel {#messung}

### Messreihe: Periodendauer {.messtabelle #messreihe}

Messt für mindestens fünf Fadenlängen (in cm) die Zeit für zehn Schwingungen.

:::spalten
L | Fadenlänge L | cm
t10 | Zeit für 10 Schwingungen | s
T = t10/10 | Periodendauer T | s
T2 = T^2 | Quadrat der Periodendauer | s²
:::
:::diagramm
x = L, y = T2, ausgleich = ursprung
:::

:::lehrkraft
Erwartung: \(T^2\) wächst proportional zu \(L\). Bei kleinen Auslenkungen (unter etwa 10°) bleiben die Abweichungen gering.
:::

## Simulation {#simulation}

### Simulation: Fadenlänge {.werkzeug name="pendel" min="10" max="100" schritt="10" einheit="cm" groesse="Fadenlänge" sperrt #sim-laenge}

Stellt verschiedene Fadenlängen ein und übernehmt jeweils den Messwert der Periodendauer (in Sekunden).

### Simulation: Masse des Pendelkörpers {.platzhalter}

Ein Regler für die Masse des Pendelkörpers (50 g bis 500 g); die Periodendauer bleibt gleich. So sollen die Gruppen sehen, dass die Masse keine Rolle spielt.

## Auswertung {#auswertung}

### Zusammenhang {.luecke sperrt versuche="2" #zusammenhang}

Je länger der Faden, desto {{größer|kleiner}} ist die Periodendauer. Bei vierfacher Fadenlänge wird die Periodendauer {{doppelt|vier mal|halb}} so groß.

:::richtig
Richtig: \(T\) wächst mit der Wurzel aus \(L\).
:::
:::falsch
Noch nicht. Vergleicht in eurer Tabelle die Werte für 25 cm und 100 cm.
:::
:::nach_versuchen
Bei 25 cm ist \(T \approx 1{,}0\,\text{s}\), bei 100 cm \(T \approx 2{,}0\,\text{s}\): vierfache Länge, doppelte Periodendauer.
:::
