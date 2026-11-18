"""Skill foexlab-kurs: Beispielkurs besteht die Prüfung, Referenzen decken Format und Werkzeuge ab."""
import glob, os, re, sys

sys.path.insert(0, "tools")
import kurs_pruefen as kp

SKILL = ".claude/skills/foexlab-kurs"
BEISPIEL = os.path.join(SKILL, "referenz", "beispielkurs")


def lies(pfad):
    with open(pfad, encoding="utf-8") as f:
        return f.read()


def test_beispielkurs_bereit():
    b = kp.pruefe(BEISPIEL)   # mit den Tests des Beispielkurses
    assert [f"{x.text} ({x.ort})" for x in b.befunde] == [] and b.einrichtung == [] and b.bereit
    assert b.platzhalter, "der Beispielkurs zeigt auch einen Platzhalter"


def test_beispielkurs_zeigt_die_haeufigen_bausteine():
    text = "\n".join(lies(p) for p in sorted(glob.glob(os.path.join(BEISPIEL, "abschnitte", "*.md"))))
    for teil in ("{.vermutung", "{.messtabelle", ":::diagramm", "{.werkzeug", "{.luecke sperrt", ":::richtig", ":::falsch",
                 "{.mc sperrt", ":::lehrkraft", "{.platzhalter}", "oeffnet_nach:", "nachschlagen: true"):
        assert teil in text, teil
    assert glob.glob(os.path.join(BEISPIEL, "werkzeuge", "*.js"))
    assert glob.glob(os.path.join(BEISPIEL, "tests", "js", "*.test.js"))


def test_werkzeugliste_vollstaendig():
    """Jedes Werkzeug steht in werkzeuge.md (mzi) oder in einer WERKZEUGE.md eines Kurses."""
    kataloge = [os.path.join(SKILL, "referenz", "werkzeuge.md"), os.path.join(BEISPIEL, "WERKZEUGE.md")]
    kataloge += sorted(glob.glob("kurse/*/WERKZEUGE.md"))
    text = "\n".join(lies(p) for p in kataloge)
    fehlen = []
    for pfad in sorted(glob.glob("kurse/*/werkzeuge/*.js") + glob.glob(os.path.join(BEISPIEL, "werkzeuge", "*.js"))):
        stem = os.path.basename(pfad)[:-3]
        if "kern" in stem: continue
        if not re.search(r"`" + re.escape(stem) + r"`", text): fehlen.append(pfad)
    assert fehlen == [], f"weder in werkzeuge.md noch in kurse/<id>/WERKZEUGE.md genannt: {fehlen}"


def test_skill_frontmatter():
    text = lies(os.path.join(SKILL, "SKILL.md"))
    m = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    assert m, "SKILL.md beginnt mit Frontmatter"
    kopf = m.group(1)
    assert re.search(r"^name: foexlab-kurs$", kopf, re.M)
    d = re.search(r"^description: (.+)$", kopf, re.M)
    assert d and len(d.group(1)) > 50
    assert len(text.splitlines()) < 200
    for verweis in re.findall(r"referenz/[\w./-]+", text):
        assert os.path.exists(os.path.join(SKILL, verweis.rstrip("./"))), verweis


def test_bausteine_referenz_deckt_format():
    fmt = lies("docs/FORMAT.md")
    ref = lies(os.path.join(SKILL, "referenz", "bausteine.md"))
    klassen, bloecke = set(), set()
    for zeile in fmt.splitlines():
        if not zeile.startswith("|"): continue
        for gruppe in re.findall(r"\{([^}]*)\}", zeile):
            klassen.update(re.findall(r"(?:^|\s)\.([a-z]+)", gruppe))
        klassen.update(re.findall(r"`\.([a-z]+)`", zeile))
        bloecke.update(re.findall(r":::([a-z_]+)", zeile))
    klassen -= {"svg", "png", "jpg"}   # Dateiendungen im Text, keine Bausteine
    assert len(klassen) > 20 and len(bloecke) > 8
    fehlen = sorted(k for k in klassen if not re.search(r"\." + k + r"\b", ref))
    fehlen += sorted(":::" + b for b in bloecke if ":::" + b not in ref)
    assert fehlen == [], f"in bausteine.md fehlt: {fehlen}"
