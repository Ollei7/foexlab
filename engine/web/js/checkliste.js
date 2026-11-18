/* Baustein Checkliste: jeder Punkt ein Haken; erledigt (nicht leer), sobald alle gesetzt sind. */
(function (root, factory) {
  var m = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.FX = root.FX || {}).checkliste = m;
})(typeof self !== 'undefined' ? self : this, function (root) {
  function boxen(el) { return Array.prototype.slice.call(el.querySelectorAll('input[type=checkbox]')); }
  function punkte(el) {
    return Array.prototype.map.call(el.querySelectorAll('.fx-checkliste li'), function (li) {
      var s = li.querySelector('span'); return ((s || li).textContent || '').trim();
    });
  }
  function status(el) {
    var b = boxen(el), n = b.filter(function (c) { return c.checked; }).length, p = el.querySelector('.fx-status');
    if (p) p.textContent = n === b.length ? 'Alles da.' : n + ' von ' + b.length + ' abgehakt.';
  }

  if (root.FX && root.FX.felder) root.FX.felder.registriere('checkliste', {
    init: status,
    laden: function (el, w) {
      var h = (w && w.haken) || [];
      boxen(el).forEach(function (c, i) { c.checked = !!h[i]; });
      status(el);
    },
    wert: function (el) { return { haken: boxen(el).map(function (c) { return c.checked; }) }; },
    leer: function (w) { return !(w && w.haken && w.haken.length && w.haken.every(Boolean)); },
    begonnen: function (w) { return !!w && !!w.haken && w.haken.some(Boolean); },
    beiEingabe: status,
    protokoll: function (el, w) {
      var h = (w && w.haken) || [];
      return [{ typ: 'tabelle', kopf: ['Punkt', 'Abgehakt'], zeilen: punkte(el).map(function (t, i) { return [t, h[i] ? '✓' : '–']; }) }];
    }
  });
  return { status: status };
});
