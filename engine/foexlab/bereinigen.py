"""Moodle-Altlasten im Markdown entfernen: Sternzeilen, Fettdruck über ganze Zeilen, viele Leerzeilen."""
import re

GANZ_FETT = re.compile(r"^(\s*)\*\*(?!\*)(.+?)(?<!\*)\*\*(\s*)$")


def _zeile(l):
    if re.fullmatch(r"\s*(\*\*)+\s*", l):
        return None
    if "{{" in l:
        return l
    m = GANZ_FETT.match(l)
    if m and "**" not in m.group(2):
        return m.group(1) + m.group(2).strip() + m.group(3)
    return l


def bereinige(text):
    zeilen, out, im_block, leer = text.split("\n"), [], False, 0
    if zeilen and zeilen[0] == "---":   # Frontmatter unverändert übernehmen
        try:
            ende = zeilen.index("---", 1)
            out, zeilen = zeilen[:ende + 1], zeilen[ende + 1:]
        except ValueError:
            pass
    for l in zeilen:
        if re.match(r"^:::\s*[\wäöüß-]+\s*$", l) and not im_block:
            im_block = True
        elif l.strip() == ":::" and im_block:
            im_block = False
            out.append(l); leer = 0; continue
        if not im_block:
            l = _zeile(l)
            if l is None:
                continue
        if not l.strip():
            leer += 1
            if leer > 1: continue
        else:
            leer = 0
        out.append(l)
    return "\n".join(out)
