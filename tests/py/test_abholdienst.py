import json, os, re, sys, threading, urllib.error, urllib.request

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "server"))
from abholdienst import Ablage, SpeicherVoll, normalisiere, erzeuge_server  # noqa: E402

ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"


def test_normalisiere():
    assert normalisiere(" k7 p-2 ") == "K7P2"


def test_ablaufen(tmp_path):
    t = [0.0]
    a = Ablage(str(tmp_path), ttl_s=10, uhr=lambda: t[0])
    code = a.ablegen(b"%PDF-1.4 x", "mzi")
    assert re.fullmatch(f"[{ALPHABET}]{{4}}", code)
    daten, name = a.holen(code.lower())
    assert daten == b"%PDF-1.4 x" and name == f"Protokoll-mzi-{code}.pdf"
    t[0] = 11
    assert a.holen(code) is None
    assert a.aufraeumen() == 0
    assert not list(tmp_path.iterdir())


def test_start_leert_verzeichnis(tmp_path):
    (tmp_path / "alt.pdf").write_bytes(b"x")
    Ablage(str(tmp_path))
    assert not list(tmp_path.iterdir())


def test_codes_eindeutig(tmp_path):
    a = Ablage(str(tmp_path))
    codes = {a.ablegen(b"%PDF-1", "m") for _ in range(200)}
    assert len(codes) == 200


@pytest.fixture
def dienst(tmp_path):
    srv = erzeuge_server(Ablage(str(tmp_path)), "127.0.0.1", 0)
    th = threading.Thread(target=srv.serve_forever, daemon=True); th.start()
    yield f"http://127.0.0.1:{srv.server_address[1]}"
    srv.shutdown()


class Antwort:
    def __init__(self, status, body, headers):
        self.status, self.body, self.headers = status, body, headers
        self.text = body.decode("utf-8", "replace")


def anfrage(url, daten=None, kopf=None):
    req = urllib.request.Request(url, data=daten, headers=kopf or {}, method="POST" if daten is not None else "GET")
    try:
        with urllib.request.urlopen(req) as r:
            return Antwort(r.status, r.read(), r.headers)
    except urllib.error.HTTPError as e:
        return Antwort(e.code, e.read(), e.headers)


def post(dienst, daten, experiment="mzi"):
    return anfrage(dienst + "/api/ablegen", daten, {"X-Experiment": experiment, "Content-Type": "application/pdf"})


def test_http(dienst):
    assert post(dienst, b"kein pdf").status == 400
    assert "Keine PDF-Datei." in post(dienst, b"kein pdf").text
    gross = post(dienst, b"%PDF-" + b"0" * 26_214_400)
    assert gross.status == 413 and "zu groß" in gross.text
    assert post(dienst, b"%PDF-1.4", experiment="../etc").status == 400
    r = post(dienst, b"%PDF-1.4 x")
    assert r.status == 201
    code = json.loads(r.body)["code"]
    assert json.loads(r.body)["url"] == f"/abholen?code={code}"
    g = anfrage(dienst + f"/api/abholen/{code[:2]}%20{code[2:].lower()}")
    assert g.status == 200 and g.body == b"%PDF-1.4 x"
    assert f'filename="Protokoll-mzi-{code}.pdf"' in g.headers["Content-Disposition"]
    seite = anfrage(dienst + f"/abholen?code={code}")
    assert seite.status == 200 and "Protokoll herunterladen" in seite.text and f"/api/abholen/{code}" in seite.text


def test_unbekannter_code(dienst):
    r = anfrage(dienst + "/abholen?code=ZZZZ")
    assert r.status == 404 and "unbekannt oder abgelaufen" in r.text
    assert anfrage(dienst + "/api/abholen/ZZZZ").status == 404


def test_formular(dienst):
    r = anfrage(dienst + "/abholen")
    assert r.status == 200 and "Abholcode eingeben" in r.text


def test_gesamtgroesse_begrenzt(tmp_path):
    a = Ablage(str(tmp_path), max_gesamt=10)
    a.ablegen(b"%PDF-1234", "m")
    with pytest.raises(SpeicherVoll):
        a.ablegen(b"%PDF-1234", "m")
    assert len(list(tmp_path.iterdir())) == 1


def test_speicher_voll_http(tmp_path):
    srv = erzeuge_server(Ablage(str(tmp_path), max_gesamt=10), "127.0.0.1", 0)
    th = threading.Thread(target=srv.serve_forever, daemon=True); th.start()
    url = f"http://127.0.0.1:{srv.server_address[1]}"
    try:
        assert post(url, b"%PDF-1234").status == 201
        r = post(url, b"%PDF-1234")
        assert r.status == 507 and "voll" in r.text
    finally:
        srv.shutdown()


def test_raten_wird_gebremst(tmp_path):
    t = [0.0]
    a = Ablage(str(tmp_path), uhr=lambda: t[0])
    code = a.ablegen(b"%PDF-1", "m")
    for _ in range(20):
        assert a.holen("ZZZZ", absender="10.0.0.5") is None
    assert a.gesperrt("10.0.0.5")
    assert a.holen(code, absender="10.0.0.5") is None      # gesperrt, auch mit richtigem Code
    assert a.holen(code, absender="10.0.0.6") is not None  # andere Geräte nicht betroffen
    t[0] = 601
    assert not a.gesperrt("10.0.0.5")
