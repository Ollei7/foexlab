"""Welche Kurse berührt ein Pull Request, und darf ein kurs/*-Zweig das ändern?"""
import os, subprocess, sys
sys.path.insert(0, "tools")
import geaenderte_kurse as gk, kurs_pr_regeln as regeln

KURSE = {"mzi", "pendel-2"}


def test_dateien_zu_ids_dedupliziert_und_sortiert():
    dateien = ["kurse/mzi/kurs.yml", "kurse/mzi/abschnitte/01.md", "tests/js/mzi/x.test.js",
               "tests/py/test_mzi_struktur.py", "README.md", "engine/build.py"]
    assert gk.kurse_aus_dateien(dateien, KURSE) == ["mzi"]


def test_nur_existierende_kurse():
    assert gk.kurse_aus_dateien(["kurse/geloescht/kurs.yml", "tests/js/gibtsnicht/a.js"], KURSE) == []


def test_bindestrich_id_und_python_test():
    dateien = ["tests/py/test_pendel_2_x.py", "tests/js/pendel-2/a.test.js", "kurse/mzi/kurs.yml"]
    assert gk.kurse_aus_dateien(dateien, KURSE) == ["mzi", "pendel-2"]


def test_pytest_dateiname_ohne_trennzeichen_zaehlt_nicht():
    assert gk.kurse_aus_dateien(["tests/py/test_mzix.py"], KURSE) == []


def test_cli_ohne_git_basis_meldet_deutsch():
    r = subprocess.run([sys.executable, "tools/geaenderte_kurse.py", "gibt-es-nicht"], capture_output=True, text=True)
    assert r.returncode == 2 and "Traceback" not in r.stderr and "Vergleich" in r.stderr


def test_alle_wenn_fremd_nur_bei_dateien_ausserhalb_der_kurse(tmp_path):
    (tmp_path / gk.BEISPIELKURS).mkdir(parents=True)
    nur_kurs = ["kurse/mzi/kurs.yml", "tests/js/mzi/a.test.js", "tests/py/test_kurs_pruefen.py"]
    assert gk.pruefziele(nur_kurs, KURSE, True, root=str(tmp_path)) == ["mzi"]
    for fremd in ("engine/build.py", "tools/kurs_pruefen.py", ".claude/skills/foexlab-kurs/SKILL.md",
                  "package.json", "tests/js/helfer.js", "tests/py/conftest.py", "README.md"):
        assert gk.pruefziele(nur_kurs + [fremd], KURSE, True, root=str(tmp_path)) == \
            ["mzi", "pendel-2", gk.BEISPIELKURS], fremd
        assert gk.pruefziele(nur_kurs + [fremd], KURSE, False, root=str(tmp_path)) == ["mzi"], fremd
    assert gk.pruefziele(["engine/x.py"], KURSE, True, root=str(tmp_path / "leer")) == ["mzi", "pendel-2"]


def test_cli_alle_wenn_fremd_falsche_eingabe():
    r = subprocess.run([sys.executable, "tools/geaenderte_kurse.py", "--alle-wenn-fremd"], capture_output=True, text=True)
    assert r.returncode == 2 and "Aufruf" in r.stderr


def test_beispielkurs_pfad_gibt_es():
    assert os.path.isfile(os.path.join(gk.BEISPIELKURS, "kurs.yml"))


# --- Regeln für kurs/*-Zweige

def test_eigener_kurs_ist_erlaubt():
    d = ["kurse/pendel-2/kurs.yml", "tests/js/pendel-2/a.test.js", "tests/py/test_pendel_2_x.py",
         "kurse/pendel-2/WERKZEUGE.md"]
    assert regeln.verstoesse("kurs/pendel-2", d, KURSE) == []
    assert regeln.verstoesse("kurs/pendel-2-ueberarbeitung", d, KURSE) == []


def test_engine_server_tools_github_skill_sind_verboten():
    for datei in ("engine/build.py", "server/x.sh", "tools/kurs_pruefen.py", ".github/workflows/pruefen.yml",
                  ".claude/skills/foexlab-kurs/SKILL.md", ".claude/skills/foexlab-kurs/referenz/werkzeuge.md",
                  "README.md", "docs/FORMAT.md", "package.json"):
        v = regeln.verstoesse("kurs/mzi", ["kurse/mzi/kurs.yml", datei], KURSE)
        assert len(v) == 1 and datei in v[0], datei


def test_fremder_kurs_ist_verboten():
    v = regeln.verstoesse("kurs/pendel-2", ["kurse/mzi/kurs.yml", "tests/js/mzi/a.js"], KURSE)
    assert len(v) == 2


def test_neuer_kurs_passt_zum_zweignamen():
    assert regeln.verstoesse("kurs/neu", ["kurse/neu/kurs.yml", "tests/js/neu/a.js"], KURSE) == []
    assert regeln.verstoesse("kurs/neu", ["kurse/anders/kurs.yml"], KURSE) != []


def test_andere_zweige_sind_frei():
    assert regeln.verstoesse("autoren-skill", ["engine/build.py", "kurse/mzi/kurs.yml"], KURSE) == []
    assert regeln.verstoesse("meinkurs/x", ["engine/build.py"], KURSE) == []


def test_pfad_tricks():
    assert regeln.verstoesse("kurs/mzi", ["kurse/mzi/../../engine/build.py"], KURSE) != []
    assert regeln.verstoesse("kurs/mzi", ["kurse/mzix/kurs.yml"], KURSE) != []


def test_testdatei_gehoert_zum_laengsten_passenden_kurs():
    kurse = {"mzi", "mzi-x"}
    assert gk.kurs_zu_datei("tests/py/test_mzi_x_a.py", kurse) == "mzi-x"
    assert regeln.verstoesse("kurs/mzi", ["kurse/mzi/kurs.yml", "tests/py/test_mzi_x_a.py"], kurse) != []
    assert regeln.verstoesse("kurs/mzi", ["kurse/mzi/kurs.yml", "tests/py/test_mzi_struktur.py"], kurse) == []


def test_umbenennung_ueber_die_grenze_wird_gesehen(tmp_path):
    def git(*a):
        subprocess.run(["git", "-c", "user.name=t", "-c", "user.email=t@t"] + list(a), cwd=tmp_path, check=True, capture_output=True)
    git("init", "-q", "-b", "main")
    (tmp_path / "engine").mkdir(); (tmp_path / "kurse" / "mzi").mkdir(parents=True)
    (tmp_path / "engine" / "x.py").write_text("print('inhalt der datei ist lang genug')\n" * 5)
    (tmp_path / "kurse" / "mzi" / "kurs.yml").write_text("a: 1\n")
    git("add", "."); git("commit", "-q", "-m", "a")
    git("checkout", "-q", "-b", "kurs/mzi")
    git("mv", "engine/x.py", "kurse/mzi/x.py"); git("commit", "-q", "-m", "b")
    dateien = gk.geaenderte_dateien("main", root=str(tmp_path))
    assert "engine/x.py" in dateien and "kurse/mzi/x.py" in dateien
    v = regeln.verstoesse("kurs/mzi", dateien, {"mzi"})
    assert len(v) == 1 and "engine/x.py" in v[0]
