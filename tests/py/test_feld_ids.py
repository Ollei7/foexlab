from foexlab.quelle import parse_file, ids_vergeben


def test_michelson_02_eindeutig():
    sec = parse_file("tests/py/daten/michelson_abschnitte/02-brechungsindex-von-luft-bestimmen.md")
    ids_vergeben(sec, "02-brechungsindex-von-luft-bestimmen.md")
    ids = [q["id"] for a in sec["acts"] for q in a["qs"]]
    assert len(ids) == len(set(ids))
    assert ids[0].startswith("brechungsindex-von-luft-bestimmen/was-steckt-hinter-dem-begriff-brechungsi/")


def test_eigene_kennung_und_doppelte(tmp_path):
    f = tmp_path / "02-brechungsindex-von-luft-bestimmen.md"
    f.write_text("---\ntitel: x\n---\n## Messung und Auswertung\n### Messung {.frei #m1}\n### Messung {.frei}\n### Messung {.frei}\n", encoding="utf-8")
    sec = parse_file(str(f))
    ids_vergeben(sec, f.name)
    assert [q["id"] for q in sec["acts"][0]["qs"]] == [
        "brechungsindex-von-luft-bestimmen/messung-und-auswertung/m1",
        "brechungsindex-von-luft-bestimmen/messung-und-auswertung/messung",
        "brechungsindex-von-luft-bestimmen/messung-und-auswertung/messung-2",
    ]
    assert sec["acts"][0]["id"] == "brechungsindex-von-luft-bestimmen/messung-und-auswertung"


def test_feld_wird_mit_id_gerendert():
    from foexlab.seite import Kontext
    from foexlab.fragen import render_q
    q = dict(title="Begründe", cls=["frei"], kv={}, lines=["Warum?"], id="a/k/begruende")
    h = render_q(Kontext("tests/py/daten/minikurs"), q, 1, 1)
    assert 'data-fx-id="a/k/begruende"' in h and 'data-fx-art="text"' in h and "<textarea" in h
