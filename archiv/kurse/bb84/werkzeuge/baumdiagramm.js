/* Werkzeug „baumdiagramm“ (Kapitel 3, Aufgabe 3, Frage 3): Struktur und Kärtchen aus Dominiks baumdiagramm.html.
   Kärtchen ziehen oder antippen und dann das Feld antippen. Ein Feld nimmt genau ein Kärtchen; ein Tipp auf ein belegtes Feld legt es zurück.
   „Überprüfen“ zählt die richtigen Felder; „Lösung aufdecken“ zeigt die gezeichnete Lösung. Wert: {belegung:{feld:kartenId}, geprueft, richtig}. */
(function (root) {
  var FX = root.FX, B = FX.bb84, h = B.h, SNAP = 70, ENTWURF_B = 1020, HOEHE = 570;   // Entwurfsgröße: Dominiks Koordinaten, das Ganze wird auf die Breite skaliert
  // Felder: x = Mitte, y = Oberkante (wie bei Dominik); typ node | prob | end
  var ZONEN = [
    { id: 'n1L', typ: 'node', x: 190, y: 95, w: 170, h: 40 }, { id: 'n1R', typ: 'node', x: 640, y: 95, w: 170, h: 40 },
    { id: 'n2L', typ: 'node', x: 485, y: 255, w: 228, h: 40 }, { id: 'n2R', typ: 'node', x: 810, y: 255, w: 228, h: 40 },
    { id: 'n3L', typ: 'node', x: 705, y: 385, w: 165, h: 40 }, { id: 'n3R', typ: 'node', x: 905, y: 385, w: 196, h: 40 },
    { id: 'p1', typ: 'prob', x: 310, y: 61, w: 48, h: 28 }, { id: 'p2', typ: 'prob', x: 535, y: 61, w: 48, h: 28 }, { id: 'p3', typ: 'prob', x: 562, y: 195, w: 48, h: 28 },
    { id: 'p4', typ: 'prob', x: 725, y: 195, w: 48, h: 28 }, { id: 'p5', typ: 'prob', x: 757, y: 340, w: 48, h: 28 }, { id: 'p6', typ: 'prob', x: 857, y: 340, w: 48, h: 28 },
    { id: 'e0', typ: 'end', x: 190, y: 200, w: 165, h: 54 }, { id: 'e1', typ: 'end', x: 485, y: 372, w: 165, h: 54 },
    { id: 'e2', typ: 'end', x: 705, y: 492, w: 165, h: 54 }, { id: 'e3', typ: 'end', x: 905, y: 492, w: 165, h: 54 }
  ];
  var KARTEN = [
    { id: 'c_n1L', typ: 'node', text: 'Basis Bob ≠ Basis Alice', antwort: 'n1L' }, { id: 'c_n1R', typ: 'node', text: 'Basis Bob = Basis Alice', antwort: 'n1R' },
    { id: 'c_n2L', typ: 'node', text: 'Basis Eve = Basis Bob = Basis Alice', antwort: 'n2L' }, { id: 'c_n2R', typ: 'node', text: 'Basis Eve ≠ Basis Bob = Basis Alice', antwort: 'n2R' },
    { id: 'c_n3L', typ: 'node', text: 'Bob misst falsches Bit', antwort: 'n3L' }, { id: 'c_n3R', typ: 'node', text: 'Bob misst trotzdem richtiges Bit', antwort: 'n3R' },
    { id: 'c_e0', typ: 'end', text: 'Bit wird verworfen – taucht im Schlüssel nicht auf', antwort: 'e0' }, { id: 'c_e1', typ: 'end', text: 'Kein Fehler – Schlüsselbit stimmt überein', antwort: 'e1' },
    { id: 'c_e2', typ: 'end', text: 'Eve hat sich verraten!', antwort: 'e2' }, { id: 'c_e3', typ: 'end', text: 'Kein Fehler – Eve bleibt unentdeckt', antwort: 'e3' }
  ].concat([1, 2, 3, 4, 5, 6].map(function (i) { return { id: 'c_p' + i, typ: 'prob', text: '½', antwort: null }; }));
  var LINIEN = [[430, 27, 190, 95], [430, 27, 640, 95], [190, 135, 190, 200], [640, 135, 485, 255], [640, 135, 810, 255], [485, 295, 485, 372], [810, 295, 705, 385], [810, 295, 905, 385], [705, 425, 705, 492], [905, 425, 905, 492]];
  var LOESUNG = {}; ZONEN.forEach(function (z) { LOESUNG[z.id] = z.typ === 'prob' ? 'c_p' + z.id.slice(1) : 'c_' + z.id; });
  var UNTEN = { n3L: 'c_n3R', n3R: 'c_n3L', e2: 'c_e3', e3: 'c_e2' };   // untere Vertauschung: Knoten und Ergebnis gemeinsam

  function skalierung(breite) { return Math.min(1, breite / ENTWURF_B); }
  B.baumdiagramm = { ZONEN: ZONEN, skalierung: skalierung, ENTWURF_B: ENTWURF_B, HOEHE: HOEHE };

  function karte(id) { return KARTEN.filter(function (k) { return k.id === id; })[0]; }
  function zone(id) { return ZONEN.filter(function (z) { return z.id === id; })[0]; }
  function passt(k, z) { return (k.typ === 'prob') === (z.typ === 'prob'); }

  function status(bel) {
    var vertauscht = bel.n3L === 'c_n3R' && bel.e2 === 'c_e3' && bel.n3R === 'c_n3L' && bel.e3 === 'c_e2', st = {}, richtig = 0;
    ZONEN.forEach(function (z) {
      var k = bel[z.id]; if (!k) { st[z.id] = null; return; }
      var ok = z.typ === 'prob' ? karte(k).typ === 'prob' : (vertauscht && UNTEN[z.id] ? k === UNTEN[z.id] : k === 'c_' + z.id);
      st[z.id] = ok ? 'richtig' : 'falsch'; if (ok) richtig++;
    });
    return { felder: st, richtig: richtig };
  }

  function zeilen(text, maxZeichen) {
    var w = text.split(' '), z = [], akt = '';
    w.forEach(function (x) { if (akt && (akt + ' ' + x).length > maxZeichen) { z.push(akt); akt = x; } else akt = akt ? akt + ' ' + x : x; });
    if (akt) z.push(akt); return z;
  }

  /* Das Diagramm als SVG (Lösung, Ergebnisseite, PDF); belegte Felder mit Karteninhalt, leere als „?“ */
  function baumSvg(bel, st) {
    var o = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1060 570" role="img" aria-label="Baumdiagramm BB84 mit Eve"><rect width="1060" height="570" fill="#fff"/>'];
    LINIEN.forEach(function (l) { o.push('<line x1="' + l[0] + '" y1="' + l[1] + '" x2="' + l[2] + '" y2="' + l[3] + '" stroke="#4A5568" stroke-width="2"/>'); });
    o.push('<circle cx="430" cy="20" r="7" fill="#1A202C"/>');
    ZONEN.forEach(function (z) {
      var k = bel[z.id] && karte(bel[z.id]), s = st && st[z.id], rahmen = s === 'richtig' ? '#38A169' : s === 'falsch' ? '#E53E3E' : k ? '#33416E' : '#A0AEC0';
      var hh = z.typ === 'end' ? z.h : Math.max(z.h, 40), x0 = z.x - z.w / 2;
      o.push('<rect x="' + x0 + '" y="' + z.y + '" width="' + z.w + '" height="' + hh + '" rx="7" fill="' + (k ? (z.typ === 'prob' ? '#FEEFDC' : '#E8F2FA') : '#EDF2F7') + '" stroke="' + rahmen + '" stroke-width="2.5"' + (k ? '' : ' stroke-dasharray="6 4"') + '/>');
      var z_ = k ? zeilen(k.text, Math.max(4, Math.floor(z.w / 7.4))) : ['?'], fs = z.typ === 'prob' ? 18 : 12.5, lh = fs * 1.25, y0 = z.y + hh / 2 - (z_.length - 1) * lh / 2 + fs * 0.35;
      o.push('<text x="' + z.x + '" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-size="' + fs + '" font-weight="' + (z.typ === 'prob' ? 700 : 600) + '" fill="' + (k ? '#1A202C' : '#A0AEC0') + '">' +
        z_.map(function (t, i) { return '<tspan x="' + z.x + '" y="' + (y0 + i * lh) + '">' + B.esc(t) + '</tspan>'; }).join('') + '</text>');
    });
    o.push('</svg>'); return o.join('');
  }

  function fuelle(w) {
    var bel = {}, benutzt = {};
    if (w && w.belegung) Object.keys(w.belegung).forEach(function (f) {
      var z = zone(f), k = karte(w.belegung[f]);
      if (z && k && passt(k, z) && !benutzt[k.id]) { bel[f] = k.id; benutzt[k.id] = true; }
    });
    return { belegung: bel, geprueft: !!(w && w.geprueft) };
  }

  function init(el) {
    var flaeche = el.querySelector('.fx-werkzeug-flaeche'), win = el.ownerDocument.defaultView, d = el.ownerDocument;
    var s = fuelle(null), auswahl = null, meldung = '', loesung = false, drag = null, kein = false;
    el._bdWert = function () { return { belegung: JSON.parse(JSON.stringify(s.belegung)), geprueft: s.geprueft, richtig: status(s.belegung).richtig }; };
    el._bdLaden = function (w) { s = fuelle(w); auswahl = null; render(); };
    function melde() { el.dispatchEvent(new win.Event('change', { bubbles: true })); }
    function belegt(k) { return Object.keys(s.belegung).some(function (f) { return s.belegung[f] === k; }); }
    function lege(k, f) {
      var c = karte(k), z = zone(f);
      if (!c || !z || belegt(k)) return false;
      if (!passt(c, z)) { meldung = c.typ === 'prob' ? 'Die Wahrscheinlichkeit ½ gehört an einen Pfad.' : 'Ereignisse und Ergebnisse gehören in ein Kästchen, nicht an einen Pfad.'; render(); return false; }
      if (s.belegung[f]) { meldung = 'Dieses Feld ist schon belegt. Tippt es an, um das Kärtchen zurückzulegen.'; render(); return false; }
      s.belegung[f] = k; s.geprueft = false; auswahl = null; meldung = ''; render(); melde(); return true;
    }
    function zurueck(f) { if (!s.belegung[f]) return; delete s.belegung[f]; s.geprueft = false; meldung = ''; render(); melde(); }
    el._bdLege = lege; el._bdZurueck = zurueck;

    function textNode(t) { return t; }
    function render() {
      var st = s.geprueft ? status(s.belegung) : null; flaeche.innerHTML = '';
      function kartenEl(k) {
        var b = h('button', { type: 'button', 'class': 'fx-bd-karte fx-bd-' + k.typ, 'data-karte': k.id, 'aria-pressed': auswahl === k.id ? 'true' : 'false', disabled: belegt(k.id) }, textNode(k.text));
        b.addEventListener('click', function () { if (kein) return; auswahl = auswahl === k.id ? null : k.id; meldung = ''; render(); });
        b.addEventListener('pointerdown', function (e) { start(e, k.id, null); });
        return b;
      }
      var bank = h('div', { 'class': 'fx-bd-bank' }, h('div', { 'class': 'fx-bd-gruppe' }, h('strong', {}, 'Wahrscheinlichkeiten'), h('div', { 'class': 'fx-bd-reihe' }, KARTEN.filter(function (k) { return k.typ === 'prob'; }).map(kartenEl))),
        h('div', { 'class': 'fx-bd-gruppe' }, h('strong', {}, 'Ereignisse'), h('div', { 'class': 'fx-bd-reihe' }, KARTEN.filter(function (k) { return k.typ === 'node'; }).map(kartenEl))),
        h('div', { 'class': 'fx-bd-gruppe' }, h('strong', {}, 'Ergebnisse'), h('div', { 'class': 'fx-bd-reihe' }, KARTEN.filter(function (k) { return k.typ === 'end'; }).map(kartenEl))));
      var baum = h('div', { 'class': 'fx-bd-baum' });
      var linien = d.createElementNS('http://www.w3.org/2000/svg', 'svg'); linien.setAttribute('class', 'fx-bd-linien'); linien.setAttribute('viewBox', '0 0 1020 570');
      linien.innerHTML = LINIEN.map(function (l) { return '<line x1="' + l[0] + '" y1="' + l[1] + '" x2="' + l[2] + '" y2="' + l[3] + '" stroke="#4A5568" stroke-width="2"/>'; }).join('');
      baum.appendChild(linien); baum.appendChild(h('span', { 'class': 'fx-bd-wurzel' }));
      ZONEN.forEach(function (z) {
        var k = s.belegung[z.id] && karte(s.belegung[z.id]), stz = st && st.felder[z.id];
        var b = h('button', { type: 'button', 'class': 'fx-bd-feld fx-bd-' + z.typ + (k ? ' fx-bd-belegt' : '') + (stz === 'richtig' ? ' fx-richtig' : stz === 'falsch' ? ' fx-falsch' : ''), 'data-feld': z.id,
          style: 'left:' + z.x + 'px;top:' + z.y + 'px;width:' + z.w + 'px;min-height:' + z.h + 'px', 'aria-label': 'Feld' }, k ? k.text : '?');
        b.addEventListener('click', function () {
          if (kein) return;
          if (s.belegung[z.id]) { if (auswahl) { meldung = 'Dieses Feld ist schon belegt. Tippt es an, um das Kärtchen zurückzulegen.'; render(); } else zurueck(z.id); return; }
          if (!auswahl) { meldung = 'Wählt zuerst ein Kärtchen aus.'; render(); return; }
          lege(auswahl, z.id);
        });
        if (k) b.addEventListener('pointerdown', function (e) { start(e, s.belegung[z.id], z.id); });
        baum.appendChild(b);
      });
      var ergebnis = st ? (st.richtig === 16 ? 'Perfekt! Alle 16 Felder richtig – 16 von 16 Feldern richtig.' : st.richtig + ' von 16 Feldern richtig – schau nochmal nach!') : '';
      var loesungEl = h('div', { 'class': 'fx-bd-loesung', hidden: !loesung }); loesungEl.innerHTML = loesung ? baumSvg(LOESUNG, null) : '';
      flaeche.appendChild(h('h4', {}, 'Frage 3 – Baumdiagramm: Wie wahrscheinlich verrät Eve sich?'));
      flaeche.appendChild(h('p', {}, 'Ziehe alle Kärtchen an die richtige Stelle im Baumdiagramm.'));
      flaeche.appendChild(bank);
      var huelle = h('div', { 'class': 'fx-bd-huelle' }, baum); huelle.style.height = HOEHE + 'px';
      flaeche.appendChild(huelle); el._bdHuelle = huelle; el._bdBaum = baum;
      flaeche.appendChild(h('div', { 'class': 'fx-knoepfe' },
        h('button', { type: 'button', 'class': 'fx-knopf fx-haupt fx-bd-pruefen', onclick: function () { s.geprueft = true; meldung = ''; render(); melde(); } }, '✓ Überprüfen'),
        h('button', { type: 'button', 'class': 'fx-knopf fx-bd-zurueck', onclick: function () { s = fuelle(null); auswahl = null; meldung = ''; render(); melde(); } }, '↺ Zurücksetzen'),
        h('button', { type: 'button', 'class': 'fx-knopf fx-bd-loesungsknopf', onclick: function () { loesung = !loesung; render(); } }, loesung ? 'Lösung verbergen' : 'Lösung aufdecken')));
      flaeche.appendChild(h('p', { 'class': 'fx-bd-rueckmeldung', role: 'status' }, meldung || ergebnis));
      flaeche.appendChild(loesungEl);
      anpassen();
    }
    function anpassen() {   // Baum auf die Breite der Hülle skalieren; Bank und Knöpfe bleiben in voller Größe
      var hu = el._bdHuelle, b = el._bdBaum, bw = hu && hu.clientWidth; if (!hu || !bw) return;
      var f = skalierung(bw); b.style.transform = 'scale(' + f + ')'; hu.style.height = Math.ceil(HOEHE * f) + 'px';
    }
    win.addEventListener('resize', anpassen); el.ownerDocument.addEventListener('fx:ansicht', anpassen);
    if (win.ResizeObserver) new win.ResizeObserver(anpassen).observe(flaeche);

    /* ---- Ziehen (Zeiger): erst nach kurzer Bewegung, damit Antippen weiter funktioniert */
    function start(e, kartenId, vonFeld) {
      if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return;
      drag = { id: kartenId, von: vonFeld, x: e.clientX, y: e.clientY, schwebt: null };
      d.addEventListener('pointermove', bewege); d.addEventListener('pointerup', ende); d.addEventListener('pointercancel', abbruch);
    }
    function bewege(e) {
      if (!drag) return;
      if (!drag.schwebt) {
        if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
        var k = karte(drag.id); drag.schwebt = h('div', { 'class': 'fx-bd-schwebe' }, k.text); d.body.appendChild(drag.schwebt);
        if (drag.von) { delete s.belegung[drag.von]; s.geprueft = false; render(); }
      }
      drag.schwebt.style.left = (e.clientX + 8) + 'px'; drag.schwebt.style.top = (e.clientY + 8) + 'px';
    }
    function ziel(x, y, k) {
      var best = null, dist = SNAP;
      Array.prototype.forEach.call(el.querySelectorAll('.fx-bd-feld'), function (b) {
        var z = zone(b.getAttribute('data-feld')); if (!passt(k, z)) return;
        var r = b.getBoundingClientRect(), dd = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2));
        if (dd < dist) { dist = dd; best = z.id; }
      });
      return best;
    }
    function raeume() { d.removeEventListener('pointermove', bewege); d.removeEventListener('pointerup', ende); d.removeEventListener('pointercancel', abbruch); }
    function ende(e) {
      raeume(); var g = drag; drag = null; if (!g || !g.schwebt) return;
      g.schwebt.remove(); kein = true; win.setTimeout(function () { kein = false; }, 0);
      var f = ziel(e.clientX, e.clientY, karte(g.id));
      if (f) lege(g.id, f); else { render(); melde(); }
    }
    function abbruch() { raeume(); if (drag && drag.schwebt) { drag.schwebt.remove(); render(); melde(); } drag = null; }
    render();
  }

  FX.felder.registriere('baumdiagramm', {
    init: init,
    laden: function (el, w) { if (!el._bdLaden) init(el); el._bdLaden(w); },
    wert: function (el) { if (!el._bdWert) init(el); return el._bdWert(); },
    leer: function (w) { return !(w && w.belegung && Object.keys(w.belegung).length); },
    protokoll: function (el, w) {
      var s = fuelle(w), st = status(s.belegung);
      return [{ typ: 'grafik', svg: baumSvg(s.belegung, null), breite_mm: 170 }, { typ: 'text', text: st.richtig + ' von 16 Feldern richtig' }];
    }
  });
})(typeof self !== 'undefined' ? self : this);
