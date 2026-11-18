/* Werkzeug „polskizze“ (Kapitel 2, Ausgangsfrage): Skizze des realen Aufbaus mit Polarisationsfiltern in beiden Armen.
   Der Fragetext des Feldes wird zur Bildunterschrift. Nur Anzeige: kein Wert, nie ausgefüllt, nicht im Protokoll. */
(function (root) {
  const FX = root.FX, M = FX.mzi, h = M.h;

  function init(el) {
    if (el._polLaden) return;   // schon aufgebaut (Engine und laden() rufen beide init)
    el._polLaden = true;
    const flaeche = el.querySelector('.fx-werkzeug-flaeche'), qtext = el.querySelector('.qtext');
    const zeichnung = h('div', { 'class': 'mzi-zeichnung' });
    zeichnung.innerHTML = M.polSkizzeSVG();
    const unterschrift = h('figcaption', {});
    if (qtext) {
      while (qtext.firstChild) unterschrift.appendChild(qtext.firstChild);
      qtext.hidden = true;
    }
    flaeche.appendChild(h('figure', { 'class': 'mzi-skizze' }, zeichnung, unterschrift));
  }

  FX.felder.registriere('polskizze', {
    init: init, laden: function () {}, wert: function () { return {}; }, leer: function () { return false; }, ohneProtokoll: true
  });
})(typeof self !== 'undefined' ? self : this);
