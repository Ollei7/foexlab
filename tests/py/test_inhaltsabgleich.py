import os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SKRIPT = os.path.join(ROOT, "tools", "inhaltsabgleich.py")

AUSZUG = """Lernblatt

Das ist der erste Satz, der im Kurs vorkommt und lang genug ist. Der zweite Satz steht ebenfalls im Kurs, auch mit |↑⟩ und „Anführungszeichen“.
Dieser dritte Satz fehlt im Kurs vollständig und wird deshalb gemeldet!
"""
KURS_MD = """---
titel: Test
nr: 1
---
## Karte

Das ist der erste Satz, der im Kurs vorkommt und lang genug ist. Der zweite
Satz steht ebenfalls im Kurs, auch mit ↑ und "Anführungszeichen".

Die Lücke steht mitten im Satz, den der Kurs bei jeder Auswahl vollständig zeigt: Dieser Teil vor der Lücke ist lang genug ein kein und dieser Teil nach der Lücke ebenfalls.
"""


def _kurs(tmp_path):
    k = tmp_path / "kurs"; (k / "abschnitte").mkdir(parents=True)
    (k / "kurs.yml").write_text("titel: Test\nid: t\n", encoding="utf-8")
    (k / "abschnitte" / "00-a.md").write_text(KURS_MD, encoding="utf-8")
    (tmp_path / "auszug.md").write_text(AUSZUG, encoding="utf-8")
    return k


def _lauf(tmp_path, *extra):
    return subprocess.run([sys.executable, SKRIPT, str(tmp_path / "auszug.md"), str(tmp_path / "kurs")] + list(extra), capture_output=True, text=True, cwd=ROOT)


def test_ein_fehlender_satz_wird_gemeldet(tmp_path):
    _kurs(tmp_path)
    r = _lauf(tmp_path)
    assert r.returncode == 1, r.stdout + r.stderr
    assert "Dieser dritte Satz fehlt im Kurs vollständig" in r.stdout
    assert r.stdout.count("FEHLT") == 1
    assert "erste Satz" not in r.stdout.split("FEHLT")[1]


def test_ausnahme_mit_grund_ergibt_exit_0(tmp_path):
    _kurs(tmp_path)
    (tmp_path / "ausnahmen.txt").write_text("# Kommentar\nDieser dritte Satz fehlt im Kurs # Test-Ausnahme\n", encoding="utf-8")
    r = _lauf(tmp_path, "--ausnahmen", str(tmp_path / "ausnahmen.txt"))
    assert r.returncode == 0, r.stdout + r.stderr
    assert "Ausnahme" in r.stdout and "Test-Ausnahme" in r.stdout


def test_zu_kurze_ausnahme_wird_abgelehnt(tmp_path):
    _kurs(tmp_path)
    (tmp_path / "ausnahmen.txt").write_text("Dieser # zu kurz\n", encoding="utf-8")
    r = _lauf(tmp_path, "--ausnahmen", str(tmp_path / "ausnahmen.txt"))
    assert r.returncode == 2 and "mindestens 20 Zeichen" in r.stderr


def test_werkzeugtexte_zaehlen_als_kurstext(tmp_path):
    k = _kurs(tmp_path)
    (k / "werkzeuge").mkdir()
    (k / "werkzeuge" / "w.js").write_text("var t = 'Dieser dritte Satz fehlt im Kurs vollständig und wird deshalb gemeldet!';", encoding="utf-8")
    r = _lauf(tmp_path)
    assert r.returncode == 0, r.stdout + r.stderr


def _quelle(tmp_path, abschnitte):
    q = tmp_path / "quelle"; q.mkdir()
    (q / "1-test.md").write_text(abschnitte, encoding="utf-8")
    return q


QUELLE_MD = """# Teil

## Karte
<!-- Kommentar, der nicht zählt -->
Das ist der erste Satz, der im Kurs vorkommt und lang genug ist.

- Der zweite Satz steht ebenfalls im Kurs, auch mit ↑ und "Anführungszeichen". (richtig)

Bei falscher Antwort: Das ist der erste Satz, der im Kurs vorkommt und lang genug ist.

Bei richtiger Antwort: Das ist der erste Satz, der im Kurs vorkommt und lang genug ist.

Die Lücke steht mitten im Satz, den der Kurs bei jeder Auswahl vollständig zeigt: Dieser Teil vor der Lücke ist lang genug {{ein|kein}} und dieser Teil nach der Lücke ebenfalls.

## Fehlt
Dieser dritte Satz fehlt im Kurs vollständig und wird deshalb gemeldet!
"""


def _lauf_md(tmp_path, *extra):
    _kurs(tmp_path)
    q = _quelle(tmp_path, QUELLE_MD)
    return subprocess.run([sys.executable, SKRIPT, str(tmp_path / "kurs"), "--quelle-md", str(q)] + list(extra), capture_output=True, text=True, cwd=ROOT)


def test_quelle_md_meldet_fehlenden_abschnitt(tmp_path):
    r = _lauf_md(tmp_path)
    assert r.returncode == 1, r.stdout + r.stderr
    assert "FEHLT [1-test: Fehlt]" in r.stdout and r.stdout.count("FEHLT") == 1


def test_quelle_md_abschnittsausnahme(tmp_path):
    (tmp_path / "ausn.txt").write_text("1-test: Fehlt # bewusst\n", encoding="utf-8")
    r = _lauf_md(tmp_path, "--ausnahmen", str(tmp_path / "ausn.txt"))
    assert r.returncode == 0, r.stdout + r.stderr


def test_quelle_md_satzausnahme(tmp_path):
    (tmp_path / "ausn.txt").write_text("1-test: Fehlt | Dieser dritte Satz fehlt im Kurs # bewusst\n", encoding="utf-8")
    r = _lauf_md(tmp_path, "--ausnahmen", str(tmp_path / "ausn.txt"))
    assert r.returncode == 0, r.stdout + r.stderr


def test_quelle_md_zu_kurzer_satzanfang_exit_2(tmp_path):
    (tmp_path / "ausn.txt").write_text("1-test: Fehlt | Dieser # zu kurz\n", encoding="utf-8")
    r = _lauf_md(tmp_path, "--ausnahmen", str(tmp_path / "ausn.txt"))
    assert r.returncode == 2, r.stdout + r.stderr
    assert "mindestens 20 Zeichen" in r.stderr and "Traceback" not in r.stderr
