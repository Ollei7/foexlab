/* Werkzeug „schluessel“ (Kapitel 3, Aufgabe 2 und – mit modus="eve" – Aufgabe 3): Reiter Alice, Bob (und Eve).
   Würfeln per Tipp, Zeilen grün/rot markieren, grüne Zeilen in den Schlüssel übernehmen (Ziel: 40 Bit, in Aufgabe 3: 10 Bit),
   ab 5 Bit Nachricht ver- bzw. entschlüsseln, in Aufgabe 3 Schlüsselbits der anderen Gruppe vergleichen und die Fehlerrate eintragen.
   Die Daten jeder Rolle bleiben getrennt erhalten. */
(function (root) {
  var FX = root.FX, B = FX.bb84, h = B.h;
  var ZEILEN = 16;

  function zeilen0(eve) { var z = []; for (var i = 0; i < ZEILEN; i++) z.push(eve ? { basis: '', bit: '' } : { basis: '', bit: '', markierung: null }); return z; }
  function wert0() {
    return { alice: { zeilen: zeilen0() }, bob: { zeilen: zeilen0() }, eve: { zeilen: zeilen0(true) }, schluessel: { alice: '', bob: '' }, nachricht: { klar: '' }, empfangen: { bits: '' }, vergleich: { fremd: [], markiert: [] }, fehlerrate: '' };
  }
  function fuelle(w) {
    var s = wert0(); w = w || {};
    ['alice', 'bob', 'eve'].forEach(function (r) {
      ((w[r] && w[r].zeilen) || []).slice(0, ZEILEN).forEach(function (z, i) {
        if (!z) return;
        s[r].zeilen[i].basis = z.basis === '+' || z.basis === '×' ? z.basis : ''; s[r].zeilen[i].bit = z.bit === '0' || z.bit === '1' ? z.bit : '';
        if (r !== 'eve') s[r].zeilen[i].markierung = z.markierung === 'ok' || z.markierung === 'fehler' ? z.markierung : null;
      });
    });
    ['alice', 'bob'].forEach(function (r) { var k = w.schluessel && w.schluessel[r]; if (typeof k === 'string') s.schluessel[r] = k.replace(/[^01]/g, ''); });
    if (w.nachricht && typeof w.nachricht.klar === 'string') s.nachricht.klar = w.nachricht.klar;
    if (w.empfangen && typeof w.empfangen.bits === 'string') s.empfangen.bits = w.empfangen.bits;
    if (w.vergleich) { s.vergleich.fremd = (w.vergleich.fremd || []).map(String); s.vergleich.markiert = (w.vergleich.markiert || []).map(Boolean); }
    if (typeof w.fehlerrate === 'string') s.fehlerrate = w.fehlerrate;
    return s;
  }
  function kopie(x) { return JSON.parse(JSON.stringify(x)); }

  /* Verschlüsseln: Text → Buchstaben → Fünferblöcke, begrenzt durch die Schlüssellänge */
  function verschluessele(klar, key) {
    var z = B.zuBits(klar), n = Math.floor(key.length / 5), bl = key.match(/.{5}/g) || [], genutzt = Math.min(z.buchstaben.length, n);
    var klarBits = z.bits.slice(0, genutzt);
    return { buchstaben: z.buchstaben.slice(0, genutzt), klar: klarBits, schluessel: bl.slice(0, genutzt), enc: klarBits.map(function (b, i) { return B.addiere(b, bl[i]); }),
      nicht: z.nicht, zuKurz: z.buchstaben.length > n, kann: n };
  }
  function entschluessele(bits, key) {
    var g = bits.match(/.{5}/g) || [], kb = key.match(/.{5}/g) || [], n = Math.min(g.length, kb.length);
    var klar = [], buch = [];
    for (var i = 0; i < n; i++) { var k = B.addiere(g[i], kb[i]); klar.push(k); buch.push(B.buchstabe(k) || '?'); }
    return { empfangen: g.slice(0, n), schluessel: kb.slice(0, n), klar: klar, buchstaben: buch, zuKurz: g.length > kb.length, kann: kb.length };
  }
  function nichtText(l) {
    var seen = [], teile = [];
    l.forEach(function (c) { if (seen.indexOf(c) < 0) { seen.push(c); teile.push(c === ' ' ? 'Leerzeichen' : c); } });
    return teile.length ? 'Diese Zeichen sind nicht übertragbar und werden übersprungen: ' + teile.join(', ') : '';
  }

  function init(el) {
    var flaeche = el.querySelector('.fx-werkzeug-flaeche'), win = el.ownerDocument.defaultView, d = el.ownerDocument;
    var konfig = {}; try { konfig = JSON.parse(el.getAttribute('data-fx-konfig')) || {}; } catch (e) { /* leer */ }
    var eve = konfig.modus === 'eve', ziel = konfig.ziel || (eve ? 10 : 40), s = fuelle(null), tab = null, hinweis = '';
    el._skWert = function () {
      var k = kopie(s), n = Math.max(s.vergleich.markiert.length, s.vergleich.fremd.length);
      k.vergleich.markiert = Array.apply(null, Array(n)).map(function (x, i) { return !!s.vergleich.markiert[i]; });
      k.vergleich.fremd = Array.apply(null, Array(n)).map(function (x, i) { return s.vergleich.fremd[i] || ''; });
      return k;
    };
    el._skLaden = function (w) { s = fuelle(w); render(); };
    function rollen() { return eve ? ['alice', 'bob', 'eve'] : ['alice', 'bob']; }
    function melde() { el.dispatchEvent(new win.Event('change', { bubbles: true })); }
    function aktTab() { if (tab && rollen().indexOf(tab) >= 0) return tab; var r = B.rolle(); return rollen().indexOf(r) >= 0 ? r : 'alice'; }

    /* ---- Zeilen */
    function anzeige(rolle, z) {
      if (rolle === 'alice') return z.basis && z.bit !== '' ? B.zustand(z.basis, +z.bit).winkel + ' ' + B.zustand(z.basis, +z.bit).ket : '–';
      if (rolle === 'bob') return z.basis ? 'Dreher: ' + B.bobWinkel(z.basis) : '–';
      if (z.basis && z.bit !== '') { var q = B.zustand(z.basis, +z.bit); return 'Eve sendet neu: ' + q.winkel + ' ' + q.ket; }
      return z.basis ? 'Eve misst mit Dreher ' + B.bobWinkel(z.basis) : '–';
    }
    function tabelle(rolle) {
      var q = s[rolle], zeilen = q.zeilen.map(function (z, i) {
        var basisT = h('span', { 'class': 'fx-sk-basis' }, z.basis || '–'), anz = h('span', { 'class': 'fx-sk-anzeige' }, anzeige(rolle, z));
        var wuerfel = h('button', { type: 'button', 'class': 'fx-knopf fx-sk-wuerfel', 'aria-label': 'Würfeln', onclick: function () {
          if (rolle === 'alice') { var x = B.wuerfel(B.zufall); z.basis = x.basis; z.bit = String(x.bit); } else { z.basis = (B.zufall || Math.random)() < 0.5 ? '+' : '×'; }
          hinweis = ''; render(); melde(); } }, '🎲');
        var bitZelle = rolle === 'alice' ? h('span', { 'class': 'fx-sk-bitanz' }, z.bit === '' ? '–' : z.bit)
          : (function () { var sel = h('select', { 'class': 'fx-sk-bit', 'aria-label': rolle === 'bob' ? 'Gemessenes Bit' : 'Gemessenes Bit von Eve', onchange: function () { z.bit = sel.value; hinweis = ''; anz.textContent = anzeige(rolle, z); melde(); } }, ['', '0', '1'].map(function (o) { return h('option', { value: o }, o || '–'); })); sel.value = z.bit; return sel; })();
        var mark = rolle === 'eve' ? null : h('button', { type: 'button', 'class': 'fx-knopf fx-sk-mark' + (z.markierung === 'ok' ? ' fx-ok' : z.markierung === 'fehler' ? ' fx-fehler' : ''), 'aria-label': 'Basis gleich? grün oder rot markieren', onclick: function () {
          z.markierung = z.markierung === null ? 'ok' : z.markierung === 'ok' ? 'fehler' : null; hinweis = ''; render(); melde(); } }, z.markierung === 'ok' ? '✓' : z.markierung === 'fehler' ? '✗' : '–');
        return h('tr', { 'class': 'fx-sk-zeile' + (z.markierung ? ' fx-' + z.markierung : ''), 'data-nr': i }, h('td', {}, String(i + 1)), h('td', {}, wuerfel), h('td', {}, basisT), h('td', {}, bitZelle), h('td', {}, anz), mark ? h('td', {}, mark) : null);
      });
      var kopf = ['#', '', 'Basis', rolle === 'alice' ? 'Bit' : 'Gemessenes Bit', rolle === 'alice' ? 'Drehwinkel und Zustand' : rolle === 'bob' ? 'Drehwinkel' : 'Eves neues Photon'].concat(rolle === 'eve' ? [] : ['Basis gleich?']);
      return h('div', { 'class': 'fx-tab-wrap' }, h('table', { 'class': 'fx-sk-tabelle' }, h('thead', {}, h('tr', {}, kopf.map(function (k) { return h('th', {}, k); }))), h('tbody', {}, zeilen)));
    }
    function uebernehmen(rolle) {
      var q = s[rolle], gruen = q.zeilen.filter(function (z) { return z.markierung === 'ok'; });
      if (gruen.some(function (z) { return z.bit === ''; })) { hinweis = rolle === 'bob' ? 'Tragt zuerst in allen grünen Zeilen das gemessene Bit ein.' : 'Würfelt zuerst Basis und Bit in allen grünen Zeilen.'; render(); return; }
      s.schluessel[rolle] += gruen.map(function (z) { return z.bit; }).join('');
      q.zeilen = zeilen0(); hinweis = ''; render(); melde();
    }

    /* ---- Nachricht */
    function nachrichtAlice(box, key) {
      var out = h('div', { 'class': 'fx-sk-ausgabe' });
      var inp = h('input', { type: 'text', 'class': 'fx-sk-nachricht', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', placeholder: '…' }); inp.value = s.nachricht.klar;
      function zeige() {
        var r = verschluessele(s.nachricht.klar, key); out.innerHTML = '';
        var nicht = h('p', { 'class': 'fx-sk-nicht', hidden: !r.nicht.length }, nichtText(r.nicht)), reicht = h('p', { 'class': 'fx-sk-reicht', hidden: !r.zuKurz }, 'Der Schlüssel reicht für ' + r.kann + ' Buchstaben.');
        out.appendChild(nicht); out.appendChild(reicht);
        out.appendChild(h('table', { 'class': 'fx-sk-add' }, h('tbody', {},
          h('tr', {}, h('th', {}, 'Buchstaben'), h('td', { 'class': 'fx-sk-buchstaben' }, r.buchstaben.join(' '))),
          h('tr', {}, h('th', {}, 'Klartext (binär)'), h('td', { 'class': 'fx-sk-klarbits' }, r.klar.join(' '))),
          h('tr', {}, h('th', {}, 'Schlüssel'), h('td', { 'class': 'fx-sk-key5' }, r.schluessel.join(' '))),
          h('tr', {}, h('th', {}, '= Verschlüsselt'), h('td', { 'class': 'fx-sk-verschluesselt' }, r.enc.join(' '))))));
      }
      inp.addEventListener('input', function () { s.nachricht.klar = inp.value; zeige(); melde(); });
      box.appendChild(h('h4', {}, 'SCHRITT 3 – Nachricht verschlüsseln'));
      box.appendChild(h('p', {}, 'Tippe deine geheime Nachricht ein (nur Großbuchstaben A–Z). Sie wird automatisch in Binärcode umgewandelt und mit dem Schlüssel verschlüsselt. Lest die verschlüsselten Bits laut vor.'));
      box.appendChild(inp); box.appendChild(out); zeige();
    }
    function nachrichtBob(box, key) {
      var out = h('div', { 'class': 'fx-sk-ausgabe' }), hin = h('p', { 'class': 'fx-sk-eingabehinweis', role: 'status' });
      var inp = h('input', { type: 'text', 'class': 'fx-sk-empfangen', autocomplete: 'off', inputmode: 'numeric', placeholder: '…' }); inp.value = s.empfangen.bits.match(/.{1,5}/g) ? s.empfangen.bits.match(/.{1,5}/g).join(' ') : '';
      function zeige() {
        var r = entschluessele(s.empfangen.bits, key); out.innerHTML = '';
        out.appendChild(h('p', { 'class': 'fx-sk-reicht', hidden: !r.zuKurz }, 'Der Schlüssel reicht für ' + r.kann + ' Buchstaben.'));
        out.appendChild(h('table', { 'class': 'fx-sk-add' }, h('tbody', {},
          h('tr', {}, h('th', {}, 'Verschlüsselte Nachricht'), h('td', { 'class': 'fx-sk-empfangenbits' }, r.empfangen.join(' '))),
          h('tr', {}, h('th', {}, 'Schlüssel'), h('td', { 'class': 'fx-sk-key5' }, r.schluessel.join(' '))),
          h('tr', {}, h('th', {}, '= Klartext (binär)'), h('td', { 'class': 'fx-sk-klarbits' }, r.klar.join(' '))),
          h('tr', {}, h('th', {}, 'Buchstaben'), h('td', { 'class': 'fx-sk-entschluesselt' }, r.buchstaben.join(''))))));
      }
      inp.addEventListener('input', function () {
        var roh = inp.value.replace(/\s+/g, ''), rein = roh.replace(/[^01]/g, '');
        hin.textContent = roh !== rein ? 'Bitte nur 0 und 1 eingeben.' : '';
        s.empfangen.bits = rein; zeige(); melde();
      });
      box.appendChild(h('h4', {}, 'SCHRITT 3 – Nachricht entschlüsseln'));
      box.appendChild(h('p', {}, 'Alice liest die verschlüsselten Bits vor. Tippe sie hier ein (nur 0 und 1). Der Schlüssel wird automatisch eingetragen und die Nachricht entschlüsselt.'));
      box.appendChild(inp); box.appendChild(hin); box.appendChild(out); zeige();
    }

    /* ---- Vergleich in Aufgabe 3 */
    function vergleich(box, key) {
      var zeilen = key.split('').map(function (b, i) {
        var f = h('input', { type: 'text', 'class': 'fx-sk-fremd', maxlength: 1, inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Schlüsselbit ' + (i + 1) + ' der anderen Gruppe' }); f.value = s.vergleich.fremd[i] || '';
        f.addEventListener('input', function () { s.vergleich.fremd[i] = f.value.replace(/[^01]/g, ''); melde(); });
        var dk = h('button', { type: 'button', 'class': 'fx-knopf fx-sk-diff' + (s.vergleich.markiert[i] ? ' fx-fehler' : ''), 'aria-label': 'Unterschied markieren', onclick: function () { s.vergleich.markiert[i] = !s.vergleich.markiert[i]; dk.textContent = s.vergleich.markiert[i] ? '✗' : '='; dk.className = 'fx-knopf fx-sk-diff' + (s.vergleich.markiert[i] ? ' fx-fehler' : ''); melde(); } }, s.vergleich.markiert[i] ? '✗' : '=');
        return h('tr', {}, h('td', {}, String(i + 1)), h('td', {}, b), h('td', {}, f), h('td', {}, dk));
      });
      box.appendChild(h('div', { 'class': 'fx-tab-wrap' }, h('table', { 'class': 'fx-sk-vergleich' }, h('thead', {}, h('tr', {}, ['#', 'Eigenes Schlüsselbit', 'Schlüsselbits der anderen Gruppe', 'Unterschied'].map(function (k) { return h('th', {}, k); }))), h('tbody', {}, zeilen))));
      var f = h('input', { type: 'number', 'class': 'fx-sk-fehlerrate', min: 0, max: 100, step: 'any', placeholder: '0' }); f.value = s.fehlerrate;
      f.addEventListener('input', function () { s.fehlerrate = f.value; melde(); });
      box.appendChild(h('p', {}, 'Beim Vergleich der Schlüsselbits sollte euch aufgefallen sein, dass zwischen Alice und Bobs Schlüssel Unterschiede bestehen, obwohl beide dieselben Basen verwendet haben. Das ist kein Zufall, sondern eine direkte Folge von Eves Abhörversuch.'));
      box.appendChild(h('h4', {}, 'Frage 1: Fehlerrate'));
      box.appendChild(h('p', {}, 'Wie viel Prozent der Schlüsselbits war fehlerhaft? Zählt die abweichenden Bits und berechnet den Anteil.'));
      box.appendChild(h('label', {}, 'Fehlerrate: ', f, ' %'));
    }

    var HINT = {
      alice: eve ? 'Alice würfelt Basis und Bit automatisch. Vergleicht anschließend die Basen mit Bob und markiert grün (übereinstimmend) oder rot (verschieden).' : 'Alice würfelt Basis und Bit automatisch. Vergleicht die Basen mit Bob und markiert grün (übereinstimmend) oder rot (verschieden). Sobald mindestens 5 Schlüsselbits vorhanden sind, erscheint die Verschlüsselung.',
      bob: eve ? 'Bob würfelt nur die Basis. Das gemessene Bit wird manuell eingetragen (0 oder 1). Dann Basen mit Alice vergleichen und grün/rot markieren.' : 'Bob würfelt nur die Basis. Das gemessene Bit wird manuell eingetragen (0 oder 1). Dann Basen mit Alice vergleichen und grün/rot markieren. Sobald mindestens 5 Schlüsselbits vorhanden sind, erscheint die Entschlüsselung.',
      eve: 'Eve fängt ab und rät die Basis. Das abgefangene Bit wird manuell eingetragen. Beim Basenaustausch wird sichtbar, wie viele Fehler Eve hinterlässt.'
    };

    function render() {
      var rolle = aktTab(); flaeche.innerHTML = '';
      flaeche.appendChild(h('div', { 'class': 'fx-sk-reiterleiste', role: 'tablist' }, rollen().map(function (r) {
        return h('button', { type: 'button', role: 'tab', 'class': 'fx-knopf fx-sk-reiter', 'data-rolle': r, 'aria-selected': r === rolle ? 'true' : 'false', onclick: function () { tab = r; hinweis = ''; render(); } }, r === 'alice' ? 'Alice' : r === 'bob' ? 'Bob' : 'Eve');
      })));
      var key = rolle === 'eve' ? '' : s.schluessel[rolle];
      if (!eve && rolle !== 'eve') flaeche.appendChild(h('p', { 'class': 'fx-sk-a1' }, '💡 Euer Rohschlüssel aus Aufgabe 1 kann direkt als erste 5 Bits übernommen werden. ',
        h('button', { type: 'button', 'class': 'fx-knopf fx-sk-aus-a1', onclick: function () {
          var f = d.querySelector('.fx-feld[data-fx-art="handtabelle"]'), w = f && FX.felder.arten.handtabelle.wert(f), k = w && w[rolle] && w[rolle].schluessel;
          if (k) { s.schluessel[rolle] = k.replace(/[^01]/g, ''); hinweis = ''; render(); melde(); } else { hinweis = 'In Aufgabe 1 ist noch kein Rohschlüssel eingetragen.'; render(); } } }, 'Aus Aufgabe 1 übernehmen')));
      flaeche.appendChild(h('p', { 'class': 'fx-sk-hinweistext' }, HINT[rolle]));
      flaeche.appendChild(tabelle(rolle));
      if (rolle !== 'eve') {
        flaeche.appendChild(h('div', { 'class': 'fx-knoepfe' }, h('button', { type: 'button', 'class': 'fx-knopf fx-haupt fx-sk-uebernehmen', onclick: function () { uebernehmen(rolle); } }, 'Zeilen in den Schlüssel übernehmen'),
          h('button', { type: 'button', 'class': 'fx-knopf fx-sk-leeren', onclick: function () { if (!FX.felder.frage('Den ganzen Schlüssel von ' + (rolle === 'alice' ? 'Alice' : 'Bob') + ' löschen?')) return; s.schluessel[rolle] = ''; s[rolle].zeilen = zeilen0(); render(); melde(); } }, 'Schlüssel löschen')));
        flaeche.appendChild(h('p', { 'class': 'fx-sk-hinweis', role: 'status' }, hinweis));
        flaeche.appendChild(h('h4', {}, 'Schlüssel:'));
        flaeche.appendChild(h('p', { 'class': 'fx-sk-key' }, '(' + key.length + ' Bit) ' + B.gruppen(key)));
        flaeche.appendChild(h('div', { 'class': 'fx-sk-fortschritt' }, h('progress', { 'class': 'fx-sk-balken', max: ziel, value: Math.min(key.length, ziel) }), ' ' + key.length + ' / ' + ziel + ' Bit'));
        if (eve) { if (key.length) vergleich(flaeche, key); }
        else if (key.length >= 5) { var box = h('div', { 'class': 'fx-sk-nachrichtbox' }); flaeche.appendChild(box); (rolle === 'alice' ? nachrichtAlice : nachrichtBob)(box, key); }
      }
    }
    root.document.addEventListener('fx:rolle', function (e) { var r = e.detail && e.detail.rolle; if (rollen().indexOf(r) >= 0) { tab = r; hinweis = ''; render(); } });
    B.ladeRolle().then(function () { if (B.rolle() && rollen().indexOf(B.rolle()) >= 0 && !tab) tab = B.rolle(); render(); });
    render();
  }

  function gruppeText(titel, key) { return titel + ' – Schlüssel (' + key.length + ' Bit): ' + B.gruppen(key); }

  FX.felder.registriere('schluessel', {
    init: init,
    laden: function (el, w) { if (!el._skLaden) init(el); el._skLaden(w); },
    wert: function (el) { if (!el._skWert) init(el); return el._skWert(); },
    leer: function (w) {
      var s = fuelle(w), z = function (r) { return s[r].zeilen.some(function (x) { return x.basis || x.bit || x.markierung; }); };
      return !s.schluessel.alice && !s.schluessel.bob && !s.nachricht.klar && !s.empfangen.bits && !s.fehlerrate && !s.vergleich.fremd.some(Boolean) && !s.vergleich.markiert.some(Boolean) && !z('alice') && !z('bob') && !z('eve');
    },
    protokoll: function (el, w) {
      var s = fuelle(w), teile = [], eve = false;
      try { eve = (JSON.parse(el.getAttribute('data-fx-konfig')) || {}).modus === 'eve'; } catch (e) { /* normal */ }
      if (s.schluessel.alice) teile.push({ typ: 'text', text: gruppeText('Alice', s.schluessel.alice) });
      if (s.schluessel.bob) teile.push({ typ: 'text', text: gruppeText('Bob', s.schluessel.bob) });
      if (!eve) {
        if (s.nachricht.klar && s.schluessel.alice.length >= 5) { var r = verschluessele(s.nachricht.klar, s.schluessel.alice); teile.push({ typ: 'text', text: 'Nachricht – Klartext: ' + s.nachricht.klar + ' · binär: ' + r.klar.join(' ') + ' · verschlüsselt: ' + r.enc.join(' ') + (r.nicht.length ? ' · nicht übertragbar: ' + r.nicht.join('') : '') + (r.zuKurz ? ' · Der Schlüssel reicht für ' + r.kann + ' Buchstaben.' : '') }); }
        if (s.empfangen.bits && s.schluessel.bob.length >= 5) { var e = entschluessele(s.empfangen.bits, s.schluessel.bob); teile.push({ typ: 'text', text: 'Empfangen: ' + e.empfangen.join(' ') + ' · entschlüsselt: ' + e.klar.join(' ') + ' · Buchstaben: ' + e.buchstaben.join('') }); }
      } else {
        var key = s.schluessel.alice || s.schluessel.bob;
        if (key && (s.vergleich.fremd.some(Boolean) || s.vergleich.markiert.some(Boolean))) {
          var zeilen = key.split('').map(function (b, i) { return [String(i + 1), b, s.vergleich.fremd[i] || '–', s.vergleich.markiert[i] ? '✗' : '=']; });
          teile.push({ typ: 'tabelle', titel: 'Vergleich der Schlüsselbits', kopf: ['Nr', 'Eigenes Bit', 'Bit der anderen Gruppe', 'Unterschied'], zeilen: zeilen, markierung: key.split('').map(function (b, i) { return s.vergleich.markiert[i] ? 'fehler' : 'ok'; }) });
        }
        if (s.fehlerrate !== '') teile.push({ typ: 'text', text: 'Fehlerrate: ' + s.fehlerrate + ' %' });
      }
      return teile;
    }
  });
})(typeof self !== 'undefined' ? self : this);
