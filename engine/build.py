#!/usr/bin/env python3
"""Baut einen Kurs aus kurse/<kurs>/ (abschnitte/*.md, media/, kurs.yml).

Aufruf:  python3 engine/build.py kurse/<kurs> [-o dist/<kurs>] [--einzeldatei]
         python3 engine/build.py --alle          (alle Kurse nach dist/ plus Startseite dist/index.html)
Benötigt: Python 3, Pillow, markdown, pyyaml. Syntax siehe docs/FORMAT.md.
"""
import argparse, os, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from foexlab.seite import baue, startseite  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument("kurs", nargs="?")
ap.add_argument("--alle", action="store_true")
ap.add_argument("-o", "--out")
ap.add_argument("--einzeldatei", action="store_true")
ap.add_argument("--max-video-mb", type=float, default=10)
ap.add_argument("--max-img", type=int, default=1200)
a = ap.parse_args()
if a.alle:
    kurse = sorted(os.path.join("kurse", k) for k in os.listdir("kurse") if os.path.isfile(os.path.join("kurse", k, "kurs.yml")))
    for k in kurse:
        baue(k, os.path.join("dist", os.path.basename(k)), max_img=a.max_img, max_video_mb=a.max_video_mb)
    startseite(kurse, "dist")
    print("OK dist/index.html")
    sys.exit(0)
if not a.kurs: ap.error("Kurs angeben oder --alle")
name = os.path.basename(os.path.normpath(a.kurs))
ziel = a.out or os.path.join("dist", name + (".html" if a.einzeldatei else ""))
baue(a.kurs, ziel, einzeldatei=a.einzeldatei, max_img=a.max_img, max_video_mb=a.max_video_mb)
