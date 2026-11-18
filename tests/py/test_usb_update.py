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
    probleme = pruefe_quelle(q)
    assert any("link.txt" in z and "Verknüpfung" in z for z in probleme)
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


# Hinweis: "../" kann in Verzeichnislisten nie als Name vorkommen; ein Ausbruch
# ist nur über Symlinks möglich (oben abgedeckt), realpath-Prüfung ist zusätzlich.


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


def test_eintrag_wird_zwischen_pruefung_und_kopie_zum_symlink(tmp_path, monkeypatch):
    stick = tmp_path / "stick"
    q = baue_quelle(stick)
    (tmp_path / "geheim.txt").write_text("g")
    ziel, sich = baue_alt(tmp_path)
    echt = usb_update.pruefe_quelle

    def pruefe_und_tausche(quelle):
        r = echt(quelle)
        (quelle / "mzi" / "index.html").unlink()
        (quelle / "mzi" / "index.html").symlink_to(tmp_path / "geheim.txt")
        return r

    monkeypatch.setattr(usb_update, "pruefe_quelle", pruefe_und_tausche)
    erg = aktualisiere(stick, ziel, sich)
    assert not erg.ok
    assert (ziel / "index.html").read_text() == "alt"
    assert not sich.exists()
    assert not Path(str(ziel) + ".neu").exists()


def test_zu_wenig_platz(tmp_path, monkeypatch):
    stick = tmp_path / "stick"
    baue_quelle(stick)
    ziel, sich = baue_alt(tmp_path)
    DU = type("DU", (), {"free": 1024})
    monkeypatch.setattr(usb_update.shutil, "disk_usage", lambda p: DU)
    erg = aktualisiere(stick, ziel, sich)
    assert not erg.ok and "Platz" in erg.meldung
    assert (ziel / "index.html").read_text() == "alt"
    assert not Path(str(ziel) + ".neu").exists()


def test_wiederherstellung_nach_absturz(tmp_path):
    stick = tmp_path / "stick"
    baue_quelle(stick, index=False)  # Update scheitert, Wiederherstellung greift trotzdem
    ziel, sich = baue_alt(tmp_path)
    ziel.rename(sich)
    assert not ziel.exists()
    aktualisiere(stick, ziel, sich)
    assert (ziel / "index.html").read_text() == "alt"
    assert not sich.exists()


def test_schon_aktuell_laesst_sicherung_unberuehrt(tmp_path):
    stick = tmp_path / "stick"
    baue_quelle(stick)
    ziel, sich = baue_alt(tmp_path)
    assert aktualisiere(stick, ziel, sich).ok
    sich_inhalt = (sich / "index.html").read_text()
    erg = aktualisiere(stick, ziel, sich)
    assert erg.ok and "aktuell" in erg.meldung
    assert (sich / "index.html").read_text() == sich_inhalt == "alt"


def test_update_txt_laeuft_zuerst_dann_ergebnis(tmp_path, monkeypatch):
    stick = tmp_path / "stick"
    baue_quelle(stick)
    ziel, sich = baue_alt(tmp_path)
    (stick / "update.txt").write_text("uralt")
    gesehen = []
    echt = usb_update._ersetze

    def spaet(*a):
        gesehen.append((stick / "update.txt").read_text())
        return echt(*a)

    monkeypatch.setattr(usb_update, "_ersetze", spaet)
    aktualisiere(stick, ziel, sich)
    assert "läuft" in gesehen[0] and "uralt" not in gesehen[0]
    assert "OK" in (stick / "update.txt").read_text()


def test_eine_zeile_je_befund(tmp_path):
    stick = tmp_path / "stick"
    baue_quelle(stick, index=False, kurse=())
    ziel, sich = baue_alt(tmp_path)
    erg = aktualisiere(stick, ziel, sich)
    assert len(erg.meldung.split("\n")) == 2
    zeilen = (stick / "update.txt").read_text().splitlines()
    assert sum("index.html" in z or "Kursordner" in z for z in zeilen) == 2


def test_protokoll_mit_unlesbarem_namen(tmp_path):
    stick = tmp_path / "stick"
    stick.mkdir()
    usb_update._schreibe_protokoll(stick, usb_update.Ergebnis(False, "a\udcff.txt: kaputt"))
    assert "kaputt" in (stick / "update.txt").read_text()


def test_nicht_utf8_dateiname_im_stick(tmp_path):
    stick = tmp_path / "stick"
    q = baue_quelle(stick)
    try:
        open(os.path.join(bytes(q), b"mzi", b"x\xff.txt"), "w").close()
    except (OSError, ValueError):
        pytest.skip("Dateisystem erlaubt keine Nicht-UTF-8-Namen")
    ziel, sich = baue_alt(tmp_path)
    erg = aktualisiere(stick, ziel, sich)  # darf nicht mit Traceback enden
    assert erg.ok
    assert (stick / "update.txt").read_text()


def test_schreibgeschuetzter_stick_update_wird_trotzdem_angewendet(tmp_path, monkeypatch):
    stick = tmp_path / "stick"
    baue_quelle(stick)
    ziel, sich = baue_alt(tmp_path)

    def nein(*a):
        raise OSError("schreibgeschützt")

    monkeypatch.setattr(usb_update, "_schreibe_text", nein)
    erg = aktualisiere(stick, ziel, sich)
    assert erg.ok
    assert (ziel / "index.html").read_text() == "neu-start"


def _halte_sperre(pfad):
    import fcntl
    f = open(str(pfad), "a")
    fcntl.flock(f.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
    return f


def test_zweiter_stick_wartet_und_wird_abgewiesen(tmp_path):
    stick = tmp_path / "stick"
    stick.mkdir()
    sperre = tmp_path / "run" / "update.lock"
    sperre.parent.mkdir()
    erster = _halte_sperre(sperre)
    try:
        assert usb_update._sperren(sperre, stick, warte_s=0.2, takt=0.05) is None
        assert "anderes Update" in (stick / "update.txt").read_text()
    finally:
        erster.close()


def test_zweiter_stick_wartet_bis_erster_fertig(tmp_path):
    import threading
    stick = tmp_path / "stick"
    stick.mkdir()
    sperre = tmp_path / "update.lock"
    erster = _halte_sperre(sperre)
    threading.Timer(0.2, erster.close).start()
    f = usb_update._sperren(sperre, stick, warte_s=5, takt=0.05)
    assert f is not None and f != "ohne"
    f.close()


def test_main_bei_belegter_sperre_kein_update(tmp_path, monkeypatch):
    stick = tmp_path / "stick"
    baue_quelle(stick)
    sperre = tmp_path / "update.lock"
    monkeypatch.setattr(usb_update, "SPERRE", sperre)
    monkeypatch.setattr(usb_update, "WARTEN_S", 0.1)
    monkeypatch.setattr(usb_update, "TAKT_S", 0.02)
    aufgerufen = []
    monkeypatch.setattr(usb_update, "aktualisiere", lambda s: aufgerufen.append(s))
    erster = _halte_sperre(sperre)
    try:
        assert usb_update.main([str(stick)]) == 1
    finally:
        erster.close()
    assert aufgerufen == []
    t = (stick / "update.txt").read_text()
    assert "Fehler" in t and "anderes Update" in t



def test_unit_gehaertet_und_ohne_ext4():
    server = Path(__file__).resolve().parents[2] / "server"
    unit = (server / "foexlab-usb-update@.service").read_text()
    for zeile in ("NoNewPrivileges=yes", "PrivateNetwork=yes", "ProtectHome=yes",
                  "PrivateTmp=yes", "ProtectSystem=strict",
                  "ReadWritePaths=/srv /run/foexlab-usb"):
        assert zeile in unit
    # Einhängen außerhalb der Sandbox, sonst sieht ExecStart den Stick nicht
    assert "ExecStartPre=+/bin/mount -t vfat,exfat " in unit
    assert "ExecStopPost=-+/bin/umount" in unit or "ExecStopPost=+-/bin/umount" in unit
    assert "ext4" not in unit
    assert "/run/foexlab-usb/update.lock" == str(usb_update.SPERRE)
    regel = [z for z in (server / "99-foexlab-usb.rules").read_text().splitlines()
             if z.strip() and not z.startswith("#")]
    assert len(regel) == 1
    assert 'ENV{ID_FS_TYPE}=="vfat|exfat",' in regel[0] and "ext4" not in regel[0]
