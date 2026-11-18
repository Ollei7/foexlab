/* Werkzeug „photonen8“ (Nachschlagen): Dominiks feste Beispielfolge mit 8 Photonen, Zeile für Zeile aufdecken.
   Bei ungleicher Basis ist Bobs Ergebnis zufällig. Nichts wird gespeichert. */
(function (root) {
  var FX = root.FX, B = FX.bb84, h = B.h;
  var BEISPIEL = [{ bit: 0, basis: '+' }, { bit: 1, basis: '×' }, { bit: 1, basis: '+' }, { bit: 0, basis: '×' }, { bit: 1, basis: '+' }, { bit: 0, basis: '×' }, { bit: 1, basis: '+' }, { bit: 0, basis: '+' }];
  var BOB = ['+', '+', '+', '×', '×', '×', '+', '×'];
  var KOPF = ['#', 'Alice Bit', 'Alice Basis', 'Photon', 'Bob Basis', 'Bob Messung', 'Basis gleich?', 'Im Schlüssel'];

  function pfeil(basis, bit) { return B.zustand(basis, bit).ket.replace(/[|⟩]/g, ''); }

  function init(el) {
    var flaeche = el.querySelector('.fx-werkzeug-flaeche'), aktuell = 0, key = '';
    var tbody = h('tbody'), weiter = h('button', { type: 'button', 'class': 'fx-knopf fx-haupt fx-p8-weiter' }), fortschritt = h('span', { 'class': 'fx-p8-fortschritt', role: 'status' });
    var schluessel = h('div', { 'class': 'fx-p8-schluessel', hidden: true });
    var neu = h('button', { type: 'button', 'class': 'fx-knopf fx-p8-neu' }, '↺ Neustart');

    function verdeckt(i) { var tr = h('tr', { 'class': 'fx-p8-zu' }, h('td', {}, String(i + 1))); for (var k = 1; k < 8; k++) tr.appendChild(h('td', {}, '?')); return tr; }
    function neustart() {
      aktuell = 0; tbody.innerHTML = '';
      for (var i = 0; i < 8; i++) tbody.appendChild(verdeckt(i));
      weiter.textContent = '▶ Nächster Schritt'; weiter.disabled = false;
      fortschritt.textContent = '0 / 8 Photonen'; schluessel.hidden = true; schluessel.innerHTML = '';
    }
    function schritt() {
      if (aktuell >= 8) return;
      var i = aktuell, a = BEISPIEL[i], bob = BOB[i], gleich = a.basis === bob;
      var ergebnis = B.messung(a.basis, a.bit, bob, B.zufall);
      var tr = h('tr', { 'class': gleich ? 'fx-p8-ja' : 'fx-p8-nein' },
        h('td', {}, String(i + 1)), h('td', {}, h('strong', {}, String(a.bit))), h('td', {}, a.basis), h('td', { 'class': 'fx-p8-ph' }, pfeil(a.basis, a.bit)), h('td', {}, bob),
        h('td', {}, h('strong', {}, String(ergebnis)), ' ', h('span', { 'class': 'fx-p8-ph' }, pfeil(bob, ergebnis))),
        h('td', {}, gleich ? '✓ Ja' : '✗ Nein'), h('td', {}, gleich ? h('strong', {}, String(a.bit)) : '–'));
      tbody.replaceChild(tr, tbody.children[i]);
      aktuell++; fortschritt.textContent = aktuell + ' / 8 Photonen';
      if (aktuell >= 8) {
        weiter.textContent = '✓ Fertig'; weiter.disabled = true;
        key = BEISPIEL.filter(function (x, j) { return x.basis === BOB[j]; }).map(function (x) { return x.bit; }).join('');
        schluessel.hidden = false; schluessel.innerHTML = '';
        schluessel.appendChild(h('div', {}, 'Rohschlüssel (aus gleichen Basen)')); schluessel.appendChild(h('div', { 'class': 'fx-p8-key' }, key || '(kein Match)'));
      } else weiter.textContent = '▶ Nächstes Photon (' + (aktuell + 1) + '/8)';
    }
    weiter.addEventListener('click', schritt); neu.addEventListener('click', neustart);
    var tabelle = h('div', { 'class': 'fx-tab-wrap' }, h('table', { 'class': 'fx-p8-tabelle' }, h('thead', {}, h('tr', {}, KOPF.map(function (k) { return h('th', {}, k); }))), tbody));
    flaeche.appendChild(tabelle); flaeche.appendChild(h('div', { 'class': 'fx-knoepfe' }, weiter, neu, fortschritt)); flaeche.appendChild(schluessel);
    neustart();
  }

  FX.felder.registriere('photonen8', { init: init, laden: function () {}, wert: function () { return {}; }, leer: function () { return true; }, ohneProtokoll: true });
})(typeof self !== 'undefined' ? self : this);
