/* MZI mit einzelnen Photonen: Kern für die Werkzeuge dieses Kurses (Modell, Zeichnungen, Diagramme, Helfer).
   Übernommen aus „MZI einzelne Photonen/Technik/simulation.js“ (Logik und Zeichnung unverändert), aber als Funktionen,
   die Strings bzw. Elemente liefern. Gezeichnet werden nur Bauteile: keine Strahlengänge, keine Photonenbahnen, keine geteilten Photonen.
   Modell: ohne Strahlteiler 2 ist P(D1) = ½, mit Strahlteiler 2 ist P(D1) = cos²(Δφ/2), P(D2) = sin²(Δφ/2). Jeder Klick wird einzeln gewürfelt.
   Schreibweise: ES2015 wie in der Quelle (const/let, Pfeilfunktionen, Template-Strings), damit die SVG-Übernahme prüfbar bleibt. */
(function (root) {
  const FX = root.FX = root.FX || {};

  /* ===================== Einstellungen (Schwellen der Spec) ===================== */
  const EINST = {
    AUFBAU_PHOTONEN: 5000,   // Aufbauten: Photonen pro Aufbau, bevor der Abgleich frei wird
    SPIEGEL_PHASEN: 5,       // Armlänge verändern: verschiedene Gangunterschiede
    SPIEGEL_PHOTONEN: 1000,  // Spiegel verschieben: Photonen pro Messung
    EINZEL: 10,              // delayed choice, Schritt 1: Einzelmessungen
    MW_PHOTONEN: 1000,       // delayed choice: Einzelmessungen pro Messreihe (1 s)
    S2_REIHEN: 3,            // Schritt 2: Messreihen bei Δs = 0
    S3_PHASEN: 3, S3_JE: 2,  // Schritt 3: weitere Gangunterschiede mit je 2 Messreihen
    REGLER_SCHRITT: 22.5,    // Regler in Grad: 22,5° = λ/16 (v3: Gangunterschied statt Phasendifferenz)
    LAUF_SCHRITT: 22.5, LAUF_MS: 400   // Schritt 5: Schrittweite in Grad (λ/16), Dauer pro Schritt im Zeitraffer (ms)
  };

  /* ===================== Palette und Textstile der Zeichnungen ===================== */
  /* Alle SVG-Erzeuger schreiben Farben und Schrift als Attribute (keine CSS-Variablen, keine Klassen), damit dieselbe
     Zeichnung auf der Seite und beim Rastern für das PDF (data:-URI) gleich aussieht. Werte wie basis.css (foeXlab-Palette). */
  const P = {
    navy: '#33416E', blauTint: '#E8F2FA', grau: '#D9DBE2', orange: '#F58411', orangeTint: '#FEEFDC',
    bank: '#F6F9FC', loch: '#DCE3EC', gedaempft: '#6B7080', linie: '#D9DBE2', cAB: '#3F9AD6', cAC: '#CF6F82', licht: '#F58411', weiss: '#fff'
  };
  const SCHRIFT = 'font-family="Helvetica, Arial, sans-serif"';
  const A = {
    label: `${SCHRIFT} font-size="14" fill="${P.gedaempft}"`,
    name: `${SCHRIFT} font-size="15" font-weight="700" fill="${P.navy}"`,
    nameW: `${SCHRIFT} font-size="15" font-weight="700" fill="${P.weiss}"`,
    count: `${SCHRIFT} font-size="24" font-weight="800" fill="${P.navy}"`,
    dev: `fill="${P.weiss}" stroke="${P.navy}" stroke-width="2"`,
    wire: `stroke="${P.grau}" stroke-width="2" fill="none"`
  };

  /* ===================== Modell ===================== */
  const rad = (d) => d * Math.PI / 180;
  /* Gangunterschied als Bruchteil von λ (v3). Intern bleibt der Wert in Grad: 360° = λ. 180 → „λ/2“, 0 → „0“;
     Werte außerhalb des λ/16-Rasters (ältere Speicherstände in 10°-Schritten) als Dezimalbruch „0,03 λ“. */
  const ggt = (a, b) => b ? ggt(b, a % b) : a;
  function lamBruch(z, n) {
    if (!z) return '0';
    const g = ggt(z, n); z /= g; n /= g;
    return n === 1 ? (z === 1 ? 'λ' : z + 'λ') : (z === 1 ? '' : z) + 'λ/' + n;
  }
  const DS = (phi) => { const k = phi / 22.5; return Math.abs(k - Math.round(k)) < 1e-6 ? lamBruch(Math.round(k), 16) : (phi / 360).toFixed(2).replace('.', ',') + ' λ'; };
  const pD1 = (drin, phiGrad) => drin ? Math.cos(rad(phiGrad) / 2) ** 2 : 0.5;   // Wahrscheinlichkeit für Detektor 1
  function binom(n, p, zufall) {
    zufall = zufall || Math.random;
    let k = 0; for (let i = 0; i < n; i++) if (zufall() < p) k++;
    return k;
  }
  /* Ein Photon: Strahlteiler 2 zufällig drin/draußen, dann Detektor */
  function einzel(phi, zufall) {
    zufall = zufall || Math.random;
    const drin = zufall() < 0.5, d = zufall() < pD1(drin, phi) ? 1 : 2;
    return { c: drin ? 'in' : 'out', d };
  }
  /* Eine Messreihe: MW_PHOTONEN Einzelmessungen, für jedes Photon neue Zufallsentscheidung */
  function messreihe(phi, zufall) {
    const m = { phi, in: { n: 0, k1: 0, k2: 0 }, out: { n: 0, k1: 0, k2: 0 } };
    for (let i = 0; i < EINST.MW_PHOTONEN; i++) {
      const e = einzel(phi, zufall);
      m[e.c].n++; m[e.c]['k' + e.d]++;
    }
    return m;
  }

  /* ===================== Helfer ===================== */
  const pct = (x, dez) => (100 * x).toFixed(dez || 0).replace('.', ',') + ' %';
  const wartePause = (ms) => new Promise((r) => setTimeout(r, ms));
  let zaehler = 0;   // eindeutige IDs je Zeichnung (mehrere SVGs auf einer Seite)

  /* DOM-Helfer: h('div', {class: 'x', 'data-a': 1, onclick: fn}, kind, 'Text', …) – wie FX.bb84.h */
  function h(tag, attr) {
    const e = root.document.createElement(tag);
    Object.keys(attr || {}).forEach((k) => {
      const v = attr[k]; if (v === null || v === undefined || v === false) return;
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
  /* change (bubbles) am Feld: erst am Ende einer Animation aufrufen */
  function melde(el) { el.dispatchEvent(new root.Event('change', { bubbles: true })); }
  function lies(id) {
    try {
      return Promise.resolve(FX.felder.speicher().lies(id)).then((v) => v, () => undefined);
    } catch (e) { return Promise.resolve(undefined); }
  }
  function konfig(el) {
    try { return JSON.parse(el.getAttribute('data-fx-konfig')) || {}; } catch (e) { return {}; }
  }

  /* ===================== Zeichnung des Aufbaus (nur Bauteile) ===================== */
  // Quelle links oben, Strahlteiler 1 bei (300,110), Spiegel bei (600,110) und (300,320),
  // Strahlteiler 2 bei (600,320), Detektor 1 rechts, Detektor 2 unten.
  function bsSVG(x, y, opt) {
    opt = opt || {};
    const ghost = opt.ghost, q = opt.unknown;
    return `<g transform="translate(${x} ${y})">
    <rect x="-17" y="-17" width="34" height="34" fill="${ghost || q ? '#fff' : P.blauTint}" stroke="${ghost ? P.grau : P.navy}" stroke-width="2" ${ghost || q ? 'stroke-dasharray="5 4"' : ''}/>
    ${ghost || q ? '' : `<line x1="-17" y1="-17" x2="17" y2="17" stroke="${P.navy}" stroke-width="2"/>`}
    ${q ? `<text x="0" y="6" text-anchor="middle" ${A.name}>?</text>` : ''}</g>`;
  }
  function mirrorSVG(x, y, back) {   // back = +1: Rückseite oben rechts, −1: unten links
    back = back || 1;
    let s = ''; for (let i = -14; i <= 14; i += 7) s += `<line x1="${i + 3 * back}" y1="${i - 3 * back}" x2="${i + 9 * back}" y2="${i - 9 * back}" stroke="${P.navy}" stroke-width="1.2"/>`;
    return `<g transform="translate(${x} ${y})"><line x1="-20" y1="-20" x2="20" y2="20" stroke="${P.navy}" stroke-width="5"/>${s}</g>`;
  }
  function detSVG(n, x, y, on, count, label2, glow) {
    const col = n === 1 ? P.cAB : P.cAC;
    return `<g>
    <circle cx="${x + 104}" cy="${y + 32}" r="26" fill="${col}" filter="url(#${glow})" opacity="${on ? 0.9 : 0}"/>
    <rect x="${x}" y="${y}" width="130" height="64" ${A.dev}/>
    <rect x="${x}" y="${y}" width="6" height="64" fill="${col}"/>
    <text x="${x + 14}" y="${y + 22}" ${A.name}>Detektor ${n}</text>
    <text x="${x + 14}" y="${y + 52}" ${A.count}>${count == null ? '' : count}</text>
    ${label2 ? `<text x="${x + 65}" y="${y - 8}" text-anchor="middle" ${A.label}>${label2}</text>` : ''}
    <circle cx="${x + 108}" cy="${y + 40}" r="11" fill="${on ? col : P.linie}"/></g>`;
  }
  function schirmLaserSVG(n, x, y) {   // Schirm mit Farbstreifen wie der Detektor, ohne Zähler
    return `<g><rect x="${x}" y="${y}" width="130" height="64" ${A.dev}/><rect x="${x}" y="${y}" width="6" height="64" fill="${n === 1 ? P.cAB : P.cAC}"/>` +
      `<text x="${x + 18}" y="${y + 38}" ${A.name}>Schirm ${n}</text></g>`;
  }
  /* modus: 'a1' | 'a2' | 'a3' | 'dc' | 'laser' (Laser, Spiegel, Strahlteiler 2, Schirme; st wird nicht gebraucht)
     st: { c1, c2, d (aufleuchtender Detektor), src, phaseOn, phi, choice ('in'|'out'|null), caption, detLabel } */
  function aufbauSVG(mode, st) {
    st = st || {};
    const id = ++zaehler, glow = 'mzi-glow-' + id, holes = 'mzi-holes-' + id;
    let parts = '', dets = '';
    const c1 = st.c1 == null ? 0 : st.c1, c2 = st.c2 == null ? 0 : st.c2;
    if (mode === 'laser') {
      parts = mirrorSVG(600, 110) + mirrorSVG(300, 320, -1) + bsSVG(600, 320) +
        `<text x="630" y="96" ${A.name}>Spiegel 1</text><text x="200" y="352" ${A.name}>Spiegel 2</text>` +
        `<text x="574" y="298" text-anchor="end" ${A.name}>Strahlteiler 2</text>`;
      dets = schirmLaserSVG(1, 670, 288) + schirmLaserSVG(2, 535, 380);
    } else if (mode === 'a1') {
      dets = detSVG(1, 660, 78, st.d === 1, c1, 'Transmission', glow) + detSVG(2, 235, 380, st.d === 2, c2, '', glow) +
        `<text x="318" y="356" ${A.label}>Reflexion</text>`;
    } else {
      parts = mirrorSVG(600, 110) + mirrorSVG(300, 320, -1) +
        `<text x="630" y="96" ${A.name}>Spiegel 1</text><text x="200" y="352" ${A.name}>Spiegel 2</text>`;
      if (st.phaseOn) parts += `<text x="630" y="116" ${A.label}>Arm verlängert um Δs = ${DS(st.phi)}</text>`;
      if (mode === 'a2') parts += `<text x="574" y="298" text-anchor="end" ${A.label}>hier kein Strahlteiler</text>`;
      if (mode === 'a3') parts += bsSVG(600, 320) + `<text x="574" y="298" text-anchor="end" ${A.name}>Strahlteiler 2</text>`;
      if (mode === 'dc') {
        const c = st.choice;
        parts += (c === 'in' ? bsSVG(600, 320) : c === 'out' ? bsSVG(600, 320, { ghost: true }) : bsSVG(600, 320, { unknown: true })) +
          `<text x="574" y="298" text-anchor="end" ${A.name}>Strahlteiler 2</text><text x="574" y="278" text-anchor="end" ${A.label}>schaltbar</text>` +
          `<path ${A.wire} d="M725 230 L725 260 L628 300"/>` +
          `<rect x="650" y="170" width="150" height="60" ${A.dev}/><rect x="650" y="170" width="150" height="6" fill="${P.orange}"/>` +
          `<text x="725" y="196" text-anchor="middle" ${A.name}>Zufallsgenerator</text>` +
          `<text x="725" y="218" text-anchor="middle" ${A.label}>${c === 'in' ? 'Strahlteiler 2: drin' : c === 'out' ? 'Strahlteiler 2: draußen' : st.caption || 'wartet'}</text>`;
      }
      dets = detSVG(1, 670, 288, st.d === 1, c1, '', glow) + detSVG(2, 535, 380, st.d === 2, c2, '', glow) +
        (st.detLabel ? `<text x="735" y="374" text-anchor="middle" ${A.label}>${st.detLabel}</text>` : '');
    }
    return `<svg class="mzi-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 820 460" role="img" aria-label="Versuchsaufbau"><defs>
      <pattern id="${holes}" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1.6" fill="${P.loch}"/></pattern>
      <filter id="${glow}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="9"/></filter></defs>
    <rect width="820" height="460" fill="${P.bank}"/><rect width="820" height="460" fill="url(#${holes})"/>
    <rect x="30" y="80" width="170" height="60" fill="${P.navy}"/><rect x="30" y="80" width="170" height="6" fill="${P.orange}"/>
    ${mode === 'laser' ? `<text x="115" y="116" text-anchor="middle" ${A.nameW}>Laser</text>` :
      `<text x="115" y="106" text-anchor="middle" ${A.nameW}>Einzelphotonen-</text>
    <text x="115" y="125" text-anchor="middle" ${A.nameW}>quelle</text>
    <circle cx="188" cy="96" r="6" fill="${st.src ? P.licht : P.gedaempft}"/>`}
    ${bsSVG(300, 110)}<text x="300" y="72" text-anchor="middle" ${A.name}>Strahlteiler${mode === 'a1' ? '' : ' 1'}</text>
    <text x="300" y="54" text-anchor="middle" ${A.label}>50 : 50</text>
    ${parts}${dets}</svg>`;
  }

  /* Skizze des realen Aufbaus mit Polarisationsfiltern in beiden Armen (Quantenradierer, Prüfidee I) */
  function polFilterSVG(x, y, vertical, deg) {   // vertical: Filter quer zu einem waagerechten Strahl
    const w = vertical ? 12 : 48, hh = vertical ? 48 : 12;
    return `<g><rect x="${x - w / 2}" y="${y - hh / 2}" width="${w}" height="${hh}" fill="${P.orangeTint}" stroke="${P.orange}" stroke-width="2"/>` +
      (vertical ? `<text x="${x}" y="${y - 34}" text-anchor="middle" ${A.name}>Polarisationsfilter</text><text x="${x}" y="${y - 52}" text-anchor="middle" ${A.label}>${deg}</text>`
        : `<text x="${x - 36}" y="${y + 5}" text-anchor="end" ${A.name}>Polarisationsfilter</text><text x="${x - 36}" y="${y + 24}" text-anchor="end" ${A.label}>${deg}</text>`) + '</g>';
  }
  function schirmSVG(n, x, y) {
    return `<g><rect x="${x}" y="${y}" width="130" height="64" ${A.dev}/><text x="${x + 14}" y="${y + 38}" ${A.name}>Schirm ${n}</text></g>`;
  }
  function polSkizzeSVG() {
    const holes = 'mzi-holes-' + (++zaehler);
    const strahl = 'stroke="#2E9E4F" stroke-width="3" fill="none" opacity="0.8"';
    return `<svg class="mzi-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 820 460" role="img" aria-label="Skizze des realen Aufbaus"><defs><pattern id="${holes}" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1.6" fill="${P.loch}"/></pattern></defs>
    <rect width="820" height="460" fill="${P.bank}"/><rect width="820" height="460" fill="url(#${holes})"/>
    <path ${strahl} d="M200 110 H600 V320 M300 110 V320 H600 M600 320 H670 M600 320 V380"/>
    <rect x="30" y="80" width="170" height="60" fill="${P.navy}"/><rect x="30" y="80" width="170" height="6" fill="${P.orange}"/>
    <text x="115" y="116" text-anchor="middle" ${A.nameW}>Laser</text>
    ${bsSVG(300, 110)}<text x="300" y="72" text-anchor="middle" ${A.name}>Strahlteiler 1</text>
    ${mirrorSVG(600, 110)}${mirrorSVG(300, 320, -1)}
    <text x="630" y="96" ${A.name}>Spiegel 1</text><text x="200" y="352" ${A.name}>Spiegel 2</text>
    ${bsSVG(600, 320)}<text x="574" y="298" text-anchor="end" ${A.name}>Strahlteiler 2</text>
    ${polFilterSVG(450, 110, true, '0°')}${polFilterSVG(300, 215, false, '90°')}
    ${schirmSVG(1, 670, 288)}${schirmSVG(2, 535, 380)}</svg>`;
  }

  /* Zählerstände laufen sichtbar hoch; zeichne(c1, c2, d) zeichnet einen Zwischenstand */
  function hochzaehlen(von1, von2, k1, k2, ms, zeichne) {
    return new Promise((res) => {
      const jetzt = () => (root.performance && root.performance.now ? root.performance.now() : Date.now());
      const takt = (fn) => (root.requestAnimationFrame ? root.requestAnimationFrame(fn) : setTimeout(fn, 16));
      const t0 = jetzt(); let l1 = 0, l2 = 0;
      (function frame() {
        const f = Math.min(1, (jetzt() - t0) / ms), a1 = Math.round(k1 * f), a2 = Math.round(k2 * f);
        const d = (a1 - l1) >= (a2 - l2) ? (a1 > l1 ? 1 : 0) : 2; l1 = a1; l2 = a2;
        zeichne(von1 + a1, von2 + a2, f < 1 ? d : 0);
        if (f < 1) takt(frame); else res();
      })();
    });
  }

  /* ===================== Diagramme ===================== */
  const KOPF = (W, H) => `<svg class="mzi-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img">`;
  // Zählrate bzw. Anteil über Δφ. series: [{ name, color, shape, pts: [[phi, y], …] }]
  function diagrammSVG(o) {
    const ymax = o.ymax, yticks = o.yticks, yfmt = o.yfmt || ((v) => v), ylabel = o.ylabel, series = o.series, trend = !!o.trend;
    const leer = o.empty || 'Noch keine Messwerte.';
    const W = 560, H = 320, L = 66, R = 16, T = 40, B = 52;
    const X = (p) => L + (W - L - R) * p / 360, Y = (v) => T + (H - T - B) * (1 - v / ymax);
    function marke(s, x, y) {
      return s.shape === 'square' ? `<rect x="${x - 5}" y="${y - 5}" width="10" height="10" fill="${s.color}"/>` : `<circle cx="${x}" cy="${y}" r="5.5" fill="${s.color}"/>`;
    }
    let g = KOPF(W, H) + `<rect width="${W}" height="${H}" fill="#fff"/>`;
    yticks.forEach((v) => { g += `<line x1="${L}" y1="${Y(v)}" x2="${W - R}" y2="${Y(v)}" stroke="${P.linie}"/><text x="${L - 8}" y="${Y(v) + 5}" text-anchor="end" ${A.label}>${yfmt(v)}</text>`; });
    [0, 90, 180, 270, 360].forEach((p) => { g += `<line x1="${X(p)}" y1="${H - B}" x2="${X(p)}" y2="${H - B + 5}" stroke="${P.gedaempft}"/><text x="${X(p)}" y="${H - B + 22}" text-anchor="middle" ${A.label}>${DS(p)}</text>`; });
    g += `<line x1="${L}" y1="${H - B}" x2="${W - R}" y2="${H - B}" stroke="${P.gedaempft}"/><line x1="${L}" y1="${T}" x2="${L}" y2="${H - B}" stroke="${P.gedaempft}"/>`;
    g += `<text x="${(L + W - R) / 2}" y="${H - 6}" text-anchor="middle" ${A.label}>Gangunterschied Δs</text>`;
    g += `<text transform="translate(16 ${(T + H - B) / 2}) rotate(-90)" text-anchor="middle" ${A.label}>${ylabel}</text>`;
    let lx = L;
    series.forEach((s) => {
      g += marke(s, lx + 6, 18) + `<text x="${lx + 18}" y="23" ${A.label}>${s.name}</text>`; lx += 150;
    });
    const any = series.some((s) => s.pts.length);
    if (!any) g += `<text x="${(L + W - R) / 2}" y="${(T + H - B) / 2}" text-anchor="middle" ${A.label}>${leer}</text>`;
    const kurve = (f, col, dash) => {
      let d = ''; for (let p = 0; p <= 360; p += 4) d += (p ? 'L' : 'M') + X(p).toFixed(1) + ' ' + Y(Math.max(0, Math.min(ymax, f(p)))).toFixed(1) + ' ';
      return `<path d="${d}" fill="none" stroke="${col}" stroke-width="2.5" ${dash ? 'stroke-dasharray="7 5"' : ''} opacity=".75"/>`;
    };
    series.forEach((s) => {
      if (s.theory) g += kurve(s.theory, s.color, true);
      if (trend && s.pts.length >= 5) g += kurve(fitSin(s.pts), s.color, false);
      s.pts.forEach((p) => { g += marke(s, X(p[0]), Y(Math.min(p[1], ymax))); });
    });
    return g + '</svg>';
  }
  // Trendlinie: y = a + b·cos Δφ + c·sin Δφ nach der Methode der kleinsten Quadrate
  function fitSin(pts) {
    const A = [[0, 0, 0], [0, 0, 0], [0, 0, 0]], v = [0, 0, 0];
    pts.forEach(([p, y]) => { const f = [1, Math.cos(rad(p)), Math.sin(rad(p))]; for (let i = 0; i < 3; i++) { v[i] += f[i] * y; for (let j = 0; j < 3; j++) A[i][j] += f[i] * f[j]; } });
    const det = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    const D = det(A), c = [0, 1, 2].map((k) => det(A.map((r, i) => r.map((x, j) => j === k ? v[i] : x))) / D);
    return (p) => c[0] + c[1] * Math.cos(rad(p)) + c[2] * Math.sin(rad(p));
  }
  const D1 = P.cAB, D2 = P.cAC;
  function ratenSVG(p1, p2, o) {
    o = o || {};
    return diagrammSVG({ ymax: 600, yticks: [0, 100, 200, 300, 400, 500, 600], ylabel: o.ylabel || 'mittlere Zählrate pro Sekunde', trend: !!o.trend, empty: o.empty || 'Noch keine Messwerte.',
      series: [{ name: 'Detektor 1', color: D1, pts: p1 }, { name: 'Detektor 2', color: D2, shape: 'square', pts: p2 }] });
  }
  // Häufigkeitsdiagramm: relative Häufigkeit der Klicks an D1 und D2, getrennt nach „drin“ und „draußen“
  function haeufigkeitSVG(groups, leer) {
    leer = leer || 'Noch keine Messung.';
    const W = 560, H = 300, L = 56, R = 16, T = 58, B = 58, Y = (v) => T + (H - T - B) * (1 - v);
    let g = KOPF(W, H) + `<rect width="${W}" height="${H}" fill="#fff"/>`;
    [0, .25, .5, .75, 1].forEach((v) => { g += `<line x1="${L}" y1="${Y(v)}" x2="${W - R}" y2="${Y(v)}" stroke="${P.linie}"/><text x="${L - 8}" y="${Y(v) + 5}" text-anchor="end" ${A.label}>${v * 100} %</text>`; });
    g += `<rect x="${L}" y="13" width="10" height="10" fill="${D1}"/><text x="${L + 16}" y="23" ${A.label}>Detektor 1</text><rect x="${L + 120}" y="13" width="10" height="10" fill="${D2}"/><text x="${L + 136}" y="23" ${A.label}>Detektor 2</text>`;
    if (!groups.some((q) => q.n)) return g + `<text x="${(L + W - R) / 2}" y="${H / 2}" text-anchor="middle" ${A.label}>${leer}</text></svg>`;
    const slot = (W - L - R) / groups.length, bw = 64;
    groups.forEach((q, i) => {
      const cx = L + slot * (i + .5);
      [[q.k1, D1], [q.k2, D2]].forEach(([k, col], j) => {
        const x = cx - bw - 4 + j * (bw + 8), f = q.n ? k / q.n : 0;
        if (q.n) g += `<rect x="${x}" y="${Y(f)}" width="${bw}" height="${Y(0) - Y(f)}" fill="${col}"/><text x="${x + bw / 2}" y="${Y(f) - 7}" text-anchor="middle" ${A.name}>${pct(f)}</text>`;
      });
      g += `<text x="${cx}" y="${H - 32}" text-anchor="middle" ${A.name}>${q.label}</text><text x="${cx}" y="${H - 12}" text-anchor="middle" ${A.label}>${q.n} Messungen</text>`;
    });
    return g + '</svg>';
  }
  // Anteile an Detektor 1 und 2 mit Hypothese (gestrichelt); vorhersage: [Prozent D1, Prozent D2]
  function balkenSVG(n1, n2, pred) {
    const W = 420, H = 260, L = 56, R = 16, T = 16, B = 40, Y = (v) => T + (H - T - B) * (1 - v);
    let g = KOPF(W, H) + `<rect width="${W}" height="${H}" fill="#fff"/>`;
    [0, .25, .5, .75, 1].forEach((v) => { g += `<line x1="${L}" y1="${Y(v)}" x2="${W - R}" y2="${Y(v)}" stroke="${P.linie}"/><text x="${L - 8}" y="${Y(v) + 5}" text-anchor="end" ${A.label}>${v * 100} %</text>`; });
    const N = n1 + n2, slot = (W - L - R) / 2, bw = 90;
    [[n1, D1, 'Detektor 1', pred && pred[0]], [n2, D2, 'Detektor 2', pred && pred[1]]].forEach(([k, col, lab, hyp], i) => {
      const x = L + slot * i + (slot - bw) / 2, f = N ? k / N : 0;
      if (N) {
        g += `<rect x="${x}" y="${Y(f)}" width="${bw}" height="${Y(0) - Y(f)}" fill="${col}"/>`;
        g += `<text x="${x + bw / 2}" y="${Math.min(Y(f) - 8, Y(0) - 8)}" text-anchor="middle" ${A.name}>${pct(f, N >= 1000 ? 1 : 0)}</text>`;
      }
      if (hyp != null) g += `<line x1="${x - 10}" y1="${Y(hyp / 100)}" x2="${x + bw + 10}" y2="${Y(hyp / 100)}" stroke="${P.navy}" stroke-width="2.5" stroke-dasharray="6 4"/>`;
      g += `<text x="${x + bw / 2}" y="${H - 14}" text-anchor="middle" ${A.name}>${lab}</text>`;
    });
    if (!N) g += `<text x="${(L + W - R) / 2}" y="${H / 2}" text-anchor="middle" ${A.label}>Noch keine Messung.</text>`;
    return g + '</svg>';
  }

  /* ===================== Bedienelemente ===================== */
  /* Zeitleiste eines Photons (vorlage.html): setze(k, wahl, det) – Schritte 0…k leuchten, k < 0 setzt alles zurück */
  function zeitleiste() {
    const wahlEl = h('small', {}, 'drin oder draußen?'), detEl = h('small', {}, 'Detektor 1 oder 2?');
    const schritte = [
      h('div', { 'data-k': 0 }, '1 Aussendung', h('small', {}, 'Quelle')),
      h('div', { 'data-k': 1 }, '2 Strahlteiler 1 durchlaufen', h('small', {}, 'Photon im Interferometer')),
      h('div', { 'data-k': 2 }, '3 Zufallsgenerator entscheidet', wahlEl),
      h('div', { 'data-k': 3 }, '4 Nachweis', detEl)
    ];
    const el = h('div', { class: 'timeline mzi-zeitleiste' }, schritte);
    function setze(k, wahl, det) {
      schritte.forEach((s, i) => s.classList.toggle('on', i <= k));
      if (k < 0) { wahlEl.textContent = 'drin oder draußen?'; detEl.textContent = 'Detektor 1 oder 2?'; }
      if (wahl != null) wahlEl.textContent = wahl;
      if (det != null) detEl.textContent = det;
    }
    setze(-1);
    return { el, setze };
  }
  /* Regler Gangunterschied Δs 0 bis λ in Schritten von λ/16 (v3; intern Grad, 360° = λ): beiAenderung(wert) bei jeder Bewegung */
  function phaseRegler(wert, beiAenderung) {
    const id = 'mzi-phi-' + (++zaehler);
    const ausgabe = h('output', { for: id }, DS(wert || 0));
    const eingabe = h('input', { type: 'range', id, min: 0, max: 360, step: EINST.REGLER_SCHRITT, value: wert || 0 });
    eingabe.addEventListener('input', () => {
      const v = Number(eingabe.value); ausgabe.textContent = DS(v);
      if (beiAenderung) beiAenderung(v);
    });
    const el = h('div', { class: 'ctl mzi-regler' },
      h('label', { for: id }, 'Arm über Spiegel 1 verlängern: Gangunterschied Δs'), ausgabe, eingabe,
      h('div', { class: 'ticks' }, h('span', {}, '0'), h('span', {}, 'λ/4'), h('span', {}, 'λ/2'), h('span', {}, '3λ/4'), h('span', {}, 'λ')));
    return {
      el,
      setze(v) { eingabe.value = v; ausgabe.textContent = DS(v); },
      sperre(b) { eingabe.disabled = !!b; }
    };
  }

  /* ===================== Stil: Layout der Bedienelemente (Farben aus der Palette P) ===================== */
  const LABOR = [
    `.mzi-k,.mzi-n,.mzi-regler label,.mzi-regler output,.mzi-pred-name,.mzi-diagramme h4,.mzi-zeitleiste div.on{color:#E2E2E2}`,
    `.mzi-zeitleiste div,.mzi-zeitleiste div small,.mzi-r,.mzi-hinweis,.mzi-regler .ticks,.mzi-pd th small{color:#B4B8C4}`,
    `.mzi-zeitleiste div{border-top-color:#444}`,
    `.mzi-regler input[type=range]{accent-color:#AEB9E0}`,
    `.mzi-vgl-frage th{background:#2A3048;color:#E2E2E2}`,
    `.fx-karte .qtext blockquote{background:#3A3024;color:#E2E2E2}`,
    `.mzi-zelle,.mzi-log th,.mzi-log td,.mzi-pd th,.mzi-pd td{border-color:#444}`,
    `.mzi-balken{background:#333}`,
    `.mzi-zitat{background:#2B2216;color:#E2E2E2}`,
    `.mzi-pd tr.mzi-falsch{background:#2B2216}`,
    `.mzi-sortieren tr.ok td{background:#1A2033}`,
    `.mzi-sortieren tr.wrong td{animation-name:mzi-blink-labor}`,
    `.mzi-svg,.mzi-diagramm svg{filter:brightness(.85)}`
  ];
  const STIL = `.mzi-svg{display:block;width:100%;height:auto}` +
    `@keyframes mzi-blink-labor{0%,100%{background:transparent}25%,75%{background:#46222A}}` +
    `.mzi-zeitleiste{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:12px}` +
    `.mzi-zeitleiste div{border-top:5px solid ${P.grau};padding-top:6px;font-size:14px;color:${P.gedaempft};line-height:1.3}` +
    `.mzi-zeitleiste div.on{border-top-color:${P.orange};color:${P.navy};font-weight:700}` +
    `.mzi-zeitleiste div small{display:block;font-weight:400;color:${P.gedaempft}}` +
    `.mzi-regler{display:grid;grid-template-columns:1fr auto;gap:2px 10px;align-items:center}` +
    `.mzi-regler label{font-weight:700;color:${P.navy}}` +
    `.mzi-regler output{font-weight:700;color:${P.navy};text-align:right;white-space:nowrap}` +
    `.mzi-regler input[type=range]{grid-column:1/-1;width:100%;accent-color:${P.navy}}` +
    `.mzi-regler input[type=range]:disabled{opacity:.5}` +
    `.mzi-regler .ticks{grid-column:1/-1;display:flex;justify-content:space-between;font-size:13px;color:${P.gedaempft}}` +
    /* Layout der Werkzeuge mit Zeichnung: Zeichnung oben; ab 900 px zweispaltig (Zeichnung links, Bedienung rechts) */
    `.fx-mzi-lab{display:grid;gap:16px;align-items:start}` +
    `@media (min-width:900px){.fx-mzi-lab{grid-template-columns:minmax(0,1.25fr) minmax(0,1fr)}}` +
    `.fx-mzi-lab .mzi-bedienung{min-width:0}` +
    `@media (min-width:900px){.fx-mzi-lab.mzi-einspaltig{grid-template-columns:minmax(0,1fr)}}` +
    `.fx-mzi-lab.mzi-einspaltig .mzi-zeichnung{max-width:600px}` +
    `.mzi-skizze-klein{max-width:520px;margin:0 0 12px}` +
    `.mzi-zaehler{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:10px 0}` +
    `.mzi-zelle{border:1px solid ${P.linie};border-top:5px solid ${P.cAB};border-radius:8px;padding:8px 12px}` +
    `.mzi-zelle.mzi-d2{border-top-color:${P.cAC}}` +
    `.mzi-k{font-weight:700;color:${P.navy}}` +
    `.mzi-n{font-size:28px;font-weight:800;color:${P.navy};font-variant-numeric:tabular-nums}` +
    `.mzi-r{color:${P.gedaempft}}` +
    `.mzi-protokollkopf{display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap}` +
    `.mzi-log{max-height:260px;overflow:auto}` +
    `.mzi-log table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}` +
    `.mzi-log th,.mzi-log td{padding:4px 8px;border-bottom:1px solid ${P.linie};text-align:right}` +
    `.mzi-log tfoot td{font-weight:700}` +
    `.mzi-hinweis{font-size:14px;color:${P.gedaempft}}` +
    `.mzi-vergleich{font-weight:600}` +
    `.mzi-pred{display:grid;gap:8px}` +
    `.mzi-pred-zeile{display:flex;align-items:center;gap:8px}` +
    `.mzi-pred-name{min-width:100px;font-weight:700;color:${P.navy}}` +
    `.mzi-pred-zeile input{width:5em;min-height:44px;font:inherit;text-align:center}` +
    /* Diagramme nebeneinander (Sortieren, Messdurchlauf, Ergebnis) und Fortschrittsbalken */
    `.mzi-diagramme{display:grid;gap:16px;margin:12px 0}` +
    `@media (min-width:900px){.mzi-diagramme{grid-template-columns:1fr 1fr}}` +
    `.mzi-diagramme h4{margin:0 0 6px;color:${P.navy}}` +
    `.mzi-balken{height:12px;border-radius:6px;background:${P.grau};overflow:hidden;margin:8px 0}` +
    `.mzi-balken>div{height:100%;background:${P.orange};transition:width .2s}` +
    `.mzi-zitat{margin:8px 0;padding:8px 16px;border-left:5px solid ${P.orange};background:${P.orangeTint};color:${P.navy};white-space:pre-wrap}` +
    `.mzi-zitat canvas{display:block;width:100%;height:auto;background:#fff}` +
    /* Zitate der Begründungen im Aufgabentext (v3, Markdown „>“) wie das Zitat der Vorhersage */
    `.fx-karte .qtext blockquote{margin:8px 0 12px;padding:8px 16px;border-left:5px solid ${P.orange};background:${P.orangeTint};color:${P.navy}}` +
    `.fx-karte .qtext blockquote p{margin:0}` +
    /* Vergleichstabelle klassisch/quantenphysikalisch (Kapitel 5, v3) und Koinzidenz-Hilfe; auf schmalen Geräten untereinander */
    `.mzi-vgl table{width:100%;border-collapse:collapse}` +
    `.mzi-vgl th,.mzi-vgl td{padding:6px;vertical-align:top;text-align:left;border-bottom:1px solid ${P.linie}}` +
    `.mzi-vgl td{width:50%}` +
    `.mzi-vgl textarea{width:100%;box-sizing:border-box;font:inherit;min-height:4.5em}` +
    `.mzi-vgl-frage th{background:${P.blauTint};color:${P.navy}}` +
    `.mzi-vgl-spalte{display:none;font-size:13px;color:${P.gedaempft}}` +
    `@media (max-width:640px){.mzi-vgl thead{display:none}.mzi-vgl td{display:block;width:auto}.mzi-vgl-spalte{display:block}}` +
    `.mzi-koinz{display:grid;gap:8px;max-width:480px}` +
    /* Zeitungsausschnitt „Quanten-Aktuell“ (Zusatzaufgabe Kapitel 3), Werte aus der Quelle */
    `.zeitung{margin:8px 0 16px;padding:14px 18px 16px;background:#f7f3ea;color:#1d1d1b;border:1px solid #d8d0bd;box-shadow:2px 3px 0 #e6dfcd;font-family:Georgia,"Times New Roman",serif;transform:rotate(-.6deg);max-width:620px}` +
    `.zeitung .zkopf{font-family:"Old English Text MT","UnifrakturMaguntia",Georgia,serif;font-size:34px;font-weight:700;text-align:center;letter-spacing:.5px;border-bottom:3px double #1d1d1b;padding-bottom:4px}` +
    `.zeitung .zmeta{display:flex;justify-content:space-between;gap:8px;font-size:12px;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #1d1d1b;padding:3px 0;margin-bottom:10px}` +
    `.zeitung h4,.zeitung .zschlag{font-size:25px;line-height:1.15;margin:4px 0 8px;font-weight:700;font-family:Georgia,"Times New Roman",serif;color:#1d1d1b}` +
    `.zeitung .zlead{margin:0;font-size:16px;line-height:1.45;font-style:italic}` +
    /* Labormodus (engine/web/css/labor.css): helle Schrift auf dunklem Grund; die Zeichnungen selbst behalten ihre festen Farben (PDF) */
    LABOR.map((r) => r.split(',').map((x) => 'html[data-labor="1"] ' + x).join(',')).join('');
  if (root.document && root.document.head && !root.document.getElementById('mzi-stil')) {
    const s = root.document.createElement('style'); s.id = 'mzi-stil'; s.textContent = STIL; root.document.head.appendChild(s);
  }

  FX.mzi = { EINST, P, A, DS, lamBruch, bsSVG, mirrorSVG, pD1, binom, einzel, messreihe, aufbauSVG, polSkizzeSVG, diagrammSVG, ratenSVG, haeufigkeitSVG, balkenSVG, fitSin,
    hochzaehlen, zeitleiste, phaseRegler, h, melde, lies, konfig, pct, pause: wartePause };
})(typeof self !== 'undefined' ? self : this);
