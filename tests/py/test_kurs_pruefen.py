import os, shutil, subprocess, sys

import pytest

sys.path.insert(0, "tools")
import kurs_pruefen as kp

FAELLE = "tests/py/daten/pruefkurse"


def bericht(fall):
    return kp.pruefe(os.path.join(FAELLE, fall), tests=False)


def texte(b):
    return [f"{x.text} ({x.ort})" for x in b.befunde]


def gefunden(b, *teile):
    return any(all(t in z for t in teile) for z in texte(b))


def test_gut_ist_bereit():
    b = bericht("gut")
    assert b.befunde == [] and b.einrichtung == [] and b.bereit


def test_mzi_bereit():
    b = kp.pruefe("kurse/mzi", tests=False)
    assert texte(b) == [] and b.einrichtung == [] and b.bereit


def test_warnung_wird_befund():
    b = bericht("warnung")
    assert gefunden(b, "versuche wirkt nur mit sperrt", "01-start.md:"), texte(b)
    assert not b.bereit


def test_oeffnet_nach_ziel_fehlt():
    b = bericht("ziel-fehlt")
    assert gefunden(b, "Kapitel 2", "start/gibt-es-nicht", "02-weiter.md"), texte(b)


def test_oeffnet_nach_auf_platzhalterkarte():
    b = bericht("platzhalterkarte")
    assert gefunden(b, "Karte ohne Aufgaben", "Kapitel 2"), texte(b)
    assert not b.bereit


def test_oeffnet_nach_auf_versteckte_karte():
    b = bericht("versteckte-karte")
    assert gefunden(b, "versteckte Karte", "start/geheim"), texte(b)


def test_freischaltkreis():
    b = bericht("kreis")
    assert gefunden(b, "Kreis", "Teil A", "Teil B"), texte(b)


def test_kapitel1_mit_bedingung():
    b = bericht("kapitel1-bedingung")
    assert gefunden(b, "Kapitel 1", "01-start.md"), texte(b)


def test_mc_sperrt_ohne_richtige():
    b = bericht("mc-ohne-richtige")
    assert gefunden(b, "Sicherungsfrage", "richtige Antwort"), texte(b)


def test_doppelte_ids_und_titel():
    b = bericht("doppelte-ids")
    assert gefunden(b, "Kennung", "wert"), texte(b)
    assert gefunden(b, "Titel", "Messung"), texte(b)


def test_werkzeug_fehlt():
    b = bericht("werkzeug-fehlt")
    assert gefunden(b, "Werkzeug", "x.js"), texte(b)


def test_werkzeug_ohne_test():
    b = bericht("werkzeug-ohne-test")
    assert gefunden(b, "x.js", "Test", "tests/js/werkzeug-ohne-test"), texte(b)


def test_platzhalter_liste():
    b = bericht("platzhalter-liste")
    assert b.befunde == [], texte(b)
    assert len(b.platzhalter) == 1 and "Interferometer" in b.platzhalter[0]
    assert b.bereit


def test_medien_fehlen():
    b = bericht("medien-fehlen")
    assert gefunden(b, "media/fehlt.png", "01-start.md:"), texte(b)
    assert gefunden(b, "bilder/extern.png", "media"), texte(b)


def test_kurs_id_ungueltig(tmp_path, capsys):
    ziel = tmp_path / "Mein Kurs"
    shutil.copytree(os.path.join(FAELLE, "gut"), ziel)
    assert kp.main([str(ziel)]) == 2
    out = capsys.readouterr().out
    assert "Mein Kurs" in out and "Traceback" not in out


def test_kurs_fehlt(capsys):
    assert kp.main(["gibt-es-nicht"]) == 2
    assert "Traceback" not in capsys.readouterr().out


def test_einrichtung_fehlt(monkeypatch, capsys):
    monkeypatch.setitem(sys.modules, "PIL", None)
    monkeypatch.setattr(kp, "NODE_MODULES", "/gibt/es/nicht")
    code = kp.main([os.path.join(FAELLE, "gut")])
    out = capsys.readouterr().out
    assert code == 2 and "Traceback" not in out
    assert "pip3 install -r requirements.txt" in out and "npm install" in out


def test_node_modules_fehlt_nur_hinweis_ohne_tests(monkeypatch):
    monkeypatch.setattr(kp, "NODE_MODULES", "/gibt/es/nicht")
    assert kp.pruefe(os.path.join(FAELLE, "gut"), tests=False).einrichtung == []


def test_cli_letzte_zeile():
    def lauf(fall):
        return subprocess.run([sys.executable, "tools/kurs_pruefen.py", os.path.join(FAELLE, fall), "--ohne-tests"], capture_output=True, text=True)
    r = lauf("gut")
    assert r.returncode == 0 and r.stdout.rstrip("\n").splitlines()[-1] == "bereit"
    r = lauf("ziel-fehlt")
    assert r.returncode == 1
    zeilen = r.stdout.rstrip("\n").splitlines()
    assert zeilen[-1] == "noch nicht bereit (1 Punkte)" or zeilen[-1].startswith("noch nicht bereit (")
    assert any(z.startswith("– ") for z in zeilen[:-1])


def test_details_zeigt_engine_ausgabe(capsys):
    assert kp.main([os.path.join(FAELLE, "gut"), "--details", "--ohne-tests"]) == 0
    assert "OK " in capsys.readouterr().out


def test_doppelte_kartentitel_im_kapitel():
    b = bericht("doppelte-karten")
    assert gefunden(b, "Einstieg", "Karten desselben Kapitels"), texte(b)


def test_knopf_fehlt():
    b = bericht("knopf-fehlt")
    assert gefunden(b, "Knopf", "gibt-es-nicht", "Kapitel 2"), texte(b)
