---
titel: "Interferenzmuster"
nr: 4
oeffnet_nach: knopf:aufbau-fertig
grund: "Öffnet sich, wenn euer Interferometer ein Interferenzmuster zeigt."
---

<!-- Bisher „Komplementarität der Interferenzmuster“. Umbenannt, weil „Komplementarität“ im KC eine andere Bedeutung hat. Inhalt klassisch, Phasensprünge wie bisher in Grad (Strahlteiler-Reflexion 90°, Spiegel 180°, entspricht der NUN-Konvention). -->

## Vergleich der Interferenzmuster {#a-k4-muster}

An beiden Ausgängen eures Interferometers seht ihr ein Interferenzmuster. Auf dieser Seite vergleicht ihr die beiden Muster und erklärt den Unterschied.

### Foto: Muster auf beiden Schirmen {.foto sperrt #schirme}

Vergleicht die Mittelpunkte der beiden Interferenzmuster.

### Vergleich der Mittelpunkte der Interferenzmuster {.vermutung sperrt #vergleich}

### Phasensprünge Info {.info}

<!-- Aufbau wie im Quantenteil (Tabelle, Skizze, Phasendifferenz, Kontrolle), mit Schirmen statt Detektoren und Wegen statt Möglichkeiten. Werte in π wie im Quantenteil. -->

:::info
Die unterschiedlichen Interferenzmuster auf Schirm 1 und Schirm 2 werden durch Phasendifferenzen hervorgerufen, die bei Reflexionen an den Bauteilen entstehen. Für die Bauteile im Interferometer gilt:

- **Strahlteiler:** Bei der Reflexion entsteht ein Phasensprung von π/2, bei der Transmission ändert sich die Phase nicht.
- **Spiegel:** Bei der Reflexion entsteht ein Phasensprung von π.
:::

### Phasensprünge {.werkzeug name="phasendifferenz" modus="schirm" sperrt #sphase}

Ermittelt für alle vier Wege vom Laser zu einem der beiden Schirme die Phasensprünge an jedem Bauteil und deren Summe. Nutzt dazu die Skizze. Wählt in jedem Feld einen Wert aus und prüft dann die Tabelle.

#### Phasendifferenz

Ermittelt aus den Summen der Phasensprünge für jeden Schirm die Phasendifferenz Δφ zwischen den beiden Wegen, die zu diesem Schirm führen.

### Phasensprung am Spiegel {.mc sperrt #aspiegel}

<!-- Ersetzt die frühere Zuordnung „kann vernachlässigt werden“ (Moritz, 17.11.). -->

Für die Phasendifferenz ist der Phasensprung an den Spiegeln nicht entscheidend. Wählt die passende Begründung aus.

:::antworten
- [x] Der Phasensprung am Spiegel kann vernachlässigt werden, weil auf jedem Weg genau eine Reflexion an einem Spiegel vorkommt. Der Beitrag π hebt sich in der Differenz auf.
- [ ] Der Phasensprung am Spiegel kann vernachlässigt werden, weil Spiegel das Licht vollständig reflektieren.
- [ ] Der Phasensprung am Spiegel kann vernachlässigt werden, weil er kleiner ist als der Phasensprung am Strahlteiler.
- [ ] Der Phasensprung am Spiegel kann vernachlässigt werden, weil nur die Summe der Phasensprünge am Strahlteiler 2 von Interesse ist.
:::
:::falsch
Noch nicht richtig. Vergleicht die Spalte „Spiegel“ in eurer Tabelle für alle vier Wege.
:::

### Kurze Kontrolle {.mc sperrt #aint}

Ermittelt, welche Art von Interferenz in der Mitte der Schirme auftritt, wenn beide Arme gleich lang sind.

:::antworten
- [ ] Konstruktive Interferenz auf beiden Schirmen.
- [x] Konstruktive Interferenz auf Schirm 1, destruktive auf Schirm 2.
- [ ] Destruktive Interferenz auf Schirm 1, konstruktive auf Schirm 2.
- [ ] Destruktive Interferenz auf beiden Schirmen.
:::
:::falsch
Noch nicht richtig. Bei welcher Phasendifferenz verstärken sich zwei Wellen, bei welcher löschen sie sich aus?
:::

## Gangunterschied {#a-k4-gang}

<!-- Neu in v2 (19.11.2026): Erprobung zeigte, dass Lernende Phasenverschiebung und Phasensprung gleichsetzen. Im Brechungsindex-Teil wird der Gangunterschied ebenfalls behandelt. -->

Bisher seid ihr davon ausgegangen, dass beide Arme eures Interferometers exakt gleich lang sind. Am realen Aufbau ist das nie ganz der Fall. Auf dieser Seite untersucht ihr, welchen Einfluss ein Längenunterschied der beiden Arme auf die Interferenzmuster hat.

### Beobachtungen: Muster ohne Veränderung und beim Drücken auf die Grundplatte {.frei sperrt #gu-beob}

Beobachtet die Interferenzmuster auf beiden Schirmen etwa eine Minute lang, ohne etwas am Aufbau zu verändern. Drückt anschließend vorsichtig mit dem Finger auf die Grundplatte neben einem Spiegel. Beschreibt eure Beobachtungen.

### Gangunterschied Info {.info}

:::info
Ist ein Arm des Interferometers um die Strecke Δs länger als der andere, legt das Licht in diesem Arm eine um Δs längere Strecke zurück. Δs heißt **Gangunterschied**. Der Gangunterschied trägt zusätzlich zu den Phasensprüngen an den Bauteilen zur Phasendifferenz Δφ bei. Die Phasensprünge bleiben dabei immer gleich. Der Laser eures Aufbaus emittiert Licht der Wellenlänge λ = 532 nm.
:::

### Gangunterschied in der Simulation {.werkzeug name="gangunterschied" #gu-sim}

Stellt mit dem Regler verschiedene Gangunterschiede Δs ein und beobachtet die Mitten der Interferenzmuster auf beiden Schirmen. Ermittelt

- den kleinsten Gangunterschied, bei dem die Muster auf Schirm 1 und Schirm 2 vertauscht sind,
- den kleinsten Gangunterschied größer als null, bei dem die Muster wieder so aussehen wie bei Δs = 0.

Gebt beide Werte als Bruchteil der Wellenlänge λ an.

### Gangunterschied: Ergebnis der Simulation {.luecke sperrt #gu-werte}

<!-- In der Quelle zwei Auswahlfelder mit „Prüfen“ (data-check="gang"); hier eine Lücken-Kontrollfrage der Plattform. Rückmeldung aus der Quelle. -->

Kleinster Gangunterschied, bei dem die Muster vertauscht sind: {{λ/2|λ/4|3λ/4|λ|2λ}}

Kleinster Gangunterschied größer null, bei dem die Muster wie bei Δs = 0 aussehen: {{λ|λ/4|λ/2|3λ/4|2λ}}

:::richtig
Richtig.
:::
:::falsch
Noch nicht richtig. Achtet nur auf die Mitte der Muster: Bei welchem Δs ist die Mitte von Schirm 1 zum ersten Mal dunkel?
:::

### Erklärung: Flackern und Drücken auf die Grundplatte {.frei sperrt #gu-erkl}

Die Arme eures Interferometers sind mehrere Zentimeter lang. Erklärt mithilfe eurer Ergebnisse aus der Simulation, warum die Interferenzmuster am realen Aufbau ständig flackern und warum sie sich beim Drücken auf die Grundplatte verändern.

### Gangunterschied: Kurze Kontrolle {.mc sperrt #agang}

Was verändert sich, wenn ihr auf die Grundplatte drückt?

:::antworten
- [ ] Der Phasensprung an den Spiegeln.
- [x] Der Gangunterschied zwischen den beiden Armen.
- [ ] Die Wellenlänge des Laserlichts.
- [ ] Der Phasensprung an den Strahlteilern.
:::
:::falsch
Noch nicht richtig. Ein Phasensprung hängt nur davon ab, an welchem Bauteil das Licht reflektiert wird. Was kann sich beim Drücken also verändern?
:::
