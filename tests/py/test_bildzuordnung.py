import os, re

from foexlab.fragen import render_q
from foexlab.seite import Kontext

SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 500"><rect width="960" height="500" fill="#fff"/></svg>'
MARKEN = [":::marken", "480,250 = Spiegel", "96,50 = Laser", "= Ablenker", ":::"]


def _ctx(tmp_path, svg=SVG, name="schema.svg"):
    (tmp_path / "media").mkdir(exist_ok=True)
    (tmp_path / "media" / name).write_text(svg, encoding="utf-8")
    return Kontext(str(tmp_path))


def _q(cls, bild="schema.svg"):
    return dict(title="Schema", cls=cls, kv={"bild": bild}, id="kap/k/b", lines=["Ordne zu.", *MARKEN])


def test_svg_groesse_aus_viewbox(tmp_path):
    ctx = _ctx(tmp_path)
    h = render_q(ctx, _q(["bildzuordnung"]), 1, 1)
    assert 'style="left:50.00%;top:50.00%"' in h and 'style="left:10.00%;top:10.00%"' in h
    assert 'style="max-width:960px"' in h
    assert not ctx.warnings, ctx.warnings


def test_svg_groesse_aus_width_height(tmp_path):
    ctx = _ctx(tmp_path, '<svg xmlns="http://www.w3.org/2000/svg" width="960px" height="500"></svg>')
    h = render_q(ctx, _q(["bildzuordnung"]), 1, 1)
    assert 'left:50.00%;top:50.00%' in h and not ctx.warnings, ctx.warnings


def test_svg_ohne_groesse_warnt(tmp_path):
    ctx = _ctx(tmp_path, '<svg xmlns="http://www.w3.org/2000/svg"></svg>')
    render_q(ctx, _q(["bildzuordnung"]), 1, 1)
    assert any("schema.svg" in w for w in ctx.warnings), ctx.warnings


def test_ohne_ziehen_unveraendert(tmp_path):
    h = render_q(_ctx(tmp_path), _q(["bildzuordnung"]), 1, 1)
    assert "fx-ziehen" not in h and "fx-chip" not in h and "fx-ablage" not in h
    assert re.search(r'<div class="ddimg" style="max-width:960px"><img src="media/schema.svg" alt="">', h)


def test_ziehen_rendert_ablage(tmp_path):
    h = render_q(_ctx(tmp_path), _q(["bildzuordnung", "ziehen"]), 1, 1)
    assert '<div class="ddimg fx-ziehen"' in h
    assert h.count('class="fx-chip"') == 3
    assert [m for m in re.findall(r'data-v="([^"]*)"', h)] == ["Ablenker", "Laser", "Spiegel"]
    assert h.count('<select class="gap"') == 2 and 'class="fx-ablage"' in h


def test_svg_nur_ganze_attribute_der_wurzel_und_keine_prozente(tmp_path):
    ctx = _ctx(tmp_path, '<svg xmlns="http://www.w3.org/2000/svg" stroke-width="3" data-width="5"><g width="7" height="7"/></svg>')
    render_q(ctx, _q(["bildzuordnung"]), 1, 1)
    assert any("schema.svg" in w for w in ctx.warnings), ctx.warnings
    ctx = _ctx(tmp_path, '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 960 500"/>')
    h = render_q(ctx, _q(["bildzuordnung"]), 1, 1)
    assert "left:50.00%;top:50.00%" in h and not ctx.warnings, ctx.warnings
    ctx = _ctx(tmp_path, '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="50%"/>')
    render_q(ctx, _q(["bildzuordnung"]), 1, 1)
    assert ctx.warnings


def _kontext(tmp_path):
    return _ctx(tmp_path)


def test_kontrollfrage_ohne_auswahlliste_warnt_und_sperrt_nicht(tmp_path):
    from foexlab.seite import Kontext
    ctx = Kontext("tests/py/daten/minikurs")
    for cls, lines in ((["luecke", "sperrt"], ["Text ohne Lücke."]), (["zuordnung", "sperrt"], [":::paare", "kaputt", ":::"])):
        h = render_q(ctx, dict(title="Leer", cls=cls, kv={}, id="a/k/leer", lines=lines), 1, 1)
        assert "data-fx-kontrolle" not in h and "data-fx-sperrt" not in h
    assert sum("keine Auswahlliste" in w for w in ctx.warnings) == 2, ctx.warnings
    c2 = _ctx(tmp_path)
    q = _q(["bildzuordnung", "ziehen", "sperrt"]); q["lines"] = ["Ordne zu."]
    h = render_q(c2, q, 1, 1)
    assert "data-fx-kontrolle" not in h and any("keine Auswahlliste" in w for w in c2.warnings)


def test_kontrollfrage_mit_auswahlliste_bleibt_kontrolle(tmp_path):
    ctx = _ctx(tmp_path)
    h = render_q(ctx, _q(["bildzuordnung", "sperrt"]), 1, 1)
    assert 'data-fx-kontrolle="1"' in h and not ctx.warnings


def test_ziehen_ohne_bildzuordnung_warnt():
    from foexlab.seite import Kontext
    ctx = Kontext("tests/py/daten/minikurs")
    render_q(ctx, dict(title="Z", cls=["luecke", "ziehen"], kv={}, id="a/k/z", lines=["Ein {{Laser|LED}}."]), 1, 1)
    assert any("ziehen wirkt nur bei bildzuordnung" in w for w in ctx.warnings), ctx.warnings


def test_marken_dezimal_und_unlesbar(tmp_path):
    ctx = _ctx(tmp_path)
    q = _q(["bildzuordnung"]); q["lines"] = ["x", ":::marken", "480.5,250 = A", "kaputt", ":::"]
    h = render_q(ctx, q, 1, 1)
    assert 'left:50.05%' in h
    assert any("Markenzeile nicht lesbar" in w and "kaputt" in w for w in ctx.warnings), ctx.warnings


def test_spots_nummeriert(tmp_path):
    h = render_q(_ctx(tmp_path), _q(["bildzuordnung", "ziehen"]), 1, 1)
    assert 'data-nr="1"' in h and 'data-nr="2"' in h and 'data-nr="3"' not in h
