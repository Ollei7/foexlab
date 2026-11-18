from foexlab.fragen import render_q
from foexlab.quelle import parse_attrs, split_blocks
from foexlab.seite import Kontext


def test_tipps_als_liste():
    _, blk = split_blocks(["Text", ":::tipp", "Erst A", ":::", ":::tipp", "Dann B", ":::", ":::hinweis", "H", ":::"])
    assert blk["tipp"] == ["Erst A", "Dann B"] and blk["hinweis"] == "H"


def test_tipps_gerendert_in_reihenfolge():
    q = dict(title="F", cls=["frei"], kv={}, id="a/k/f", lines=["Frage", ":::tipp", "Erst A", ":::", ":::tipp", "Dann B", ":::"])
    h = render_q(Kontext("tests/py/daten/minikurs"), q, 1, 1)
    assert h.count('class="fx-tipp"') == 2
    assert h.index("Tipp 1") < h.index("Erst A") < h.index("Tipp 2") < h.index("Dann B")


def test_vermutung_mit_sperre():
    cls, kv = parse_attrs(".vermutung sperrt")
    assert cls == ["vermutung", "sperrt"]
    q = dict(title="Eure Vermutung", cls=cls, kv=kv, id="a/k/v", lines=["Was passiert?"])
    h = render_q(Kontext("tests/py/daten/minikurs"), q, 1, 1)
    assert 'data-fx-art="vermutung"' in h and 'data-fx-sperrt="1"' in h and "<textarea" in h
