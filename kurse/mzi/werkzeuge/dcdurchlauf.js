/* Werkzeug „dcdurchlauf“ (Kapitel 3, Schritt 5, Messdurchlauf).
   Die Messsoftware stellt Δφ von 0° bis 360° in EINST.LAUF_SCHRITT-Schritten ein (37 Messreihen) und nimmt je eine Messreihe auf;
     im Zeitraffer, EINST.LAUF_MS je Schritt, mit Fortschrittsbalken und beiden Diagrammen (drin/draußen, mit Trendlinie).
     Wert: {run: [{phi, in: {n, k1, k2}, out: {n, k1, k2}}]}. Der Wert wird erst nach dem letzten Schritt gesetzt (vorher nur Anzeige),
     „change“ erst dann; währenddessen ist der Knopf gesperrt. „Messdurchlauf wiederholen“ ersetzt den Wert. Erledigt bei vollständigem Durchlauf.
   Die Feldart „dcergebnis“ (Konfig quelle "<feld-id des Messdurchlaufs>") zeigt dieselben Diagramme aus der Quelle (liest bei fx:geaendert nach);
     kein eigener Wert, nicht im Protokoll (der Durchlauf steht dort schon beim Feld „lauf“). */
(function (root) {
  const FX = root.FX, M = FX.mzi, h = M.h;
  const anzahl = () => Math.floor(360 / M.EINST.LAUF_SCHRITT) + 1;   // 37

  const zaehl = (x) => (typeof x === 'number' && isFinite(x) && x >= 0 ? Math.round(x) : 0);
  const teil = (t) => ({ n: zaehl(t && t.n), k1: zaehl(t && t.k1), k2: zaehl(t && t.k2) });
  const fuelle = (w) => ({ run: ((w && w.run) || []).filter(Boolean).map((r) => ({ phi: zaehl(r.phi), 'in': teil(r['in']), out: teil(r.out) })) });
  const diagramm = (run, c, leer) => M.ratenSVG(run.map((r) => [r.phi, r[c].k1]), run.map((r) => [r.phi, r[c].k2]),
    { empty: leer, trend: run.length >= anzahl(), ylabel: 'Zählrate pro Sekunde' });
  const NAME = { 'in': 'drin', out: 'draußen' };

  /* Zwei Diagramme nebeneinander; setze(run, leerText) zeichnet neu */
  function diagramme() {
    const bild = { 'in': h('div', { 'class': 'mzi-diagramm', 'data-o': 'drin' }), out: h('div', { 'class': 'mzi-diagramm', 'data-o': 'draussen' }) };
    const el = h('div', { 'class': 'mzi-diagramme' }, ['in', 'out'].map((c) => h('div', {}, h('h4', {}, 'Strahlteiler 2 ' + NAME[c]), bild[c])));
    return { el, setze(run, leer) { ['in', 'out'].forEach((c) => { bild[c].innerHTML = diagramm(run, c, leer); }); } };
  }

  function initLauf(el, flaeche) {
    let s = fuelle(null), anz = [], beschaeftigt = false;
    const zeichnung = h('div', { 'class': 'mzi-zeichnung' });
    const knopf = h('button', { type: 'button', 'class': 'fx-knopf fx-haupt', 'data-o': 'lauf', onclick: () => starte() }, 'Messdurchlauf starten');
    const status = h('p', { 'class': 'mzi-status', role: 'status', 'data-o': 'st' });
    const fuell = h('div', { style: 'width:0%' }), balken = h('div', { 'class': 'mzi-balken', 'data-o': 'balken', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': anzahl() }, fuell);
    const dia = diagramme();
    flaeche.appendChild(h('div', {}, h('div', { 'class': 'fx-mzi-lab' }, zeichnung, h('div', { 'class': 'mzi-bedienung' }, h('div', { 'class': 'fx-knoepfe' }, knopf), balken, status)), dia.el,
      h('p', { 'class': 'mzi-hinweis' }, 'Jeder Punkt: Zählrate einer Messreihe (1 Sekunde) bei dieser Phasendifferenz, getrennt nach der Einstellung des Zufallsgenerators. Linie: Trendlinie durch die Messpunkte.')));

    function zeichne(phi, c1, c2, opt) {
      zeichnung.innerHTML = M.aufbauSVG('dc', Object.assign({ phaseOn: true, phi, c1, c2, detLabel: 'Zählrate in dieser Messreihe', caption: 'wartet' }, opt));
    }
    function zeige() {
      const n = anz.length, ganz = n >= anzahl();
      knopf.disabled = beschaeftigt;
      knopf.textContent = s.run.length >= anzahl() && !beschaeftigt ? 'Messdurchlauf wiederholen' : 'Messdurchlauf starten';
      fuell.style.width = (100 * n / anzahl()) + '%'; balken.setAttribute('aria-valuenow', n);
      if (!beschaeftigt) status.textContent = ganz ? 'Fertig: ' + n + ' Messreihen mit je ' + M.EINST.MW_PHOTONEN + ' Einzelmessungen.' : 'Noch nicht gestartet.';
      dia.setze(anz, 'Startet den Messdurchlauf.');
    }
    async function starte() {
      if (beschaeftigt) return;
      beschaeftigt = true; anz = []; zeige();
      const neu = [], ms = M.EINST.LAUF_MS;
      for (let p = 0; p <= 360; p += M.EINST.LAUF_SCHRITT) {
        status.textContent = 'Messreihe bei Δφ = ' + p + '° (' + (neu.length + 1) + ' von ' + anzahl() + ') …';
        const m = M.messreihe(p), k1 = m['in'].k1 + m.out.k1, k2 = m['in'].k2 + m.out.k2;   // vorab gewürfelt, angezeigt im Zeitraffer
        if (ms > 0) {
          let wechsel = 0, wahl = 'in';
          await M.hochzaehlen(0, 0, k1, k2, ms, (c1, c2, d) => {
            const t = Date.now(); if (t - wechsel > 70) { wahl = wahl === 'in' ? 'out' : 'in'; wechsel = t; }
            zeichne(p, c1, c2, { choice: wahl, d, src: d > 0, caption: 'entscheidet für jedes Photon' });
          });
        } else zeichne(p, k1, k2, {});
        neu.push({ phi: p, 'in': m['in'], out: m.out }); anz = neu.slice();
        fuell.style.width = (100 * anz.length / anzahl()) + '%'; dia.setze(anz, 'Startet den Messdurchlauf.');
      }
      s = { run: neu.map((r) => ({ phi: r.phi, 'in': Object.assign({}, r['in']), out: Object.assign({}, r.out) })) };   // Wert erst jetzt
      beschaeftigt = false; zeige();
      M.melde(el);
    }

    el._ddWert = () => ({ run: s.run.map((r) => ({ phi: r.phi, 'in': Object.assign({}, r['in']), out: Object.assign({}, r.out) })) });
    el._ddLaden = (w) => { if (beschaeftigt) return; s = fuelle(w); anz = s.run.slice(); const l = s.run[s.run.length - 1]; zeichne(l ? l.phi : 0, 0, 0, {}); zeige(); };
    el._ddProtokoll = (w) => { const r = fuelle(w).run; return [
      { typ: 'grafik', titel: 'Messdurchlauf, Strahlteiler 2 drin', svg: diagramm(r, 'in', 'Kein Messdurchlauf vorhanden.'), breite_mm: 110 },
      { typ: 'grafik', titel: 'Messdurchlauf, Strahlteiler 2 draußen', svg: diagramm(r, 'out', 'Kein Messdurchlauf vorhanden.'), breite_mm: 110 }]; };
    zeichne(0, 0, 0, {}); zeige();
  }

  function initErgebnis(el) {
    if (el._deLaden) return;   // schon aufgebaut
    el._deLaden = true;
    const flaeche = el.querySelector('.fx-werkzeug-flaeche'), quelle = M.konfig(el).quelle, dia = diagramme();
    flaeche.appendChild(dia.el);
    const lade = () => M.lies(quelle).then((w) => dia.setze(fuelle(w).run, 'Kein Messdurchlauf vorhanden.'));
    el.ownerDocument.addEventListener('fx:geaendert', (e) => { if (e.detail && e.detail.id === quelle) lade(); });
    dia.setze([], 'Kein Messdurchlauf vorhanden.'); lade();
  }

  function init(el) {
    if (el._ddWert) return;   // schon aufgebaut
    initLauf(el, el.querySelector('.fx-werkzeug-flaeche'));
  }

  FX.felder.registriere('dcdurchlauf', {
    init: init,
    laden: (el, w) => { if (!el._ddWert) init(el); el._ddLaden(w); },
    wert: (el) => { if (!el._ddWert) init(el); return el._ddWert(); },
    begonnen: (w) => fuelle(w).run.length > 0,
    leer: (w) => fuelle(w).run.length < anzahl(),   // erledigt bei vollständigem Durchlauf
    protokoll: (el, w) => { if (!el._ddWert) init(el); return el._ddProtokoll(w); }
  });
  FX.felder.registriere('dcergebnis', {
    init: initErgebnis,
    laden: (el) => { if (!el._deLaden) initErgebnis(el); },
    wert: () => ({}),
    leer: () => false,
    ohneProtokoll: true
  });
})(typeof self !== 'undefined' ? self : this);
