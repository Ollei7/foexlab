/* Baustein Messtabelle: Eingabezeilen, berechnete Spalten, Diagramm mit Ausgleichsgerade, CSV. */
(function (root, factory) {
  var m = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else (root.FX = root.FX || {}).messtabelle = m;
})(typeof self !== 'undefined' ? self : this, function (root) {
  var START_ZEILEN = 3;
  function FX() { return root.FX; }
  function eingaben(k) { return k.spalten.filter(function (s) { return !s.formel; }); }

  /* Zahl im deutschen Format mit 4 gültigen Stellen */
  function fmt(x, stellen) {
    if (!isFinite(x)) return '–';
    var t = Number(x).toPrecision(stellen || 4);
    if (/e/.test(t)) { var p = t.split('e'); return p[0].replace('.', ',') + '·10^' + parseInt(p[1], 10); }
    if (t.indexOf('.') >= 0 && Math.abs(x) >= 1e4) t = String(Math.round(x));
    return t.replace('.', ',');
  }

  /* Werte einer Zeile (Rohtexte der Eingabespalten) inkl. berechneter Spalten */
  function berechne(k, zeile) {
    var v = {}, i = 0;
    Object.keys(k.konstanten || {}).forEach(function (n) { v[n] = k.konstanten[n]; });
    k.spalten.forEach(function (s) { if (!s.formel) v[s.kuerzel] = FX().formel.zahl(zeile[i++]); });
    k.spalten.forEach(function (s) {
      if (!s.formel) return;
      try { v[s.kuerzel] = FX().formel.uebersetze(s.formel)(v); } catch (e) { v[s.kuerzel] = NaN; }
    });
    return v;
  }

  function punkte(k, wert) {
    if (!k.diagramm) return [];
    return (wert.zeilen || []).map(function (z) { var v = berechne(k, z); return [v[k.diagramm.x], v[k.diagramm.y]]; })
      .filter(function (p) { return isFinite(p[0]) && isFinite(p[1]); });
  }

  function kopf(s) { return s.einheit ? s.name + ' [' + s.einheit + ']' : s.name; }
  function spalte(k, kuerzel) { return k.spalten.filter(function (s) { return s.kuerzel === kuerzel; })[0] || { name: kuerzel, einheit: '' }; }

  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function achsenzahl(v) { return String(+Number(v).toPrecision(3)).replace('.', ','); }

  /* SVG-Diagramm (480 × 300), Achsen ab 0 bzw. Minimum */
  function svgDiagramm(p, g, achsen) {
    var W = 480, H = 300, L = 58, R = 16, T = 14, B = 46;
    var xs = p.map(function (q) { return q[0]; }), ys = p.map(function (q) { return q[1]; });
    var x0 = Math.min(0, Math.min.apply(null, xs.concat([0]))), x1 = Math.max.apply(null, xs.concat([1]));
    var y0 = Math.min(0, Math.min.apply(null, ys.concat([0]))), y1 = Math.max.apply(null, ys.concat([1]));
    x1 += (x1 - x0) * 0.05; y1 += (y1 - y0) * 0.08;
    function X(x) { return L + (x - x0) / (x1 - x0) * (W - L - R); }
    function Y(y) { return H - B - (y - y0) / (y1 - y0) * (H - T - B); }
    function ticks(a, b) {
      var schritt = Math.pow(10, Math.floor(Math.log(b - a) / Math.LN10)), n = (b - a) / schritt;
      if (n < 3) schritt /= 4; else if (n < 6) schritt /= 2;
      var t = [], v = Math.ceil(a / schritt) * schritt;
      for (; v <= b + 1e-12; v += schritt) t.push(Math.abs(v) < schritt * 1e-9 ? 0 : v);
      return t;
    }
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="100%" role="img" aria-label="Diagramm" font-family="Helvetica, Arial, sans-serif" font-size="12">';
    s += '<rect width="' + W + '" height="' + H + '" fill="#fff"/>';
    ticks(x0, x1).forEach(function (v) { s += '<line x1="' + X(v) + '" x2="' + X(v) + '" y1="' + T + '" y2="' + (H - B) + '" stroke="#E6E8EF"/><text x="' + X(v) + '" y="' + (H - B + 16) + '" text-anchor="middle" fill="#333">' + achsenzahl(v) + '</text>'; });
    ticks(y0, y1).forEach(function (v) { s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="#E6E8EF"/><text x="' + (L - 6) + '" y="' + (Y(v) + 4) + '" text-anchor="end" fill="#333">' + achsenzahl(v) + '</text>'; });
    s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(0) + '" y2="' + Y(0) + '" stroke="#33416E"/><line x1="' + X(0) + '" x2="' + X(0) + '" y1="' + T + '" y2="' + (H - B) + '" stroke="#33416E"/>';
    s += '<text x="' + ((L + W - R) / 2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="#33416E">' + esc(achsen.x) + '</text>';
    s += '<text transform="translate(14 ' + ((T + H - B) / 2) + ') rotate(-90)" text-anchor="middle" fill="#33416E">' + esc(achsen.y) + '</text>';
    if (g) s += '<line x1="' + X(x0) + '" y1="' + Y(g.m * x0 + g.b) + '" x2="' + X(x1) + '" y2="' + Y(g.m * x1 + g.b) + '" stroke="#F58411" stroke-width="2"/>';
    p.forEach(function (q) { s += '<circle cx="' + X(q[0]) + '" cy="' + Y(q[1]) + '" r="4" fill="#3F9AD6" stroke="#33416E"/>'; });
    return s + '</svg>';
  }

  function ausgleichText(k, g, n) {
    if (!k.diagramm || k.diagramm.ausgleich === 'keiner') return '';
    if (!g) return n < 2 ? 'Für eine Ausgleichsgerade braucht ihr mindestens 2 Messpunkte.' : 'Keine Ausgleichsgerade möglich (alle x-Werte gleich?).';
    function fehler(s, wert) { return isFinite(s) && s > Math.abs(wert || 1) * 1e-9 ? ' ± ' + fmt(s, 2) : ''; }
    var t = 'Ausgleichsgerade: m = ' + fmt(g.m) + fehler(g.sm, g.m);
    if (k.diagramm.ausgleich === 'linear') t += ', b = ' + fmt(g.b) + fehler(g.sb, g.m);
    return t;
  }

  function csv(k, wert) {
    var zeilen = [k.spalten.map(kopf).join(';')];
    (wert.zeilen || []).forEach(function (z) {
      if (!z.some(function (c) { return String(c || '').trim(); })) return;
      var v = berechne(k, z), i = 0;
      zeilen.push(k.spalten.map(function (s) {
        if (!s.formel) return String(z[i++] || '').trim().replace('.', ',');
        return isFinite(v[s.kuerzel]) ? String(v[s.kuerzel]).replace('.', ',') : '';
      }).join(';'));
    });
    return zeilen.join('\n') + '\n';
  }

  /* ------------------------------------------------------------ DOM */
  function konfig(el) { if (!el._fxK) el._fxK = JSON.parse(el.getAttribute('data-fx-konfig')); return el._fxK; }

  function zeileHtml(k) {
    return '<tr>' + k.spalten.map(function (s) {
      return s.formel ? '<td class="fx-berechnet" data-k="' + esc(s.kuerzel) + '">–</td>'
        : '<td><input type="text" inputmode="decimal" autocomplete="off" aria-label="' + esc(kopf(s)) + '"></td>';
    }).join('') + '</tr>';
  }

  function aufbauen(el, anzahl) {
    var k = konfig(el), d = el.ownerDocument;
    el.querySelector('thead').innerHTML = '<tr>' + k.spalten.map(function (s) { return '<th>' + esc(s.name) + (s.einheit ? '<small> [' + esc(s.einheit) + ']</small>' : '') + '</th>'; }).join('') + '</tr>';
    var tb = el.querySelector('tbody'); tb.innerHTML = '';
    for (var i = 0; i < anzahl; i++) tb.insertAdjacentHTML('beforeend', zeileHtml(k));
    void d;
  }

  function lies(el) {
    return { zeilen: Array.prototype.map.call(el.querySelectorAll('tbody tr'), function (tr) {
      return Array.prototype.map.call(tr.querySelectorAll('input'), function (i) { return i.value; });
    }) };
  }

  function aktualisiere(el) {
    var k = konfig(el), w = lies(el);
    Array.prototype.forEach.call(el.querySelectorAll('tbody tr'), function (tr, i) {
      var v = berechne(k, w.zeilen[i]);
      Array.prototype.forEach.call(tr.querySelectorAll('.fx-berechnet'), function (td) { td.textContent = fmt(v[td.getAttribute('data-k')]); });
    });
    if (!k.diagramm) return;
    var p = punkte(k, w), g = k.diagramm.ausgleich === 'keiner' ? null : FX().ausgleich.gerade(p, k.diagramm.ausgleich);
    el.querySelector('.fx-diagramm').innerHTML = p.length ? svgDiagramm(p, g, { x: kopf(spalte(k, k.diagramm.x)), y: kopf(spalte(k, k.diagramm.y)) }) : '';
    el.querySelector('.fx-ausgleich').textContent = ausgleichText(k, g, p.length);
  }

  function dateiname(el) { return (el.getAttribute('data-fx-id') || 'messung').split('/').pop() + '.csv'; }

  function init(el) {
    aufbauen(el, START_ZEILEN);
    el.querySelector('.fx-zeile-plus').addEventListener('click', function () {
      el.querySelector('tbody').insertAdjacentHTML('beforeend', zeileHtml(konfig(el)));
      el.dispatchEvent(new el.ownerDocument.defaultView.Event('change'));
    });
    el.querySelector('.fx-zeile-minus').addEventListener('click', function () {
      var tr = el.querySelector('tbody tr:last-child'); if (!tr) return;
      var voll = Array.prototype.some.call(tr.querySelectorAll('input'), function (i) { return i.value.trim(); });
      if (voll && !FX().felder.frage('Letzte Zeile mit Werten löschen?')) return;
      tr.remove(); aktualisiere(el);
      el.dispatchEvent(new el.ownerDocument.defaultView.Event('change'));
    });
    var c = el.querySelector('.fx-csv');
    if (c) c.addEventListener('click', function () {
      var win = el.ownerDocument.defaultView;
      var blob = new win.Blob(['﻿' + csv(konfig(el), lies(el))], { type: 'text/csv;charset=utf-8' });
      var a = el.ownerDocument.createElement('a');
      a.href = win.URL.createObjectURL(blob); a.download = dateiname(el);
      el.ownerDocument.body.appendChild(a); a.click(); a.remove();
    });
    el.addEventListener('input', function () { aktualisiere(el); });
    aktualisiere(el);
  }

  var api = { berechne: berechne, punkte: punkte, csv: csv, svgDiagramm: svgDiagramm, fmt: fmt, kopf: kopf, spalte: spalte, ausgleichText: ausgleichText, eingaben: eingaben };

  if (root.FX && root.FX.felder) root.FX.felder.registriere('tabelle', {
    init: init,
    laden: function (el, w) {
      var z = (w && w.zeilen) || [];
      aufbauen(el, Math.max(z.length, 1));
      Array.prototype.forEach.call(el.querySelectorAll('tbody tr'), function (tr, i) {
        Array.prototype.forEach.call(tr.querySelectorAll('input'), function (inp, j) { inp.value = (z[i] && z[i][j]) || ''; });
      });
      aktualisiere(el);
    },
    wert: lies,
    leer: function (w) { return !(w && w.zeilen || []).some(function (z) { return z.some(function (c) { return String(c || '').trim(); }); }); }
  });
  return api;
});
