"""Neue Bausteine: messtabelle (weitere folgen). Jeder Baustein wird als .fx-feld gerendert."""
import html, json, os, re

from PIL import Image

from .formeln import md
from .fragen import antwort_html, feld, loesung_html, render_q, tipps_html
from .quelle import split_blocks

esc = lambda s: html.escape(s or "", quote=True)
NEUE = ("messtabelle", "vermutung", "foto", "skizze", "umschalter", "knopf", "werkzeug", "checkliste", "platzhalter")
DIAGRAMM_OPTIONEN = ("x", "y", "ausgleich")
AUSGLEICH = ("linear", "ursprung", "keiner")


def parse_spalten(text):
    """Zeilen 'Kürzel | Name | Einheit'; berechnete Spalte: 'n = <Formel> | Name | Einheit'."""
    out = []
    for l in (text or "").splitlines():
        if not l.strip(): continue
        teile = [t.strip() for t in l.split("|")] + ["", ""]
        k, formel = teile[0], None
        if "=" in k:
            k, _, formel = k.partition("=")
            k, formel = k.strip(), formel.strip()
        out.append(dict(kuerzel=k, name=teile[1] or k, einheit=teile[2], formel=formel))
    return out


def parse_diagramm(text, warnings):
    erg = dict(x=None, y=None, ausgleich="keiner")
    for teil in re.split(r"[,\n]", text or ""):
        if "=" not in teil: continue
        k, _, v = teil.partition("=")
        k, v = k.strip(), v.strip()
        if k not in DIAGRAMM_OPTIONEN:
            warnings.append(f"Diagramm: unbekannte Option „{k}“ ignoriert"); continue
        if k == "ausgleich" and v not in AUSGLEICH:
            warnings.append(f"Diagramm: ausgleich = {v} unbekannt (linear, ursprung, keiner)"); continue
        erg[k] = v
    return erg


def parse_konstanten(text, warnings):
    erg = {}
    for l in (text or "").splitlines():
        if "=" not in l: continue
        k, _, v = l.partition("=")
        try: erg[k.strip()] = float(v.strip().replace(",", "."))
        except ValueError: warnings.append(f"Konstante {k.strip()}: „{v.strip()}“ ist keine Zahl")
    return erg


def render_messtabelle(ctx, q, text, blk):
    spalten = parse_spalten(blk.get("spalten"))
    if not spalten: ctx.warnings.append(f"{q['title']}: Messtabelle ohne :::spalten")
    diagramm = parse_diagramm(blk["diagramm"], ctx.warnings) if "diagramm" in blk else None
    konfig = dict(spalten=spalten, diagramm=diagramm, konstanten=parse_konstanten(blk.get("konstanten"), ctx.warnings))
    dia = '<div class="fx-diagramm"></div><p class="fx-ausgleich"></p>' if diagramm else ""
    inner = (f'<div class="q fx-baustein">{kopf(q, text, tipps_html(ctx, blk))}'
             '<div class="fx-tabelle"><div class="fx-tab-wrap"><table><thead></thead><tbody></tbody></table></div>'
             '<div class="fx-knoepfe"><button type="button" class="fx-zeile-plus">Zeile hinzufügen</button>'
             '<button type="button" class="fx-zeile-minus">Letzte Zeile löschen</button>'
             '<button type="button" class="fx-csv">Als CSV speichern</button></div>'
             f'{dia}</div></div>')
    return feld(q, "tabelle", inner, konfig)


def kopf(q, text, extra=""):
    return f'<div class="qhead"><span class="qname">{esc(q["title"])}</span></div><div class="qtext">{text}</div>{extra}'


def render_vermutung(ctx, q, text, blk):
    inner = (f'<div class="q fx-baustein fx-vermutung">{kopf(q, text, tipps_html(ctx, blk))}'
             + antwort_html(q["cls"], q["kv"].get("platzhalter", "Eure Vermutung"), 4, "fx-text") + loesung_html(ctx, blk) + '</div>')
    return feld(q, "vermutung", inner)


def render_foto(ctx, q, text, blk):
    inner = (f'<div class="q fx-baustein fx-foto">{kopf(q, text, tipps_html(ctx, blk))}'
             '<div class="fx-knoepfe">'
             '<label class="fx-knopf"><input type="file" class="fx-foto-eingabe" accept="image/*" capture="environment" hidden>Foto aufnehmen</label>'
             '<label class="fx-knopf"><input type="file" class="fx-foto-eingabe" accept="image/*" hidden>Aus Fotos wählen</label></div>'
             '<ul class="fx-fotos"></ul><p class="fx-meldung" role="alert" hidden></p></div>')
    return feld(q, "foto", inner)


FARBEN = (("Navy", "#33416E"), ("Orange", "#F58411"), ("Blau", "#3F9AD6"))


def render_skizze(ctx, q, text, blk):
    bild = q["kv"].get("bild", "")
    verhaeltnis, vorlage = "4/3", ""
    if bild:
        pfad = os.path.join(ctx.kurs_dir, bild)
        if os.path.isfile(pfad):
            w, h = Image.open(pfad).size
            verhaeltnis = f"{w}/{h}"
            vorlage = f'<img class="fx-vorlage" src="{esc(bild)}" alt="">'
        else:
            ctx.warnings.append(f"{q['title']}: Vorlage {bild} fehlt")
    farben = "".join(f'<button type="button" class="fx-knopf fx-farbe" data-farbe="{c}" aria-label="Stift {n}"><span style="background:{c}"></span></button>' for n, c in FARBEN)
    werkzeuge = (f'<div class="fx-knoepfe fx-werkzeuge">{farben}'
                 '<button type="button" class="fx-knopf fx-farbe" data-farbe="radierer">Radierer</button>'
                 '<button type="button" class="fx-knopf fx-rueckgaengig">Rückgängig</button>'
                 '<button type="button" class="fx-knopf fx-alles-loeschen">Alles löschen</button></div>')
    inner = (f'<div class="q fx-baustein fx-skizze">{kopf(q, text, tipps_html(ctx, blk))}{werkzeuge}'
             f'<div class="fx-flaeche" style="aspect-ratio:{verhaeltnis}">{vorlage}<canvas></canvas></div></div>')
    return feld(q, "skizze", inner, {"bild": bild or None})


def render_baustein(ctx, q, number):
    text_md, blk = split_blocks(q["lines"])
    text = md(ctx, text_md)
    if "messtabelle" in q["cls"]: return render_messtabelle(ctx, q, text, blk)
    if "vermutung" in q["cls"]: return render_vermutung(ctx, q, text, blk)
    if "foto" in q["cls"]: return render_foto(ctx, q, text, blk)
    if "skizze" in q["cls"]: return render_skizze(ctx, q, text, blk)
    if "umschalter" in q["cls"]: return render_umschalter(ctx, q, text, blk)
    if "knopf" in q["cls"]: return render_knopf(ctx, q, text)
    if "werkzeug" in q["cls"]: return render_werkzeug(ctx, q, text)
    if "checkliste" in q["cls"]: return render_checkliste(ctx, q, blk)
    if "platzhalter" in q["cls"]: return render_platzhalter(ctx, q, text)
    raise ValueError(q["cls"])


def render_platzhalter(ctx, q, text):
    """### … {.platzhalter}: markiert eine noch fehlende Simulation; bewusst kein Feld (kein Speichern, kein Protokoll, nie sperrend)."""
    if "sperrt" in q["cls"]: ctx.warnings.append(f"{q['title']}: Platzhalter kann nichts sperren – sperrt wird ignoriert")
    return (f'<div class="q fx-baustein fx-platzhalter" data-fx-platzhalter="1"><div class="qhead"><span class="qname">{esc(q["title"])}</span></div>'
            f'<p class="fx-platzhalter-hinweis">Diese Simulation folgt noch.</p><div class="qtext">{text}</div></div>')


LISTENPUNKT = re.compile(r"^\s*(?:[-*+]|\d+[.)])\s+(.*\S)\s*$")


def render_checkliste(ctx, q, blk):
    """### … {.checkliste}: jeder Listenpunkt des Fragetexts wird ein Haken; ein Block :::liste (eine Zeile je Punkt) gewinnt."""
    text_md, _ = split_blocks(q["lines"])
    punkte, rest = [], []
    for l in text_md.splitlines():
        m = LISTENPUNKT.match(l)
        if m: punkte.append(m.group(1))
        else: rest.append(l)
    rest = "\n".join(rest)
    if (q.get("kv") or {}).get("versuche"): ctx.warnings.append(f"{q['title']}: versuche wirkt bei Checklisten nicht")
    if "liste" in blk and punkte: ctx.warnings.append(f"{q['title']}: Markdown-Listenpunkte werden von :::liste verdrängt")
    if "liste" in blk: punkte = [l.strip() for l in blk["liste"].splitlines() if l.strip()]   # :::liste gewinnt
    if not punkte: ctx.warnings.append(f"{q['title']}: Checkliste ohne Listenpunkte")
    zeilen = "".join(f'<li><label class="fx-haken"><input type="checkbox"> <span>{md(ctx, p, inline=True)}</span></label></li>' for p in punkte)
    inner = (f'<div class="q fx-baustein fx-checkliste-box">{kopf(q, md(ctx, rest), tipps_html(ctx, blk))}'
             f'<ul class="fx-checkliste">{zeilen}</ul><p class="fx-status" role="status"></p></div>')
    return feld(q, "checkliste", inner)


def render_umschalter(ctx, q, text, blk):
    """### … {.umschalter} mit ::: ansicht Name – Knöpfe wechseln zwischen den Ansichten; kein Feld, kein Protokolleintrag."""
    ansichten = blk.get("ansicht", [])
    if len(ansichten) < 2: ctx.warnings.append(f"{q['title']}: Umschalter braucht mindestens zwei ::: ansicht")
    knoepfe = "".join(f'<button type="button" class="fx-knopf" data-ansicht="{i}" aria-pressed="{"true" if i == 0 else "false"}">{esc(t)}</button>' for i, (t, _) in enumerate(ansichten))
    inhalte = "".join(f'<div class="fx-ansicht-inhalt" data-ansicht="{i}"{" hidden" if i else ""}>{md(ctx, a)}</div>' for i, (_, a) in enumerate(ansichten))
    kopf_ = f'<div class="qhead"><span class="qname">{esc(q["title"])}</span></div>' if q["title"].strip() else ""
    return (f'<div class="q fx-baustein fx-umschalter">{kopf_}<div class="qtext">{text}</div>'
            f'<div class="fx-umschalter-knoepfe" role="group">{knoepfe}</div>{inhalte}</div>')


def render_knopf(ctx, q, text):
    """### Titel {.knopf oeffnet="<abschnitt-id>" id="<knopf-id>"} – öffnet über FX.freischaltung und springt zum Abschnitt."""
    kv = q["kv"]
    if not kv.get("oeffnet") or not kv.get("id"): ctx.warnings.append(f"{q['title']}: Knopf braucht oeffnet=\"…\" und id=\"…\"")
    return (f'<div class="q fx-baustein fx-knopf-box"><div class="qtext">{text}</div>'
            f'<button type="button" class="fx-knopf fx-haupt fx-knopf-oeffnet" data-oeffnet="{esc(kv.get("oeffnet", ""))}" data-knopf-id="{esc(kv.get("id", ""))}">{esc(q["title"])}</button></div>')


def werkzeug_module(kurs_dir):
    """Namen, unter denen die Werkzeug-Dateien des Kurses Feldarten anbieten: Dateiname und registriere('<art>')."""
    namen = set()
    ordner = os.path.join(kurs_dir, "werkzeuge")
    if os.path.isdir(ordner):
        for f in os.listdir(ordner):
            if f.endswith(".js"):
                namen.add(f[:-3])
                namen.update(re.findall(r"registriere\(\s*['\"]([\w-]+)['\"]", open(os.path.join(ordner, f), encoding="utf-8").read()))
    return namen


def render_werkzeug(ctx, q, text):
    """### Titel {.werkzeug name="<modul>" …} – Feld einer Feldart, die kurse/<kurs>/werkzeuge/*.js registriert; weitere Attribute sind die Konfiguration."""
    kv = dict(q["kv"]); name = kv.pop("name", "")
    kv.pop("id", None)
    if not hasattr(ctx, "werkzeuge"): ctx.werkzeuge = werkzeug_module(ctx.kurs_dir)
    if name not in ctx.werkzeuge: ctx.warnings.append(f"Werkzeug ‚{name}‘ fehlt: werkzeuge/{name}.js")
    inner = (f'<div class="q fx-baustein fx-werkzeug"><div class="qhead"><span class="qname">{esc(q["title"])}</span></div>'
             f'<div class="qtext">{text}</div><div class="fx-werkzeug-flaeche"></div></div>')
    return feld(q, name, inner, kv)


def videos_bei_bedarf(h):
    """Videos laden erst beim Antippen und spielen inline (iPad)."""
    return re.sub(r"<video(?![^>]*preload)", '<video preload="none" playsinline', h)


def render_schritte(ctx, act):
    """## … {.schritte}: jede ### ist ein Schritt; eine Ansicht pro Schritt."""
    intro_md, _ = split_blocks(act["intro"])
    intro = md(ctx, intro_md)
    schritte = "".join(
        f'<section class="fx-schritt" data-nr="{i}"><h3>{esc(q["title"])}</h3>{videos_bei_bedarf(md(ctx, split_blocks(q["lines"])[0]))}</section>'
        for i, q in enumerate(act["qs"]))
    nav = ('<div class="fx-schritt-nav"><button type="button" class="fx-knopf fx-zurueck">Schritt zurück</button>'
           '<span class="fx-schritt-zahl"></span>'
           '<label class="fx-haken"><input type="checkbox" class="fx-erledigt"> Erledigt</label>'
           '<button type="button" class="fx-knopf fx-weiter">Nächster Schritt</button></div>')
    q = dict(id=act["id"] + "/schritte", title=act["title"])
    return (f'<div class="intro">{intro}</div>' if intro.strip() else "") + feld(q, "schritte", f'<div class="fx-schritte">{schritte}{nav}</div>')


def render_quizserie(ctx, act, qcounter):
    """## … {.quiz oeffnet="<ziel>"}: jede ### {.mc} ist eine Frage der Serie. Gibt (html, qcounter, anzahl) zurück."""
    intro_md, _ = split_blocks(act["intro"])
    intro = md(ctx, intro_md)
    fragen = [q for q in act["qs"] if "mc" in q["cls"]]
    teile = []
    for i, q in enumerate(fragen):
        qcounter += 1
        _, blk = split_blocks(q["lines"])
        nach = f' data-nachschlagen="{esc(blk["nachschlagen"].strip())}"' if blk.get("nachschlagen", "").strip() else ""
        inner = render_q(ctx, dict(q, id=None), i + 1, qcounter)
        inner = re.sub(r'<div class="qctl">.*?</div>', '<span class="res" role="status"></span>', inner, count=1, flags=re.S)   # quiz.js zeigt Rückmeldungen über .res
        teile.append(f'<div class="fx-quizfrage" data-nr="{i}"{nach} hidden>{inner}</div>')
    steuerung = ('<div class="fx-quizctl"><button type="button" class="fx-knopf fx-haupt fx-pruefen">Prüfen</button>'
                 '<button type="button" class="fx-knopf fx-nochmal" hidden>Nochmal versuchen</button>'
                 '<button type="button" class="fx-knopf fx-haupt fx-naechste" hidden>Nächste Frage</button>'
                 '<a class="fx-knopf fx-nachschlagen" href="#" data-fx-ruecksprung hidden>Hier nochmal nachschlagen</a></div>')
    inner = ('<div class="fx-quizserie"><div class="fx-quizkopf"><span class="fx-quizzahl"></span><ol class="fx-quizpunkte"></ol></div>'
             + "".join(teile) + steuerung + '<p class="fx-quizmeldung" role="status" hidden></p></div>')
    q = dict(id=act["id"] + "/quiz", title=act["title"])
    h = feld(q, "quizserie", inner, {"oeffnet": act["kv"].get("oeffnet", ""), "anzahl": len(fragen)})
    rest = ""   # weitere Felder und Texte der Karte (z. B. eine Reflexionsfrage nach dem Quiz) wie sonst auch
    from .fragen import TYPEN
    for q2 in act["qs"]:
        if "mc" in q2["cls"]: continue
        if any(c in TYPEN or c in NEUE for c in q2["cls"]):
            qcounter += 1
            rest += render_q(ctx, q2, 1, qcounter)
        else:
            rest += f'<div class="q desc"><h3>{esc(q2["title"])}</h3><div class="qtext">{md(ctx, split_blocks(q2["lines"])[0])}</div></div>'
    return (f'<div class="intro">{intro}</div>' if intro.strip() else "") + h + rest, qcounter, len(fragen)
