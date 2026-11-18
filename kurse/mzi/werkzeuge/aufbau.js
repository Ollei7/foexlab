/* Werkzeug „aufbau“ (Kapitel 1, Aufbau 1 bis 3): Einzelphotonenquelle, 1 / 100 / 1000 Photonen auf einmal.
   Konfig: modus "1" | "2" | "3" (Aufbau), vorhersage "<feld-id>" (Hypothese, wird für den Vergleich gelesen).
   Wahrscheinlichkeit für Detektor 1: ½ (Aufbau 1 und 2), 1 (Aufbau 3, Interferenz bei Δφ = 0°).
   Wert: {n1, n2, log: [{n, k1, k2}]}. „change“ erst am Ende der Animation; währenddessen sind die Knöpfe gesperrt. */
(function (root) {
  const FX = root.FX, M = FX.mzi, h = M.h;
  const MS = { 1: 800, 100: 500, 1000: 900 };   // Dauer der Animation (Einzelphoton: 350 + 450 ms)

  const zaehl = (x) => (typeof x === 'number' && isFinite(x) && x >= 0 ? Math.round(x) : 0);
  function fuelle(w) {
    const s = { n1: 0, n2: 0, log: [] };
    ((w && w.log) || []).forEach((r) => { if (r) s.log.push({ n: zaehl(r.n), k1: zaehl(r.k1), k2: zaehl(r.k2) }); });
    s.n1 = s.log.reduce((a, r) => a + r.k1, 0); s.n2 = s.log.reduce((a, r) => a + r.k2, 0);
    if (w && !s.log.length) { s.n1 = zaehl(w.n1); s.n2 = zaehl(w.n2); }
    return s;
  }
  const gesamt = (s) => s.n1 + s.n2;

  function init(el) {
    if (el._abLaden) return;   // schon aufgebaut (Engine und laden() rufen beide init)
    const flaeche = el.querySelector('.fx-werkzeug-flaeche'), k = M.konfig(el), modus = k.modus || '1', p = modus === '3' ? 1 : 0.5;
    const ziel = Number(M.EINST.AUFBAU_PHOTONEN);
    let s = fuelle(null), pred = null, beschaeftigt = false, ansicht = 'tabelle';
    const zeichnung = h('div', { 'class': 'mzi-zeichnung' });
    const knoepfe = [1, 100, 1000].map((n) => h('button', { type: 'button', 'class': 'fx-knopf fx-haupt', 'data-schuss': n, onclick: () => schiesse(n) }, n === 1 ? '1 Photon' : n + ' Photonen'));
    const status = h('p', { 'class': 'mzi-status', role: 'status', 'data-o': 'st' });
    const zaehler = [1, 2].map((d) => ({ n: h('div', { 'class': 'mzi-n', 'data-o': 'n' + d }, '0'), r: h('div', { 'class': 'mzi-r', 'data-o': 'r' + d }, '–') }));
    const zaehlerEl = h('div', { 'class': 'mzi-zaehler' }, zaehler.map((z, i) => h('div', { 'class': 'mzi-zelle mzi-d' + (i + 1) }, h('div', { 'class': 'mzi-k' }, 'Detektor ' + (i + 1)), z.n, z.r)));
    const tbody = h('tbody'), tfoot = h('tfoot');
    const log = h('div', { 'class': 'mzi-log fx-tab-wrap' }, h('table', {}, h('thead', {}, h('tr', {}, ['Nr.', 'Photonen', 'D1', 'D2', 'Summe'].map((t) => h('th', {}, t)))), tbody, tfoot));
    const balken = h('div', { 'class': 'mzi-balken', hidden: true });
    const vergleich = h('p', { 'class': 'mzi-vergleich', 'data-o': 'cmp' });
    const umschalter = ['tabelle', 'balken'].map((a) => h('button', { type: 'button', 'class': 'fx-knopf', 'data-ansicht': a, 'aria-pressed': a === ansicht ? 'true' : 'false', onclick: () => { ansicht = a; zeigeAnsicht(); } }, a === 'tabelle' ? 'Tabelle' : 'Balken'));

    flaeche.appendChild(h('div', { 'class': 'fx-mzi-lab' }, zeichnung,
      h('div', { 'class': 'mzi-bedienung' }, h('div', { 'class': 'fx-knoepfe' }, knoepfe), zaehlerEl, status,
        h('div', { 'class': 'mzi-protokollkopf' }, h('strong', {}, 'Messprotokoll'), h('div', { 'class': 'fx-knoepfe' }, umschalter)),
        log, balken, vergleich)));

    function zeichne(c1, c2, d, src) { zeichnung.innerHTML = M.aufbauSVG('a' + modus, { c1, c2, d, src }); }
    function zeigeAnsicht() {
      log.hidden = ansicht !== 'tabelle'; balken.hidden = ansicht !== 'balken';
      umschalter.forEach((b) => b.setAttribute('aria-pressed', b.getAttribute('data-ansicht') === ansicht ? 'true' : 'false'));
    }
    function predWerte() { return pred ? [pred.p1, pred.p2] : null; }
    function zeige() {
      const N = gesamt(s), dez = N >= 1000 ? 1 : 0;
      knoepfe.forEach((b) => { b.disabled = beschaeftigt; });
      zaehler[0].n.textContent = s.n1; zaehler[1].n.textContent = s.n2;
      zaehler[0].r.textContent = N ? M.pct(s.n1 / N, dez) : '–'; zaehler[1].r.textContent = N ? M.pct(s.n2 / N, dez) : '–';
      status.textContent = N < ziel ? N + ' von ' + ziel + ' Photonen gemessen. Noch ' + (ziel - N) + ' bis zum Abgleich.' : N + ' Photonen gemessen. Der Abgleich ist frei. Ihr könnt auch weiter messen.';
      tbody.innerHTML = '';
      if (!s.log.length) tbody.appendChild(h('tr', {}, h('td', { colspan: 5, 'class': 'mzi-leer' }, 'Noch keine Messung.')));
      let summe = 0;
      s.log.forEach((r, i) => { summe += r.n; tbody.appendChild(h('tr', {}, h('td', {}, i + 1), h('td', {}, r.n), h('td', { 'class': 'c1' }, r.k1), h('td', { 'class': 'c2' }, r.k2), h('td', {}, summe))); });
      tfoot.innerHTML = '';
      if (N) tfoot.appendChild(h('tr', {}, h('td', {}, 'Summe'), h('td', {}, N), h('td', {}, s.n1 + ' (' + M.pct(s.n1 / N, dez) + ')'), h('td', {}, s.n2 + ' (' + M.pct(s.n2 / N, dez) + ')'), h('td', {}, N)));
      balken.innerHTML = M.balkenSVG(s.n1, s.n2, predWerte()) + '<p class="mzi-hinweis">Balken: gemessener Anteil der Messergebnisse. Gestrichelt: eure Hypothese.</p>';
      vergleich.textContent = pred && N ? 'Eure Hypothese: ' + pred.p1 + ' % : ' + pred.p2 + ' % · Ergebnis: ' + M.pct(s.n1 / N, dez) + ' : ' + M.pct(s.n2 / N, dez) + ' (' + N + ' Photonen)' : '';
      zeigeAnsicht();
    }

    async function schiesse(n) {
      if (beschaeftigt) return;
      beschaeftigt = true; zeige();
      let k1;
      if (n === 1) {
        k1 = Math.random() < p ? 1 : 0;
        zeichne(s.n1, s.n2, 0, true); await M.pause(350);
        zeichne(s.n1 + k1, s.n2 + 1 - k1, k1 ? 1 : 2, false); await M.pause(450);
      } else {
        k1 = M.binom(n, p);
        await M.hochzaehlen(s.n1, s.n2, k1, n - k1, MS[n] || 900, (c1, c2, d) => zeichne(c1, c2, d, d > 0));
      }
      s.n1 += k1; s.n2 += n - k1; s.log.push({ n, k1, k2: n - k1 });
      beschaeftigt = false; zeichne(s.n1, s.n2, 0, false); zeige();
      M.melde(el);
    }

    /* Vorhersage aus dem Speicher lesen (Hypothese, Feld-ID in der Konfiguration) und bei Änderung nachführen */
    function ladePred() {
      if (!k.vorhersage) return Promise.resolve();
      return M.lies(k.vorhersage).then((w) => {
        pred = w && typeof w.p1 === 'number' && typeof w.p2 === 'number' && w.p1 + w.p2 === 100 ? { p1: w.p1, p2: w.p2 } : null;
        zeige();
      });
    }
    el.ownerDocument.addEventListener('fx:geaendert', (e) => { if (e.detail && e.detail.id === k.vorhersage) ladePred(); });

    el._abWert = () => ({ n1: s.n1, n2: s.n2, log: s.log.map((r) => ({ n: r.n, k1: r.k1, k2: r.k2 })) });
    el._abLaden = (w) => { s = fuelle(w); zeichne(s.n1, s.n2, 0, false); zeige(); ladePred(); };
    zeichne(0, 0, 0, false); zeige(); ladePred();
  }

  FX.felder.registriere('aufbau', {
    init: init,
    laden: (el, w) => { if (!el._abLaden) init(el); el._abLaden(w); },
    wert: (el) => { if (!el._abWert) init(el); return el._abWert(); },
    begonnen: (w) => !!w && zaehl(w.n1) + zaehl(w.n2) > 0,   // schon ab dem ersten Photon: Hypothese festhalten
    leer: (w) => !(w && zaehl(w.n1) + zaehl(w.n2) >= M.EINST.AUFBAU_PHOTONEN),
    protokoll: (el, w) => {
      const s = fuelle(w); let summe = 0;
      return [
        { typ: 'tabelle', kopf: ['Nr.', 'Photonen', 'D1', 'D2', 'Summe'], zeilen: s.log.map((r, i) => { summe += r.n; return [String(i + 1), String(r.n), String(r.k1), String(r.k2), String(summe)]; }) },
        { typ: 'grafik', svg: M.balkenSVG(s.n1, s.n2, null), breite_mm: 110 }
      ];
    }
  });
})(typeof self !== 'undefined' ? self : this);
