#!/usr/bin/env python3
"""Aufsteller (A5 quer, SVG) mit WLAN-QR und Experiment-QR für einen Kurs.

Aufruf:  python3 tools/aufsteller.py kurse/<kurs> [-o aufsteller-<kurs>.svg] [--konfig server.local.yml]
Ausdrucken: SVG im Browser öffnen und drucken (A5 quer) oder in GoodNotes/Keynote einfügen.
"""
import argparse, html, os, re

import segno
import segno.helpers
import yaml

esc = lambda s: html.escape(str(s or ""), quote=True)


def _qr(daten, x, y, groesse):
    """QR-Code als eingebettetes <svg> an Position (mm)."""
    q = segno.make(daten, error="m")
    svg = q.svg_inline(scale=1, border=2, dark="#000", light="#fff", omitsize=True)
    return re.sub(r"^<svg ", f'<svg x="{x}" y="{y}" width="{groesse}" height="{groesse}" ', svg)


def aufsteller_svg(kurs_dir, konfig):
    kurs = yaml.safe_load(open(os.path.join(kurs_dir, "kurs.yml"), encoding="utf-8"))
    kid = kurs.get("id") or os.path.basename(os.path.normpath(kurs_dir))
    url = konfig["adresse"].rstrip("/") + f"/{kid}/"
    w = konfig["wlan"]
    wifi = segno.helpers.make_wifi_data(ssid=w["ssid"], password=w["passwort"], security="WPA")
    t = lambda x, y, s, text, fett=False, anker="middle", farbe="#111": (
        f'<text x="{x}" y="{y}" font-size="{s}" text-anchor="{anker}" fill="{farbe}" font-weight="{700 if fett else 400}">{esc(text)}</text>')
    teile = [
        '<svg xmlns="http://www.w3.org/2000/svg" width="210mm" height="148mm" viewBox="0 0 210 148" font-family="Helvetica, Arial, sans-serif">',
        '<rect width="210" height="148" fill="#fff"/><rect width="210" height="18" fill="#33416E"/>',
        t(10, 12, 7, "foeXlab · " + kurs["titel"], True, "start", "#fff"),
        t(55, 30, 6, "1. WLAN verbinden", True), t(155, 30, 6, "2. Anleitung öffnen", True),
        _qr(wifi, 25, 35, 60), _qr(url, 125, 35, 60),
        t(55, 103, 5, f"WLAN „{w['ssid']}“"), t(155, 103, 5, url),
        t(105, 120, 4.2, "Kamera-App auf den Code richten. Kein Internet: Bei der Meldung „Ohne Internet“ verbunden bleiben."),
        t(105, 127, 4.2, "Am Handy: mobile Daten aus, sonst ist die Seite nicht erreichbar."),
        '<rect y="140" width="210" height="8" fill="#F58411"/>',
        "</svg>",
    ]
    return "\n".join(teile)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("kurs")
    ap.add_argument("-o", "--out")
    ap.add_argument("--konfig", default="server.local.yml")
    a = ap.parse_args()
    konfig = yaml.safe_load(open(a.konfig, encoding="utf-8"))
    ziel = a.out or f"aufsteller-{os.path.basename(os.path.normpath(a.kurs))}.svg"
    open(ziel, "w", encoding="utf-8").write(aufsteller_svg(a.kurs, konfig))
    print("OK", ziel)
