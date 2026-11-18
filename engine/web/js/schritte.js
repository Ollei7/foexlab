/* Baustein Schritt-Karten: ein Schritt pro Ansicht, Zurück/Weiter, Häkchen „Erledigt“. */
(function (root, factory) {
  var m = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.FX = root.FX || {}).schritte = m;
})(typeof self !== 'undefined' ? self : this, function (root) {
  function liste(el) { return Array.prototype.slice.call(el.querySelectorAll('.fx-schritt')); }
  function zustand(el) { if (!el._fxS) el._fxS = { erledigt: [], aktuell: 0 }; return el._fxS; }

  function zeige(el) {
    var z = zustand(el), s = liste(el), n = s.length;
    z.aktuell = Math.max(0, Math.min(z.aktuell, n - 1));
    s.forEach(function (x, i) {
      x.hidden = i !== z.aktuell;
      x.classList.toggle('fx-erledigt-ja', z.erledigt.indexOf(i) >= 0);
      if (i !== z.aktuell) Array.prototype.forEach.call(x.querySelectorAll('video'), function (v) { try { v.pause(); } catch (e) { /* jsdom */ } });
    });
    el.querySelector('.fx-schritt-zahl').textContent = 'Schritt ' + (z.aktuell + 1) + ' von ' + n;
    el.querySelector('.fx-zurueck').disabled = z.aktuell === 0;
    el.querySelector('.fx-weiter').disabled = z.aktuell === n - 1;
    el.querySelector('.fx-erledigt').checked = z.erledigt.indexOf(z.aktuell) >= 0;
  }

  function geheZu(el, i) {
    zustand(el).aktuell = i; zeige(el);
    el.dispatchEvent(new el.ownerDocument.defaultView.Event('change'));
  }

  function init(el) {
    el.querySelector('.fx-weiter').addEventListener('click', function () { geheZu(el, zustand(el).aktuell + 1); });
    el.querySelector('.fx-zurueck').addEventListener('click', function () { geheZu(el, zustand(el).aktuell - 1); });
    el.querySelector('.fx-erledigt').addEventListener('change', function (e) {
      var z = zustand(el), i = z.erledigt.indexOf(z.aktuell);
      if (e.target.checked && i < 0) z.erledigt.push(z.aktuell);
      if (!e.target.checked && i >= 0) z.erledigt.splice(i, 1);
      z.erledigt.sort(function (a, b) { return a - b; });
      zeige(el);
    });
    zeige(el);
  }

  if (root.FX && root.FX.felder) root.FX.felder.registriere('schritte', {
    init: init,
    laden: function (el, w) {
      el._fxS = { erledigt: (w.erledigt || []).slice(), aktuell: w.aktuell || 0 };
      zeige(el);
    },
    wert: function (el) { var z = zustand(el); return { erledigt: z.erledigt.slice(), aktuell: z.aktuell }; },
    leer: function (w) { return !(w && w.erledigt && w.erledigt.length); }
  });
  return { zeige: zeige, geheZu: geheZu };
});
