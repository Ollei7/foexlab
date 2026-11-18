import os, re, shutil

from foexlab.seite import baue


def _bauen(tmp_path, kurs="tests/py/daten/minikurs", einzel=False):
    ziel = tmp_path / ("k.html" if einzel else "k")
    baue(kurs, str(ziel), einzeldatei=einzel, ausgabe=lambda *_: None)
    return ziel


def test_keine_rotis_mehr(tmp_path):
    ziel = _bauen(tmp_path)
    css = (ziel / "style.css").read_text(encoding="utf-8")
    assert "Rotis" not in css and "Source Sans 3" in css
    for f in ("Regular", "Semibold", "Bold"):
        assert (ziel / "fonts" / f"SourceSans3-{f}.woff2").is_file()
    assert not (ziel / "fonts" / "RotisSansSerifStd-Regular.otf").exists()


def test_kein_banner_logos_klein(tmp_path):
    html = (_bauen(tmp_path) / "index.html").read_text(encoding="utf-8")
    assert 'class="banner"' not in html and "stripes" not in html
    assert html.count('class="fx-startlogo"') == 1
    assert len(re.findall(r'<img[^>]+class="fx-fusslogo"[^>]+height="28"', html)) == 2
    assert 'height="40"' in html
    assert "foeXlab · LUH" in html
    assert 'class="fx-fortschritt-balken"' in html


def test_lizenz_aus_kurs_yml(tmp_path):
    kurs = tmp_path / "kurs"
    shutil.copytree("tests/py/daten/minikurs", kurs, ignore=shutil.ignore_patterns("media"))
    t = (kurs / "kurs.yml").read_text(encoding="utf-8") + '\nlizenz: "Material: Testperson, 2026"\n'
    (kurs / "kurs.yml").write_text(t, encoding="utf-8")
    html = (_bauen(tmp_path, str(kurs)) / "index.html").read_text(encoding="utf-8")
    assert "Material: Testperson, 2026" in html
    assert "Leibniz Universität Hannover" in html


def test_standardlizenz(tmp_path):
    html = (_bauen(tmp_path) / "index.html").read_text(encoding="utf-8")
    assert "CC BY 4.0" in html


def test_einzeldatei_bettet_schrift_ein(tmp_path):
    html = _bauen(tmp_path, einzel=True).read_text(encoding="utf-8")
    assert "data:font/woff2;base64," in html and "Rotis" not in html
