from foexlab.fragen import render_q
from foexlab.seite import Kontext


def q(lines, cls=None):
    return dict(title="Materialliste", cls=cls or ["checkliste"], kv={}, id="a/k/material", lines=lines)


def test_checkliste_rendert_haken():
    h = render_q(Kontext("tests/py/daten/minikurs"), q(["Legt bereit:", "", "- Laser", "- Strahlteiler", "- Schirm"]), 1, 1)
    assert 'data-fx-art="checkliste"' in h
    assert h.count('type="checkbox"') == 3
    assert "Strahlteiler" in h and "Legt bereit:" in h
    assert "<ul>" not in h.split("fx-checkliste")[0]   # die Liste steht nicht doppelt im Fragetext


def test_checkliste_liste_block_gewinnt():
    h = render_q(Kontext("tests/py/daten/minikurs"), q(["Legt bereit:", "- Nicht", "- Gewertet", ":::liste", "Laser", "Schirm", ":::"]), 1, 1)
    assert h.count('type="checkbox"') == 2
    assert "Laser" in h and "Gewertet" not in h


def test_checkliste_sperrt_und_ohne_punkte_warnt():
    ctx = Kontext("tests/py/daten/minikurs")
    h = render_q(ctx, q(["Nur Text."], ["checkliste", "sperrt"]), 1, 1)
    assert 'data-fx-sperrt="1"' in h
    assert any("Checkliste" in w for w in ctx.warnings)


def test_checkliste_versuche_und_markdown_neben_liste_warnen():
    ctx = Kontext("tests/py/daten/minikurs")
    d = q(["Text", "- Nicht", ":::liste", "Laser", ":::"])
    d["kv"] = {"versuche": "2"}
    render_q(ctx, d, 1, 1)
    assert any("versuche wirkt bei Checklisten nicht" in w for w in ctx.warnings), ctx.warnings
    assert any("verdrängt" in w for w in ctx.warnings), ctx.warnings
