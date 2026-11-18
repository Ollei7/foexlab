/* Quiz-Serie: eine Frage pro Ansicht, falsche Antworten mit Erklärung und „Nochmal versuchen“.
   Sind alle Fragen richtig, öffnet sich das Ziel (Kapitel- oder Karten-ID) über FX.freischaltung.
   Wert: {antworten: {nr: [index]}, richtig: {nr: boolean}, bestanden: boolean}. */
(function (root, factory) {
  factory(root);
})(typeof self !== 'undefined' ? self : this, function (root) {
  var FX = root.FX;
  if (!FX || !FX.felder || !FX.quiz) return;
  var MELDUNG = 'Alle Fragen richtig – das nächste Kapitel ist freigeschaltet.';

  function $(s, r) { return Array.prototype.slice.call(r.querySelectorAll(s)); }
  function konfig(el) { try { return JSON.parse(el.getAttribute('data-fx-konfig')) || {}; } catch (e) { return {}; } }
  function fragen(el) { return $('.fx-quizfrage', el); }
  function z(el) { if (!el._fxQ) el._fxQ = { antworten: {}, richtig: {}, bestanden: false, aktuell: 0 }; return el._fxQ; }
  function melde(el) { el.dispatchEvent(new el.ownerDocument.defaultView.Event('change', { bubbles: true })); }
  function frageEl(el) { return fragen(el)[z(el).aktuell]; }
  function offeneFrage(el) {
    var s = z(el), n = fragen(el).length;
    for (var i = 0; i < n; i++) if (s.richtig[i] !== true) return i;
    return n - 1;
  }

  function anzeigen(el) {
    var s = z(el), fs = fragen(el), n = fs.length, i = s.aktuell, status = s.richtig[i];
    fs.forEach(function (f, k) { f.hidden = k !== i; });
    el.querySelector('.fx-quizzahl').textContent = 'Frage ' + (i + 1) + ' von ' + n;
    var punkte = el.querySelector('.fx-quizpunkte'); punkte.innerHTML = '';
    var erreichbar = offeneFrage(el);
    for (var k = 0; k < n; k++) {
      var li = el.ownerDocument.createElement('li');
      li.className = 'fx-quizpunkt' + (s.richtig[k] === true ? ' ok' : s.richtig[k] === false ? ' falsch' : '') + (k === i ? ' aktuell' : '');
      var b = el.ownerDocument.createElement('button'); b.type = 'button'; b.textContent = String(k + 1);
      b.setAttribute('aria-label', 'Frage ' + (k + 1)); b.disabled = k > erreichbar; b.setAttribute('data-nr', k);
      li.appendChild(b); punkte.appendChild(li);
    }
    el.querySelector('.fx-pruefen').hidden = status !== undefined;
    el.querySelector('.fx-nochmal').hidden = status !== false;
    el.querySelector('.fx-naechste').hidden = !(status === true && i < n - 1);
    var nach = el.querySelector('.fx-nachschlagen'), ziel = fs[i].getAttribute('data-nachschlagen');
    nach.hidden = !(status === false && ziel); if (ziel) nach.setAttribute('href', '#k/' + ziel);
    var m = el.querySelector('.fx-quizmeldung');
    m.hidden = !s.bestanden; m.textContent = s.bestanden ? MELDUNG : '';
  }

  function pruefen(el) {
    var s = z(el), i = s.aktuell, r = FX.quiz.pruefe(frageEl(el).querySelector('.q'));
    if (!r || r.anteil === null) return;
    s.antworten[i] = r.antwort; s.richtig[i] = r.anteil >= 0.999;
    var alle = fragen(el).every(function (f, k) { return s.richtig[k] === true; });
    if (alle && !s.bestanden) {
      s.bestanden = true;
      var ziel = konfig(el).oeffnet;
      if (ziel && FX.freischaltung && FX.freischaltung.oeffne) FX.freischaltung.oeffne(ziel);
    }
    anzeigen(el); melde(el);
  }

  function nochmal(el) {
    var s = z(el), i = s.aktuell;
    FX.quiz.zuruecksetzen(frageEl(el).querySelector('.q'));
    delete s.antworten[i]; delete s.richtig[i];
    anzeigen(el); melde(el);
  }

  function init(el) {
    if (el._fxQInit) return; el._fxQInit = true;
    el.querySelector('.fx-pruefen').addEventListener('click', function () { pruefen(el); });
    el.querySelector('.fx-nochmal').addEventListener('click', function () { nochmal(el); });
    el.querySelector('.fx-naechste').addEventListener('click', function () { z(el).aktuell++; anzeigen(el); });
    el.querySelector('.fx-quizpunkte').addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('button'); if (!b || b.disabled) return;
      z(el).aktuell = +b.getAttribute('data-nr'); anzeigen(el);
    });
    anzeigen(el);
  }

  FX.felder.registriere('quizserie', {
    init: init,
    laden: function (el, w) {
      init(el);
      var s = z(el); s.antworten = {}; s.richtig = {}; s.bestanden = !!w.bestanden;
      fragen(el).forEach(function (f, i) {
        var a = w.antworten && w.antworten[i]; if (!a) return;
        var q = f.querySelector('.q'); FX.quiz.setze(q, a);
        var r = FX.quiz.pruefe(q); if (!r || r.anteil === null) return;
        s.antworten[i] = a; s.richtig[i] = r.anteil >= 0.999;
      });
      s.aktuell = offeneFrage(el);
      if (s.bestanden) s.aktuell = 0;
      anzeigen(el);
    },
    wert: function (el) {
      var s = z(el); return { antworten: JSON.parse(JSON.stringify(s.antworten)), richtig: JSON.parse(JSON.stringify(s.richtig)), bestanden: s.bestanden };
    },
    leer: function (w) { return !(w && w.antworten && Object.keys(w.antworten).length); },
    protokoll: function (el, w) {
      var n = konfig(el).anzahl || fragen(el).length, r = Object.keys(w.richtig || {}).filter(function (k) { return w.richtig[k] === true; }).length;
      return [{ typ: 'text', text: w.bestanden ? 'Alle ' + n + ' Fragen richtig' : r + ' von ' + n + ' Fragen richtig – noch nicht bestanden' }];
    }
  });
});
