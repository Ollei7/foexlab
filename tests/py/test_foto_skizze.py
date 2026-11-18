from foexlab.fragen import render_q
from foexlab.seite import Kontext


def test_foto_kamera_und_auswahl():
    q = dict(title="Foto vom Muster", cls=["foto"], kv={}, id="a/k/foto", lines=["Fotografiert das Muster."])
    h = render_q(Kontext("tests/py/daten/minikurs"), q, 1, 1)
    assert 'data-fx-art="foto"' in h
    assert 'capture="environment"' in h and h.count('accept="image/*"') == 2


def test_skizze_mit_vorlage_seitenverhaeltnis():
    q = dict(title="Strahlengang", cls=["skizze"], kv={"bild": "media/beispiel.png"}, id="a/k/s", lines=["Zeichnet ein."])
    h = render_q(Kontext("tests/py/daten/minikurs"), q, 1, 1)
    assert 'data-fx-art="skizze"' in h and "<canvas" in h
    assert 'src="media/beispiel.png"' in h
    assert "aspect-ratio:10/10" in h


def test_skizze_ohne_vorlage_4_zu_3():
    q = dict(title="Skizze", cls=["skizze"], kv={}, id="a/k/s2", lines=[])
    h = render_q(Kontext("tests/py/daten/minikurs"), q, 1, 1)
    assert "aspect-ratio:4/3" in h and "<img" not in h
