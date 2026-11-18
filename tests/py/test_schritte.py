from foexlab.bausteine import render_schritte
from foexlab.seite import Kontext

ACT = dict(title="Aufbau und Justage", cls=["schritte"], kv={}, id="justage/aufbau-und-justage", intro=["Geht Schritt für Schritt vor."], qs=[
    dict(title="Laser einstellen", cls=[], kv={}, lines=["Stellt die Justierhilfe …", '<video controls="true"><source src="media/a.mp4"></video>']),
    dict(title="Referenzhöhe finden", cls=[], kv={}, lines=["Text 2"]),
    dict(title="Spiegel", cls=[], kv={}, lines=["Text 3"]),
])


def test_drei_schritte():
    h = render_schritte(Kontext("tests/py/daten/minikurs"), ACT)
    assert h.count('class="fx-schritt"') == 3
    assert 'data-fx-art="schritte"' in h and 'data-fx-id="justage/aufbau-und-justage/schritte"' in h
    assert "Geht Schritt für Schritt vor." in h
    assert h.index("Laser einstellen") < h.index("Referenzhöhe finden")


def test_videos_laden_erst_bei_bedarf():
    h = render_schritte(Kontext("tests/py/daten/minikurs"), ACT)
    assert 'preload="none"' in h and "playsinline" in h and "autoplay" not in h


def test_schrittknoepfe_eindeutig_benannt():
    h = render_schritte(Kontext("tests/py/daten/minikurs"), ACT)
    assert ">Nächster Schritt<" in h and ">Schritt zurück<" in h
