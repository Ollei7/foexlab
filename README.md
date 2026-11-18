# foeXlab · Digitales Arbeitsblatt

Experiment-Anleitungen des Schülerlabors foeXlab (Leibniz Universität Hannover) als offline-taugliche Web-App für iPads.

- Ergebnissicherung: Messtabellen mit Diagramm, Fotos, Skizzen, Antworten.
- Protokoll als PDF.
- Abholcode für Labor-iPads.
- Betrieb ohne Internet auf einem Raspberry Pi.
- Kurs: `mzi` (Mach-Zehnder-Interferometer: Laserlicht und einzelne Photonen, Kapitel 1–7 und zwei Hintergrundseiten; Änderungen gegenüber der Vorlage in `kurse/mzi/AENDERUNGEN.md`).

## Schnellstart

```bash
pip install -r requirements.txt
npm install
python3 engine/build.py --alle      # baut alle Kurse unter kurse/ nach dist/
python3 tools/devserver.py          # Test: http://localhost:8000/
```

Tests: `python3 -m pytest tests/py` und `npm test`.

Inhaltsabgleich eines Kurses gegen eine Lesefassung (Auszug als Markdown): `python3 tools/inhaltsabgleich.py <auszug.md> kurse/mzi --ausnahmen kurse/mzi/abgleich-ausnahmen.txt`.
Gegen einen Ordner mit Markdown-Quellen (`# Teil`, `## Abschnitt`), abschnittsweise: `python3 tools/inhaltsabgleich.py --quelle-md "MZI Kurs Test/Inhalte" kurse/mzi --ausnahmen kurse/mzi/abgleich-ausnahmen.txt` (Ausnahmen dort je Zeile „Datei: Abschnitt“ oder „Datei: Abschnitt | Satzanfang“, jeweils mit „ # Grund“). Exit 0: nichts fehlt; 1: Sätze fehlen; 2: falsche Eingabe.

## Ordner

| Ordner | Inhalt |
|---|---|
| `kurse/<kurs>/` | Kursinhalte: `kurs.yml`, `abschnitte/*.md`, `media/` |
| `archiv/` | Alte Kurse und ihre Tests (nicht gebaut) |
| `engine/` | Generator (Python) und Web-App (HTML/CSS/JS) |
| `server/` | Raspberry Pi: Abholdienst, Caddy, Installationsskript |
| `tools/` | Aufsteller mit QR-Codes, Testserver |
| `docs/` | Schreibweise der Kurse (`FORMAT.md`), Pi-Anleitung, Prüfliste |

## Archiv

Die früheren Kurse `michelson`, `mzifo`, `bb84` und `mzi-photonen` (in `mzi` aufgegangen) liegen mit ihren kursbezogenen Tests unter `archiv/` (`archiv/kurse/…`, `archiv/tests/…`). Sie werden weder von `engine/build.py --alle` gebaut noch von den Tests erfasst und kommen nicht auf den Pi. Texte und Bilder bleiben dort greifbar; wer einen Kurs wieder bauen will, verschiebt ihn zurück nach `kurse/`. Die Werkzeuge von `mzi-photonen` liegen inzwischen in `kurse/mzi/werkzeuge/`; vor dem Wiederbauen von dort in den Kursordner zurückkopieren.

## Lizenz

Eigene Inhalte (Aufgabentexte, Code) unter CC BY 4.0, sofern nicht anders angegeben.

Nicht unter dieser Lizenz stehen:

- **Rotis-Schrift**: Lizenz des Herstellers, nicht weitergeben. Liegt deshalb nicht im Repository (`engine/design/fonts/*.otf` steht in `.gitignore`); die Web-App nutzt Source Sans 3.
- **Logos** von foeXlab und LUH.
- **jsPDF und qrcode-generator** (`engine/web/vendor/`): MIT-Lizenz.
