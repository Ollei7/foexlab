"""Gesamtdokument bauen: Abschnitte rendern, Template füllen, Ausgabe schreiben."""
import base64, hashlib, html, io, json, os, re, shutil

import yaml
from PIL import Image

from .bausteine import NEUE, render_quizserie, render_schritte
from .formeln import md, render_math
from .fragen import TYPEN, render_q
from .medien import Medien
from .quelle import ids_vergeben, parse_file, split_blocks

ENGINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DESIGN = os.path.join(ENGINE, "design")
WEB = os.path.join(ENGINE, "web")
esc = lambda s: html.escape(s or "", quote=True)
CSS_REIHENFOLGE = ["css/basis.css", "css/bausteine.css", "css/labor.css"]
JS_REIHENFOLGE = ["vendor/jspdf.umd.min.js", "vendor/qrcode.js", "js/store.js", "js/felder.js", "js/freischaltung.js", "js/stiftfeld.js", "js/antwort.js", "js/quiz.js", "js/ziehen.js", "js/quizserie.js", "js/formel.js", "js/ausgleich.js",
                  "js/messtabelle.js", "js/schritte.js", "js/foto.js", "js/skizze.js", "js/checkliste.js", "js/umschalter.js", "js/protokoll.js", "js/pdf.js", "js/teilen.js", "js/oberflaeche.js"]


def werkzeug_text(kurs_dir):
    """Dateien aus kurse/<kurs>/werkzeuge/*.js; Dateien mit „kern“ im Namen zuerst, sonst alphabetisch."""
    ordner = os.path.join(kurs_dir, "werkzeuge")
    if not os.path.isdir(ordner): return ""
    dateien = sorted((f for f in os.listdir(ordner) if f.endswith(".js")), key=lambda f: ("kern" not in f, f))
    return "\n".join(open(os.path.join(ordner, f), encoding="utf-8").read() for f in dateien)


def web_text(namen):
    return "\n".join(open(os.path.join(WEB, n), encoding="utf-8").read() for n in namen)


class Kontext:
    def __init__(self, kurs_dir):
        self.kurs_dir = kurs_dir
        self.warnings, self.maths = [], []


def files_html(blockt, einbetten):
    out = ""
    for l in (blockt or "").splitlines():
        rel = l.strip()
        if not rel: continue
        out += f'<a class="file" href="{esc(rel)}"><span class="i i-file"></span>{esc(os.path.basename(rel))}</a> '
        if einbetten and rel.lower().endswith(".pdf"):
            out += f'<iframe class="pdf" data-pdf-src="{esc(rel)}" title="{esc(os.path.basename(rel))}"></iframe>'
    return out


# ---- Design (foeXlab Design System): Schrift, Icons, Logos ----
def b64(path): return base64.b64encode(open(path, "rb").read()).decode()


def font_css(ctx, ziel_dir=None):
    """@font-face für Source Sans 3 (woff2); im Ordner-Modus werden die Dateien nach fonts/ kopiert."""
    faces = [("Regular", 400), ("Semibold", 600), ("Bold", 700)]
    out = []
    for name, w in faces:
        p = os.path.join(WEB, "fonts", f"SourceSans3-{name}.woff2")
        if os.path.isfile(p):
            if ziel_dir:
                os.makedirs(os.path.join(ziel_dir, "fonts"), exist_ok=True)
                shutil.copyfile(p, os.path.join(ziel_dir, "fonts", os.path.basename(p)))
                src = f"fonts/{os.path.basename(p)}"
            else:
                src = f"data:font/woff2;base64,{b64(p)}"
            out.append(f'@font-face{{font-family:"Source Sans 3";font-weight:{w};font-style:normal;font-display:swap;src:url({src}) format("woff2")}}')
        else:
            ctx.warnings.append(f"Schrift fehlt: {p} (Fallback Helvetica Neue/Arial)")
    return "\n".join(out)


ICONS = {  # Lucide-Stil (ISC), Stroke 1.5
 "quiz": '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
 "edit": '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
 "doc": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
 "file": '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
 "check": '<path d="M20 6 9 17l-5-5"/>',
 "x": '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
 "chev": '<path d="m9 18 6-6-6-6"/>',
}


def icon_uri(k, sw=1.5):
    svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">{ICONS[k]}</svg>'
    return "url(data:image/svg+xml;base64," + base64.b64encode(svg.encode()).decode() + ")"


def icon_css():
    c = ":root{" + "".join(f"--i-{k}:{icon_uri(k, 2)};" for k in ("check", "x")) + f"--chev:{icon_uri('chev', 2)}}}\n"
    return c + "".join(f".i-{k}{{--s:{icon_uri(k)}}}\n" for k in ("quiz", "edit", "doc", "file", "check"))


def logo(rel, maxw):
    p = os.path.join(DESIGN, "logos", rel)
    if not os.path.isfile(p): return ""
    im = Image.open(p); im.load()
    if im.width > maxw: im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    b = io.BytesIO()
    if rel.endswith(".png"): im.save(b, "PNG", optimize=True); mime = "image/png"
    else: im.convert("RGB").save(b, "JPEG", quality=88, optimize=True); mime = "image/jpeg"
    return f"data:{mime};base64,{base64.b64encode(b.getvalue()).decode()}"


def render_karteninhalt(ctx, a, qcounter):
    """Inhalt einer Karte (## …). Gibt (html, qcounter, n_fragen) zurück."""
    if "schritte" in a["cls"]:
        return render_schritte(ctx, a), qcounter, 0
    if "quiz" in a["cls"]:
        h, qcounter, n = render_quizserie(ctx, a, qcounter)
        return h, qcounter, n
    intro_md, ablk = split_blocks(a["intro"])
    intro = md(ctx, intro_md)
    teile = [f'<div class="intro">{intro}</div>'] if intro.strip() else []
    n = 0
    for q in a["qs"]:
        typisiert = any(c in TYPEN or c in NEUE for c in q["cls"])
        if "test" in a["cls"] or typisiert:
            qcounter += 1
            if "info" not in q["cls"]: n += 1
            teile.append(render_q(ctx, q, n, qcounter))
        else:
            teile.append(f'<div class="q desc"><h3>{esc(q["title"])}</h3><div class="qtext">{md(ctx, split_blocks(q["lines"])[0])}</div></div>')
    teile.append(files_html(ablk.get("dateien"), "einbetten" in a["cls"]))
    if "aufgabe" in a["cls"]:
        teile.append('<p class="note">Im Original eine Abgabe-Aufgabe; hier nur der Auftrag.</p>')
    return "".join(teile), qcounter, n


def regeln_aufbauen(secs):
    """Freischaltregeln aus Frontmatter und Kartenattributen (Regeln-JSON für freischaltung.js)."""
    titel, knoepfe = {}, {}
    for fn, sec in secs:
        for a in sec["acts"]:
            titel[a["id"]] = a["title"]
            for q in a["qs"]:
                if "knopf" in q["cls"] and q["kv"].get("id"): knoepfe[q["kv"]["id"]] = q["title"]

    def standardgrund(bed):
        art, _, ziel = (bed or "").partition(":")
        if art == "felder": return f"Öffnet sich, wenn ‚{titel.get(ziel, ziel)}‘ vollständig bearbeitet ist."
        if art == "quiz": return f"Öffnet sich, wenn ‚{titel.get(ziel, ziel)}‘ vollständig richtig beantwortet ist."
        if art == "knopf": return f"Öffnet sich über ‚{knoepfe.get(ziel, ziel)}‘."
        return ""

    r = {"abschnitte": {}, "karten": {}, "kartenregeln": {}}
    for fn, sec in secs:
        fm = sec["fm"]
        ab = abschnitt_id(fn)
        eintrag = {}
        if fm.get("oeffnet_nach"):
            eintrag["oeffnet_nach"] = fm["oeffnet_nach"]
            eintrag["grund"] = fm.get("grund") or standardgrund(fm["oeffnet_nach"])
        if fm.get("nachschlagen"): eintrag["nachschlagen"] = True
        r["abschnitte"][ab] = eintrag
        for a in sec["acts"]:
            if "versteckt" in a["cls"] or fm.get("versteckt"): continue
            r["karten"][a["id"]] = ab
            if a["kv"].get("oeffnet_nach"):
                r["kartenregeln"][a["id"]] = {"oeffnet_nach": a["kv"]["oeffnet_nach"], "grund": a["kv"].get("grund") or standardgrund(a["kv"]["oeffnet_nach"])}
    return r


def abschnitt_id(dateiname):
    return re.sub(r"^\d+-", "", dateiname[:-3] if dateiname.endswith(".md") else dateiname)


def render_abschnitte(ctx):
    """Liefert (Übersicht-HTML, Karten-HTML, Statistik, Regeln)."""
    stats = dict(sections=0, tests=0, q=0, aufgaben=0, material=0)
    adir = os.path.join(ctx.kurs_dir, "abschnitte")
    secs = [(fn, ids_vergeben(parse_file(os.path.join(adir, fn)), fn)) for fn in sorted(os.listdir(adir)) if fn.endswith(".md")]
    regeln = regeln_aufbauen(secs)
    uebersicht, nachschlagen, karten = [], [], []
    qcounter = 0
    for fn, sec in secs:
        fm = sec["fm"]
        title, nr = fm.get("titel", fn), str(fm.get("nr", ""))
        abschnitt = f"{nr} {title}".strip()
        ab = abschnitt_id(fn)
        nach = bool(fm.get("nachschlagen"))
        ab_versteckt = bool(fm.get("versteckt"))   # ganzer Abschnitt für Lernende ausgeblendet (z. B. Moodle-Fragensammlung)
        summ = md(ctx, "\n".join(sec["summary"]).strip())
        stats["sections"] += 1
        eintraege, erste = [], True
        for a in sec["acts"]:
            if "test" in a["cls"]: stats["tests"] += 1
            elif "aufgabe" in a["cls"]: stats["aufgaben"] += 1
            else: stats["material"] += 1
            if "versteckt" in a["cls"] or ab_versteckt:   # für Lernende ausgeblendet: nicht ausgeben, nur zählen
                if "test" in a["cls"]: stats["q"] += sum(1 for q in a["qs"] if "info" not in q["cls"])
                continue
            inhalt, qcounter, n = render_karteninhalt(ctx, a, qcounter)
            if "test" in a["cls"]: stats["q"] += n
            vorspann = f'<div class="intro fx-abschnitt-intro">{summ}</div>' if erste and summ.strip() else ""
            erste = False
            nachattr = ' data-nachschlagen="1"' if nach else ""
            link = (f'<p class="fx-nachschlag-link"><a class="fx-knopf" href="#k/{esc(fm["nachschlag_link"])}" data-fx-ruecksprung>Im Protokoll nachschlagen</a></p>'
                    if fm.get("nachschlag_link") and not nach else "")
            karten.append(f'<section class="fx-karte fx-ansicht" data-karte="{esc(a["id"])}" data-abschnitt="{esc(abschnitt)}" data-abschnitt-id="{esc(ab)}"{nachattr} hidden>'
                          f'<p class="fx-kicker">Abschnitt {esc(abschnitt)}</p><h2>{esc(a["title"])}</h2>{link}{vorspann}{inhalt}</section>')
            eintraege.append(f'<li data-karte="{esc(a["id"])}"><a href="#k/{esc(a["id"])}"><span class="t">{esc(a["title"])}</span><span class="fx-fortschritt" data-karte="{esc(a["id"])}"></span></a>'
                             '<span class="fx-sperre-klein" hidden></span></li>')
        li = (f'<li data-abschnitt-id="{esc(ab)}"><h2><span class="sn">{esc(nr)}</span>{esc(title)}</h2>'
              f'<p class="fx-sperre" hidden></p><ul class="fx-kartenliste">{"".join(eintraege)}</ul></li>')
        if not ab_versteckt:
            (nachschlagen if nach else uebersicht).append(li)
    html_ = f'<ol class="fx-abschnitte">{"".join(uebersicht)}</ol>'
    if nachschlagen: html_ += f'<h2 class="fx-zwischen">Zum Nachschlagen</h2><ol class="fx-abschnitte fx-nachschlagen-liste">{"".join(nachschlagen)}</ol>'
    return html_, "".join(karten), stats, regeln


def baue(kurs_dir, ziel, einzeldatei=False, max_img=1200, max_video_mb=10, ausgabe=print):
    """Einzeldatei: ziel ist eine .html-Datei. Ordner: ziel ist ein Verzeichnis (index.html, style.css, app.js, media/, fonts/)."""
    ctx = Kontext(kurs_dir)
    course = yaml.safe_load(open(os.path.join(kurs_dir, "kurs.yml"), encoding="utf-8"))
    uebersicht, karten, stats, regeln = render_abschnitte(ctx)
    ziel_dir = None if einzeldatei else ziel
    if ziel_dir: os.makedirs(ziel_dir, exist_ok=True)
    medien = Medien(kurs_dir, ziel_dir, max_img, max_video_mb, ctx.warnings)
    main_html = medien.ersetze(karten) if einzeldatei else medien.verlinke(karten)
    skip_note = ('<p class="note">Nicht eingebettet (zu groß): ' + ", ".join(esc(n) for _, n in medien.skipped) + ".</p>") if medien.skipped else ""
    l_fx, l_luh = logo("foexlab-logo.jpg", 540), logo("luh-logo.png", 700)
    startlogo = f'<img class="fx-startlogo" src="{l_fx}" height="40" alt="foeXlab Hannover">' if l_fx else ""
    fusslogos = (f'<img class="fx-fusslogo" src="{l_fx}" height="28" alt="foeXlab Hannover">' if l_fx else "") + \
                (f'<img class="fx-fusslogo" src="{l_luh}" height="28" alt="Leibniz Universität Hannover">' if l_luh else "")
    lizenz = course.get("lizenz", "CC BY 4.0")
    fusszeile = f'{course["titel"]} · foeXlab, Leibniz Universität Hannover · {lizenz}'
    subline = f'<p class="sub">{esc(course["untertitel"])}</p>' if course.get("untertitel") else ""
    css = font_css(ctx, ziel_dir) + "\n" + icon_css() + web_text(CSS_REIHENFOLGE)
    js = web_text(JS_REIHENFOLGE[:-1]) + "\n" + werkzeug_text(kurs_dir) + "\n" + web_text(JS_REIHENFOLGE[-1:])
    if einzeldatei:
        css_tag = f"<style>\n{css}</style>"
        assets = json.dumps({k: {"m": v[0], "d": v[1]} for k, v in medien.assets.items()}, separators=(",", ":")).replace("</", "<\\/")
        js_inline = js.replace("</script", "<\\/script")
        js_tag = '<script type="application/json" id="assets">' + assets + '</script>\n<script>\n' + js_inline + '</script>'
    else:
        open(os.path.join(ziel_dir, "style.css"), "w", encoding="utf-8").write(css)
        open(os.path.join(ziel_dir, "app.js"), "w", encoding="utf-8").write(js)
        v_css = hashlib.sha1(css.encode()).hexdigest()[:8]
        v_js = hashlib.sha1(js.encode()).hexdigest()[:8]
        css_tag, js_tag = f'<link rel="stylesheet" href="style.css?v={v_css}">', f'<script src="app.js?v={v_js}"></script>'
    meta = {"id": course.get("id") or os.path.basename(os.path.normpath(kurs_dir)), "titel": course["titel"], "lizenz": lizenz,
            "musterloesungen": bool(course.get("musterloesungen", False)), "abholdienst": not einzeldatei}
    if course.get("auf_einen_blick"): meta["auf_einen_blick"] = course["auf_einen_blick"]
    js_tag = ('<script type="application/json" id="fx-kurs">' + json.dumps(meta, ensure_ascii=False).replace("</", "<\\/") + "</script>\n"
              '<script type="application/json" id="fx-regeln">' + json.dumps(regeln, ensure_ascii=False).replace("</", "<\\/") + "</script>\n" + js_tag)
    tpl = open(os.path.join(WEB, "template.html"), encoding="utf-8").read()
    out = (tpl.replace("%%STARTLOGO%%", startlogo).replace("%%FUSSLOGOS%%", fusslogos).replace("%%KOPF_HERKUNFT%%", "foeXlab · LUH")
              .replace("%%SUBLINE%%", subline).replace("%%FUSSZEILE%%", esc(fusszeile))
              .replace("%%TITLE%%", esc(course["titel"])).replace("%%UEBERSICHT%%", uebersicht).replace("%%MAIN%%", main_html)
              .replace("%%STATS%%", f'{stats["sections"]} Abschnitte · {stats["tests"]} Tests mit {stats["q"]} Fragen · {stats["aufgaben"]} Aufgaben · {stats["material"]} Materialien')
              .replace("%%SKIP%%", skip_note))
    out, tex_left = render_math(ctx, out)
    out = out.replace("%%CSS%%", css_tag).replace("%%JS%%", js_tag)
    if tex_left: ctx.warnings.append(f"{tex_left} Formel(n) bleiben als TeX (KaTeX im Browser, benötigt Internet)")
    datei = ziel if einzeldatei else os.path.join(ziel_dir, "index.html")
    os.makedirs(os.path.dirname(os.path.abspath(datei)), exist_ok=True)
    open(datei, "w", encoding="utf-8").write(out)
    ausgabe(f"OK {os.path.abspath(datei)}  {os.path.getsize(datei) / 1e6:.1f} MB  {stats}")
    for s in medien.skipped: ausgabe("nicht eingebettet: " + s[1])
    for w in ctx.warnings: ausgabe("WARNUNG: " + w)
    return stats


STARTSEITE_CSS = """
:root{--navy:#33416E;--blau:#3F9AD6;--rose:#CF6F82;--orange:#F58411;--grau:#6B7080;--linie:#E6E8EF;--seite:#F7F7F5;
--verlauf:linear-gradient(100deg,#3F9AD6 0%,#33416E 50%,#CF6F82 100%)}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;font-family:"Source Sans 3","Helvetica Neue",Arial,sans-serif;font-size:18px;line-height:1.5;color:#111;background:var(--seite);
min-height:100vh;display:flex;flex-direction:column}
a{color:inherit}
:focus-visible{outline:3px solid var(--navy);outline-offset:3px}
.kopf{background:#fff;border-bottom:1px solid var(--linie)}
.kopf .innen{display:flex;align-items:center;justify-content:space-between;gap:16px;min-height:80px;padding-top:8px;padding-bottom:8px}
.kopf img{display:block;width:auto}
.kopf .fx{height:60px}.kopf .luh{height:40px}
.innen{width:100%;max-width:1040px;margin:0 auto;padding:0 24px}
.buehne{background:var(--verlauf);color:#fff}
.buehne .innen{padding-top:56px;padding-bottom:88px}
.kicker{margin:0 0 8px;font-size:17px;font-weight:600;opacity:.9}
h1{margin:0;font-size:clamp(34px,5vw,48px);line-height:1.1;font-weight:700}
.buehne p.lead{margin:12px 0 0;font-size:20px;max-width:36ch;opacity:.95}
main{flex:1}
.raster{list-style:none;padding:0;margin:-56px auto 0;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
.karte{position:relative;display:flex;flex-direction:column;height:100%;min-height:220px;padding:24px 24px 20px;background:#fff;
border:1px solid var(--linie);border-radius:14px;text-decoration:none;color:var(--navy);overflow:hidden;
box-shadow:0 1px 2px rgba(51,65,110,.06),0 8px 24px rgba(51,65,110,.08);transition:transform .15s,box-shadow .15s}
.karte::before{content:"";position:absolute;left:0;right:0;top:0;height:5px;background:var(--verlauf)}
.karte:hover{transform:translateY(-2px);box-shadow:0 2px 4px rgba(51,65,110,.08),0 14px 32px rgba(51,65,110,.14)}
.karte:active{transform:translateY(0)}
.nr{font-size:14px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--blau)}
.karte h2{margin:6px 0 8px;font-size:24px;line-height:1.2;font-weight:700;hyphens:auto;-webkit-hyphens:auto;overflow-wrap:break-word}
.karte p{margin:0;color:var(--grau);font-size:17px}
.los{margin-top:auto;padding-top:20px;display:inline-flex;align-items:center;gap:8px;font-weight:700;color:var(--navy)}
.los svg{width:20px;height:20px;transition:transform .15s}
.karte:hover .los svg{transform:translateX(4px)}
.abholen{margin:32px auto 0;display:flex;align-items:center;gap:20px;flex-wrap:wrap;padding:20px 24px;background:#fff;
border:1px solid var(--linie);border-left:5px solid var(--orange);border-radius:14px}
.abholen svg{width:36px;height:36px;flex:none;color:var(--orange)}
.abholen div{flex:1;min-width:220px}
.abholen h2{margin:0;font-size:20px;color:var(--navy)}
.abholen p{margin:2px 0 0;color:var(--grau);font-size:16px}
.knopf{display:inline-flex;align-items:center;min-height:48px;padding:10px 20px;border-radius:8px;background:var(--navy);color:#fff;
font-weight:700;text-decoration:none;white-space:nowrap}
.knopf:hover{background:#26315A}
.hinweis{margin:24px 0 0;color:var(--grau);font-size:15px}
.fuss{margin-top:56px;border-top:1px solid var(--linie);background:#fff}
.fuss .innen{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding-top:20px;padding-bottom:calc(20px + env(safe-area-inset-bottom))}
.fuss p{margin:0;color:var(--grau);font-size:14px;flex:1;min-width:240px}
@media(max-width:600px){.innen{padding:0 16px}.karte{min-height:0}.buehne .innen{padding-top:40px;padding-bottom:80px}.kopf .luh{height:30px}.kopf .fx{height:44px}}
@media(prefers-reduced-motion:reduce){*{transition:none!important}}
"""

PFEIL = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
         '<path d="M5 12h14M13 6l6 6-6 6"/></svg>')
DOKUMENT = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
            '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M12 11v6M9 14l3 3 3-3"/></svg>')


def startseite(kurs_dirs, ziel_dir):
    """dist/index.html: Startseite des Pi mit den Experimenten als Karten und dem Abholdienst."""
    ctx = Kontext(None)
    karten, fusszeile = [], ""
    for i, k in enumerate(kurs_dirs, 1):
        kurs = yaml.safe_load(open(os.path.join(k, "kurs.yml"), encoding="utf-8"))
        kid = kurs.get("id") or os.path.basename(os.path.normpath(k))
        fusszeile = fusszeile or kurs.get("fusszeile", "")
        sub = f'<p>{esc(kurs["untertitel"])}</p>' if kurs.get("untertitel") else ""
        karten.append(f'<li><a class="karte" href="{esc(kid)}/"><span class="nr">Experiment {i}</span>'
                      f'<h2>{esc(kurs["titel"])}</h2>{sub}<span class="los">Starten {PFEIL}</span></a></li>')
    os.makedirs(ziel_dir, exist_ok=True)
    l_fx, l_luh = logo("foexlab-logo.jpg", 400), logo("luh-logo.png", 400)
    logo_fx = f'<img class="fx" src="{l_fx}" alt="foeXlab Hannover">' if l_fx else "<strong>foeXlab</strong>"
    logo_luh = f'<img class="luh" src="{l_luh}" alt="Leibniz Universität Hannover">' if l_luh else ""
    css = font_css(ctx, ziel_dir) + STARTSEITE_CSS
    fuss = esc(fusszeile or "foeXlab · Leibniz Universität Hannover")
    seite = f"""<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#33416E">
<title>foeXlab – Experimente</title>
<style>{css}</style>
</head>
<body>
<header class="kopf"><div class="innen">{logo_fx}{logo_luh}</div></header>
<section class="buehne"><div class="innen">
<p class="kicker">Schülerlabor foeXlab</p>
<h1>Willkommen im Labor</h1>
<p class="lead">Wählt euer Experiment. Anleitung, Messwerte und Protokoll laufen hier im Labornetz.</p>
</div></section>
<main class="innen">
<ul class="raster">{"".join(karten)}</ul>
<aside class="abholen">{DOKUMENT}<div><h2>Protokoll abholen</h2>
<p>Ein Labor-iPad hat euch einen Abholcode gezeigt? Damit holt ihr das PDF auf euer eigenes Gerät.</p></div>
<a class="knopf" href="/abholen">Abholcode eingeben</a></aside>
<p class="hinweis">Meldet das iPad „Keine Internetverbindung“, einfach „Ohne Internet verwenden“ wählen.</p>
</main>
<footer class="fuss"><div class="innen"><p>{fuss}</p></div></footer>
</body>
</html>
"""
    open(os.path.join(ziel_dir, "index.html"), "w", encoding="utf-8").write(seite)
    for w in ctx.warnings: print("WARNUNG: " + w)
