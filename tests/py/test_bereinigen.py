from foexlab.bereinigen import bereinige


def test_sternzeilen_und_ganzer_fettdruck():
    assert bereinige("****\n**Schaltet den Laser ein …**\n") == "Schaltet den Laser ein …\n"


def test_fett_im_satz_bleibt():
    s = "Die **Linse** **nach** der Justierung des Interferometers vor den Laser schrauben!\n"
    assert bereinige(s) == s


def test_fettes_bild():
    assert bereinige('**<img src="media/Schritt-1.jpg" alt="" width="383">**\n') == '<img src="media/Schritt-1.jpg" alt="" width="383">\n'


def test_leerzeilen_zusammenfassen():
    assert bereinige("a\n\n\n\n\nb\n") == "a\n\nb\n"


def test_bloecke_und_luecken_unveraendert():
    s = ":::hinweis\n**Ganz fett**\n:::\n**Es handelt sich um {{einen Laser|eine LED}}.**\n"
    assert bereinige(s) == s


def test_formel_bleibt_erhalten():
    assert bereinige("**$$ L\\_{opt} = n\\cdot L $$**\n") == "$$ L\\_{opt} = n\\cdot L $$\n"


def test_frontmatter_bleibt():
    s = '---\ntitel: "x"\n---\n\n\n\n**Text**\n'
    assert bereinige(s) == '---\ntitel: "x"\n---\n\nText\n'
