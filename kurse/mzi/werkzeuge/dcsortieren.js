/* Werkzeug „dcsortieren“ (Kapitel 3, Schritt 4): Messreihen den Diagrammen „drin“ / „draußen“ zuordnen und mitteln.
   Konfig: quellen "<feld-id s2>,<feld-id s3>" (Felder der Art dcmessreihe; gelesen wird nur .mw, alte Werte ohne „modus“ gehen auch).
   Zeilen = jede Messreihe × {drin, draußen}, Schlüssel modus + "-" + nr + c ("s2-3in", "s3-5out"; alte Werte ohne modus: "q1-"/"q2-" nach Quelle),
   damit gleiche Nummern aus beiden Schritten keine Zeile verdrängen; angezeigt wird weiter nur die Nummer. Zugeordnet wird per Knopf „drin“ / „draußen“;
   richtig ist die Spalte „Zufallsgenerator wählte“. Eine falsche Zuordnung wird nicht gespeichert, die Zeile blinkt.
   Wert: {zuordnung: {"<modus>-<nr><c>": "in"|"out"}, zeilen: [Schlüssel beim letzten Rendern]}.
   Erledigt, wenn alle aktuellen Zeilen zugeordnet sind (und es Zeilen gibt). „begonnen“ ab der ersten Zuordnung (Hypothese festhalten).
   Hört auf fx:geaendert der Quellen: neue Messreihen erscheinen unsortiert, das Feld meldet „change“ (dann ist es wieder nicht erledigt). */
(function (root) {
  const FX = root.FX, M = FX.mzi, h = M.h;
  const NAME = { 'in': 'drin', out: 'draußen' };

  const zaehl = (x) => (typeof x === 'number' && isFinite(x) && x >= 0 ? Math.round(x) : 0);
  const teil = (t) => ({ n: zaehl(t && t.n), k1: zaehl(t && t.k1), k2: zaehl(t && t.k2) });
  const reihen = (w, i) => {
    const modus = w && (w.modus === 's2' || w.modus === 's3') ? w.modus : 'q' + (i + 1);
    return ((w && w.mw) || []).filter(Boolean).map((m) => ({ modus, nr: Math.max(1, zaehl(m.nr)), phi: zaehl(m.phi), 'in': teil(m['in']), out: teil(m.out) }));
  };
  const fuelle = (w) => {
    const z = {};
    if (w && w.zuordnung) Object.keys(w.zuordnung).forEach((k) => { if (w.zuordnung[k] === 'in' || w.zuordnung[k] === 'out') z[k] = w.zuordnung[k]; });
    return { zuordnung: z, zeilen: Array.isArray(w && w.zeilen) ? w.zeilen.filter((k) => typeof k === 'string') : [] };
  };
  const de = (x) => String(x).replace('.', ',');
  const zeilenVon = (mw) => [].concat.apply([], mw.map((m) => ['in', 'out'].map((c) => ({ key: m.modus + '-' + m.nr + c, m, c }))));
  /* Mittelwerte je Δφ aus den bereits zugeordneten Zeilen der Spalte c */
  function mittel(mw, zuordnung, c) {
    const g = {};
    zeilenVon(mw).filter((z) => z.c === c && zuordnung[z.key] === c).forEach((z) => { (g[z.m.phi] = g[z.m.phi] || []).push(z.m[c]); });
    return Object.keys(g).map((p) => ({ phi: Number(p), n: g[p].length,
      k1: g[p].reduce((s, x) => s + x.k1, 0) / g[p].length, k2: g[p].reduce((s, x) => s + x.k2, 0) / g[p].length })).sort((a, b) => a.phi - b.phi);
  }
  const diagramm = (mw, z, c) => { const m = mittel(mw, z, c); return M.ratenSVG(m.map((x) => [x.phi, x.k1]), m.map((x) => [x.phi, x.k2]), { empty: 'Noch nichts eingetragen.' }); };
  const KOPF = ['Δs', 'drin: Messreihen', 'drin: Zählrate D1', 'drin: Zählrate D2', 'draußen: Messreihen', 'draußen: Zählrate D1', 'draußen: Zählrate D2'];
  function mittelZeilen(mw, z) {
    const mi = mittel(mw, z, 'in'), mo = mittel(mw, z, 'out'), phis = Array.from(new Set(mi.concat(mo).map((x) => x.phi))).sort((a, b) => a - b);
    const f = (x) => (x ? [String(x.n), de(x.k1.toFixed(1)), de(x.k2.toFixed(1))] : ['–', '–', '–']);
    return phis.map((p) => [M.DS(p)].concat(f(mi.find((x) => x.phi === p)), f(mo.find((x) => x.phi === p))));
  }

  function init(el) {
    if (el._dsLaden) return;   // schon aufgebaut
    el._dsLaden = true;
    const flaeche = el.querySelector('.fx-werkzeug-flaeche'), k = M.konfig(el);
    const quellen = String(k.quellen || '').split(',').map((x) => x.trim()).filter(Boolean);
    let s = fuelle(null), mw = [], erst = true, generation = 0;
    const status = h('p', { 'class': 'mzi-status', role: 'status', 'data-o': 'st' });
    const tbody = h('tbody');
    const tabelle = h('div', { 'class': 'mzi-log fx-tab-wrap', 'data-o': 'tabelle' }, h('table', {}, h('thead', {}, h('tr', {},
      ['Messreihe', 'Δs', 'Zufallsgenerator wählte', 'Zählrate D1', 'Zählrate D2', 'Zuordnung zum Diagramm'].map((t) => h('th', {}, t)))), tbody));
    const bildIn = h('div', { 'class': 'mzi-diagramm', 'data-o': 'drin' }), bildOut = h('div', { 'class': 'mzi-diagramm', 'data-o': 'draussen' });
    const mbody = h('tbody', { 'data-o': 'mittel' });
    const mt = h('div', { 'class': 'mzi-log fx-tab-wrap' }, h('table', {},
      h('thead', {}, h('tr', {}, h('th', { rowspan: 2 }, 'Δs'), h('th', { colspan: 3 }, 'Strahlteiler 2 drin'), h('th', { colspan: 3 }, 'Strahlteiler 2 draußen')),
        h('tr', {}, ['Messreihen', 'D1', 'D2', 'Messreihen', 'D1', 'D2'].map((t) => h('th', {}, t)))), mbody));
    flaeche.appendChild(h('div', { 'class': 'mzi-sortieren' }, status, tabelle,
      h('div', { 'class': 'mzi-diagramme' }, h('div', {}, h('h4', {}, 'Strahlteiler 2 drin'), bildIn), h('div', {}, h('h4', {}, 'Strahlteiler 2 draußen'), bildOut)),
      h('strong', {}, 'Mittelwerte'), mt));

    function zeige() {
      const zl = zeilenVon(mw), offen = zl.filter((z) => !s.zuordnung[z.key]).length;
      status.textContent = !zl.length ? 'Keine Messreihen vorhanden. Geht zurück zu Schritt 2 und 3.'
        : offen ? 'Noch ' + offen + ' von ' + zl.length + ' Zeilen zuordnen.' : 'Alle ' + zl.length + ' Zeilen sind zugeordnet.';
      tbody.innerHTML = '';
      if (!zl.length) tbody.appendChild(h('tr', {}, h('td', { colspan: 6, 'class': 'mzi-leer' }, 'Keine Messreihen vorhanden.')));
      zl.forEach((z) => {
        const g = s.zuordnung[z.key], knopf = (to) => h('button', { type: 'button', 'class': 'fx-knopf', 'data-to': to, 'aria-pressed': g === to ? 'true' : 'false', onclick: () => waehle(z, to) }, NAME[to]);
        tbody.appendChild(h('tr', { 'data-key': z.key, 'class': g ? 'ok' : '' }, h('td', {}, z.m.nr), h('td', {}, M.DS(z.m.phi)), h('td', {}, NAME[z.c]),
          h('td', { 'class': 'c1' }, z.m[z.c].k1), h('td', { 'class': 'c2' }, z.m[z.c].k2), h('td', { 'class': 'pick' }, knopf('in'), knopf('out'))));
      });
      bildIn.innerHTML = diagramm(mw, s.zuordnung, 'in'); bildOut.innerHTML = diagramm(mw, s.zuordnung, 'out');
      const mz = mittelZeilen(mw, s.zuordnung);
      mbody.innerHTML = '';
      if (!mz.length) mbody.appendChild(h('tr', {}, h('td', { colspan: 7, 'class': 'mzi-leer' }, 'Noch nichts eingetragen.')));
      mz.forEach((r) => mbody.appendChild(h('tr', {}, r.map((t, i) => h('td', { 'class': i && (i % 3 === 2) ? 'c1' : i && (i % 3 === 0) ? 'c2' : '' }, t)))));
    }
    function waehle(z, to) {
      const tr = tbody.querySelector('tr[data-key="' + z.key + '"]');
      if (to !== z.c) {   // falsch: nicht speichern, Zeile blinkt
        if (tr) { tr.classList.remove('wrong'); void tr.offsetWidth; tr.classList.add('wrong'); }
        status.textContent = 'Messreihe ' + z.m.nr + ': Schaut in die Spalte ‚Zufallsgenerator wählte‘.';
        return;
      }
      s.zuordnung[z.key] = z.c; s.zeilen = zeilenVon(mw).map((x) => x.key);
      zeige(); M.melde(el);
    }

    /* Messreihen aus beiden Quellen lesen (alte Werte ohne „modus“ gehen mit), nach Nummer sortiert, bei gleicher Nummer Quelle für Quelle */
    function nachladen(ausEreignis) {
      const meine = ++generation;   // ein früher gestartetes, später fertiges Lesen darf das neuere nicht überschreiben
      return Promise.all(quellen.map((id) => M.lies(id))).then((ws) => {
        if (meine !== generation) return;
        mw = [].concat.apply([], ws.map((w, i) => reihen(w, i).map((m) => Object.assign(m, { q: i }))));
        mw.sort((a, b) => a.nr - b.nr || a.q - b.q);
        const neu = zeilenVon(mw).map((x) => x.key), geaendert = JSON.stringify(neu) !== JSON.stringify(s.zeilen);
        const melden = geaendert && (ausEreignis || s.zeilen.length > 0 || !erst);
        erst = false; s.zeilen = neu; zeige();
        if (melden) M.melde(el);   // neue Zeilen sind unsortiert: Stand speichern, Sperren neu prüfen
      });
    }
    el.ownerDocument.addEventListener('fx:geaendert', (e) => { if (e.detail && quellen.indexOf(e.detail.id) >= 0) nachladen(true); });

    el._dsWert = () => ({ zuordnung: Object.assign({}, s.zuordnung), zeilen: s.zeilen.slice() });
    el._dsLaden2 = (w) => { s = fuelle(w); zeige(); nachladen(false); };
    el._dsStand = () => ({ mw, zuordnung: s.zuordnung });
    zeige(); nachladen(false);
  }

  FX.felder.registriere('dcsortieren', {
    init: init,
    laden: (el, w) => { if (!el._dsLaden) init(el); el._dsLaden2(w); },
    wert: (el) => { if (!el._dsLaden) init(el); return el._dsWert(); },
    begonnen: (w) => Object.keys(fuelle(w).zuordnung).length > 0,   // schon ab der ersten Zuordnung: Vorhersage festhalten
    leer: (w) => { const f = fuelle(w); return !(f.zeilen.length > 0 && f.zeilen.every((k) => f.zuordnung[k])); },
    /* Mittelwert-Tabelle und beide Diagramme (Messreihen und Zuordnung stehen im Feld, der Wert liefert die Zuordnung) */
    protokoll: (el, w) => {
      const st = el._dsStand ? el._dsStand() : { mw: [], zuordnung: {} }, z = w && w.zuordnung ? fuelle(w).zuordnung : st.zuordnung;
      return [{ typ: 'tabelle', kopf: KOPF, zeilen: mittelZeilen(st.mw, z) },
        { typ: 'grafik', titel: 'Mittelwerte, Strahlteiler 2 drin', svg: diagramm(st.mw, z, 'in'), breite_mm: 110 },
        { typ: 'grafik', titel: 'Mittelwerte, Strahlteiler 2 draußen', svg: diagramm(st.mw, z, 'out'), breite_mm: 110 }];
    }
  });

  if (root.document && root.document.head && !root.document.getElementById('mzi-ds-stil')) {
    const st = root.document.createElement('style'); st.id = 'mzi-ds-stil';
    st.textContent = `.mzi-sortieren .mzi-log{max-height:340px}.mzi-sortieren td.pick{white-space:nowrap}` +
      `.mzi-sortieren td.pick button{min-width:84px;min-height:44px;margin-left:6px}` +
      `.mzi-sortieren td.pick button[aria-pressed=true]{background:#3F9AD6;color:#fff}` +
      `.mzi-sortieren tr.ok td{background:#F6F9FC}` +
      `@keyframes mzi-blink{0%,100%{background:transparent}25%,75%{background:#F8DDE3}}` +
      `.mzi-sortieren tr.wrong td{animation:mzi-blink .6s 2}`;
    root.document.head.appendChild(st);
  }
})(typeof self !== 'undefined' ? self : this);
