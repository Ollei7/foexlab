/* Bildzuordnung zum Ziehen: Bausteine auf Plätze ziehen oder antippen. Die select.gap bleiben das Datenmodell (quiz.js). */
(function (root, factory) {
  var m = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.FX = root.FX || {}).ziehen = m;
})(typeof self !== 'undefined' ? self : this, function (root) {
  var gewaehlt = null;   // angetippter Baustein
  function $(s, r) { return Array.prototype.slice.call(r.querySelectorAll(s)); }
  function wahl(an) { if (gewaehlt) gewaehlt.classList.remove('sel'); gewaehlt = an || null; if (an) an.classList.add('sel'); }

  function binde(q) {
    var abl = q.querySelector('.fx-ablage'), plaetze = $('.spot', q), chips = $('.fx-chip', q);
    var selOf = function (p) { return p.querySelector('select.gap'); };
    var gesperrt = function () { return plaetze.some(function (p) { return selOf(p).disabled; }); };
    /* Bausteine nach den select-Werten auf die Plätze setzen (erst falsche abräumen, dann frei wählen) */
    function sync() {
      plaetze.forEach(function (p) { var c = p.querySelector('.fx-chip'); if (c && c.getAttribute('data-v') !== selOf(p).value) abl.appendChild(c); });
      plaetze.forEach(function (p) {
        var v = selOf(p).value, c;
        if (v && !p.querySelector('.fx-chip')) {
          c = $('.fx-chip', abl).filter(function (x) { return x.getAttribute('data-v') === v; })[0];
          if (c) p.appendChild(c);
        }
      });
      chips.forEach(function (c) { c.classList.toggle('fx-gesperrt', gesperrt()); });
    }
    function setze(p, v) {
      var s = selOf(p);
      if (s.value === v) return;
      s.value = v; s.dispatchEvent(new root.Event('change', { bubbles: true }));
    }
    function platziere(chip, ziel) {
      if (!ziel || gesperrt()) return;
      var von = chip.parentNode.classList.contains('spot') ? chip.parentNode : null;
      if (von === ziel) return;
      if (von) setze(von, '');
      if (ziel.classList.contains('spot')) {
        var alt = ziel.querySelector('.fx-chip'); if (alt) abl.appendChild(alt);
        setze(ziel, chip.getAttribute('data-v')); ziel.appendChild(chip);   // gezogener Baustein bleibt selbst liegen
      }
      sync();
    }
    chips.forEach(function (chip) {
      chip.addEventListener('pointerdown', function (e) {
        if (gesperrt() || (e.button !== undefined && e.button > 0)) return;   // nur primäre Taste
        var sx = e.clientX, sy = e.clientY, bewegt = false, geist = null, ueber = null;
        if (chip.setPointerCapture && e.pointerId !== undefined) try { chip.setPointerCapture(e.pointerId); } catch (x) { /* ohne Capture weiter */ }
        function zielAn(ev) {
          var el = chip.ownerDocument.elementFromPoint ? chip.ownerDocument.elementFromPoint(ev.clientX, ev.clientY) : null;
          var t = el && el.closest('.spot,.fx-ablage');
          return t && q.contains(t) ? t : null;
        }
        function mv(ev) {
          if (!bewegt && Math.abs(ev.clientX - sx) + Math.abs(ev.clientY - sy) < 6) return;
          if (!bewegt) {
            bewegt = true; wahl(null);
            geist = chip.cloneNode(true); geist.classList.add('drag'); chip.ownerDocument.body.appendChild(geist); chip.classList.add('ghosted');
          }
          geist.style.left = (ev.clientX - geist.offsetWidth / 2) + 'px'; geist.style.top = (ev.clientY - geist.offsetHeight / 2) + 'px';
          var t = zielAn(ev);
          if (ueber && ueber !== t) ueber.classList.remove('over');
          ueber = t; if (t) t.classList.add('over');
          ev.preventDefault();
        }
        function ende(ev) {
          var abbruch = ev.type === 'pointercancel';
          chip.removeEventListener('pointermove', mv); chip.removeEventListener('pointerup', ende); chip.removeEventListener('pointercancel', ende);
          if (bewegt) {
            geist.parentNode.removeChild(geist); chip.classList.remove('ghosted');
            if (ueber) { ueber.classList.remove('over'); if (!abbruch) platziere(chip, ueber); }
          } else if (!abbruch) wahl(gewaehlt === chip ? null : chip);   // Abbruch: weder platzieren noch antippen
        }
        chip.addEventListener('pointermove', mv); chip.addEventListener('pointerup', ende); chip.addEventListener('pointercancel', ende);
      });
    });
    plaetze.concat([abl]).forEach(function (t) {
      t.addEventListener('click', function (e) {
        if (e.target.closest('.fx-chip') || !gewaehlt || !q.contains(gewaehlt)) return;
        var c = gewaehlt; wahl(null); platziere(c, t);
      });
    });
    q.addEventListener('fx:gesetzt', function () { wahl(null); sync(); });
    sync();
  }

  function init(wurzel) { $('.fx-ziehen', wurzel || root.document).forEach(function (b) { var q = b.closest('.q'); if (q && !q._fxZiehen) { q._fxZiehen = true; binde(q); } }); }
  if (root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', function () { init(); }); else init();
  }
  return { init: init };
});
