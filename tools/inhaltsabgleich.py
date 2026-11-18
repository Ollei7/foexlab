#!/usr/bin/env python3
"""Prüft, ob jeder Satz einer Lesefassung (Auszug als Markdown/Text) im gebauten Kurs vorkommt.

Aufruf:  python3 tools/inhaltsabgleich.py <auszug.md> kurse/mzi [--ausnahmen kurse/mzi/abgleich-ausnahmen.txt]
Kurstext: sichtbarer Text aller Abschnitte samt Quizantworten, Rückmeldungen und Lösungen (gebautes HTML) sowie die Zeichenketten
der Werkzeuge in kurse/<kurs>/werkzeuge/*.js.
Normalisierung: Kleinschreibung; Leerraum, | ∣ ⟩ ⟨, Emoji, Anführungszeichen, Gedanken- und Bindestriche entfallen; × gilt als x; ß bleibt.
Sätze: am Satzende . ? ! getrennt, nur Sätze ab 30 Zeichen (normalisiert). Ein Satz gilt als vorhanden, wenn mindestens 90 % seiner
10-Zeichen-Schindeln im Kurstext stehen (toleriert Überschriften und Beschriftungen, die die Lesefassung an Sätze klebt).
Ausnahmen: eine Zeile je Satzanfang (mindestens 20 Zeichen normalisiert) mit „ # Grund“; Zeilen mit # am Anfang sind Kommentare.
Modus --quelle-md <ordner>: Quelle ist ein Ordner mit Markdown-Dateien (# Teil, ## Abschnitt). Jeder ##-Abschnitt wird bereinigt
(HTML-Kommentare, Markdown-Zeichen, Listenmarker, „(richtig)“, Präfixe „Bei falscher/richtiger Antwort:“ / „Nach 2 falschen Antworten:“, Lücken {{a|b}} teilen den Satz) und satzweise
wie oben gegen den Kurs geprüft. Ausnahmendatei dort: eine Zeile je Abschnitt, „Abschnitt“ oder „Datei: Abschnitt“ (Dateiname ohne .md), optional „ # Grund“.
Einzelne Absätze: „Datei: Abschnitt | Satzanfang“ (mindestens 20 Zeichen) entschuldigt nur Sätze, die so beginnen.
Exit 0: alle fehlenden Sätze stehen in den Ausnahmen; 1: es fehlen Sätze; 2: falsche Eingabe.
"""
import argparse, os, re, sys, tempfile, unicodedata
from html.parser import HTMLParser

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "engine"))

ANFUEHRUNG = set("\"'„“”‚‘’«»`´")
STRICHE = set("-‐‑‒–—―−")
MIN_SATZ, MIN_AUSNAHME = 30, 20
SCHINDEL, DECKUNG = 10, 0.90   # Ein Satz gilt als vorhanden, wenn mindestens 90 % seiner 10-Zeichen-Schindeln im Kurs stehen
ARTEFAKTE = [re.compile(r"\bFRAGE \d\b"), re.compile(r"\bFrage \d von \d\b"), re.compile(r"^[A-D]\s+(?=[A-ZÄÖÜ|])")]   # Beschriftungen der alten Website


def emoji(c):
    o = ord(c)
    return (0x1F000 <= o <= 0x1FAFF or 0x2600 <= o <= 0x27BF or 0x2B00 <= o <= 0x2BFF or o in (0xFE0F, 0x200D, 0x20E3, 0x2139))


def norm(t):
    t = unicodedata.normalize("NFC", t).lower().replace("×", "x")
    return "".join(c for c in t if not (c.isspace() or c in "|∣⟩⟨" or c in ANFUEHRUNG or c in STRICHE or emoji(c)))


class Text(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True); self.teile, self.aus = [], 0
    def handle_starttag(self, tag, attrs):
        if tag in ("script", "style"): self.aus += 1
        for k, v in attrs:
            if k == "placeholder" and v: self.teile.append(" " + v + " ")   # Platzhalter der Antwortfelder stehen auch in der Lesefassung
        self.teile.append(" ")
    def handle_endtag(self, tag):
        if tag in ("script", "style") and self.aus: self.aus -= 1
        self.teile.append(" ")
    def handle_data(self, d):
        if not self.aus: self.teile.append(d)


def js_zeichenketten(pfad):
    q = open(pfad, encoding="utf-8").read()
    out = []
    for m in re.finditer(r"'((?:\\.|[^'\\\n])*)'|\"((?:\\.|[^\"\\\n])*)\"", q):
        s = m.group(1) if m.group(1) is not None else m.group(2)
        s = re.sub(r"\\u([0-9a-fA-F]{4})", lambda x: chr(int(x.group(1), 16)), s).replace("\\n", " ").replace("\\'", "'").replace('\\"', '"')
        out.append(re.sub(r"<[^>]+>", " ", s))
    return " ".join(out)


def kurstext(kurs_dir):
    from foexlab.seite import baue
    with tempfile.TemporaryDirectory() as tmp:
        baue(kurs_dir, os.path.join(tmp, "k"), einzeldatei=False, ausgabe=lambda *_: None)
        p = Text(); p.feed(open(os.path.join(tmp, "k", "index.html"), encoding="utf-8").read())
    text = " ".join(p.teile)
    wz = os.path.join(kurs_dir, "werkzeuge")
    if os.path.isdir(wz):
        for f in sorted(os.listdir(wz)):
            if f.endswith(".js"): text += " " + js_zeichenketten(os.path.join(wz, f))
    return text


def saetze(text):
    """Absätze (durch Leerzeilen getrennt) werden einzeln zerlegt, damit Überschriften nicht am nächsten Satz kleben."""
    out = []
    for block in re.split(r"\n\s*\n", text):
        block = re.sub(r"\s+", " ", block)
        out += [s.strip() for s in re.split(r"(?<=[.?!])\s*", block) if s.strip()]
    return out


PRAEFIXE = [re.compile(r"^Bei falscher Antwort:\s*"), re.compile(r"^Bei richtiger Antwort:\s*"), re.compile(r"^Nach \d+ falschen Antworten:\s*")]


def bereinige_md(text):
    """Entfernt Kommentare, Markdown-Auszeichnung, Listenmarker, (richtig) und die Kontrollfrage-Präfixe."""
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
    zeilen = []
    for z in text.splitlines():
        z = re.sub(r"^\s*(?:[-*+]|\d+\.)\s+", "", z)
        for p in PRAEFIXE: z = p.sub("", z)
        z = re.sub(r"\(richtig\)", "", z)
        z = re.sub(r"\{\{[^}]*\}\}", "\n\n", z)   # Lückenauswahl {{richtig|falsch}}: der Satz wird an der Lücke geteilt (der Kurs zeigt alle Optionen als Auswahlliste)
        z = re.sub(r"\*\*|__|`", "", z)
        z = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", z)
        zeilen.append(z.strip())
    return "\n".join(zeilen)


def md_abschnitte(ordner):
    """[(datei, abschnitt, bereinigter text)] für jede ##-Überschrift aller .md-Dateien (sortiert)."""
    out = []
    for f in sorted(os.listdir(ordner)):
        if not f.endswith(".md"): continue
        titel, zeilen = None, []
        def abschluss():
            if titel is not None: out.append((f[:-3], titel, bereinigte(zeilen)))
        def bereinigte(zl): return bereinige_md("\n".join(zl))
        for z in open(os.path.join(ordner, f), encoding="utf-8").read().splitlines():
            m = re.match(r"^##\s+(.*\S)\s*$", z)
            if m and not z.startswith("###"):
                abschluss(); titel, zeilen = m.group(1), []
            elif re.match(r"^#\s", z): abschluss(); titel, zeilen = None, []
            elif titel is not None: zeilen.append(z)
        abschluss()
    return out


def lies_abschnitt_ausnahmen(pfad):
    """Zeilen „Abschnitt“ oder „Datei: Abschnitt“ (optional „ # Grund“); # am Zeilenanfang = Kommentar."""
    out = set()
    for zeile in open(pfad, encoding="utf-8").read().splitlines():
        z = zeile.strip()
        if not z or z.startswith("#"): continue
        z = z.partition(" # ")[0].strip()
        z, bar, anfang = z.partition(" | ")
        z = z.strip()
        if bar:
            if len(norm(anfang)) < MIN_AUSNAHME: raise ValueError(f"Satzanfang zu kurz (mindestens 20 Zeichen): {anfang.strip()}")
            datei, _, name = z.partition(": ")
            out.add((datei.strip().removesuffix(".md"), name.strip(), norm(anfang)))
            continue
        datei, sep, name = z.partition(": ")
        out.add((datei.strip().removesuffix(".md"), name.strip()) if sep and re.match(r"^[\w-]+(\.md)?$", datei.strip()) else (None, z))
    return out


def abgleich_md(ordner, kurs_dir, ausnahmen=(), deckung=None):
    """Gibt (fehlt, entschuldigt, ungenutzt) zurück; fehlt = [(datei, abschnitt, satz)], entschuldigt = [(datei, abschnitt)]."""
    ziel = norm(kurstext(kurs_dir))
    schindeln = {ziel[i:i + SCHINDEL] for i in range(len(ziel) - SCHINDEL + 1)}
    fehlt, entschuldigt, genutzt = [], [], set()
    for datei, titel, text in md_abschnitte(ordner):
        schluessel = next((k for k in ((datei, titel), (None, titel)) if k in ausnahmen), None)
        if schluessel: entschuldigt.append((datei, titel)); genutzt.add(schluessel); continue
        absaetze = [a for a in ausnahmen if len(a) == 3 and a[:2] == (datei, titel)]
        for s in saetze(text):
            n = norm(s)
            if len(n) < MIN_SATZ or vorhanden(n, ziel, schindeln, deckung): continue
            treffer = next((a for a in absaetze if n.startswith(a[2])), None)
            if treffer: genutzt.add(treffer); entschuldigt.append((datei, titel + " | " + s[:40])); continue
            fehlt.append((datei, titel, s))
    return fehlt, entschuldigt, sorted(set(ausnahmen) - genutzt, key=str)


def lies_ausnahmen(pfad):
    ausnahmen = []
    for nr, zeile in enumerate(open(pfad, encoding="utf-8").read().splitlines(), 1):
        z = zeile.strip()
        if not z or z.startswith("#"): continue
        anfang, _, grund = z.partition(" # ")
        if len(norm(anfang)) < MIN_AUSNAHME:
            raise ValueError(f"{pfad}:{nr}: Ausnahme zu kurz (mindestens 20 Zeichen): {anfang.strip()}")
        if not grund.strip(): raise ValueError(f"{pfad}:{nr}: Grund fehlt (Format: Satzanfang # Grund)")
        ausnahmen.append((norm(anfang), anfang.strip(), grund.strip()))
    return ausnahmen


def vorhanden(n, ziel, schindeln, deckung=None):
    if n in ziel: return True
    if len(n) < SCHINDEL * 2: return False
    teile = [n[i:i + SCHINDEL] for i in range(len(n) - SCHINDEL + 1)]
    return sum(1 for t in teile if t in schindeln) / len(teile) >= (DECKUNG if deckung is None else deckung)


def abgleich(auszug, kurs_dir, ausnahmen=(), deckung=None):
    ziel = norm(kurstext(kurs_dir))
    schindeln = {ziel[i:i + SCHINDEL] for i in range(len(ziel) - SCHINDEL + 1)}
    fehlt, entschuldigt, genutzt = [], [], set()
    for s in saetze(open(auszug, encoding="utf-8").read()):
        for a in ARTEFAKTE: s = a.sub("", s).strip()
        n = norm(s)
        if len(n) < MIN_SATZ or vorhanden(n, ziel, schindeln, deckung): continue
        treffer = next((a for a in ausnahmen if n.startswith(a[0])), None)
        if treffer: entschuldigt.append((s, treffer[2])); genutzt.add(treffer[0])
        else: fehlt.append(s)
    return fehlt, entschuldigt, [a for a in ausnahmen if a[0] not in genutzt]


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("auszug", help="Auszug als Markdown/Text, mit --quelle-md entfällt er")
    ap.add_argument("kurs", nargs="?"); ap.add_argument("--ausnahmen")
    ap.add_argument("--quelle-md", metavar="ORDNER", help="Quelle ist ein Ordner mit Markdown-Dateien (## Abschnitte) statt eines Auszugs")
    ap.add_argument("--deckung", type=float, help="Anteil der Schindeln, der im Kurs stehen muss (Standard 0,90); höher zeigt auch kleine Abweichungen")
    a = ap.parse_args(argv)
    if a.quelle_md:
        kurs = a.kurs or a.auszug   # mit --quelle-md steht der Kurs an erster Stelle
        if not os.path.isdir(a.quelle_md): print("Quellordner fehlt: " + a.quelle_md, file=sys.stderr); return 2
        try:
            ausn = lies_abschnitt_ausnahmen(a.ausnahmen) if a.ausnahmen else set()
        except ValueError as e:
            print(f"{a.ausnahmen}: {e}", file=sys.stderr); return 2
        fehlt, entschuldigt, ungenutzt = abgleich_md(a.quelle_md, kurs, ausn, a.deckung)
        for d, t in entschuldigt: print(f"Ausnahme: {d}: {t}")
        for d, t, s in fehlt: print(f"FEHLT [{d}: {t}]: {s}")
        for u in ungenutzt: print(f"Hinweis: Ausnahme ohne Treffer: {(u[0] + ': ') if u[0] else ''}{u[1]}")
        print(f"{len(fehlt)} Sätze fehlen, {len(entschuldigt)} Abschnitte über Ausnahmen entschuldigt.")
        return 1 if fehlt else 0
    if not a.kurs: ap.error("Kurs fehlt")
    try:
        ausn = lies_ausnahmen(a.ausnahmen) if a.ausnahmen else []
    except ValueError as e:
        print(str(e), file=sys.stderr); return 2
    fehlt, entschuldigt, ungenutzt = abgleich(a.auszug, a.kurs, ausn, a.deckung)
    for s, g in entschuldigt: print(f"Ausnahme ({g}): {s[:110]}")
    for s in fehlt: print("FEHLT: " + s)
    for _, anf, g in ungenutzt: print(f"Hinweis: Ausnahme ohne Treffer: {anf[:80]} # {g}")
    print(f"{len(fehlt)} Sätze fehlen, {len(entschuldigt)} über Ausnahmen entschuldigt.")
    return 1 if fehlt else 0


if __name__ == "__main__":
    sys.exit(main())
