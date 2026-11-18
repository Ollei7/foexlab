import re

from foexlab.seite import Kontext, render_karteninhalt


def _karte(cls, titel="Frage"):
    q = dict(title=titel, cls=cls, kv={}, lines=["Beantworte das."], id="a/k/f")
    return dict(title="K", cls=[], kv={}, intro=[], qs=[q], id="a/k")


def _html(cls):
    ctx = Kontext(".")
    return render_karteninhalt(ctx, _karte(cls), 0)[0]


def test_frei_hat_tippen_und_stift():
    h = _html(["frei"])
    assert 'data-start="tippen"' in h
    assert 'data-modus="tippen"' in h and 'data-modus="stift"' in h
    assert '<textarea class="essay fx-text"' in h and "<canvas>" in h
    for b in ("Rückgängig", "Wiederholen", "+ mehr Platz", "Nur Apple Pencil", "Radierer"):
        assert b in h
    for o in ("Linien", "Karo"):
        assert o in h


def test_frei_stift_startet_im_stiftmodus():
    assert 'data-start="stift"' in _html(["frei", "stift"])


def test_vermutung_hat_denselben_aufbau():
    h = _html(["vermutung"])
    assert 'data-fx-art="vermutung"' in h and 'data-modus="stift"' in h
    assert 'data-start="stift"' in _html(["vermutung", "stift"])
