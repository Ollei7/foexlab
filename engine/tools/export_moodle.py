#!/usr/bin/env python3
"""Moodle-Backup (entpackt) -> Markdown-Quellordner (ein .md je Abschnitt + media/)."""
import html, io, os, re, shutil, sys, unicodedata, urllib.parse
from html.parser import HTMLParser
import xml.etree.ElementTree as ET
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from foexlab.bereinigen import bereinige  # noqa: E402

SRC, DST = sys.argv[1], sys.argv[2]
P = lambda *a: os.path.join(SRC, *a)
root = lambda f: ET.parse(P(f)).getroot()
os.makedirs(os.path.join(DST, "abschnitte"), exist_ok=True)
os.makedirs(os.path.join(DST, "media"), exist_ok=True)

# ------------------------------------------------------------ Dateien
files, by_name, meta = {}, {}, {}
for x in root("files.xml"):
    fn = x.findtext("filename")
    if fn == "." or x.findtext("component") in ("assignfeedback_editpdf", "assignsubmission_file", "user"):
        continue
    h = x.findtext("contenthash")
    files[(x.findtext("component"), x.findtext("filearea"), x.findtext("itemid"), x.findtext("contextid"), fn)] = h
    by_name.setdefault(fn, h)
    meta[h] = (fn, x.findtext("mimetype"))

MAX_COPY_MB = float(os.environ.get("MAX_COPY_MB", 50))
large_skipped = []
media_of = {}     # hash -> Dateiname in media/
used_names = {}   # Dateiname -> hash

def safe(fn):
    fn = unicodedata.normalize("NFC", fn)
    return re.sub(r"[^\w.\-]+", "-", fn).strip("-")

def copy_media(h, keep_raw=False):
    if h in media_of:
        return media_of[h]
    fn, mime = meta[h]
    name = safe(fn)
    size = os.path.getsize(P("files", h[:2], h))
    if size > MAX_COPY_MB * 1e6:       # sehr große Dateien (Videos) nicht in den Quellordner kopieren
        large_skipped.append((name, size)); media_of[h] = name
        return name
    data = open(P("files", h[:2], h), "rb").read()
    if mime.startswith("image/") and mime != "image/svg+xml" and not keep_raw:
        im = Image.open(io.BytesIO(data)); im.load()
        if max(im.size) > 1600:
            im.thumbnail((1600, 1600), Image.LANCZOS)
            buf = io.BytesIO()
            if name.lower().endswith((".jpg", ".jpeg")):
                im.convert("RGB").save(buf, "JPEG", quality=85)
            elif im.mode == "RGBA" and im.getchannel("A").getextrema()[0] < 255:
                im.save(buf, "PNG", optimize=True)
            else:
                name = os.path.splitext(name)[0] + ".jpg"
                im.convert("RGB").save(buf, "JPEG", quality=85)
            data = buf.getvalue()
    base, ext = os.path.splitext(name); i = 2
    while name in used_names and used_names[name] != h:
        name = f"{base}-{i}{ext}"; i += 1
    used_names[name] = h
    open(os.path.join(DST, "media", name), "wb").write(data)
    media_of[h] = name
    return name

def find_file(name, comp=None, area=None, itemid=None):
    for k, h in files.items():
        if k[4] == name and (comp is None or k[0] == comp) and (area is None or k[1] == area) and (itemid is None or k[2] == str(itemid)):
            return h
    return by_name.get(name)

import base64, hashlib
inline_imgs = {}
def save_inline(m):
    mime, b64 = m.group(1), m.group(2)
    data = base64.b64decode(b64)
    key = hashlib.sha1(data).hexdigest()
    if key not in inline_imgs:
        ext = {"jpeg": "jpg", "svg+xml": "svg"}.get(mime.split("/")[1], mime.split("/")[1])
        name = f"eingebettet-{len(inline_imgs) + 1:02d}.{ext}"
        if mime in ("image/png", "image/jpeg"):
            im = Image.open(io.BytesIO(data)); im.load()
            if max(im.size) > 1600:
                im.thumbnail((1600, 1600), Image.LANCZOS); buf = io.BytesIO()
                im.save(buf, "PNG" if ext == "png" else "JPEG"); data = buf.getvalue()
        open(os.path.join(DST, "media", name), "wb").write(data)
        inline_imgs[key] = name
    return f'src="media/{inline_imgs[key]}"'

def fix_urls(t, comp=None, area=None, itemid=None):
    t = re.sub(r'src="data:(image/[\w+.-]+);base64,([^"]+)"', save_inline, t or "")
    def sub(m):
        name = urllib.parse.unquote(m.group(2).split("?")[0])
        h = find_file(name, comp, area, itemid) or find_file(name)
        return f'{m.group(1)}="media/{copy_media(h)}"' if h else m.group(0)
    return re.sub(r'(src|href)="@@PLUGINFILE@@/([^"]*)"', sub, t or "")

# ------------------------------------------------------------ HTML -> Markdown
VOID = {"br", "img", "source", "hr", "input", "meta", "link", "col"}
class N:
    def __init__(s, tag, attrs=None): s.tag, s.attrs, s.kids = tag, dict(attrs or []), []
class T(str): pass

class TreeB(HTMLParser):
    def __init__(s):
        super().__init__(convert_charrefs=True); s.root = N("root"); s.st = [s.root]
    def handle_starttag(s, tag, attrs):
        n = N(tag, attrs); s.st[-1].kids.append(n)
        if tag not in VOID: s.st.append(n)
    def handle_startendtag(s, tag, attrs): s.st[-1].kids.append(N(tag, attrs))
    def handle_endtag(s, tag):
        for i in range(len(s.st) - 1, 0, -1):
            if s.st[i].tag == tag:
                del s.st[i:]; return
    def handle_data(s, d): s.st[-1].kids.append(T(d))

MATH = re.compile(r"(\\\(.*?\\\)|\\\[.*?\\\])", re.S)
def esc_text(t):
    out = []
    for i, part in enumerate(MATH.split(t)):
        if i % 2:
            out.append(re.sub(r"\s+", " ", part))
        else:
            part = part.replace("\xad", "").replace("\xa0", " ").replace("&", "&amp;").replace("<", "&lt;")
            part = re.sub(r"\s+", " ", part).replace("*", r"\*").replace("_", r"\_")
            out.append(part)
    return "".join(out)

def raw(n):
    if isinstance(n, T):
        return html.escape(str(n), quote=False)
    a = "".join(f' {k}="{html.escape(v or "", quote=True)}"' if v is not None else f" {k}" for k, v in n.attrs.items())
    if n.tag in VOID:
        return f"<{n.tag}{a}>"
    kids = n.kids
    if n.tag == "video":
        kids = [k for k in kids if not isinstance(k, T)]
    return f"<{n.tag}{a}>" + "".join(raw(k) for k in kids) + f"</{n.tag}>"

RAWTAGS = {"video", "audio", "iframe", "object", "embed", "svg", "table"}
KEEPINLINE = {"u", "sub", "sup", "small", "mark", "kbd"}
BLOCK = {"p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote", "table", "pre", "hr", "figure", "section"} | RAWTAGS

def inline(n):
    if isinstance(n, T):
        return esc_text(str(n))
    t = n.tag
    if t == "br": return "  \n"
    if t == "img":
        src, alt = n.attrs.get("src", ""), (n.attrs.get("alt") or "").replace("]", "")
        if n.attrs.get("width") or n.attrs.get("height"):
            return raw(N("img", {k: v for k, v in n.attrs.items() if k in ("src", "alt", "width", "height")}))
        return f"![{alt}]({src})"
    if t in RAWTAGS: return raw(n)
    inner = "".join(inline(k) for k in n.kids)
    if t in ("strong", "b", "em", "i"):
        if not inner.strip() or not re.search(r"[^\W_]", re.sub(r"!\[[^\]]*\]\([^)]*\)|<[^>]*>", "", inner)): return inner
        m = "**" if t in ("strong", "b") else "*"
        lead = inner[:len(inner) - len(inner.lstrip())]; trail = inner[len(inner.rstrip()):]
        core = inner.strip()
        if core.startswith(m) and core.endswith(m) and len(core) > 2 * len(m): return inner
        core = core.replace("  \n", f"{m}  \n{m}")
        return f"{lead}{m}{core}{m}{trail}"
    if t == "a":
        h = n.attrs.get("href", "")
        if not h: return inner
        lead = " " if inner[:1] == " " else ""; trail = " " if inner[-1:] == " " else ""
        return f"{lead}[{inner.strip() or h}]({h}){trail}"
    if t in KEEPINLINE: return f"<{t}>{inner}</{t}>"
    if t == "code": return f"`{inner}`"
    if t == "span" and "color" in (n.attrs.get("style") or ""):
        c = re.search(r"(?<!-)color:\s*([^;\"]+)", n.attrs["style"])
        return f'<span style="color:{c.group(1).strip()}">{inner}</span>' if c else inner
    return inner

def clean_inline(s):
    s = re.sub(r"[ \t]*\n[ \t]*", "\n", s)
    s = re.sub(r"(  \n)+", "  \n", s)
    s = re.sub(r"^(\s*  \n)+|(  \n\s*)+$", "", s)
    return s.strip()

def blocks(nodes, depth=0):
    out, run = [], []
    def flush():
        s = clean_inline("".join(run)); run.clear()
        if s and s != "&nbsp;": out.append(esc_lead(s))
    for n in nodes:
        if isinstance(n, T) or n.tag not in BLOCK:
            run.append(inline(n)); continue
        flush()
        t = n.tag
        if t in ("div", "section", "figure"): out += blocks(n.kids, depth)
        elif t == "p":
            s = clean_inline("".join(inline(k) for k in n.kids))
            if s: out.append(esc_lead(s))
        elif re.fullmatch(r"h[1-6]", t):
            s = clean_inline("".join(inline(k) for k in n.kids)).replace("**", "")
            if s: out.append(("#### " if int(t[1]) <= 3 else "##### ") + s)
        elif t in ("ul", "ol"): out.append(render_list(n, depth))
        elif t == "li": out += blocks(n.kids, depth)
        elif t == "blockquote": out.append("\n".join("> " + l for l in "\n\n".join(blocks(n.kids)).splitlines()))
        elif t == "hr": out.append("---")
        elif t == "pre": out.append("```\n" + "".join(str(k) if isinstance(k, T) else "" for k in n.kids) + "\n```")
        else: out.append(raw(n))
    flush()
    return out

def esc_lead(s):
    return re.sub(r"^(#|>|[-+]\s|\d+[.)]\s)", lambda m: "\\" + m.group(1), s)

def render_list(n, depth):
    lines, i = [], 0
    for li in n.kids:
        if isinstance(li, T) or li.tag != "li": continue
        i += 1
        mark = f"{i}." if n.tag == "ol" else "-"
        inl = [k for k in li.kids if isinstance(k, T) or k.tag not in ("ul", "ol")]
        sub = [k for k in li.kids if not isinstance(k, T) and k.tag in ("ul", "ol")]
        text = clean_inline("".join(inline(k) for k in inl)) or ""
        lines.append(f"{mark} {text}")
        for s in sub:
            lines.append("\n".join("    " + l for l in render_list(s, depth + 1).splitlines()))
    return "\n".join(lines)

def h2m(t, comp=None, area=None, itemid=None, inline_only=False):
    t = fix_urls(t, comp, area, itemid)
    if not t or not t.strip(): return ""
    p = TreeB(); p.feed(t); p.close()
    if inline_only:
        return clean_inline("".join(inline(k) for k in p.root.kids).replace("  \n", " ")) if p.root.kids else ""
    return "\n\n".join(b for b in blocks(p.root.kids) if b.strip())

# ------------------------------------------------------------ Fragen
bank, bank_cat = {}, {}
for e in root("questions.xml").iter("question_bank_entry"):
    best = None
    for qv in e.iter("question_versions"):
        v = int(qv.findtext("version") or 1); q = qv.find("questions/question")
        if q is not None and (best is None or v > best[0]): best = (v, q)
    if best:
        bank[e.get("id")] = best[1]; bank_cat[e.get("id")] = e.findtext("questioncategoryid")
cat_names = {c.get("id"): c.findtext("name") for c in root("questions.xml").iter("question_category")}

DEFAULTS = {"Die Antwort ist richtig.", "Die Antwort ist teilweise richtig.", "Die Antwort ist falsch.",
            "Your answer is correct.", "Your answer is partially correct.", "Your answer is incorrect."}

def fr_tag(fr):
    if abs(fr - 1) < 1e-6: return "[x]"
    if abs(fr) < 1e-6: return "[ ]"
    return f"[{round(fr * 100)}%]"

def fb_inline(t, *ctx):
    return h2m(t, *ctx, inline_only=True)

def overall(q, node):
    out = []
    for tag, name in (("correctfeedback", "richtig"), ("partiallycorrectfeedback", "teilweise"), ("incorrectfeedback", "falsch")):
        t = (node.findtext(tag) or "").strip() if node is not None else ""
        if t and t not in DEFAULTS:
            out.append(f":::{name}\n{h2m(t, 'question', tag, q.get('id'))}\n:::")
    return out

def export_question(q):
    qid, qt = q.get("id"), q.findtext("qtype")
    name = q.findtext("name") or ""
    stem = h2m(q.findtext("questiontext"), "question", "questiontext", qid)
    gf = h2m(q.findtext("generalfeedback"), "question", "generalfeedback", qid)
    extra = []
    attrs = ""
    if qt == "description":
        head, body = f"### {name} {{.info}}", stem
    elif qt == "essay":
        head, body = f"### {name} {{.frei}}", stem
    elif qt == "multichoice":
        node = q.find("plugin_qtype_multichoice_question")
        lines = []
        for a in node.iter("answer"):
            t = fb_inline(a.findtext("answertext"), "question", "answer", a.get("id")) or "–"
            f = fb_inline(a.findtext("feedback"), "question", "answerfeedback", a.get("id"))
            lines.append(f"- {fr_tag(float(a.findtext('fraction')))} {t}" + (f" || {f}" if f else ""))
        single = node.findtext("multichoice/single") == "1"
        head = f"### {name} {{.mc{'' if single else ' .mehrfach'}}}"
        body = stem
        extra.append(":::antworten\n" + "\n".join(lines) + "\n:::")
        extra += overall(q, node.find("multichoice"))
    elif qt == "match":
        node = q.find("plugin_qtype_match_question")
        lines = []
        for m in node.iter("match"):
            l = fb_inline(m.findtext("questiontext"), "qtype_match", "subquestion", m.get("id"))
            lines.append(f"{l} => {m.findtext('answertext') or ''}".strip())
        head, body = f"### {name} {{.zuordnung}}", stem
        extra.append(":::paare\n" + "\n".join(lines) + "\n:::")
        extra += overall(q, node.find("matchoptions"))
    elif qt in ("gapselect", "ddwtos"):
        node = q.find(f"plugin_qtype_{qt}_question")
        ans = []
        for a in node.find("answers").findall("answer"):
            fb = a.findtext("feedback") or ""
            g = re.search(r'"draggroup";s:\d+:"(\d+)"', fb)
            ans.append(((a.findtext("answertext") or "").strip(), g.group(1) if g else fb.strip()))
        def gap(m):
            n = int(m.group(1))
            if n > len(ans): return m.group(0)
            t, g = ans[n - 1]
            opts = [t] + [t2 for t2, g2 in ans if g2 == g and t2 != t]
            return "GAPOPEN" + "|".join(dict.fromkeys(opts)) + "GAPCLOSE"
        stem2 = re.sub(r"\[\[(\d+)\]\]", gap, q.findtext("questiontext") or "")
        stem2 = h2m(stem2, "question", "questiontext", qid).replace("GAPOPEN", "{{").replace("GAPCLOSE", "}}")
        head, body = f"### {name} {{.luecke}}", stem2
        extra += overall(q, node.find(qt))
    elif qt == "shortanswer":
        node = q.find("plugin_qtype_shortanswer_question")
        lines = []
        for a in node.iter("answer"):
            fr = float(a.findtext("fraction")); f = fb_inline(a.findtext("feedback"), "question", "answerfeedback", a.get("id"))
            pre = "=" if abs(fr - 1) < 1e-6 else f"= [{round(fr * 100)}%]"
            lines.append(f"{pre} {a.findtext('answertext')}" + (f" || {f}" if f else ""))
        uc = node.findtext("shortanswer/usecase") == "1"
        head, body = f"### {name} {{.kurz{' .gross' if uc else ''}}}", stem
        extra.append(":::antworten\n" + "\n".join(lines) + "\n:::")
    elif qt == "numerical":
        node = q.find("plugin_qtype_numerical_question")
        tol = {r.findtext("answer"): float(r.findtext("tolerance") or 0) for r in node.iter("numerical_record")}
        lines = []
        for a in node.find("answers").findall("answer"):
            fr = float(a.findtext("fraction")); f = fb_inline(a.findtext("feedback"), "question", "answerfeedback", a.get("id"))
            tl = tol.get(a.get("id"), 0)
            pre = "=" if abs(fr - 1) < 1e-6 else f"= [{round(fr * 100)}%]"
            lines.append(f"{pre} {a.findtext('answertext')}" + (f" ± {tl:g}" if tl else "") + (f" || {f}" if f else ""))
        units = [u.findtext("unit") for u in node.iter("numerical_unit") if u.findtext("unit")]
        head, body = f'### {name} {{.zahl{f" einheit={chr(34)}{units[0]}{chr(34)}" if units else ""}}}', stem
        extra.append(":::antworten\n" + "\n".join(lines) + "\n:::")
    elif qt == "ddimageortext":
        node = q.find("plugin_qtype_ddimageortext_question")
        bg = next((h for k, h in files.items() if k[1] == "bgimage" and k[2] == str(qid)), None)
        bgname = copy_media(bg, keep_raw=True) if bg else ""
        drags = {d.findtext("no"): d.findtext("label") or "" for d in node.iter("drag")}
        lines, placed = [], set()
        for d in node.iter("drop"):
            lab = drags.get(d.findtext("choice"), ""); placed.add(lab)
            lines.append(f"{d.findtext('xleft')},{d.findtext('ytop')} = {lab}")
        for lab in dict.fromkeys(drags.values()):
            if lab not in placed: lines.append(f"= {lab}")
        head, body = f'### {name} {{.bildzuordnung bild="{bgname}"}}', stem
        extra.append(":::marken\n" + "\n".join(lines) + "\n:::")
        extra += overall(q, node.find("ddimageortext"))
    else:
        head, body = f"### {name} {{.unbekannt}}", stem
    if gf:
        extra.append(f":::hinweis\n{gf}\n:::")
    return "\n\n".join([head] + ([body] if body.strip() else []) + extra)

# ------------------------------------------------------------ Kurs
course = root("course/course.xml")
title = course.findtext("fullname") or "Moodle-Kurs"
sections = []
for d in sorted(os.listdir(P("sections"))):
    if not os.path.isdir(P("sections", d)): continue
    s = root(f"sections/{d}/section.xml")
    sections.append(dict(id=s.get("id"), num=int(s.findtext("number")), name=(s.findtext("name") or "").strip(),
                         summary=s.findtext("summary") or "", seq=[x for x in (s.findtext("sequence") or "").split(",") if x]))
sections.sort(key=lambda s: s["num"])
mods = {d.rsplit("_", 1)[1]: (d.rsplit("_", 1)[0], d) for d in os.listdir(P("activities")) if os.path.isdir(P("activities", d))}

def slug(s):
    s = unicodedata.normalize("NFKD", s.lower().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss"))
    return re.sub(r"[^a-z0-9]+", "-", s.encode("ascii", "ignore").decode()).strip("-") or "abschnitt"

used_entries = set()
written = []
for s in sections:
    acts = []
    for mid in s["seq"]:
        if mid not in mods: continue
        typ, d = mods[mid]
        vis = root(f"activities/{d}/module.xml").findtext("visible") == "1"
        el = root(f"activities/{d}/{typ}.xml")
        cls = "" if vis else " .versteckt"
        ctx = el.get("contextid")
        if typ == "quiz":
            z = el.find("quiz")
            parts = [f"## {z.findtext('name')} {{.test{cls}}}"]
            intro = h2m(z.findtext("intro"), "mod_quiz", "intro", "0")
            if intro: parts.append(intro)
            for sl in sorted(z.iter("question_instance"), key=lambda i: int(i.findtext("slot"))):
                ref = sl.find("question_reference/questionbankentryid")
                q = bank.get(ref.text) if ref is not None else None
                if q is None: continue
                used_entries.add(ref.text); parts.append(export_question(q))
            acts.append("\n\n".join(parts))
        elif typ in ("assign", "resource"):
            a = el.find(typ)
            parts = [f"## {a.findtext('name')} {{.{'aufgabe' if typ == 'assign' else 'material'}{cls}{'' if typ == 'assign' else ' .einbetten'}}}"]
            intro = h2m(a.findtext("intro"), f"mod_{typ}", "intro", "0")
            if intro: parts.append(intro)
            area = "introattachment" if typ == "assign" else "content"
            fl = [f"media/{copy_media(h)}" for k, h in files.items() if k[0] == f"mod_{typ}" and k[1] == area and k[3] == ctx]
            if fl: parts.append(":::dateien\n" + "\n".join(fl) + "\n:::")
            acts.append("\n\n".join(parts))
    summ = h2m(s["summary"], "course", "section", s["id"])
    if not acts and not summ: continue
    fn = f"{s['num']:02d}-{slug(s['name'])}.md"
    fm = f"---\ntitel: \"{s['name'] or 'Abschnitt ' + str(s['num'])}\"\nnr: {s['num']}\n---\n\n"
    open(os.path.join(DST, "abschnitte", fn), "w", encoding="utf-8").write(bereinige(fm + (summ + "\n\n" if summ else "") + "\n\n".join(acts) + "\n"))
    written.append(fn)

# Anhang: nicht eingebundene Fragen, nach Kategorie
bycat = {}
for eid, q in sorted(bank.items(), key=lambda t: int(t[0])):
    if eid not in used_entries:
        bycat.setdefault((lambda n: "Weitere Fragen" if n in (None, "top") else n)(cat_names.get(bank_cat[eid])), []).append(q)
if bycat:
    parts = ['---\ntitel: "Fragensammlung (in keinem Test eingebunden)"\nnr: "+"\n---\n']
    for cat, qs in bycat.items():
        parts.append(f"## {cat} {{.test}}\n\n" + "\n\n".join(export_question(q) for q in qs))
    open(os.path.join(DST, "abschnitte", "99-fragensammlung.md"), "w", encoding="utf-8").write(bereinige("\n".join(parts) + "\n"))
    written.append("99-fragensammlung.md")

if not os.path.exists(os.path.join(DST, "kurs.yml")):
    open(os.path.join(DST, "kurs.yml"), "w", encoding="utf-8").write(f'titel: "{title}"\nuntertitel: ""\nkennung: "foeXlab · Quantum Frontiers · Leibniz Universität Hannover"\nfusszeile: ""\nid: "{os.path.basename(os.path.normpath(DST))}"\nmusterloesungen: false\n')
print("OK", written, f"{len(media_of)} Mediendateien")
for n, sz in large_skipped: print(f"NICHT KOPIERT (>{MAX_COPY_MB:g} MB, bei Bedarf manuell nach media/ legen): {n} ({sz / 1e6:.0f} MB)")
