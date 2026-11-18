/* Selbstkontroll-Fragen: prüfen, Antwort lesen/setzen, zurücksetzen. */
(function (root, factory) {
  var m = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.FX = root.FX || {}).quiz = m;
})(typeof self !== 'undefined' ? self : this, function (root) {
  function $(s, r) { return Array.prototype.slice.call(r.querySelectorAll(s)); }
  function norm(s) { return (s || '').trim().replace(/\s+/g, ' '); }
  function num(s) {
    s = (s || '').trim().replace(',', '.').replace(/\s+/g, '');
    var m = s.match(/^[-+]?\d*\.?\d+(?:[eE][-+]?\d+)?/);
    return m ? parseFloat(m[0]) : NaN;
  }
  function wild(p, s, cs) {
    var re = new RegExp('^' + p.split('*').map(function (x) { return x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('.*') + '$', cs ? '' : 'i');
    return re.test(s);
  }
  function setRes(q, frac, txt) {
    var r = q.querySelector('.res'); if (!r) return;
    r.className = 'res ' + (frac >= .999 ? 'ok' : frac > 0 ? 'part' : 'bad');
    r.textContent = txt || (frac >= .999 ? 'Richtig' : frac > 0 ? 'Teilweise richtig' : 'Nicht richtig');
    $('.ofb', q).forEach(function (o) { o.hidden = !o.classList.contains(frac >= .999 ? 'ok' : frac > 0 ? 'part' : 'bad'); });
    var g = q.querySelector('.gfb'); if (g) g.hidden = false;
  }

  /* Antwort so, wie sie gespeichert wird */
  function antwort(q) {
    var t = q.getAttribute('data-type');
    if (t === 'mc') return $('input', q).reduce(function (a, i, k) { if (i.checked) a.push(k); return a; }, []);
    if (t === 'gaps') return $('select.gap', q).map(function (s) { return s.value; });
    if (t === 'short' || t === 'num') return q.querySelector('input').value;
    return null;
  }

  /* Werte wurden von außen gesetzt (laden, zurücksetzen, Lösung): Darstellungen wie ziehen.js gleichen sich an */
  function gesetzt(q) {
    var w = q.ownerDocument.defaultView;
    if (w && w.CustomEvent) q.dispatchEvent(new w.CustomEvent('fx:gesetzt', { bubbles: true }));
  }

  function setze(q, a) {
    var t = q.getAttribute('data-type');
    if (a == null) return;
    if (t === 'mc') $('input', q).forEach(function (i, k) { i.checked = a.indexOf(k) >= 0; });
    else if (t === 'gaps') $('select.gap', q).forEach(function (s, k) { s.value = a[k] || ''; });
    else if (t === 'short' || t === 'num') q.querySelector('input').value = a;
    gesetzt(q);
  }

  function pruefe(q) {
    var t = q.getAttribute('data-type'), f = 0, i, as;
    if (t === 'mc') {
      var sum = 0, sel = 0;
      $('input', q).forEach(function (i) {
        var fr = parseFloat(i.getAttribute('data-f')), li = i.closest('li'), fb = li.querySelector('.afb');
        li.classList.remove('right', 'wrong'); if (fb) fb.hidden = true;
        if (i.checked) { sel++; sum += fr; li.classList.add(fr > 0 ? 'right' : 'wrong'); if (fb) fb.hidden = false; }
      });
      f = Math.max(0, Math.min(1, sum));
      if (!sel) { setRes(q, 0, 'Bitte eine Antwort wählen.'); return { anteil: null, antwort: antwort(q) }; }
      setRes(q, f);
    } else if (t === 'gaps') {
      var sels = $('select.gap', q), ok = 0;
      sels.forEach(function (s) {
        var good = norm(s.value) === norm(s.getAttribute('data-correct'));
        s.classList.remove('ok', 'bad'); if (s.value) s.classList.add(good ? 'ok' : 'bad'); if (good) ok++;
      });
      f = sels.length ? ok / sels.length : 0;
      setRes(q, f, f >= .999 ? 'Richtig' : ok + ' von ' + sels.length + ' richtig');
    } else if (t === 'short') {
      i = q.querySelector('input'); var v = norm(i.value), cs = i.dataset.usecase === '1'; as = JSON.parse(i.dataset.answers);
      as.forEach(function (a) { if (wild(norm(a[0]), v, cs)) f = Math.max(f, a[1]); });
      i.classList.remove('ok', 'bad'); i.classList.add(f >= .999 ? 'ok' : 'bad'); setRes(q, f);
    } else if (t === 'num') {
      i = q.querySelector('input'); var x = num(i.value); as = JSON.parse(i.dataset.answers);
      as.forEach(function (a) {
        if (a[0] === '*') { f = Math.max(f, a[2]); return; }
        var c = num(a[0]);
        if (!isNaN(x) && Math.abs(x - c) <= Math.max(a[1], Math.abs(c) * 1e-9)) f = Math.max(f, a[2]);
      });
      i.classList.remove('ok', 'bad'); i.classList.add(f >= .999 ? 'ok' : 'bad'); setRes(q, f);
    } else {
      return null;
    }
    return { anteil: f, antwort: antwort(q) };
  }

  function zuruecksetzen(q) {
    $('input[type=radio],input[type=checkbox]', q).forEach(function (i) { i.checked = false; });
    $('input[type=text],input:not([type])', q).forEach(function (i) { i.value = ''; i.classList.remove('ok', 'bad'); });
    $('select', q).forEach(function (s) { s.value = ''; s.classList.remove('ok', 'bad'); });
    $('li', q).forEach(function (l) { l.classList.remove('right', 'wrong'); });
    $('.afb,.ofb,.gfb', q).forEach(function (e) { e.hidden = true; });
    var r = q.querySelector('.res'); if (r) { r.textContent = ''; r.className = 'res'; }
    gesetzt(q);
  }

  return { gesetzt: gesetzt, pruefe: pruefe, setze: setze, antwort: antwort, zuruecksetzen: zuruecksetzen, zahl: num };
});

/* Als Feldart "quiz" registrieren (falls felder.js geladen ist) */
(function (root) {
  var FX = root.FX;
  if (!FX || !FX.felder || !FX.quiz) return;
  var Q = FX.quiz;
  function q(el) { return el.querySelector('.q'); }
  function kontrolle(el) { return el.hasAttribute('data-fx-kontrolle'); }
  function maxVersuche(el) { var n = parseInt(el.getAttribute('data-fx-versuche'), 10); return n > 0 ? n : 0; }
  function sperreEingaben(el) {
    Array.prototype.forEach.call(q(el).querySelectorAll('input,select,button.check'), function (e) { e.disabled = true; });
    var r = q(el).querySelector('.reset'); if (r) r.hidden = true;
    Q.gesetzt(q(el));   // gesperrt: Darstellungen (ziehen.js) nachziehen
  }
  /* Nach n Fehlversuchen: richtige Antwort ankreuzen bzw. einstellen und markieren, Hinweistext zeigen */
  function gibAuf(el) {
    el.dataset.aufgegeben = '1';
    Array.prototype.forEach.call(q(el).querySelectorAll('input'), function (i) {
      var richtig = parseFloat(i.getAttribute('data-f')) > 0, li = i.closest('li');
      i.checked = richtig;
      if (li) { li.classList.remove('right', 'wrong'); if (richtig) li.classList.add('right'); }
    });
    Array.prototype.forEach.call(q(el).querySelectorAll('select.gap'), function (s) {   // Lücken/Zuordnungen: jede Liste auf die richtige Auswahl
      s.value = s.getAttribute('data-correct'); s.classList.remove('ok', 'bad'); s.classList.add('ok');
    });
    var t = q(el).querySelector('.fx-nach-versuchen'); if (t) t.hidden = false;
    var r = q(el).querySelector('.res'); if (r) { r.className = 'res fx-aufgeloest'; r.textContent = 'Lösung angezeigt'; }   // neutral statt „Nicht richtig“
    Array.prototype.forEach.call(q(el).querySelectorAll('.ofb,.afb'), function (o) { o.hidden = true; });
    sperreEingaben(el);
  }
  FX.felder.registriere('quiz', {
    init: function (el) { if (kontrolle(el)) { var r = q(el).querySelector('.reset'); if (r) r.hidden = true; } },
    laden: function (el, w) {
      Q.setze(q(el), w.antwort);
      var aufgeloest = kontrolle(el) && w.aufgegeben;   // gespeichert ist die markierte Lösung: nicht neu prüfen, sonst stünde dort „Richtig“
      if (w.anteil !== null && w.anteil !== undefined) { if (!aufgeloest) Q.pruefe(q(el)); el.dataset.anteil = w.anteil; }
      if (!kontrolle(el)) return;
      if (w.versuche) el.dataset.versuche = w.versuche;
      if (w.aufgegeben) gibAuf(el);
      else if (w.anteil >= .999) sperreEingaben(el);
    },
    wert: function (el) {
      var a = el.dataset.anteil;
      var w = { antwort: Q.antwort(q(el)), anteil: a === undefined || a === '' ? null : +a };
      if (kontrolle(el)) {
        w.versuche = +(el.dataset.versuche || 0); w.aufgegeben = !!el.dataset.aufgegeben; w.kontrolle = true;
      }
      return w;
    },
    beiEingabe: function (el) { delete el.dataset.anteil; },
    sperrhinweis: 'Prüft zuerst eure Antwort.',
    pruefen: function (el) {
      if (kontrolle(el) && !el.dataset.aufgegeben && q(el).getAttribute('data-type') === 'gaps') {   // unvollständig: weder zählen noch speichern
        var leer = Array.prototype.some.call(q(el).querySelectorAll('select.gap'), function (s) { return !s.value; });
        if (leer) {
          var rs = q(el).querySelector('.res'); if (rs) { rs.className = 'res'; rs.textContent = 'Bitte zuerst alle Felder ausfüllen.'; }
          delete el.dataset.anteil; return;
        }
      }
      var r = Q.pruefe(q(el));
      if (r && r.anteil !== null) el.dataset.anteil = r.anteil; else delete el.dataset.anteil;
      if (!kontrolle(el) || !r || r.anteil === null || el.dataset.aufgegeben) return;
      if (r.anteil >= .999) { sperreEingaben(el); return; }
      el.dataset.versuche = (+(el.dataset.versuche || 0)) + 1;
      var n = maxVersuche(el);
      if (n && +el.dataset.versuche >= n) gibAuf(el);
    },
    leer: function (w) {
      var a = w && w.antwort;
      if (w && w.kontrolle) return !(w.anteil >= .999 || w.aufgegeben);
      if (a === null || a === undefined) return true;
      if (typeof a === 'string') return !a.trim();
      return !a.some(function (x) { return x !== '' && x !== null; });
    }
  });
})(typeof self !== 'undefined' ? self : this);
