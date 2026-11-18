from foexlab.fragen import render_q
from foexlab.seite import Kontext


def q(lines, cls=None):
    return dict(title="Interferometer", cls=cls or ["platzhalter"], kv={}, id="a/k/sim", lines=lines)


def test_platzhalter_rendert_hinweis():
    h = render_q(Kontext("tests/py/daten/minikurs"), q(["Hier entsteht die Simulation des Aufbaus."]), 1, 1)
    assert 'class="q fx-baustein fx-platzhalter"' in h and 'data-fx-platzhalter="1"' in h
    assert "Interferometer" in h and "Diese Simulation folgt noch." in h
    assert "Hier entsteht die Simulation des Aufbaus." in h


def test_platzhalter_ist_kein_feld():
    h = render_q(Kontext("tests/py/daten/minikurs"), q(["Text"]), 1, 1)
    assert "data-fx-art" not in h and "data-fx-id" not in h and "data-fx-sperrt" not in h


def test_platzhalter_mit_sperrt_warnt():
    ctx = Kontext("tests/py/daten/minikurs")
    h = render_q(ctx, q(["Text"], ["platzhalter", "sperrt"]), 1, 1)
    assert any("Platzhalter kann nichts sperren" in w for w in ctx.warnings), ctx.warnings
    assert "sperrt" not in h and "data-fx-art" not in h
