from foexlab.seite import baue


def _kurs(tmp_path):
    k = tmp_path / "kurs"
    (k / "abschnitte").mkdir(parents=True)
    (k / "kurs.yml").write_text('titel: "T"\nid: "t"\n', encoding="utf-8")
    (k / "abschnitte" / "01-sichtbar.md").write_text('---\ntitel: "Sichtbar"\nnr: 1\n---\n## Karte A\n### Frage {.frei}\nText\n', encoding="utf-8")
    (k / "abschnitte" / "99-fragensammlung.md").write_text(
        '---\ntitel: "Fragensammlung"\nnr: "+"\nversteckt: true\n---\n## Standard {.test}\n### Ideen {.frei}\nGeheim\n', encoding="utf-8")
    return k


def test_versteckter_abschnitt_wird_nicht_ausgegeben(tmp_path):
    ziel = tmp_path / "out"
    stats = baue(str(_kurs(tmp_path)), str(ziel), einzeldatei=False, ausgabe=lambda *_: None)
    html = (ziel / "index.html").read_text(encoding="utf-8")
    assert "Sichtbar" in html and "Karte A" in html
    assert "Fragensammlung" not in html and "Geheim" not in html
    assert 'data-karte="fragensammlung/' not in html
    assert stats["sections"] == 2   # gezählt wird weiter, wie bei versteckten Karten

