from foexlab.quelle import slug, parse_attrs, parse_file


def test_slug():
    assert slug("Aufbau & Justage des Interferometers") == "aufbau-justage-des-interferometers"
    assert slug("Größe ändern") == "groesse-aendern"


def test_slug_maximal_40_zeichen():
    assert len(slug("a" * 60)) == 40


def test_parse_attrs_id():
    assert parse_attrs('.frei #messung1') == (["frei"], {"id": "messung1"})


def test_parse_michelson_justage():
    sec = parse_file("tests/py/daten/michelson_abschnitte/01-justage-des-interferometers.md")
    assert sec["fm"]["titel"] == "Justage des Interferometers"
    assert [a["title"] for a in sec["acts"]][:2] == ["Bauteile des Michaelson-Interferometers", "Aufbau und Justage des Interferometers"]
