import os, re, urllib.parse

import pytest

from conftest import ROOT
from foexlab.seite import baue


@pytest.fixture(scope="module")
def ordner(tmp_path_factory):
    ziel = tmp_path_factory.mktemp("m") / "mzi"
    meldungen = []
    baue("kurse/mzi", str(ziel), einzeldatei=False, ausgabe=meldungen.append)
    return ziel, meldungen


@pytest.fixture(scope="module")
def minikurs(tmp_path_factory):
    # mzi hat keine Medien; Bild- und Medienprüfungen laufen am Minikurs
    ziel = tmp_path_factory.mktemp("mk") / "minikurs"
    meldungen = []
    baue("tests/py/daten/minikurs", str(ziel), einzeldatei=False, ausgabe=meldungen.append)
    return ziel, meldungen


def test_ordner_struktur(ordner):
    ordner, _ = ordner
    for f in ("index.html", "app.js", "style.css", "fonts/SourceSans3-Regular.woff2"):
        assert (ordner / f).is_file(), f


def test_keine_eingebetteten_videos(ordner):
    ordner, _ = ordner
    assert "data:video" not in (ordner / "index.html").read_text(encoding="utf-8")


def test_alle_medienverweise_existieren(minikurs):
    ordner, meldungen = minikurs
    html = (ordner / "index.html").read_text(encoding="utf-8")
    refs = set(re.findall(r'(?:src|href)="(media/[^"]+)"', html))
    assert refs, "keine Medienverweise gefunden"
    fehlend = [r for r in refs if not (ordner / urllib.parse.unquote(r)).is_file()]
    gemeldet = " ".join(meldungen)
    assert all(f"Datei fehlt: {urllib.parse.unquote(r)}" in gemeldet for r in fehlend), fehlend


def test_bilder_verkleinert(tmp_path):
    # Kopie des Minikurses mit einem 1600 px breiten Bild: der Bau verkleinert es auf höchstens 1200 px
    import shutil
    from PIL import Image
    kurs = tmp_path / "minikurs"
    shutil.copytree(os.path.join(ROOT, "tests", "py", "daten", "minikurs"), kurs)
    Image.new("RGB", (1600, 900), (200, 120, 40)).save(kurs / "media" / "gross.jpg")
    md = kurs / "abschnitte" / "01-beispiel.md"
    md.write_text(md.read_text(encoding="utf-8") + "\n![Großes Bild](media/gross.jpg)\n", encoding="utf-8")
    ziel = tmp_path / "aus"
    baue(str(kurs), str(ziel), einzeldatei=False, ausgabe=lambda *_: None)
    assert (ziel / "media" / "gross.jpg").exists()
    b, h = Image.open(ziel / "media" / "gross.jpg").size
    assert max(b, h) <= 1200 and b == 1200, (b, h)
    for f in os.listdir(ziel / "media"):
        if f.lower().endswith((".jpg", ".jpeg", ".png")):
            assert max(Image.open(ziel / "media" / f).size) <= 1200, f


def test_versionskennung_gegen_cache(ordner):
    ordner, _ = ordner
    html = (ordner / "index.html").read_text(encoding="utf-8")
    assert re.search(r'src="app\.js\?v=[0-9a-f]{8}"', html)
    assert re.search(r'href="style\.css\?v=[0-9a-f]{8}"', html)
