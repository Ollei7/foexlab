import os, sys
from pathlib import Path

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "server"))
import usb_update  # noqa: E402
from usb_update import aktualisiere, pruefe_quelle  # noqa: E402


def baue_quelle(stick, kurse=("mzi",), index=True):
    q = stick / "foexlab-update"
    q.mkdir(parents=True)
    if index:
        (q / "index.html").write_text("neu-start")
    for k in kurse:
        (q / k).mkdir()
        (q / k / "index.html").write_text("neu-" + k)
    return q


def baue_alt(wurzel):
    ziel = wurzel / "foexlab"
    ziel.mkdir()
    (ziel / "index.html").write_text("alt")
    return ziel, wurzel / "foexlab.vorher"


def test_gueltiger_stick_ersetzt_und_sichert(tmp_path):
    stick = tmp_path / "stick"
    baue_quelle(stick, ("mzi", "bb84"))
    ziel, sich = baue_alt(tmp_path)
    sich.mkdir()
    (sich / "uralt.txt").write_text("x")
    erg = aktualisiere(stick, ziel, sich)
    assert erg.ok, erg.meldung
    assert sorted(erg.kurse) == ["bb84", "mzi"]
    assert (ziel / "index.html").read_text() == "neu-start"
    assert (ziel / "mzi" / "index.html").read_text() == "neu-mzi"
    assert (sich / "index.html").read_text() == "alt"
    assert not (sich / "uralt.txt").exists()
    assert not Path(str(ziel) + ".neu").exists()


def test_ohne_index_html_nichts_kopiert(tmp_path):
    stick = tmp_path / "stick"
    baue_quelle(stick, index=False)
    ziel, sich = baue_alt(tmp_path)
    erg = aktualisiere(stick, ziel, sich)
    assert not erg.ok
    assert (ziel / "index.html").read_text() == "alt"
    assert not sich.exists()
    assert "index.html" in (stick / "update.txt").read_text()


def test_symlink_im_stick_abbruch(tmp_path):
    stick = tmp_path / "stick"
    q = baue_quelle(stick)
    (tmp_path / "geheim.txt").write_text("g")
    (q / "mzi" / "link.txt").symlink_to(tmp_path / "geheim.txt")
    ziel, sich = baue_alt(tmp_path)
    assert any("Verknüpfung" in z for z in pruefe_quelle(q))
    erg = aktualisiere(stick, ziel, sich)
    assert not erg.ok
    assert (ziel / "index.html").read_text() == "alt"
    assert not sich.exists()


def test_symlink_ordner_und_index_abbruch(tmp_path):
    stick = tmp_path / "stick"
    q = baue_quelle(stick, kurse=())
    echt = tmp_path / "echt"
    echt.mkdir()
    (echt / "index.html").write_text("e")
    (q / "kurs").symlink_to(echt)
    assert pruefe_quelle(q)


def test_leere_kursliste_abbruch(tmp_path):
    stick = tmp_path / "stick"
    q = baue_quelle(stick, kurse=())
    (q / "leer").mkdir()  # Ordner ohne index.html zählt nicht
    ziel, sich = baue_alt(tmp_path)
    assert any("Kurs" in z for z in pruefe_quelle(q))
    erg = aktualisiere(stick, ziel, sich)
    assert not erg.ok
    assert (ziel / "index.html").read_text() == "alt"


def test_gueltige_quelle_gibt_leere_liste(tmp_path):
    q = baue_quelle(tmp_path / "stick")
    assert pruefe_quelle(q) == []


def test_fehlende_quelle_meldet(tmp_path):
    assert pruefe_quelle(tmp_path / "gibtsnicht")


def test_update_txt_geschrieben_bei_erfolg_und_fehler(tmp_path):
    ok = tmp_path / "a"
    baue_quelle(ok, ("mzi",))
    ziel, sich = baue_alt(tmp_path)
    aktualisiere(ok, ziel, sich)
    t = (ok / "update.txt").read_text()
    assert "OK" in t and "mzi" in t

    schlecht = tmp_path / "b"
    baue_quelle(schlecht, index=False)
    aktualisiere(schlecht, ziel, sich)
    t = (schlecht / "update.txt").read_text()
    assert "Fehler" in t


def test_alter_stand_bleibt_bei_fehler_mitten_im_kopieren(tmp_path, monkeypatch):
    stick = tmp_path / "stick"
    baue_quelle(stick, ("mzi", "bb84"))
    ziel, sich = baue_alt(tmp_path)
    echt = usb_update._kopiere_datei
    zaehler = {"n": 0}

    def kaputt(a, b):
        zaehler["n"] += 1
        if zaehler["n"] == 2:
            raise OSError("Stick abgezogen")
        echt(a, b)

    monkeypatch.setattr(usb_update, "_kopiere_datei", kaputt)
    erg = aktualisiere(stick, ziel, sich)
    assert not erg.ok
    assert (ziel / "index.html").read_text() == "alt"
    assert not sich.exists()
    assert not Path(str(ziel) + ".neu").exists()
    assert "Fehler" in (stick / "update.txt").read_text()


def test_main_ohne_update_ordner_schreibt_nichts(tmp_path):
    stick = tmp_path / "stick"
    stick.mkdir()
    (stick / "foto.jpg").write_text("x")
    assert usb_update.main([str(stick)]) == 0
    assert sorted(p.name for p in stick.iterdir()) == ["foto.jpg"]
