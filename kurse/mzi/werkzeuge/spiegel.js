/* Werkzeug „spiegel“ (Kapitel 1, Spiegel verschieben): Aufbau 3 mit verschiebbarem Spiegel, Gangunterschied Δs 0 bis λ in λ/16-Schritten (intern Grad, 360° = λ).
   Knopf „1000 Photonen messen“ würfelt jedes Photon einzeln (P(D1) = cos²(Δφ/2)); Tabelle und Diagramm (Anteil über Δφ),
   optional mit theoretischem Verlauf. Wert: {log: [{phi, n, k1, k2}]}.
   Erledigt (nicht leer) bei mindestens EINST.SPIEGEL_PHASEN verschiedenen Δφ; „begonnen“ ab der ersten Messung (Hypothese festhalten).
   „change“ erst am Ende der Animation; währenddessen sind Knopf und Regler gesperrt. */
(function (root) {
  const FX = root.FX, M = FX.mzi, h = M.h;

  const zaehl = (x) => (typeof x === 'number' && isFinite(x) && x >= 0 ? Math.round(x) : 0);
  const gradWert = (x) => (typeof x === 'number' && isFinite(x) ? Math.max(0, Math.min(360, Math.round(x * 2) / 2)) : 0);
  function fuelle(w) {
    const log = [];
    ((w && w.log) || []).forEach((r) => { if (r && zaehl(r.n) > 0) log.push({ phi: gradWert(r.phi), n: zaehl(r.n), k1: zaehl(r.k1), k2: zaehl(r.k2) }); });
    return { log };
  }
  /* Messungen bei gleichem Δφ zusammenfassen */
  function mittel(log) {
    const m = {};
    log.forEach((r) => { const e = m[r.phi] || (m[r.phi] = { n: 0, k1: 0, k2: 0 }); e.n += r.n; e.k1 += r.k1; e.k2 += r.k2; });
    return m;
  }
  const phasen = (log) => Object.keys(mittel(log)).map(Number).sort((a, b) => a - b);
  function diagramm(log, theorie) {
    const m = mittel(log), ks = Object.keys(m).map(Number);
    return M.diagrammSVG({ ymax: 1, yticks: [0, 0.25, 0.5, 0.75, 1], yfmt: (v) => v * 100 + ' %', ylabel: 'Anteil der Messergebnisse',
      series: [
        { name: 'Detektor 1', color: M.P.cAB, pts: ks.map((p) => [p, m[p].k1 / m[p].n]), theory: theorie ? (p) => M.pD1(true, p) : null },
        { name: 'Detektor 2', color: M.P.cAC, shape: 'square', pts: ks.map((p) => [p, m[p].k2 / m[p].n]), theory: theorie ? (p) => 1 - M.pD1(true, p) : null }] });
  }

  function init(el) {
    if (el._spLaden) return;   // schon aufgebaut
    const flaeche = el.querySelector('.fx-werkzeug-flaeche');
    const N = M.EINST.SPIEGEL_PHOTONEN, ziel = M.EINST.SPIEGEL_PHASEN;
    let s = fuelle(null), phi = 0, beschaeftigt = false, ansicht = 'tabelle';
    const zeichnung = h('div', { 'class': 'mzi-zeichnung' });
    const regler = M.phaseRegler(0, (v) => { phi = v; zeichne(); });
    const messen = h('button', { type: 'button', 'class': 'fx-knopf fx-haupt', 'data-o': 'messen', onclick: () => messe() }, N + ' Photonen messen');
    const status = h('p', { 'class': 'mzi-status', role: 'status', 'data-o': 'st' });
    const tbody = h('tbody');
    const tabelle = h('div', { 'class': 'mzi-log fx-tab-wrap', 'data-o': 'tabelle' }, h('table', {}, h('thead', {}, h('tr', {},
      ['Δs', 'Photonen', 'Messergebnisse D1', 'Messergebnisse D2', 'Anteil D1', 'Anteil D2'].map((t) => h('th', {}, t)))), tbody));
    const bild = h('div', { 'class': 'mzi-diagramm', 'data-o': 'diagramm' });
    const theorie = h('input', { type: 'checkbox', 'data-o': 'theorie' });
    theorie.addEventListener('change', () => zeige());
    const diaBox = h('div', { hidden: true }, bild, h('label', { 'class': 'mzi-theorie' }, theorie, ' Theoretischen Verlauf einblenden'));
    const umschalter = ['tabelle', 'diagramm'].map((a) => h('button', { type: 'button', 'class': 'fx-knopf', 'data-ansicht': a, 'aria-pressed': a === ansicht ? 'true' : 'false',
      onclick: () => { ansicht = a; zeige(); } }, a === 'tabelle' ? 'Tabelle' : 'Diagramm'));

    flaeche.appendChild(h('div', { 'class': 'fx-mzi-lab' }, zeichnung,
      h('div', { 'class': 'mzi-bedienung' }, regler.el, h('div', { 'class': 'fx-knoepfe' }, messen), status,
        h('div', { 'class': 'mzi-protokollkopf' }, h('strong', {}, 'Messungen'), h('div', { 'class': 'fx-knoepfe' }, umschalter)), tabelle, diaBox)));

    function zeichne(c1, c2, d) {
      const letzte = s.log[s.log.length - 1], gleich = !!letzte && letzte.phi === phi;
      zeichnung.innerHTML = M.aufbauSVG('a3', { phaseOn: true, phi, c1: c1 == null ? (gleich ? letzte.k1 : 0) : c1, c2: c2 == null ? (gleich ? letzte.k2 : 0) : c2,
        d: d || 0, src: (d || 0) > 0, detLabel: gleich || c1 != null ? 'Messergebnisse der letzten Messung' : '' });
    }
    function zeige() {
      const ph = phasen(s.log);
      regler.sperre(beschaeftigt); messen.disabled = beschaeftigt;
      status.textContent = ph.length < ziel ? 'Gemessen bei ' + ph.length + ' von ' + ziel + ' Gangunterschieden' + (ph.length ? ': ' + ph.map(M.DS).join(', ') : '') + '.'
        : 'Gemessen bei ' + ph.length + ' Gangunterschieden. Der Abgleich ist frei.';
      tbody.innerHTML = '';
      if (!s.log.length) tbody.appendChild(h('tr', {}, h('td', { colspan: 6, 'class': 'mzi-leer' }, 'Noch keine Messung.')));
      s.log.forEach((r) => tbody.appendChild(h('tr', {}, h('td', {}, M.DS(r.phi)), h('td', {}, r.n), h('td', { 'class': 'c1' }, r.k1), h('td', { 'class': 'c2' }, r.k2),
        h('td', {}, M.pct(r.k1 / r.n, 1)), h('td', {}, M.pct(r.k2 / r.n, 1)))));
      bild.innerHTML = diagramm(s.log, theorie.checked) + '<p class="mzi-hinweis">Jeder Punkt: Anteil der Messergebnisse bei diesem Gangunterschied (mehrere Messungen beim selben Gangunterschied werden zusammengefasst).' +
        (theorie.checked ? ' Gestrichelt: theoretischer Verlauf.' : '') + '</p>';
      tabelle.hidden = ansicht !== 'tabelle'; diaBox.hidden = ansicht !== 'diagramm';
      umschalter.forEach((b) => b.setAttribute('aria-pressed', b.getAttribute('data-ansicht') === ansicht ? 'true' : 'false'));
    }

    async function messe() {
      if (beschaeftigt) return;
      beschaeftigt = true; zeige();
      const p = phi, k1 = M.binom(N, M.pD1(true, p));
      await M.hochzaehlen(0, 0, k1, N - k1, 800, (c1, c2, d) => zeichne(c1, c2, d));
      s.log.push({ phi: p, n: N, k1, k2: N - k1 });
      beschaeftigt = false; zeichne(); zeige();
      M.melde(el);
    }

    el._spWert = () => ({ log: s.log.map((r) => ({ phi: r.phi, n: r.n, k1: r.k1, k2: r.k2 })) });
    el._spLaden = (w) => {
      s = fuelle(w); const l = s.log[s.log.length - 1]; phi = l ? l.phi : 0; regler.setze(phi); zeichne(); zeige();
    };
    zeichne(); zeige();
  }

  FX.felder.registriere('spiegel', {
    init: init,
    laden: (el, w) => { if (!el._spLaden) init(el); el._spLaden(w); },
    wert: (el) => { if (!el._spWert) init(el); return el._spWert(); },
    begonnen: (w) => fuelle(w).log.length > 0,   // schon ab der ersten Messung: Hypothese festhalten
    leer: (w) => phasen(fuelle(w).log).length < M.EINST.SPIEGEL_PHASEN,
    protokoll: (el, w) => {
      const s = fuelle(w);
      return [
        { typ: 'tabelle', kopf: ['Δs', 'Photonen', 'D1', 'D2', 'Anteil D1', 'Anteil D2'],
          zeilen: s.log.map((r) => [M.DS(r.phi), String(r.n), String(r.k1), String(r.k2), M.pct(r.k1 / r.n, 1), M.pct(r.k2 / r.n, 1)]) },
        { typ: 'grafik', svg: diagramm(s.log, false), breite_mm: 110 }
      ];
    }
  });

  if (root.document && root.document.head && !root.document.getElementById('mzi-sp-stil')) {
    const st = root.document.createElement('style'); st.id = 'mzi-sp-stil';
    st.textContent = `.mzi-theorie{display:flex;align-items:center;gap:8px;min-height:44px}`;
    root.document.head.appendChild(st);
  }
})(typeof self !== 'undefined' ? self : this);
