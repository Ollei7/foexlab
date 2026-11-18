"""Bestehende Fragetypen (info, frei, mc, zuordnung, luecke, kurz, zahl, bildzuordnung) rendern."""
import html, json, os, re

from PIL import Image

from .formeln import md
from .quelle import split_blocks

esc = lambda s: html.escape(s or "", quote=True)
KONTROLL_TYPEN = ("mc", "luecke", "zuordnung", "bildzuordnung")   # Auswahl-Typen, die als Kontrollfrage (sperrt) gelten können
TYPEN = ("info", "frei", "mc", "zuordnung", "luecke", "kurz", "zahl", "bildzuordnung")


def sel(options, correct):
    opts = sorted(dict.fromkeys(options), key=str.casefold)
    o = '<option value="">…</option>' + "".join(f'<option value="{esc(x)}">{esc(x)}</option>' for x in opts)
    return f'<select class="gap" data-correct="{esc(correct)}">{o}</select>'


def svg_groesse(path):
    """Breite, Höhe (und Ursprung) eines SVG aus viewBox, sonst width/height des Wurzelelements (Prozentangaben zählen nicht); None, wenn beides fehlt."""
    with open(path, encoding="utf-8", errors="replace") as f: text = f.read()
    kopf = re.search(r"<svg\b[^>]*>", text, re.S)
    if not kopf: return None
    kopf = kopf.group(0)
    zahl = r"[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?"
    def attr(name):
        m = re.search(r'(?<![\w:.-])' + name + r'\s*=\s*(?:"([^"]*)"|\'([^\']*)\')', kopf)
        return (m.group(1) if m.group(1) is not None else m.group(2)) if m else None
    vb = attr("viewBox")
    if vb:
        z = re.fullmatch(r"\s*(" + zahl + r")[\s,]+(" + zahl + r")[\s,]+(" + zahl + r")[\s,]+(" + zahl + r")\s*", vb)
        if z and float(z.group(3)) > 0 and float(z.group(4)) > 0:
            return float(z.group(3)), float(z.group(4)), float(z.group(1)), float(z.group(2))
    def mass(name):
        v = attr(name)
        m = re.match(r"\s*(" + zahl + r")\s*[a-zA-Z]*\s*$", v) if v else None
        return float(m.group(1)) if m and float(m.group(1)) > 0 else None
    w, h = mass("width"), mass("height")
    return (w, h, 0.0, 0.0) if w and h else None


def split_fb(s):
    a, _, b = s.partition(" || ")
    return a.strip(), b.strip()


def frac(tag):
    t = tag.strip()
    if t in ("x", "X"): return 1.0
    if not t: return 0.0
    return float(t.rstrip("%")) / 100


def tipps_html(ctx, blk):
    return "".join(f'<details class="fx-tipp"><summary>Tipp {i}</summary><div>{md(ctx, t)}</div></details>'
                   for i, t in enumerate(blk.get("tipp", []), 1))


def render_q(ctx, q, number, qid):
    cls = q["cls"]
    stem_md, blk = split_blocks(q["lines"])
    ty = next((c for c in cls if c in TYPEN), None)
    from .bausteine import NEUE, render_baustein
    if "ziehen" in cls and ty != "bildzuordnung":
        ctx.warnings.append(f"{q['title']}: ziehen wirkt nur bei bildzuordnung")
    if ty is None and any(c in NEUE for c in cls):
        return render_baustein(ctx, q, number)
    if ty == "info":
        return f'<div class="q desc" data-type="description"><div class="qtext">{md(ctx, stem_md)}</div></div>'
    if ty in KONTROLL_TYPEN and (q.get("kv") or {}).get("versuche") and "sperrt" not in cls:
        ctx.warnings.append(f"{q['title']}: versuche wirkt nur mit sperrt ({{.{ty} sperrt versuche=\"n\"}})")
    head = f'<div class="qhead"><span class="qnum">{number}</span><span class="qname">{esc(q["title"])}</span></div>'
    gf = md(ctx, blk["hinweis"]) if blk.get("hinweis", "").strip() else ""
    gfb = f'<div class="gfb" hidden><strong>Hinweis</strong>{gf}</div>' if gf else ""
    ofb = "".join(f'<div class="ofb {c}" hidden>{md(ctx, blk[n])}</div>' for n, c in (("richtig", "ok"), ("teilweise", "part"), ("falsch", "bad")) if blk.get(n))
    text, body, qtype = md(ctx, stem_md), "", "none"
    if ty == "mc":
        items, fr = [], []
        for l in [l for l in blk.get("antworten", "").splitlines() if l.strip()]:
            m = re.match(r"^-\s*\[([^\]]*)\]\s*(.*)$", l)
            if not m: ctx.warnings.append(f"{q['title']}: Antwortzeile ohne [x]/[ ]: {l[:50]}"); continue
            t, f = split_fb(m.group(2)); fr.append((frac(m.group(1)), t, f))
        single = "mehrfach" not in cls
        for i, (f_, t, f) in enumerate(fr):
            inp = f'<input type="{"radio" if single else "checkbox"}" name="q{qid}" data-f="{f_}">'
            items.append(f'<li><label>{inp}<span>{md(ctx, t, True)}</span></label>' + (f'<div class="afb" hidden>{md(ctx, f, True)}</div>' if f else "") + "</li>")
        body = f'<ul class="opts">{"".join(items)}</ul>'; qtype = "mc"
    elif ty == "zuordnung":
        pairs = []
        for l in blk.get("paare", "").splitlines():
            if "=>" in l:
                a, _, b = l.partition("=>"); pairs.append((a.strip(), b.strip()))
        answers = list(dict.fromkeys(b for _, b in pairs if b))
        rows = "".join(f'<tr><td class="mq">{md(ctx, a, True)}</td><td>{sel(answers, b)}</td></tr>' for a, b in pairs if a)
        body = f'<table class="match">{rows}</table>'; qtype = "gaps"
    elif ty == "luecke":
        tokens = []
        def tok(m):
            opts = [o.strip() for o in m.group(1).split("|")]
            tokens.append(sel(opts, opts[0])); return f"GAPTOKEN{len(tokens) - 1}X"
        text = md(ctx, re.sub(r"\{\{(.+?)\}\}", tok, stem_md))
        text = re.sub(r"GAPTOKEN(\d+)X", lambda m: tokens[int(m.group(1))], text)
        qtype = "gaps"
    elif ty in ("kurz", "zahl"):
        ans = []
        for l in blk.get("antworten", "").splitlines():
            m = re.match(r"^=\s*(?:\[(\d+)%\]\s*)?(.*)$", l)
            if not m: continue
            f_ = int(m.group(1)) / 100 if m.group(1) else 1.0
            t, fb = split_fb(m.group(2))
            if ty == "kurz": ans.append([t, f_, fb])
            else:
                v, _, tol = t.partition("±"); ans.append([v.strip(), float(tol.replace(",", ".")) if tol.strip() else 0.0, f_, fb])
        if ty == "kurz":
            body = f'<input type="text" class="short" data-answers="{esc(json.dumps(ans))}" data-usecase="{int("gross" in cls)}" placeholder="Antwort eingeben">'; qtype = "short"
        else:
            u = q["kv"].get("einheit")
            body = f'<input type="text" inputmode="decimal" class="num" data-answers="{esc(json.dumps(ans))}" placeholder="Zahl eingeben"> ' + (f'<span class="unit">{esc(u)}</span>' if u else ""); qtype = "num"
    elif ty == "frei":
        body = antwort_html(cls, q["kv"].get("platzhalter", "Eure Antwort")) + loesung_html(ctx, blk); qtype = "essay"
    elif ty == "bildzuordnung":
        X0 = Y0 = 0
        ziehen = "ziehen" in cls
        bg = q["kv"].get("bild", ""); path = os.path.join(ctx.kurs_dir, "media", bg)
        if not os.path.isfile(path): ctx.warnings.append(f"{q['title']}: Bild {bg} fehlt"); W = H = 1
        elif bg.lower().endswith(".svg"):
            g = svg_groesse(path)
            if g: W, H, X0, Y0 = g
            else: ctx.warnings.append(f"{q['title']}: Größe von {bg} nicht lesbar (viewBox oder width/height fehlt)"); W = H = 1
        else: W, H = Image.open(path).size
        marks, labels = [], []
        for l in blk.get("marken", "").splitlines():
            if not l.strip(): continue
            m = re.match(r"^(?:(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*)?=\s*(.*)$", l.strip())
            if m: marks.append((m.group(1), m.group(2), m.group(3).strip())); labels.append(m.group(3).strip())
            else: ctx.warnings.append(f"{q['title']}: Markenzeile nicht lesbar (erwartet „x,y = Label“): {l.strip()[:50]}")
        plaetze = [(x, y, lab) for x, y, lab in marks if x]
        spots = "".join(f'<span class="spot" data-nr="{n}" style="left:{(float(x) - X0) / W * 100:.2f}%;top:{(float(y) - Y0) / H * 100:.2f}%">{sel(labels, lab)}</span>' for n, (x, y, lab) in enumerate(plaetze, 1))
        if ziehen:
            chips = "".join(f'<span class="fx-chip" data-v="{esc(l)}">{esc(l)}</span>' for l in sorted(labels, key=str.casefold))
            body = (f'<div class="ddimg fx-ziehen" style="max-width:{int(W) if W == int(W) else round(W, 2)}px"><img src="media/{esc(bg)}" alt="">{spots}</div>'
                    f'<div class="fx-ablage">{chips}</div><p class="fx-ziehhinweis">Bausteine mit dem Finger auf einen Platz ziehen oder erst den Baustein und dann den Platz antippen.</p>')
        else: body = f'<div class="ddimg" style="max-width:{int(W) if W == int(W) else round(W, 2)}px"><img src="media/{esc(bg)}" alt="">{spots}</div>'
        qtype = "gaps"
    else:
        ctx.warnings.append(f"{q['title']}: unbekannter Fragetyp {cls}")
    if qtype == "gaps" and 'class="gap"' not in text + body:
        ctx.warnings.append(f"{q['title']}: keine Auswahlliste – Kontrollfrage wäre nie lösbar")
        q = dict(q, cls=[c for c in cls if c != "sperrt"])   # nicht sperrend, sonst bliebe das Kapitel für immer zu
    ctl = ""
    if qtype in ("mc", "gaps", "short", "num"):
        ctl = '<div class="qctl"><button type="button" class="check">Prüfen</button><button type="button" class="reset">Zurücksetzen</button><span class="res"></span></div>'
    elif qtype == "essay" and gfb:
        ctl = '<div class="qctl"><button type="button" class="check">Hinweis anzeigen</button></div>'
    nach_versuchen = f'<div class="fx-nach-versuchen" hidden>{md(ctx, blk["nach_versuchen"])}</div>' if blk.get("nach_versuchen", "").strip() else ""
    inner = f'<div class="q" id="q{qid}" data-type="{qtype}">{head}<div class="qtext">{text}</div>{tipps_html(ctx, blk)}<div class="qbody">{body}</div>{ctl}{ofb}{gfb}{loesung_html(ctx, blk) if ty == "mc" else ""}{nach_versuchen}</div>'
    if qtype == "none" or not q.get("id"): return inner
    return feld(q, "text" if qtype == "essay" else "quiz", inner)


def loesung_html(ctx, blk):
    """:::loesung – Knopf „Lösung anzeigen“ mit verstecktem Text (im PDF nur bei musterloesungen: ja)."""
    if not blk.get("loesung", "").strip(): return ""
    return (f'<div class="fx-loesung-box"><button type="button" class="fx-loesung-knopf" aria-expanded="false">Lösung anzeigen</button>'
            f'<div class="fx-loesung" hidden>{md(ctx, blk["loesung"])}</div></div>')


def antwort_html(cls, platzhalter, zeilen=6, klasse="essay fx-text"):
    """Antwortfeld Tippen | Stift (DOM-Vertrag mit antwort.js und stiftfeld.js)."""
    start = "stift" if "stift" in cls else "tippen"
    leiste = ('<div class="fx-stift-leiste"><button type="button" data-werkzeug="stift" aria-pressed="true">Stift</button>'
              '<button type="button" data-werkzeug="radierer" aria-pressed="false">Radierer</button>'
              '<button type="button" class="fx-rueckgaengig">Rückgängig</button><button type="button" class="fx-wiederholen">Wiederholen</button>'
              '<button type="button" class="fx-mehr-platz">+ mehr Platz</button>'
              '<label class="fx-hg">Hintergrund <select class="fx-hintergrund"><option value="linien">Linien</option><option value="karo">Karo</option><option value="leer">leer</option></select></label>'
              '<label class="fx-hg"><input type="checkbox" class="fx-nur-pencil" checked> Nur Apple Pencil</label></div>')
    return (f'<div class="fx-antwort" data-start="{start}"><div class="fx-modus" role="group" aria-label="Eingabeart">'
            '<button type="button" data-modus="tippen" aria-pressed="false">Tippen</button>'
            '<button type="button" data-modus="stift" aria-pressed="false">Stift</button></div>'
            f'<textarea class="{klasse}" rows="{zeilen}" placeholder="{esc(platzhalter)}"></textarea>'
            f'<div class="fx-stift" hidden>{leiste}<canvas></canvas></div></div>')


def feld(q, art, inner, konfig=None):
    """Hülle eines speicherbaren Feldes (DOM-Vertrag mit felder.js)."""
    k = f' data-fx-konfig="{esc(json.dumps(konfig, ensure_ascii=False))}"' if konfig is not None else ""
    cls = q.get("cls") or []
    kontrolle = "sperrt" in cls and any(t in cls for t in KONTROLL_TYPEN) and art == "quiz"   # Kontrollfrage: öffnet Folgendes erst nach richtiger Antwort
    versuche = (q.get("kv") or {}).get("versuche", "")
    flags = (' data-fx-kontrolle="1"' if kontrolle else "") + (f' data-fx-versuche="{esc(versuche)}"' if kontrolle and versuche.isdigit() else "")
    flags += (' data-fx-sperrt="1"' if "sperrt" in cls else "") + (' data-fx-optional="1"' if "optional" in cls else "")
    return f'<div class="fx-feld" data-fx-id="{esc(q["id"])}" data-fx-art="{art}" data-fx-titel="{esc(q["title"])}"{flags}{k}>{inner}</div>'
