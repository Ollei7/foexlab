/* Werkzeug „superposition“ (Kapitel 2): vier Fälle |→⟩ und |↑⟩ in [×], |↗⟩ und |↘⟩ in [+].
   Pfeildiagramm mit Gesamtzustand und Anteilen, Formel mit 1/√2 und Vorzeichen, zwei Balken mit 50 %. Kein Speicherwert. */
(function (root) {
  var FX = root.FX, h = FX.bb84.h;
  var R2 = Math.SQRT1_2;
  // Bildschirmrichtungen (y nach unten)
  var V = { '↑': [0, -1], '→': [1, 0], '↗': [R2, -R2], '↘': [R2, R2] };
  var FAELLE = [
    { ket: '→', basis: '×', b1: '↗', b2: '↘', s2: 1 },
    { ket: '↑', basis: '×', b1: '↗', b2: '↘', s2: -1 },
    { ket: '↗', basis: '+', b1: '↑', b2: '→', s2: 1 },
    { ket: '↘', basis: '+', b1: '→', b2: '↑', s2: -1 }
  ];
  var BLAU = '#3F9AD6', ROSE = '#CF6F82', NAVY = '#33416E';

  function k(s) { return '|' + s + '⟩'; }

  function svg(f) {
    var cx = 130, cy = 130, L = 100;
    function p(v, f_) { return [cx + v[0] * L * f_, cy + v[1] * L * f_]; }
    function pf(v, f_, farbe, breite, gestrichelt) {
      var e = p(v, f_), a = Math.atan2(e[1] - cy, e[0] - cx), kopf = '';
      var l1 = [e[0] - 10 * Math.cos(a - 0.45), e[1] - 10 * Math.sin(a - 0.45)], l2 = [e[0] - 10 * Math.cos(a + 0.45), e[1] - 10 * Math.sin(a + 0.45)];
      kopf = '<polyline points="' + l1 + ' ' + e + ' ' + l2 + '" fill="none" stroke="' + farbe + '" stroke-width="' + breite + '" stroke-linecap="round"/>';
      return '<line x1="' + cx + '" y1="' + cy + '" x2="' + e[0] + '" y2="' + e[1] + '" stroke="' + farbe + '" stroke-width="' + breite + '"' + (gestrichelt ? ' stroke-dasharray="6 5"' : '') + ' stroke-linecap="round"/>' + kopf;
    }
    var v1 = V[f.b1], v2 = V[f.b2], g = V[f.ket];
    var a1 = [v1[0] * R2, v1[1] * R2], a2 = [v2[0] * R2 * f.s2, v2[1] * R2 * f.s2];
    var achse = function (v) { return '<line x1="' + (cx - v[0] * 118) + '" y1="' + (cy - v[1] * 118) + '" x2="' + (cx + v[0] * 118) + '" y2="' + (cy + v[1] * 118) + '" stroke="#C9CEDB" stroke-width="1" stroke-dasharray="3 4"/>'; };
    var spitze = [cx + a1[0] * L + a2[0] * L, cy + a1[1] * L + a2[1] * L];
    return '<svg class="fx-spd-svg" viewBox="0 0 260 260" role="img" aria-label="Pfeildiagramm: Gesamtzustand und Anteile in der Messbasis">' + achse(v1) + achse(v2) +
      '<line x1="' + (cx + a1[0] * L) + '" y1="' + (cy + a1[1] * L) + '" x2="' + spitze[0] + '" y2="' + spitze[1] + '" stroke="' + ROSE + '" stroke-width="1.5" stroke-dasharray="4 4"/>' +
      '<line x1="' + (cx + a2[0] * L) + '" y1="' + (cy + a2[1] * L) + '" x2="' + spitze[0] + '" y2="' + spitze[1] + '" stroke="' + BLAU + '" stroke-width="1.5" stroke-dasharray="4 4"/>' +
      pf(a1, 1, BLAU, 3.5) + pf(a2, 1, ROSE, 3.5) + pf(g, 1, NAVY, 5) +
      '<text x="' + (cx + v1[0] * 122) + '" y="' + (cy + v1[1] * 122 + 5) + '" font-size="15" text-anchor="middle" fill="' + NAVY + '" font-family="inherit">' + k(f.b1) + '</text>' +
      '<text x="' + (cx + v2[0] * 122) + '" y="' + (cy + v2[1] * 122 + 5) + '" font-size="15" text-anchor="middle" fill="' + NAVY + '" font-family="inherit">' + k(f.b2) + '</text></svg>';
  }

  function formel(f) {
    var bruch = function () { return h('span', { 'class': 'fx-spd-bruch' }, h('sup', {}, '1'), '⁄', h('sub', {}, '√2')); };
    return h('div', { 'class': 'fx-spd-formel' }, h('strong', {}, k(f.ket)), ' = ', bruch(), ' · ', h('strong', {}, k(f.b1)), ' ' + (f.s2 > 0 ? '+' : '−') + ' ', bruch(), ' · ', h('strong', {}, k(f.b2)));
  }

  function init(el) {
    var flaeche = el.querySelector('.fx-werkzeug-flaeche'), ausgabe = h('div', { 'class': 'fx-spd-ausgabe' });
    var knoepfe = FAELLE.map(function (f, i) {
      return h('button', { type: 'button', 'class': 'fx-knopf', 'aria-pressed': 'false', onclick: function () { zeige(i); } }, k(f.ket) + ' in [' + f.basis + ']');
    });
    function zeige(i) {
      var f = FAELLE[i];
      knoepfe.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
      ausgabe.innerHTML = '';
      var bild = h('div', { 'class': 'fx-spd-bild' }); bild.innerHTML = svg(f);
      var legende = h('ul', { 'class': 'fx-spd-legende' }, h('li', {}, h('span', { 'class': 'fx-spd-punkt', style: 'background:' + BLAU }), '1. Basiszustand'), h('li', {}, h('span', { 'class': 'fx-spd-punkt', style: 'background:' + ROSE }), '2. Basiszustand'), h('li', {}, h('span', { 'class': 'fx-spd-punkt', style: 'background:' + NAVY }), 'Gesamtzustand'));
      var balken = h('div', { 'class': 'fx-spd-balken' },
        [f.b1, f.b2].map(function (b, n) { return h('div', { 'class': 'fx-spd-zeile' }, h('span', {}, k(b)), h('span', { 'class': 'fx-spd-leiste' }, h('i', { style: 'width:50%;background:' + (n ? ROSE : BLAU) })), h('span', {}, '50 %')); }));
      ausgabe.appendChild(h('div', { 'class': 'fx-spd-zeilen' }, bild, legende));
      ausgabe.appendChild(formel(f));
      ausgabe.appendChild(h('p', { 'class': 'fx-spd-sub' }, 'Messung in [' + f.basis + ']-Basis: 50 % ' + k(f.b1) + ' | 50 % ' + k(f.b2)));
      ausgabe.appendChild(balken);
    }
    flaeche.appendChild(h('div', { 'class': 'fx-knoepfe' }, knoepfe)); flaeche.appendChild(ausgabe);
    flaeche.appendChild(h('p', { 'class': 'fx-spd-hinweis' }, 'Ein ', h('strong', {}, 'Minuszeichen'), ' bedeutet, dass der Anteil in die entgegengesetzte Richtung zeigt – erkennbar am Pfeil im Diagramm. Auf die Wahrscheinlichkeit hat das keinen Einfluss, sie beträgt in allen Fällen 50 %.'));
    zeige(0);
  }

  FX.felder.registriere('superposition', {
    init: init, laden: function () {}, wert: function () { return {}; }, leer: function () { return true; }, ohneProtokoll: true
  });
})(typeof self !== 'undefined' ? self : this);
