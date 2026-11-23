/* Werkzeug „gangunterschied“ (Kapitel 4, Gangunterschied): Ringmuster auf beiden Schirmen bei verstellbarem Gangunterschied Δs.
   Übernommen aus „MZI Kurs Test v3/Technik/simulation.js“ (guDraw, data-gang). Laser 532 nm, Regler in λ/16 bis 2λ.
   Schirm 1: I = 1 + cos(Δφ), Schirm 2: I = 1 − cos(Δφ) mit Δφ = 2π·Δs/λ + Ringphase (leicht divergentes Licht).
   Wert: { ds } (Reglerstellung in λ/16). Reine Simulation: nie leer, nicht im Protokoll. Die Antworten stehen im Lückenfeld danach. */
(function (root) {
  const FX = root.FX, M = FX.mzi, h = M.h, P = M.P, A = M.A;
  const GU = { lambda: 532, schritte: 16, max: 32, ringe: 5.5 };
  const GRUEN = '#2fa84f';

  /* Ringmuster in eine Zeichenfläche (n = 1 oder 2, ds in nm); ohne Canvas (Test) nichts */
  function muster(cv, n, ds) {
    const ctx = cv.getContext && cv.getContext('2d');
    if (!ctx || !ctx.createImageData) return false;
    const W = cv.width, H = cv.height, img = ctx.createImageData(W, H), R = W / 2, sh = 2 * Math.PI * ds / GU.lambda;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const r2 = ((x - R) * (x - R) + (y - R) * (y - R)) / (R * R), o = (y * W + x) * 4;
      if (r2 > 1) { img.data[o + 3] = 0; continue; }
      const c = Math.cos(sh + 2 * Math.PI * GU.ringe * r2), I = (n === 1 ? 1 + c : 1 - c) / 2 * Math.exp(-1.6 * r2);
      img.data[o] = 30 * I; img.data[o + 1] = 25 + 230 * I; img.data[o + 2] = 20 + 40 * I; img.data[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return true;
  }

  function schema(id) {
    const loch = 'gu-loch-' + id, c1 = 'gu-c1-' + id, c2 = 'gu-c2-' + id;
    return `<svg class="mzi-svg" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 820 470" role="img" aria-label="Schema des Interferometers mit den Mustern auf beiden Schirmen">
    <defs><pattern id="${loch}" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1.6" fill="${P.loch}"/></pattern>
    <clipPath id="${c1}"><circle cx="735" cy="320" r="40"/></clipPath><clipPath id="${c2}"><circle cx="600" cy="425" r="40"/></clipPath></defs>
    <rect width="820" height="470" fill="${P.bank}"/><rect width="820" height="470" fill="url(#${loch})"/>
    <g stroke="${GRUEN}" stroke-width="4" opacity=".75"><line x1="200" y1="110" x2="600" y2="110"/><line x1="300" y1="110" x2="300" y2="320"/><line x1="600" y1="110" x2="600" y2="385"/><line x1="300" y1="320" x2="695" y2="320"/></g>
    <rect x="30" y="80" width="170" height="60" fill="${P.navy}"/><rect x="30" y="80" width="170" height="6" fill="${P.orange}"/>
    <text x="115" y="117" text-anchor="middle" ${A.nameW}>Laser</text>
    ${M.bsSVG(300, 110)}<text x="300" y="72" text-anchor="middle" ${A.name}>Strahlteiler 1</text>
    ${M.mirrorSVG(600, 110)}${M.mirrorSVG(300, 320, -1)}<text x="630" y="96" ${A.name}>Spiegel 1</text><text x="200" y="352" ${A.name}>Spiegel 2</text>
    ${M.bsSVG(600, 320)}<text x="574" y="298" text-anchor="end" ${A.name}>Strahlteiler 2</text>
    <rect x="440" y="58" width="150" height="40" rx="4" fill="#fff" stroke="${GRUEN}" stroke-width="2"/><text x="515" y="76" text-anchor="middle" ${A.label}>Arm über Spiegel 1</text><text x="515" y="92" text-anchor="middle" ${A.name} data-o="arm">+ 0</text>
    <circle cx="735" cy="320" r="44" fill="#ddd"/><image data-schirm="1" x="695" y="280" width="80" height="80" clip-path="url(#${c1})"/><text x="735" y="386" text-anchor="middle" ${A.name}>Schirm 1</text>
    <circle cx="600" cy="425" r="44" fill="#ddd"/><image data-schirm="2" x="560" y="385" width="80" height="80" clip-path="url(#${c2})"/><text x="660" y="430" ${A.name}>Schirm 2</text>
  </svg>`;
  }

  let zaehler = 0;
  function init(el) {
    if (el._guLaden) return;
    el._guLaden = true;
    const flaeche = el.querySelector('.fx-werkzeug-flaeche'), id = ++zaehler, rid = 'gu-regler-' + id;
    const zeichnung = h('div', { 'class': 'mzi-zeichnung' }); zeichnung.innerHTML = schema(id);
    const leinwand = [1, 2].map((n) => h('canvas', { width: 220, height: 220, 'data-schirm': n }));
    const ausgabe = h('output', { for: rid, 'data-o': 'ds' }, '0');
    const regler = h('input', { type: 'range', id: rid, min: 0, max: GU.max, step: 1, value: 0 });
    flaeche.appendChild(h('div', { 'class': 'mzi-gang' }, zeichnung,
      h('div', { 'class': 'ctl mzi-regler' }, h('label', { for: rid }, 'Gangunterschied Δs (Arm über Spiegel 1 länger)'), ausgabe, regler,
        h('div', { 'class': 'ticks' }, h('span', {}, '0'), h('span', {}, 'λ/2'), h('span', {}, 'λ'), h('span', {}, '3λ/2'), h('span', {}, '2λ')))));
    el._guZeige = (v) => {
      const f = M.lamBruch(v, GU.schritte);
      regler.value = v; ausgabe.textContent = f;
      const arm = zeichnung.querySelector('[data-o="arm"]'); if (arm) arm.textContent = '+ ' + f;
      leinwand.forEach((cv) => {
        const n = Number(cv.getAttribute('data-schirm'));
        if (!muster(cv, n, v * GU.lambda / GU.schritte)) return;
        const bild = zeichnung.querySelector('image[data-schirm="' + n + '"]');
        try { const u = cv.toDataURL(); bild.setAttribute('href', u); bild.setAttributeNS('http://www.w3.org/1999/xlink', 'href', u); } catch (e) { /* ohne Canvas */ }
      });
    };
    regler.addEventListener('input', () => el._guZeige(Number(regler.value)));
    el._guRegler = regler;
    el._guZeige(0);
  }

  FX.felder.registriere('gangunterschied', {
    init: init,
    laden: (el, w) => { if (!el._guLaden) init(el); const v = Math.max(0, Math.min(GU.max, Math.round(Number(w && w.ds) || 0))); el._guZeige(v); },
    wert: (el) => ({ ds: el._guRegler ? Number(el._guRegler.value) : 0 }),
    leer: () => false,
    ohneProtokoll: true
  });
  if (FX.mzi) FX.mzi.gangMuster = muster;
})(typeof self !== 'undefined' ? self : this);
