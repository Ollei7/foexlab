import pytest

from foexlab.seite import baue


@pytest.fixture(scope="module")
def bau(tmp_path_factory):
    ziel = tmp_path_factory.mktemp("mzi") / "mzi"
    meldungen = []
    baue("kurse/mzi", str(ziel), ausgabe=meldungen.append)
    html = (ziel / "index.html").read_text(encoding="utf-8")
    return html, meldungen


@pytest.fixture(scope="module")
def h(bau):
    return bau[0]


def test_baut_ohne_warnungen(bau):
    warn = [m for m in bau[1] if m.startswith("WARNUNG")]
    assert warn == []


def test_karten_kapitel_1_und_2(h):
    for k in ("wiederholung/a-k1-start", "wiederholung/a-k1-wdh", "wiederholung/a-k1-ds",
              "bauteile/a-k2-teile", "bauteile/a-k2-schema"):
        assert f'data-karte="{k}"' in h, k


def test_kartentitel(h):
    for karte, titel in (("wiederholung/a-k1-start", "Einstieg"), ("wiederholung/a-k1-wdh", "Beugung, Interferenz, Kohärenz"),
                         ("wiederholung/a-k1-ds", "Doppelspalt"), ("bauteile/a-k2-teile", "Bauteile kennenlernen"),
                         ("bauteile/a-k2-schema", "Schema zusammensetzen")):
        teil = h.split(f'<section class="fx-karte fx-ansicht" data-karte="{karte}"', 1)[1]
        assert teil.split("<h2>", 1)[1].split("</h2>", 1)[0] == titel, karte


def test_quiz_mit_ziehen_und_acht_chips(h):
    karte = h.split('<section class="fx-karte fx-ansicht" data-karte="bauteile/a-k2-schema"', 1)[1].split("</section>", 1)[0]
    assert 'data-fx-art="quiz"' in karte
    assert '<div class="ddimg fx-ziehen"' in karte
    assert karte.count('class="fx-chip"') == 8


def test_feldkennungen(h):
    assert 'data-fx-id="wiederholung/a-k1-wdh/koh"' in h
    assert 'data-fx-id="bauteile/a-k2-schema/schema"' in h


def _karte(h, k):
    return h.split(f'<section class="fx-karte fx-ansicht" data-karte="{k}"', 1)[1].split("</section>", 1)[0]


def test_karten_kapitel_3_und_4(h):
    for k, titel in (("aufbau/a-k3-fehler", "Fehlerquellen"), ("aufbau/a-k3-material", "Material holen"),
                     ("aufbau/a-k3-aufbau", "Aufbau und Justage"), ("muster/a-k4-muster", "Vergleich der Interferenzmuster")):
        assert _karte(h, k).split("<h2>", 1)[1].split("</h2>", 1)[0] == titel, k


def test_kapitel3_felder(h):
    assert 'data-fx-id="aufbau/a-k3-fehler/afinger"' in h
    assert 'data-fx-id="aufbau/a-k3-fehler/alose"' in h
    assert 'data-fx-id="aufbau/a-k3-material/material"' in h


def test_material_checkliste(h):
    karte = _karte(h, "aufbau/a-k3-material")
    assert karte.count('type="checkbox"') == 10


def test_umschalter_mit_video(h):
    karte = _karte(h, "aufbau/a-k3-aufbau")
    assert karte.count('data-ansicht="') == 4
    assert '<video controls playsinline preload="metadata"><source src="media/MZI-Aufbau.mp4"' in karte
    assert "Video</button>" in karte and "Anleitung</button>" in karte


def test_knopf_aufbau_fertig_und_kapitel4(h):
    assert "aufbau-fertig" in _karte(h, "aufbau/a-k3-aufbau")
    assert "knopf:aufbau-fertig" in h
    assert 'data-fx-id="aufbau/a-k3-aufbau/muster"' in h


def test_werkzeug_phasendifferenz_schirm(h):
    karte = _karte(h, "muster/a-k4-muster")
    assert 'data-fx-id="muster/a-k4-muster/sphase"' in karte
    assert karte.count('data-fx-art="phasendifferenz"') == 1
    block = karte.split('data-fx-id="muster/a-k4-muster/sphase"', 1)[1].split('data-fx-id="muster/a-k4-muster/aspiegel"', 1)[0]
    assert block.count("<h4") == 1
    assert block.split("<h4", 1)[1].split(">", 1)[1].split("</h4>", 1)[0] == "Phasendifferenz"
    assert block.index("Phasensprünge an jedem Bauteil") < block.index("<h4")
    assert block.index("<h4") < block.index("Δφ zwischen den beiden Wegen")
    for i in ("schirme", "vergleich", "aspiegel", "aint"):
        assert f'data-fx-id="muster/a-k4-muster/{i}"' in karte


def test_kapitel5_uebergang_vor_einstieg(h):
    assert "felder:muster/a-k4-muster" in h
    teil = h.split('<section class="fx-karte fx-ansicht" data-karte="drei-aufbauten/uebergang"', 1)[1]
    assert teil.split("<h2>", 1)[1].split("</h2>", 1)[0] == "Von der klassischen Physik zur Quantenphysik"
    assert h.index('data-karte="drei-aufbauten/uebergang"') < h.index('data-karte="drei-aufbauten/k1-start"')
    assert "Jetzt wechselt ihr zur" in teil.split("</section>", 1)[0]


def test_kapitel6_karten(h):
    for k in ("quantenradierer/k2-frage", "quantenradierer/k2-pol", "quantenradierer/k2-rad",
              "quantenradierer/k2-sich-1", "quantenradierer/k2-sich-2"):
        assert f'data-karte="{k}"' in h


def test_kapitel6_stopp_knopf(h):
    karte = _karte(h, "quantenradierer/k2-sich-1")
    assert 'data-oeffnet="quantenradierer/k2-sich-2" data-knopf-id="stopp-2">Besprechung erledigt</button>' in karte
    assert '"quantenradierer/k2-sich-2": {"oeffnet_nach": "knopf:stopp-2"' in h


def test_kapitel6_felder(h):
    for f in ("qr-hyp1", "qr-par", "qr-kr", "qr-ueb", "qr-abgl1", "qr-hyp2", "qr-rad", "qr-abgl2", "qr-sich", "qr-eign",
              "pol-par", "pol-kr", "rad-p45", "rad-m45", "zus-k2", "qr-k1", "qr-k2"):
        assert f"/{f}" in h, f


def test_keine_kommentare_im_html(h):
    import re
    assert "Regel 14" not in h
    rest = re.sub(r"<(script|style)\b.*?</\1>", "", h, flags=re.S | re.I)
    assert "<!--" not in rest


def test_kapitel7_karten(h):
    for k in ("delayed-choice/k3-motiv", "delayed-choice/k3-funk", "delayed-choice/k3-s1", "delayed-choice/k3-s2", "delayed-choice/k3-s3"):
        assert f'data-karte="{k}"' in h, k


def test_kapitel7_felder(h):
    for f in ("dc-hyp", "dc-aufbau", "dc-q1", "dc-q2", "s1", "s1-frage", "s1-kontrolle", "s2", "s2-frage", "s3"):
        assert f"/{f}" in h, f
    for w in ("dcaufbau", "dceinzel", "dcmessreihe"):
        assert f'data-fx-art="{w}"' in h, w


def test_kapitel7_kontrolle_mit_versuchen(h):
    assert "Bei nur 10 Einzelmessungen kann die Häufigkeitsverteilung" in h
    assert 'versuche="2"' in h


ALLE_KARTEN = {
    "drei-aufbauten": ["uebergang", "k1-start", "k1-a1", "k1-a2", "k1-a3", "k1-phase", "k1-sich-1", "k1-sich-2"],
    "quantenradierer": ["k2-frage", "k2-pol", "k2-rad", "k2-sich-1", "k2-sich-2"],
    "delayed-choice": ["k3-motiv", "k3-funk", "k3-s1", "k3-s2", "k3-s3", "k3-s4", "k3-s5", "k3-erg", "k3-deut", "k3-sich-1", "k3-sich-2"],
    "hintergrund-aufbau": ["hintergrund-aufbau"],
    "hintergrund-photonen": ["hintergrund-photonen"],
}


def test_alle_karten_kapitel_5_bis_7(h):
    for abschnitt, karten in ALLE_KARTEN.items():
        for k in karten:
            assert f'data-karte="{abschnitt}/{k}"' in h, f"{abschnitt}/{k}"


def test_alle_werkzeuge_vorhanden(bau):
    fehlend = [m for m in bau[1] if "Werkzeug" in m and "fehlt" in m]
    assert fehlend == []


def test_feste_feldkennungen_kapitel_5_bis_7(h):
    for fid in ("drei-aufbauten/k1-a1/a1-why", "delayed-choice/k3-motiv/dc-hyp"):
        assert f'data-fx-id="{fid}"' in h, fid


def test_hintergruende_nachschlagen(h):
    nach = h.split("Zum Nachschlagen", 1)[1]
    assert 'data-karte="hintergrund-aufbau/hintergrund-aufbau"' in nach
    assert 'data-karte="hintergrund-photonen/hintergrund-photonen"' in nach
    assert "Hintergrund: Aufbau und Interferenz" in nach and "Hintergrund: Einzelne Photonen" in nach
    assert "Betreuungsmodus (fünfmal auf" in nach and "#lehrkraft" not in nach


def test_lehrkraft_kaesten(h):
    # Stopp-Karten der Kapitel 5-7 (je eine) tragen einen Lehrkraft-Kasten; Kapitel 1-4 haben keine
    for k in ("drei-aufbauten/k1-sich-1", "quantenradierer/k2-sich-1", "delayed-choice/k3-sich-1"):
        assert 'class="fx-lehrkraft"' in _karte(h, k), k
    assert h.count('class="fx-lehrkraft"') == 3


def test_inhaltsabgleich_quelle():
    import os, subprocess, sys
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    quelle = os.path.join(root, "MZI Kurs Test", "Inhalte")
    if not os.path.isdir(quelle):
        pytest.skip("Quellordner nicht vorhanden")
    r = subprocess.run([sys.executable, os.path.join(root, "tools", "inhaltsabgleich.py"), "--quelle-md", quelle,
                        "kurse/mzi", "--ausnahmen", "kurse/mzi/abgleich-ausnahmen.txt"],
                       capture_output=True, text=True, cwd=root)
    assert r.returncode == 0, r.stdout[-3000:] + r.stderr


def test_k3_stopp_nach_leitfrage(h):
    # Stopp-Hinweis und Lehrkraft-Kasten stehen hinter dem Antwortfeld der Leitfrage, nicht in ihrem Aufgabentext
    karte = h.split('data-karte="delayed-choice/k3-sich-1" data-abschnitt', 1)[1].split("</section>", 1)[0]
    feld = karte.split('data-fx-id="delayed-choice/k3-sich-1/k3-leitfrage"', 1)[1]
    textfeld = feld.index("<textarea")
    assert feld.index('class="fx-lehrkraft"') > textfeld
    assert feld.index("Dieses Ergebnis sollten wir gemeinsam vergleichen") > textfeld
    assert feld.index('class="fx-lehrkraft"') < feld.index('data-fx-id="delayed-choice/k3-sich-1/zus-k3"')


def test_feldtitel_eindeutig_und_nach_vorlage(h):
    # Feldüberschriften = data-q der Vorlage; wiederkehrende mit Aufbau/Schritt/Kapitel davor (Protokoll eindeutig)
    import collections, re
    titel = re.findall(r'data-fx-id="([^"]+)" data-fx-art="[^"]+" data-fx-titel="([^"]+)"', h)
    doppelt = [t for t, n in collections.Counter(t for _, t in titel).items() if n > 1]
    assert doppelt == []
    t = dict(titel)
    assert t["drei-aufbauten/k1-a2/a2-abgl"] == "Aufbau 2: Abgleich"
    assert t["delayed-choice/k3-s1/s1-frage"] == "Einzelmessungen: Beobachtung"
    assert t["delayed-choice/k3-sich-1/k3-leitfrage"] == "Begründung zur Ausgangsfrage"
    assert t["delayed-choice/k3-sich-1/zus-k3"] == "Zusatzaufgabe: Schlagzeile"


def test_kartentitel_kapitel_5_bis_7(h):
    for karte, titel in (("drei-aufbauten/k1-a2", "Aufbau 2: zwei Spiegel"), ("drei-aufbauten/k1-a3", "Aufbau 3: zweiter Strahlteiler"),
                         ("quantenradierer/k2-sich-1", "Komplementarität"), ("quantenradierer/k2-sich-2", "Sicherung: Komplementarität"),
                         ("delayed-choice/k3-s1", "Schritt 1: Einzelmessungen"), ("delayed-choice/k3-s2", "Schritt 2: Messreihen bei Δφ = 0°"),
                         ("delayed-choice/k3-s5", "Schritt 5: kompletter Messdurchlauf")):
        teil = h.split(f'<section class="fx-karte fx-ansicht" data-karte="{karte}"', 1)[1]
        assert teil.split("<h2>", 1)[1].split("</h2>", 1)[0] == titel, karte


# ---- Task 8: lückenlose Karten-IDs, Freischaltkette, Werkzeug-Konfig ----

KARTEN_1_BIS_4 = {
    "wiederholung": ["a-k1-start", "a-k1-wdh", "a-k1-ds"],
    "bauteile": ["a-k2-teile", "a-k2-schema"],
    "aufbau": ["a-k3-fehler", "a-k3-material", "a-k3-aufbau"],
    "muster": ["a-k4-muster"],
}


def _regeln(h):
    import json, re
    return json.loads(re.search(r'<script type="application/json" id="fx-regeln">(.*?)</script>', h, re.S).group(1))


def test_alle_karten_ids_kapitel_1_bis_7_exakt(h):
    # die Kartenliste der Engine (fx-regeln) und die gerenderten Sections stimmen mit der erwarteten Liste überein
    import re
    erwartet = {f"{ab}/{k}" for ab, ks in {**KARTEN_1_BIS_4, **ALLE_KARTEN}.items() for k in ks}
    im_html = set(re.findall(r'<section class="fx-karte fx-ansicht" data-karte="([^"]+)"', h))
    assert im_html == erwartet
    assert set(_regeln(h)["karten"]) == erwartet


FREISCHALTKETTE = (
    ("bauteile", "felder:wiederholung/a-k1-ds"),
    ("aufbau", "felder:bauteile/a-k2-schema"),
    ("muster", "knopf:aufbau-fertig"),
    ("drei-aufbauten", "felder:muster/a-k4-muster"),
    ("quantenradierer", "felder:drei-aufbauten/k1-sich-2"),
    ("delayed-choice", "felder:quantenradierer/k2-sich-2"),
)


@pytest.mark.parametrize("abschnitt,bedingung", FREISCHALTKETTE)
def test_freischaltkette(h, abschnitt, bedingung):
    import re
    regeln = _regeln(h)
    # Regel hängt genau an diesem Abschnitt ...
    assert regeln["abschnitte"][abschnitt]["oeffnet_nach"] == bedingung
    assert regeln["abschnitte"][abschnitt]["grund"]
    # ... und alle seine Karten gehören (per Engine-Zuordnung und data-abschnitt-id) zu ihm
    karten = [k for k, ab in regeln["karten"].items() if ab == abschnitt]
    assert karten
    for k in karten:
        sec = re.search(rf'<section class="fx-karte fx-ansicht" data-karte="{re.escape(k)}"([^>]*)>', h).group(1)
        assert f'data-abschnitt-id="{abschnitt}"' in sec, k
    # Kapitel 1 ist frei
    assert "oeffnet_nach" not in regeln["abschnitte"]["wiederholung"]
    # die Bedingung verweist auf ein existierendes Feld bzw. einen existierenden Knopf
    art, _, ziel = bedingung.partition(":")
    if art == "felder":
        assert f'data-karte="{ziel}"' in h
    else:
        assert f'data-knopf-id="{ziel}"' in h


def test_kartenregeln_stopp_knoepfe(h):
    assert _regeln(h)["kartenregeln"] == {
        "drei-aufbauten/k1-sich-2": {"oeffnet_nach": "knopf:stopp-1", "grund": "Öffnet sich über ‚Besprechung erledigt‘."},
        "quantenradierer/k2-sich-2": {"oeffnet_nach": "knopf:stopp-2", "grund": "Öffnet sich über ‚Besprechung erledigt‘."},
        "delayed-choice/k3-sich-2": {"oeffnet_nach": "knopf:stopp-3", "grund": "Öffnet sich über ‚Besprechung erledigt‘."},
    }


def test_phasendifferenz_werkzeug_modus_schirm_und_infobox_davor(h):
    import html as htmllib, json, re
    karte = _karte(h, "muster/a-k4-muster")
    m = re.search(r'data-fx-id="muster/a-k4-muster/sphase" data-fx-art="([^"]+)"[^>]*data-fx-konfig="([^"]*)"', karte)
    assert m.group(1) == "phasendifferenz"
    assert json.loads(htmllib.unescape(m.group(2))) == {"modus": "schirm"}
    assert karte.count('data-fx-art="phasendifferenz"') == 1
    # Info-Box zu den Phasensprüngen steht vor dem Phasendifferenz-Werkzeug
    info = karte.index('<aside class="fx-info">')
    assert "Phasensprung von π/2" in karte[info:karte.index("</aside>", info)]
    assert info < karte.index('data-fx-id="muster/a-k4-muster/sphase"')
