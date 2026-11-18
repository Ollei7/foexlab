import pytest

from foexlab.seite import baue

pytestmark = pytest.mark.skip(reason="mzi-photonen wird archiviert (Gesamtkurs Task 7)")


@pytest.fixture(scope="module")
def bau(tmp_path_factory):
    ziel = tmp_path_factory.mktemp("mzi") / "mzi"
    meldungen = []
    baue("kurse/mzi-photonen", str(ziel), ausgabe=meldungen.append)
    html = (ziel / "index.html").read_text(encoding="utf-8")
    return html, meldungen


@pytest.fixture(scope="module")
def h(bau):
    return bau[0]


def test_baut_ohne_warnungen(bau):
    warn = [m for m in bau[1] if m.startswith("WARNUNG")]
    assert warn == []


def test_kapitel2_karten(h):
    for k in ("quantenradierer/k2-frage", "quantenradierer/k2-pol", "quantenradierer/k2-rad",
              "quantenradierer/k2-sich-1", "quantenradierer/k2-sich-2"):
        assert f'data-karte="{k}"' in h


def test_kapitel2_oeffnet_nach_kapitel1(h):
    assert "felder:drei-aufbauten/k1-sich-2" in h


def test_kapitel2_stopp_knopf(h):
    karte = h.split('<section class="fx-karte fx-ansicht" data-karte="quantenradierer/k2-sich-1"', 1)[1].split("</section>", 1)[0]
    assert 'data-oeffnet="quantenradierer/k2-sich-2" data-knopf-id="stopp-2">Besprechung erledigt</button>' in karte
    assert '"quantenradierer/k2-sich-2": {"oeffnet_nach": "knopf:stopp-2"' in h


def test_kapitel2_felder(h):
    for f in ("qr-hyp1", "qr-par", "qr-kr", "qr-ueb", "qr-abgl1", "qr-hyp2", "qr-rad", "qr-abgl2", "qr-sich", "qr-eign",
              "pol-par", "pol-kr", "rad-p45", "rad-m45", "zus-k2", "qr-k1", "qr-k2"):
        assert f"/{f}" in h, f


def test_keine_kommentare_im_html(h):
    assert "Regel 14" not in h


def test_kapitel3_karten(h):
    for k in ("delayed-choice/k3-motiv", "delayed-choice/k3-funk", "delayed-choice/k3-s1", "delayed-choice/k3-s2", "delayed-choice/k3-s3"):
        assert f'data-karte="{k}"' in h, k


def test_kapitel3_oeffnet_nach_kapitel2(h):
    assert "felder:quantenradierer/k2-sich-2" in h


def test_kapitel3_felder(h):
    for f in ("dc-hyp", "dc-aufbau", "dc-q1", "dc-q2", "s1", "s1-frage", "s1-kontrolle", "s2", "s2-frage", "s3"):
        assert f"/{f}" in h, f
    for w in ("dcaufbau", "dceinzel", "dcmessreihe"):
        assert f'data-fx-art="{w}"' in h, w


def test_kapitel3_kontrolle_mit_versuchen(h):
    assert "Bei nur 10 Einzelmessungen kann die Häufigkeitsverteilung" in h
    assert 'versuche="2"' in h


ALLE_KARTEN = {
    "drei-aufbauten": ["k1-start", "k1-a1", "k1-a2", "k1-a3", "k1-phase", "k1-sich-1", "k1-sich-2"],
    "quantenradierer": ["k2-frage", "k2-pol", "k2-rad", "k2-sich-1", "k2-sich-2"],
    "delayed-choice": ["k3-motiv", "k3-funk", "k3-s1", "k3-s2", "k3-s3", "k3-s4", "k3-s5", "k3-erg", "k3-deut", "k3-sich-1", "k3-sich-2"],
    "hintergrund": ["hintergrund"],
}


def test_alle_karten(h):
    for abschnitt, karten in ALLE_KARTEN.items():
        for k in karten:
            assert f'data-karte="{abschnitt}/{k}"' in h, f"{abschnitt}/{k}"


def test_alle_werkzeuge_vorhanden(bau):
    fehlend = [m for m in bau[1] if "Werkzeug" in m and "fehlt" in m]
    assert fehlend == []


def test_feste_feldkennungen(h):
    for fid in ("drei-aufbauten/k1-a1/a1-why", "delayed-choice/k3-motiv/dc-hyp"):
        assert f'data-fx-id="{fid}"' in h, fid


def test_hintergrund_nachschlagen(h):
    nach = h.split("Zum Nachschlagen", 1)[1]
    assert 'data-karte="hintergrund/hintergrund"' in nach


def test_lehrkraft_kaesten(h):
    # drei Stopp-Karten (je Kapitel eine), je ein Lehrkraft-Kasten
    assert h.count('class="fx-lehrkraft"') == 3


def test_inhaltsabgleich_quelle():
    import os, subprocess, sys
    root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    quelle = os.path.join(root, "MZI einzelne Photonen", "Inhalte")
    if not os.path.isdir(quelle):
        pytest.skip("Quellordner nicht vorhanden")
    r = subprocess.run([sys.executable, os.path.join(root, "tools", "inhaltsabgleich.py"), "--quelle-md", quelle,
                        "kurse/mzi-photonen", "--ausnahmen", "kurse/mzi-photonen/abgleich-ausnahmen.txt"],
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


def test_kartentitel_nach_vorlage(h):
    for karte, titel in (("drei-aufbauten/k1-a2", "Aufbau 2: zwei Spiegel"), ("drei-aufbauten/k1-a3", "Aufbau 3: zweiter Strahlteiler"),
                         ("quantenradierer/k2-sich-1", "Komplementarität"), ("quantenradierer/k2-sich-2", "Sicherung: Komplementarität"),
                         ("delayed-choice/k3-s1", "Schritt 1: Einzelmessungen"), ("delayed-choice/k3-s2", "Schritt 2: Messreihen bei Δφ = 0°"),
                         ("delayed-choice/k3-s5", "Schritt 5: kompletter Messdurchlauf")):
        teil = h.split(f'<section class="fx-karte fx-ansicht" data-karte="{karte}"', 1)[1]
        assert teil.split("<h2>", 1)[1].split("</h2>", 1)[0] == titel, karte
