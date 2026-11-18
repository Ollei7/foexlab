#!/usr/bin/env python3
"""Abholdienst für Protokoll-PDFs im foeXlab-WLAN (nur Standardbibliothek).

POST /api/ablegen        (Kopfzeile X-Experiment, Body PDF) -> 201 {"code", "url"}
GET  /abholen[?code=X]   Formular bzw. Seite mit Download-Knopf
GET  /api/abholen/<code> PDF als Download

Dateien liegen nur in --ablage (auf dem Pi: /run/foexlab-abholung, tmpfs) und verfallen nach 12 h,
gemessen ab Systemstart (time.monotonic), weil der Pi ohne Internet keine verlässliche Uhrzeit hat.
"""
import argparse, html, json, os, re, secrets, threading, time, urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"   # ohne 0/O, 1/I
MAX_BYTES = 25 * 1024 * 1024
TTL_S = 12 * 3600
MAX_GESAMT = 120 * 1024 * 1024   # Obergrenze aller abgelegten PDFs (/run ist auf dem Pi klein)
FEHLVERSUCHE, SPERRE_S = 20, 600   # nach 20 falschen Codes 10 Minuten Pause für dieses Gerät
EXPERIMENT = re.compile(r"^[a-z0-9-]{1,40}$")


class SpeicherVoll(Exception):
    pass


def normalisiere(code):
    return re.sub(r"[\s-]+", "", code or "").upper()


class Ablage:
    def __init__(self, verzeichnis, ttl_s=TTL_S, uhr=time.monotonic, max_gesamt=MAX_GESAMT):
        self.verzeichnis, self.ttl_s, self.uhr, self.max_gesamt = verzeichnis, ttl_s, uhr, max_gesamt
        self.meta = {}     # code -> (ablaufzeit, dateiname, groesse)
        self.fehler = {}   # absender -> (anzahl, sperre_bis)
        self.sperre = threading.Lock()
        os.makedirs(verzeichnis, exist_ok=True)
        for f in os.listdir(verzeichnis):
            os.remove(os.path.join(verzeichnis, f))

    def _pfad(self, code):
        return os.path.join(self.verzeichnis, code + ".pdf")

    def aufraeumen(self):
        jetzt, n = self.uhr(), 0
        with self.sperre:
            for code, (ablauf, _, _g) in list(self.meta.items()):
                if ablauf <= jetzt:
                    del self.meta[code]
                    try: os.remove(self._pfad(code))
                    except FileNotFoundError: pass
            n = len(self.meta)
        return n

    def ablegen(self, daten, experiment):
        self.aufraeumen()
        with self.sperre:
            if sum(m[2] for m in self.meta.values()) + len(daten) > self.max_gesamt:
                raise SpeicherVoll()
            code = "".join(secrets.choice(ALPHABET) for _ in range(4))
            while code in self.meta:
                code = "".join(secrets.choice(ALPHABET) for _ in range(4))
            try:
                with open(self._pfad(code), "wb") as f:
                    f.write(daten)
            except OSError:
                try: os.remove(self._pfad(code))
                except OSError: pass
                raise SpeicherVoll()
            self.meta[code] = (self.uhr() + self.ttl_s, f"Protokoll-{experiment}-{code}.pdf", len(daten))
        return code

    def gesperrt(self, absender):
        f = self.fehler.get(absender)
        return bool(f and f[1] > self.uhr())

    def _fehlversuch(self, absender):
        anzahl, _ = self.fehler.get(absender, (0, 0))
        anzahl += 1
        self.fehler[absender] = (0, self.uhr() + SPERRE_S) if anzahl >= FEHLVERSUCHE else (anzahl, 0)

    def holen(self, code, absender=None):
        self.aufraeumen()
        code = normalisiere(code)
        with self.sperre:
            if absender and self.gesperrt(absender): return None
            m = self.meta.get(code)
            if not m:
                if absender: self._fehlversuch(absender)
                return None
            with open(self._pfad(code), "rb") as f:
                return f.read(), m[1]


SEITE = """<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Protokoll abholen – foeXlab</title><style>
body{{font-family:-apple-system,"Helvetica Neue",Arial,sans-serif;font-size:18px;margin:0;background:#fff;color:#111}}
header{{background:#33416E;color:#fff;padding:16px 20px;font-weight:700}}main{{max-width:520px;margin:0 auto;padding:24px 20px}}
input{{font:inherit;font-size:32px;letter-spacing:.2em;text-transform:uppercase;width:100%;padding:10px;border:2px solid #6B7080;box-sizing:border-box}}
button,a.k{{display:inline-block;margin-top:16px;min-height:52px;padding:12px 22px;font:inherit;font-weight:700;background:#33416E;color:#fff;border:0;text-decoration:none}}
.f{{color:#B3261E;font-weight:700}}</style></head><body><header>foeXlab · Protokoll abholen</header><main>{inhalt}</main></body></html>"""

FORMULAR = """<h1>Abholcode eingeben</h1><form method="get" action="/abholen">
<label for="c">Den Code findet ihr auf dem Labor-iPad.</label><input id="c" name="code" maxlength="9" autocomplete="off" autocapitalize="characters" value="{code}" required>
<button type="submit">Weiter</button></form>{fehler}"""


class Handler(BaseHTTPRequestHandler):
    ablage = None

    def log_message(self, *args):   # keine Zugriffsprotokolle (Codes stehen im Pfad)
        pass

    def _antwort(self, status, body, typ="text/html; charset=utf-8", kopf=None):
        self.send_response(status)
        self.send_header("Content-Type", typ)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for k, v in (kopf or {}).items(): self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def _absender(self):
        return self.headers.get("X-Forwarded-For", "").split(",")[0].strip() or self.client_address[0]

    def _nicht_gefunden(self, mit_formular_code=None):
        if self.ablage.gesperrt(self._absender()):
            text = '<p class="f">Zu viele falsche Codes. Bitte in 10 Minuten noch einmal versuchen.</p>'
        else:
            text = '<p class="f">Dieser Code ist unbekannt oder abgelaufen.</p>'
        if mit_formular_code is not None:
            return self._seite(404, FORMULAR.format(code=html.escape(mit_formular_code), fehler=text))
        return self._seite(404, text + '<a class="k" href="/abholen">Neuen Code eingeben</a>')

    def _seite(self, status, inhalt):
        self._antwort(status, SEITE.format(inhalt=inhalt).encode("utf-8"))

    def _json(self, status, obj):
        self._antwort(status, json.dumps(obj, ensure_ascii=False).encode("utf-8"), "application/json; charset=utf-8")

    def do_POST(self):
        if self.path != "/api/ablegen":
            return self._json(404, {"fehler": "Nicht gefunden."})
        laenge = int(self.headers.get("Content-Length") or 0)
        if laenge > MAX_BYTES:
            rest = min(laenge, 2 * MAX_BYTES)   # Körper verwerfen, damit der Client die Antwort lesen kann
            while rest > 0:
                stueck = self.rfile.read(min(rest, 1 << 16))
                if not stueck: break
                rest -= len(stueck)
            self.close_connection = True
            return self._json(413, {"fehler": "Datei zu groß (max. 25 MB)."})
        experiment = self.headers.get("X-Experiment", "")
        if not EXPERIMENT.match(experiment):
            return self._json(400, {"fehler": "Ungültiges Experiment."})
        daten = self.rfile.read(laenge)
        if not daten.startswith(b"%PDF-"):
            return self._json(400, {"fehler": "Keine PDF-Datei."})
        try:
            code = self.ablage.ablegen(daten, experiment)
        except SpeicherVoll:
            return self._json(507, {"fehler": "Der Abholspeicher ist voll. Sichert das PDF auf dem Gerät oder fragt die Betreuung."})
        self._json(201, {"code": code, "url": f"/abholen?code={code}"})

    def do_GET(self):
        teile = urllib.parse.urlsplit(self.path)
        if teile.path.startswith("/api/abholen/"):
            r = self.ablage.holen(urllib.parse.unquote(teile.path[len("/api/abholen/"):]), self._absender())
            if not r:
                return self._nicht_gefunden()
            daten, name = r
            return self._antwort(200, daten, "application/pdf", {"Content-Disposition": f'attachment; filename="{name}"'})
        if teile.path in ("/abholen", "/abholen/"):
            code = normalisiere(urllib.parse.parse_qs(teile.query).get("code", [""])[0])
            if not code:
                return self._seite(200, FORMULAR.format(code="", fehler=""))
            if not self.ablage.holen(code, self._absender()):
                return self._nicht_gefunden(code)
            return self._seite(200, f'<h1>Euer Protokoll</h1><p>Code <strong>{html.escape(code)}</strong></p>'
                                    f'<a class="k" href="/api/abholen/{html.escape(code)}">Protokoll herunterladen</a>')
        self._seite(404, "<p>Nicht gefunden.</p>")


def erzeuge_server(ablage, host="127.0.0.1", port=8081):
    h = type("FoexlabHandler", (Handler,), {"ablage": ablage})
    return ThreadingHTTPServer((host, port), h)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--ablage", default="/run/foexlab-abholung")
    ap.add_argument("--port", type=int, default=8081)
    ap.add_argument("--host", default="127.0.0.1")
    a = ap.parse_args()
    srv = erzeuge_server(Ablage(a.ablage), a.host, a.port)
    print(f"Abholdienst auf {a.host}:{a.port}, Ablage {a.ablage}", flush=True)
    srv.serve_forever()
