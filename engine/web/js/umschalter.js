/* Kleine Bausteine ohne Speicherwert: Umschalter (Ansichten), Knopf (öffnet Abschnitt), Lösung anzeigen. */
(function (root, factory) {
  var m = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.FX = root.FX || {}).umschalter = m;
})(typeof self !== 'undefined' ? self : this, function (root) {
  function $(s, r) { return Array.prototype.slice.call(r.querySelectorAll(s)); }

  function zeigeAnsicht(knopf) {
    var box = knopf.closest('.fx-umschalter'), nr = knopf.getAttribute('data-ansicht');
    $('.fx-umschalter-knoepfe button', box).forEach(function (b) { b.setAttribute('aria-pressed', b === knopf ? 'true' : 'false'); });
    $('.fx-ansicht-inhalt', box).forEach(function (a) { a.hidden = a.getAttribute('data-ansicht') !== nr; });
  }

  function oeffneKnopf(knopf) {
    var FX = root.FX, ziel = knopf.getAttribute('data-oeffnet'), id = knopf.getAttribute('data-knopf-id');
    if (FX.freischaltung) FX.freischaltung.oeffne('knopf:' + id);
    var erste = root.document.querySelector('.fx-karte[data-abschnitt-id="' + ziel + '"]');
    if (erste && FX.oberflaeche) FX.oberflaeche.geheZu('#k/' + erste.getAttribute('data-karte'));
  }

  function loesung(knopf) {
    var l = knopf.closest('.fx-loesung-box').querySelector('.fx-loesung');
    l.hidden = !l.hidden;
    knopf.textContent = l.hidden ? 'Lösung anzeigen' : 'Lösung ausblenden';
    knopf.setAttribute('aria-expanded', l.hidden ? 'false' : 'true');
  }

  if (root.document && root.document.addEventListener) root.document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-ansicht') && b.closest('.fx-umschalter')) zeigeAnsicht(b);
    else if (b.classList.contains('fx-knopf-oeffnet')) oeffneKnopf(b);
    else if (b.classList.contains('fx-loesung-knopf')) loesung(b);
  });

  return { zeigeAnsicht: zeigeAnsicht, oeffneKnopf: oeffneKnopf, loesung: loesung };
});
