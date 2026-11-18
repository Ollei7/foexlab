/* Werkzeug „testbits“ (Kapitel 3, Aufgabe 4): erst die Schätzung, dann wird der Regler (0–100) frei.
   P(Eve entdeckt) = 1 − 0,75ⁿ mit Balken, dazu der Zufallsversuch „Eve 100-mal lauschen lassen“ (jedes verglichene Bit
   fällt mit 25 % als Fehler auf). Wert: {schaetzung, n, versuch:{n, entdeckt, von}|null}. */
(function (root) {
  var FX = root.FX, B = FX.bb84, h = B.h;

  function fmt(x) { return (Math.round(x * 10) / 10).toFixed(1).replace('.', ',') + ' %'; }
  function p(n) { var un = Math.pow(0.75, n); return { unentdeckt: un * 100, entdeckt: (1 - un) * 100 }; }
  function lauf(n, zufall) {
    var z = zufall || Math.random, entdeckt = 0;
    for (var i = 0; i < 100; i++) { var fehler = false; for (var j = 0; j < n; j++) if (z() < 0.25) { fehler = true; break; } if (fehler) entdeckt++; }
    return { n: n, entdeckt: entdeckt, von: 100 };
  }
  function ergebnisText(v) { return 'Bei ' + v.n + ' Testbits wäre Eve in ' + v.entdeckt + ' von ' + v.von + ' Fällen aufgefallen.'; }
  function fuelle(w) {
    w = w || {};
    var n = Math.max(0, Math.min(100, parseInt(w.n, 10) || 0)), v = w.versuch && w.versuch.n >= 1 ? { n: +w.versuch.n, entdeckt: +w.versuch.entdeckt || 0, von: 100 } : null;
    return { schaetzung: typeof w.schaetzung === 'string' ? w.schaetzung : '', n: n, versuch: v };
  }
  function schaetzungGueltig(t) { var x = parseInt(String(t).trim(), 10); return !isNaN(x) && x > 0; }

  function init(el) {
    var flaeche = el.querySelector('.fx-werkzeug-flaeche'), win = el.ownerDocument.defaultView, s = fuelle(null);
    el._tbWert = function () { return JSON.parse(JSON.stringify(s)); };
    el._tbLaden = function (w) { s = fuelle(w); zeige(); };
    function melde() { el.dispatchEvent(new win.Event('change', { bubbles: true })); }

    var schaetz = h('input', { type: 'number', 'class': 'fx-tb-schaetzung', min: 1, placeholder: 'z. B. 10', inputmode: 'numeric' });
    var hinweis = h('p', { 'class': 'fx-tb-schaetzunghinweis', hidden: true }, 'Schätzung gespeichert. Jetzt kannst du den Regler unten ausprobieren.');
    var regler = h('input', { type: 'range', 'class': 'fx-tb-regler', min: 0, max: 100, step: 1, value: 0, 'aria-label': 'Anzahl Testbits' });
    var nAnz = h('span', { 'class': 'fx-tb-n' }, '0'), sperre = h('p', { 'class': 'fx-tb-sperre' }, '🔒 Erst Schätzung eingeben, dann wird der Regler freigeschaltet.');
    var pAnz = h('div', { 'class': 'fx-tb-p', role: 'status' }), balken = h('div', { 'class': 'fx-tb-balken' }, h('i', {})), erkl = h('p', { 'class': 'fx-tb-erklaerung' });
    var ergebnis = h('p', { 'class': 'fx-tb-ergebnis', role: 'status' });

    function zeige() {
      var ok = schaetzungGueltig(s.schaetzung);
      schaetz.value = s.schaetzung; hinweis.hidden = !ok; regler.disabled = !ok; sperre.hidden = ok; regler.value = String(s.n); nAnz.textContent = String(s.n);
      if (s.n === 0) { pAnz.textContent = ''; balken.firstChild.style.width = '0%'; erkl.textContent = ''; }
      else {
        var r = p(s.n); pAnz.textContent = fmt(r.entdeckt); balken.firstChild.style.width = Math.round(r.entdeckt) + '%';
        erkl.textContent = 'Bei ' + s.n + ' Testbits: P(Eve unentdeckt) = 0,75^' + s.n + ' ≈ ' + fmt(r.unentdeckt) + ' → P(Eve entdeckt) ≈ ' + fmt(r.entdeckt);
      }
      ergebnis.textContent = s.versuch ? ergebnisText(s.versuch) : '';
    }
    ['input', 'change'].forEach(function (t) {
      schaetz.addEventListener(t, function () { s.schaetzung = schaetz.value; zeige(); schaetz.value = s.schaetzung; melde(); });
      regler.addEventListener(t, function () { if (regler.disabled) return; s.n = parseInt(regler.value, 10) || 0; zeige(); melde(); });
    });
    function versuch(n) {
      if (n < 1) { ergebnis.textContent = 'Stellt zuerst den Regler auf mindestens 1 Testbit.'; return; }
      s.versuch = lauf(n, B.zufall); zeige(); melde();
    }
    var knoepfe = h('div', { 'class': 'fx-knoepfe fx-tb-versuch' }, [4, 10, 50, 100].map(function (n) { return h('button', { type: 'button', 'class': 'fx-knopf', onclick: function () { versuch(n); } }, String(n)); }),
      h('button', { type: 'button', 'class': 'fx-knopf', onclick: function () { versuch(s.n); } }, 'Reglerwert'));

    flaeche.appendChild(h('div', { 'class': 'fx-tb-block' }, h('div', { 'class': 'fx-tb-etikett' }, 'Eure Schätzung (Anzahl Bits)'), h('div', {}, schaetz, ' Schlüsselbits'), hinweis));
    flaeche.appendChild(h('div', { 'class': 'fx-tb-block' }, h('div', { 'class': 'fx-tb-etikett' }, 'Anzahl Testbits auswählen'), h('div', { 'class': 'fx-tb-reglerzeile' }, regler, ' ', nAnz, ' Testbits'), sperre,
      h('div', {}, 'Wahrscheinlichkeit, Eve zu erkennen (bei 25 % Fehlerrate):'), pAnz, balken, erkl));
    flaeche.appendChild(h('div', { 'class': 'fx-tb-block' }, h('h4', {}, 'Eve 100-mal lauschen lassen'), h('p', {}, 'Klickt auf eine Schaltfläche, um zu sehen, wie oft Eve dabei aufgefallen wäre.'), knoepfe, ergebnis));
    zeige();
  }

  FX.felder.registriere('testbits', {
    init: init,
    laden: function (el, w) { if (!el._tbLaden) init(el); el._tbLaden(w); },
    wert: function (el) { if (!el._tbWert) init(el); return el._tbWert(); },
    leer: function (w) { var s = fuelle(w); return !s.schaetzung.trim() && !s.n && !s.versuch; },
    protokoll: function (el, w) {
      var s = fuelle(w), t = 'Schätzung: ' + (s.schaetzung.trim() ? s.schaetzung.trim() + ' Schlüsselbits' : '–');
      if (s.n) t += ' · Testbits n = ' + s.n + ' · P(Eve entdeckt) ≈ ' + fmt(p(s.n).entdeckt);
      if (s.versuch) t += ' · Zufallsversuch: ' + ergebnisText(s.versuch);
      return [{ typ: 'text', text: t }];
    }
  });
})(typeof self !== 'undefined' ? self : this);
