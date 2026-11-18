/* Werkzeug „vorhersage“ (Kapitel 1, Hypothese zu Aufbau 1 bis 3): zwei Prozentwerte für Detektor 1 und 2.
   Plus/Minus-Knöpfe in 5er-Schritten (wie simulation.js), der zweite Wert ergänzt immer auf 100 %.
   Wert: {p1, p2} (Zahlen oder null). Gilt als Hypothese: wird nach der Messung festgehalten (schreibschutz). */
(function (root) {
  const FX = root.FX, M = FX.mzi, h = M.h;
  const SCHRITT = 5;

  const zahl = (x) => (typeof x === 'number' && isFinite(x) ? Math.max(0, Math.min(100, Math.round(x))) : null);
  const fuelle = (w) => {
    const p1 = zahl(w && w.p1), p2 = zahl(w && w.p2);
    return p1 !== null && p2 !== null ? { p1, p2 } : { p1: null, p2: null };
  };

  function init(el) {
    if (el._vhLaden) return;   // schon aufgebaut
    const flaeche = el.querySelector('.fx-werkzeug-flaeche');
    let s = { p1: null, p2: null }, fest = false;
    const eing = {}, minus = {}, plus = {};

    /* Wert des Detektors d setzen; der andere ergänzt auf 100 (null = Eingabe leer) */
    function setze(d, v) {
      const o = d === 1 ? 2 : 1;
      s['p' + d] = v; s['p' + o] = v === null ? null : 100 - v;
      zeige();
    }
    function zeige() {
      [1, 2].forEach((d) => { eing[d].value = s['p' + d] === null ? '' : s['p' + d]; });
    }
    function zeile(d) {
      eing[d] = h('input', { type: 'number', min: 0, max: 100, step: SCHRITT, inputmode: 'numeric', placeholder: '%', 'aria-label': 'Detektor ' + d + ' in Prozent' });
      eing[d].addEventListener('input', () => {
        if (fest) return;
        const roh = eing[d].value; setze(d, roh === '' || isNaN(Number(roh)) ? null : zahl(Number(roh)));
        if (roh !== '' && String(s['p' + d]) !== roh) eing[d].value = s['p' + d];   // auf 0–100 begrenzt zurückschreiben
      });
      const knopf = (delta, text, label) => {
        const b = h('button', { type: 'button', 'class': 'fx-knopf', 'data-d': delta, 'aria-label': label, onclick: () => {
          if (fest) return;
          setze(d, Math.max(0, Math.min(100, (s['p' + d] || 0) + delta))); M.melde(el);
        } }, text);
        return b;
      };
      minus[d] = knopf(-SCHRITT, '−', SCHRITT + ' % weniger'); plus[d] = knopf(SCHRITT, '+', SCHRITT + ' % mehr');
      return h('div', { 'class': 'mzi-pred-zeile', 'data-det': d }, h('span', { 'class': 'mzi-pred-name' }, 'Detektor ' + d),
        minus[d], eing[d], h('span', { 'class': 'mzi-pred-einheit' }, '%'), plus[d]);
    }
    flaeche.appendChild(h('div', { 'class': 'mzi-pred' }, zeile(1), zeile(2)));

    el._vhWert = () => ({ p1: s.p1, p2: s.p2 });
    el._vhLaden = (w) => { s = fuelle(w); zeige(); };
    el._vhSchutz = (an) => {
      fest = !!an;
      [1, 2].forEach((d) => { eing[d].readOnly = fest; minus[d].disabled = fest; plus[d].disabled = fest; });
    };
    zeige();
  }

  FX.felder.registriere('vorhersage', {
    hypothese: true,
    init: init,
    laden: (el, w) => { if (!el._vhLaden) init(el); el._vhLaden(w); },
    wert: (el) => { if (!el._vhWert) init(el); return el._vhWert(); },
    leer: (w) => !(w && typeof w.p1 === 'number' && typeof w.p2 === 'number' && w.p1 + w.p2 === 100),
    schreibschutz: (el, an) => { if (!el._vhSchutz) init(el); el._vhSchutz(an); },
    protokoll: (el, w) => [{ typ: 'text', text: 'Detektor 1: ' + (w && w.p1) + ' % · Detektor 2: ' + (w && w.p2) + ' %' }]
  });
})(typeof self !== 'undefined' ? self : this);
