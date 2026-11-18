import json, re

import pytest

from foexlab.seite import baue


@pytest.fixture(scope="module")
def kurs(tmp_path_factory):
    ziel = tmp_path_factory.mktemp("bb84") / "bb84"
    meldungen = []
    baue("kurse/bb84", str(ziel), ausgabe=meldungen.append)
    html = (ziel / "index.html").read_text(encoding="utf-8")
    regeln = json.loads(re.search(r'id="fx-regeln">(.*?)</script>', html, re.S).group(1))
    return html, regeln, meldungen


def karte(html, karten_id):
    m = re.search(r'<section class="fx-karte[^>]*data-karte="' + re.escape(karten_id) + r'".*?</section>', html, re.S)
    assert m, karten_id
    return m.group(0)


def test_baut_ohne_warnungen_ausser_datei_fehlt(kurs):
    _, _, meldungen = kurs
    warn = [m for m in meldungen if m.startswith("WARNUNG") and "Datei fehlt" not in m]
    assert warn == []


def test_lernblatt_sechs_felder_fuenf_sperrt(kurs):
    h, _, _ = kurs
    k = karte(h, "lernblatt/lernblatt-mein-vorwissen")
    assert k.count('class="fx-feld"') == 6
    assert k.count('data-fx-sperrt="1"') == 5 and k.count('data-fx-optional="1"') == 1
    assert "zufällig" in k and "Was bedeutet für dich" in k


def test_kapitel_1_sechs_karten_und_quiz(kurs):
    h, r, _ = kurs
    ids = [k for k, a in r["karten"].items() if a == "schluesselverteilungsproblem"]
    assert ids == ["schluesselverteilungsproblem/" + s for s in ("eine-wichtige-nachricht", "die-idee-verschluesselung", "das-one-time-pad",
                   "das-kernproblem-der-klassischen-kryptogr", "ein-ausweg-quantenphysik", "verstaendnisfragen-kapitel-1")]
    q = karte(h, ids[-1])
    assert q.count('class="fx-quizfrage"') == 4
    assert '"oeffnet": "grundlagen"' in q.replace("&quot;", '"')
    # alle Nachschlage-Ziele existieren
    for ziel in re.findall(r'data-nachschlagen="([^"]+)"', q):
        assert ziel in r["karten"], ziel


def test_regeln_kapitel_1(kurs):
    _, r, _ = kurs
    a = r["abschnitte"]["schluesselverteilungsproblem"]
    assert a["oeffnet_nach"] == "felder:lernblatt/lernblatt-mein-vorwissen"
    assert a["grund"] == "Öffnet sich, wenn alle Fragen im Lernblatt beantwortet sind."


def test_kapitel_1_sperren_und_richtige_antworten(kurs):
    h, _, _ = kurs
    assert karte(h, "schluesselverteilungsproblem/eine-wichtige-nachricht").count('data-fx-sperrt="1"') == 1
    q = karte(h, "schluesselverteilungsproblem/verstaendnisfragen-kapitel-1")
    richtig = re.findall(r'<input type="radio" name="q\d+" data-f="([\d.]+)"', q)
    assert [i for i in range(len(richtig)) if float(richtig[i]) == 1] == [1, 4, 9, 13]
    assert "Wulii plfk prujhq" in h


def test_kapitel_2_struktur(kurs):
    h, r, _ = kurs
    ids = [k for k, a in r["karten"].items() if a == "grundlagen"]
    assert len(ids) == 10
    assert r["abschnitte"]["grundlagen"]["oeffnet_nach"] == "quiz:schluesselverteilungsproblem/verstaendnisfragen-kapitel-1"
    check = karte(h, "grundlagen/wissenscheck-welche-auswirkung-hat-die-b")
    assert check.count('class="fx-quizfrage"') == 3
    assert "grundlagen/experiment-praeparation-in-basis-und-mes" in check.replace("&quot;", '"')
    quiz = karte(h, "grundlagen/verstaendnisfragen-kapitel-2")
    assert quiz.count('class="fx-quizfrage"') == 5 and '"durchfuehrung"' in quiz.replace("&quot;", '"')
    assert r["kartenregeln"]["grundlagen/experiment-praeparation-in-basis-und-mes"]["grund"] == "Öffnet sich nach dem bestandenen Wissenscheck."
    for ziel in re.findall(r'class="fx-quizfrage" data-nr="\d+" data-nachschlagen="([^"]+)"', h):
        assert ziel in r["karten"], ziel


def test_kapitel_2_definitionsfelder_und_sperren(kurs):
    h, _, _ = kurs
    for d in ("zustand", "praeparation", "messung", "superposition"):
        assert re.search(r'data-fx-id="grundlagen/[^"]+/def-' + d + '"', h), d
    assert karte(h, "grundlagen/experiment-praeparation-in-basis-und-mes").count('data-fx-sperrt="1"') == 1
    assert karte(h, "grundlagen/wissenscheck-welche-auswirkung-hat-die-b").count('data-fx-sperrt="1"') == 1


def test_kapitel_2_loesungen_mit_korrekturen(kurs):
    h, _, _ = kurs
    k = karte(h, "grundlagen/experiment-messapparat-mit-polarisations-2")
    a1 = re.search(r"Zustand \|↘⟩ \(anti-diagonal\).*?</div></div>", k, re.S)
    assert "ausschließlich Detektor D0 ein Detektionsereignis. Detektor D1 verzeichnet keines" in k
    assert "ausschließlich Detektor D1 ein Detektionsereignis. Detektor D0 verzeichnet keines. Detektionswahrscheinlichkeit D1" in k
    q = karte(h, "grundlagen/verstaendnisfragen-kapitel-2")
    assert "löst dabei einen eventuellen Superpositionszustand auf" in q and "eigenständigen Zustand mit Anteilen mehrerer Basiszustände" in q
    assert "liest einen Zustand aus und kollabiert dabei" not in q.split("richtig")[0]
    assert "gleichzeitig in mehreren Zuständen" not in q
    assert "data-asset" not in h and 'media/messapparat-plus.svg' in h


def test_werkzeuge_im_bauergebnis(kurs):
    h, _, meldungen = kurs
    assert 'data-fx-art="praeparation"' in h and 'data-fx-art="superposition"' in h
    assert not any("Werkzeug" in m for m in meldungen)


def test_nachschlagen_karten_und_werkzeug(kurs):
    h, r, _ = kurs
    ids = [k for k, a in r["karten"].items() if a == "nachschlagen"]
    from foexlab.quelle import slug
    titel = ["Einleitung", "Überblick: Der Ablauf des BB84-Protokolls", "Ablauf des BB84 Protokolls anhand eines Beispiels", "Schritt-für-Schritt: 8 Photonen",
             "Von Text zu Bits: „Hallo\"", "Verschlüsselung: H mit dem Quantenschlüssel", "Gleiche Basis bedeutet vollständige Informationsübertragung"]
    assert [i.split("/")[1] for i in ids] == [slug(t) for t in titel]
    assert r["abschnitte"]["nachschlagen"] == {"nachschlagen": True}
    assert 'data-fx-art="photonen8"' in h and "codetabelle.svg" in h
    assert "Kein Match" not in h and "Der mit dem BB84-Protokoll erstellte Schlüssel lautet" in h
    assert "in der das Bit kodiert wird" in h and "verschlüsselt wird, wählen" not in h


def test_kapitel_3_struktur(kurs):
    from foexlab.quelle import slug
    h, r, _ = kurs
    ids = [k for k, a in r["karten"].items() if a == "durchfuehrung"]
    assert len(ids) == 7
    assert r["abschnitte"]["durchfuehrung"]["oeffnet_nach"] == "quiz:grundlagen/verstaendnisfragen-kapitel-2"
    for i in ids:   # auf jeder Karte der Link in den Nachschlageteil
        assert 'href="#k/nachschlagen/ueberblick-der-ablauf-des-bb84-protokoll" data-fx-ruecksprung' in karte(h, i)
    assert 'data-fx-art="rollenwahl"' in karte(h, "durchfuehrung/" + slug("Aufgabe 1: Schlüsselaustausch & Verschlüsselung zwischen Alice und Bob"))
    a3 = karte(h, "durchfuehrung/aufgabe-3-bb84-mit-eve")
    assert re.search(r'data-fx-art="schluessel"[^>]*data-fx-konfig="[^"]*eve', a3)
    assert a3.count('data-fx-art="text"') == 3
    assert 'data-fx-art="schluessel"' in karte(h, "durchfuehrung/" + slug("Aufgabe 2: Verschlüsselt & entschlüsselt längere Nachrichten"))


def test_kapitel_3_inhalt_und_knopf(kurs):
    from foexlab.quelle import slug
    h, r, _ = kurs
    eve = karte(h, "durchfuehrung/der-lauscher-eve")
    assert "im von ihr gemessenen Zustand" in eve and "im gleichen Zustand" not in eve and "[×] und [+] Basis" in eve
    assert "intercept-resend.svg" in karte(h, "durchfuehrung/der-intercept-resend-angriff")
    assert "aufbau-ueberblick.svg" in eve
    kk = karte(h, "durchfuehrung/" + slug("Das Kein-Klon-Theorem: Kopieren ist verboten"))
    assert 'data-oeffnet="abschluss"' in kk and 'data-knopf-id="abschluss"' in kk


def test_baumdiagramm_in_aufgabe_3(kurs):
    from foexlab.quelle import slug
    h, _, meldungen = kurs
    a3 = karte(h, "durchfuehrung/aufgabe-3-bb84-mit-eve")
    assert 'data-fx-art="baumdiagramm"' in a3 and "Vervollständige das Baumdiagramm" in a3
    assert a3.index('Frage 2') < a3.index('data-fx-art="baumdiagramm"') < a3.index('Frage 4')


def test_aufgabe_4_testbits_und_qber(kurs):
    from foexlab.quelle import slug
    h, _, _ = kurs
    a4 = karte(h, "durchfuehrung/" + slug("Aufgabe 4: Wie viele Testbits braucht man?"))
    assert 'data-fx-art="testbits"' in a4 and "Notiert eure Schätzung" in a4
    assert '<details class="fx-mehr">' in a4 and "Quantum Bit Error Rate (QBER)" in a4 and "Glück haben" in a4
    assert "Beispiele aus echten Experimenten" not in h


def test_kapitel_4_abschluss(kurs):
    h, r, _ = kurs
    ids = [k for k, a in r["karten"].items() if a == "abschluss"]
    from foexlab.quelle import slug
    assert ids == ["abschluss/" + slug(t) for t in ("Grenzen des Analogieexperiments", "Anwendung in der Praxis: Niedersachsen Quantum Link", "Das hast du in diesem Workshop gelernt")]
    assert ids[2] == "abschluss/das-hast-du-in-diesem-workshop-gelernt"
    a = r["abschnitte"]["abschluss"]
    assert a["oeffnet_nach"] == "knopf:abschluss" and a["grund"] == "Öffnet sich über „Experiment abschließen“ am Ende von Kapitel 3."
    grenzen = karte(h, ids[0])
    assert "kurzen Laserpulsen" in grenzen and "kontinuierlichen" not in grenzen and "Analogieaufbau" in grenzen
    assert "quantenlink.png" in karte(h, ids[1]) and "25,49" in karte(h, ids[1]) and "~ 0,65" in karte(h, ids[1])
    letzte = karte(h, ids[2])
    assert letzte.count("<li>") == 8 and 'href="#ergebnis"' in letzte and "Ergebnisseite</a> und im Protokoll-PDF" in letzte


def test_kurs_meta_mit_auf_einen_blick(kurs):
    h, _, _ = kurs
    meta = json.loads(re.search(r'id="fx-kurs">(.*?)</script>', h, re.S).group(1))
    assert meta["auf_einen_blick"]["definitionen"]["Superposition"] == "def-superposition"
    assert meta["auf_einen_blick"]["zusammenfassung"] == "abschluss/das-hast-du-in-diesem-workshop-gelernt"
    assert meta["lizenz"].startswith("Material: Dominik Spicka")
