"""Struktur der GitHub-Workflows (kein actionlint nötig): Pflicht-Check-Name, Rechte, Schritte."""
import os, yaml

W = ".github/workflows"


def laden(name):
    with open(os.path.join(W, name), encoding="utf-8") as f:
        d = yaml.safe_load(f)
    d["on"] = d.pop(True, d.get("on"))   # YAML liest "on" als True
    return d


def befehle(job):
    return "\n".join(s.get("run", "") for s in job["steps"])


def benutzt(job):
    return [s["uses"] for s in job["steps"] if "uses" in s]


def test_pruefen_trigger_name_und_rechte():
    d = laden("pruefen.yml")
    assert d["on"]["pull_request"]["branches"] == ["main"]
    assert d["permissions"] == {"contents": "read"}
    assert d["jobs"]["pruefen"]["name"] == "pruefen"   # Pflicht-Check im Branch-Schutz
    assert "strategy" not in d["jobs"]["pruefen"]       # sonst hieße der Check "pruefen (3.11)"


def test_pruefen_schritte():
    job = laden("pruefen.yml")["jobs"]["pruefen"]
    b = befehle(job)
    for teil in ("npm ci", "requirements.txt", "kurs_pr_regeln.py", "engine/build.py --alle",
                 "geaenderte_kurse.py", "kurs_pruefen.py", "python3 -m pytest", "npm test"):
        assert teil in b, teil
    assert job["steps"][0]["with"]["fetch-depth"] == 0   # Vergleich mit main braucht die Historie
    assert all("@v" in u for u in benutzt(job))            # Aktionen auf Hauptversion festgelegt


def test_python39_zusatzjob():
    d = laden("pruefen.yml")
    assert [s["with"]["python-version"] for s in d["jobs"]["python39"]["steps"] if s.get("uses", "").startswith("actions/setup-python")] == ["3.9"]


def test_veroeffentlichen():
    d = laden("veroeffentlichen.yml")
    assert d["on"]["push"]["branches"] == ["main"]
    assert d["permissions"] == {"contents": "read"}
    assert d["jobs"]["bauen"]["permissions"] == {"contents": "write"}
    assert d["jobs"]["veroeffentlichen"]["permissions"] == {"pages": "write", "id-token": "write"}
    alle = [u for j in d["jobs"].values() for u in benutzt(j)]
    for a in ("actions/configure-pages", "actions/upload-pages-artifact", "actions/deploy-pages"):
        assert any(u.startswith(a + "@v") for u in alle), a
    b = "\n".join(befehle(j) for j in d["jobs"].values())
    assert "engine/build.py --alle" in b
    assert "foexlab-update/" not in b and "foexlab-update.zip" in b
    assert "git tag -f letzter-stand" in b and "push -f origin refs/tags/letzter-stand" in b
    assert "letzter-stand" in b and "--clobber" in b
    upload = [s for s in d["jobs"]["bauen"]["steps"] if s.get("uses", "").startswith("actions/upload-pages-artifact")][0]
    assert upload["with"]["path"] == "dist"
