#!/usr/bin/env python3
"""Aktualisiert /srv/foexlab von einem USB-Stick (Ordner foexlab-update/).

Es werden nur Dateien kopiert; nichts vom Stick wird ausgeführt.
Aufruf: python3 usb_update.py <Einhängeordner-des-Sticks>
"""
import hashlib
import os
import shutil
import stat
import sys
import time
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import List

ORDNER = "foexlab-update"
# Liegt im beschreibbaren Bereich der gehärteten Unit (ReadWritePaths=/run/foexlab-usb).
SPERRE = Path("/run/foexlab-usb/update.lock")
WARTEN_S = 600.0  # so lange wartet ein zweiter Stick auf den ersten
TAKT_S = 1.0


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
    """Kopiert nur eine normale Datei; legt nie Verknüpfungen an."""
    if not stat.S_ISREG(os.lstat(quelle).st_mode):
        raise OSError("%s ist keine normale Datei" % os.path.basename(quelle))
    fd = os.open(quelle, os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0))
    with os.fdopen(fd, "rb") as q:
        if not stat.S_ISREG(os.fstat(q.fileno()).st_mode):
            raise OSError("%s ist keine normale Datei" % os.path.basename(quelle))
        with open(ziel, "xb") as z:
            shutil.copyfileobj(q, z)


def _kopiere_baum(quelle: Path, ziel: Path) -> None:
    ziel.mkdir(parents=True)
    for ordner, unterordner, dateien in os.walk(str(quelle), followlinks=False):
        rel = os.path.relpath(ordner, str(quelle))
        zielordner = ziel if rel == "." else ziel / rel
        for u in unterordner:
            if os.path.islink(os.path.join(ordner, u)):
                raise OSError("%s ist plötzlich eine Verknüpfung" % u)
            (zielordner / u).mkdir()
        for d in dateien:
            _kopiere_datei(os.path.join(ordner, d), str(zielordner / d))


def _manifest(wurzel: Path) -> dict:
    """Relative Pfade -> (Größe, sha256) aller Dateien."""
    m = {}
    for ordner, _u, dateien in os.walk(str(wurzel), followlinks=False):
        for d in dateien:
            pfad = os.path.join(ordner, d)
            if os.path.islink(pfad):
                continue
            h = hashlib.sha256()
            with open(pfad, "rb") as f:
                for block in iter(lambda: f.read(1 << 20), b""):
                    h.update(block)
            m[os.path.relpath(pfad, str(wurzel))] = (os.path.getsize(pfad), h.hexdigest())
    return m


def _groesse(wurzel: Path) -> int:
    summe = 0
    for ordner, _u, dateien in os.walk(str(wurzel), followlinks=False):
        for d in dateien:
            try:
                summe += os.lstat(os.path.join(ordner, d)).st_size
            except OSError:
                pass
    return summe


def _besitzer_uebertragen(vorbild: Path, baum: Path) -> None:
    if not hasattr(os, "geteuid") or os.geteuid() != 0 or not vorbild.exists():
        return
    st = vorbild.stat()
    os.lchown(str(baum), st.st_uid, st.st_gid)
    for ordner, unterordner, dateien in os.walk(str(baum), followlinks=False):
        for name in list(unterordner) + list(dateien):
            os.lchown(os.path.join(ordner, name), st.st_uid, st.st_gid)


def _loesche(pfad: Path) -> None:
    if pfad.is_symlink() or pfad.is_file():
        pfad.unlink()
    elif pfad.exists():
        shutil.rmtree(str(pfad))


def _schreibe_text(stick: Path, text: str) -> None:
    (stick / "update.txt").write_bytes(text.encode("utf-8", "backslashreplace"))


def _schreibe_protokoll(stick: Path, erg: Ergebnis) -> None:
    zeilen = erg.meldung.split("\n")
    text = "foeXlab Update\nZeitpunkt: %s\nErgebnis: %s\n%s\nKurse: %s\n" % (
        datetime.now().strftime("%d.%m.%Y %H:%M:%S"),
        "OK" if erg.ok else "Fehler",
        "\n".join("  " + z for z in zeilen),
        ", ".join(erg.kurse) if erg.kurse else "(keine)")
    try:
        _schreibe_text(stick, text)
    except Exception:
        pass  # Stick schreibgeschützt oder voll: Ergebnis steht auf der Konsole


def _schreibe_laeuft(stick: Path) -> None:
    try:
        _schreibe_text(stick, "foeXlab Update\nZeitpunkt: %s\nAktualisierung läuft … "
                       "(Stick noch nicht abziehen)\n" % datetime.now().strftime("%d.%m.%Y %H:%M:%S"))
    except Exception:
        pass


def _stelle_wieder_her(ziel: Path, sicherung: Path) -> None:
    """Nach Absturz mitten im Austausch: fehlt ziel, die Sicherung zurück."""
    if not ziel.exists() and sicherung.exists():
        os.rename(str(sicherung), str(ziel))


def _ersetze(stick: Path, ziel: Path, sicherung: Path) -> Ergebnis:
    quelle = stick / ORDNER
    probleme = pruefe_quelle(quelle)
    if probleme:
        return Ergebnis(False, "\n".join(probleme))
    kurse = _kurse(quelle)
    neu = Path(str(ziel) + ".neu")
    try:
        if ziel.exists() and _manifest(quelle) == _manifest(ziel):
            return Ergebnis(True, "Schon aktuell – nichts geändert.", kurse)
        _loesche(neu)
        bedarf = int(_groesse(quelle) * 1.1) + 50 * 1024 * 1024
        frei = shutil.disk_usage(str(ziel.parent)).free
        if frei < bedarf:
            return Ergebnis(False, "Zu wenig Platz auf dem Pi: %d MB frei, %d MB nötig. "
                            "Der alte Stand bleibt." % (frei // 2**20, bedarf // 2**20), kurse)
        _kopiere_baum(quelle, neu)
        _besitzer_uebertragen(ziel, neu)
    except Exception as e:
        _loesche_leise(neu)
        return Ergebnis(False, "Kopieren fehlgeschlagen (%s). Der alte Stand bleibt." % e, kurse)
    try:
        if hasattr(os, "sync"):
            os.sync()
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
    _schreibe_laeuft(stick)
    try:
        _stelle_wieder_her(ziel, sicherung)
        erg = _ersetze(stick, ziel, sicherung)
    except Exception as e:  # nie mit Traceback enden
        erg = Ergebnis(False, "Unerwarteter Fehler (%s). Der alte Stand bleibt." % e)
    _schreibe_protokoll(stick, erg)
    return erg


def _sperren(sperrdatei: Path, stick: Path, warte_s: float = WARTEN_S, takt: float = 1.0):
    """Nur ein Update gleichzeitig. Gibt die offene Sperrdatei zurück,
    None wenn die Wartezeit ablief, "ohne" wenn keine Sperre möglich ist."""
    try:
        import fcntl
        Path(sperrdatei).parent.mkdir(parents=True, exist_ok=True)
        f = open(str(sperrdatei), "a")
    except Exception:
        return "ohne"  # lieber ohne Sperre aktualisieren als gar nicht
    ende = time.monotonic() + warte_s
    gemeldet = False
    while True:
        try:
            fcntl.flock(f.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
            return f
        except OSError:
            pass
        if not gemeldet:
            gemeldet = True
            try:
                _schreibe_text(stick, "foeXlab Update\nZeitpunkt: %s\nEin anderes Update läuft "
                               "gerade (zweiter Stick?). Dieses Update wartet … "
                               "(Stick noch nicht abziehen)\n"
                               % datetime.now().strftime("%d.%m.%Y %H:%M:%S"))
            except Exception:
                pass
        if time.monotonic() >= ende:
            f.close()
            return None
        time.sleep(takt)


def main(argv=None) -> int:
    argv = sys.argv[1:] if argv is None else argv
    if len(argv) != 1:
        print("Aufruf: usb_update.py <Stick-Ordner>", file=sys.stderr)
        return 2
    stick = Path(argv[0])
    if not (stick / ORDNER).exists():
        return 0  # gewöhnlicher Stick: nichts tun, nichts schreiben
    sperre = _sperren(SPERRE, stick, WARTEN_S, TAKT_S)
    if sperre is None:
        erg = Ergebnis(False, "Ein anderes Update lief zu lange. Dieses Update wurde nicht "
                       "ausgeführt. Bitte warten, bis der andere Stick fertig ist, "
                       "dann diesen Stick neu einstecken.")
        _schreibe_protokoll(stick, erg)
    else:
        try:
            erg = aktualisiere(stick)
        finally:
            if sperre != "ohne":
                sperre.close()
    text = ("OK: " if erg.ok else "Fehler: ") + erg.meldung
    print(text.encode("utf-8", "backslashreplace").decode("utf-8"))
    return 0 if erg.ok else 1


if __name__ == "__main__":
    sys.exit(main())
