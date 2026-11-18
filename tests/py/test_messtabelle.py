import html, json, re

from foexlab.bausteine import parse_spalten, parse_diagramm, render_baustein
from foexlab.seite import Kontext


def test_spalten_mit_formel():
    s = parse_spalten("dp | Druckdifferenz | mbar\ndN | Anzahl Wechsel dunkel–hell–dunkel |\nn = 1 + dN*lambda/(2*L) | Brechzahl |")
    assert s[0] == dict(kuerzel="dp", name="Druckdifferenz", einheit="mbar", formel=None)
    assert s[1]["einheit"] == "" and s[1]["formel"] is None
    assert s[2] == dict(kuerzel="n", name="Brechzahl", einheit="", formel="1 + dN*lambda/(2*L)")


def test_diagramm_standard_und_warnung():
    w = []
    assert parse_diagramm("x = dp, y = dN, ausgleich = ursprung", w) == dict(x="dp", y="dN", ausgleich="ursprung")
    assert parse_diagramm("x = dp\ny = dN", w)["ausgleich"] == "keiner"
    assert not w
    parse_diagramm("x = dp, y = dN, farbe = rot", w)
    assert w and "farbe" in w[0]


def test_render_konfig():
    q = dict(title="Messung", cls=["messtabelle"], kv={}, id="a/k/messung", lines=[
        "Tragt eure Werte ein.", ":::spalten", "dp | Druckdifferenz | mbar", "dN | Streifen |", ":::",
        ":::diagramm", "x = dp, y = dN, ausgleich = ursprung", ":::", ":::konstanten", "lambda = 532e-9", ":::"])
    h = render_baustein(Kontext("tests/py/daten/minikurs"), q, 1)
    assert 'data-fx-art="tabelle"' in h and "Tragt eure Werte ein." in h
    konfig = json.loads(html.unescape(re.search(r'data-fx-konfig="([^"]*)"', h).group(1)))
    assert konfig["diagramm"]["ausgleich"] == "ursprung"
    assert konfig["konstanten"] == {"lambda": 5.32e-07}
    assert [s["kuerzel"] for s in konfig["spalten"]] == ["dp", "dN"]
