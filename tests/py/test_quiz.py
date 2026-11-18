import json, re

from foexlab.seite import Kontext, render_karteninhalt


def _karte(n=4, mit_nach=True):
    qs = []
    for i in range(n):
        lines = ["Frage %d?" % i, ":::antworten", "- [x] Richtig || Weil.", "- [ ] Falsch || Darum nicht.", ":::", ":::richtig", "Gut gemacht.", ":::", ":::falsch", "Nicht ganz.", ":::"]
        if mit_nach and i == 0:
            lines += [":::nachschlagen", "nachschlagen/protokoll", ":::"]
        qs.append(dict(title="Frage %d" % i, cls=["mc"], kv={}, lines=lines))
    return dict(title="Verständnisfragen", cls=["quiz"], kv={"oeffnet": "grundlagen"}, intro=["Einleitung."], qs=qs, id="kap/verstaendnisfragen")


def test_quizkarte_rendert_fragen_und_konfig():
    ctx = Kontext(".")
    h, zaehler, n = render_karteninhalt(ctx, _karte(), 0)
    assert h.count('class="fx-quizfrage"') == 4
    assert h.count('data-fx-art="quizserie"') == 1
    m = re.search(r"data-fx-konfig='([^']*)'|data-fx-konfig=\"([^\"]*)\"", h)
    konfig = json.loads(__import__("html").unescape(m.group(1) or m.group(2)))
    assert konfig == {"oeffnet": "grundlagen", "anzahl": 4}
    assert 'data-nachschlagen="nachschlagen/protokoll"' in h
    assert 'data-fx-id="kap/verstaendnisfragen/quiz"' in h
    assert "fx-pruefen" in h and "fx-nochmal" in h and "fx-naechste" in h and "data-fx-ruecksprung" in h
    assert 'class="qctl"' not in h
    assert h.count('<span class="res"') == 4, "quiz.js braucht .res, sonst erscheinen die Rückmeldungen nicht"
    assert n == 4 and zaehler == 4
    assert "Einleitung." in h


def test_eindeutige_antwortgruppen():
    ctx = Kontext(".")
    h, _, _ = render_karteninhalt(ctx, _karte(), 0)
    namen = set(re.findall(r'name="(q\d+)"', h))
    assert len(namen) == 4


def test_rueckmeldungen_je_frage_sind_vorhanden():
    ctx = Kontext(".")
    h, _, _ = render_karteninhalt(ctx, _karte(2), 0)
    assert h.count('class="ofb ok"') == 2 and h.count('class="ofb bad"') == 2


def test_mc_sperrt_markiert_kontrolle():
    ctx = Kontext(".")
    q = dict(title="Kontrolle", cls=["mc", "sperrt"], kv={"versuche": "2"}, id="kap/k/f", lines=[
        "Frage?", ":::antworten", "- [x] Richtig", "- [ ] Falsch", ":::", ":::nach_versuchen", "Die Lösung ist A.", ":::"])
    from foexlab.fragen import render_q
    h = render_q(ctx, q, 1, 7)
    assert 'data-fx-kontrolle="1"' in h and 'data-fx-versuche="2"' in h and 'data-fx-sperrt="1"' in h
    assert '<div class="fx-nach-versuchen" hidden>' in h and "Die Lösung ist A." in h


def test_mc_ohne_sperrt_ist_keine_kontrolle():
    ctx = Kontext(".")
    q = dict(title="Frei", cls=["mc"], kv={}, id="kap/k/g", lines=["Frage?", ":::antworten", "- [x] A", "- [ ] B", ":::"])
    from foexlab.fragen import render_q
    h = render_q(ctx, q, 1, 7)
    assert "data-fx-kontrolle" not in h and "data-fx-versuche" not in h


def test_versuche_ohne_sperrt_warnt():
    from foexlab.fragen import render_q
    ctx = Kontext(".")
    q = dict(title="Frei", cls=["mc"], kv={"versuche": "2"}, id="kap/k/g", lines=["Frage?", ":::antworten", "- [x] A", "- [ ] B", ":::"])
    render_q(ctx, q, 1, 7)
    assert any("versuche wirkt nur mit sperrt" in w for w in ctx.warnings), ctx.warnings
    ctx2 = Kontext(".")
    render_q(ctx2, dict(q, cls=["mc", "sperrt"]), 1, 8)
    assert not any("versuche" in w for w in ctx2.warnings)


def test_luecke_zuordnung_bildzuordnung_sperrt_ist_kontrolle():
    from foexlab.fragen import render_q
    ctx = Kontext(".")
    q = dict(title="Lücke", cls=["luecke", "sperrt"], kv={"versuche": "2"}, id="kap/k/l", lines=[
        "Das Licht ist {{Welle|Teilchen}}.", ":::nach_versuchen", "Erklärung.", ":::"])
    h = render_q(ctx, q, 1, 9)
    assert 'data-fx-kontrolle="1"' in h and 'data-fx-versuche="2"' in h
    assert 'data-correct="Welle"' in h and h.count('<select class="gap"') == 1
    assert not any("versuche" in w for w in ctx.warnings), ctx.warnings
    h2 = render_q(Kontext("."), dict(q, cls=["luecke"], kv={}), 1, 10)
    assert "data-fx-kontrolle" not in h2


def test_versuche_ohne_sperrt_warnt_auch_bei_luecke():
    from foexlab.fragen import render_q
    ctx = Kontext(".")
    render_q(ctx, dict(title="L", cls=["luecke"], kv={"versuche": "2"}, id="kap/k/l", lines=["Text {{a|b}}."]), 1, 9)
    assert any("versuche wirkt nur mit sperrt" in w for w in ctx.warnings), ctx.warnings


def test_zuordnung_und_bildzuordnung_sperrt_sind_kontrolle():
    from foexlab.fragen import render_q
    z = dict(title="Zu", cls=["zuordnung", "sperrt"], kv={"versuche": "2"}, id="kap/k/z", lines=[":::paare", "a => 1", "b => 2", ":::"])
    h = render_q(Kontext("."), z, 1, 11)
    assert 'data-fx-kontrolle="1"' in h and 'data-fx-versuche="2"' in h
    b = dict(title="Bi", cls=["bildzuordnung", "sperrt"], kv={"bild": "fehlt.png"}, id="kap/k/b", lines=[":::marken", "10,10 = A", "20,20 = B", ":::"])
    h = render_q(Kontext("."), b, 1, 12)
    assert 'data-fx-kontrolle="1"' in h
    assert "data-fx-kontrolle" not in render_q(Kontext("."), dict(b, cls=["bildzuordnung"]), 1, 13)
