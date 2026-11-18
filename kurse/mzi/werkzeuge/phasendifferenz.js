/* Werkzeug „phasendifferenz“ (Kapitel 1, Aufbau 3, E): Phasendifferenz Δφ je Detektor, zuerst als Kurzabfrage.
   Ablauf wie simulation.js: Kurzantwort richtig → fertig (direkt). Falsch → Kurzabfrage gesperrt, darunter erscheinen die
   Tabelle der Phasensprünge (Spiegel und Strahlteiler, Vielfache von π/2) und danach die Δφ-Abfrage erneut.
   Der gerenderte Fragetext wird beim Aufbau an den beiden <h4> geteilt: Teil 1 bleibt oben (Kurzabfrage), Teil 2 gehört
   zur Tabelle, Teil 3 zur zweiten Δφ-Abfrage; beide erscheinen erst nach einer falschen Kurzantwort.
   Wert: {kurz:[d1,d2], kurzGeprueft, direkt:bool|null, tabelle:{"i-j":opt}, tabelleOk, diff:[d1,d2], diffOk}.
   Konfig modus="schirm" (Laser, Kapitel „Schirme“): Zeilen „Weg 1–4 … zu Schirm n“, Skizze aufbauSVG('laser') über der Tabelle,
   keine Kurzabfrage; die Tabelle ist sofort sichtbar, nach „Tabelle prüfen“ folgt Δφ je Schirm (Fragetext ab dem ersten <h4>
   gehört zur Δφ-Abfrage). Erledigt: diffOk. Ohne modus bleibt alles wie oben.
   „change“ bei jeder Prüfung. Erledigt (nicht leer): direkt === true oder diffOk. */
(function (root) {
  const FX = root.FX, M = FX.mzi, h = M.h, P = M.P;
  const WEGE = [   // modus „schirm“: gleiche Phasensprünge, Bezeichnungen der Wege
    { name: 'Weg 1', via: 'über Spiegel 1, zu Schirm 1' }, { name: 'Weg 2', via: 'über Spiegel 1, zu Schirm 2' },
    { name: 'Weg 3', via: 'über Spiegel 2, zu Schirm 1' }, { name: 'Weg 4', via: 'über Spiegel 2, zu Schirm 2' }];
  const SPALTEN = ['Strahlteiler 1', 'Spiegel', 'Strahlteiler 2', 'Summe'];
  const ZEILEN = [   // richtige Werte in Vielfachen von π/2 (Quelle: simulation.js, Phasensprünge)
    { name: 'Möglichkeit 1', via: 'über Spiegel 1, zu Detektor 1', v: [0, 2, 1, 3] },
    { name: 'Möglichkeit 2', via: 'über Spiegel 1, zu Detektor 2', v: [0, 2, 0, 2] },
    { name: 'Möglichkeit 3', via: 'über Spiegel 2, zu Detektor 1', v: [1, 2, 0, 3] },
    { name: 'Möglichkeit 4', via: 'über Spiegel 2, zu Detektor 2', v: [1, 2, 1, 4] }];
  const WERTE = ['0', 'π/2', 'π', '3π/2', '2π', '5π/2'];
  const DIFF_OPT = ['0', 'π/2', 'π', '3π/2', '2π'];
  const DIFF_RICHTIG = ['0', 'π'];
  const optionen = (j) => WERTE.slice(0, j === 3 ? 6 : 3);
  const tKey = (i, j) => i + '-' + j;

  const wahl = (x, liste) => (typeof x === 'string' && liste.indexOf(x) >= 0 ? x : '');
  const paar = (a) => [wahl(a && a[0], DIFF_OPT), wahl(a && a[1], DIFF_OPT)];
  const gleich = (a, b) => a[0] === b[0] && a[1] === b[1];
  const tabelleRichtig = (t) => ZEILEN.every((r, i) => r.v.every((v, j) => t[tKey(i, j)] === WERTE[v]));
  function fuelle(w, schirm) {
    const s = { kurz: paar(w && w.kurz), kurzGeprueft: false, direkt: null, tabelle: {}, tabelleOk: false, diff: paar(w && w.diff), diffOk: false };
    s.kurzGeprueft = !schirm && !!(w && w.kurzGeprueft) && s.kurz[0] !== '' && s.kurz[1] !== '';
    s.direkt = !schirm && s.kurzGeprueft ? gleich(s.kurz, DIFF_RICHTIG) : null;
    ZEILEN.forEach((r, i) => SPALTEN.forEach((c, j) => { s.tabelle[tKey(i, j)] = wahl(w && w.tabelle && w.tabelle[tKey(i, j)], optionen(j)); }));
    const umweg = !!schirm || s.direkt === false;
    s.tabelleOk = umweg && !!(w && w.tabelleOk) && tabelleRichtig(s.tabelle);
    s.diffOk = s.tabelleOk && !!(w && w.diffOk) && gleich(s.diff, DIFF_RICHTIG);
    return s;
  }
  const erledigt = (w) => !!w && (w.direkt === true || !!w.diffOk);
  function nenneWege(nr) {   // „Weg 3“ bzw. „die Wege 1, 2 und 3“
    return nr.length === 1 ? 'Weg ' + nr[0] : 'die Wege ' + nr.slice(0, -1).join(', ') + ' und ' + nr[nr.length - 1];
  }
  function nenne(nr) {   // „Möglichkeit 3“ bzw. „Möglichkeiten 1, 2 und 3“
    return nr.length === 1 ? 'Möglichkeit ' + nr[0] : 'Möglichkeiten ' + nr.slice(0, -1).join(', ') + ' und ' + nr[nr.length - 1];
  }

  function init(el) {
    if (el._pdLaden) return;   // schon aufgebaut (Engine und laden() rufen beide init)
    const flaeche = el.querySelector('.fx-werkzeug-flaeche'), qtext = el.querySelector('.qtext');
    const schirm = M.konfig(el).modus === 'schirm', ziel = schirm ? 'Schirm' : 'Detektor';
    const zeilen = schirm ? ZEILEN.map((r, i) => ({ name: WEGE[i].name, via: WEGE[i].via, v: r.v })) : ZEILEN;
    let s = fuelle(null, schirm);
    const kurzSel = [], tabSel = {}, diffSel = [];
    const auswahl = (attr, liste, wert) => {
      const sel = h('select', attr, h('option', { value: '' }, '–'), liste.map((o) => h('option', { value: o }, o)));
      sel.value = wert || ''; return sel;
    };
    const meldung = (o) => h('p', { 'class': 'mzi-status', role: 'status', 'data-o': o });
    const knopf = (art, text) => h('button', { type: 'button', 'class': 'fx-knopf fx-haupt', 'data-pruefe': art }, text);

    /* Fragetext an den beiden <h4> teilen */
    const teile = [[], [], []];
    if (qtext) {
      let k = 0;
      Array.prototype.slice.call(qtext.childNodes).forEach((n) => {
        if (n.nodeType === 1 && n.tagName === 'H4') k = Math.min(2, k + 1);
        teile[k].push(n);
      });
      teile[1].concat(teile[2]).forEach((n) => { if (n.parentNode) n.parentNode.removeChild(n); });
      if (schirm) { teile[2] = teile[1].concat(teile[2]); teile[1] = []; }   // alles ab dem ersten <h4> gehört zu Δφ
    }
    const textBox = (k, cls) => h('div', { 'class': cls }, teile[k]);

    /* Kurzabfrage */
    const kurzBox = h('div', { 'class': 'mzi-pd-kurz' });
    const kurzTab = h('table', { 'class': 'mzi-pd' }, h('thead', {}, h('tr', {}, h('th'), h('th', {}, 'Phasendifferenz Δφ'))),
      h('tbody', {}, [0, 1].map((i) => {
        kurzSel[i] = auswahl({ 'data-pd': 'kurz-' + i, 'aria-label': 'Phasendifferenz Detektor ' + (i + 1) }, DIFF_OPT);
        return h('tr', {}, h('th', {}, 'Detektor ' + (i + 1)), h('td', {}, kurzSel[i]));
      })));
    const kurzKnopf = knopf('kurz', 'Prüfen'), kurzMsg = meldung('msg-kurz');
    kurzBox.appendChild(h('div', { 'class': 'fx-tab-wrap' }, kurzTab)); kurzBox.appendChild(h('div', { 'class': 'fx-knoepfe' }, kurzKnopf)); kurzBox.appendChild(kurzMsg);

    /* Tabelle der Phasensprünge */
    const tabBox = h('div', { 'class': 'mzi-pd-umweg', 'data-o': 'tabbox', hidden: true });
    const zeilenEl = [];
    const tbody = h('tbody', {}, zeilen.map((r, i) => {
      const tr = h('tr', { 'data-r': i }, h('th', {}, r.name, h('small', {}, r.via)), SPALTEN.map((c, j) => {
        tabSel[tKey(i, j)] = auswahl({ 'data-pt': tKey(i, j), 'aria-label': r.name + ', ' + c }, optionen(j));
        return h('td', {}, tabSel[tKey(i, j)]);
      }));
      zeilenEl.push(tr); return tr;
    }));
    const tabKnopf = knopf('tabelle', 'Tabelle prüfen'), tabMsg = meldung('msg-tabelle');
    tabBox.appendChild(textBox(1, 'mzi-pd-text'));
    tabBox.appendChild(h('div', { 'class': 'fx-tab-wrap' }, h('table', { 'class': 'mzi-pd' }, h('thead', {}, h('tr', {}, h('th'), SPALTEN.map((c) => h('th', {}, c)))), tbody)));
    tabBox.appendChild(h('div', { 'class': 'fx-knoepfe' }, tabKnopf)); tabBox.appendChild(tabMsg);

    /* zweite Δφ-Abfrage */
    const diffBox = h('div', { 'class': 'mzi-pd-umweg', 'data-o': 'diffbox', hidden: true });
    const diffKnopf = knopf('diff', 'Prüfen'), diffMsg = meldung('msg-diff');
    diffBox.appendChild(textBox(2, 'mzi-pd-text'));
    diffBox.appendChild(h('div', { 'class': 'fx-tab-wrap' }, h('table', { 'class': 'mzi-pd' }, h('thead', {}, h('tr', {}, h('th'), h('th', {}, 'Phasendifferenz Δφ'))),
      h('tbody', {}, [0, 1].map((i) => {
        diffSel[i] = auswahl({ 'data-pd': 'diff-' + i, 'aria-label': 'Phasendifferenz ' + ziel + ' ' + (i + 1) + ' aus den Summen' }, DIFF_OPT);
        return h('tr', {}, h('th', {}, ziel + ' ' + (i + 1)), h('td', {}, diffSel[i]));
      })))));
    diffBox.appendChild(h('div', { 'class': 'fx-knoepfe' }, diffKnopf)); diffBox.appendChild(diffMsg);

    if (schirm) { kurzBox.hidden = true; const skizze = h('div', { 'class': 'mzi-pd-skizze' }); skizze.innerHTML = M.aufbauSVG('laser', {}); flaeche.appendChild(skizze); }
    flaeche.appendChild(h('div', { 'class': 'mzi-pd-lab' }, kurzBox, tabBox, diffBox));

    /* Zustand aus den Auswahlfeldern lesen */
    function lese() {
      s.kurz = [kurzSel[0].value, kurzSel[1].value]; s.diff = [diffSel[0].value, diffSel[1].value];
      ZEILEN.forEach((r, i) => SPALTEN.forEach((c, j) => { s.tabelle[tKey(i, j)] = tabSel[tKey(i, j)].value; }));
    }
    function zeige() {
      const umweg = schirm || s.direkt === false;
      kurzSel.forEach((x, i) => { x.value = s.kurz[i]; x.disabled = s.kurzGeprueft; }); kurzKnopf.disabled = s.kurzGeprueft;
      tabBox.hidden = !umweg; diffBox.hidden = !(umweg && s.tabelleOk);
      Object.keys(tabSel).forEach((k) => { tabSel[k].value = s.tabelle[k]; tabSel[k].disabled = s.tabelleOk; }); tabKnopf.disabled = s.tabelleOk;
      diffSel.forEach((x, i) => { x.value = s.diff[i]; x.disabled = s.diffOk; }); diffKnopf.disabled = s.diffOk;
      kurzMsg.textContent = s.direkt === true ? 'Richtig.' : s.direkt === false ? 'Das stimmt noch nicht. Ermittelt die Phasendifferenz jetzt Schritt für Schritt: Tragt zuerst die Phasensprünge an jedem Bauteil in die Tabelle ein.' : '';
      tabMsg.textContent = s.tabelleOk ? 'Richtig.' : tabMsg.textContent;
      diffMsg.textContent = s.diffOk ? 'Richtig.' : diffMsg.textContent;
    }

    kurzKnopf.addEventListener('click', () => {
      if (s.kurzGeprueft) return; lese();
      if (!s.kurz[0] || !s.kurz[1]) { kurzMsg.textContent = 'Bitte zuerst beide Felder ausfüllen.'; return; }
      s.kurzGeprueft = true; s.direkt = gleich(s.kurz, DIFF_RICHTIG); zeige(); M.melde(el);
    });
    tabKnopf.addEventListener('click', () => {
      if (s.tabelleOk) return; lese();
      if (ZEILEN.some((r, i) => SPALTEN.some((c, j) => !s.tabelle[tKey(i, j)]))) { tabMsg.textContent = 'Bitte zuerst alle Felder ausfüllen.'; return; }
      const falsch = [];
      ZEILEN.forEach((r, i) => {
        const ok = r.v.every((v, j) => s.tabelle[tKey(i, j)] === WERTE[v]);
        zeilenEl[i].classList.toggle('mzi-falsch', !ok); if (!ok) falsch.push(i + 1);
      });
      if (falsch.length) { tabMsg.textContent = 'Prüft noch einmal ' + (schirm ? nenneWege(falsch) : nenne(falsch)) + '.'; M.melde(el); return; }
      s.tabelleOk = true; tabMsg.textContent = 'Richtig.'; zeige(); M.melde(el);
    });
    diffKnopf.addEventListener('click', () => {
      if (s.diffOk) return; lese();
      if (!s.diff[0] || !s.diff[1]) { diffMsg.textContent = 'Bitte zuerst beide Felder ausfüllen.'; return; }
      if (!gleich(s.diff, DIFF_RICHTIG)) { diffMsg.textContent = schirm ? 'Bildet für jeden Schirm die Differenz der Summen der beiden Wege, die zu ihm führen.' : 'Bildet für jeden Detektor die Differenz der Summen der beiden klassisch denkbaren Möglichkeiten, die zu ihm führen.'; M.melde(el); return; }
      s.diffOk = true; diffMsg.textContent = 'Richtig.'; zeige(); M.melde(el);
    });
    /* eine geänderte Auswahl nimmt die Markierung „falsch“ der Zeile zurück */
    Object.keys(tabSel).forEach((k) => tabSel[k].addEventListener('change', () => { zeilenEl[Number(k.split('-')[0])].classList.remove('mzi-falsch'); }));

    el._pdWert = () => { if (!s.kurzGeprueft || !s.tabelleOk || !s.diffOk) lese(); return JSON.parse(JSON.stringify(s)); };
    el._pdLaden = (w) => { s = fuelle(w, schirm); zeilenEl.forEach((tr) => tr.classList.remove('mzi-falsch')); tabMsg.textContent = ''; diffMsg.textContent = ''; zeige(); };
    zeige();
  }

  FX.felder.registriere('phasendifferenz', {
    init: init,
    laden: (el, w) => { if (!el._pdLaden) init(el); el._pdLaden(w); },
    wert: (el) => { if (!el._pdWert) init(el); return el._pdWert(); },
    leer: (w) => !erledigt(w),
    protokoll: (el, w) => {
      const schirm = M.konfig(el).modus === 'schirm', zeilen = schirm ? ZEILEN.map((r, i) => ({ name: WEGE[i].name, via: WEGE[i].via })) : ZEILEN;
      const s = fuelle(w, schirm);
      if (schirm) {
        return [{ typ: 'tabelle', kopf: [''].concat(SPALTEN), zeilen: zeilen.map((r, i) => [r.name + ' (' + r.via + ')'].concat(SPALTEN.map((c, j) => s.tabelle[tKey(i, j)] || '–'))) },
          { typ: 'text', text: 'Phasendifferenz Δφ aus den Summen: Schirm 1: ' + (s.diff[0] || '–') + ' · Schirm 2: ' + (s.diff[1] || '–') }];
      }
      const teile = [{ typ: 'text', text: 'Phasendifferenz Δφ (kurz): Detektor 1: ' + (s.kurz[0] || '–') + ' · Detektor 2: ' + (s.kurz[1] || '–') }];
      if (s.direkt === false) {
        teile.push({ typ: 'tabelle', kopf: [''].concat(SPALTEN), zeilen: ZEILEN.map((r, i) => [r.name + ' (' + r.via + ')'].concat(SPALTEN.map((c, j) => s.tabelle[tKey(i, j)] || '–'))) });
        teile.push({ typ: 'text', text: 'Phasendifferenz Δφ aus den Summen: Detektor 1: ' + (s.diff[0] || '–') + ' · Detektor 2: ' + (s.diff[1] || '–') });
      }
      return teile;
    }
  });

  if (root.document && root.document.head && !root.document.getElementById('mzi-pd-stil')) {
    const st = root.document.createElement('style'); st.id = 'mzi-pd-stil';
    st.textContent = `.mzi-pd{border-collapse:collapse;margin:8px 0}` +
      `.mzi-pd th,.mzi-pd td{padding:6px 8px;border-bottom:1px solid ${P.linie};text-align:left}` +
      `.mzi-pd th small{display:block;font-weight:400;color:${P.gedaempft}}` +
      `.mzi-pd select{min-height:44px;font:inherit}` +
      `.mzi-pd tr.mzi-falsch{background:${P.orangeTint}}` +
      `.mzi-pd-umweg{margin-top:16px}`;
    root.document.head.appendChild(st);
  }
})(typeof self !== 'undefined' ? self : this);
