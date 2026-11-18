import os, re

from foexlab.seite import Kontext, baue, render_karteninhalt


def _karte(qs=None, intro=None, cls=None):
    return dict(title="K", cls=cls or [], kv={}, intro=intro or [], qs=qs or [], id="a/k")


def _q(titel, cls, lines, kv=None, id_="a/k/f"):
    return dict(title=titel, cls=cls, kv=kv or {}, lines=lines, id=id_)


def _html(a):
    ctx = Kontext(".")
    return render_karteninhalt(ctx, a, 0)[0], ctx


def test_loesung_in_frei_und_vermutung_und_mc():
    for cls, lines in ((["frei"], ["Frage", ":::loesung", "Die **Antwort**.", ":::"]),
                       (["vermutung"], ["Frage", ":::loesung", "Die **Antwort**.", ":::"]),
                       (["mc"], ["Frage", ":::antworten", "- [x] Ja", "- [ ] Nein", ":::", ":::loesung", "Die **Antwort**.", ":::"])):
        h, _ = _html(_karte([_q("F", cls, lines)]))
        assert 'class="fx-loesung-knopf"' in h and "Lösung anzeigen" in h
        assert re.search(r'<div class="fx-loesung" hidden>\s*<p>Die <strong>Antwort</strong>\.</p>', h), cls


def test_mehr_info_merksatz_im_intro_und_in_info_fragen():
    intro = ["Text davor.", "", ":::info", "Ein **Hinweis**.", ":::", "", ":::merksatz", "Merke dir das.", ":::", "", ":::mehr Mehr zum Thema", "Versteckter Text.", ":::", "Danach."]
    h, _ = _html(_karte(intro=intro))
    assert '<aside class="fx-info">' in h and "<strong>Hinweis</strong>" in h
    assert '<aside class="fx-merksatz">' in h
    assert '<details class="fx-mehr">' in h and "<summary>Mehr zum Thema</summary>" in h and "Versteckter Text." in h
    assert ":::" not in h
    h, _ = _html(_karte([_q("I", ["info"], ["Text", ":::merksatz", "Satz.", ":::"], id_="a/k/i")]))
    assert '<aside class="fx-merksatz">' in h


def test_info_in_beschreibung_und_schritten():
    h, _ = _html(_karte([_q("D", [], ["Text", ":::info", "Kasten.", ":::"], id_="a/k/d")]))
    assert '<aside class="fx-info">' in h
    h, _ = _html(_karte([_q("S1", [], ["Schritt", ":::info", "Kasten.", ":::"], id_="a/k/s")], cls=["schritte"]))
    assert '<aside class="fx-info">' in h


def test_umschalter():
    lines = [":::ansicht [+] Messapparat", "Erste **Ansicht**.", ":::", ":::ansicht [×] Messapparat", "Zweite Ansicht.", ":::"]
    h, _ = _html(_karte([_q("Messapparat", ["umschalter"], lines, id_="a/k/u")]))
    assert h.count('data-ansicht="') == 4        # zwei Knöpfe, zwei Ansichten
    assert '>[×] Messapparat</button>' in h and "Zweite Ansicht." in h
    assert 'data-fx-art' not in h                # kein Feld, kein Protokoll
    assert re.search(r'class="fx-ansicht-inhalt" data-ansicht="1" hidden', h)


def test_knopf():
    h, _ = _html(_karte([_q("Experiment abschließen", ["knopf"], ["Zum Schluss."], kv={"oeffnet": "abschluss", "id": "abschluss"}, id_="a/k/e")]))
    assert 'data-oeffnet="abschluss"' in h and 'data-knopf-id="abschluss"' in h and ">Experiment abschließen</button>" in h
    assert "Zum Schluss." in h and "data-fx-art" not in h


def test_werkzeug_feld_mit_konfig_und_warnung(tmp_path):
    meldungen = []
    baue("tests/py/daten/kurs_werkzeug", str(tmp_path / "w"), ausgabe=meldungen.append)
    h = (tmp_path / "w" / "index.html").read_text(encoding="utf-8")
    assert re.search(r'data-fx-art="b"[^>]*data-fx-konfig="\{[^"]*modus[^"]*eve', h)
    assert any("gibtesnicht" in m for m in meldungen) and not any("‚b‘" in m for m in meldungen)


def test_werkzeug_lader_reihenfolge(tmp_path):
    baue("tests/py/daten/kurs_werkzeug", str(tmp_path / "w"), ausgabe=lambda *_: None)
    js = (tmp_path / "w" / "app.js").read_text(encoding="utf-8")
    assert js.index("akern-Marke") < js.index("b-Marke") < js.index("Oberfläche: Übersicht")
    baue("tests/py/daten/kurs_werkzeug", str(tmp_path / "e.html"), einzeldatei=True, ausgabe=lambda *_: None)
    h = (tmp_path / "e.html").read_text(encoding="utf-8")
    assert h.index("akern-Marke") < h.index("b-Marke") < h.index("Oberfläche: Übersicht")
