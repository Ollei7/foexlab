/* Werkzeug „dceinzel“ (Kapitel 3, Schritt 1): Einzelmessungen am Delayed-Choice-Aufbau, Δφ = 0°.
   Knopf „Ein Photon senden“: Zeitleisten-Animation (600 / 700 / 700 ms), dann Klick an Detektor 1 oder 2; Strahlteiler 2 drin oder draußen
   entscheidet der Zufallsgenerator für jedes Photon neu. Wert: {singles: [{c: 'in'|'out', d: 1|2}]}.
   Erledigt (nicht leer) ab EINST.EINZEL Einzelmessungen; „begonnen“ ab der ersten (Hypothese festhalten).
   „change“ erst am Ende der Animation; währenddessen ist der Knopf gesperrt. */
(function (root) {
  const FX = root.FX, M = FX.mzi, h = M.h;
  const NAME = { 'in': 'drin', out: 'draußen' };

  function fuelle(w) {
    const singles = [];
    ((w && w.singles) || []).forEach((r) => {
      if (r && (r.c === 'in' || r.c === 'out') && (r.d === 1 || r.d === 2)) singles.push({ c: r.c, d: r.d });
    });
    return { singles };
  }
  const zaehle = (singles, c) => {
    const l = singles.filter((x) => !c || x.c === c);
    return { n: l.length, k1: l.filter((x) => x.d === 1).length, k2: l.filter((x) => x.d === 2).length };
  };
  const gruppen = (singles) => ['in', 'out'].map((c) => Object.assign({ label: 'Strahlteiler 2 ' + NAME[c] }, zaehle(singles, c)));
  const diagramm = (singles) => M.haeufigkeitSVG(gruppen(singles), 'Noch keine Messung.');

  function init(el) {
    if (el._deLaden) return;   // schon aufgebaut
    const flaeche = el.querySelector('.fx-werkzeug-flaeche'), ziel = M.EINST.EINZEL;
    let s = fuelle(null), beschaeftigt = false, ansicht = 'tabelle';
    const zeichnung = h('div', { 'class': 'mzi-zeichnung' }), zl = M.zeitleiste();
    const knopf = h('button', { type: 'button', 'class': 'fx-knopf fx-haupt', 'data-o': 'senden', onclick: () => sende() }, 'Ein Photon senden');
    const status = h('p', { 'class': 'mzi-status', role: 'status', 'data-o': 'st' });
    const tbody = h('tbody');
    const tabelle = h('div', { 'class': 'mzi-log fx-tab-wrap', 'data-o': 'tabelle' }, h('table', {}, h('thead', {}, h('tr', {},
      ['Einzelmessung', 'Strahlteiler 2', 'Klick an'].map((t) => h('th', {}, t)))), tbody));
    const bild = h('div', { 'class': 'mzi-diagramm', 'data-o': 'diagramm', hidden: true });
    const umschalter = ['tabelle', 'diagramm'].map((a) => h('button', { type: 'button', 'class': 'fx-knopf', 'data-ansicht': a, 'aria-pressed': a === ansicht ? 'true' : 'false',
      onclick: () => { ansicht = a; zeige(); } }, a === 'tabelle' ? 'Tabelle' : 'Häufigkeitsdiagramm'));

    flaeche.appendChild(h('div', { 'class': 'fx-mzi-lab mzi-einspaltig' }, zeichnung, zl.el,
      h('div', { 'class': 'mzi-bedienung' }, h('div', { 'class': 'fx-knoepfe' }, knopf), status,
        h('div', { 'class': 'mzi-protokollkopf' }, h('strong', {}, 'Einzelmessungen'), h('div', { 'class': 'fx-knoepfe' }, umschalter)), tabelle, bild)));

    function zeichne(opt) {
      const z = zaehle(s.singles);
      zeichnung.innerHTML = M.aufbauSVG('dc', Object.assign({ c1: z.k1, c2: z.k2, detLabel: 'Messergebnisse aller Einzelmessungen' }, opt));
    }
    function zeige() {
      const n = s.singles.length, r = ziel - n;
      knopf.disabled = beschaeftigt;
      status.textContent = r > 0 ? n + ' von ' + ziel + ' Einzelmessungen. Noch ' + r + ' bis zur nächsten Aufgabe.' : n + ' Einzelmessungen. Die nächste Aufgabe ist frei.';
      tbody.innerHTML = '';
      if (!n) tbody.appendChild(h('tr', {}, h('td', { colspan: 3, 'class': 'mzi-leer' }, 'Noch keine Messung.')));
      s.singles.forEach((x, i) => tbody.appendChild(h('tr', {}, h('td', {}, i + 1), h('td', {}, NAME[x.c]), h('td', { 'class': 'c' + x.d }, 'Detektor ' + x.d))));
      const tw = tabelle.querySelector('table').parentNode; tw.scrollTop = tw.scrollHeight;
      bild.innerHTML = diagramm(s.singles) + '<p class="mzi-hinweis">Relative Häufigkeit der Messergebnisse an Detektor 1 und 2, getrennt nach der Wahl des Zufallsgenerators.</p>';
      tabelle.hidden = ansicht !== 'tabelle'; bild.hidden = ansicht !== 'diagramm';
      umschalter.forEach((b) => b.setAttribute('aria-pressed', b.getAttribute('data-ansicht') === ansicht ? 'true' : 'false'));
    }

    async function sende() {
      if (beschaeftigt) return;
      beschaeftigt = true; zeige();
      const e = M.einzel(0), c = e.c, d = e.d, wahl = 'Strahlteiler 2 ' + NAME[c];
      zl.setze(0); zeichne({ src: true });
      await M.pause(600); zl.setze(1); zeichne({ src: false });
      await M.pause(700); zl.setze(2, wahl); zeichne({ choice: c, caption: wahl });
      await M.pause(700); zl.setze(3, null, 'Klick an Detektor ' + d); zeichne({ choice: c, d, caption: wahl });
      s.singles.push({ c, d });
      beschaeftigt = false; zeichne({}); zeige();
      M.melde(el);
    }

    el._deWert = () => ({ singles: s.singles.map((x) => ({ c: x.c, d: x.d })) });
    el._deLaden = (w) => { s = fuelle(w); zl.setze(-1); zeichne({}); zeige(); };
    zl.setze(-1); zeichne({}); zeige();
  }

  FX.felder.registriere('dceinzel', {
    init: init,
    laden: (el, w) => { if (!el._deLaden) init(el); el._deLaden(w); },
    wert: (el) => { if (!el._deWert) init(el); return el._deWert(); },
    begonnen: (w) => fuelle(w).singles.length > 0,   // schon ab der ersten Messung: Hypothese festhalten
    leer: (w) => fuelle(w).singles.length < M.EINST.EINZEL,
    protokoll: (el, w) => {
      const s = fuelle(w);
      return [
        { typ: 'tabelle', kopf: ['Einzelmessung', 'Strahlteiler 2', 'Klick an'], zeilen: s.singles.map((x, i) => [String(i + 1), NAME[x.c], 'Detektor ' + x.d]) },
        { typ: 'grafik', svg: diagramm(s.singles), breite_mm: 110 }
      ];
    }
  });
})(typeof self !== 'undefined' ? self : this);
