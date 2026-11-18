#!/usr/bin/env python3
"""Welche Kurse berührt ein Pull Request?

Aufruf:  python3 tools/geaenderte_kurse.py <basis> [--alle-wenn-fremd]     (z. B. origin/main)
Gibt die Kurs-IDs aus, eine je Zeile: Kurse mit geänderten Dateien unter kurse/<id>/, tests/js/<id>/
oder tests/py/test_<id>….py. Nur Kurse, die es gibt. Exit 2 bei falscher Eingabe.
--alle-wenn-fremd: Liegt eine geänderte Datei außerhalb von kurse/, tests/js/<id>/ und tests/py/test_*
(z. B. engine/, tools/, Skill), werden alle Kurse und der Beispielkurs des Skills (als Pfad) ausgegeben –
eine Änderung an der Technik kann jeden Kurs kaputt machen.
"""
import os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BEISPIELKURS = ".claude/skills/foexlab-kurs/referenz/beispielkurs"


def vorhandene_kurse(root=ROOT):
    ordner = os.path.join(root, "kurse")
    if not os.path.isdir(ordner):
        return set()
    return {n for n in os.listdir(ordner) if os.path.isdir(os.path.join(ordner, n))}


def kurs_zu_datei(datei, kurse):
    """Kurs-ID, zu der die Datei gehört, sonst None."""
    teile = datei.split("/")
    if len(teile) >= 3 and teile[0] == "kurse" and teile[1] in kurse:
        return teile[1]
    if len(teile) >= 4 and teile[0] == "tests" and teile[1] == "js" and teile[2] in kurse:
        return teile[2]
    if len(teile) == 3 and teile[0] == "tests" and teile[1] == "py" and teile[2].startswith("test_") and teile[2].endswith(".py"):
        name = teile[2][len("test_"):-len(".py")]
        treffer = [k for k in kurse
                   if name == k.replace("-", "_") or name.startswith(k.replace("-", "_") + "_")]
        return max(treffer, key=len) if treffer else None
    return None


def kurse_aus_dateien(dateien, kurse):
    return sorted({k for k in (kurs_zu_datei(d, kurse) for d in dateien) if k})


def ist_fremd(datei):
    """True, wenn die Datei nicht zu einem Kurs oder seinen Tests gehört."""
    t = datei.split("/")
    if len(t) >= 2 and t[0] == "kurse":
        return False
    if len(t) >= 4 and t[:2] == ["tests", "js"]:
        return False
    if len(t) == 3 and t[:2] == ["tests", "py"] and t[2].startswith("test_"):
        return False
    return True


def pruefziele(dateien, kurse, alle_wenn_fremd=False, root=ROOT):
    """Kurs-IDs (bzw. Pfade) für kurs_pruefen."""
    if alle_wenn_fremd and any(ist_fremd(d) for d in dateien):
        ziele = sorted(kurse)
        if os.path.isdir(os.path.join(root, BEISPIELKURS)):
            ziele.append(BEISPIELKURS)
        return ziele
    return kurse_aus_dateien(dateien, kurse)


def geaenderte_dateien(basis, root=ROOT):
    r = subprocess.run(["git", "diff", "--name-only", "--no-renames", "-z", basis + "...HEAD"], cwd=root, capture_output=True, text=True)
    if r.returncode != 0:
        zeilen = (r.stderr or "").strip().splitlines()
        raise ValueError("Der Vergleich mit '%s' ist nicht möglich (%s)." % (basis, zeilen[-1] if zeilen else "unbekannter Fehler"))
    return [d for d in r.stdout.split("\0") if d]


def main(argv):
    argumente = [a for a in argv[1:] if a != "--alle-wenn-fremd"]
    alle = len(argumente) != len(argv) - 1
    if len(argumente) != 1 or argumente[0].startswith("-"):
        sys.stderr.write("Aufruf: python3 tools/geaenderte_kurse.py <basis> [--alle-wenn-fremd]   (z. B. origin/main)\n")
        return 2
    try:
        for k in pruefziele(geaenderte_dateien(argumente[0]), vorhandene_kurse(), alle):
            print(k)
    except ValueError as e:
        sys.stderr.write(str(e) + "\n")
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
