from foexlab.formeln import md
class K: maths = []
def test_kommentar_wird_entfernt():
    h = md(K(), "<!-- Regel 14 bewusst verletzt -->Jedes Mal, wenn wir …")
    assert "Regel 14" not in h and "<!--" not in h and "Jedes Mal" in h
def test_mehrzeiliger_kommentar():
    assert "geheim" not in md(K(), "A\n<!-- geheim\nnoch -->\nB")
def test_kommentar_in_listenpunkt():
    h = md(K(), "- <!-- x -->Wenn das Photon …")
    assert "<li>Wenn das Photon" in h
