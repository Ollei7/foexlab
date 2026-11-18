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


def test_skizze_mit_vorlagenbild_bereit():
    # Skizze: bild= relativ zum Kursordner (mit media/); Bildzuordnung: bild= relativ zu media/ – wie die Engine
    b = bericht("skizze-vorlage")
    assert texte(b) == [] and b.bereit


def test_skizze_vorlagenbild_fehlt():
    b = bericht("skizze-vorlage-fehlt")
    assert gefunden(b, "media/fehlt.png", "01-start.md:"), texte(b)
    assert not any("media/media" in t for t in texte(b)), texte(b)
    assert gefunden(b, "vorlage.png", "nicht im Ordner media"), texte(b)   # Skizze: bild= braucht media/
    assert len(texte(b)) == 2, texte(b)                                   # Engine-Warnung nicht doppelt
    assert not b.bereit


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
    assert "-m pip install -r requirements.txt" in out and "npm install" in out


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
    assert zeilen[-1] == "noch nicht bereit (1 Punkt)"
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


def test_mc_sperrt_ohne_antworten():
    b = bericht("mc-ohne-antworten")
    assert gefunden(b, "Sicherungsfrage", "gar keine Antworten"), texte(b)
    assert not b.bereit


def test_quiz_frage_ohne_optionen():
    b = bericht("quiz-ohne-optionen")
    assert gefunden(b, "Quiz-Serie", "keine richtige Antwort"), texte(b)


def test_kartenregel_im_nachschlagekapitel_wird_geprueft():
    b = bericht("nachschlagen-kartenregel")
    assert gefunden(b, "gibt/esnicht", "02-nach.md"), texte(b)


def test_leerer_kurs():
    b = bericht("leer")
    assert gefunden(b, "keine Karten"), texte(b)


def test_werkzeug_test_muss_dateinamen_oder_namen_nennen(tmp_path):
    tests_dir = tmp_path / "t"; tests_dir.mkdir()
    (tests_dir / "a.test.js").write_text("// x.js wird hier nur erwähnt: xy", encoding="utf-8")
    m = kp.Modell(os.path.join(FAELLE, "werkzeug-ohne-test"), "werkzeug-ohne-test")
    m.lies_quelle()
    assert gefunden_in(kp.pruefe_werkzeuge(m, str(tests_dir)), "x.js")
    (tests_dir / "a.test.js").write_text("ladeDatei(w, 'kurse/k/werkzeuge/x.js')", encoding="utf-8")
    assert kp.pruefe_werkzeuge(m, str(tests_dir)) == []
    (tests_dir / "a.test.js").write_text("arten['x']", encoding="utf-8")
    assert kp.pruefe_werkzeuge(m, str(tests_dir)) == []


def gefunden_in(befunde, *teile):
    return any(all(t in f.text for t in teile) for f in befunde)


@pytest.mark.parametrize("fall,teil", [("kopf-kaputt", "kein gültiges YAML"), ("kopf-liste", "kein gültiges YAML"), ("nicht-utf8", "UTF-8"),
                                       ("bedingung-liste", "muss ein Text sein"), ("kursyml-liste", "kurs.yml")])
def test_kaputte_quelle_wird_befund_mit_datei(fall, teil):
    b = bericht(fall)
    assert len(b.befunde) == 1 and teil in b.befunde[0].text and ".md" in b.befunde[0].ort + "kurs.yml".replace("kurs.yml", ".md"), texte(b)
    assert "Traceback" not in b.befunde[0].text


def test_knopf_oeffnet_karte_ist_kein_befund():
    # Freigabe läuft über knopf:<id>; oeffnet ist nur das Sprungziel, eine Karten-Kennung springt zwar nicht, sperrt aber niemanden aus (mzi nutzt das)
    assert bericht("knopf-karte").befunde == []


def test_felder_auf_karte_ohne_aufgaben_oeffnet_sofort():
    assert gefunden(bericht("platzhalterkarte"), "öffnet sich sofort")


def test_unicode_ausgabe_ohne_fehler(monkeypatch):
    import io
    roh = io.BytesIO()
    monkeypatch.setattr(sys, "stdout", io.TextIOWrapper(roh, encoding="ascii"))
    assert kp.main([os.path.join(FAELLE, "ziel-fehlt"), "--ohne-tests"]) == 1
    sys.stdout.flush()
    assert b"noch nicht bereit" in roh.getvalue()


def test_pruefwerkzeug_fehler_ohne_traceback(monkeypatch, capsys):
    monkeypatch.setattr(kp, "pruefe_medien", lambda m: 1 / 0)
    assert kp.main([os.path.join(FAELLE, "gut"), "--ohne-tests"]) == 2
    out = capsys.readouterr().out
    assert "Traceback" not in out and "melden" in out


# ---------------------------------------------------------------- Kurstests, Pfadaufruf

def kopie_von_gut(tmp_path, name="kopie"):
    ziel = tmp_path / name
    shutil.copytree(os.path.join(FAELLE, "gut"), ziel)
    (ziel / "kurs.yml").write_text(f'titel: "Kopie"\nid: "{name}"\n', encoding="utf-8")
    return ziel


def test_kurstests_gruen_mzi():
    b = kp.pruefe("kurse/mzi")
    assert texte(b) == [] and b.einrichtung == [] and b.bereit


def test_kaputter_kurstest():
    b = kp.pruefe(os.path.join(FAELLE, "kurstest-rot"))
    assert len(b.befunde) == 1
    assert "Test ‚Messwert wird richtig umgerechnet‘ schlägt fehl" in b.befunde[0].text
    alles = " ".join(texte(b))
    assert "Summe stimmt" not in alles and "AssertionError" not in alles and "    at " not in alles
    assert any("AssertionError" in z for z in b.rohausgabe)


def test_kaputter_kurstest_cli(capsys):
    assert kp.main([os.path.join(FAELLE, "kurstest-rot")]) == 1
    out = capsys.readouterr().out
    assert "Traceback" not in out and "AssertionError" not in out
    assert out.rstrip("\n").splitlines()[-1] == "noch nicht bereit (1 Punkt)"
    assert kp.main([os.path.join(FAELLE, "kurstest-rot"), "--details"]) == 1
    assert "AssertionError" in capsys.readouterr().out


def test_ohne_tests_laesst_roten_test_aus():
    assert kp.pruefe(os.path.join(FAELLE, "kurstest-rot"), tests=False).bereit


def test_pfad_statt_id(tmp_path):
    ziel = kopie_von_gut(tmp_path)
    (ziel / "tests" / "js").mkdir(parents=True)
    (ziel / "tests" / "js" / "gruen.test.js").write_text("require('node:test')('ok', () => {});\n", encoding="utf-8")
    assert kp.pruefe(str(ziel)).bereit
    (ziel / "tests" / "js" / "rot.test.js").write_text("require('node:test')('kaputt hier', () => { throw new Error('x'); });\n", encoding="utf-8")
    b = kp.pruefe(str(ziel))
    assert gefunden(b, "Test ‚kaputt hier‘ schlägt fehl") and len(b.befunde) == 1


def test_python_test_des_kurses(tmp_path):
    ziel = kopie_von_gut(tmp_path)
    (ziel / "tests" / "py").mkdir(parents=True)
    (ziel / "tests" / "py" / "test_kopie.py").write_text("def test_gut():\n    assert True\n\ndef test_schlecht():\n    assert 1 == 2\n", encoding="utf-8")
    b = kp.pruefe(str(ziel))
    assert gefunden(b, "Test ‚test_schlecht‘ schlägt fehl") and len(b.befunde) == 1
    assert not any("assert" in x.text for x in b.befunde)


def test_test_zu_langsam(tmp_path, monkeypatch):
    ziel = kopie_von_gut(tmp_path)
    (ziel / "tests" / "js").mkdir(parents=True)
    (ziel / "tests" / "js" / "lahm.test.js").write_text("require('node:test')('lahm', async () => { await new Promise(r => setTimeout(r, 20000)); });\n", encoding="utf-8")
    monkeypatch.setattr(kp, "TEST_ZEITLIMIT", 2)
    b = kp.pruefe(str(ziel))
    assert gefunden(b, "Tests brauchen zu lange")


def test_einrichtung_vor_tests(monkeypatch):
    monkeypatch.setattr(kp, "NODE_MODULES", "/gibt/es/nicht")
    b = kp.pruefe(os.path.join(FAELLE, "kurstest-rot"))
    assert b.einrichtung and b.befunde == []
