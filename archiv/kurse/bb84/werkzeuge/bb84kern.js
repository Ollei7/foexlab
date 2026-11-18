/* BB84: reine Logik und kleine Helfer für die Werkzeuge dieses Kurses.
   Kodierung: Bit 0 + = 0° |↑⟩ → D0 · Bit 1 + = 90° |→⟩ → D1 · Bit 0 × = −45° |↘⟩ → D0 · Bit 1 × = 45° |↗⟩ → D1. Bob: [+] = 0°, [×] = 45°. */
(function (root) {
  var FX = root.FX = root.FX || {};
  var ZUSTAND = {
    '+0': { winkel: '0°', ket: '|↑⟩', detektor: 'D0' },
    '+1': { winkel: '90°', ket: '|→⟩', detektor: 'D1' },
    '×0': { winkel: '−45°', ket: '|↘⟩', detektor: 'D0' },
    '×1': { winkel: '45°', ket: '|↗⟩', detektor: 'D1' }
  };

  function zustand(basis, bit) { var z = ZUSTAND[basis + bit]; return { winkel: z.winkel, ket: z.ket, detektor: z.detektor }; }
  function bobWinkel(basis) { return basis === '+' ? '0°' : '45°'; }
  function messung(basisAlice, bit, basisBob, zufall) {
    zufall = zufall || Math.random;
    return basisAlice === basisBob ? bit : (zufall() < 0.5 ? 0 : 1);
  }
  function wuerfel(zufall) {
    zufall = zufall || Math.random;
    var basis = zufall() < 0.5 ? '+' : '×', bit = zufall() < 0.5 ? 0 : 1;
    return { basis: basis, bit: bit };
  }

  /* Text → Großbuchstaben A–Z (Ä/Ö/Ü/ß → AE/OE/UE/SS), je 5 Bit; alles andere landet in „nicht“ */
  function zuBits(text) {
    var r = { buchstaben: [], bits: [], nicht: [] };
    String(text == null ? '' : text).split('').forEach(function (c) {
      var g = c.toUpperCase();
      if (c === 'ß') g = 'SS';
      else if (g === 'Ä') g = 'AE'; else if (g === 'Ö') g = 'OE'; else if (g === 'Ü') g = 'UE';
      if (!/^[A-Z]+$/.test(g)) { r.nicht.push(c); return; }
      g.split('').forEach(function (b) {
        var n = b.charCodeAt(0) - 65, s = n.toString(2);
        r.buchstaben.push(b); r.bits.push('00000'.slice(s.length) + s);
      });
    });
    return r;
  }
  function buchstabe(bits) {
    var n = parseInt(bits, 2);
    return isNaN(n) || n > 25 ? null : String.fromCharCode(65 + n);
  }
  function addiere(a, b) {
    var s = '', n = Math.min(a.length, b.length);
    for (var i = 0; i < n; i++) s += a.charAt(i) === b.charAt(i) ? '0' : '1';
    return s;
  }
  function gruppen(bits, n) {
    n = n || 5;
    var g = []; for (var i = 0; i < bits.length; i += n) g.push(bits.slice(i, i + n));
    return g.join(' ');
  }

  /* DOM-Helfer: h('div', {class: 'x', 'data-a': 1, onclick: fn}, kind, 'Text', …) */
  function h(tag, attr) {
    var e = root.document.createElement(tag);
    Object.keys(attr || {}).forEach(function (k) {
      var v = attr[k]; if (v === null || v === undefined || v === false) return;
      if (k.indexOf('on') === 0) e.addEventListener(k.slice(2), v);
      else if (k === 'text') e.textContent = v;
      else if (v === true) e.setAttribute(k, '');
      else e.setAttribute(k, v);
    });
    Array.prototype.slice.call(arguments, 2).forEach(function anhaengen(k) {
      if (k === null || k === undefined || k === false) return;
      if (Array.isArray(k)) k.forEach(anhaengen);
      else e.appendChild(typeof k === 'object' ? k : root.document.createTextNode(String(k)));
    });
    return e;
  }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* Rolle der Gruppe (alice | bob | eve), gespeichert unter _rolle; fx:rolle meldet jeden Wechsel */
  var rolleWert = null;
  function rolle() { return rolleWert; }
  function setzeRolle(r) {
    rolleWert = r;
    var st = FX.felder && FX.felder.speicher && FX.felder.speicher();
    if (st) st.schreibe('_rolle', r).catch(function () {});
    if (root.document) root.document.dispatchEvent(new root.CustomEvent('fx:rolle', { detail: { rolle: r } }));
  }
  function ladeRolle() {
    var st = FX.felder && FX.felder.speicher && FX.felder.speicher();
    if (!st) return Promise.resolve(rolleWert);
    return st.lies('_rolle').then(function (r) { if (r && !rolleWert) rolleWert = r; return rolleWert; }, function () { return rolleWert; });
  }

  FX.bb84 = { rolle: rolle, setzeRolle: setzeRolle, ladeRolle: ladeRolle, zufall: null, zustand: zustand, bobWinkel: bobWinkel, messung: messung, wuerfel: wuerfel, zuBits: zuBits, buchstabe: buchstabe, addiere: addiere, gruppen: gruppen, h: h, esc: esc };
})(typeof self !== 'undefined' ? self : this);
