#!/usr/bin/env python3
"""Welche Kurse berührt ein Pull Request?

Aufruf:  python3 tools/geaenderte_kurse.py <basis>      (z. B. origin/main)
Gibt die Kurs-IDs aus, eine je Zeile: Kurse mit geänderten Dateien unter kurse/<id>/, tests/js/<id>/
oder tests/py/test_<id>….py. Nur Kurse, die es gibt. Exit 2 bei falscher Eingabe.
"""
import os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


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


def geaenderte_dateien(basis, root=ROOT):
    r = subprocess.run(["git", "diff", "--name-only", "-z", basis + "...HEAD"], cwd=root, capture_output=True, text=True)
    if r.returncode != 0:
        zeilen = (r.stderr or "").strip().splitlines()
        raise ValueError("Der Vergleich mit '%s' ist nicht möglich (%s)." % (basis, zeilen[-1] if zeilen else "unbekannter Fehler"))
    return [d for d in r.stdout.split("\0") if d]


def main(argv):
    if len(argv) != 2:
        sys.stderr.write("Aufruf: python3 tools/geaenderte_kurse.py <basis>   (z. B. origin/main)\n")
        return 2
    try:
        for k in kurse_aus_dateien(geaenderte_dateien(argv[1]), vorhandene_kurse()):
            print(k)
    except ValueError as e:
        sys.stderr.write(str(e) + "\n")
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
