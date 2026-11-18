/* Werkzeuge „rollenwahl“ und „handtabelle“ (Kapitel 3, Aufgabe 1).
   rollenwahl: Gruppe Alice, Bob (und in Aufgabe 3 Eve); Wahl unter _rolle, Meldung fx:rolle.
   handtabelle: je nach Rolle Würfelreferenz und 15 Runden zum Eintragen, „Basis gleich?“ per Tipp, Rohschlüssel und ein Buchstabe
   ver- bzw. entschlüsselt. Keine Prüfung; Alice und Bob behalten ihre Daten, auch wenn die Rolle wechselt. */
(function (root) {
  var FX = root.FX, B = FX.bb84, h = B.h;
  var N = 15;

  function wert0() {
    var a = [], b = [], v = [];
    for (var i = 0; i < N; i++) { a.push({ basis: '', bit: '', winkel: '', zustand: '' }); b.push({ basis: '', winkel: '', bit: '' }); v.push(null); }
    return { alice: { runden: a, schluessel: '', buchstabe: '', verschluesselt: '' }, bob: { runden: b, schluessel: '', empfangen: '', entschluesselt: '', buchstabe: '' }, vergleich: v };
  }
  function kopie(x) { return JSON.parse(JSON.stringify(x)); }
  function fuelle(w) {
    var s = wert0(); w = w || {};
    ['alice', 'bob'].forEach(function (r) {
      var q = w[r] || {};
      Object.keys(s[r]).forEach(function (k) { if (k !== 'runden' && typeof q[k] === 'string') s[r][k] = q[k]; });
      (q.runden || []).slice(0, N).forEach(function (x, i) { Object.keys(s[r].runden[i]).forEach(function (k) { if (x && typeof x[k] === 'string') s[r].runden[i][k] = x[k]; }); });
    });
    (w.vergleich || []).slice(0, N).forEach(function (x, i) { s.vergleich[i] = x === true || x === false ? x : null; });
    return s;
  }
  function belegt(r, s) {
    var q = s[r];
    return q.runden.some(function (x) { return Object.keys(x).some(function (k) { return x[k] !== ''; }); }) ||
      Object.keys(q).some(function (k) { return k !== 'runden' && q[k] !== ''; });
  }

  /* ---------------------------------------------------------------- Rollenwahl */
  function rollenwahl(el) {
    var konfig = {}; try { konfig = JSON.parse(el.getAttribute('data-fx-konfig')) || {}; } catch (e) { /* leer */ }
    var flaeche = el.querySelector('.fx-werkzeug-flaeche'), knoepfe = [['alice', 'Gruppe Alice'], ['bob', 'Gruppe Bob']];
    if (konfig.eve) knoepfe.push(['eve', 'Gruppe Eve']);
    var bs = knoepfe.map(function (k) { return h('button', { type: 'button', 'class': 'fx-knopf', 'data-rolle': k[0], 'aria-pressed': 'false', onclick: function () { B.setzeRolle(k[0]); } }, k[1]); });
    function zeige() { bs.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-rolle') === B.rolle() ? 'true' : 'false'); }); }
    flaeche.appendChild(h('div', { 'class': 'fx-knoepfe' }, bs));
    root.document.addEventListener('fx:rolle', zeige);
    B.ladeRolle().then(function () { zeige(); if (B.rolle()) root.document.dispatchEvent(new root.CustomEvent('fx:rolle', { detail: { rolle: B.rolle() } })); });
    zeige();
  }

  /* ---------------------------------------------------------------- Handtabelle */
  function auswahl(opts, wert, klasse, onchange) {
    var s = h('select', { 'class': klasse, onchange: function () { onchange(s.value); } }, opts.map(function (o) { return h('option', { value: o }, o || '–'); }));
    s.value = wert; return s;
  }
  function eingabe(wert, klasse, onchange, extra) {
    var i = h('input', Object.assign({ type: 'text', 'class': klasse, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' }, extra || {}));
    i.value = wert; ['input', 'change'].forEach(function (t) { i.addEventListener(t, function () { onchange(i.value); }); }); return i;
  }

  function handtabelle(el) {
    var flaeche = el.querySelector('.fx-werkzeug-flaeche'), s = fuelle(null), win = el.ownerDocument.defaultView;
    el._htWert = function () { return kopie(s); };
    el._htLaden = function (w) { s = fuelle(w); render(); };
    function melde() { el.dispatchEvent(new win.Event('change', { bubbles: true })); }

    function ref(rolle) {
      var z = rolle === 'alice' ? [['+', '0', '0°', '↑'], ['+', '1', '90°', '→'], ['×', '0', '−45°', '↘'], ['×', '1', '+45°', '↗']] : [['+', '0°', '↑ oder →'], ['×', '45°', '↘ oder ↗']];
      var kopf = rolle === 'alice' ? ['Gewürfelte Basis', 'Gewürfeltes Bit', 'Polarisationsdreher', 'Zustand'] : ['Würfel', 'Polarisationsdreher', 'Mögliche gemessene Zustände'];
      return h('div', {}, h('h4', {}, 'SCHRITT 0: Würfel-Referenz zum Nachgucken'),
        h('table', { 'class': 'fx-ht-ref' }, h('thead', {}, h('tr', {}, kopf.map(function (k) { return h('th', {}, k); }))), h('tbody', {}, z.map(function (r) { return h('tr', {}, r.map(function (c) { return h('td', {}, c); })); }))));
    }
    function gleichKnopf(i) {
      var b = h('button', { type: 'button', 'class': 'fx-knopf fx-ht-gleich', 'aria-label': 'Basis gleich?' });
      function t() { b.textContent = s.vergleich[i] === true ? '✓' : s.vergleich[i] === false ? '✗' : '–'; b.className = 'fx-knopf fx-ht-gleich' + (s.vergleich[i] === true ? ' fx-ok' : s.vergleich[i] === false ? ' fx-fehler' : ''); }
      b.addEventListener('click', function () { s.vergleich[i] = s.vergleich[i] === null ? true : s.vergleich[i] === true ? false : null; t(); melde(); });
      t(); return b;
    }
    function runden(rolle) {
      var q = s[rolle], alice = rolle === 'alice';
      var kopf = alice ? ['Runde', 'Gewürfelte Basis', 'Gewürfeltes Bit', 'Polarisationsdreher', 'Zustand', 'Basis gleich?'] : ['Runde', 'Gewürfelte Basis', 'Polarisationsdreher', 'Gemessenes Bit (D0 = 0, D1 = 1)', 'Basis gleich?'];
      var zeilen = q.runden.map(function (r, i) {
        var zellen = [h('td', {}, String(i + 1)), h('td', {}, auswahl(['', '+', '×'], r.basis, 'fx-ht-basis', function (v) { r.basis = v; }))];
        if (alice) zellen.push(h('td', {}, auswahl(['', '0', '1'], r.bit, 'fx-ht-bit', function (v) { r.bit = v; })), h('td', {}, eingabe(r.winkel, 'fx-ht-winkel', function (v) { r.winkel = v; }, { size: 5 })), h('td', {}, eingabe(r.zustand, 'fx-ht-zustand', function (v) { r.zustand = v; }, { size: 4 })));
        else zellen.push(h('td', {}, eingabe(r.winkel, 'fx-ht-winkel', function (v) { r.winkel = v; }, { size: 5 })), h('td', {}, auswahl(['', '0', '1'], r.bit, 'fx-ht-bit', function (v) { r.bit = v; })));
        zellen.push(h('td', {}, gleichKnopf(i)));
        return h('tr', { 'class': 'fx-ht-runde', 'data-nr': i }, zellen);
      });
      return h('div', { 'class': 'fx-tab-wrap' }, h('table', { 'class': 'fx-ht-tabelle' }, h('thead', {}, h('tr', {}, kopf.map(function (k) { return h('th', {}, k); }))), h('tbody', {}, zeilen)));
    }
    function feld(titel, wertName, klasse, rolle, extra) {
      var q = s[rolle];
      return h('label', { 'class': 'fx-ht-feld' }, h('span', {}, titel), eingabe(q[wertName], klasse, function (v) { q[wertName] = v; }, extra));
    }
    function addition() {
      return h('table', { 'class': 'fx-ht-add' }, h('caption', {}, 'Binäraddition:'), h('tbody', {}, h('tr', {}, h('td', {}, '0 + 0 = ', h('strong', {}, '0')), h('td', {}, '0 + 1 = ', h('strong', {}, '1'))), h('tr', {}, h('td', {}, '1 + 0 = ', h('strong', {}, '1')), h('td', {}, '1 + 1 = ', h('strong', {}, '0')))));
    }
    var TEXT = {
      alice: [['SCHRITT 1: Würfeln & Einstellen', 'Würfelt als erstes sowohl die Basis als auch das Bit, welches übertragen werden soll. Notiert was auf den Würfeln stand und stellt entsprechend den Polarisationsdreher ein.'],
        ['SCHRITT 2: Senden & Basisvergleich', ['Fragt nun die Gruppe Bob, ob sie mit ihrer Einstellung fertig sind. Sendet durch Drücken des roten Knopfes die Information ab.', ['Sprecht nun offen darüber, welche Basis ihr gewählt habt aber ', h('strong', {}, 'NICHT'), ' über das Bit. Stimmen eure Basen überein, tragt ihr jeweils das Bit bei euch in den Rohschlüssel ein. Stimmen sie nicht überein, wird das Bit verworfen und nicht eingetragen.'], '↺ Wiederholt Schritt 1 und 2, bis euer Rohschlüssel 5 Bits lang ist.']],
        ['SCHRITT 3: Buchstaben verschlüsseln', [['Sucht euch nun einen Buchstaben aus, der der Gruppe von Bob ', h('strong', {}, 'nicht'), ' verraten wird. Schaut in die Codetabelle und wandelt den Buchstaben in Binärcode um. Tragt das Ergebnis in die erste Zeile ein.'], 'Verschlüsselt mithilfe des erstellten Schlüssels per Binäraddition eure Bitabfolge. Lest nun laut eure verschlüsselten 5 Bits vor, sodass die Gruppe Bob diese sich notieren kann.']]],
      bob: [['SCHRITT 1 – Würfeln & Messen', 'Würfelt als erstes die Basis, in der die folgende Messung durchgeführt werden soll. Stellt entsprechend den Polarisationsdreher ein. Fragt nun die Gruppe Alice, ob sie mit ihrer Einstellung fertig ist. Alice wird nun die Information absenden, schaut genau welche Detektoren anschlagen, und notiert das gemessene Bit.'],
        ['SCHRITT 2 – Basisvergleich & Rohschlüssel', [['Sprecht nun offen darüber, welche Basis ihr gewählt habt aber ', h('strong', {}, 'NICHT'), ' über das Bit. Stimmen eure Basen überein, tragt ihr jeweils das Bit bei euch in den Rohschlüssel ein. Stimmen sie nicht überein, wird das Bit verworfen und nicht eingetragen.'], '↺ Wiederholt Schritt 1 und 2, bis euer Rohschlüssel 5 Bits lang ist.']],
        ['SCHRITT 3 – Nachricht entschlüsseln', ['Alice liest euch nun die verschlüsselten 5 Bits vor. Notiert diese in der ersten Zeile. Tragt darunter euren Schlüssel ein und verknüpft die Bits per Binäraddition.', 'Wandelt das Ergebnis mithilfe der Codetabelle zurück in einen Buchstaben.']]]
    };
    function absaetze(t) { return (typeof t === 'string' ? [t] : t).map(function (p) { return h('p', {}, p); }); }

    function render() {
      var rolle = B.rolle(); flaeche.innerHTML = '';
      if (rolle !== 'alice' && rolle !== 'bob') { flaeche.appendChild(h('p', { 'class': 'fx-ht-hinweis' }, rolle === 'eve' ? 'Eve macht in Aufgabe 1 nichts. Wählt oben Gruppe Alice oder Gruppe Bob.' : 'Wählt zuerst oben eure Gruppe.')); return; }
      var alice = rolle === 'alice', q = s[rolle], t = TEXT[rolle];
      flaeche.appendChild(ref(rolle));
      flaeche.appendChild(h('h4', {}, t[0][0])); flaeche.appendChild(h('p', {}, t[0][1]));
      flaeche.appendChild(runden(rolle));
      flaeche.appendChild(h('h4', {}, t[1][0])); absaetze(t[1][1]).forEach(function (p) { flaeche.appendChild(p); });
      flaeche.appendChild(feld('Rohschlüssel', 'schluessel', 'fx-ht-schluessel', rolle, { size: 7, maxlength: 12, inputmode: 'numeric' }));
      flaeche.appendChild(h('h4', {}, t[2][0])); absaetze(t[2][1]).forEach(function (p) { flaeche.appendChild(p); });
      flaeche.appendChild(addition());
      if (alice) {
        flaeche.appendChild(feld('Buchstabe (Binär)', 'buchstabe', 'fx-ht-buchstabe', rolle, { size: 7, maxlength: 12 }));
        flaeche.appendChild(feld('= Verschlüsselt', 'verschluesselt', 'fx-ht-verschluesselt', rolle, { size: 7, maxlength: 12 }));
      } else {
        flaeche.appendChild(feld('Verschlüsselte Nachricht', 'empfangen', 'fx-ht-empfangen', rolle, { size: 7, maxlength: 12 }));
        flaeche.appendChild(feld('= Klartext', 'entschluesselt', 'fx-ht-entschluesselt', rolle, { size: 7, maxlength: 12 }));
        flaeche.appendChild(feld('→ Buchstabe laut Codetabelle:', 'buchstabe', 'fx-ht-buchstabe', rolle, { size: 3, maxlength: 2 }));
      }
    }
    root.document.addEventListener('fx:rolle', render);
    B.ladeRolle().then(render);
    render();
  }

  function gruppeText(r, q) {
    var t = (r === 'alice' ? 'Alice' : 'Bob') + ' – Schlüssel: ' + (q.schluessel || '–');
    if (r === 'alice') return t + ' · Buchstabe (binär): ' + (q.buchstabe || '–') + ' · verschlüsselt: ' + (q.verschluesselt || '–');
    return t + ' · empfangen: ' + (q.empfangen || '–') + ' · Klartext: ' + (q.entschluesselt || '–') + ' · Buchstabe: ' + (q.buchstabe || '–');
  }

  FX.felder.registriere('rollenwahl', { init: rollenwahl, laden: function () {}, wert: function () { return {}; }, leer: function () { return true; }, ohneProtokoll: true });
  FX.felder.registriere('handtabelle', {
    init: handtabelle,
    laden: function (el, w) { if (!el._htLaden) handtabelle(el); el._htLaden(w); },
    wert: function (el) { if (!el._htWert) handtabelle(el); return el._htWert(); },
    leer: function (w) { var s = fuelle(w); return !belegt('alice', s) && !belegt('bob', s) && s.vergleich.every(function (x) { return x === null; }); },
    protokoll: function (el, w) {
      var s = fuelle(w), teile = [];
      ['alice', 'bob'].forEach(function (r) {
        if (!belegt(r, s)) return;
        var alice = r === 'alice', q = s[r], zeilen = [], mark = [];
        q.runden.forEach(function (x, i) {
          if (!Object.keys(x).some(function (k) { return x[k] !== ''; })) return;   // Vergleichsmarken allein genügen nicht
          var v = s.vergleich[i];
          zeilen.push(alice ? [String(i + 1), x.basis, x.bit, x.winkel, x.zustand, v === true ? '✓' : v === false ? '✗' : '–'] : [String(i + 1), x.basis, x.winkel, x.bit, v === true ? '✓' : v === false ? '✗' : '–']);
          mark.push(v === true ? 'ok' : v === false ? 'fehler' : null);
        });
        if (zeilen.length) teile.push({ typ: 'tabelle', titel: alice ? 'Alice – Runden' : 'Bob – Runden', kopf: alice ? ['Runde', 'Basis', 'Bit', 'Dreherwinkel', 'Zustand', 'Basis gleich?'] : ['Runde', 'Basis', 'Dreherwinkel', 'Bit', 'Basis gleich?'], zeilen: zeilen, markierung: mark });
        teile.push({ typ: 'text', text: gruppeText(r, q) });
      });
      return teile;
    }
  });
})(typeof self !== 'undefined' ? self : this);
