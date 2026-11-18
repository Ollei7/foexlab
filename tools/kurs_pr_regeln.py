#!/usr/bin/env python3
"""Was darf ein Zweig `kurs/<id>` ändern?

Aufruf:  python3 tools/kurs_pr_regeln.py <zweig> <basis>     (z. B. kurs/pendel origin/main)
Erlaubt sind nur: kurse/<id>/…, tests/js/<id>/…, tests/py/test_<id>….py und der Werkzeugkatalog des Skills.
Alles andere (engine/, server/, tools/, .github/, fremde Kurse, übrige Skill-Dateien …) ergibt eine
deutsche Meldung und Exit 1. Zweige, die nicht mit kurs/ beginnen, sind frei. Exit 2: falsche Eingabe.
"""
import os, posixpath, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import geaenderte_kurse as gk

KATALOG = ".claude/skills/foexlab-kurs/referenz/werkzeuge.md"
PRAEFIX = "kurs/"


def _alle_ids(kurse, dateien):
    ids = set(kurse)
    for d in dateien:
        t = d.split("/")
        if len(t) >= 3 and t[0] == "kurse":
            ids.add(t[1])
        elif len(t) >= 4 and t[:2] == ["tests", "js"]:
            ids.add(t[2])
    return ids


def _kurs_id_aus_zweig(zweig, kurse, dateien):
    """Eigene Kurs-ID: längste ID, mit der der Zweigname beginnt (kurs/<id> oder kurs/<id>-…);
    bei neuen Kursen die ID, die in den Dateien vorkommt und zum Zweignamen passt."""
    name = zweig[len(PRAEFIX):]
    treffer = [i for i in _alle_ids(kurse, dateien) if name == i or name.startswith(i + "-")]
    return max(treffer, key=len) if treffer else None


def verstoesse(zweig, dateien, kurse):
    """Liste deutscher Meldungen; leer = erlaubt."""
    if not zweig.startswith(PRAEFIX):
        return []
    sauber_liste = [d for d in dateien if posixpath.normpath(d) == d]
    eigener = _kurs_id_aus_zweig(zweig, kurse, sauber_liste)
    ids = _alle_ids(kurse, sauber_liste)
    meldungen = []
    for datei in dateien:
        if datei == KATALOG:
            continue
        sauber = posixpath.normpath(datei) == datei and not datei.startswith("/")
        t = datei.split("/")
        if sauber and eigener:
            if len(t) >= 3 and t[0] == "kurse" and t[1] == eigener:
                continue
            if len(t) >= 4 and t[:2] == ["tests", "js"] and t[2] == eigener:
                continue
            if len(t) == 3 and t[:2] == ["tests", "py"] and gk.kurs_zu_datei(datei, ids) == eigener:
                continue
        if sauber and (t[0] in ("engine", "server", "tools", ".github")):
            grund = "gehört zur Technik des Projekts"
        elif sauber and len(t) >= 2 and t[0] == "kurse":
            grund = "gehört zu einem anderen Kurs als dem Zweig %s" % zweig
        else:
            grund = "darf mit einem Kurs-Zweig nicht geändert werden"
        meldungen.append("– %s: %s. Ein Kurs-Zweig darf nur den eigenen Kurs ändern (kurse/<id>/, tests/js/<id>/, tests/py/test_<id>….py und die Werkzeugliste des Skills). Diese Datei bitte aus dem Pull Request herausnehmen; für andere Änderungen Oliver fragen." % (datei, grund))
    return meldungen


def main(argv):
    if len(argv) != 3:
        sys.stderr.write("Aufruf: python3 tools/kurs_pr_regeln.py <zweig> <basis>\n")
        return 2
    zweig, basis = argv[1], argv[2]
    if not zweig.startswith(PRAEFIX):
        print("Zweig '%s' ist kein Kurs-Zweig: keine Einschränkung." % zweig)
        return 0
    try:
        dateien = gk.geaenderte_dateien(basis)
    except ValueError as e:
        sys.stderr.write(str(e) + "\n")
        return 2
    meldungen = verstoesse(zweig, dateien, gk.vorhandene_kurse())
    for m in meldungen:
        print(m)
    if meldungen:
        print("Nicht erlaubt: %d Datei(en) außerhalb des eigenen Kurses." % len(meldungen))
        return 1
    print("Nur der eigene Kurs wurde geändert.")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
