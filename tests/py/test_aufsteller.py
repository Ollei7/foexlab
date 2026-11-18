import os, shutil, subprocess, sys

import pytest

ROOT = os.getcwd()
sys.path.insert(0, os.path.join(ROOT, "tools"))
from aufsteller import aufsteller_svg  # noqa: E402

KONFIG = {"adresse": "http://192.168.8.10", "wlan": {"ssid": "foeXlab", "passwort": "geheim-123"}}


def test_aufsteller_zwei_qr_und_klartext():
    svg = aufsteller_svg("kurse/mzi", KONFIG)
    assert svg.startswith("<svg") and svg.count("<svg") == 3   # Aufsteller + 2 QR-Codes
    assert "http://192.168.8.10/mzi/" in svg
    assert "Mach-Zehnder-Interferometer" in svg
    assert "foeXlab" in svg
    assert "geheim-123" not in svg
    assert "mobile Daten aus" in svg


def test_startseite_listet_kurse(tmp_path):
    sys.path.insert(0, os.path.join(ROOT, "engine"))
    from foexlab.seite import startseite
    (tmp_path / "mzi").mkdir(); (tmp_path / "minikurs").mkdir()
    startseite(["kurse/mzi", "tests/py/daten/minikurs"], str(tmp_path))
    html = (tmp_path / "index.html").read_text(encoding="utf-8")
    assert 'href="mzi/"' in html and 'href="minikurs/"' in html and "Mach-Zehnder-Interferometer" in html


@pytest.mark.skipif(not shutil.which("caddy"), reason="caddy nicht installiert")
def test_caddyfile_gueltig():
    r = subprocess.run(["caddy", "validate", "--adapter", "caddyfile", "--config", "server/Caddyfile"], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
