/* Werkzeug „praeparation“ (Kapitel 2): Laser und Polarisationsdreher; Antippen einer Winkeleinstellung zeigt Zustand, Basis und Bit.
   Reine Veranschaulichung ohne Eingabe: kein Speicherwert, kein Protokolleintrag. */
(function (root) {
  var FX = root.FX, B = FX.bb84, h = B.h;
  var WINKEL = [['0°', '+', 0, 0], ['90°', '+', 1, 90], ['−45°', '×', 0, -45], ['45°', '×', 1, 45]];

  function pfeil(grad) {
    var s = root.document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 420 130'); s.setAttribute('class', 'fx-prae-svg'); s.setAttribute('role', 'img');
    s.setAttribute('aria-label', 'Laser, Polarisationsdreher und Polarisationsrichtung des Photons');
    s.innerHTML = '<rect x="10" y="40" width="80" height="50" rx="8" fill="#33416E"/><text x="50" y="71" font-size="17" fill="#fff" text-anchor="middle" font-family="inherit">Laser</text>' +
      '<line x1="90" y1="65" x2="170" y2="65" stroke="#3F9AD6" stroke-width="4"/>' +
      '<rect x="170" y="20" width="90" height="90" rx="10" fill="#F7F7F5" stroke="#33416E" stroke-width="2"/>' +
      '<g transform="rotate(' + grad + ' 215 65)" stroke="#33416E" stroke-width="4" stroke-linecap="round" fill="none"><line x1="215" y1="30" x2="215" y2="100"/><polyline points="207,40 215,30 223,40"/><polyline points="207,90 215,100 223,90"/></g>' +
      '<text x="215" y="126" font-size="14" text-anchor="middle" fill="#33416E" font-family="inherit">Polarisationsdreher</text>' +
      '<line x1="260" y1="65" x2="320" y2="65" stroke="#3F9AD6" stroke-width="4"/>' +
      '<g transform="rotate(' + grad + ' 365 65)" stroke="#F58411" stroke-width="5" stroke-linecap="round" fill="none"><line x1="365" y1="25" x2="365" y2="105"/><polyline points="355,37 365,25 375,37"/><polyline points="355,93 365,105 375,93"/></g>';
    return s;
  }

  function init(el) {
    var flaeche = el.querySelector('.fx-werkzeug-flaeche'), bild = h('div', { 'class': 'fx-prae-bild' }), text = h('p', { 'class': 'fx-prae-text', role: 'status' }, 'Tippe auf eine Winkeleinstellung.');
    var knoepfe = WINKEL.map(function (w) {
      return h('button', { type: 'button', 'class': 'fx-knopf', 'aria-pressed': 'false', 'data-winkel': w[3], onclick: function () { zeige(w); } }, w[0]);
    });
    function zeige(w) {
      knoepfe.forEach(function (b) { b.setAttribute('aria-pressed', b === knoepfe[WINKEL.indexOf(w)] ? 'true' : 'false'); });
      bild.innerHTML = ''; bild.appendChild(pfeil(w[3]));
      text.textContent = 'Basis ' + w[1] + ', Bit ' + w[2] + ', Zustand ' + B.zustand(w[1], w[2]).ket;
    }
    flaeche.appendChild(h('div', { 'class': 'fx-knoepfe' }, knoepfe)); flaeche.appendChild(bild); flaeche.appendChild(text);
    bild.appendChild(pfeil(0));
  }

  FX.felder.registriere('praeparation', {
    init: init, laden: function () {}, wert: function () { return {}; }, leer: function () { return true; }, ohneProtokoll: true
  });
})(typeof self !== 'undefined' ? self : this);
