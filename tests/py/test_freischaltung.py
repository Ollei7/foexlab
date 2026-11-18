import html, json, re

import pytest

from foexlab.seite import baue

KURS = """titel: Testkurs
id: tk
"""
LERN = """---
titel: Lernblatt
nr: 0
---
## Mein Vorwissen
### Frage eins {.frei sperrt}
Was?
### Notizen {.frei optional}
Frei.
"""
KAP1 = """---
titel: Erstes Kapitel
nr: 1
oeffnet_nach: felder:lern/mein-vorwissen
grund: Öffnet sich, wenn alle Fragen im Lernblatt beantwortet sind.
---
## Lesen
Text.
## Verständnisfragen {.quiz oeffnet="kap2"}
### F1 {.mc}
Frage?
:::antworten
- [x] Ja
- [ ] Nein
:::
"""
KAP2 = """---
titel: Zweites Kapitel
nr: 2
oeffnet_nach: quiz:kap1/verstaendnisfragen
---
## Erste Karte
Text.
## Gesperrte Karte {.test oeffnet_nach="quiz:kap1/verstaendnisfragen" grund="Erst das Quiz."}
Text.
## Noch eine Karte
Text.
### Abschließen {.knopf oeffnet="kap3" id="ende"}
Text.
"""
KAP3 = """---
titel: Drittes Kapitel
nr: 3
oeffnet_nach: knopf:ende
---
## Letzte Karte
Text.
"""
NACH = """---
titel: Nachschlageteil
nr: 9
nachschlagen: true
---
## Überblick
Nachschlagen.
"""


@pytest.fixture(scope="module")
def seite(tmp_path_factory):
    k = tmp_path_factory.mktemp("kurs") / "tk"
    (k / "abschnitte").mkdir(parents=True)
    (k / "kurs.yml").write_text(KURS, encoding="utf-8")
    for n, t in (("00-lern.md", LERN), ("01-kap1.md", KAP1), ("02-kap2.md", KAP2), ("03-kap3.md", KAP3), ("90-nach.md", NACH)):
        (k / "abschnitte" / n).write_text(t, encoding="utf-8")
    ziel = tmp_path_factory.mktemp("out") / "o"
    baue(str(k), str(ziel), ausgabe=lambda *_: None)
    h = (ziel / "index.html").read_text(encoding="utf-8")
    m = re.search(r'<script type="application/json" id="fx-regeln">(.*?)</script>', h, re.S)
    return h, json.loads(m.group(1))


def test_regeln_im_json(seite):
    _, r = seite
    a = r["abschnitte"]
    assert a["kap1"]["oeffnet_nach"] == "felder:lern/mein-vorwissen"
    assert a["kap1"]["grund"] == "Öffnet sich, wenn alle Fragen im Lernblatt beantwortet sind."
    assert a["kap2"]["grund"] == "Öffnet sich, wenn ‚Verständnisfragen‘ vollständig richtig beantwortet ist."
    assert a["kap3"]["grund"] == "Öffnet sich über ‚Abschließen‘."
    assert a["nach"]["nachschlagen"] is True
    assert "oeffnet_nach" not in a["lern"]


def test_kartenregeln_und_zuordnung(seite):
    _, r = seite
    assert r["kartenregeln"]["kap2/gesperrte-karte"] == {"oeffnet_nach": "quiz:kap1/verstaendnisfragen", "grund": "Erst das Quiz."}
    assert r["karten"]["kap2/erste-karte"] == "kap2"
    assert r["karten"]["nach/ueberblick"] == "nach"


def test_nachschlagen_unter_eigener_ueberschrift(seite):
    h, _ = seite
    i = h.index("Zum Nachschlagen")
    assert "Nachschlageteil" in h[i:] and "Nachschlageteil" not in h[:i].split('id="fx-start"')[1]
    assert 'data-nachschlagen="1"' in h


def test_sperrt_und_optional_attribute(seite):
    h, _ = seite
    assert 'data-fx-art="text" data-fx-sperrt="1"' in h or 'data-fx-sperrt="1"' in h
    assert h.count('data-fx-sperrt="1"') == 1 and h.count('data-fx-optional="1"') == 1


def test_gesperrte_ansicht_und_betreuungsmodus_vorhanden(seite):
    h, _ = seite
    assert 'id="fx-gesperrt"' in h and "Zur Übersicht" in h
