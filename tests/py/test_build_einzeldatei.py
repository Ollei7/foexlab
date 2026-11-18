from foexlab.seite import baue

# Statistik von kurse/mzi (9 Abschnitte, nur Lern- und Werkzeugfelder, keine Tests/Quizfragen)
STATS_MZI = {'sections': 9, 'tests': 0, 'q': 0, 'aufgaben': 0, 'material': 35}


def test_einzeldatei_stats(tmp_path):
    out = tmp_path / "m.html"
    assert baue("kurse/mzi", str(out), einzeldatei=True) == STATS_MZI
    # mzi hat ein Video, das nicht eingebettet wird; die Datei besteht aus Seite, Schrift (base64) und Werkzeugen
    assert out.stat().st_size > 500_000
