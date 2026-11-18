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
    assert "geaenderte_kurse.py \"$BASIS\" --alle-wenn-fremd" in b   # Technik geändert → alle Kurse prüfen
    assert job["steps"][0]["with"]["fetch-depth"] == 0   # Vergleich mit main braucht die Historie
    assert all("@v" in u for u in benutzt(job))            # Aktionen auf Hauptversion festgelegt


def test_python39_zusatzjob():
    d = laden("pruefen.yml")
    assert d["jobs"]["python39"]["name"] == "python39"   # zweiter Pflicht-Check
    assert [s["with"]["python-version"] for s in d["jobs"]["python39"]["steps"] if s.get("uses", "").startswith("actions/setup-python")] == ["3.9"]


def test_veroeffentlichen():
    d = laden("veroeffentlichen.yml")
    assert d["on"]["push"]["branches"] == ["main"]
    assert d["permissions"] == {"contents": "read"}
    assert d["jobs"]["bauen"]["permissions"] == {"contents": "read", "pages": "write"}
    assert d["jobs"]["release"]["permissions"] == {"contents": "write"}
    assert d["jobs"]["veroeffentlichen"]["permissions"] == {"pages": "write", "id-token": "write"}
    alle = [u for j in d["jobs"].values() for u in benutzt(j)]
    for a in ("actions/configure-pages", "actions/upload-pages-artifact", "actions/deploy-pages"):
        assert any(u.startswith(a + "@v") for u in alle), a
    b = "\n".join(befehle(j) for j in d["jobs"].values())
    assert "engine/build.py --alle" in b
    assert "foexlab-update/" not in b and "foexlab-update.zip" in b
    assert "git push" not in b and "git tag" not in b
    assert "git/refs/tags/letzter-stand" in b and "force=true" in b
    assert "letzter-stand" in b and "--clobber" in b
    upload = [s for s in d["jobs"]["bauen"]["steps"] if s.get("uses", "").startswith("actions/upload-pages-artifact")][0]
    assert upload["with"]["path"] == "dist"


def test_job_mit_configure_pages_hat_pages_recht():
    d = laden("veroeffentlichen.yml")
    jobs = [j for j in d["jobs"].values() if any(u.startswith("actions/configure-pages@") for u in benutzt(j))]
    assert jobs and all(j["permissions"].get("pages") in ("read", "write") for j in jobs)


def test_schreibrechte_nur_ohne_npm():
    """npm ci läuft ohne gespeicherte Zugangsdaten; der Job mit Schreibrecht hat weder Checkout noch npm."""
    d = laden("veroeffentlichen.yml")
    bauen = d["jobs"]["bauen"]
    checkout = [s for s in bauen["steps"] if s.get("uses", "").startswith("actions/checkout@")][0]
    assert checkout["with"]["persist-credentials"] is False
    assert "npm ci" in befehle(bauen)
    for name, job in d["jobs"].items():
        if job.get("permissions", {}).get("contents") == "write":
            assert "npm" not in befehle(job), name
            assert not any(u.startswith("actions/checkout@") for u in benutzt(job)), name
            assert job["needs"] == "bauen"
    rel = d["jobs"]["release"]
    assert any(u.startswith("actions/download-artifact@v") for u in benutzt(rel))
    assert any(u.startswith("actions/upload-artifact@v") for u in benutzt(bauen))
    token_schritte = [s for j in d["jobs"].values() for s in j["steps"] if "GH_TOKEN" in s.get("env", {})]
    assert len(token_schritte) == 1 and "letzter-stand" in token_schritte[0]["run"]
