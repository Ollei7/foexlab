/* Werkzeug „dcmessreihe“ (Kapitel 3, Schritte 2 und 3): Messreihen am Delayed-Choice-Aufbau.
   Eine Messreihe = EINST.MW_PHOTONEN Einzelmessungen in 1 s; für jedes Photon wird Strahlteiler 2 (drin/draußen) und der Detektor neu gewürfelt.
   Konfig: modus "s2" (Δφ fest 0°, erledigt ab S2_REIHEN Messreihen) | "s3" (Regler, erledigt bei S3_PHASEN verschiedenen Δφ ≠ 0° mit je S3_JE Messreihen),
   vorher "<feld-id von s2>" (nur s3: die Nummern der Messreihen setzen die dortigen fort, die Tabelle zeigt sie mit).
   Optional nachher "<feld-id von s3>" (nur s2): neue Nummern gehen auch an den Nummern aus Schritt 3 vorbei.
   Wert: {modus: 's2'|'s3', mw: [{nr, phi, in: {n, k1, k2}, out: {n, k1, k2}}]}. „begonnen“ ab der ersten Messreihe (Hypothese festhalten).
   Der Wert wird erst nach Ende der Animation ergänzt und „change“ gemeldet; währenddessen sind Knopf und Regler gesperrt.
   Die neue Nummer richtet sich nach dem LIVE-Wert des anderen Felds im Dokument (der Speicher hinkt 400 ms hinterher);
   bis der andere Schritt zum ersten Mal gelesen ist, bleibt der Knopf gesperrt. */
(function (root) {
  const FX = root.FX, M = FX.mzi, h = M.h;
  const MS = 1000;   // Dauer einer Messreihe
  const NAME = { 'in': 'drin', out: 'draußen' };

  const zaehl = (x) => (typeof x === 'number' && isFinite(x) && x >= 0 ? Math.round(x) : 0);
  const gradWert = (x) => (typeof x === 'number' && isFinite(x) ? Math.max(0, Math.min(360, Math.round(x / 10) * 10)) : 0);
  const teil = (t) => ({ n: zaehl(t && t.n), k1: zaehl(t && t.k1), k2: zaehl(t && t.k2) });
  /* Modus aus dem Wert; alte Werte ohne „modus“: Messreihen bei Δφ ≠ 0° gehören zu Schritt 3, sonst zu Schritt 2 */
  function fuelle(w, standard) {
    const mw = [];
    ((w && w.mw) || []).forEach((m) => { if (m) mw.push({ nr: Math.max(1, zaehl(m.nr)), phi: gradWert(m.phi), 'in': teil(m['in']), out: teil(m.out) }); });
    const modus = w && (w.modus === 's2' || w.modus === 's3') ? w.modus : (standard || (mw.some((m) => m.phi !== 0) ? 's3' : 's2'));
    return { modus, mw };
  }
  const hoechste = (liste) => liste.reduce((a, m) => Math.max(a, m.nr), 0);
  const summe = (liste, c) => liste.reduce((o, m) => ({ n: o.n + m[c].n, k1: o.k1 + m[c].k1, k2: o.k2 + m[c].k2 }), { n: 0, k1: 0, k2: 0 });
  const gruppen = (liste) => ['in', 'out'].map((c) => Object.assign({ label: 'Strahlteiler 2 ' + NAME[c] }, summe(liste, c)));
  const letzte = (m) => ({ c1: m['in'].k1 + m.out.k1, c2: m['in'].k2 + m.out.k2, label: 'Zählrate in Messreihe ' + m.nr });
  /* Verschiedene Δφ ≠ 0° mit mindestens S3_JE Messreihen (Schritt 3) */
  function phasenS3(mw) {
    const z = {}; mw.filter((m) => m.phi !== 0).forEach((m) => { z[m.phi] = (z[m.phi] || 0) + 1; });
    return Object.keys(z).map((p) => [Number(p), z[p]]).sort((a, b) => a[0] - b[0]);
  }
  const zeilenText = (liste) => liste.map((m) => ['in', 'out'].map((c, j) => [j ? '' : String(m.nr), j ? '' : m.phi + '°', NAME[c], String(m[c].n), String(m[c].k1), String(m[c].k2)]));
  const KOPF = ['Messreihe', 'Δφ', 'Strahlteiler 2', 'Messungen', 'Zählrate D1', 'Zählrate D2'];

  function init(el) {
    if (el._dmLaden) return;   // schon aufgebaut
    const flaeche = el.querySelector('.fx-werkzeug-flaeche'), k = M.konfig(el), s3 = k.modus === 's3';
    const ziel2 = M.EINST.S2_REIHEN, ziel3 = M.EINST.S3_PHASEN, je = M.EINST.S3_JE;
    const fremd = k.vorher || k.nachher;
    let s = fuelle(null, k.modus), vor = [], phi = 0, beschaeftigt = false, ansicht = 'tabelle', bereit = !fremd;
    const zeichnung = h('div', { 'class': 'mzi-zeichnung' });
    const regler = s3 ? M.phaseRegler(0, (v) => { phi = v; zeichne(); zeige(); }) : null;
    const knopf = h('button', { type: 'button', 'class': 'fx-knopf fx-haupt', 'data-o': 'messen', onclick: () => messe() }, 'Messreihe starten (1 s)');
    const status = h('p', { 'class': 'mzi-status', role: 'status', 'data-o': 'st' });
    const tbody = h('tbody');
    const tabelle = h('div', { 'class': 'mzi-log fx-tab-wrap', 'data-o': 'tabelle' }, h('table', {}, h('thead', {}, h('tr', {}, KOPF.map((t) => h('th', {}, t)))), tbody));
    const bild = h('div', { 'class': 'mzi-diagramm', 'data-o': 'diagramm', hidden: true });
    const umschalter = s3 ? [] : ['tabelle', 'diagramm'].map((a) => h('button', { type: 'button', 'class': 'fx-knopf', 'data-ansicht': a, 'aria-pressed': a === ansicht ? 'true' : 'false',
      onclick: () => { ansicht = a; zeige(); } }, a === 'tabelle' ? 'Tabelle' : 'Häufigkeitsdiagramm'));

    flaeche.appendChild(h('div', { 'class': 'fx-mzi-lab' }, zeichnung,
      h('div', { 'class': 'mzi-bedienung' }, regler && regler.el, h('div', { 'class': 'fx-knoepfe' }, knopf), status,
        h('div', { 'class': 'mzi-protokollkopf' }, h('strong', {}, 'Messreihen'), h('div', { 'class': 'fx-knoepfe' }, umschalter)), tabelle, bild)));

    const alle = () => (s3 ? vor.concat(s.mw) : s.mw);   // Schritt 3 zeigt auch die Messreihen aus Schritt 2
    function zeichne(c1, c2, opt) {
      const l = alle()[alle().length - 1], z = l ? letzte(l) : { c1: 0, c2: 0, label: '' };
      zeichnung.innerHTML = M.aufbauSVG('dc', Object.assign({ phaseOn: s3, phi, c1: c1 == null ? z.c1 : c1, c2: c2 == null ? z.c2 : c2,
        detLabel: c1 != null ? 'Zählrate in dieser Messreihe' : z.label, caption: 'wartet' }, opt));
    }
    function zeige() {
      const l = alle();
      if (regler) regler.sperre(beschaeftigt);
      knopf.disabled = beschaeftigt || !bereit;
      if (s3) {
        const ph = phasenS3(s.mw), ok = ph.filter((p) => p[1] >= je).length;
        status.textContent = (ok < ziel3 ? 'Phasendifferenzen mit mindestens ' + je + ' Messreihen: ' + ok + ' von ' + ziel3 + '.' : 'Phasendifferenzen mit mindestens ' + je + ' Messreihen: ' + ok + '. Weiter ist frei.') +
          (ph.length ? ' Bisher: ' + ph.map((p) => p[0] + '° (' + p[1] + '×)').join(', ') + '.' : ' Stellt zuerst eine Phasendifferenz größer als 0° ein.');
      } else {
        const n = s.mw.length, r = ziel2 - n;
        status.textContent = r > 0 ? n + ' von ' + ziel2 + ' Messreihen bei Δφ = 0°. Noch ' + r + ' bis zur nächsten Aufgabe.' : n + ' Messreihen bei Δφ = 0°. Die nächste Aufgabe ist frei.';
      }
      tbody.innerHTML = '';
      if (!l.length) tbody.appendChild(h('tr', {}, h('td', { colspan: 6, 'class': 'mzi-leer' }, 'Noch keine Messreihe.')));
      l.forEach((m) => ['in', 'out'].forEach((c, j) => tbody.appendChild(h('tr', { 'class': j ? 'second' : 'first' },
        h('td', {}, j ? '' : m.nr), h('td', {}, j ? '' : m.phi + '°'), h('td', {}, NAME[c]), h('td', {}, m[c].n), h('td', { 'class': 'c1' }, m[c].k1), h('td', { 'class': 'c2' }, m[c].k2)))));
      const tw = tabelle.querySelector('table').parentNode; tw.scrollTop = tw.scrollHeight;
      if (!s3) bild.innerHTML = M.haeufigkeitSVG(gruppen(s.mw), 'Noch keine Messreihe.') +
        '<p class="mzi-hinweis">Relative Häufigkeit der Messergebnisse an Detektor 1 und 2 in allen ' + s.mw.length + ' Messreihen zusammen, getrennt nach der Wahl des Zufallsgenerators.</p>';
      tabelle.hidden = !s3 && ansicht !== 'tabelle'; bild.hidden = s3 || ansicht !== 'diagramm';
      umschalter.forEach((b) => b.setAttribute('aria-pressed', b.getAttribute('data-ansicht') === ansicht ? 'true' : 'false'));
    }

    async function messe() {
      if (beschaeftigt || !bereit) return;
      beschaeftigt = true; zeige();
      const m = M.messreihe(phi), nr = Math.max(hoechste(fremdeLive()), hoechste(vor), hoechste(s.mw)) + 1, k1 = m['in'].k1 + m.out.k1, k2 = m['in'].k2 + m.out.k2;   // vorab gewürfelt, Wert erst nach der Animation
      let wechsel = 0, wahl = 'in';
      await M.hochzaehlen(0, 0, k1, k2, MS, (c1, c2, d) => {
        const t = Date.now(); if (t - wechsel > 70) { wahl = wahl === 'in' ? 'out' : 'in'; wechsel = t; }
        zeichne(c1, c2, { choice: wahl, d, src: d > 0, caption: 'entscheidet für jedes Photon' });
      });
      s.mw.push({ nr, phi, 'in': m['in'], out: m.out });
      beschaeftigt = false; zeichne(); zeige();
      M.melde(el);
    }

    /* Messreihen des anderen Schritts: live aus dessen Feld im Dokument (falls aufgebaut), sonst der zuletzt gelesene Speicherstand */
    function fremdeLive() {
      const andere = fremd ? Array.prototype.filter.call(el.ownerDocument.querySelectorAll('.fx-feld[data-fx-art="dcmessreihe"]'),
        (f) => f.getAttribute('data-fx-id') === fremd)[0] : null;
      if (andere && andere._dmWert) { try { return fuelle(FX.felder.arten.dcmessreihe.wert(andere)).mw; } catch (e) { /* Speicherstand nehmen */ } }
      return vor;
    }
    /* Messreihen aus Schritt 2 (Konfig vorher) bzw. Schritt 3 (nachher, nur für die Nummern) lesen und bei Änderung nachführen */
    function ladeVorher() {
      if (!fremd) return Promise.resolve();
      return M.lies(fremd).then((w) => { vor = fuelle(w).mw; bereit = true; zeichne(); zeige(); });
    }
    el.ownerDocument.addEventListener('fx:geaendert', (e) => { if (fremd && e.detail && e.detail.id === fremd) ladeVorher(); });

    el._dmWert = () => ({ modus: s.modus, mw: s.mw.map((m) => ({ nr: m.nr, phi: m.phi, 'in': Object.assign({}, m['in']), out: Object.assign({}, m.out) })) });
    el._dmLaden = (w) => {
      s = fuelle(w, k.modus); const l = s.mw[s.mw.length - 1]; phi = s3 && l ? l.phi : 0; if (regler) regler.setze(phi);
      zeichne(); zeige(); ladeVorher();
    };
    zeichne(); zeige(); ladeVorher();
  }

  FX.felder.registriere('dcmessreihe', {
    init: init,
    laden: (el, w) => { if (!el._dmLaden) init(el); el._dmLaden(w); },
    wert: (el) => { if (!el._dmWert) init(el); return el._dmWert(); },
    begonnen: (w) => fuelle(w).mw.length > 0,   // schon ab der ersten Messreihe: Hypothese festhalten
    /* leer() sieht nur den Wert, deshalb steht der Modus im Wert. s2: Messreihen bei 0°; s3: verschiedene Δφ ≠ 0° mit je S3_JE Reihen (0°-Reihen zählen dort nicht). */
    leer: (w) => {
      const f = fuelle(w), mw = f.mw;
      return f.modus === 's3' ? phasenS3(mw).filter((p) => p[1] >= M.EINST.S3_JE).length < M.EINST.S3_PHASEN
        : mw.filter((m) => m.phi === 0).length < M.EINST.S2_REIHEN;
    },
    protokoll: (el, w) => [{ typ: 'tabelle', kopf: KOPF, zeilen: [].concat.apply([], zeilenText(fuelle(w).mw)) }]
  });
})(typeof self !== 'undefined' ? self : this);
