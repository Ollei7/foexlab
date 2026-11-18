"""Markdown-Kursquellen parsen (Syntax siehe docs/FORMAT.md)."""
import html, re

import yaml

HEAD = re.compile(r"^(#{2,3})\s+(.*?)\s*(?:\{([^{}]*)\})?\s*$")
UMLAUTE = {"ä": "ae", "ö": "oe", "ü": "ue", "ß": "ss", "Ä": "ae", "Ö": "oe", "Ü": "ue"}


def slug(text):
    t = "".join(UMLAUTE.get(c, c) for c in (text or "")).lower()
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return t[:40].strip("-") or "x"


def parse_attrs(s):
    cls, kv = [], {}
    for m in re.finditer(r'\.([\w-]+)|([\w-]+)="([^"]*)"|#([\w-]+)|([\w-]+)', s or ""):
        if m.group(1): cls.append(m.group(1))
        elif m.group(2): kv[m.group(2)] = m.group(3)
        elif m.group(4): kv["id"] = m.group(4)
        elif m.group(5): cls.append(m.group(5))   # Schalter ohne Punkt, z. B. {.vermutung sperrt}
    return cls, kv


MEHRFACH = ("tipp",)
INLINE = ("info", "merksatz", "mehr", "lehrkraft")   # Kästen bleiben an ihrer Stelle im Text (HTML mit markdown="1")
MIT_TITEL = ("ansicht",)                # ::: name Titel, mehrfach: Liste aus (Titel, Inhalt)
BLOCK_START = re.compile(r"^:::\s*([\wäöüß-]+)(?:[ \t]+(.+?))?\s*$")


def kasten(name, titel, inhalt):
    if name == "mehr":
        kopf = f'<details class="fx-mehr" markdown="1"><summary>{html.escape(titel or "Mehr")}</summary>'
        return ["", kopf, ""] + inhalt + ["", "</details>", ""]
    if name == "lehrkraft":   # nur im Betreuungsmodus sichtbar (CSS), nie im Protokoll
        return ["", '<div class="fx-lehrkraft" markdown="1">', ""] + inhalt + ["", "</div>", ""]
    return ["", f'<aside class="fx-{name}" markdown="1">', ""] + inhalt + ["", "</aside>", ""]


def split_blocks(lines):
    """Text ohne Direktiven + dict name -> Inhalt; mehrfache Blöcke (tipp) als Liste.
    Info-, Merksatz- und Mehr-Kästen bleiben als HTML im Text, Ansichten (::: ansicht Titel) kommen als (Titel, Inhalt)."""
    text, blocks, cur, name, titel = [], {}, None, None, None
    for l in lines:
        m = BLOCK_START.match(l)
        if cur is None and m: name, titel, cur = m.group(1), m.group(2), []
        elif cur is not None and l.strip() == ":::":
            inhalt = "\n".join(cur).strip("\n")
            if name in INLINE: text.extend(kasten(name, titel, cur))
            elif name in MIT_TITEL: blocks.setdefault(name, []).append((titel or "", inhalt))
            elif name in MEHRFACH: blocks.setdefault(name, []).append(inhalt)
            else: blocks[name] = inhalt
            cur = None
        elif cur is not None: cur.append(l)
        else: text.append(l)
    return "\n".join(text).strip(), blocks


def parse_file(path):
    src = open(path, encoding="utf-8").read()
    fm = {}
    m = re.match(r"^---\n(.*?)\n---\n", src, re.S)
    if m: fm = yaml.safe_load(m.group(1)) or {}; src = src[m.end():]
    sec = dict(fm=fm, summary=[], acts=[])
    cur_act = cur_q = None
    inblock = False
    for l in src.splitlines():
        if BLOCK_START.match(l) and not inblock: inblock = True
        elif l.strip() == ":::" and inblock: inblock = False
        h = None if inblock else HEAD.match(l)
        if h and len(h.group(1)) == 2:
            cls, kv = parse_attrs(h.group(3))
            cur_act = dict(title=h.group(2), cls=cls, kv=kv, intro=[], qs=[]); sec["acts"].append(cur_act); cur_q = None
        elif h and cur_act is not None:
            cls, kv = parse_attrs(h.group(3))
            cur_q = dict(title=h.group(2), cls=cls, kv=kv, lines=[]); cur_act["qs"].append(cur_q)
        elif cur_q is not None: cur_q["lines"].append(l)
        elif cur_act is not None: cur_act["intro"].append(l)
        else: sec["summary"].append(l)
    return sec


def _eindeutig(basis, vergeben):
    k, n = basis, 2
    while k in vergeben:
        k = f"{basis}-{n}"; n += 1
    vergeben.add(k)
    return k


def ids_vergeben(sec, dateiname):
    """Setzt act["id"] = <abschnitt>/<karte> und q["id"] = <abschnitt>/<karte>/<feld>.

    Abschnitt: Dateiname ohne Nummer und .md; Karte/Feld: Slug der Überschrift oder eigene Kennung {#id}.
    Doppelte Namen bekommen -2, -3 …
    """
    ab = re.sub(r"^\d+-", "", dateiname[:-3] if dateiname.endswith(".md") else dateiname)
    karten = set()
    for a in sec["acts"]:
        a["id"] = ab + "/" + _eindeutig(a["kv"].get("id") or slug(a["title"]), karten)
        felder = set()
        for q in a["qs"]:
            q["id"] = a["id"] + "/" + _eindeutig(q["kv"].get("id") or slug(q["title"]), felder)
    return sec
