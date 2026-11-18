#!/usr/bin/env python3
"""Prüft einen Kurs, bevor er veröffentlicht wird: findet alles, was eine Gruppe im Kurs stranden ließe.

Aufruf:  python3 tools/kurs_pruefen.py <kurs-id oder pfad> [--ohne-tests] [--details]
Eine Zeile je Befund („– Text (Ort)“), danach ggf. die Liste der Platzhalter, letzte Zeile genau
„bereit“ oder „noch nicht bereit (n Punkte)“. Bei „bereit“ steht davor eine Zusammenfassung (Kapitel, Karten,
Felder, Werkzeuge, Tests) und „Platzhalter: keine“ oder die Liste der Platzhalter.
Exit 0: bereit, 1: nicht bereit, 2: Einrichtungsproblem oder falsche Eingabe (Meldung auf Deutsch, nie ein Traceback).
"""
import argparse, collections, glob, importlib, json, os, re, shutil, subprocess, sys, tempfile, urllib.parse
from dataclasses import dataclass, field
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "engine"))

NODE_MODULES = os.path.join(ROOT, "node_modules")
KURS_ID = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
PAKETE = (("PIL", "Pillow"), ("markdown", "markdown"), ("yaml", "PyYAML"))
TEST_ZEITLIMIT = 300   # Sekunden je Testlauf (Node bzw. pytest)
MATHJAX_HINWEIS = "MathJax fehlt – einmal `npm install` ausführen (im Ordner foexlab). Ohne MathJax bleiben Formeln unlesbar."


WINDOWS = sys.platform.startswith("win")
PIP_BEFEHL = "py -m pip install -r requirements.txt" if WINDOWS else "python3 -m pip install -r requirements.txt"
NODE_BEFEHL = ("Befehl: brew install node" if sys.platform == "darwin" else "Bitte Node.js von https://nodejs.org installieren.")


class Pruefwerkzeugfehler(Exception):
    """Unerwarteter Fehler im Prüfwerkzeug selbst (nicht im Kurs)."""


class Eingabefehler(Exception):
    """Falsche Eingabe (Kurs nicht gefunden, ungültige Kennung): wird als Klartext gemeldet, Exit 2."""


@dataclass
class Befund:
    text: str
    ort: str


@dataclass
class Bericht:
    befunde: list = field(default_factory=list)
    platzhalter: list = field(default_factory=list)
    zusammenfassung: str = ""
    einrichtung: list = field(default_factory=list)
    rohausgabe: list = field(default_factory=list)

    @property
    def bereit(self):
        return not self.befunde and not self.einrichtung


# ---------------------------------------------------------------- Eingabe, Einrichtung

def kurs_aufloesen(arg):
    """Kurs-ID (→ kurse/<id>) oder Pfad → (Ordner, id). Wirft Eingabefehler mit Klartext."""
    ist_id = bool(KURS_ID.match(arg)) and not os.path.isdir(arg)
    ordner = os.path.join(ROOT, "kurse", arg) if ist_id else os.path.abspath(arg)
    kid = arg if ist_id else os.path.basename(os.path.normpath(ordner))
    if not os.path.isdir(ordner):
        raise Eingabefehler(f"Den Kurs „{arg}“ gibt es nicht (gesucht in {ordner}). Kurse liegen im Ordner kurse/<kurs-id>.")
    if not KURS_ID.match(kid):
        raise Eingabefehler(f"Der Ordnername „{kid}“ ist als Kurs-Kennung nicht erlaubt: nur kleine Buchstaben ohne Umlaute, Ziffern und einzelne "
                            f"Bindestriche, ohne Leerzeichen (z. B. „mein-kurs“). Die Kennung wird Teil der Internetadresse. Bitte den Ordner umbenennen.")
    if not os.path.isfile(os.path.join(ordner, "kurs.yml")) or not os.path.isdir(os.path.join(ordner, "abschnitte")):
        raise Eingabefehler(f"Im Ordner {ordner} fehlt kurs.yml oder der Ordner abschnitte – das ist kein Kurs.")
    return ordner, kid


def pruefe_einrichtung(tests=True):
    """Fehlende Werkzeuge der Umgebung, je Eintrag mit dem Befehl zur Abhilfe."""
    probleme = []
    for modul, name in PAKETE:
        try: importlib.import_module(modul)
        except ImportError:
            probleme.append(f"Das Python-Paket „{name}“ fehlt. Befehl: {PIP_BEFEHL}")
    if not shutil.which("node"):
        probleme.append(f"Node.js fehlt (wird für Formeln und Tests gebraucht). {NODE_BEFEHL}")
    if tests and not os.path.isdir(NODE_MODULES):
        probleme.append("Die Zusatzpakete für Formeln und Tests sind nicht installiert. Befehl (im Ordner foexlab): npm install")
    return probleme


# ---------------------------------------------------------------- Quelle lesen

def zeile_von(pfad, suche, ab=0):
    try: zeilen = open(pfad, encoding="utf-8").read().splitlines()
    except OSError: return 0
    for i in range(ab, len(zeilen)):
        if suche(zeilen[i]): return i + 1
    return 0


def ohne_kommentare(text):
    """HTML-Kommentare entfernen (wie die Engine), Zeilenzahl bleibt erhalten."""
    return re.sub(r"<!--.*?-->", lambda m: "\n" * m.group(0).count("\n"), text, flags=re.S)


class Modell:
    """Alles, was die Prüfungen über den Kurs wissen: Quelle (Markdown), gebautes HTML und Regeln."""

    def __init__(self, kurs_dir, kid):
        self.kurs_dir, self.id = kurs_dir, kid
        self.abschnitte = []      # Quelle in Dateireihenfolge: dict(fn, ab, fm, acts, pfad)
        self.karten_quelle = {}   # Karten-ID → (Abschnitt, act, Zeile)
        self.versteckt = set()    # Karten-IDs, die nicht ausgegeben werden
        self.ueberschriften = {}  # Titel → (Datei, Zeile) der ersten Überschrift
        self.regeln = {"abschnitte": {}, "karten": {}, "kartenregeln": {}}
        self.karten = {}          # gebaute Karten: id → dict(felder, platzhalter, knoepfe)
        self.knoepfe = {}         # Knopf-ID → Karten-ID
        self.gruppen = []         # Antwortgruppen mit richtig/falsch (Kontrollfragen, Quiz-Fragen)
        self.meldungen = []       # Rohausgabe der Engine
        self.quellfehler = []     # unlesbare Quelldateien

    # --- Quelle
    def lies_quelle(self):
        from foexlab.quelle import ids_vergeben, parse_file
        adir = os.path.join(self.kurs_dir, "abschnitte")
        for fn in sorted(os.listdir(adir)):
            if not fn.endswith(".md"): continue
            pfad = os.path.join(adir, fn)
            try:
                sec = parse_file(pfad)
                if not isinstance(sec["fm"], dict): raise ValueError("kopf")
            except UnicodeDecodeError:
                self.quellfehler.append(Befund("Die Datei ist nicht als UTF-8 gespeichert (Umlaute sind kaputt) – bitte als UTF-8 speichern", fn)); continue
            except Exception:
                self.quellfehler.append(Befund("Der Kopfbereich (zwischen den beiden ---) ist kein gültiges YAML – er muss aus Zeilen der Form „titel: Text“ bestehen", fn)); continue
            if not isinstance(sec["fm"].get("oeffnet_nach", ""), str):
                self.quellfehler.append(Befund("oeffnet_nach muss ein Text sein, z. B. „felder:kapitel/karte“", self.ort_abschnitt(dict(pfad=pfad, fn=fn)))); continue
            roh = self._rohkennungen(sec)
            ids_vergeben(sec, fn)
            sec.update(fn=fn, pfad=pfad, ab=re.sub(r"^\d+-", "", fn[:-3]), roh=roh)
            zeilen = self._zeilen(pfad, sec)
            sec["zeilen"] = zeilen
            self.abschnitte.append(sec)
            ab_versteckt = bool(sec["fm"].get("versteckt"))
            for i, a in enumerate(sec["acts"]):
                self.karten_quelle[a["id"]] = (sec, a, zeilen["acts"][i][0] if i < len(zeilen["acts"]) else 0)
                if "versteckt" in a["cls"] or ab_versteckt: self.versteckt.add(a["id"])
                self.ueberschriften.setdefault(a["title"], (fn, zeilen["acts"][i][0] if i < len(zeilen["acts"]) else 0))
                for j, q in enumerate(a["qs"]):
                    self.ueberschriften.setdefault(q["title"], (fn, zeilen["acts"][i][1][j] if i < len(zeilen["acts"]) else 0))

    @staticmethod
    def _rohkennungen(sec):
        from foexlab.quelle import slug
        karten = [a["kv"].get("id") or slug(a["title"]) for a in sec["acts"]]
        felder = [[q["kv"].get("id") or slug(q["title"]) for q in a["qs"]] for a in sec["acts"]]
        return dict(karten=karten, felder=felder)

    @staticmethod
    def _zeilen(pfad, sec):
        """Zeilennummern der ##/###-Überschriften in der Reihenfolge, in der parse_file sie einordnet."""
        from foexlab.quelle import BLOCK_START, HEAD
        text = open(pfad, encoding="utf-8").read()
        zeilen = text.splitlines()
        m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
        start = text[:m.end()].count("\n") if m else 0
        acts, inblock, cur = [], False, None
        for n in range(start, len(zeilen)):
            l = zeilen[n]
            if BLOCK_START.match(l) and not inblock: inblock = True
            elif l.strip() == ":::" and inblock: inblock = False
            h = None if inblock else HEAD.match(l)
            if h and len(h.group(1)) == 2: cur = (n + 1, []); acts.append(cur)
            elif h and cur is not None: cur[1].append(n + 1)
        return dict(acts=acts, front=start)

    def kapitel(self, sec):
        nr, titel = str(sec["fm"].get("nr", "")).strip(), sec["fm"].get("titel", sec["ab"])
        return f"Kapitel {nr} „{titel}“" if nr else f"Kapitel „{titel}“"

    def sec_von(self, ab):
        return next((s for s in self.abschnitte if s["ab"] == ab), None)

    def ort_abschnitt(self, sec, schluessel="oeffnet_nach"):
        z = zeile_von(sec["pfad"], lambda l: l.startswith(schluessel + ":"), 0) or 1
        return f"{sec['fn']}:{z}"

    def ort_karte(self, kid):
        eintrag = self.karten_quelle.get(kid)
        return f"{eintrag[0]['fn']}:{eintrag[2]}" if eintrag else f"Karte {kid}"

    def ort_feld(self, feld_id):
        kid = feld_id.rsplit("/", 1)[0]
        eintrag = self.karten_quelle.get(kid)
        if not eintrag: return f"Feld {feld_id}"
        sec, a, z = eintrag
        i = sec["acts"].index(a)
        for j, q in enumerate(a["qs"]):
            if q["id"] == feld_id and i < len(sec["zeilen"]["acts"]): return f"{sec['fn']}:{sec['zeilen']['acts'][i][1][j]}"
        return f"{sec['fn']}:{z}"

    def ort_titel(self, titel):
        if titel in self.ueberschriften:
            fn, z = self.ueberschriften[titel]
            return f"{fn}:{z}"
        return "Kurs"


class Seite(HTMLParser):
    """Liest aus dem gebauten HTML: Karten, Felder, Platzhalter, Knöpfe und Antwortgruppen."""

    def __init__(self, modell):
        super().__init__(convert_charrefs=True)
        self.m, self.karte, self.gruppe, self.plat = modell, None, None, None

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        klassen = (a.get("class") or "").split()
        if tag == "section" and a.get("data-karte"):
            self.karte, self.gruppe = a["data-karte"], None
            self.m.karten[self.karte] = dict(felder=[], platzhalter=[], knoepfe=[])
        if self.karte is None: return
        k = self.m.karten[self.karte]
        if a.get("data-fx-id") is not None:
            f = dict(id=a["data-fx-id"], art=a.get("data-fx-art", ""), titel=a.get("data-fx-titel", ""), optional=a.get("data-fx-optional") == "1")
            k["felder"].append(f)
            self.gruppe = None
            if a.get("data-fx-kontrolle") == "1":
                self.gruppe = dict(feld=f["id"], titel=f["titel"], serie=False, mc=False, werte=[]); self.m.gruppen.append(self.gruppe)
        if "fx-quizfrage" in klassen:
            n = sum(1 for g in self.m.gruppen if g["serie"] and g["feld"] == k["felder"][-1]["id"]) + 1 if k["felder"] else 1
            self.gruppe = dict(feld=k["felder"][-1]["id"] if k["felder"] else "", titel=f"Frage {n}", serie=True, mc=True, werte=[]); self.m.gruppen.append(self.gruppe)
        if a.get("data-type") == "mc" and self.gruppe is not None: self.gruppe["mc"] = True
        if a.get("data-fx-platzhalter") == "1": self.plat = ""
        if tag == "span" and "qname" in klassen and self.plat == "": self.plat = None; self._lese_plat = True
        if a.get("data-knopf-id"):
            k["knoepfe"].append(a["data-knopf-id"]); self.m.knoepfe.setdefault(a["data-knopf-id"], self.karte)
        if tag == "input" and a.get("data-f") is not None and self.gruppe is not None:
            try: self.gruppe["werte"].append(float(a["data-f"]))
            except ValueError: pass

    _lese_plat = False

    def handle_data(self, d):
        if self._lese_plat and self.karte:
            self.m.karten[self.karte]["platzhalter"].append(d.strip()); self._lese_plat = False


def baue_und_lese(m, tmp):
    """Baut den Kurs in tmp, liest HTML und Regeln in das Modell. Gibt die Engine-Warnungen zurück."""
    from foexlab.seite import baue
    ziel = os.path.join(tmp, m.id)
    baue(m.kurs_dir, ziel, ausgabe=m.meldungen.append)
    html = open(os.path.join(ziel, "index.html"), encoding="utf-8").read()
    r = re.search(r'<script type="application/json" id="fx-regeln">(.*?)</script>', html, re.S)
    if r: m.regeln = json.loads(r.group(1).replace("<\\/", "</"))
    Seite(m).feed(html)
    return [x[len("WARNUNG: "):] for x in m.meldungen if x.startswith("WARNUNG: ")]


# ---------------------------------------------------------------- Prüfungen (je eine Funktion)

MATHJAX = re.compile(r"^(Formeln:|\d+ Formel\(n\) bleiben als TeX)")
BEREITS_GEPRUEFT = re.compile(r"^(Datei fehlt:|Werkzeug ‚|Bild \S+ fehlt$|.*: Vorlage \S+ fehlt$)")   # prüft kurs_pruefen genauer (mit Zeile) selbst


def pruefe_warnungen(m, warnungen, einrichtung):
    """Engine-Warnungen → Befunde (mit Datei); Formel-Warnungen sind Einrichtungsprobleme."""
    out = []
    for w in warnungen:
        if MATHJAX.match(w):
            if MATHJAX_HINWEIS not in einrichtung: einrichtung.append(MATHJAX_HINWEIS)
        elif not BEREITS_GEPRUEFT.match(w):
            out.append(Befund(w, m.ort_titel(w.split(": ", 1)[0]) if ": " in w else "Kurs"))
    return out


def _bedingung(m, bed):
    """(art, ziel) oder None."""
    art, _, ziel = (bed or "").partition(":")
    return (art, ziel.strip()) if art in ("felder", "quiz", "knopf") and ziel.strip() else None


def _bedingung_pruefen(m, bed, wer, ort):
    """Prüft eine Bedingung. Gibt (Befund oder None, Knoten-Karte oder None) zurück."""
    b = _bedingung(m, bed)
    if not b:
        return Befund(f"{wer} hat die Bedingung „{bed}“, die es nicht gibt (erlaubt: felder:<kapitel>/<karte>, quiz:<kapitel>/<karte>, knopf:<id>) – die Gruppe käme nie weiter", ort), None
    art, ziel = b
    if art == "knopf":
        if ziel in m.knoepfe: return None, m.knoepfe[ziel]
        return Befund(f"{wer} wartet auf den Knopf „{ziel}“, aber diesen Knopf gibt es nicht (oder er steht in einer versteckten Karte) – die Gruppe käme nie weiter", ort), None
    if ziel in m.versteckt:
        return Befund(f"{wer} wartet auf „{art}:{ziel}“ – das ist eine versteckte Karte, die niemand sieht – die Gruppe käme nie weiter", ort), None
    if ziel not in m.karten:
        hinweis = " (Das ist ein Kapitel; gebraucht wird <kapitel>/<karte>.)" if ziel in m.regeln["abschnitte"] else ""
        return Befund(f"{wer} wartet auf „{art}:{ziel}“, aber diese Karte gibt es nicht{hinweis} – die Gruppe käme nie weiter", ort), None
    k = m.karten[ziel]
    if art == "felder":
        if not [f for f in k["felder"] if not f["optional"]]:
            was = " (dort steht nur ein Platzhalter)" if k["platzhalter"] else ""
            if k["platzhalter"] or not k["felder"]:
                return Befund(f"{wer} zeigt auf „{ziel}“ – eine Karte ohne Aufgaben{was}. Die Bedingung öffnet sich sofort und wirkt nicht; gemeint war wohl eine Karte mit Aufgaben", ort), None
            return Befund(f"{wer} zeigt auf „{ziel}“, dort sind alle Aufgaben optional. Die Bedingung öffnet sich sofort und wirkt nicht", ort), None
    else:
        if not [f for f in k["felder"] if f["art"] == "quizserie"]:
            return Befund(f"{wer} wartet auf das Quiz „{ziel}“, aber diese Karte enthält keine Quiz-Serie – die Gruppe käme nie weiter", ort), None
    return None, ziel


def pruefe_freischaltung(m):
    """Bedingungen: Ziele vorhanden und erfüllbar, Kapitel 1 frei, keine Kreise."""
    out, deps = [], collections.defaultdict(list)
    erstes = m.abschnitte[0] if m.abschnitte else None
    for sec in m.abschnitte:
        ab, fm = sec["ab"], sec["fm"]
        if fm.get("versteckt"): continue
        nachschlagen = bool(fm.get("nachschlagen"))   # Nachschlageseiten sind immer offen: nur die Bedingung des Kapitels entfällt
        regel = m.regeln["abschnitte"].get(ab, {})
        wer = m.kapitel(sec)
        if regel.get("oeffnet_nach") and not nachschlagen:
            if sec is erstes:
                out.append(Befund(f"{wer} ist das erste Kapitel und hat eine Bedingung („{regel['oeffnet_nach']}“) – dann käme keine Gruppe je hinein", m.ort_abschnitt(sec)))
            f, ziel = _bedingung_pruefen(m, regel["oeffnet_nach"], wer, m.ort_abschnitt(sec))
            if f: out.append(f)
            elif ziel: deps[("S", ab)].append(("K", ziel))
        vorher = []
        for a in sec["acts"]:
            kid = a["id"]
            if kid in m.versteckt: continue
            kr = m.regeln["kartenregeln"].get(kid)
            if kr:
                kwer = f"Die Karte „{a['title']}“ ({wer})"
                f, ziel = _bedingung_pruefen(m, kr["oeffnet_nach"], kwer, m.ort_karte(kid))
                if f: out.append(f)
                elif ziel: vorher.append(("K", ziel))
            deps[("K", kid)] = [("S", ab)] + list(vorher)
        for a in sec["acts"]:
            ziel = a["kv"].get("oeffnet")
            if "quiz" in a["cls"] and ziel and ziel not in m.regeln["abschnitte"] and ziel not in m.karten:
                out.append(Befund(f"Das Quiz „{a['title']}“ soll „{ziel}“ öffnen, aber so ein Kapitel oder eine Karte gibt es nicht", m.ort_karte(a["id"])))
            for q in a["qs"]:
                ziel = q["kv"].get("oeffnet")
                if "knopf" in q["cls"] and ziel and ziel not in m.regeln["abschnitte"] and ziel not in m.karten:
                    out.append(Befund(f"Der Knopf „{q['title']}“ soll „{ziel}“ öffnen, aber so ein Kapitel oder eine Karte gibt es nicht", m.ort_feld(q["id"])))
    out += _kreise(m, deps)
    return out


def _kreise(m, deps):
    out, farbe, gemeldet = [], {}, set()
    def name(n):
        sec = m.sec_von(n[1]) if n[0] == "S" else m.karten_quelle.get(n[1], (None,))[0]
        return m.kapitel(sec) if sec else n[1]
    def gehe(n, pfad):
        farbe[n] = 1
        for d in deps.get(n, []):
            if farbe.get(d) == 1:
                kreis = pfad[pfad.index(d):] if d in pfad else [d]
                schluessel = frozenset(kreis)
                if schluessel not in gemeldet:
                    gemeldet.add(schluessel)
                    namen = list(dict.fromkeys(name(x) for x in kreis))
                    sec = m.sec_von(kreis[0][1]) if kreis[0][0] == "S" else m.karten_quelle.get(kreis[0][1], (None,))[0]
                    folge = " → ".join(namen + [namen[0]]) if len(namen) > 1 else namen[0] + " wartet auf sich selbst"
                    out.append(Befund(f"Die Freischaltungen bilden einen Kreis: {folge}. Jedes wartet auf das andere – die Gruppe käme nie weiter", m.ort_abschnitt(sec) if sec else "Kurs"))
            elif d not in farbe:
                gehe(d, pfad + [d])
        farbe[n] = 2
    for n in list(deps):
        if n not in farbe: gehe(n, [n])
    return out


def pruefe_kontrollfragen(m):
    """Fragen, die sperren oder ein Quiz tragen, brauchen mindestens eine richtige Antwort."""
    out = []
    for g in m.gruppen:
        if g["mc"] and not any(w > 0 for w in g["werte"]):
            leer = " (es gibt gar keine Antworten)" if not g["werte"] else ""
            if g["serie"]:
                kid = g["feld"].rsplit("/", 1)[0]
                out.append(Befund(f"{g['titel']} der Quiz-Serie „{m.karten_quelle[kid][1]['title'] if kid in m.karten_quelle else kid}“ hat keine richtige Antwort{leer} – das Quiz ließe sich nie bestehen", m.ort_karte(kid)))
            else:
                out.append(Befund(f"Die Frage „{g['titel']}“ sperrt die folgenden Aufgaben, hat aber keine richtige Antwort{leer} ([x] fehlt) – die Gruppe käme nie weiter", m.ort_feld(g["feld"])))
    return out


def pruefe_eindeutigkeit(m):
    """Kennungen (#id) je Abschnitt bzw. Karte eindeutig; Karten- und Feldtitel im ganzen Kurs eindeutig."""
    out = []
    for sec in m.abschnitte:
        roh = sec["roh"]
        for kennung, n in collections.Counter(roh["karten"]).items():
            if n > 1:
                out.append(Befund(f"Zwei Karten haben dieselbe Kennung „{kennung}“ ({n}-mal im selben Kapitel) – die Speicherstände würden sich vermischen", f"{sec['fn']}"))
        for i, felder in enumerate(roh["felder"]):
            for kennung, n in collections.Counter(felder).items():
                if n > 1:
                    karte = sec["acts"][i]
                    z = sec["zeilen"]["acts"][i][0] if i < len(sec["zeilen"]["acts"]) else 0
                    out.append(Befund(f"Zwei Aufgaben der Karte „{karte['title']}“ haben dieselbe Kennung „{kennung}“ – die Antworten würden sich überschreiben", f"{sec['fn']}:{z}"))
    karten = collections.defaultdict(list)   # Kartentitel müssen nur innerhalb eines Kapitels eindeutig sein (das Kapitel unterscheidet sie sonst)
    felder = collections.defaultdict(list)
    for sec in m.abschnitte:
        for a in sec["acts"]:
            if a["id"] in m.versteckt: continue
            karten[(sec["ab"], a["title"])].append(a["id"])
    for kid, k in m.karten.items():
        for f in k["felder"]: felder[f["titel"]].append(f["id"])
    for (_, titel), ids in karten.items():
        if len(ids) > 1:
            out.append(Befund(f"Der Titel „{titel}“ kommt bei {len(ids)} Karten desselben Kapitels vor ({', '.join(ids)}) – Karten brauchen eigene Titel", m.ort_karte(ids[0])))
    for titel, ids in felder.items():
        if len(ids) > 1:
            out.append(Befund(f"Der Titel „{titel}“ kommt bei {len(ids)} Aufgaben vor ({', '.join(ids)}) – im Protokoll wären sie nicht zu unterscheiden. Titel eindeutig machen (z. B. mit dem Aufbau davor)", m.ort_feld(ids[0])))
    return out


def pruefe_werkzeuge(m, tests_dir=None):
    """Jedes benutzte Werkzeug hat seine Datei; jede Werkzeugdatei wird in tests/js/<kurs>/ erwähnt."""
    from foexlab.bausteine import werkzeug_module
    out = []
    vorhanden = werkzeug_module(m.kurs_dir)
    for sec in m.abschnitte:
        for a in sec["acts"]:
            for q in a["qs"]:
                if "werkzeug" in q["cls"]:
                    name = q["kv"].get("name", "")
                    if name not in vorhanden:
                        out.append(Befund(f"Das Werkzeug „{name}“ wird benutzt, aber die Datei werkzeuge/{name}.js fehlt", m.ort_feld(q["id"])))
    ordner = os.path.join(m.kurs_dir, "werkzeuge")
    tests_dir = tests_dir or tests_ordner(m.kurs_dir, m.id)[0]
    inhalt = ""
    if os.path.isdir(tests_dir):
        for wurzel, _, dateien in os.walk(tests_dir):
            for f in dateien:
                try: inhalt += open(os.path.join(wurzel, f), encoding="utf-8").read() + "\n"
                except (OSError, UnicodeDecodeError): pass
    if os.path.isdir(ordner):
        for f in sorted(os.listdir(ordner)):
            stem = f[:-3]
            if f.endswith(".js") and not (f"werkzeuge/{stem}.js" in inhalt or f"'{stem}'" in inhalt or f'"{stem}"' in inhalt):
                out.append(Befund(f"Das Werkzeug werkzeuge/{f} hat keinen Test – es fehlt eine Datei in tests/js/{m.id}/, die „werkzeuge/{f}“ lädt oder „{f[:-3]}“ (in Anführungszeichen) benennt", f"werkzeuge/{f}"))
    return out


MEDIEN_REGELN = (
    ("bild", re.compile(r"!\[[^\]]*\]\(\s*<?([^)\s>]+)")),
    ("bild", re.compile(r"<(?:img|source|video|audio)\b[^>]*?\bsrc=\"([^\"]+)\"", re.I)),
    ("datei", re.compile(r"\]\(\s*(media/[^)\s]+)")),
    ("datei", re.compile(r"\bhref=\"(media/[^\"]+)\"")),
    ("bild", re.compile(r"\bposter=\"([^\"]+)\"")),
    ("medien", re.compile(r"\bbild=\"([^\"]+)\"")),
)
# bild="…" liest die Engine je Baustein anders: Bildzuordnung relativ zu media/ (fragen.py), Skizze relativ zum Kursordner (bausteine.py)
SKIZZE = re.compile(r"\{[^}]*\.skizze\b")
BILDZUORDNUNG = re.compile(r"\{[^}]*\.bildzuordnung\b")
EXTERN = re.compile(r"^(?:[a-z][a-z0-9+.-]*:|#|//)", re.I)


# ---------------------------------------------------------------- Tests des Kurses

def tests_ordner(kurs_dir, kid):
    """(JS-Ordner, Ordner der Python-Tests, Dateimuster dort) der Kurstests.
    Kurse in kurse/ haben ihre Tests im Repository (tests/js/<kurs>/, tests/py/test_<kurs>*.py);
    ein Kurs außerhalb davon bringt sie in <Kursordner>/tests/ mit."""
    if os.path.dirname(os.path.normpath(kurs_dir)) == os.path.join(ROOT, "kurse"):
        return (os.path.join(ROOT, "tests", "js", kid), os.path.join(ROOT, "tests", "py"), f"test_{kid.replace('-', '_')}*.py")
    return (os.path.join(kurs_dir, "tests", "js"), os.path.join(kurs_dir, "tests", "py"), "test_*.py")


def _tap_fehler(text):
    """Namen der fehlgeschlagenen Einzeltests aus der TAP-Ausgabe von node --test (ohne übergeordnete Gruppen)."""
    offen = []   # (Einrückung, Name)
    for zeile in text.splitlines():
        t = re.match(r"^(\s*)not ok \d+ - (.*?)(?:\s+#.*)?$", zeile)
        if not t: continue
        tiefe, name = len(t.group(1)), t.group(2).strip()
        kinder = [o for o in offen if o[0] > tiefe]
        offen = [o for o in offen if o[0] <= tiefe]
        if not kinder: offen.append((tiefe, name))
    return [n for _, n in offen]


def _lauf(befehl):
    """Startet einen Testlauf im Repository-Ordner; (Ausgabe, Rückgabecode) oder None bei Zeitüberschreitung."""
    try:
        r = subprocess.run(befehl, cwd=ROOT, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=TEST_ZEITLIMIT)
    except subprocess.TimeoutExpired:
        return None
    return (r.stdout or "") + (r.stderr or ""), r.returncode


def pruefe_kurstests(m, zaehler=None):
    """Führt nur die Tests dieses Kurses aus. → (Befunde, Rohausgabe); zaehler (Liste) bekommt die Zahl bestandener Tests."""
    js, py_ordner, py_muster = tests_ordner(m.kurs_dir, m.id)
    out, roh = [], []
    if zaehler is None: zaehler = []
    js_dateien = sorted(glob.glob(os.path.join(glob.escape(js), "*.test.js"))) if os.path.isdir(js) else []
    py_dateien = sorted(glob.glob(os.path.join(glob.escape(py_ordner), py_muster)))
    zu_lang = lambda art: Befund(f"Tests brauchen zu lange: die {art}-Tests laufen länger als {TEST_ZEITLIMIT} Sekunden – vermutlich hängt ein Test oder läuft endlos", "Tests")
    if js_dateien:
        erg = _lauf(["node", "--test", "--test-reporter=tap"] + js_dateien)
        if erg is None: out.append(zu_lang("JavaScript"))
        else:
            text, code = erg
            roh.append("Kurstests (JavaScript):"); roh += ["  " + z for z in text.splitlines()]
            zaehler += [int(z) for z in re.findall(r"^# pass (\d+)$", text, re.M)]
            namen = _tap_fehler(text)
            for n in namen: out.append(Befund(f"Test ‚{n}‘ schlägt fehl", "Tests"))
            if code != 0 and not namen:
                out.append(Befund("Die JavaScript-Tests des Kurses sind fehlgeschlagen (Einzelheiten mit --details)", "Tests"))
    if py_dateien:
        erg = _lauf([sys.executable, "-m", "pytest", "-q", "--tb=short", "-rfE", "-p", "no:cacheprovider"] + py_dateien)
        if erg is None: out.append(zu_lang("Python"))
        else:
            text, code = erg
            roh.append("Kurstests (Python):"); roh += ["  " + z for z in text.splitlines()]
            zaehler += [int(z) for z in re.findall(r"\b(\d+) passed\b", text)[-1:]]
            namen = []
            for z in text.splitlines():
                t = re.match(r"^(?:FAILED|ERROR) \S+?::(\S+)", z) or re.match(r"^ERROR (\S+?\.py)\b", z)
                if t: namen.append(os.path.basename(t.group(1)))
            for n in dict.fromkeys(namen): out.append(Befund(f"Test ‚{n}‘ schlägt fehl", "Tests"))
            if code not in (0, 5) and not namen:
                out.append(Befund("Die Python-Tests des Kurses sind fehlgeschlagen (Einzelheiten mit --details)", "Tests"))
    return out, roh


def pruefe_medien(m):
    """Jeder Verweis auf media/… zeigt auf eine vorhandene Datei; Bilder liegen in media/."""
    out, gesehen = [], set()
    for sec in m.abschnitte:
        text = ohne_kommentare(open(sec["pfad"], encoding="utf-8").read())
        dateien_block = False
        for n, zeile in enumerate(text.splitlines(), 1):
            funde = []
            for art, rx in MEDIEN_REGELN:
                for t in rx.finditer(zeile): funde.append((art, t.group(1)))
            if re.match(r"^:::\s*dateien\b", zeile): dateien_block = True
            elif zeile.strip() == ":::": dateien_block = False
            elif dateien_block and zeile.strip(): funde.append(("datei", zeile.strip()))
            for art, pfad in funde:
                if EXTERN.match(pfad): continue
                rel = urllib.parse.unquote(pfad)
                if art == "medien":
                    if SKIZZE.search(zeile): art = "bild"            # Vorlagenbild: Pfad wie geschrieben (media/…)
                    elif BILDZUORDNUNG.search(zeile): rel = "media/" + rel
                    else: continue                                   # andere Bausteine lesen bild= nicht
                ort = f"{sec['fn']}:{n}"
                if (rel, ort) in gesehen: continue
                gesehen.add((rel, ort))
                if not rel.startswith("media/"):
                    if art == "bild":
                        out.append(Befund(f"Das Bild „{pfad}“ liegt nicht im Ordner media – dort müssen alle Bilder und Videos liegen und so eingebunden werden (media/{os.path.basename(rel)})", ort))
                elif not os.path.isfile(os.path.join(m.kurs_dir, rel)):
                    out.append(Befund(f"Die Datei „{rel}“ fehlt im Kursordner", ort))
    return out


def pruefe_kursdatei(m):
    """kurs.yml: lesbar, Kennung gültig und gleich dem Ordnernamen."""
    import yaml
    try:
        kurs = yaml.safe_load(open(os.path.join(m.kurs_dir, "kurs.yml"), encoding="utf-8")) or {}
        if not isinstance(kurs, dict): raise ValueError
    except (yaml.YAMLError, ValueError, UnicodeDecodeError):
        return [Befund("kurs.yml lässt sich nicht lesen – sie muss aus Zeilen der Form „titel: Text“ bestehen (als UTF-8 gespeichert)", "kurs.yml")]
    out = []
    if not kurs.get("titel"): out.append(Befund("In kurs.yml fehlt der Titel (titel: …)", "kurs.yml"))
    kid = kurs.get("id")
    if kid is not None and str(kid) != m.id:
        out.append(Befund(f"Die Kennung in kurs.yml („{kid}“) weicht vom Ordnernamen („{m.id}“) ab – beide müssen gleich sein", "kurs.yml"))
    return out


def pruefe_leer(m):
    """Ein Kurs ohne Karten wäre eine leere Seite."""
    if m.karten: return []
    return [Befund("Der Kurs hat keine Karten – im Ordner abschnitte muss mindestens eine .md-Datei mit einer ##-Überschrift stehen", "abschnitte")]


def zusammenfassung(m, tests):
    """Eine Zeile: was der Kurs enthält und wie viele Tests liefen (tests: Zahl bestandener Tests oder None = nicht ausgeführt)."""
    def anzahl(n, eins, mehr): return f"{n} {eins if n == 1 else mehr}"
    werkzeuge = {q["kv"].get("name", "") for sec in m.abschnitte for a in sec["acts"] for q in a["qs"] if "werkzeug" in q["cls"]}
    felder = sum(len(k["felder"]) for k in m.karten.values())
    t = "Tests nicht ausgeführt (--ohne-tests)" if tests is None else (anzahl(tests, "Test", "Tests") + " bestanden" if tests else "keine Tests")
    return (f"Kurs: {anzahl(len(m.abschnitte), 'Kapitel', 'Kapitel')}, {anzahl(len(m.karten), 'Karte', 'Karten')}, "
            f"{anzahl(felder, 'Feld', 'Felder')}, {anzahl(len(werkzeuge), 'Werkzeug', 'Werkzeuge')}, {t}")


def platzhalter_liste(m):
    out = []
    for kid, k in m.karten.items():
        for titel in k["platzhalter"]: out.append(f"{titel} ({m.ort_karte(kid)})")
    return out


# ---------------------------------------------------------------- Zusammenstellung

def pruefe(kurs_dir, tests=True):
    """Prüft einen Kurs. kurs_dir: Kurs-ID oder Pfad. Wirft Eingabefehler bei falscher Eingabe."""
    kurs_dir, kid = kurs_aufloesen(kurs_dir)
    b = Bericht(einrichtung=pruefe_einrichtung(tests))
    if b.einrichtung: return b
    m = Modell(kurs_dir, kid)
    try:
        b.befunde += pruefe_kursdatei(m)
        if b.befunde: return b
        m.lies_quelle()
        if m.quellfehler:
            b.befunde += m.quellfehler
            return b
        if not m.abschnitte:
            b.befunde += pruefe_leer(m)
            return b
        try:
            with tempfile.TemporaryDirectory(prefix="kurs_pruefen_") as tmp:
                warnungen = baue_und_lese(m, tmp)
        except Exception as e:   # kaputte Quelle, die die Engine nicht baut – nie ein Traceback für Autoren
            b.rohausgabe = [f"{type(e).__name__}: {e}"]
            b.befunde.append(Befund("Der Kurs lässt sich nicht bauen (technischer Grund mit --details); bitte Kopfbereiche und Überschriften prüfen", "Kurs"))
            return b
        b.rohausgabe = list(m.meldungen)
        b.befunde += pruefe_warnungen(m, warnungen, b.einrichtung)
        for check in (pruefe_leer, pruefe_freischaltung, pruefe_kontrollfragen, pruefe_eindeutigkeit, pruefe_werkzeuge, pruefe_medien):
            b.befunde += check(m)
        b.platzhalter = platzhalter_liste(m)
        zaehler = None
        if tests:
            zaehler = []
            fehler, roh = pruefe_kurstests(m, zaehler)
            b.befunde += fehler
            b.rohausgabe += roh
        b.zusammenfassung = zusammenfassung(m, None if zaehler is None else sum(zaehler))
    except Exception as e:
        raise Pruefwerkzeugfehler(f"Beim Prüfen von {kurs_dir} ist im Prüfwerkzeug selbst etwas schiefgegangen ({type(e).__name__}: {e}). Bitte melden") from e
    return b


def ausgeben(b, details=False, ausgabe=print):
    if details:
        ausgabe("Engine-Ausgabe:")
        for z in b.rohausgabe: ausgabe("  " + z)
    if b.einrichtung:
        ausgabe("Die Umgebung ist noch nicht eingerichtet:")
        for e in b.einrichtung: ausgabe(f"– {e}")
        ausgabe("Bitte erst einrichten, dann noch einmal prüfen.")
        return
    for f in b.befunde: ausgabe(f"– {f.text} ({f.ort})")
    if b.bereit and b.zusammenfassung:
        ausgabe(b.zusammenfassung)
        if not b.platzhalter: ausgabe("Platzhalter: keine")
    if b.platzhalter:
        ausgabe("Platzhalter (noch zu bauen):")
        for p in b.platzhalter: ausgabe(f"– {p}")
    n = len(b.befunde)
    ausgabe("bereit" if b.bereit else f"noch nicht bereit ({n} {'Punkt' if n == 1 else 'Punkte'})")


def main(argv=None):
    ap = argparse.ArgumentParser(description="Prüft einen foeXlab-Kurs vor dem Veröffentlichen.")
    ap.add_argument("kurs", help="Kurs-Kennung (kurse/<kennung>) oder Pfad zum Kursordner")
    ap.add_argument("--ohne-tests", action="store_true", help="Tests des Kurses nicht ausführen")
    ap.add_argument("--details", action="store_true", help="auch die Rohausgabe des Bauens zeigen")
    args = ap.parse_args(argv)
    for strom in (sys.stdout, sys.stderr):
        try: strom.reconfigure(errors="replace")
        except Exception: pass
    try:
        b = pruefe(args.kurs, tests=not args.ohne_tests)
        ausgeben(b, args.details)
    except (Eingabefehler, Pruefwerkzeugfehler) as e:
        print(str(e)); return 2
    except Exception as e:
        print(f"Beim Prüfen ist etwas Unerwartetes schiefgegangen ({type(e).__name__}). Bitte die Betreuung des foeXlab informieren."); return 2
    return 2 if b.einrichtung else (0 if b.bereit else 1)


if __name__ == "__main__":
    sys.exit(main())
