import os, sys, zipfile
from pathlib import Path

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "tools"))
import pi_aktualisieren as pa  # noqa: E402


def mache_zip(pfad, eintraege):
    with zipfile.ZipFile(str(pfad), "w") as z:
        for name, inhalt in eintraege.items():
            z.writestr(name, inhalt)
    return pfad


GUT = {"foexlab-update/index.html": "x", "foexlab-update/mzi/index.html": "y"}


def test_gueltiges_zip(tmp_path):
    z = mache_zip(tmp_path / "a.zip", GUT)
    ziel = tmp_path / "out"
    ziel.mkdir()
    assert pa.entpacke_und_pruefe(z, ziel) == ziel / "foexlab-update"


def test_zip_slip_abgelehnt(tmp_path):
    z = mache_zip(tmp_path / "a.zip", dict(GUT, **{"foexlab-update/../../boese.txt": "x"}))
    ziel = tmp_path / "out"
    ziel.mkdir()
    with pytest.raises(pa.Fehler):
        pa.entpacke_und_pruefe(z, ziel)
    assert not (tmp_path / "boese.txt").exists()


def test_absoluter_pfad_abgelehnt(tmp_path):
    z = mache_zip(tmp_path / "a.zip", dict(GUT, **{"/etc/boese": "x"}))
    ziel = tmp_path / "out"
    ziel.mkdir()
    with pytest.raises(pa.Fehler):
        pa.entpacke_und_pruefe(z, ziel)


def test_symlink_abgelehnt(tmp_path):
    z = tmp_path / "a.zip"
    mache_zip(z, GUT)
    with zipfile.ZipFile(str(z), "a") as zf:
        info = zipfile.ZipInfo("foexlab-update/link")
        info.external_attr = (0o120777 << 16)
        zf.writestr(info, "/etc/passwd")
    ziel = tmp_path / "out"
    ziel.mkdir()
    with pytest.raises(pa.Fehler):
        pa.entpacke_und_pruefe(z, ziel)


def test_ohne_index_abgelehnt(tmp_path):
    z = mache_zip(tmp_path / "a.zip", {"foexlab-update/mzi/index.html": "y"})
    ziel = tmp_path / "out"
    ziel.mkdir()
    with pytest.raises(pa.Fehler) as e:
        pa.entpacke_und_pruefe(z, ziel)
    assert "index.html" in str(e.value)


def test_kein_zip(tmp_path):
    p = tmp_path / "a.zip"
    p.write_text("kein zip")
    with pytest.raises(pa.Fehler):
        pa.entpacke_und_pruefe(p, tmp_path)


def test_rsync_befehl():
    cmd = pa.baue_rsync(Path("/tmp/x/foexlab-update"), "pi@192.168.178.10")
    assert cmd == ["rsync", "-av", "--delete", "/tmp/x/foexlab-update/",
                   "pi@192.168.178.10:/srv/foexlab/"]


def test_url_aus_host():
    assert pa.url_aus_host("pi@192.168.178.10") == "http://192.168.178.10"
    assert pa.url_aus_host("192.168.178.10") == "http://192.168.178.10"


def test_laden_ohne_netz(tmp_path, monkeypatch, capsys):
    def kaputt(*a, **k):
        raise OSError("kein Netz")
    monkeypatch.setattr(pa.urllib.request, "urlopen", kaputt)
    code = pa.main(["--laden", "--zip", str(tmp_path / "u.zip")])
    assert code == 1
    assert "Internet" in capsys.readouterr().out


def test_rsync_fehlt(tmp_path, monkeypatch, capsys):
    z = mache_zip(tmp_path / "u.zip", GUT)
    monkeypatch.setattr(pa.shutil, "which", lambda n: None)
    aufrufe = []
    monkeypatch.setattr(pa.subprocess, "run", lambda *a, **k: aufrufe.append(a))
    code = pa.main(["--zip", str(z)])
    assert code == 2
    assert "USB" in capsys.readouterr().out
    assert aufrufe == []


def test_ablauf_ok(tmp_path, monkeypatch):
    z = mache_zip(tmp_path / "u.zip", GUT)
    monkeypatch.setattr(pa.shutil, "which", lambda n: "/usr/bin/" + n)
    aufrufe = []

    class R:
        returncode = 0
    monkeypatch.setattr(pa.subprocess, "run", lambda cmd, **k: aufrufe.append(cmd) or R())
    assert pa.main(["--zip", str(z), "--pi", "pi@1.2.3.4"]) == 0
    assert aufrufe[0][0] == "rsync" and aufrufe[0][-1] == "pi@1.2.3.4:/srv/foexlab/"
    assert aufrufe[1][-1] == "http://1.2.3.4" and "pi_pruefen.py" in aufrufe[1][1]


def test_rsync_fehlschlag(tmp_path, monkeypatch, capsys):
    z = mache_zip(tmp_path / "u.zip", GUT)
    monkeypatch.setattr(pa.shutil, "which", lambda n: "/usr/bin/" + n)

    class R:
        returncode = 23
    monkeypatch.setattr(pa.subprocess, "run", lambda cmd, **k: R())
    assert pa.main(["--zip", str(z)]) == 1
    assert "WLAN" in capsys.readouterr().out
