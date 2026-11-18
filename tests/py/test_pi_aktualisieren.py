import os, sys, zipfile
from pathlib import Path

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "tools"))
import pi_aktualisieren as pa  # noqa: E402
import pi_pruefen  # noqa: E402


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
    assert cmd == ["rsync", "-av", "--delete", "--no-owner", "--no-group", "--", "/tmp/x/foexlab-update/",
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
    assert "pi_pruefen.py" in aufrufe[1][1] and aufrufe[1][2] == "http://1.2.3.4"
    assert aufrufe[1][3] == "--kurse-aus" and aufrufe[1][4].endswith("foexlab-update")


def test_rsync_fehlschlag(tmp_path, monkeypatch, capsys):
    z = mache_zip(tmp_path / "u.zip", GUT)
    monkeypatch.setattr(pa.shutil, "which", lambda n: "/usr/bin/" + n)

    class R:
        returncode = 23
    monkeypatch.setattr(pa.subprocess, "run", lambda cmd, **k: R())
    assert pa.main(["--zip", str(z)]) == 1
    assert "WLAN" in capsys.readouterr().out


def test_laden_nur_herunterladen(tmp_path, monkeypatch, capsys):
    ziel = tmp_path / "u.zip"
    mache_zip(tmp_path / "quelle.zip", GUT)
    monkeypatch.setattr(pa, "lade", lambda z: ziel.write_bytes((tmp_path / "quelle.zip").read_bytes()))
    aufrufe = []
    monkeypatch.setattr(pa.subprocess, "run", lambda *a, **k: aufrufe.append(a))
    assert pa.main(["--laden", "--zip", str(ziel)]) == 0
    assert aufrufe == []
    assert "ohne --laden" in capsys.readouterr().out


def test_ssh_fehlt(tmp_path, monkeypatch, capsys):
    z = mache_zip(tmp_path / "u.zip", GUT)
    monkeypatch.setattr(pa.shutil, "which", lambda n: None if n == "ssh" else "/usr/bin/" + n)
    assert pa.main(["--zip", str(z)]) == 2
    out = capsys.readouterr().out
    assert "ssh" in out and "USB" in out


@pytest.mark.parametrize("name", ["foexlab-update\\..\\boese.txt", "C:/boese.txt", "C:\\boese.txt"])
def test_backslash_und_laufwerk_abgelehnt(tmp_path, name):
    z = mache_zip(tmp_path / "a.zip", dict(GUT, **{name: "x"}))
    ziel = tmp_path / "out"
    ziel.mkdir()
    with pytest.raises(pa.Fehler):
        pa.entpacke_und_pruefe(z, ziel)


def _fake_download(monkeypatch, inhalt=None, fehler=None):
    import io
    def urlopen(url, timeout=0):
        if fehler:
            raise fehler
        return io.BytesIO(inhalt)
    monkeypatch.setattr(pa.urllib.request, "urlopen", urlopen)


def test_404_meldung(tmp_path, monkeypatch, capsys):
    _fake_download(monkeypatch, fehler=pa.urllib.error.HTTPError("u", 404, "nf", {}, None))
    assert pa.main(["--laden", "--zip", str(tmp_path / "u.zip")]) == 1
    assert "nicht gefunden" in capsys.readouterr().out


def test_fehlgeschlagener_download_behaelt_altes_zip(tmp_path, monkeypatch):
    alt = mache_zip(tmp_path / "u.zip", GUT)
    vorher = alt.read_bytes()
    _fake_download(monkeypatch, inhalt=b"kaputt, kein zip")
    assert pa.main(["--laden", "--zip", str(alt)]) == 1
    assert alt.read_bytes() == vorher
    assert not (tmp_path / "u.zip.part").exists()


def test_guter_download_ersetzt(tmp_path, monkeypatch):
    neu = mache_zip(tmp_path / "neu.zip", GUT).read_bytes()
    _fake_download(monkeypatch, inhalt=neu)
    ziel = tmp_path / "u.zip"
    assert pa.main(["--laden", "--zip", str(ziel)]) == 0
    assert ziel.read_bytes() == neu and not (tmp_path / "u.zip.part").exists()


@pytest.mark.parametrize("pi", ["-oProxyCommand=x", "pi@-bad", "pi@host name", "pi@h\nx", "pi@host:22"])
def test_pi_angabe_abgelehnt(tmp_path, monkeypatch, pi, capsys):
    z = mache_zip(tmp_path / "u.zip", GUT)
    aufrufe = []
    monkeypatch.setattr(pa.subprocess, "run", lambda *a, **k: aufrufe.append(a))
    assert pa.main(["--zip", str(z), "--pi", pi]) == 2
    assert aufrufe == []


def test_oserror_und_abbruch(tmp_path, monkeypatch, capsys):
    z = mache_zip(tmp_path / "u.zip", GUT)
    monkeypatch.setattr(pa.shutil, "which", lambda n: "/x/" + n)
    monkeypatch.setattr(pa.subprocess, "run", lambda *a, **k: (_ for _ in ()).throw(OSError("weg")))
    assert pa.main(["--zip", str(z)]) == 1
    monkeypatch.setattr(pa.subprocess, "run", lambda *a, **k: (_ for _ in ()).throw(KeyboardInterrupt()))
    assert pa.main(["--zip", str(z)]) == 1
    assert "Abgebrochen" in capsys.readouterr().out


def test_pi_pruefen_ohne_dist(tmp_path, monkeypatch):
    monkeypatch.setattr(pi_pruefen, "WURZEL", str(tmp_path))  # kein dist/ vorhanden
    seiten = {"/": b'<a href="mzi/">x</a><a href="/abholen">y</a>',
              "/mzi/": b'<img src="a.png">'}

    def hole(url, methode="GET", daten=None, kopf=None):
        pfad = "/" + url.split("//", 1)[1].split("/", 1)[1]
        if pfad == "/api/ablegen":
            return 201, b'{"code": "ABCD"}', {}
        if pfad == "/api/abholen/ABCD":
            return 200, pi_pruefen.PDF, {}
        if pfad == "/api/abholen/ZZZZ":
            return 404, b"", {}
        return 200, seiten.get(pfad, b""), {}
    monkeypatch.setattr(pi_pruefen, "hole", hole)
    assert pi_pruefen.main(["http://pi.test"]) == 0
    assert (tmp_path / "pi-pruefung.txt").exists()


def test_pi_pruefen_kurse_aus_ordner(tmp_path, monkeypatch):
    monkeypatch.setattr(pi_pruefen, "WURZEL", str(tmp_path))
    (tmp_path / "q" / "mzi").mkdir(parents=True)
    (tmp_path / "q" / "mzi" / "index.html").write_text("<p>kein verweis</p>")
    monkeypatch.setattr(pi_pruefen, "hole", lambda url, methode="GET", daten=None, kopf=None:
                        (404, b"", {}) if "abholen/ZZZZ" in url else
                        (201, b'{"code": "ABCD"}', {}) if url.endswith("ablegen") else
                        (200, pi_pruefen.PDF if "abholen/ABCD" in url else b"", {}))
    assert pi_pruefen.main(["http://pi.test", "--kurse-aus", str(tmp_path / "q")]) == 0


def test_laden_falscher_inhalt(tmp_path, monkeypatch):
    falsch = mache_zip(tmp_path / "f.zip", {"foexlab-update/x.txt": "1"}).read_bytes()
    _fake_download(monkeypatch, inhalt=falsch)
    ziel = tmp_path / "u.zip"
    assert pa.main(["--laden", "--zip", str(ziel)]) == 1
    assert not ziel.exists()
