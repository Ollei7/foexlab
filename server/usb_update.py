#!/usr/bin/env python3
"""Aktualisiert /srv/foexlab von einem USB-Stick (Ordner foexlab-update/).

Es werden nur Dateien kopiert; nichts vom Stick wird ausgeführt.
Aufruf: python3 usb_update.py <Einhängeordner-des-Sticks>
"""
import os
import shutil
import sys
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import List

ORDNER = "foexlab-update"


@dataclass
class Ergebnis:
    ok: bool
    meldung: str
    kurse: List[str] = field(default_factory=list)


def _kurse(quelle: Path) -> List[str]:
    try:
        eintraege = sorted(quelle.iterdir())
    except OSError:
        return []
    return [p.name for p in eintraege
            if p.is_dir() and not p.is_symlink() and (p / "index.html").is_file()
            and not (p / "index.html").is_symlink()]


def pruefe_quelle(quelle: Path) -> List[str]:
    """Leere Liste = in Ordnung, sonst deutsche Fehlerzeilen."""
    quelle = Path(quelle)
    fehler = []  # type: List[str]
    if quelle.is_symlink() or not quelle.is_dir():
        return ["Der Ordner „%s“ fehlt auf dem Stick." % ORDNER]
    wurzel = os.path.realpath(str(quelle))
    index = quelle / "index.html"
    if not index.is_file() or index.is_symlink():
        fehler.append("Es fehlt die Startseite index.html im Ordner „%s“." % ORDNER)
    if not _kurse(quelle):
        fehler.append("Es gibt keinen Kursordner mit einer index.html.")
    for ordner, unterordner, dateien in os.walk(str(quelle), followlinks=False):
        for name in list(unterordner) + list(dateien):
            pfad = os.path.join(ordner, name)
            rel = os.path.relpath(pfad, str(quelle))
            if os.path.islink(pfad):
                fehler.append("%s: Verknüpfungen (Symlinks) sind nicht erlaubt." % rel)
                continue
            if not os.path.realpath(pfad).startswith(wurzel + os.sep):
                fehler.append("%s: liegt außerhalb des Update-Ordners." % rel)
                continue
            if not (os.path.isdir(pfad) or os.path.isfile(pfad)):
                fehler.append("%s: ist keine normale Datei." % rel)
    return fehler


def _kopiere_datei(quelle: str, ziel: str) -> None:
    shutil.copyfile(quelle, ziel, follow_symlinks=False)


def _kopiere_baum(quelle: Path, ziel: Path) -> None:
    ziel.mkdir(parents=True)
    for ordner, unterordner, dateien in os.walk(str(quelle), followlinks=False):
        rel = os.path.relpath(ordner, str(quelle))
        zielordner = ziel if rel == "." else ziel / rel
        for u in unterordner:
            (zielordner / u).mkdir()
        for d in dateien:
            _kopiere_datei(os.path.join(ordner, d), str(zielordner / d))


def _besitzer_uebertragen(vorbild: Path, baum: Path) -> None:
    if not hasattr(os, "geteuid") or os.geteuid() != 0 or not vorbild.exists():
        return
    st = vorbild.stat()
    os.chown(str(baum), st.st_uid, st.st_gid)
    for ordner, unterordner, dateien in os.walk(str(baum)):
        for name in list(unterordner) + list(dateien):
            os.chown(os.path.join(ordner, name), st.st_uid, st.st_gid)


def _loesche(pfad: Path) -> None:
    if pfad.is_symlink() or pfad.is_file():
        pfad.unlink()
    elif pfad.exists():
        shutil.rmtree(str(pfad))


def _schreibe_protokoll(stick: Path, erg: Ergebnis) -> None:
    text = "foeXlab Update\nZeitpunkt: %s\nErgebnis: %s\nKurse: %s\n" % (
        datetime.now().strftime("%d.%m.%Y %H:%M:%S"),
        ("OK – " if erg.ok else "Fehler – ") + erg.meldung,
        ", ".join(erg.kurse) if erg.kurse else "(keine)")
    try:
        (stick / "update.txt").write_text(text, encoding="utf-8")
    except OSError:
        pass


def _ersetze(stick: Path, ziel: Path, sicherung: Path) -> Ergebnis:
    quelle = stick / ORDNER
    probleme = pruefe_quelle(quelle)
    if probleme:
        return Ergebnis(False, " ".join(probleme))
    kurse = _kurse(quelle)
    neu = Path(str(ziel) + ".neu")
    try:
        _loesche(neu)
        _kopiere_baum(quelle, neu)
        _besitzer_uebertragen(ziel, neu)
    except Exception as e:
        _loesche_leise(neu)
        return Ergebnis(False, "Kopieren fehlgeschlagen (%s). Der alte Stand bleibt." % e, kurse)
    try:
        _loesche(sicherung)
        if ziel.exists():
            os.rename(str(ziel), str(sicherung))
        try:
            os.rename(str(neu), str(ziel))
        except Exception:
            if sicherung.exists() and not ziel.exists():
                os.rename(str(sicherung), str(ziel))
            raise
    except Exception as e:
        _loesche_leise(neu)
        return Ergebnis(False, "Austauschen fehlgeschlagen (%s). Der alte Stand bleibt." % e, kurse)
    return Ergebnis(True, "Die Inhalte wurden aktualisiert. Der alte Stand liegt in %s." % sicherung, kurse)


def _loesche_leise(pfad: Path) -> None:
    try:
        _loesche(pfad)
    except Exception:
        pass


def aktualisiere(stick: Path, ziel: Path = Path("/srv/foexlab"),
                 sicherung: Path = Path("/srv/foexlab.vorher")) -> Ergebnis:
    stick, ziel, sicherung = Path(stick), Path(ziel), Path(sicherung)
    try:
        erg = _ersetze(stick, ziel, sicherung)
    except Exception as e:  # nie mit Traceback enden
        erg = Ergebnis(False, "Unerwarteter Fehler (%s). Der alte Stand bleibt." % e)
    _schreibe_protokoll(stick, erg)
    return erg


def main(argv=None) -> int:
    argv = sys.argv[1:] if argv is None else argv
    if len(argv) != 1:
        print("Aufruf: usb_update.py <Stick-Ordner>", file=sys.stderr)
        return 2
    stick = Path(argv[0])
    if not (stick / ORDNER).exists():
        return 0  # gewöhnlicher Stick: nichts tun, nichts schreiben
    erg = aktualisiere(stick)
    print(("OK: " if erg.ok else "Fehler: ") + erg.meldung)
    return 0 if erg.ok else 1


if __name__ == "__main__":
    sys.exit(main())
