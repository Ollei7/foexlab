from foexlab.seite import baue


def _kurs(tmp_path):
    k = tmp_path / "kurs"
    (k / "abschnitte").mkdir(parents=True)
    (k / "kurs.yml").write_text('titel: "T"\nid: "t"\n', encoding="utf-8")
    (k / "abschnitte" / "01-a.md").write_text(
        '---\ntitel: "A"\nnr: 1\n---\n## Karte A\n:::lehrkraft\nLeitfragen für die Besprechung\n:::\n### Frage {.frei}\nText\n', encoding="utf-8")
    return k


def test_lehrkraft_kasten_wird_ausgegeben(tmp_path):
    ziel = tmp_path / "out"
    baue(str(_kurs(tmp_path)), str(ziel), einzeldatei=False, ausgabe=lambda *_: None)
    html = (ziel / "index.html").read_text(encoding="utf-8")
    assert '<div class="fx-lehrkraft"' in html and "Leitfragen" in html


def test_lehrkraft_nie_gedruckt():
    import re
    css = open("engine/web/css/bausteine.css", encoding="utf-8").read()
    assert re.search(r"@media print\s*\{\s*\.fx-lehrkraft\s*\{\s*display:\s*none\s*!important", css)
