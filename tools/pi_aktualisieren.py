#!/usr/bin/env python3
"""Aktualisiert den Lab-Server (Pi) vom Laptop aus.

Zu Hause/im Büro (mit Internet):   python3 tools/pi_aktualisieren.py --laden
Im Labor (WLAN foeXlab, kein Netz): python3 tools/pi_aktualisieren.py

Ablauf: Mit --laden: nur laden und prüfen. Sonst: Zip sicher entpacken, prüfen, per rsync auf den Pi
kopieren, danach tools/pi_pruefen.py. Ende: 0 = fertig, 1 = fehlgeschlagen, 2 = Einrichtung/Aufruf.
"""
import argparse
import os
import shutil
import subprocess
import sys
import tempfile
import urllib.request
import zipfile
from pathlib import Path

HIER = Path(__file__).resolve().parent
sys.path.insert(0, str(HIER.parent / "server"))
from usb_update import pruefe_quelle  # noqa: E402

URL = "https://github.com/Ollei7/foexlab/releases/download/letzter-stand/foexlab-update.zip"
STANDARD_ZIP = Path.home() / "foexlab-update.zip"
STANDARD_PI = "pi@192.168.178.10"
ORDNER = "foexlab-update"


class Fehler(Exception):
    """Erwarteter Fehler mit deutscher Meldung."""


def url_aus_host(pi):
    return "http://" + pi.split("@")[-1]


def baue_rsync(quelle, pi):
    return ["rsync", "-av", "--delete", str(quelle).rstrip("/") + "/", pi + ":/srv/foexlab/"]


def lade(ziel):
    try:
        with urllib.request.urlopen(URL, timeout=60) as r, open(str(ziel), "wb") as f:
            shutil.copyfileobj(r, f)
    except Exception:
        raise Fehler("Das Herunterladen hat nicht geklappt. Ist der Laptop mit dem Internet "
                     "verbunden (nicht mit dem WLAN foeXlab)? Dann den Befehl mit --laden "
                     "noch einmal ausführen.")


def entpacke_und_pruefe(zip_pfad, ziel):
    """Entpackt sicher nach ziel und gibt den Ordner foexlab-update zurück."""
    ziel = Path(ziel)
    try:
        z = zipfile.ZipFile(str(zip_pfad))
    except (zipfile.BadZipFile, OSError):
        raise Fehler("Die Datei %s ist kein gültiges Zip. Bitte neu laden (--laden)." % zip_pfad)
    with z:
        wurzel = os.path.realpath(str(ziel))
        for info in z.infolist():
            name = info.filename
            teile = name.replace("\\", "/").split("/")
            if name.startswith(("/", "\\")) or (len(name) > 1 and name[1] == ":") or ".." in teile:
                raise Fehler("Das Zip enthält einen unzulässigen Pfad („%s“) und wird nicht benutzt." % name)
            if (info.external_attr >> 16) & 0o170000 == 0o120000:
                raise Fehler("Das Zip enthält eine Verknüpfung („%s“) und wird nicht benutzt." % name)
            if not os.path.realpath(os.path.join(wurzel, name)).startswith(wurzel + os.sep):
                raise Fehler("Das Zip enthält einen unzulässigen Pfad („%s“) und wird nicht benutzt." % name)
        z.extractall(str(ziel))
    quelle = ziel / ORDNER
    probleme = pruefe_quelle(quelle)
    if probleme:
        raise Fehler("Das Zip ist unvollständig oder falsch:\n  " + "\n  ".join(probleme))
    return quelle


def _ausgabe(text):
    print(text)


def main(argv=None):
    p = argparse.ArgumentParser(description="Pi per Laptop aktualisieren")
    p.add_argument("--laden", action="store_true", help="Zip vorher aus dem Internet laden")
    p.add_argument("--zip", default=str(STANDARD_ZIP), help="Pfad der Zip-Datei")
    p.add_argument("--pi", default=STANDARD_PI, help="Benutzer@Adresse des Pi")
    try:
        args = p.parse_args(argv)
    except SystemExit as e:
        return 2 if e.code else 0
    zip_pfad = Path(args.zip).expanduser()
    try:
        if args.laden:
            _ausgabe("Lade das Update aus dem Internet …")
            lade(zip_pfad)
            with tempfile.TemporaryDirectory() as tmp:
                entpacke_und_pruefe(zip_pfad, tmp)
            _ausgabe("Heruntergeladen und geprüft: %s. Im Labor (WLAN „foeXlab“) jetzt "
                     "ohne --laden ausführen." % zip_pfad)
            return 0
        if not zip_pfad.is_file():
            raise Fehler("Die Datei %s gibt es nicht. Zuerst mit Internet "
                         "„python3 tools/pi_aktualisieren.py --laden“ ausführen." % zip_pfad)
        fehlt = [n for n in ("rsync", "ssh") if not shutil.which(n)]
        if fehlt:
            _ausgabe("Auf diesem Computer fehlt %s. Unter Windows ist das normal: Bitte den "
                     "USB-Stick benutzen (docs/pi-anleitung.md, Abschnitt 5) oder WSL "
                     "(Windows-Subsystem für Linux) installieren." % " und ".join(fehlt))
            return 2
        with tempfile.TemporaryDirectory() as tmp:
            quelle = entpacke_und_pruefe(zip_pfad, tmp)
            _ausgabe("Zip ist in Ordnung. Kopiere auf %s …" % args.pi)
            if subprocess.run(baue_rsync(quelle, args.pi)).returncode != 0:
                raise Fehler("Das Kopieren auf den Pi hat nicht geklappt. Ist der Laptop im "
                             "WLAN „foeXlab“ und der Pi eingeschaltet?")
        _ausgabe("Prüfe den Pi …")
        if subprocess.run([sys.executable, str(HIER / "pi_pruefen.py"), url_aus_host(args.pi)]).returncode != 0:
            raise Fehler("Kopiert, aber die Prüfung meldet Fehler (siehe oben, pi-pruefung.txt).")
    except Fehler as e:
        _ausgabe(str(e))
        return 1
    _ausgabe("Fertig: Der Pi ist aktualisiert.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
