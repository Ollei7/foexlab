#!/usr/bin/env python3
"""Prüft den Lab-Server von einem Gerät im selben Netz (nur Standardbibliothek).

Aufruf:  python3 tools/pi_pruefen.py http://192.168.178.10
Prüft Startseite und Kurse, alle in den Kursseiten eingebundenen Dateien und den Abholdienst
(Test-PDF ablegen, mit Code abholen, falscher Code). Ergebnis auch in pi-pruefung.txt.
"""
import json, os, re, sys, urllib.error, urllib.parse, urllib.request

WURZEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF = b"%PDF-1.4\ntest\n%%EOF\n"


def hole(url, methode="GET", daten=None, kopf=None):
    anfrage = urllib.request.Request(url, data=daten, method=methode, headers=kopf or {})
    try:
        with urllib.request.urlopen(anfrage, timeout=8) as r:
            return r.status, r.read(), dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, b"", {}
    except Exception as e:
        return 0, str(e).encode(), {}


def main():
    basis = (sys.argv[1] if len(sys.argv) > 1 else "http://192.168.178.10").rstrip("/")
    zeilen, fehler = [], 0

    def melde(ok, text):
        nonlocal fehler
        fehler += 0 if ok else 1
        zeilen.append(("ok      " if ok else "FEHLER  ") + text)

    kurse = sorted(k for k in os.listdir(os.path.join(WURZEL, "dist"))
                   if os.path.isfile(os.path.join(WURZEL, "dist", k, "index.html")))
    for pfad in ["/"] + [f"/{k}/" for k in kurse] + ["/abholen"]:
        status, _, _ = hole(basis + pfad)
        melde(status == 200, f"Seite {pfad} ({status})")

    for k in kurse:
        html = open(os.path.join(WURZEL, "dist", k, "index.html"), encoding="utf-8").read()
        verweise = set(re.findall(r'(?:src|href|poster)="((?!https?:|data:|#|mailto:|javascript:)[^"]+)"', html))
        fehlend = []
        for v in sorted(verweise):
            v = v.split("#")[0].split("?")[0]
            if not v:
                continue
            status, _, _ = hole(f"{basis}/{k}/" + urllib.parse.quote(urllib.parse.unquote(v)), "HEAD")
            if status != 200:
                fehlend.append(f"{v} ({status})")
        melde(not fehlend, f"Dateien in {k}: {len(verweise)} geprüft" + (", fehlend: " + ", ".join(fehlend) if fehlend else ""))

    status, antwort, _ = hole(basis + "/api/ablegen", "POST", PDF,
                              {"X-Experiment": kurse[0] if kurse else "test", "Content-Type": "application/pdf"})
    code = ""
    try:
        code = json.loads(antwort)["code"]
    except Exception:
        pass
    melde(status == 201 and bool(code), f"Abholdienst: PDF ablegen ({status})")
    if code:
        status, inhalt, _ = hole(f"{basis}/api/abholen/{code}")
        melde(status == 200 and inhalt == PDF, f"Abholdienst: PDF mit Code abholen ({status})")
    status, _, _ = hole(basis + "/api/abholen/ZZZZ")
    melde(status == 404, f"Abholdienst: falscher Code wird abgewiesen ({status})")

    zeilen.append(f"\n{basis}: " + ("alles in Ordnung" if not fehler else f"{fehler} Fehler"))
    text = "\n".join(zeilen)
    print(text)
    with open(os.path.join(WURZEL, "pi-pruefung.txt"), "w", encoding="utf-8") as f:
        f.write(text + "\n")
    sys.exit(1 if fehler else 0)


if __name__ == "__main__":
    main()
